import mongoose from "mongoose";

const cropSchema = new mongoose.Schema({
    uid: {
        type: String,
        ref: 'user'
    },
    acresOfLand: {
        type: String,
        required: true
    },
    cropName: {
        type: String,
        required: true
    },
    plantingDate: String,
    expectedHarvestDate: String,
    soilType: String,
    irrigationMethod: String,
    additionalNotes: String,
    predictedYieldKgPerAcre: Number,
    yieldCategory: String,
    soilHealthScore: Number,
    soilHealthCategory: String,
    climateScore: Number,
    location: {
        lat: { type: Number, required: true },
        long: { type: Number, required: true }
    },
    suggestedCrops: [{
        cropName: String,
        predictedYieldKgPerHa: Number
    }]
})

const Crop = mongoose.model('Crop', cropSchema);
export default Crop;