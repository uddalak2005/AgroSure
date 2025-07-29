
import requests
import json
import numpy as np
import os

# Load environment variables from .env file
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    print("Warning: python-dotenv not installed. Using system environment variables only.")

try:
    import google.generativeai as genai
    GENAI_AVAILABLE = True
except ImportError:
    print("Warning: google.generativeai not available")
    genai = None
    GENAI_AVAILABLE = False

# --- CONFIG ---
TOMORROW_API_KEY = os.getenv('TOMORROW_API_KEY')
GEMINI_API_KEY = os.getenv('GEMINI_API_KEY')

# Configure Gemini AI if available
if GENAI_AVAILABLE and genai and GEMINI_API_KEY:
    try:
        genai.configure(api_key=GEMINI_API_KEY)  # type: ignore
    except Exception as e:
        print(f"Warning: Failed to configure Gemini AI: {e}")
        GENAI_AVAILABLE = False

# --- Ideal Ranges ---
ideal_ranges = {
    "rain": {"ideal_min": 10, "ideal_max": 100},
    "temperature": {"ideal_min": 20, "ideal_max": 35},
    "humidity": {"ideal_min": 40, "ideal_max": 80},
    "wind": {"ideal_min": 0, "ideal_max": 20}
}

# --- Weather Risk Weights ---
weather_factors = {
    "rain_risk": {"weight": 0.4, "value": 0},
    "heat_risk": {"weight": 0.3, "value": 0},
    "humidity_risk": {"weight": 0.2, "value": 0},
    "wind_risk": {"weight": 0.1, "value": 0}
}

# --- Normalize Risk ---
def normalized_risk(actual, ideal_min, ideal_max):
    if ideal_min <= actual <= ideal_max:
        return 0
    return min(1.0, abs(actual - (ideal_min if actual < ideal_min else ideal_max)) / (ideal_min if actual < ideal_min else ideal_max))

# --- Localize Flags ---
def localize_flags(flags, lang):
    translations = {
        "Unusual rainfall": {
            "Bengali": "Rainfall is unusually high or low",
            "Hindi": "Rainfall is unusually high or low",
            "English": "Rainfall is unusually high or low"
        },
        "Heat stress": {
            "Bengali": "High temperatures may cause crop stress",
            "Hindi": "High temperatures may cause crop stress",
            "English": "High temperatures may cause crop stress"
        },
        "High humidity": {
            "Bengali": "High humidity may cause fungal diseases",
            "Hindi": "High humidity may cause fungal diseases",
            "English": "High humidity may cause fungal diseases"
        },
        "High wind": {
            "Bengali": "Strong winds may damage crops",
            "Hindi": "Strong winds may damage crops",
            "English": "Strong winds may damage crops"
        }
    }
    # Filter out None values and ensure all returned values are strings
    result = []
    for f in flags:
        if f is not None:
            translated = translations.get(f, {}).get(lang, f)
            if translated is not None:
                result.append(str(translated))
    return result

# --- API Fetches ---
def fetch_tomorrow(lat, lon):
    if not TOMORROW_API_KEY:
        print("Warning: TOMORROW_API_KEY not found in environment variables")
        return None
    
    try:
        url = f"https://api.tomorrow.io/v4/weather/forecast?location={lat},{lon}&timesteps=1d&apikey={TOMORROW_API_KEY}"
        r = requests.get(url, timeout=10)
        return r.json() if r.status_code == 200 else None
    except Exception as e:
        print(f"Error fetching Tomorrow.io data: {e}")
        return None

def fetch_open_meteo(lat, lon):
    try:
        url = (
            f"https://api.open-meteo.com/v1/forecast?"
            f"latitude={lat}&longitude={lon}"
            f"&daily=temperature_2m_max,temperature_2m_mean,precipitation_sum,relative_humidity_2m_mean,wind_speed_10m_mean"
            f"&forecast_days=16&timezone=auto"
        )
        response = requests.get(url, timeout=10)
        return response.json() if response.status_code == 200 else None
    except Exception as e:
        print(f"Error fetching Open-Meteo data: {e}")
        return None

