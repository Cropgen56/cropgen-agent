import { Server } from "socket.io";
import { createAgentForUser } from "../agent/index.js";
import Organization from "../models/organizationModel.js";
import Farmer from "../models/farmerModel.js";
import { validateOrganization } from "../validations/organizationValidation.js";
import { validateFarmer } from "../validations/farmerValidation.js";

const userAgents = new Map();
const userStates = new Map();

const organizationQuestions = [
  "What is the name of your organization?",
  "What is the contact number of your organization? (Include 10 digits, country code will be added automatically)",
  "What is the email address of your organization?",
];

const farmerQuestions = [
  "What is your name?",
  "What is your contact number? (Include 10 digits, country code will be added automatically)",
];

export const setupSocket = (httpServer) => {
  const io = new Server(httpServer, {
    cors: { origin: "*" },
  });

  io.on("connection", (socket) => {
    const userId = socket.id;
    userStates.set(userId, { type: null, step: 0, data: {}, questions: [] });
    userAgents.set(userId, createAgentForUser(userId));

    socket.emit(
      "ai_response",
      "Welcome! Are you: 1) an organization, 2) a farmer, or 3) here to know about Cropgen? Please reply with 1, 2, or 3."
    );

    socket.on("user_message", async (msg) => {
      const state = userStates.get(userId);
      const cleanedMsg = msg.trim();

      if (state.type === null) {
        switch (cleanedMsg) {
          case "1":
            state.type = "organization";
            state.questions = organizationQuestions;
            socket.emit("ai_response", state.questions[0]);
            break;
          case "2":
            state.type = "farmer";
            state.questions = farmerQuestions;
            socket.emit("ai_response", state.questions[0]);
            break;
          case "3":
            state.type = "general";
            socket.emit(
              "ai_response",
              "Cropgen is a satellite-based crop monitoring platform that helps farmers and organizations optimize agricultural outcomes. How can I assist you further?"
            );
            break;
          default:
            socket.emit(
              "ai_response",
              "Invalid choice. Please reply with 1, 2, or 3."
            );
        }
        return;
      }

      if (["organization", "farmer"].includes(state.type)) {
        const step = state.step;
        const fields =
          state.type === "organization"
            ? ["name", "contact", "email"]
            : ["name", "contact"];
        const field = fields[step];

        // Format contact field
        let value = cleanedMsg;
        if (field === "contact") {
          value = value.replace(/\D/g, "");
          if (value.length === 10) {
            value = `+91${value}`;
          }
        }

        state.data[field] = value;
        state.step++;

        if (state.step < state.questions.length) {
          socket.emit("ai_response", state.questions[state.step]);
        } else {
          // Validate & Save
          const validation =
            state.type === "organization"
              ? validateOrganization(state.data)
              : validateFarmer(state.data);

          if (validation.error) {
            const errorMsg = validation.error.details[0].message;
            socket.emit("ai_response", `Invalid input: ${errorMsg}`);
            state.step = 0;
            state.data = {};
            socket.emit("ai_response", state.questions[0]);
          } else {
            try {
              if (state.type === "organization") {
                await new Organization(state.data).save();
                socket.emit(
                  "ai_response",
                  " Organization details saved successfully."
                );
              } else {
                await new Farmer(state.data).save();
                socket.emit(
                  "ai_response",
                  "Farmer details saved successfully."
                );
              }
              socket.emit("ai_response", "How can I assist you further?");
              state.type = "general";
              state.step = 0;
              state.data = {};
            } catch (err) {
              socket.emit("ai_response", " Server error while saving data.");
            }
          }
        }
        return;
      }

      if (state.type === "general") {
        const ai = userAgents.get(userId);
        try {
          const res = await ai.call({ input: msg });
          socket.emit(
            "ai_response",
            res?.response || " Sorry, I didn't understand that."
          );
        } catch (err) {
          socket.emit("ai_response", " AI error occurred.");
        }
      }
    });

    socket.on("disconnect", () => {
      userAgents.delete(userId);
      userStates.delete(userId);
      console.log(`User disconnected: ${userId}`);
    });
  });
};
