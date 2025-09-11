// src/socket/setupSocket.js
import { Server } from "socket.io";
import { createAgentForUser } from "../agent/index.js";
import Organization from "../models/organizationModel.js";
import Farmer from "../models/farmerModel.js";
import { validateOrganization } from "../validations/organizationValidation.js";
import { validateFarmer } from "../validations/farmerValidation.js";

/**
 * Note: createAgentForUser, Organization, Farmer, and validation modules
 * are referenced from your existing codebase. Keep their imports as-is.
 */

const userAgents = new Map();
const userStates = new Map();

const organizationQuestions = [
  "What is the name of your organization?",
  "What is the contact number of your organization?",
  "What is the email address of your organization?",
];

const farmerQuestions = [
  "What is your name?",
  "What is your contact number?",
];

export const setupSocket = (httpServer) => {
  const io = new Server(httpServer, {
    // Important: matches Nginx /v3/ proxy
    path: "/v3/socket.io",
    // Allow CORS from your frontend origin(s) if needed; using '*' here keeps it permissive
    cors: { origin: "*" },
    // other options can be added if needed
  });

  io.on("connection", (socket) => {
    const userId = socket.id;
    userStates.set(userId, { type: null, step: 0, data: {}, questions: [] });
    userAgents.set(userId, createAgentForUser(userId));

    // Welcome
    socket.emit(
      "ai_response",
      "Welcome! To help you better, could you tell me who you are?"
    );

    socket.on("user_message", async (msg) => {
      const state = userStates.get(userId) || {
        type: null,
        step: 0,
        data: {},
        questions: [],
      };
      const cleanedMsg = (msg || "").toString().trim();

      // initial type selection
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
        userStates.set(userId, state);
        return;
      }

      // organization / farmer flow
      if (["organization", "farmer"].includes(state.type)) {
        const step = state.step;
        const fields =
          state.type === "organization"
            ? ["name", "contact", "email"]
            : ["name", "contact"];
        const field = fields[step];

        let value = cleanedMsg;

        // Field-level validation
        let errorMsg = null;
        if (field === "name") {
          if (value.length < 3) {
            errorMsg =
              "Please enter a valid name with at least 3 characters.";
          }
        } else if (field === "contact") {
          value = value.replace(/\D/g, "");
          if (value.length !== 10) {
            errorMsg =
              "Please enter a valid 10-digit mobile number";
          } else {
            value = `+91${value}`;
          }
        } else if (field === "email") {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(value)) {
            errorMsg = "Please enter a valid email address.";
          }
        }

        if (errorMsg) {
          socket.emit("ai_response", errorMsg);
          // repeat same question without moving to next step
          socket.emit("ai_response", state.questions[step]);
          return;
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
            const errorMsg =
              validation.error.details?.[0]?.message || "Invalid input";
            socket.emit("ai_response", `Invalid input: ${errorMsg}`);
            // restart the flow
            state.step = 0;
            state.data = {};
            socket.emit("ai_response", state.questions[0]);
          } else {
            try {
              if (state.type === "organization") {
                await new Organization(state.data).save();
                socket.emit(
                  "ai_response",
                  "Organization details saved successfully."
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
              console.error("DB save error:", err);
              socket.emit("ai_response", "Server error while saving data.");
            }
          }
        }
        userStates.set(userId, state);
        return;
      }

      // general conversation flow
      if (state.type === "general") {
        const ai = userAgents.get(userId);
        try {
          // ai.call should return an object with .response or similar
          const res = await ai.call({ input: msg });
          const reply =
            res && res.response
              ? res.response
              : "Sorry, I didn't understand that.";
          socket.emit("ai_response", reply);
        } catch (err) {
          console.error("AI call error:", err);
          socket.emit("ai_response", "AI error occurred.");
        }
        return;
      }
    });

    socket.on("disconnect", () => {
      userAgents.delete(userId);
      userStates.delete(userId);
      console.log(`User disconnected: ${userId}`);
    });
  });
};