# --- Weather Trend Analysis ---
def extract_and_calc(data, source):
    try:
        if source == "tomorrow":
            if not data or "timelines" not in data or "daily" not in data["timelines"]:
                raise ValueError("Invalid Tomorrow.io data structure")
            arr = data["timelines"]["daily"]
            days = len(arr)
            rain = [v["values"].get("precipitationSum", 0) for v in arr]
            temp_avg = [v["values"].get("temperatureAvg", 0) for v in arr]
            temp_max = [v["values"].get("temperatureMax", 0) for v in arr]
            humidity = [v["values"].get("humidityAvg", 0) for v in arr]
            wind = [v["values"].get("windSpeedAvg", 0) for v in arr]
        else:  # open-meteo
            if not data or "daily" not in data:
                raise ValueError("Invalid Open-Meteo data structure")
            d = data["daily"]
            days = len(d["time"])
            rain = d.get("precipitation_sum", [0] * days)
            temp_avg = d.get("temperature_2m_mean", [0] * days)
            temp_max = d.get("temperature_2m_max", [0] * days)
            humidity = d.get("relative_humidity_2m_mean", [0] * days)
            wind = d.get("wind_speed_10m_mean", [0] * days)

        # Handle potential None values in arrays
        rain = [r if r is not None else 0 for r in rain]
        temp_avg = [t if t is not None else 0 for t in temp_avg]
        temp_max = [t if t is not None else 0 for t in temp_max]
        humidity = [h if h is not None else 0 for h in humidity]
        wind = [w if w is not None else 0 for w in wind]

        total_rain = float(np.sum(rain))
        avg_temp = float(np.mean(temp_avg))
        max_temp = float(np.max(temp_max))
        avg_humidity = float(np.mean(humidity))
        avg_wind = float(np.mean(wind))
        dry_days = int(sum(1 for r in rain if r < 1))
    except Exception as e:
        print(f"Error processing weather data: {e}")
        # Return default values in case of error
        return {
            "avg_temp_c": 25.0,
            "max_temp_c": 30.0,
            "total_rainfall_mm": 50.0,
            "dry_days": 3,
            "avg_humidity_percent": 60.0,
            "avg_wind_speed_kmph": 10.0,
            "forecast_days_used": 7,
            "source": source,
            "error": str(e)
        }, 0.3, False, []

    weather_factors["rain_risk"]["value"] = normalized_risk(total_rain, **ideal_ranges["rain"])
    weather_factors["heat_risk"]["value"] = normalized_risk(avg_temp, **ideal_ranges["temperature"])
    weather_factors["humidity_risk"]["value"] = normalized_risk(avg_humidity, **ideal_ranges["humidity"])
    weather_factors["wind_risk"]["value"] = normalized_risk(avg_wind, **ideal_ranges["wind"])

    risk_score = float(sum(f["value"] * f["weight"] for f in weather_factors.values()))
    should_claim = bool(risk_score >= 0.5)

    flags = []
    if weather_factors["rain_risk"]["value"] > 0.3:
        flags.append("Unusual rainfall")
    if weather_factors["heat_risk"]["value"] > 0.3:
        flags.append("Heat stress")
    if weather_factors["humidity_risk"]["value"] > 0.3:
        flags.append("High humidity")
    if weather_factors["wind_risk"]["value"] > 0.3:
        flags.append("High wind")

    summary = {
        "avg_temp_c": round(avg_temp, 2),
        "max_temp_c": round(max_temp, 2),
        "total_rainfall_mm": round(total_rain, 2),
        "dry_days": dry_days,
        "avg_humidity_percent": round(avg_humidity, 2),
        "avg_wind_speed_kmph": round(avg_wind, 2),
        "forecast_days_used": days,
        "source": source
    }

    return summary, risk_score, should_claim, flags

# --- Gemini AI Interpretation ---
def invoke_gemini(summary, score, should_claim, flags, lang):
    if not GENAI_AVAILABLE or not genai:
        return f"AI service unavailable. Based on weather analysis: {'Claim recommended' if should_claim else 'No claim needed'}"
    
    localized_flags = localize_flags(flags, lang)
    prompt = f"""
You are a crop insurance assistant. Respond ONLY in {lang}.

Weather Summary:
- Total Rainfall: {summary['total_rainfall_mm']} mm
- Avg Temperature: {summary['avg_temp_c']} °C
- Max Temperature: {summary['max_temp_c']} °C
- Avg Humidity: {summary['avg_humidity_percent']} %
- Avg Wind Speed: {summary['avg_wind_speed_kmph']} km/h
- Dry Days: {summary['dry_days']} days

Risks Observed:
- {'; '.join(localized_flags) if localized_flags else 'No major weather risks observed.'}

Final Output:
- Bullet points for why claim is or is not needed.
- A brief interpretation about whether to claim crop insurance or not.
"""
    
    try:
        model = genai.GenerativeModel("gemini-2.0-flash")  # type: ignore
        response = model.generate_content(prompt)
        return response.text.strip()
    except Exception as e:
        print(f"Error calling Gemini AI: {e}")
        return f"AI service error. Based on weather analysis: {'Claim recommended' if should_claim else 'No claim needed'}"