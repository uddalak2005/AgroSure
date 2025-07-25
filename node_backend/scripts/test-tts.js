import { testAPIConnection, downloadSpecificTTS } from '../utils/downloadTTS.util.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function testTTS() {
  console.log('🧪 Testing TTS functionality...');
  
  // Test API connection
  const connected = await testAPIConnection();
  if (!connected) {
    console.log('❌ API connection failed. Please check your environment variables:');
    console.log('   REVERIE_API_KEY:', process.env.REVERIE_API_KEY ? 'SET' : 'NOT SET');
    console.log('   REVERIE_APP_ID:', process.env.REVERIE_APP_ID ? 'SET' : 'NOT SET');
    return;
  }
  
  // Test downloading a specific file
  console.log('\n📥 Testing download of a specific file...');
  await downloadSpecificTTS('2_prompt_name_after_beep', 'en-IN');
  
  console.log('\n✅ Test completed!');
}

testTTS().catch(console.error); 