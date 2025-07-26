import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class CropDTMFHelper {
    
    constructor() {
        this.projectRoot = path.resolve(__dirname, '..');
        this.cropsPath = path.join(this.projectRoot, 'utils', 'crops.json');
        this.crops = JSON.parse(fs.readFileSync(this.cropsPath, 'utf8'));
        
        // Language mapping for crop names
        this.languageMapping = {
            'en-IN': 'en',
            'hi-IN': 'hi',
            'bn-IN': 'bn',
            'te-IN': 'te'
        };
    }


    getNativeCropName(englishName, language) {
        const langKey = this.languageMapping[language];
        if (!langKey) {
            console.error(`Unsupported language: ${language}`);
            return null;
        }

        const crop = this.crops.find(c => c.en.toUpperCase() === englishName.toUpperCase());
        return crop ? crop[langKey] : null;
    }

    validateCropAudioFiles(cropList, language) {
        const missingCrops = [];
        const validCrops = [];

        cropList.forEach(cropName => {
            const nativeName = this.getNativeCropName(cropName, language);
            if (!nativeName) {
                missingCrops.push(cropName);
            } else {
                validCrops.push({
                    english: cropName,
                    native: nativeName,
                    audioFile: `${nativeName}_${cropName}.wav`
                });
            }
        });

        return {
            valid: validCrops,
            missing: missingCrops,
            isValid: missingCrops.length === 0
        };
    }


    generateAudioSequence(cropList, language) {
        const audioFiles = [];
        
        cropList.forEach((cropName, index) => {
            const number = index + 1;
            const nativeName = this.getNativeCropName(cropName, language);
            
            if (!nativeName) {
                console.warn(`Native name not found for crop: ${cropName} in language: ${language}`);
                return;
            }
            
            // Add DTMF instruction
            const dtmfPath = `${process.env.BASE_URL}/audio/${language}/dtmf_instructions/press_${number}.wav`;
            audioFiles.push(dtmfPath);
            
            // Add 1 second pause after DTMF instruction
            const pausePath = `${process.env.BASE_URL}/audio/silence_1sec.wav`;
            audioFiles.push(pausePath);
            
            // Add crop name with proper URL encoding for the filename
            const cropFileName = `${nativeName}_${cropName}.wav`;

            // Encode only the filename part, not the entire path
            const encodedFileName = encodeURIComponent(cropFileName);
            const cropPath = `${process.env.BASE_URL}/audio/${language}/crop_names/${encodedFileName}`;
            audioFiles.push(cropPath);
            
            // Add 1 second pause after crop name (except for the last one)
            if (index < cropList.length - 1) {
                audioFiles.push(pausePath);
            }
            
            console.log(`Crop ${number}: ${cropName} -> Native: "${nativeName}" -> File: "${cropFileName}" -> URL: "${cropPath}"`);
        });
        
        return audioFiles;
    }

    async getAvailableCrops(latitude, longitude, pincode) {
        // This is a placeholder - replace with actual API call
        // Example API call:
        // const response = await axios.post('your-crop-api-endpoint', {
        //     lat: latitude,
        //     lon: longitude,
        //     pincode: pincode
        // });
        // return response.data.cropList;

        // For now, return a sample list
        return ['RICE', 'WHEAT', 'COTTON', 'SUGARCANE', 'SORGHUM'];
    }

    getCropByIndex(cropList, index) {
        const cropIndex = index - 1;
        if (cropIndex >= 0 && cropIndex < cropList.length) {
            return {
                index: cropIndex + 1,
                name: cropList[cropIndex],
                english: cropList[cropIndex]
            };
        }
        return null;
    }

    getAllAvailableCrops() {
        return this.crops.map(crop => crop.en.toUpperCase());
    }
}

export default new CropDTMFHelper(); 