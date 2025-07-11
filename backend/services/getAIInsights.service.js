import dotenv from "dotenv";
import axios from "axios";

dotenv.config()
const FLASK_API = process.env.FLASK_URL;

class GetAIInsighits {

    async predictCropScore(cropName, locationLat, locationLong) {
        try {

            console.log('FLASK_API : ', FLASK_API);
            console.log('cropName : ', cropName);
            console.log('locationLat : ', locationLat);
            console.log('locationLong : ', locationLong);

            const response = await axios.post(`${FLASK_API}/predictForCrop`, {
                cropName,
                locationLat,
                locationLong
            });

            console.log('response : ', response.data);

            return response.data;
        } catch (err) {
            console.error('Error in AI prediction:', err.response?.data || err.message);
            return { error: err.response?.data?.error || err.message };
        }
    }

    async getDocScore(damageImage, cropImage, fieldImage) {
        try {
            console.log('FLASK_API : ', FLASK_API);
            console.log('damageImage : ', damageImage);
            console.log('cropImage : ', cropImage);
            console.log('fieldImage : ', fieldImage);

            // Prepare the request payload for damage detection
            const damageRequest = {
                publicId: damageImage.publicId,
                fileType: damageImage.fileType,
                originalName: damageImage.originalName
            };

            const responseDamageDetection = await axios.post(`${FLASK_API}/api/damage_detection`, damageRequest);

            console.log('responseDamageDetection : ', responseDamageDetection.data);

            // Prepare the request payload for metadata extraction
            const metadataRequest = {
                publicId: fieldImage.publicId,
                fileType: fieldImage.fileType,
                originalName: fieldImage.originalName
            };

            const responseMetadata = await axios.post(`${FLASK_API}/api/exif_metadata`, metadataRequest);

            console.log('responseMetadata : ', responseMetadata.data);

            // Prepare the request payload for crop type detection
            const cropRequest = {
                publicId: cropImage.publicId,
                fileType: cropImage.fileType,
                originalName: cropImage.originalName
            };

            const responseCropType = await axios.post(`${FLASK_API}/api/crop_type`, cropRequest);

            console.log('responseCropType : ', responseCropType.data);

            return {
                metadata: responseMetadata.data,
                damageDetection: responseDamageDetection.data,
                cropType: responseCropType.data
            }
        } catch (err) {
            console.error('Error in AI prediction:', err.response?.data || err.message);
            return { error: err.response?.data?.error || err.message };
        }
    }
}

const getAIInsights = new GetAIInsighits();
export default getAIInsights;