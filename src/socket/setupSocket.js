import { Server } from "socket.io";
import socketService from "../services/socketService.js";

// Setup Socket.io server
export const setupSocket = (httpServer) => {
  const io = new Server(httpServer, {
    path: "/v3/socket.io",
    cors: { origin: "*" },
  });

  io.on("connection", (socket) => {
    const userId = socket.id;

    // Initialize user session
    socketService.initializeUser(userId);

    // Initial welcome message
    const welcomeMsg = "Welcome! To help you better, could you tell me who you are?";
    socket.emit("ai_response", welcomeMsg);
    socketService.recordMessage(userId, "ai", welcomeMsg);

    // Handle user messages
    socket.on("user_message", async (msg) => {
      const state = socketService.getUserState(userId);
      const cleanedMsg = (msg || "").toString().trim();
      socketService.recordMessage(userId, "user", cleanedMsg);

      // Step 1: Role selection
      if (state.type === null) {
        const result = socketService.handleRoleSelection(cleanedMsg, state);
        socket.emit("ai_response", result.reply);
        socketService.recordMessage(userId, "ai", result.reply);
        socketService.setUserState(userId, result.state);
        return;
      }

      // Step 2: Collect user details (Farmer/Organization)
      if (["organization", "farmer"].includes(state.type)) {
        const step = state.step;
        const fields = socketService.getFieldsForType(state.type);
        const field = fields[step];

        // Validate input
        const errorMsg = socketService.validateField(field, cleanedMsg);

        if (errorMsg) {
          socket.emit("ai_response", errorMsg);
          socketService.recordMessage(userId, "ai", errorMsg);
          socket.emit("ai_response", state.questions[step]);
          socketService.recordMessage(userId, "ai", state.questions[step]);
          return;
        }

        // Save input
        state.data[field] = cleanedMsg;
        state.step++;

        if (state.step < state.questions.length) {
          const reply = state.questions[state.step];
          socket.emit("ai_response", reply);
          socketService.recordMessage(userId, "ai", reply);
        } else {
          // Validation & Save to DB
          const validation = socketService.validateUserData(state.type, state.data);

          if (validation.error) {
            const validationError =
              validation.error.details?.[0]?.message || "Invalid input";
            socket.emit("ai_response", `Invalid input: ${validationError}`);
            socketService.recordMessage(userId, "ai", `Invalid input: ${validationError}`);
            state.step = 0;
            state.data = {};
            socket.emit("ai_response", state.questions[0]);
            socketService.recordMessage(userId, "ai", state.questions[0]);
          } else {
            try {
              const savedUser = await socketService.saveUser(state.type, state.data);

              state.userObject = savedUser;
              socketService.recordMessage(userId, "ai", `${state.type} details saved successfully.`);
              socket.emit("ai_response", "How can I assist you further?");

              // Reset state for general conversation
              state.type = "general";
              state.step = 0;
              state.data = {};
            } catch (err) {
              console.error("DB save error:", err);
              socket.emit("ai_response", "Server error while saving data.");
              socketService.recordMessage(userId, "ai", "Server error while saving data.");
            }
          }
        }

        socketService.setUserState(userId, state);
        return;
      }

      // Step 3: General conversation
      if (state.type === "general") {
        const reply = await socketService.handleAIConversation(userId, msg);
        socket.emit("ai_response", reply);
        socketService.recordMessage(userId, "ai", reply);
        return;
      }
    });

    // Reset conversation
    socket.on("reset_conversation", () => {
      socketService.resetConversation(userId);
      const resetMsg = "Conversation reset. Let's start fresh!";
      socket.emit("ai_response", resetMsg);
      socketService.recordMessage(userId, "ai", resetMsg);
    });

    // Get chat history (frontend)
    socket.on("get_history", async () => {
      const chatHistory = await socketService.getChatHistory(userId);
      socket.emit("chat_history", { conversations: chatHistory });
    });

    // Disconnect
    socket.on("disconnect", () => {
      socketService.cleanupUser(userId);
      console.log(`User disconnected: ${userId}`);
    });
  });
};