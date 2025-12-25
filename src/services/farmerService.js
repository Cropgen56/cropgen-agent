import Farmer from "../models/farmerModel.js";
import Chathistory from "../models/UserChat.js";

class FarmerService {
  // Get all farmers
  async getAllFarmers() {
    const farmers = await Farmer.find().sort({ createdAt: -1 });
    return farmers;
  }

  // Get farmer by ID
  async getFarmerById(id) {
    const farmer = await Farmer.findById(id);
    return farmer;
  }

  // Create a new farmer
  async createFarmer(farmerData) {
    const farmer = new Farmer(farmerData);
    const savedFarmer = await farmer.save();
    return savedFarmer;
  }

  // Delete farmer by ID
  async deleteFarmerById(id) {
    const farmer = await Farmer.findByIdAndDelete(id);
    return farmer;
  }

  // Delete farmer and associated chat
  async deleteFarmerWithChat(id) {
    const farmer = await Farmer.findByIdAndDelete(id);
    if (farmer) {
      await Chathistory.findOneAndDelete({ user: id, userType: "Farmer" });
    }
    return farmer;
  }
}

export default new FarmerService();