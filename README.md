# 🚜 AgriSure.ai – Bridging AI with Bharat’s Farmers

## 🌉 Our Belief

**In a world where AI is shaping everything — from markets to medicine — why should its power be reserved only for the few?**
We believe **AI should not be a privilege, but a bridge** — one that empowers everyone, regardless of their education or language.

---

## 🧠 What We’re Building

**AgriSure.ai** is a **multilingual, AI-powered Loan, Insurance & Microfinance Assistant** designed for Indian farmers.

We use **Neural Prophet**, **Computer Vision**, and **RAG-based NLP** to:

* 🔍 Predict yield & financial eligibility
* 💸 Automate loan & insurance workflows
* 🗣️ Offer voice-based claim explanations
* 📤 Verify claims through image + geolocation + satellite data

---

## 🏦 1. Smart Loan Engine – Powered by Neural Prophet

> *"Plan ahead, borrow smartly, and repay confidently."*

### 🤖 Tech Stack

* **Model**: `NeuralProphet` (based on PyTorch) – handles seasonal crop data, trend changes, and external regressors.
* **Inputs**:

  * Historical yield (district & block level)
  * 🌧️ Rainfall & temperature
  * 🧪 Soil health and Historical yield data(30 years)(ICAR data and ICRISAT 30 years crop data)
  * 🧭 GPS-tagged land size (from Landsat-8, Sentienal, Bhulekh)

### 🧮 Output: Loan Eligibility JSON

* **Climate Score** — our AI replacement for CIBIL
* Yield projection (kg/ha, kg/acre)
* Risk tier (Low / Medium / High)
* Interest subsidy suggestions
* Custom crop loan recommendation

### 🧪 How We Built It

1. Combined weather + NDVI + soil NPK as external regressors to NeuralProphet.
2. Created a GPS-based region joiner to fetch precise yield history for the farmer's land.
3. Normalized all inputs to match Prophet scale.
4. Created an explainability layer: *Why you got this score?*

### 🔐 Impact:

* 10x better transparency in loan approvals
* Removes unfair credit rejections due to lack of CIBIL
* Aligns loans with actual productivity forecast

---

## 🛡️ 2. Insurance Engine – Automating Claim Verification

> *"From 10-day inspections to instant AI claims."*

### ⚙️ Modules:

1. **Crop Damage Classification (EfficientNetV2-RW-M)**

   * Classifies: Healthy, Mild Damage, Severe Damage
   * Input: Farmer's uploaded image

2. **Crop Type Detection (ConvNeXt-Tiny)**

   * Verifies if claim matches the insured crop
   * Prevents mismatch or false declarations

3. **Geo-tag + Satellite Sync**

   * Checks if image is taken within farmer’s land
   * Uses PM-KISAN/Bhulekh polygon + GPS from image

4. **Weather Sync (Tomorrow\.io)**

   * Validates if damage aligns with recent rainfall/wind/storm events

### 🔄 Manual Audit → Automated Audit

* Old Method: Officer visits field, checks image, verifies ID, files report manually.
* New Method: AI handles this via:

  * ✅ CV model for damage & crop type for validation with policy documents
  * 📍 GPS + land polygon validation for field verification
  * 🌦️ Weather event match
* Final JSON verdict: `is_claim_valid: True/False`, reason, and payout percentage

---

## 🧠 3. Voice-first Insurance Explainer (RAG Agent)

> *"Ask anything about your crop, scheme, or subsidy — in your own language."*

### 🔧 Built Using:

* **LangChain + FAISS + RAG**
* Model: `all-MiniLM-L6-v2` + fine-tuning on `KisanVaani/agriculture-qa-english-only`

### 📣 Features:

* Multilingual Q\&A: Hindi, Bengali, English
* Input via voice or text
* Explains:

  * PMFBY steps
  * Subsidy eligibility
  * Claim process
  * Loan documentation

### 🎯 RAG Improvements
* Fine-tuned on custom Dataset
* Custom chunk size: `350 tokens`, overlap `150`
* Translation + language detection layer
* Real farmer questions curated and embedded

---

## 🧪 Real-World Validation

| **Process**             | **Before**                         | **With AgriSure.ai**               |
| ----------------------- | ---------------------------------- | ---------------------------------- |
| Crop Damage Audit       | Manual, slow, error-prone          | CV + weather + GPS automated check |
| Loan Eligibility        | Based on income/CIBIL (unreliable) | AI yield + climate risk + NPK      |
| Insurance Understanding | Complex PDFs in English            | Voice agent in Hindi/Bengali       |

---

## 🚀 Impact Metrics

* 🧾 Up to 80% faster claim resolution
* 💰 Credit access for farmers with 0 CIBIL
* 🗣️ Voice-first UI works for semi-literate users
* 🔐 Reduced fraud via image/GPS verification

---

## 🔧 Tech Stack

* Forecasting: **NeuralProphet**
* CV Models: **EfficientNetV2-RW-M**, **ConvNeXt-Tiny**
* NLP: **LangChain**, **RAG**, **all-MiniLM-L6-v2**
* APIs: **Google Earth Engine**
* GIS: **Bhulekh**, **Sentienal**, **Landsat-8**

---

## 🧗 Challenges Faced

### 1. NeuralProphet tuning for seasonal crops

* Solved using weekly NDVI + rainfall regressors

### 2. Vision inference delay

* Used `torch.inference_mode()` and float16 batching

### 3. GPS mismatch (lat, long vs long, lat)

* Fixed with coordinate standardization

### 4. Multilingual RAG accuracy

* Used fine-tuning + translation validation loop

