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

# --- EXIF Metadata Extraction ---
def get_exif_data(image_path):
    if not os.path.exists(image_path):
        return {"error": f"File not found at path {image_path}"}

    suspicious_reasons = []
    authenticity_score = 100

    try:
        exif_dict = piexif.load(image_path)
        gps_info = exif_dict.get('GPS', {})

        def _convert_to_degrees(value):
            d, m, s = value
            return d[0]/d[1] + (m[0]/m[1])/60 + (s[0]/s[1])/3600

        lat = lon = None
        if gps_info:
            try:
                lat = round(_convert_to_degrees(gps_info[2]), 6)
                lon = round(_convert_to_degrees(gps_info[4]), 6)
                if gps_info[1] == b'S': lat *= -1
                if gps_info[3] == b'W': lon *= -1
            except:
                lat, lon = None, None
                suspicious_reasons.append("GPS data could not be parsed correctly.")
        else:
            suspicious_reasons.append("GPS metadata missing.")
            authenticity_score -= 30

        address = None
        if lat and lon:
            try:
                geolocator = Nominatim(user_agent="agrisure_exif_reader")
                location = geolocator.reverse((lat, lon), timeout=10)
                address = location.address if location else None
            except:
                address = "Geocoder error"

        model = exif_dict['0th'].get(piexif.ImageIFD.Model, b"").decode('utf-8', errors='ignore')
        timestamp = exif_dict['Exif'].get(piexif.ExifIFD.DateTimeOriginal, b"").decode('utf-8', errors='ignore')
        software = exif_dict['0th'].get(piexif.ImageIFD.Software, b"").decode('utf-8', errors='ignore')

        if not model:
            suspicious_reasons.append("Device model missing.")
            authenticity_score -= 10
        if not timestamp:
            suspicious_reasons.append("Timestamp missing.")
            authenticity_score -= 20
        if software:
            suspicious_reasons.append(f"Image was edited using software: {software}")
            authenticity_score -= 25

        try:
            ela_path = image_path.replace(".jpg", "_ela.jpg")
            original = Image.open(image_path).convert('RGB')
            original.save(ela_path, 'JPEG', quality=90)
            ela_image = Image.open(ela_path)
            ela = Image.blend(original, ela_image, alpha=10)
            ela_cv = np.array(ela)
            std_dev = np.std(ela_cv)
            if std_dev > 25:
                suspicious_reasons.append("High ELA deviation — possible image tampering.")
                authenticity_score -= 15
            os.remove(ela_path)
        except:
            suspicious_reasons.append("ELA check failed.")
            authenticity_score -= 5

        return {
            "verifier": "exif_metadata_reader",
            "device_model": model or "N/A",
            "timestamp": timestamp or "N/A",
            "gps_latitude": lat,
            "gps_longitude": lon,
            "address": address,
            "authenticity_score": max(0, authenticity_score),
            "suspicious_reasons": suspicious_reasons or ["None"]
        }
    except Exception as e:
        return {"error": f"Failed to analyze image: {str(e)}"}

# --- Crop Damage Detection ---
device = "cuda" if torch.cuda.is_available() else "cpu"
val_transform = transforms.Compose([
    transforms.Resize((384, 384)),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
])
model_damage = timm.create_model('efficientnetv2_rw_m', pretrained=False, num_classes=2)
model_damage.load_state_dict(torch.load("models/efficientnetv2_rw_m_crop_damage.pt", map_location=device))
model_damage.to(device)
model_damage.eval()
class_names = ['damaged', 'non_damaged']

def predict_damage(image_path):
    if not os.path.exists(image_path):
        return {"status": "error", "message": f"File not found: {image_path}"}

    try:
        image = Image.open(image_path).convert('RGB')
        input_tensor = val_transform(image).unsqueeze(0).to(device)
        with torch.no_grad():
            output = model_damage(input_tensor)
            probs = torch.softmax(output, dim=1)
            predicted_class = torch.argmax(probs, dim=1).item()
            confidence = float(probs[0][predicted_class].item())
        predicted_label = class_names[predicted_class]
        return {
            "verifier": "crop_damage_classifier",
            "model": "efficientnetv2_rw_m",
            "prediction": predicted_label,
            "confidence": round(confidence * 100, 2),
            "class_names": class_names,
            "status": "success"
        }
    except Exception as e:
        return {"status": "error", "message": str(e)}

