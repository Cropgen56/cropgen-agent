import mongoose from "mongoose";

const farmerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  contact: { type: String, required: true },
});

export default mongoose.model("Farmer", farmerSchema);
