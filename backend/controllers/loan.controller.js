import crop from "../models/crop.schema.js";
import user from "../models/user.schema.js";
import loan from "../models/loan.schema.js";
import sendNotification from "../services/sendNotification.service.js"
import Bank from "../models/bank.schema.js";

class LoanController {
    async submitLoan(req, res) {
        try {
            const { id } = req.params;

            if (!id) {
                return res.status(400).json({ message: "crop id not found" });
            }

            const { uid, loanPurpose, requestedAmount, loanTenure } = req.body;

            const newLoan = await loan.create({
                uid,
                loanPurpose,
                requestedAmount,
                cropId: id,
                loanTenure,
            });

            const userRecord = await user.findOne({ uid });
            if (!userRecord) {
                return res.status(400).json({ message: "No user found linked with the crop" });
            }

            const cropRecord = await crop.findById(id);
            if (!cropRecord) {
                return res.status(400).json({ message: "No crop found with given ID" });
            }

            const name = userRecord.name;
            const email = userRecord.email;
            const phone = userRecord.phone;
            const cropName = cropRecord.cropName;
            const acresOfLand = cropRecord.acresOfLand;
            const plantingDate = cropRecord.plantingDate;
            const expectedHarvestDate = cropRecord.expectedHarvestDate;
            const soilType = cropRecord.soilType;
            const irrigationMethod = cropRecord.irrigationMethod;
            const predictedYieldKgPerAcre = cropRecord.predictedYieldKgPerAcre;
            const yieldCategory = cropRecord.yieldCategory;
            const soilHealthScore = cropRecord.soilHealthScore;
            const soilHealthCategory = cropRecord.soilHealthCategory;
            const climateScore = cropRecord.climateScore;
            const locationLat = userRecord.location.lat;
            const locationLong = userRecord.location.long;

            //10Km Radius
            const nearbyBanks = await Bank.find({
                location: {
                    $near: {
                        $geometry: {
                            type: "Point",
                            coordinates: [locationLong, locationLat]
                        },
                        $maxDistance: 10000 
                    }
                }
            });

            if (!nearbyBanks.length) {
                return res.status(404).json({ message: "No nearby banks found within 10 km" });
            }

            for (const bank of nearbyBanks) {
                try {
                    const mailStatus = await sendNotification.sendLoanNotificationEmail(bank.email, {
                        name,
                        email,
                        phone,
                        cropName,
                        acresOfLand,
                        plantingDate,
                        expectedHarvestDate,
                        soilType,
                        irrigationMethod,
                        predictedYieldKgPerAcre,
                        yieldCategory,
                        soilHealthScore,
                        soilHealthCategory,
                        climateScore
                    });

                    if (!mailStatus) {
                        console.log(`❌ Mail sending failed to ${bank.name} (${bank.email})`);
                    } else {
                        console.log(`✅ Loan email sent to ${bank.name}`);
                    }
                } catch (err) {
                    console.error(`❌ Error sending email to ${bank.name}:`, err.message);
                }
            }

            await loan.findByIdAndUpdate(newLoan._id, {
                $set: { status: "submitted" }
            });

            return res.status(200).json({ message: "Loan Application Submitted & Sent to Nearby Banks" });

        } catch (err) {
            console.error(err.message);
            return res.status(400).json({ message: "Failed to submit loan" });
        }
    }
}

const loanController = new LoanController();
export default loanController;