import express from "express";
import chatController from "../controllers/chatController.js";

const router = express.Router();

// Get chat for a specific user (Farmer/Organization)
router.get("/chat-of/:userType/:userId", chatController.getChatByUser);

// Get all farmers
router.get("/farmers/all", chatController.getAllFarmers);

// Get all organizations
router.get("/organizations/all", chatController.getAllOrganizations);


router.delete("/chat-of/:userType/:userId", chatController.deleteChatByUser);

router.delete("/farmer/:id", chatController.deleteFarmer);

router.delete("/organization/:id", chatController.deleteOrganization);

export default router;