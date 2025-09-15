import express from "express";
import Chathistory from "../models/UserChat.js";
import Farmer from "../models/farmerModel.js";
import Organization from "../models/organizationModel.js";

const router = express.Router();

// Get chat for a specific user (Farmer/Organization)
router.get("/chat-of/:userType/:userId", async (req, res) => {
  try {
    const { userType, userId } = req.params;

    // Look for existing chat
    let chat = await Chathistory.findOne({ user: userId, userType }).populate("user");

    // If no chat exists, create an empty one
    if (!chat) {
      const model = userType === "Farmer" ? await Farmer.findById(userId) : await Organization.findById(userId);
      if (!model) return res.status(404).json({ message: "User not found" });

      // chat = await Chathistory.create({ user: userId, userType, messages: [] });
      // chat.user = model; // attach the user object for frontend display
    }

    res.json(chat);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get all farmers
router.get("/farmers/all", async (req, res) => {
  try {
    const farmers = await Farmer.find().sort({ createdAt: -1 });
    res.json(farmers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get all organizations
router.get("/organizations/all", async (req, res) => {
  try {
    const orgs = await Organization.find().sort({ createdAt: -1 });
    res.json(orgs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete a specific chat by user type and userId
router.delete("/chat-of/:userType/:userId", async (req, res) => {
  try {
    const { userType, userId } = req.params;

    const deletedChat = await Chathistory.findOneAndDelete({ user: userId, userType });

    if (!deletedChat) return res.status(404).json({ message: "Chat not found" });

    res.json({ message: "Chat deleted successfully", deletedChat });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete a farmer by ID (also delete their chat)
router.delete("/farmer/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const farmer = await Farmer.findByIdAndDelete(id);
    if (!farmer) return res.status(404).json({ message: "Farmer not found" });

    // Delete associated chat if exists
    await Chathistory.findOneAndDelete({ user: id, userType: "Farmer" });

    res.json({ message: "Farmer and their chat deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete an organization by ID (also delete their chat)
router.delete("/organization/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const org = await Organization.findByIdAndDelete(id);
    if (!org) return res.status(404).json({ message: "Organization not found" });

    // Delete associated chat if exists
    await Chathistory.findOneAndDelete({ user: id, userType: "Organization" });

    res.json({ message: "Organization and their chat deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});


export default router;
