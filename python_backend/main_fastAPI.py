from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import os
import requests
import time
import cloudinary
import cloudinary.utils
import config
import engine
import futureWeather
import warnings

warnings.filterwarnings("ignore")

app = FastAPI()

# Configure Cloudinary
cloudinary.config(
    cloud_name=config.CLOUDINARY_CLOUD_NAME,
    api_key=config.CLOUDINARY_API_KEY,
    api_secret=config.CLOUDINARY_API_SECRET
)

# Ensure upload directory exists
UPLOAD_FOLDER = 'Uploads'
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

# Pydantic models for request validation
class ImageRequest(BaseModel):
    publicId: str
    fileType: str
    originalName: str | None = None

class CropYieldRequest(BaseModel):
    cropName: str
    locationLat: float
    locationLong: float

class WeatherPredictionRequest(BaseModel):
    locationLat: float
    locationLong: float
    language: str

# Generate signed URL for Cloudinary
def get_signed_url(public_id: str, resource_type: str = 'image', expires_in: int = 300) -> str:
    expires_at = int(time.time()) + expires_in
    url, options = cloudinary.utils.cloudinary_url(
        public_id,
        resource_type=resource_type,
        type="authenticated",
        sign_url=True,
        expires_at=expires_at
    )
    return url

# Download from Cloudinary and save to local file
def download_file(public_id: str, save_path: str, file_type: str = 'image/jpeg') -> bool:
    resource_type = 'raw' if file_type == 'raw' else 'image'
    url = get_signed_url(public_id, resource_type=resource_type)
    response = requests.get(url, headers={'Content-Type': file_type})
    if response.status_code == 200:
        with open(save_path, 'wb') as f:
            f.write(response.content)
        return True
    return False

# --- FastAPI Routes ---
@app.get("/")
async def root():
    return {
        "message": "Agrosure API is running!", 
        "status": "healthy",
        "endpoints": {
            "exif_metadata": "/api/exif_metadata",
            "damage_detection": "/api/damage_detection", 
            "crop_type": "/api/crop_type",
            "crop_yield_prediction": "/predictForCrop",
            "weather_prediction": "/futureWeatherPrediction"
        },
        "docs": "/docs",
        "redoc": "/redoc"
    }

@app.post("/api/exif_metadata")
async def exif_metadata(image_request: ImageRequest):
    filename = image_request.originalName or f"{image_request.publicId.split('/')[-1]}.jpg"
    filepath = os.path.join(UPLOAD_FOLDER, filename)
    
    if not download_file(image_request.publicId, filepath, image_request.fileType):
        raise HTTPException(status_code=500, detail=f"Failed to download image from Cloudinary: {image_request.publicId}")
    
    result = engine.get_exif_data(filepath)
    os.remove(filepath)
    return result

@app.post("/api/damage_detection")
async def damage_detection(image_request: ImageRequest):
    print(f"Received damage detection request: {image_request}")
    filename = image_request.originalName or f"{image_request.publicId.split('/')[-1]}.jpg"
    filepath = os.path.join(UPLOAD_FOLDER, filename)
    
    if not download_file(image_request.publicId, filepath, image_request.fileType):
        raise HTTPException(status_code=500, detail=f"Failed to download image from Cloudinary: {image_request.publicId}")
    
    result = engine.predict_damage(filepath)
    os.remove(filepath)
    return result

@app.post("/api/crop_type")
async def crop_type(image_request: ImageRequest):
    filename = image_request.originalName or f"{image_request.publicId.split('/')[-1]}.jpg"
    filepath = os.path.join(UPLOAD_FOLDER, filename)
    
    if not download_file(image_request.publicId, filepath, image_request.fileType):
        raise HTTPException(status_code=500, detail=f"Failed to download image from Cloudinary: {image_request.publicId}")
    
    result = engine.predict_crop(filepath)
    os.remove(filepath)
    return result

@app.post("/predictForCrop")
async def predict_crop_yield(data: CropYieldRequest):
    if not (-90 <= data.locationLat <= 90) or not (-180 <= data.locationLong <= 180):
        raise HTTPException(status_code=400, detail="Invalid latitude or longitude values")

    try:
        result = engine.predict_crop_yield_from_location(
            crop_input=data.cropName.upper(),
            lat=data.locationLat,
            lon=data.locationLong
        )
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=f"Invalid numeric input: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/futureWeatherPrediction")
async def future_weather_prediction(data: WeatherPredictionRequest):
    if not (-90 <= data.locationLat <= 90) or not (-180 <= data.locationLong <= 180):
        raise HTTPException(status_code=400, detail="Invalid latitude or longitude values")

    try:
        tom = futureWeather.fetch_tomorrow(data.locationLat, data.locationLong)
        if not tom or len(tom.get("timelines", {}).get("daily", [])) < 7:
            weather_data, source = futureWeather.fetch_open_meteo(data.locationLat, data.locationLong), "open-meteo"
        else:
            weather_data, source = tom, "tomorrow"

        summary, score, should_claim, flags = futureWeather.extract_and_calc(weather_data, source)
        ai_text = futureWeather.invoke_gemini(summary, score, should_claim, flags, data.language)

        return {
            "claim_recommendation": {
                "should_claim": should_claim,
                "weather_trend_risk_score": round(score, 2),
                "forecast_summary": summary,
                "language": data.language,
                "gemini_response": ai_text
            }
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=f"Invalid numeric input: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    print("Starting FastAPI server...")
    print("Server will be available at:")
    print("  - http://localhost:5000")
    print("  - http://127.0.0.1:5000")
    print("\nAPI Documentation will be available at:")
    print("  - http://localhost:5000/docs (Swagger UI)")
    print("  - http://localhost:5000/redoc (ReDoc)")
    print("\nPress CTRL+C to stop the server")
    uvicorn.run("main_fastAPI:app", host="127.0.0.1", port=5000, reload=True)