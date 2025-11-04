import chatService from "../services/chatService.js";

class ChatController {
  // Get chat for a specific user
  async getChatByUser(req, res) {
    try {
      const { userType, userId } = req.params;
      const result = await chatService.getChatByUser(userType, userId);
      
      if (result.error) {
        return res.status(result.status).json({ message: result.message });
      }
      
      res.json(result.data);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  // Get all farmers
  async getAllFarmers(req, res) {
    try {
      const farmers = await chatService.getAllFarmers();
      res.json(farmers);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  // Get all organizations
  async getAllOrganizations(req, res) {
    try {
      const organizations = await chatService.getAllOrganizations();
      res.json(organizations);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  // Delete a specific chat
  async deleteChatByUser(req, res) {
    try {
      const { userType, userId } = req.params;
      const result = await chatService.deleteChatByUser(userType, userId);
      
      if (result.error) {
        return res.status(result.status).json({ message: result.message });
      }
      
      res.json({ message: result.message, deletedChat: result.data });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  // Delete a farmer by ID
  async deleteFarmer(req, res) {
    try {
      const { id } = req.params;
      const result = await chatService.deleteFarmer(id);
      
      if (result.error) {
        return res.status(result.status).json({ message: result.message });
      }
      
      res.json({ message: result.message });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  // Delete an organization by ID
  async deleteOrganization(req, res) {
    try {
      const { id } = req.params;
      const result = await chatService.deleteOrganization(id);
      
      if (result.error) {
        return res.status(result.status).json({ message: result.message });
      }
      
      res.json({ message: result.message });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
}

export default new ChatController();