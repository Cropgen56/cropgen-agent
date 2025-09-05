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
mongoose.connect("mongodb://localhost:27017/cropgen_ai", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// ---------- EJS view engine (ADDED) ----------
const __dirname = path.resolve();
app.set("views", path.join(__dirname, "views")); // ensure folder ./views exists
app.set("view engine", "ejs");

// (optional) serve static files from ./public if you want css/images used by template
app.use(express.static(path.join(__dirname, "public")));

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

server.listen(3001, () => {
  console.log("Server running on http://localhost:3001");
});
