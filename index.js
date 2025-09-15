// server.js
import express from "express";
import http from "http";
import dotenv from "dotenv";
import mongoose from "mongoose";
import path from "path";
import { fileURLToPath } from "url";
import { setupSocket } from "./src/socket/setupSocket.js";
import chatroute from "./src/routes/chatroute.js"
import cors from "cors";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
app.use(express.json());

app.use(
  cors({
    origin: "https://admin.cropgenapp.com", // allow your Vite frontend
    methods: ["GET", "POST", "DELETE", "PUT"],
    credentials: true,
  })
);


// ---------- MongoDB ----------
console.log("MONGO_URI:", process.env.MONGO_URI);

mongoose
  .connect(process.env.MONGO_URI, {
    family: 4
  })
  .then(() => console.log("MongoDB connected"))
  .catch((err) => {
    console.error("MongoDB connection error:", err);
    process.exit(1);
  });

// ---------- View engine & static ----------
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, "public")));


app.use("/api/chats", chatroute);

// Health / root
app.get("/", (req, res) => {
  res.send("Hello World! Go to /v3/agent to see the dashboard.");
});

// Render agent view under /v3/agent
app.get("/v3/agent", (req, res) => {
  res.render("agent", {
    title: "Agent Dashboard",
    user: { name: "Agent", role: "agent" },
  });
});

// ---------- Socket setup ----------
setupSocket(server);

// ---------- Start server ----------
const PORT = process.env.PORT || 3002;
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

