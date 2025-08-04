# Crop Disease Detection API

This is a FastAPI application for detecting crop diseases from images using a ResMamba model, which combines ResNet50 and VMamba architectures. The API accepts an image file and returns a JSON response with the predicted crop type, disease (if any), confidence score, and damage status.

## Features

* Predicts diseases for 38 crop classes, covering crops like Apple, Tomato, Potato, and more.
* Uses pre-trained ResNet50, VMamba, and ResMamba models.
* Provides detailed output including crop name, disease, accuracy, and damage report.
* Built with FastAPI for high performance and easy integration.

## Prerequisites

* **Python** : Version 3.8 or higher
* **PyTorch** : For model inference (CPU or GPU)
* **CUDA** (optional): For GPU acceleration if available
* **Model Files** : Pre-trained model weights for ResNet50, VMamba, and ResMamba
* **Dependencies** : Listed in `requirements.txt`

## Installation

1. **Clone the Repository**

   ```bash
   git clone <repository-url>
   cd crop-disease-detection-api
   ```
2. **Create a Virtual Environment**

   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```
3. **Install Dependencies**
   Create a `requirements.txt` file with the following content:

   ```text
   fastapi==0.115.0
   uvicorn==0.30.6
   torch==2.4.1
   torchvision==0.19.1
   timm==1.0.9
   pillow==10.4.0
   python-multipart==0.0.9
   ```

   Then install:

   ```bash
   pip install -r requirements.txt
   ```
4. **Set Up Model Files**

   * Download the pre-trained model weights:
     * `resnet50_classifier.pth`
     * `vmamba_classifier.pth`
     * `ResMamba.pth`
   * Place these files in the directory: `/content/drive/MyDrive/Damage_Detection_Crop_Resmamba/`.
   * Update the file paths in `main.py` if your model files are stored elsewhere:
     ```python
     load_model_without_module(eff_model, "<path-to-resnet50_classifier.pth>", device)
     load_model_without_module(vmamba_model, "<path-to-vmamba_classifier.pth>", device)
     load_model_without_module(resmamba_model, "<path-to-ResMamba.pth>", device)
     ```

## Running the API

1. **Start the FastAPI Server**

   ```bash
   uvicorn main:app --host 0.0.0.0 --port 8000
   ```

   * The API will be available at `http://localhost:8000`.
   * Use `--reload` for development to enable auto-reload: `uvicorn main:app --reload`.
2. **Access the API Documentation**

   * Open a browser and navigate to `http://localhost:8000/docs` to view the interactive Swagger UI.
   * The root endpoint (`/`) provides a welcome message.
   * The `/predict` endpoint accepts image uploads for predictions.

## Usage

### Predicting Crop Disease

 **Endpoint** : `POST /predict`

 **Request** :

* **Content-Type** : `multipart/form-data`
* **Body** : Upload an image file (e.g., JPG, PNG) of a crop leaf.
* Example using `curl`:
  ```bash
  curl -X POST "http://localhost:8000/predict" -F "file=@/path/to/PotatoEarlyBlight2.JPG"
  ```

 **Response** :

* A JSON object with the prediction results.
* Example:
  ```json
  {
      "Crop_name": "Potato",
      "Disease": "Early Blight",
      "Accuracy (%)": 92.45,
      "Damage_Report": "Damaged"
  }
  ```

**Python Example** using `requests`:

```python
import requests

url = "http://localhost:8000/predict"
files = {"file": open("/path/to/PotatoEarlyBlight2.JPG", "rb")}
response = requests.post(url, files=files)
print(response.json())
```

### Error Handling

* **400 Bad Request** : If the uploaded file is not an image.
* **500 Internal Server Error** : If there’s an issue processing the image (e.g., invalid image or model error).

## Notes

* **Model Paths** : Ensure the model file paths in `main.py` match your local setup.
* **GPU Support** : The API automatically uses CUDA if available; otherwise, it falls back to CPU.
* **Image Requirements** : Images should be clear, RGB, and preferably focused on the crop leaf.
* **Supported Crops** : The model supports 38 classes, including Apple, Blueberry, Tomato, etc. (see `class_names` in `main.py` for the full list).

## Troubleshooting

* **Model Loading Errors** : Verify that the `.pth` files are accessible and not corrupted.
* **Dependency Issues** : Ensure all packages are installed correctly using `requirements.txt`.
* **Port Conflicts** : Change the port in the `uvicorn` command if `8000` is in use.
* **CUDA Errors** : If GPU is unavailable, ensure `torch` is installed with CPU support or disable CUDA in `main.py` by setting `device = torch.device("cpu")`.

## License

This project is licensed under the MIT License.
