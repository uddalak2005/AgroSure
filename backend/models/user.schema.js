import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
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
        required : true
    },
    createdAt: { type: Date, default: Date.now },
});

const User = mongoose.model('User', userSchema);
export default User;