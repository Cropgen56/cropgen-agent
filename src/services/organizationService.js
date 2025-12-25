import Organization from "../models/organizationModel.js";
import Chathistory from "../models/UserChat.js";

class OrganizationService {
  // Get all organizations
  async getAllOrganizations() {
    const organizations = await Organization.find().sort({ createdAt: -1 });
    return organizations;
  }

  // Get organization by ID
  async getOrganizationById(id) {
    const organization = await Organization.findById(id);
    return organization;
  }

  // Create a new organization
  async createOrganization(orgData) {
    const organization = new Organization(orgData);
    const savedOrg = await organization.save();
    return savedOrg;
  }

  // Delete organization by ID
  async deleteOrganizationById(id) {
    const organization = await Organization.findByIdAndDelete(id);
    return organization;
  }

  // Delete organization and associated chat
  async deleteOrganizationWithChat(id) {
    const organization = await Organization.findByIdAndDelete(id);
    if (organization) {
      await Chathistory.findOneAndDelete({ user: id, userType: "Organization" });
    }
    return organization;
  }
}

export default new OrganizationService();