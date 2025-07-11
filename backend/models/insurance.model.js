import mongoose from "mongoose";

const insuranceSchema = new mongoose.Schema({
    uid: {
        type: String,
        required: true,
        ref: "User"
    },
    name: String,
    location: {
        lat: Number,
        long: Number
    },
    provider: {
        type: String,
        required: true
    },
    uin: {
        type: String,
        required: true
    },
    policyNumber: {
        type: String,
        required: true
    },

    claimStatus: {
        type: String,
        enum: ['instantiated', 'submitted'],
        default: 'instantiated'
    },
    policyDoc: {
        fileurl: String,
        publicId: {
            type: String,
        },
        originalName: String,
        fileType: String,
        fieldName: String,
        fraudFlag: Boolean,
        createdAt: {
            type: Date, default:
                Date.now
        }
    },
    damageImage: {
        fileurl: String,
        publicId: {
            type: String,
            required: true
        },
        originalName: String,
        fileType: String,
        fieldName: String,
        fraudFlag: Boolean,
        createdAt: {
            type: Date, default:
                Date.now
        }
    },
    cropImage: {
        fileurl: String,
        publicId: {
            type: String,
            required: true
        },
        originalName: String,
        fileType: String,
        fieldName: String,
        fraudFlag: Boolean,
        createdAt: {
            type: Date, default:
                Date.now
        }
    },
    fieldImage: {
        fileurl: String,
        publicId: {
            type: String,
            required: true
        },
        originalName: String,
        fileType: String,
        fieldName: String,
        fraudFlag: Boolean,
        createdAt: {
            type: Date, default:
                Date.now
        }
    }

}, {
    timestamps: true
});

const Insurance = mongoose.model("Insurance", insuranceSchema);
export default Insurance;