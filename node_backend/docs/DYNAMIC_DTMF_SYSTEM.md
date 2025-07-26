# Dynamic DTMF System for Crop Selection

## Overview
The dynamic DTMF system allows the IVR to dynamically generate and play crop selection instructions based on the API response. The system automatically concatenates DTMF instructions with crop names in the user's selected language.

## How It Works

### 1. Audio File Structure
The system uses two types of audio files organized in the following structure:

```
public/audio/
├── {language}/
│   ├── dtmf_instructions/
│   │   ├── press_1.wav
│   │   ├── press_2.wav
│   │   ├── press_3.wav
│   │   ├── press_4.wav
│   │   └── press_5.wav
│   └── crop_names/
│       ├── {native_name}_{ENGLISH_NAME}.wav
│       ├── धान_RICE.wav
│       ├── गेंहू_WHEAT.wav
│       └── ...
```

### 2. Dynamic Audio Sequence Generation
When the API returns a crop list, the system:

1. **Validates** that all crops have corresponding audio files
2. **Generates** the audio sequence: `press_1.wav + crop1.wav + press_2.wav + crop2.wav + ...`
3. **Plays** the sequence to the user

### 3. Example Flow

#### For Hindi (hi-IN) with crops ['RICE', 'WHEAT', 'COTTON']:
```
1. press_1.wav (Press 1 for...)
2. धान_RICE.wav (धान)
3. press_2.wav (Press 2 for...)
4. गेंहू_WHEAT.wav (गेंहू)
5. press_3.wav (Press 3 for...)
6. कपास_COTTON.wav (कपास)
```

## Implementation Details

### Core Components

#### 1. CropDTMFHelper Utility (`utils/cropDTMFHelper.util.js`)
- **Purpose**: Manages crop name mapping and audio file validation
- **Key Methods**:
  - `getNativeCropName(englishName, language)`: Gets native crop name
  - `validateCropAudioFiles(cropList, language)`: Validates audio files exist
  - `generateAudioSequence(cropList, language)`: Generates audio file URLs
  - `getAvailableCrops(lat, lon, pincode)`: Gets crops for location (API placeholder)

#### 2. IVR Controller Methods (`controllers/ivr.controller.js`)
- **`generateCropDTMFInstructions(cropList, language)`**: Main method for generating audio sequence
- **`playAudioSequence(audioFiles, twimlResponse)`**: Plays multiple audio files in sequence
- **`savePinCode()`**: Gets location and available crops
- **`saveCropSelection()`**: Handles crop selection
- **`saveLandArea()`**: Handles land area input

### 3. Routes (`routes/ivr.route.js`)
```javascript
router.post("/saveCropSelection", IvrController.saveCropSelection);
router.post("/saveLandArea", IvrController.saveLandArea);
```

## Usage Examples

### Basic Usage
```javascript
// In your IVR controller
const cropList = ['RICE', 'WHEAT', 'COTTON'];
const language = 'hi-IN';

// Generate audio sequence
const audioFiles = this.generateCropDTMFInstructions(cropList, language);

// Play the sequence
this.playAudioSequence(audioFiles, twimlResponse);
```

### With API Integration
```javascript
// Replace the placeholder in cropDTMFHelper.util.js
async getAvailableCrops(latitude, longitude, pincode) {
    const response = await axios.post('your-crop-api-endpoint', {
        lat: latitude,
        lon: longitude,
        pincode: pincode
    });
    return response.data.cropList;
}
```

## File Naming Convention

### DTMF Instructions
- Format: `press_{number}.wav`
- Examples: `press_1.wav`, `press_2.wav`, `press_3.wav`

### Crop Names
- Format: `{native_name}_{ENGLISH_NAME}.wav`
- Examples:
  - Hindi: `धान_RICE.wav`, `गेंहू_WHEAT.wav`
  - Bengali: `ধান_RICE.wav`, `গম_WHEAT.wav`
  - Telugu: `బియ్యం_RICE.wav`, `గోధుమలు_WHEAT.wav`
  - English: `Rice_RICE.wav`, `Wheat_WHEAT.wav`

## Supported Languages
- **en-IN**: English
- **hi-IN**: Hindi
- **bn-IN**: Bengali
- **te-IN**: Telugu

## Error Handling

### Missing Audio Files
If a crop doesn't have a corresponding audio file:
1. Warning is logged
2. The crop is skipped in the sequence
3. The system continues with available crops

### Invalid Crop Selection
If user selects an invalid option:
1. Error message is played
2. User is redirected to intro

## Session Management
The system stores crop-related data in the session:
```javascript
{
    lang: 'hi-IN',
    name: 'Farmer Name',
    pincode: '123456',
    cropList: ['RICE', 'WHEAT', 'COTTON'],
    selectedCrop: 'RICE',
    landArea: '5'
}
```

## API Integration Points

### 1. Location-based Crop Selection
Replace the placeholder in `cropDTMFHelper.util.js`:
```javascript
async getAvailableCrops(latitude, longitude, pincode) {
    // Your API call here
    const response = await axios.post('your-api-endpoint', {
        lat: latitude,
        lon: longitude,
        pincode: pincode
    });
    return response.data.cropList;
}
```

### 2. Data Storage
In `saveLandArea()` method, add your database storage logic:
```javascript
// Save complete data to database
const sessionData = getSession(callSid);
await saveToDatabase(sessionData);
```

## Testing

### Test Different Crop Lists
```javascript
// Test with different crop combinations
const testCrops = ['RICE', 'WHEAT', 'COTTON', 'SUGARCANE', 'SORGHUM'];
const audioFiles = generateCropDTMFInstructions(testCrops, 'hi-IN');
console.log('Audio sequence:', audioFiles);
```

### Validate Audio Files
```javascript
const validation = cropDTMFHelper.validateCropAudioFiles(cropList, language);
if (!validation.isValid) {
    console.log('Missing crops:', validation.missing);
}
```

## Troubleshooting

### Common Issues

1. **Missing Audio Files**
   - Ensure all crop names in API response have corresponding audio files
   - Check file naming convention matches exactly

2. **Language Mismatch**
   - Verify language codes match supported languages
   - Check crops.json has translations for all crops

3. **Audio Playback Issues**
   - Verify BASE_URL environment variable is set correctly
   - Check audio files are accessible via HTTP

### Debug Logging
The system includes comprehensive logging:
- Crop list validation results
- Audio file generation
- User selections
- Session data

## Future Enhancements

1. **Dynamic Audio Concatenation**: Server-side audio file merging
2. **Caching**: Cache frequently used audio sequences
3. **Fallback Audio**: Default audio for missing crop names
4. **Multi-language Support**: Add more languages
5. **Audio Compression**: Optimize audio file sizes 