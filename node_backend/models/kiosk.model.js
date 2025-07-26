import mongoose from "mongoose";

const kioskSchema = new mongoose.Schema({
    uid: {
        type: String,
        unique: true
    },
    name: String,
    email: {type: String},
    phone: {type: String},
    farmers: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }
    ],
    location: {
        address: String,
        lat: {type: Number},
        long: {type: Number}
    },
    createdAt: {type: Date, default: Date.now},
})

const Kiosk = mongoose.model('Kiosk', kioskSchema);
export default Kiosk;