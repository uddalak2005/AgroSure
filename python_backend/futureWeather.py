
import requests
import json
import numpy as np
import google.generativeai as genai
import config

# --- CONFIG ---
TOMORROW_API_KEY = config.TOMORROW_API_KEY  # Replace this
GEMINI_API_KEY = config.GEMINI_API_KEY       # Replace this
genai.configure(api_key=GEMINI_API_KEY)

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
    return [translations.get(f, {}).get(lang, f) for f in flags]

# --- API Fetches ---
def fetch_tomorrow(lat, lon):
    url = f"https://api.tomorrow.io/v4/weather/forecast?location={lat},{lon}&timesteps=1d&apikey={TOMORROW_API_KEY}"
    r = requests.get(url)
    return r.json() if r.status_code == 200 else None

def fetch_open_meteo(lat, lon):
    url = (
        f"https://api.open-meteo.com/v1/forecast?"
        f"latitude={lat}&longitude={lon}"
        f"&daily=temperature_2m_max,temperature_2m_mean,precipitation_sum,relative_humidity_2m_mean,wind_speed_10m_mean"
        f"&forecast_days=16&timezone=auto"
    )
    return requests.get(url).json()

# --- Weather Trend Analysis ---
def extract_and_calc(data, source):
    if source == "tomorrow":
        arr = data["timelines"]["daily"]
        days = len(arr)
        rain = [v["values"].get("precipitationSum", 0) for v in arr]
        temp_avg = [v["values"].get("temperatureAvg", 0) for v in arr]
        temp_max = [v["values"].get("temperatureMax", 0) for v in arr]
        humidity = [v["values"].get("humidityAvg", 0) for v in arr]
        wind = [v["values"].get("windSpeedAvg", 0) for v in arr]
    else:  # open-meteo
        d = data["daily"]
        days = len(d["time"])
        rain = d["precipitation_sum"]
        temp_avg = d["temperature_2m_mean"]
        temp_max = d["temperature_2m_max"]
        humidity = d["relative_humidity_2m_mean"]
        wind = d["wind_speed_10m_mean"]

    total_rain = float(np.sum(rain))
    avg_temp = float(np.mean(temp_avg))
    max_temp = float(np.max(temp_max))
    avg_humidity = float(np.mean(humidity))
    avg_wind = float(np.mean(wind))
    dry_days = int(sum(1 for r in rain if r < 1))

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
    model = genai.GenerativeModel("gemini-2.0-flash")
    return model.generate_content(prompt).text.strip()

