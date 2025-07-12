# Python Backend Setup Guide

## Environment Variables Setup

The Python backend requires Cloudinary credentials to be configured. You can set these up in two ways:

### Option 1: Environment Variables
Set the following environment variables in your system:

```bash
export CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
export CLOUDINARY_API_KEY=your_cloudinary_api_key
export CLOUDINARY_API_SECRET=your_cloudinary_api_secret
```

### Option 2: .env File
Create a `.env` file in the `python_backend` directory with the following content:

```
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
```

Replace `your_cloudinary_cloud_name`, `your_cloudinary_api_key`, and `your_cloudinary_api_secret` with your actual Cloudinary credentials.

## Installation

1. Install the required dependencies:
```bash
pip install -r requirements.txt
```

2. Run the FastAPI server:
```bash
python main_fastAPI.py
```

The server will start on `http://localhost:5000`

## API Endpoints

- `POST /api/exif_metadata` - Extract EXIF metadata from images
- `POST /api/damage_detection` - Detect crop damage from images
- `POST /api/crop_type` - Identify crop type from images
- `POST /predictForCrop` - Predict crop yield
- `POST /futureWeatherPrediction` - Get weather predictions and claim recommendations 