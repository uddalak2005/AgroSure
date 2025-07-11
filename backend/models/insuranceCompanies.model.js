import mongoose from "mongoose";

const insuranceCompanySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  uinPrefix: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true
  },
  phone: {
    type: String
  },
  address: {
    street: String,
    city: String,
    state: String,
    pincode: String
  },
  website: {
    type: String
  },
  supportedCrops: [String], // e.g. ["Wheat", "Rice"]
  claimProcessingTimeInDays: {
    type: Number,
    default: 15
  },
  active: {
    type: Boolean,
    default: true
  },
  notes: {
    type: String
  }
}, {
  timestamps: true
});

const InsuranceCompany = mongoose.model("InsuranceCompany", insuranceCompanySchema);
export default InsuranceCompany;