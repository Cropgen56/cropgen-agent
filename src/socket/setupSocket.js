import { Server } from "socket.io";
import { createAgentForUser } from "../agent/index.js";
import Organization from "../models/organizationModel.js";
import Farmer from "../models/farmerModel.js";
import Chathistory from "../models/UserChat.js";
import { validateOrganization } from "../validations/organizationValidation.js";
import { validateFarmer } from "../validations/farmerValidation.js";
import pkg from "google-libphonenumber";
const { PhoneNumberUtil } = pkg;

const phoneUtil = PhoneNumberUtil.getInstance();

// In-memory maps for tracking states and AI agents
const userAgents = new Map();
const userStates = new Map();
const userHistories = new Map();

const organizationQuestions = [
  "What is the name of your organization?",
  "What is the contact number of your organization?",
  "What is the email address of your organization?",
];

const farmerQuestions = [
  "What is your name?",
  "What is your contact number?",
];

const createEmptyState = () => ({
  type: null,       
  step: 0,          
  data: {},      
  questions: [],    
  history: [],      
  userObject: null, 
});

// Setup Socket.io server
export const setupSocket = (httpServer) => {
  const io = new Server(httpServer, {
    path: "/v3/socket.io",
    cors: { origin: "*" },
  });

  io.on("connection", (socket) => {
    const userId = socket.id;
    userStates.set(userId, createEmptyState());
    userAgents.set(userId, createAgentForUser(userId));
    userHistories.set(userId, []);

    // Function to record message in memory and DB
    const recordMessage = async (sender, text) => {
      const state = userStates.get(userId);
      if (!state) return;

      const msgObj = { sender, text, ts: new Date() };
      state.history.push(msgObj);

      try {
        if (state.userObject && state.userType) {
          // Save + return populated user object
          const chat = await Chathistory.findOneAndUpdate(
            { user: state.userObject._id },
            {
              $push: { messages: msgObj },
              $set: { userType: state.userType, updatedAt: new Date() },
            },
            { upsert: true, new: true }
          ).populate("user"); // 
          return chat; // return with full user object
        }
      } catch (err) {
        console.error("Failed to save chat:", err);
      }
    };


    // Initial welcome message
    socket.emit(
      "ai_response",
      "Welcome! To help you better, could you tell me who you are? "
    );
    recordMessage("ai", "Welcome! To help you better, could you tell me who you are?");

    // Handle user messages
    socket.on("user_message", async (msg) => {
      const state = userStates.get(userId) || createEmptyState();
      const cleanedMsg = (msg || "").toString().trim();
      recordMessage("user", cleanedMsg);

      // Step 1: Role selection
      if (state.type === null) {
        let reply;
        switch (cleanedMsg) {
          case "1":
            state.type = "organization";
            state.userType = "Organization";
            state.questions = organizationQuestions;
            reply = state.questions[0];
            break;
          case "2":
            state.type = "farmer";
            state.userType = "Farmer";
            state.questions = farmerQuestions;
            reply = state.questions[0];
            break;
          case "3":
            state.type = "general";
            reply =
              "Cropgen is a satellite-based crop monitoring platform that helps farmers and organizations optimize agricultural outcomes. How can I assist you further?";
            break;
          default:
            reply = "Invalid choice. Please reply with 1, 2, or 3.";
        }
        socket.emit("ai_response", reply);
        recordMessage("ai", reply);
        userStates.set(userId, state);
        return;
      }

      // Step 2: Collect user details (Farmer/Organization)
      if (["organization", "farmer"].includes(state.type)) {
        const step = state.step;
        const fields =
          state.type === "organization"
            ? ["name", "contact", "email"]
            : ["name", "contact"];
        const field = fields[step];

        let value = cleanedMsg;
        let errorMsg = null;

        // Basic validation
        if (field === "name") {
          if (value.length < 3) errorMsg = "Please enter a valid name with at least 3 characters.";
        } else if (field === "contact") {
          try {
            const number = phoneUtil.parse(value);
            if (!phoneUtil.isValidNumber(number)) errorMsg = "Please enter a valid phone number with country code.";
          } catch (err) {
            errorMsg = "Invalid phone number format. Please include country code.";
          }
        } else if (field === "email") {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(value)) errorMsg = "Please enter a valid email address.";
        }

        if (errorMsg) {
          socket.emit("ai_response", errorMsg);
          recordMessage("ai", errorMsg);
          socket.emit("ai_response", state.questions[step]);
          recordMessage("ai", state.questions[step]);
          return;
        }

        // Save input
        state.data[field] = value;
        state.step++;

        if (state.step < state.questions.length) {
          const reply = state.questions[state.step];
          socket.emit("ai_response", reply);
          recordMessage("ai", reply);
        } else {
          // Validation & Save to DB
          const validation =
            state.type === "organization"
              ? validateOrganization(state.data)
              : validateFarmer(state.data);

          if (validation.error) {
            const errorMsg =
              validation.error.details?.[0]?.message || "Invalid input";
            socket.emit("ai_response", `Invalid input: ${errorMsg}`);
            recordMessage("ai", `Invalid input: ${errorMsg}`);
            state.step = 0;
            state.data = {};
            socket.emit("ai_response", state.questions[0]);
            recordMessage("ai", state.questions[0]);
          } else {
            try {
              let savedUser;
              if (state.type === "organization") {
                savedUser = await new Organization(state.data).save();
              } else {
                savedUser = await new Farmer(state.data).save();
              }

              state.userObject = savedUser; // store ObjectId
              recordMessage("ai", `${state.type} details saved successfully.`);

              socket.emit("ai_response", `${state.type.charAt(0).toUpperCase() + state.type.slice(1)} details saved successfully.`);
              socket.emit("ai_response", "How can I assist you further?");

              // Reset state for general conversation
              state.type = "general";
              state.step = 0;
              state.data = {};
            } catch (err) {
              console.error("DB save error:", err);
              socket.emit("ai_response", "Server error while saving data.");
              recordMessage("ai", "Server error while saving data.");
            }
          }
        }

        userStates.set(userId, state);
        return;
      }

      // Step 3: General conversation
      if (state.type === "general") {
        const ai = userAgents.get(userId);
        try {
          const res = await ai.call({ input: msg });
          const reply = res && res.response ? res.response : "Sorry, I didn't understand that.";
          socket.emit("ai_response", reply);
          recordMessage("ai", reply);
        } catch (err) {
          console.error("AI call error:", err);
          socket.emit("ai_response", "AI error occurred.");
          recordMessage("ai", "AI error occurred.");
        }
        return;
      }
    });

    // Reset conversation
    socket.on("reset_conversation", () => {
      const state = userStates.get(userId);
      if (state && state.history.length > 0) {
        const histories = userHistories.get(userId) || [];
        histories.push(state.history);
        userHistories.set(userId, histories);
      }
      userStates.set(userId, createEmptyState());
      socket.emit("ai_response", "Conversation reset. Let's start fresh!");
      recordMessage("ai", "Conversation reset. Let's start fresh!");
    });

    // Get chat history (frontend)
    socket.on("get_history", async () => {
      const state = userStates.get(userId);
      let chatHistory = [];

      try {
        if (state?.userObject) {
          const chat = await Chathistory.findOne({ user: state.userObject._id }).populate("user");
          if (chat) chatHistory = chat.messages;
        }
      } catch (err) {
        console.error("Error fetching chat history:", err);
      }

      socket.emit("chat_history", { conversations: chatHistory });
    });

    // Disconnect
    socket.on("disconnect", () => {
      userAgents.delete(userId);
      userStates.delete(userId);
      userHistories.delete(userId);
      console.log(`User disconnected: ${userId}`);
    });
  });
};
