import Chathistory from "../models/UserChat.js";
import Farmer from "../models/farmerModel.js";
import Organization from "../models/organizationModel.js";

class ChatService {
  // Get chat for a specific user
  async getChatByUser(userType, userId) {
    try {
      let chat = await Chathistory.findOne({ user: userId, userType }).populate("user");
      
      if (!chat) {
        const model = userType === "Farmer" 
          ? await Farmer.findById(userId) 
          : await Organization.findById(userId);
          
        if (!model) {
          return { error: true, status: 404, message: "User not found" };
        }
      }
      
      return { error: false, data: chat };
    } catch (error) {
      throw error;
    }
  }

  // Get all farmers
  async getAllFarmers() {
    try {
      const farmers = await Farmer.find().sort({ createdAt: -1 });
      return farmers;
    } catch (error) {
      throw error;
    }
  }

  // Get all organizations
  async getAllOrganizations() {
    try {
      const organizations = await Organization.find().sort({ createdAt: -1 });
      return organizations;
    } catch (error) {
      throw error;
    }
  }

  // Delete a specific chat
  async deleteChatByUser(userType, userId) {
    try {
      const deletedChat = await Chathistory.findOneAndDelete({ 
        user: userId, 
        userType 
      });

      if (!deletedChat) {
        return { error: true, status: 404, message: "Chat not found" };
      }

      return { 
        error: false, 
        message: "Chat deleted successfully", 
        data: deletedChat 
      };
    } catch (error) {
      throw error;
    }
  }

  // Delete a farmer and their chat
  async deleteFarmer(farmerId) {
    try {
      const farmer = await Farmer.findByIdAndDelete(farmerId);
      
      if (!farmer) {
        return { error: true, status: 404, message: "Farmer not found" };
      }
      
      await Chathistory.findOneAndDelete({ 
        user: farmerId, 
        userType: "Farmer" 
      });
      
      return { 
        error: false, 
        message: "Farmer and their chat deleted successfully" 
      };
    } catch (error) {
      throw error;
    }
  }

  // Delete an organization and their chat
  async deleteOrganization(organizationId) {
    try {
      const org = await Organization.findByIdAndDelete(organizationId);

      if (!org) {
        return { error: true, status: 404, message: "Organization not found" };
      }
      
      await Chathistory.findOneAndDelete({ 
        user: organizationId, 
        userType: "Organization" 
      });
      
      return { 
        error: false, 
        message: "Organization and their chat deleted successfully" 
      };
    } catch (error) {
      throw error;
    }
  }
}

export default new ChatService();