# --- Crop Type Detection ---
val_transforms_crop = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
])
idx_to_class = {
    0: 'Coffee-plant', 1: 'Cucumber', 2: 'Fox_nut(Makhana)', 3: 'Lemon', 4: 'Olive-tree',
    5: 'Pearl_millet(bajra)', 6: 'Tobacco-plant', 7: 'almond', 8: 'banana', 9: 'cardamom',
    10: 'cherry', 11: 'chilli', 12: 'clove', 13: 'coconut', 14: 'cotton', 15: 'gram',
    16: 'jowar', 17: 'jute', 18: 'maize', 19: 'mustard-oil', 20: 'papaya', 21: 'pineapple',
    22: 'rice', 23: 'soyabean', 24: 'sugarcane', 25: 'sunflower', 26: 'tea', 27: 'tomato',
    28: 'vigna-radiati(Mung)', 29: 'wheat'
}
model_crop = timm.create_model('convnext_tiny', pretrained=False, num_classes=30)
model_crop.load_state_dict(torch.load('models/crop_type_detection_model.pth', map_location=device))
model_crop.to(device)
model_crop.eval()

def predict_crop(image_path):
    if not os.path.exists(image_path):
        return {"status": "error", "message": f"File not found: {image_path}"}

    try:
        image = Image.open(image_path).convert('RGB')
        image_tensor = val_transforms_crop(image).unsqueeze(0).to(device)
        with torch.no_grad():
            outputs = model_crop(image_tensor)
            probs = F.softmax(outputs, dim=1)
            conf, pred = torch.max(probs, 1)
            predicted_label = idx_to_class[pred.item()]
            confidence = round(float(conf.item()) * 100, 2)
        return {
            "status": "success",
            "predicted_class": predicted_label,
            "confidence_percent": confidence
        }
    except Exception as e:
        return {"status": "error", "message": str(e)}

# --- Crop Yield Prediction Utilities ---
def get_district_from_coordinates(lat, lon):
    geolocator = Nominatim(user_agent="agrisure-ai")
    try:
        location = geolocator.reverse((lat, lon), language="en", timeout=10)
    except GeocoderTimedOut:
        return None, None, "Reverse geocoding service timed out."
    if not location or 'address' not in location.raw:
        return None, None, "Could not get district from coordinates."
    address = location.raw['address']
    district = (
        address.get('district') or
        address.get('state_district') or
        address.get('county')
    )
    if not district:
        return None, None, "District not found in address data."
    if 'district' in district.lower():
        district = district.replace("District", "").strip()
    place_name = district  # Set place_name to district name
    return district, place_name, None

def clean_district_name(district):
    if not isinstance(district, str):
        return district
    district = re.sub(r"\s*[-\u2013]\s*(I{1,3}|IV|V|VI|VII|VIII|IX|X|\d+)$", "", district, flags=re.IGNORECASE)
    district = district.replace("District", "").strip()
    aliases = {
        "Purba Bardhaman": "Burdwan",
        "Paschim Bardhaman": "Burdwan",
        "Bardhaman": "Burdwan",
        "Kalna": "Burdwan",
        "Kalyani": "Nadia",
        "Raiganj": "Uttar Dinajpur",
        "Kolkata": "North 24 Parganas"
    }
    return aliases.get(district, district)

def get_soil_category(score):
    if score == 0:
        return "No Soil Health Data"
    elif score >= 4.5:
        return "Very Excellent Soil Health"
    elif score >= 4:
        return "Excellent Soil Health"
    elif score >= 3:
        return "Good Soil Health"
    elif score >= 2:
        return "Poor Soil Health"
    else:
        return "Very Poor Soil Health"

def calculate_dynamic_climate_score(predicted_yield, soil_score, max_yield=8000, max_soil=5.0):
    norm_yield = (predicted_yield / max_yield) ** 0.8
    norm_soil = (soil_score / max_soil) ** 1.2
    return round((0.6 * norm_yield + 0.4 * norm_soil) * 100, 2)

def forecast_yield(ts_data):
    model = Prophet(yearly_seasonality=True, growth='flat')
    model.fit(ts_data)
    forecast = model.predict(model.make_future_dataframe(periods=1, freq='YS'))
    return max(forecast.iloc[-1]['yhat'], 0)

def forecast_yield_with_accuracy(ts_data):
    model = Prophet(yearly_seasonality=True, growth='flat')
    model.fit(ts_data)
    future = model.make_future_dataframe(periods=1, freq='YS')
    forecast = model.predict(future)
    predicted_yield = max(forecast.iloc[-1]['yhat'], 0)

    try:
        past = forecast[forecast['ds'] < ts_data['ds'].max()]
        merged = ts_data.merge(past[['ds', 'yhat']], on='ds')
        mae = mean_absolute_error(merged['y'], merged['yhat'])
        mape = mean_absolute_percentage_error(merged['y'], merged['yhat']) * 100
    except:
        mae, mape = None, None

    return predicted_yield, mae, mape

def get_crop_priority_list(district_yield, base_crop_names):
    priority_list = []
    for crop, column in base_crop_names.items():
        crop_data = district_yield[['Year', column]].dropna()
        crop_data.columns = ['ds', 'y']
        crop_data['ds'] = pd.to_datetime(crop_data['ds'], format='%Y')
        if len(crop_data) >= 5:
            yield_pred = forecast_yield(crop_data)
            priority_list.append((crop, yield_pred))
    return sorted(priority_list, key=lambda x: x[1], reverse=True)

