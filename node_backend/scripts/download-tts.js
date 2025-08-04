import dotenv from 'dotenv';
import { downloadAllTTSFiles } from '../utils/downloadTTS.util.js';

// Load environment variables
dotenv.config();

console.log('🎵 TTS Audio Download Script');
console.log('============================');

console.log('✅ Using hardcoded API credentials');
console.log('📁 Audio files will be saved to: public/audio/');
console.log('');

// Run the download
downloadAllTTSFiles()
  .then(() => {
    console.log('\n🎉 TTS download script completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 TTS download script failed:', error);
    process.exit(1);
  }); 