from flask import Flask, request, jsonify
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

app = Flask(__name__)

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

# Generate signed URL for Cloudinary
def get_signed_url(public_id, resource_type='image', expires_in=300):
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
def download_file(public_id, save_path, file_type='image/jpeg'):
    resource_type = 'raw' if file_type == 'raw' else 'image'
    url = get_signed_url(public_id, resource_type=resource_type)
    response = requests.get(url, headers={'Content-Type': file_type})
    if response.status_code == 200:
        with open(save_path, 'wb') as f:
            f.write(response.content)
        return True
    else:
        return False

# --- Flask Routes ---
@app.route('/api/exif_metadata', methods=['POST'])
def exif_metadata():
    if not request.is_json:
        return jsonify({"error": "Request must be JSON"}), 400
    data = request.get_json()
    
    # Check for fieldImage structure
    if 'fieldImage' not in data or not isinstance(data['fieldImage'], dict):
        return jsonify({"error": "Missing or invalid fieldImage object"}), 400
    
    field_image = data['fieldImage']
    required_fields = ['publicId', 'fileType']
    missing_fields = [field for field in required_fields if field not in field_image or field_image[field] is None]
    if missing_fields:
        return jsonify({"error": f"Missing required fields in fieldImage: {', '.join(missing_fields)}"}), 400

    public_id = field_image['publicId']
    file_type = field_image['fileType']
    filename = field_image.get('originalName', f"{public_id.split('/')[-1]}.jpg")
    filepath = os.path.join(UPLOAD_FOLDER, filename)
    
    if not download_file(public_id, filepath, file_type):
        return jsonify({"error": f"Failed to download image from Cloudinary: {public_id}"}), 500
    
    result = engine.get_exif_data(filepath)
    os.remove(filepath)
    return jsonify(result)

@app.route('/api/damage_detection', methods=['POST'])
def damage_detection():
    if not request.is_json:
        return jsonify({"error": "Request must be JSON"}), 400
    data = request.get_json()
    
    # Check for damageImage structure
    if 'damageImage' not in data or not isinstance(data['damageImage'], dict):
        return jsonify({"error": "Missing or invalid damageImage object"}), 400
    
    damage_image = data['damageImage']
    required_fields = ['publicId', 'fileType']
    missing_fields = [field for field in required_fields if field not in damage_image or damage_image[field] is None]
    if missing_fields:
        return jsonify({"error": f"Missing required fields in damageImage: {', '.join(missing_fields)}"}), 400

    public_id = damage_image['publicId']
    file_type = damage_image['fileType']
    filename = damage_image.get('originalName', f"{public_id.split('/')[-1]}.jpg")
    filepath = os.path.join(UPLOAD_FOLDER, filename)
    
    if not download_file(public_id, filepath, file_type):
        return jsonify({"error": f"Failed to download image from Cloudinary: {public_id}"}), 500
    
    result = engine.predict_damage(filepath)
    os.remove(filepath)
    return jsonify(result)

@app.route('/api/crop_type', methods=['POST'])
def crop_type():
    if not request.is_json:
        return jsonify({"error": "Request must be JSON"}), 400
    data = request.get_json()
    
    # Check for cropImage structure
    if 'cropImage' not in data or not isinstance(data['cropImage'], dict):
        return jsonify({"error": "Missing or invalid cropImage object"}), 400
    
    crop_image = data['cropImage']
    required_fields = ['publicId', 'fileType']
    missing_fields = [field for field in required_fields if field not in crop_image or crop_image[field] is None]
    if missing_fields:
        return jsonify({"error": f"Missing required fields in cropImage: {', '.join(missing_fields)}"}), 400

    public_id = crop_image['publicId']
    file_type = crop_image['fileType']
    filename = crop_image.get('originalName', f"{public_id.split('/')[-1]}.jpg")
    filepath = os.path.join(UPLOAD_FOLDER, filename)
    
    if not download_file(public_id, filepath, file_type):
        return jsonify({"error": f"Failed to download image from Cloudinary: {public_id}"}), 500
    
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
            crop_input=data['cropName'].upper(),
            lat=lat,
            lon=lon
        )
        return jsonify(result)
    except ValueError as e:
        return jsonify({"error": f"Invalid numeric input: {str(e)}"}), 400
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/futureWeatherPrediction', methods=['POST'])
def future_weather_prediction():
    if not request.is_json:
        return jsonify({"error": "Request must be JSON"}), 400
    data = request.get_json()
    
    required_fields = ['locationLat', 'locationLong', 'language']
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
        return jsonify(result)
    except ValueError as e:
        return jsonify({"error": f"Invalid numeric input: {str(e)}"}), 400
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)