def get_weather_data(lat, lon):
    import config
    url = f"https://api.weatherapi.com/v1/current.json?key={config.OPENWEATHER_API}&q={lat},{lon}"
    try:
        response = requests.get(url)
        data = response.json()
        return {
            "temp_c": data['current']['temp_c'],
            "humidity": data['current']['humidity'],
            "condition": data['current']['condition']['text'],
            "wind_kph": data['current']['wind_kph']
        }
    except Exception as e:
        return {"error": "Weather fetch failed", "details": str(e)}

def predict_crop_yield_from_location(crop_input,lat, lon):
    district, place_name, error = get_district_from_coordinates(lat, lon)
    if error:
        return {"error": error}
    district_input = clean_district_name(district)

    try:
        yield_df = pd.read_csv(r"data\ICRISAT-District_Level_Data_30_Years.csv")
        soil_df = pd.read_csv(r"data\SoilHealthScores_by_District_2.csv")
    except Exception as e:
        return {"error": f"Failed to read data files: {str(e)}"}

    soil_df['Soil_Category'] = soil_df['SoilHealthScore'].apply(get_soil_category)
    yield_columns = [col for col in yield_df.columns if 'YIELD (Kg per ha)' in col]
    base_crop_names = {col.split(' YIELD')[0]: col for col in yield_columns}

    if crop_input not in base_crop_names:
        return {"error": f"'{crop_input}' not found in crop list."}

    yield_col = base_crop_names[crop_input]
    district_yield = yield_df[yield_df['Dist Name'].str.lower() == district_input.lower()]
    district_soil = soil_df[soil_df['Dist Name'].str.lower() == district_input.lower()]

    if district_yield.empty or district_soil.empty:
        return {"error": f"Data for district '{district_input}' not found."}

    ts_data = district_yield[['Year', yield_col]].dropna()
    ts_data.columns = ['ds', 'y']
    ts_data['ds'] = pd.to_datetime(ts_data['ds'], format='%Y')
    ts_data['year'] = ts_data['ds'].dt.year

    valid_data = ts_data[ts_data['y'] > 0]
    if len(valid_data) < 6:
        predicted_yield = ts_data['y'].mean()
        mae, mape = None, None
    else:
        predicted_yield, mae, mape = forecast_yield_with_accuracy(valid_data)

    if predicted_yield > 1000:
        yield_cat = "Highly Recommended Crop"
    elif predicted_yield > 500:
        yield_cat = "Good Crop"
    elif predicted_yield > 200:
        yield_cat = "Poor Crop"
    else:
        yield_cat = "Very Poor Crop"

    soil_score = district_soil['SoilHealthScore'].values[0]
    soil_cat = district_soil['Soil_Category'].values[0]
    climate_score = calculate_dynamic_climate_score(predicted_yield, soil_score)

    sorted_crops = get_crop_priority_list(district_yield, base_crop_names)
    best_crop = sorted_crops[0][0] if sorted_crops else None
    best_yield = sorted_crops[0][1] if sorted_crops else None

    weather_data = get_weather_data(lat, lon)

    crop_priority_list = []
    for c, y in sorted_crops:
        if y > 1000:
            yc = "Highly Recommended Crop"
        elif y > 500:
            yc = "Good Crop"
        elif y > 200:
            yc = "Poor Crop"
        else:
            yc = "Very Poor Crop"

        score = calculate_dynamic_climate_score(y, soil_score)

        crop_priority_list.append({
            "crop": c,
            "predicted_yield": {
                "kg_per_ha": round(y, 2),
                "kg_per_acre": round(y / 2.47105, 2)
            },
            "yield_category": yc,
            "climate_score": score
        })

    return {
        "location": {
            "input_coordinates": {"lat": lat, "lon": lon},
            "place_name": place_name,
            "detected_district": district,
        },
        "input_crop_analysis": {
            "crop": crop_input,
            "predicted_yield": {
                "kg_per_ha": round(predicted_yield, 2),
                "kg_per_acre": round(predicted_yield / 2.47105, 2)
            },
            "yield_category": yield_cat,
            "prediction_accuracy": {
                "mae": round(mae, 2) if mae is not None else "Not enough data",
                "mape_percent": round(mape, 2) if mape is not None else "Not enough data",
                "accuracy_score": round(100 - mape, 2) if mape is not None else "Not enough data"
            }
        },
        "soil_health": {
            "score": soil_score,
            "category": soil_cat
        },
        "climate_score": climate_score,
        "weather_now": weather_data,
        "best_crop": {
            "name": best_crop,
            "predicted_yield": {
                "kg_per_ha": round(best_yield, 2) if best_crop else None,
                "kg_per_acre": round(best_yield / 2.47105, 2) if best_crop else None,
            }
        },
        "crop_priority_list": crop_priority_list
    }
