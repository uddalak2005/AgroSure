import mongoose from "mongoose";

const bankSchema = new mongoose.Schema({
  name: { type: String, required: true },
  branchCode: { type: String, required: true, unique: true },
  email: { type: String, required: true, lowercase: true },
  phone: { type: String, default: "" },
  address: { type: String, default: "" },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      required: true,
      default: 'Point'
    },
    coordinates: {
      type: [Number], // [lng, lat]
      required: true
    }
  }
}, { timestamps: true });

bankSchema.index({ location: "2dsphere" });

const Bank = mongoose.model("Bank", bankSchema);
export default Bank;