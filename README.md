

# 🚜 AgroSure.ai – AI-Powered Insurance & Loans for Bharat’s Farmers  
*Team: BongoBoltu (Team 71)*  
**Members:** Uddalak Mukhopadhyay, Nirupon Pal, Sayantan Patra, Souherdya Sarkar  

---

## 🌱 Vision

> **"If AI can power billion-dollar decisions on Wall Street, why not support a farmer in India deciding his next crop?"**

**AgriSure.ai** is a multilingual AI platform designed to make crop insurance and loan accessibility **fraud-proof, explainable, and inclusive** — even for farmers using only a **keypad phone**.

---

## 🧩 Features

### 🏦 1. Smart Loan Recommender
✅ Approves crop loans based on:
- 📍 GPS-based land data (via Bhulekh / PM-KISAN)
- 🌾 Soil health (NPK, Organic Carbon)
- ☁️ Weather + NDVI forecast using `NeuralProphet`
- 🧠 Yield forecasting per crop-season

```json
{
  "climate_score": 78.3,
  "predicted_yield": "1412 kg/ha",
}
````

---

### 🛡️ 2. AI-Based Crop Insurance Claim Verifier

Checks the validity of claims using:

* 🧠 Vision AI model (`ResMamba`) for leaf damage
* 🛰️ Geofencing via GPS metadata
* 🌧️ Weather + NDVI anomalies

```json
{
  "is_claim_valid": true,
  "Crop_type": "Strawberry",
  "reason": " severe leaf rot."
}
```

---

### 📞 3. AI-Powered IVR System (Keypad Phones Supported!)

> Press `1` for loan eligibility
> Press `2` to verify insurance claim
> Press `3` to speak to AgriQBot

Built using:

* 🔁 Twilio IVR
* 🧠 Backend AI (FastAPI)
* 🗣️ Multilingual TTS + ASR
* 📞 Keypad (DTMF) + voice navigation

---

### 🧠 4. LangChain + RAG Multilingual Assistant

Explains:

* Why a loan was rejected
* Insurance policy clauses
* Government schemes (PMFBY, PM-KISAN)

> 💬 Supports: Hindi, Bengali, English

Uses:

* `LangChain` + FAISS
* `MiniLM` embeddings (multilingual)
* Coreference + translation

---

## ⚙️ Tech Stack

| Layer         | Tech Used                                |
| ------------- | ---------------------------------------- |
| 🧠 AI Models  | Hugging Face Spaces                      |
| 📦 Backend    | FastAPI + Uvicorn (Docker)               |
| 🌐 Frontend   | Vercel (Next.js)                         |
| ☁️ Hosting    | Google Cloud Run + Cloud Storage         |
| 📊 Monitoring | Prometheus + Grafana + Loki              |
| 🛠️ DevOps    | GitHub Actions + Docker + CI/CD pipeline |

---

## 📊 Monitoring Setup

| Metric                | Tool           |
| --------------------- | -------------- |
| Inference Latency     | Prometheus     |
| AI Logs (error/info)  | Loki           |
| Model Downtime Alerts | Grafana Alerts |
| IVR Error Traces      | Twilio + Loki  |

---

## 🔁 Real-World Simulation

| Scenario           | Traditional Way           | With AgriSure.ai                      |
| ------------------ | ------------------------- | ------------------------------------- |
| Loan Eligibility   | Manual bank approval      | AI yield + subsidy scoring            |
| Claim Processing   | Weeks of field inspection | Instant vision + weather verification |
| Language Barrier   | English PDF policies      | Voice & text in local languages       |
| Phone Requirements | Smartphone needed         | Keypad IVR supported                  |

---

## 🧪 Sample Workflows

### ✅ Claim Verification

```bash
POST /verify-claim
Content-Type: multipart/form-data

- file: damage.jpg
- gps_lat: 23.17
- gps_lon: 88.41
```

### 🧠 Loan Recommender

```bash
POST /recommend-loan
{
  "lat": 22.57,
  "lon": 88.36,
  "soil_n": 78,
  "soil_p": 46,
  "soil_k": 52,
  "oc": 0.61
}
```

---

## 🧠 AI Models

* `NeuralProphet` – Crop yield + weather regression
* `ResMamba` – Crop damage image classification
* `LangChain + MiniLM` – RAG-based policy explainer
* `Semantic memory + coreference` for follow-up queries

---

## 📦 Deployment

### ✅ Infrastructure

* ☁️ GCP: Cloud Run, Storage, Secret Manager
* 🧠 HuggingFace Spaces: For all inference APIs
* 🌐 Vercel: Web frontend
* 📞 Twilio: IVR + SMS routing
* 🔍 Loki: Logs from FastAPI + IVR flow

### 🐳 Dockerized

```bash
docker build -t agri-backend .
docker run -d -p 8000:8000 agri-backend
```

### 📟 CI/CD

```yaml
# GitHub Actions
- On Push:
  - Run tests
  - Build Docker
  - Deploy to GCP
```

---

## 🙌 Impact

* 📞 Runs even on non-smartphones
* 🌾 Promotes fair insurance payouts
* 🌐 Brings AI to the grassroots

---

## 📎 License

MIT © 2025 BongoBoltu Team
Built on Infosys Global Hackathon 2025
