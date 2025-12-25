import express from "express";
import chatController from "../controllers/chatController.js";
import farmerController from "../controllers/farmerController.js";
import organizationController from "../controllers/organizationController.js";

const router = express.Router();

// Chat routes
router.get("/chat-of/:userType/:userId", chatController.getChatOfUser);
router.delete("/chat-of/:userType/:userId", chatController.deleteChatOfUser);

// Farmer routes
router.get("/farmers/all", farmerController.getAllFarmers);
router.get("/farmer/:id", farmerController.getFarmerById);
router.delete("/farmer/:id", farmerController.deleteFarmer);

// Organization routes
router.get("/organizations/all", organizationController.getAllOrganizations);
router.get("/organization/:id", organizationController.getOrganizationById);
router.delete("/organization/:id", organizationController.deleteOrganization);

export default router;