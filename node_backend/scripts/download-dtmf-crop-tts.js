import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import axios from 'axios';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config();

// API Configuration
const API_CONFIG = {
  baseURL: 'https://revapi.reverieinc.com/',
  headers: {
    'REV-API-KEY': "a396b4358519a135bf7b919c477aeee114899cd2",
    'REV-APP-ID': "dev.namexi",
    'REV-APPNAME': 'tts',
    'Content-Type': 'application/json'
  }
};

// Language to speaker mapping
const LANGUAGE_SPEAKERS = {
  'en-IN': 'en_female',
  'hi-IN': 'hi_female',
  'bn-IN': 'bn_female',
  'te-IN': 'te_female'
};

// Language mapping for dtmf-instruction.json
const LANGUAGE_MAPPING = {
  'en-IN': 'english',
  'hi-IN': 'hindi',
  'bn-IN': 'bengali',
  'te-IN': 'telugu'
};

/**
 * Create directory if it doesn't exist
 * @param {string} dirPath - Directory path to create
 */
function ensureDirectoryExists(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    console.log(`Created directory: ${dirPath}`);
  }
}

/**
 * Download TTS audio for a single text
 * @param {string} text - Text to convert to speech
 * @param {string} language - Language code (e.g., 'hi-IN')
 * @param {string} outputPath - Output file path
 * @returns {Promise<boolean>} - Success status
 */
async function downloadTTSAudio(text, language, outputPath) {
  try {
    const speaker = LANGUAGE_SPEAKERS[language];
    if (!speaker) {
      console.error(`No speaker found for language: ${language}`);
      return false;
    }

    const response = await axios.post(API_CONFIG.baseURL, {
      text: text
    }, {
      headers: {
        ...API_CONFIG.headers,
        'speaker': speaker
      },
      responseType: 'arraybuffer'
    });

    // Ensure the directory exists
    const dir = path.dirname(outputPath);
    ensureDirectoryExists(dir);

    // Write the audio file
    fs.writeFileSync(outputPath, response.data);
    console.log(`✅ Downloaded: ${outputPath}`);
    return true;

  } catch (error) {
    console.error(`❌ Failed to download ${outputPath}:`, error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data.toString());
    }
    return false;
  }
}

/**
 * Download TTS audio for all DTMF crop instructions
 */
async function downloadDTMFCropTTSFiles() {
  console.log('🚀 Starting DTMF Crop TTS audio download...');
  
  // Get the project root directory (two levels up from scripts)
  const projectRoot = path.resolve(__dirname, '..');
  const audioBasePath = path.join(projectRoot, 'public', 'audio');
  
  // Read dtmf-instruction.json
  const dtmfInstructionsPath = path.join(projectRoot, 'utils', 'dtmf-instruction.json');
  const dtmfInstructions = JSON.parse(fs.readFileSync(dtmfInstructionsPath, 'utf8'));
  
  let successCount = 0;
  let totalCount = 0;

  for (const instruction of dtmfInstructions) {
    const { number } = instruction;
    
    for (const [languageCode, languageKey] of Object.entries(LANGUAGE_MAPPING)) {
      const instructionText = instruction[languageKey];
      if (!instructionText) {
        console.warn(`⚠️  No ${languageKey} text found for instruction number ${number}`);
        continue;
      }

      totalCount++;
      
      // Create language-specific dtmf_instructions directory
      const dtmfInstructionsDir = path.join(audioBasePath, languageCode, 'dtmf_instructions');
      const outputFileName = `press_${number}.wav`;
      const outputPath = path.join(dtmfInstructionsDir, outputFileName);
      
      const success = await downloadTTSAudio(instructionText, languageCode, outputPath);
      if (success) {
        successCount++;
      }
      
      // Add a small delay to avoid overwhelming the API
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }

  console.log(`\n📊 Download Summary:`);
  console.log(`✅ Successful: ${successCount}/${totalCount}`);
  console.log(`❌ Failed: ${totalCount - successCount}/${totalCount}`);
  
  if (successCount === totalCount) {
    console.log('🎉 All DTMF Crop TTS files downloaded successfully!');
  } else {
    console.log('⚠️  Some files failed to download. Check the errors above.');
  }
}

// Run the download
downloadDTMFCropTTSFiles()
  .then(() => {
    console.log('\n🎉 DTMF Crop TTS download script completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 DTMF Crop TTS download script failed:', error);
    process.exit(1);
  }); 