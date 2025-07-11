from flask import Flask, request, jsonify
import os
from PIL import Image
import piexif
import cv2
import numpy as np
from geopy.geocoders import Nominatim
from geopy.exc import GeocoderTimedOut
import torch
import timm
from torchvision import transforms
import torch.nn.functional as F
import pandas as pd
import re
from prophet import Prophet
from sklearn.metrics import mean_absolute_error, mean_absolute_percentage_error
import requests
import json
import engine
import warnings
import futureWeather

warnings.filterwarnings("ignore")

app = Flask(__name__)

# Ensure upload directory exists
UPLOAD_FOLDER = 'Uploads'
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)


# --- Flask Routes ---
@app.route('/api/exif_metadata', methods=['POST'])
def exif_metadata():
    if 'image' not in request.files:
        return jsonify({"error": "No image provided"}), 400
    file = request.files['image']
    if file.filename == '':
        return jsonify({"error": "No image selected"}), 400
    filepath = os.path.join(UPLOAD_FOLDER, file.filename)
    file.save(filepath)
    result = engine.get_exif_data(filepath)
    os.remove(filepath)
    return jsonify(result)

@app.route('/api/damage_detection', methods=['POST'])
def damage_detection():
    if 'image' not in request.files:
        return jsonify({"error": "No image provided"}), 400
    file = request.files['image']
    if file.filename == '':
        return jsonify({"error": "No image selected"}), 400
    filepath = os.path.join(UPLOAD_FOLDER, file.filename)
    file.save(filepath)
    result = engine.predict_damage(filepath)
    os.remove(filepath)
    return jsonify(result)

@app.route('/api/crop_type', methods=['POST'])
def crop_type():
    if 'image' not in request.files:
        return jsonify({"error": "No image provided"}), 400
    file = request.files['image']
    if file.filename == '':
        return jsonify({"error": "No image selected"}), 400
    filepath = os.path.join(UPLOAD_FOLDER, file.filename)
    file.save(filepath)
    result = engine.predict_crop(filepath)
    os.remove(filepath)
    return jsonify(result)

@app.route('/predictForCrop', methods=['POST'])
def predict_crop_yield():
    if not request.is_json:
        return jsonify({"error": "Request must be JSON"}), 400
    data = request.get_json()
    
    required_fields = ['cropName', 'locationLat', 'locationLong']
    missing_fields = [field for field in required_fields if field not in data or data[field] is None]
    if missing_fields:
        return jsonify({"error": f"Missing required fields: {', '.join(missing_fields)}"}), 400

    try:
        lat = float(data['locationLat'])
        lon = float(data['locationLong'])
        if not (-90 <= lat <= 90) or not (-180 <= lon <= 180):
            return jsonify({"error": "Invalid latitude or longitude values"}), 400

        result = engine.predict_crop_yield_from_location(
            crop_input=f"{data['cropName'].upper()}",
            lat=lat,
            lon=lon
        )
        return jsonify(result)
    except ValueError as e:
        return jsonify({"error": f"Invalid numeric input: {str(e)}"}), 400
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    

@app.route('/futureWeatherPrediction', methods=['POST'])
def fututeWeatherPrediction():
    if not request.is_json:
        return jsonify({"error": "Request must be JSON"}), 400
    data = request.get_json()
    
    required_fields = ['locationLat', 'locationLong','language' ]
    missing_fields = [field for field in required_fields if field not in data or data[field] is None]
    if missing_fields:
        return jsonify({"error": f"Missing required fields: {', '.join(missing_fields)}"}), 400

    try:
        lat = float(data['locationLat'])
        lon = float(data['locationLong'])
        lang = data['language']

        tom = futureWeather.fetch_tomorrow(lat, lon)
        if not tom or len(tom.get("timelines", {}).get("daily", [])) < 7:
            data, source = futureWeather.fetch_open_meteo(lat, lon), "open-meteo"
        else:
            data, source = tom, "tomorrow"

        summary, score, should_claim, flags = futureWeather.extract_and_calc(data, source)
        ai_text = futureWeather.invoke_gemini(summary, score, should_claim, flags, lang)

        result = {
            "claim_recommendation": {
                "should_claim": should_claim,
                "weather_trend_risk_score": round(score, 2),
                "forecast_summary": summary,
                "language": lang,
                "gemini_response": ai_text
            }
        }

        # print(json.dumps(result, indent=2, ensure_ascii=False))
        return jsonify(result)
    except ValueError as e:
        return jsonify({"error": f"Invalid numeric input: {str(e)}"}), 400
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)

# Routs
# /api/exif_metadata
# /api/damage_detection
# /api/crop_type
# /predictForCrop
# /futureWeatherPrediction
