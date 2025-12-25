import Chathistory from "../models/UserChat.js";
import Farmer from "../models/farmerModel.js";
import Organization from "../models/organizationModel.js";

class ChatService {
  // Get chat by user ID and type
  async getChatByUser(userId, userType) {
    const chat = await Chathistory.findOne({ user: userId, userType }).populate("user");
    return chat;
  }

  // Check if user exists based on type
  async getUserModel(userId, userType) {
    if (userType === "Farmer") {
      return await Farmer.findById(userId);
    } else if (userType === "Organization") {
      return await Organization.findById(userId);
    }
    return null;
  }

  // Create a new chat
  async createChat(userId, userType, messages = []) {
    const chat = await Chathistory.create({
      user: userId,
      userType,
      messages,
    });
    return chat;
  }

  // Delete chat by user ID and type
  async deleteChatByUser(userId, userType) {
    const deletedChat = await Chathistory.findOneAndDelete({
      user: userId,
      userType,
    });
    return deletedChat;
  }

  // Add message to chat
  async addMessage(userId, userType, messageObj) {
    const chat = await Chathistory.findOneAndUpdate(
      { user: userId },
      {
        $push: { messages: messageObj },
        $set: { userType, updatedAt: new Date() },
      },
      { upsert: true, new: true }
    ).populate("user");
    return chat;
  }

  // Get chat history by user object ID
  async getChatHistoryByUserId(userObjectId) {
    const chat = await Chathistory.findOne({ user: userObjectId }).populate("user");
    return chat;
  }
}

export default new ChatService();