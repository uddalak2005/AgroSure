import mongoose from "mongoose";

const userModel = new mongoose.Schema({
    uid: {
        type: String,
        unique: true
    },
    name: String,
    email: { type: String },
    phone: { type: String },
    totalLand : Number,
    crops : [{
        type : String
    }],
    isSmallFarmer: { type: Boolean, required: true },
    location: {
        lat: { type: Number, required: true },
        long: { type: Number, required: true }
    },
    aadhar : {
        type : Number,
    },
    createdAt: { type: Date, default: Date.now },
});

const User = mongoose.model('User', userModel);
export default User;