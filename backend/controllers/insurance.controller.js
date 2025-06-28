import Insurance from "../models/insurance.model.js";
import handleMultipleUploads from "../utils/handleFileUpload.util.js";
import sendNotification from "../services/sendNotification.service.js";
import InsuranceCompany from "../models/insuranceCompanies.model.js";
import getAIInsights from "../services/getAIInsights.service.js";

class InsuranceController {
    async createInsurance(req, res) {
        try {
            const fileMetaMap = await handleMultipleUploads(req);

            const { uid, provider, uin, policyNumber } = req.body;

            if (!uid || !provider || !uin || !policyNumber) {
                return res.status(400).json({ message: "Filed Mistmatch" });
            }

            const policyDoc =
                fileMetaMap.policyDoc && fileMetaMap.policyDoc.length > 0
                    ? fileMetaMap.policyDoc[0]
                    : null;
            const damageImage =
                fileMetaMap.damageImage && fileMetaMap.damageImage.length > 0
                    ? fileMetaMap.damageImage[0]
                    : null;
            const cropImage =
                fileMetaMap.cropImage && fileMetaMap.cropImage.length > 0
                    ? fileMetaMap.cropImage[0]
                    : null;

            const fieldImage =
                fileMetaMap.fieldImage && fileMetaMap.fieldImage.length > 0
                    ? fileMetaMap.fieldImage[0]
                    : null;

            if (!policyDoc || !damageImage || !cropImage || !fieldImage) {
                return res.status(400).json({
                    message:
                        "All required files (policyDoc, damageImage, cropImage) must be uploaded",
                });
            }

            const newInsurance = await Insurance.create({
                uid,
                provider,
                uin,
                policyNumber,
                policyDoc,
                damageImage,
                cropImage,
                fieldImage,
            });

            console.log('newInsurance : ', newInsurance);

            const payLoad = await getAIInsights.getDocScore(damageImage, cropImage, fieldImage);

            console.log('payLoad : ', payLoad);


            return res
                .status(201)
                .json({
                    message: "Successfully instantiated insurance",
                    payLoad
                });
        } catch (err) {
            console.log(err.message);
            return res.status(400).json({
                message: "Failed to instantiate insurance",
                error: err.message,
            });
        }
    }

    async submitInsurance(req, res) {
        try {
            const { id } = req.params;

            if (!id) {
                return res.status(400).json({ message: "Insurance ID not provided." });
            }

            const insuranceRecord = await Insurance.findById(id);
            if (!insuranceRecord) {
                return res.status(404).json({ message: "Insurance record not found." });
            }

            if (insuranceRecord.claimStatus === "submitted") {
                return res.status(400).json({ message: "Claim already submitted." });
            }

            const uinPrefix = insuranceRecord.uin.slice(0, 3).toUpperCase();

            const insurer = await InsuranceCompany.findOne({ uinPrefix });

            if (!insurer || !insurer.email) {
                return res.status(404).json({ message: "No matching insurer found for UIN prefix." });
            }

            const insurerEmail = insurer.email;

            const emailSent = await sendNotification.sendInsuranceClaimNotificationEmail(
                insurerEmail,
                insuranceRecord
            );

            if (!emailSent) {
                return res.status(500).json({ message: "Failed to send insurance email." });
            }

            insuranceRecord.claimStatus = "submitted";
            await insuranceRecord.save();

            return res.status(200).json({
                message: "Insurance claim submitted and email sent successfully.",
                insurance: insuranceRecord,
            });

        } catch (err) {
            console.error("Error in submitInsurance:", err.message);
            return res.status(500).json({ message: "Server error occurred." });
        }
    }

    async updateInsurance(req, res) {
        try {
            const insurance = await Insurance.findByIdAndUpdate(
                req.params.id,
                req.body,
                { new: true, runValidators: true }
            );
            if (!insurance) {
                return res.status(404).json({ error: "Insurance not found" });
            }
            res.json(insurance);
        } catch (err) {
            res.status(400).json({ error: err.message });
        }
    }
}

const insuranceController = new InsuranceController();
export default insuranceController;
