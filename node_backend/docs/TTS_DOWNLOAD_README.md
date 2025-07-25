# TTS Audio Download Utility

This utility downloads Text-to-Speech (TTS) audio files from the Reverie API based on the prompts defined in `utils/prompts.json`.

## Features

- Downloads TTS audio for multiple languages (English, Hindi, Bengali, Telugu)
- Creates organized directory structure in `public/audio/`
- Supports individual file downloads or bulk downloads
- Includes error handling and progress tracking
- Uses proper speaker voices for each language

## Directory Structure

The audio files will be organized as follows:

```
public/
└── audio/
    ├── en-IN/
    │   ├── 2_prompt_name_after_beep.wav
    │   ├── 3_enter_pincode.wav
    │   ├── 4_music_or_waiting.wav
    │   ├── 5_choose_crop.wav
    │   ├── 6_enter_land_area.wav
    │   └── 7_processing_done.wav
    ├── hi-IN/
    │   ├── 1_welcome_and_lang_select.wav
    │   ├── 2_prompt_name_after_beep.wav
    │   ├── 3_enter_pincode.wav
    │   ├── 4_music_or_waiting.wav
    │   ├── 5_choose_crop.wav
    │   ├── 6_enter_land_area.wav
    │   └── 7_processing_done.wav
    ├── bn-IN/
    │   ├── 2_prompt_name_after_beep.wav
    │   ├── 3_enter_pincode.wav
    │   ├── 4_music_or_waiting.wav
    │   ├── 5_choose_crop.wav
    │   ├── 6_enter_land_area.wav
    │   └── 7_processing_done.wav
    └── te-IN/
        ├── 2_prompt_name_after_beep.wav
        ├── 3_enter_pincode.wav
        ├── 4_music_or_waiting.wav
        ├── 5_choose_crop.wav
        ├── 6_enter_land_area.wav
        └── 7_processing_done.wav
```

## Setup

### 1. Environment Variables

Create or update your `.env` file with your Reverie API credentials:

```env
REV_API_KEY=your_actual_api_key_here
REV_APP_ID=your_actual_app_id_here
```

### 2. API Credentials

You'll need to obtain your API credentials from Reverie:
- **REV_API_KEY**: Your Reverie API key
- **REV_APP_ID**: Your Reverie App ID

## Usage

### Method 1: Using the Script (Recommended)

Run the dedicated script:

```bash
node scripts/download-tts.js
```

### Method 2: Direct Execution

Run the utility directly:

```bash
node utils/downloadTTS.util.js
```

### Method 3: Programmatic Usage

Import and use the functions in your code:

```javascript
import { downloadAllTTSFiles, downloadSpecificTTS } from './utils/downloadTTS.util.js';

// Download all TTS files
await downloadAllTTSFiles();

// Download specific prompt for specific language
await downloadSpecificTTS('2_prompt_name_after_beep', 'hi-IN');
```

## Language Support

The utility supports the following languages with appropriate speakers:

| Language Code | Language | Speaker |
|---------------|----------|---------|
| `en-IN` | English | `en_female` |
| `hi-IN` | Hindi | `hi_female` |
| `bn-IN` | Bengali | `bn_female` |
| `te-IN` | Telugu | `te_female` |

## API Endpoint

The utility uses the Reverie TTS API endpoint:
- **URL**: `https://revapi.reverieinc.com/`
- **Method**: POST
- **Headers**: 
  - `REV-API-KEY`: Your API key
  - `REV-APP-ID`: Your App ID
  - `REV-APPNAME`: tts
  - `speaker`: Language-specific speaker
  - `Content-Type`: application/json

## Error Handling

The utility includes comprehensive error handling:

- **API Errors**: Displays detailed error messages for failed requests
- **Missing Credentials**: Validates environment variables before starting
- **Directory Creation**: Automatically creates missing directories
- **Progress Tracking**: Shows download progress and summary

## Troubleshooting

### Common Issues

1. **"API key not set" error**
   - Ensure your `.env` file contains the correct API credentials
   - Check that the environment variables are loaded properly

2. **"No speaker found for language" error**
   - Verify that the language code is supported
   - Check the `LANGUAGE_SPEAKERS` mapping in the utility

3. **Network errors**
   - Check your internet connection
   - Verify the API endpoint is accessible
   - Ensure your API credentials are valid

4. **Permission errors**
   - Ensure the script has write permissions to the `public/audio/` directory
   - Check that the parent directories exist and are writable

### Rate Limiting

The utility includes a 500ms delay between requests to avoid overwhelming the API. If you encounter rate limiting:

- Increase the delay in the `downloadAllTTSFiles` function
- Consider downloading files in smaller batches
- Contact Reverie support if you need higher rate limits

## Files

- `utils/downloadTTS.util.js` - Main utility functions
- `scripts/download-tts.js` - Standalone script for downloading
- `utils/prompts.json` - Text prompts for each language
- `docs/TTS_DOWNLOAD_README.md` - This documentation

## Notes

- All audio files are downloaded in WAV format
- The utility creates directories automatically if they don't exist
- Failed downloads are logged but don't stop the entire process
- The script can be safely re-run to re-download missing files 