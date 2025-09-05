import express from "express";
import http from "http";
import dotenv from "dotenv";
import { setupSocket } from "./src/socket/setupSocket.js";
import mongoose from "mongoose";
import path from "path";

dotenv.config();

const app = express();
const server = http.createServer(app);

// ---------- MongoDB (unchanged) ----------
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// ---------- EJS view engine (ADDED) ----------
const __dirname = path.resolve();
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

// (optional) serve static files from ./public if you want css/images used by template
app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
  res.send("Hello World! Go to /agent to see the dashboard.");
});

// ---------- Route to render EJS (ADDED) ----------
app.get("/agent", (req, res) => {
  // keep this minimal — only data required by the view
  res.render("agent", {
    title: "Agent Dashboard",
    user: { name: "Agent", role: "agent" },
  });
});

// ---------- existing socket setup & server start (unchanged) ----------
setupSocket(server);

server.listen(3002, () => {
  console.log("Server running on http://localhost:3002");
});
