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


            const responseDamageDetection = await axios.post(`${FLASK_API}/api/damage_detection`, {
                damageImage,
            });

            console.log('responseDamageDetection : ', responseDamageDetection.data);

            const responseMetadata = await axios.post(`${FLASK_API}/api/exif_metadata`, {
                fieldImage
            });

            console.log('responseMetadata : ', responseMetadata.data);

            const responseCropType = await axios.post(`${FLASK_API}/api/crop_type`, {
                cropImage
            });

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