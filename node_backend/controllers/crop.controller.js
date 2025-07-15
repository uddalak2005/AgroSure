import User from "../models/user.schema.js";
import Crop from "../models/crop.schema.js";
import Loan from "../models/loan.schema.js";
import getAIInsights from "../services/getAIInsights.service.js";



class CropController {

    async addNewCrop(req, res) {
        try {
            console.log('req.body : ', req.body);
            const {
                uid,
                cropName,
                acresOfLand,
                plantingDate,
                expectedHarvestDate,
                soilType,
                irrigationMethod,
                additionalNotes
            } = req.body;

            if (!uid || !cropName || !acresOfLand || !plantingDate || !expectedHarvestDate || !soilType || !irrigationMethod) {
                return res.status(422).json({ message: "Missing required fields" })
            }

            const userRecord = await User.findOne({ uid });

            if (!userRecord) {
                return res.status(400).json({ message: "uid not found" });
            }

            const locationLat = userRecord.location.lat;
            const locationLong = userRecord.location.long;

            const newCrop = await Crop.create({
                uid,
                cropName,
                acresOfLand,
                plantingDate,
                expectedHarvestDate,
                soilType,
                irrigationMethod,
                additionalNotes,
                location: {
                    lat: locationLat,
                    long: locationLong
                }
            });

            return res.status(201).json({ message: "Crop Saved Successfully", newCrop });
        } catch (err) {
            console.log(err.message);
            res.status(400).json({
                message: "error occured while creating new crop",
                error: err.message
            })
        }
    }

    async getPredictionOnCrop(req, res) {
        try {
            const { id } = req.params;
            console.log(id);

            const cropRecord = await Crop.findById(id);

            console.log(cropRecord);
            if (!cropRecord) {
                return res.status(400).json({ message: "No Crop Record Found" });
            }

            const cropName = cropRecord.cropName;
            const locationLat = cropRecord.location.lat;
            const locationLong = cropRecord.location.long;

            const responseFromAi = await getAIInsights.predictCropScore(cropName, locationLat, locationLong);

            console.log(responseFromAi);

            if (!responseFromAi || responseFromAi.error) {
                return res.status(400).json({ 
                    message: "Failed to get Response from AI", 
                    error: responseFromAi?.error || "Unknown error"
                });
            }

            const updatedCropRecord = await Crop.findByIdAndUpdate(
                id,
                {
                    $set: {
                        predictedYieldKgPerAcre: responseFromAi.input_crop_analysis.predicted_yield.kg_per_acre,
                        yieldCategory: responseFromAi.input_crop_analysis.yield_cateory,
                        soilHealthScore: responseFromAi.soil_health.score,
                        soilHealthCategory: responseFromAi.soil_health.category,
                        climateScore: responseFromAi.climate_score,
                        suggestedCrops: responseFromAi.crop_priority_list.slice(0, 5).map(crop => ({
                            cropName: crop.crop,
                            predictedYieldKgPerAcre: crop.predicted_yield.kg_per_acre
                        }))
                    }
                },
                { new: true }
            )

            return res.status(200).json({
                updatedCropRecord
            });

        } catch (err) {
            console.log(err.message);
            return res.status(500).json({
                message: "Failed to get Prediciton",
                error: err.message
            })
        }
    }

    async getPastRecords(req, res) {
        try {
            const { uid } = req.params;
            if (!uid) {
                return res.status(400).json({ message: "No uid found" });
            }

            const cropRecord = await Crop.find({ uid: uid });

            const modifiedCropRecord = [];

            for (const crops of cropRecord) {
                const cropId = crops._id;
                console.log(cropId);
                const loanRecord = await Loan.findOne({ cropId: cropId });
                console.log(loanRecord);
                modifiedCropRecord.push({
                    ...crops.toObject() || crops,
                    loanStatus: loanRecord?.status
                })
            }

            if (!cropRecord) {
                return res.status(200).json({ cropRecord: [] });
            }

            return res.status(200).json({ cropRecord: modifiedCropRecord });

        } catch (err) {
            console.log(err);
            res.status(400).json({
                message: "Unable to fetch past records",
                error: err.message
            });
        }

    }
}

const cropController = new CropController();
export default cropController;