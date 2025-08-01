import torch
from torchvision import transforms
from PIL import Image
import torch.nn as nn
import torch.nn.functional as F
from timm import create_model
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.responses import JSONResponse
from pydantic import BaseModel
import io
import os
import cloudinary
import cloudinary.uploader
import cloudinary.api
import uuid
import uvicorn
import requests
import urllib.parse
import time
import cloudinary.utils
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# === FastAPI App ===
app = FastAPI(
    title="Crop Disease Detection API",
    description="API for detecting crop diseases using ResMamba model"
)

# === Cloudinary Configuration ===
cloudinary_config = {
    'cloud_name': os.getenv('CLOUDINARY_CLOUD_NAME'),
    'api_key': os.getenv('CLOUDINARY_API_KEY'),
    'api_secret': os.getenv('CLOUDINARY_API_SECRET')
}

# Validate Cloudinary credentials
if not all(cloudinary_config.values()):
    print("Warning: Some Cloudinary environment variables are missing!")
    missing = [k for k, v in cloudinary_config.items() if not v]
    print(f"Missing: {missing}")

cloudinary.config(**cloudinary_config)

# Ensure upload directory exists
UPLOAD_FOLDER = 'Uploads'
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

# === Device Setup ===
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

# === Helper Function to Generate Signed Cloudinary URL ===
def get_signed_cloudinary_url(public_id, resource_type='image', expires_in=300):
    """Generate signed URL for authenticated Cloudinary images and raw files"""
    try:
        expires_at = int(time.time()) + expires_in  # UNIX timestamp in seconds
        url, options = cloudinary.utils.cloudinary_url(
            public_id,
            resource_type=resource_type,
            type="authenticated",         # This is required to generate a signed URL
            sign_url=True,
            expires_at=expires_at
        )
        return url
    except Exception as e:
        print(f"Failed to generate signed URL: {e}")
        return None

# === Helper Function to Download Files from Cloudinary ===
def download_file(public_id: str, save_path: str, file_type: str = 'image/jpeg') -> bool:
    """Download files from Cloudinary (both image and raw files)"""
    try:
        resource_type = 'raw' if file_type == 'raw' else 'image'
        url = get_signed_cloudinary_url(public_id, resource_type=resource_type)
        
        if not url:
            print(f"Failed to generate signed URL for {public_id}")
            return False
            
        response = requests.get(url, headers={'Content-Type': file_type}, timeout=30)
        if response.status_code == 200:
            with open(save_path, 'wb') as f:
                f.write(response.content)
            return True
        else:
            print(f"Failed to download file. Status: {response.status_code}")
            return False
    except Exception as e:
        print(f"Error downloading file: {e}")
        return False

# === Helper Function to Load Model ===
def load_model_without_module(model, path, device):
    try:
        state_dict = torch.load(path, map_location=device)
        new_state_dict = {k.replace("module.", ""): v for k, v in state_dict.items()}
        model.load_state_dict(new_state_dict)
        return model
    except Exception as e:
        raise Exception(f"Error loading model from {path}: {str(e)}")

# === ResNet50Classifier ===
class ResNet50Classifier(nn.Module):
    def __init__(self, num_classes, pretrained=True, dropout_rate=0.3, hidden_dim=512, use_bn=True, activation="relu"):
        super().__init__()
        self.backbone = create_model('resnet50', pretrained=pretrained, num_classes=0)
        self.feature_dim = self.backbone.num_features
        act_fn = nn.ReLU(inplace=True) if activation == "relu" else nn.GELU() if activation == "gelu" else nn.SiLU()
        layers = []
        layers.append(nn.Dropout(dropout_rate))
        if hidden_dim:
            layers.append(nn.Linear(self.feature_dim, hidden_dim))
            if use_bn:
                layers.append(nn.BatchNorm1d(hidden_dim))
            layers.append(act_fn)
            layers.append(nn.Dropout(dropout_rate))
            layers.append(nn.Linear(hidden_dim, num_classes))
        else:
            layers.append(nn.Linear(self.feature_dim, num_classes))
        self.classifier = nn.Sequential(*layers)

    def forward(self, x):
        features = self.backbone(x)
        return self.classifier(features)

# === VMambaBlock ===
class VMambaBlock(nn.Module):
    def __init__(self, dim):
        super().__init__()
        self.norm = nn.LayerNorm(dim)
        self.ssm = nn.Conv1d(dim, dim, kernel_size=3, padding=1, groups=dim)
        self.ff = nn.Sequential(nn.Linear(dim, dim * 4), nn.GELU(), nn.Linear(dim * 4, dim))

    def forward(self, x):
        x = self.norm(x)
        x = x + self.ssm(x.transpose(1, 2)).transpose(1, 2)
        return x + self.ff(x)

# === VMambaClassifier ===
class VMambaClassifier(nn.Module):
    def __init__(self, num_classes, patch_size=4, embed_dim=512, img_size=224):
        super().__init__()
        self.patch_embed = nn.Conv2d(3, embed_dim, kernel_size=patch_size, stride=patch_size)
        self.blocks = nn.Sequential(VMambaBlock(embed_dim), VMambaBlock(embed_dim))
        self.norm = nn.LayerNorm(embed_dim)
        self.avgpool = nn.AdaptiveAvgPool1d(1)
        self.classifier = nn.Linear(embed_dim, num_classes)

    def forward(self, x):
        x = self.patch_embed(x)
        B, C, H, W = x.shape
        x = x.flatten(2).transpose(1, 2)
        x = self.blocks(x)
        x = self.norm(x)
        x = x.transpose(1, 2)
        x = self.avgpool(x).squeeze(-1)
        return self.classifier(x)

# === ResMamba ===
class ResMamba(nn.Module):
    def __init__(self, eff_model, vmamba_model, num_classes):
        super(ResMamba, self).__init__()
        self.resnet_feature_extractor = eff_model.backbone
        self.res_feat_dim = eff_model.feature_dim
        self.vmamba_patch = vmamba_model.patch_embed
        self.vmamba_blocks = vmamba_model.blocks
        self.vmamba_norm = vmamba_model.norm
        self.vmamba_pool = nn.AdaptiveAvgPool1d(1)
        self.vmamba_feat_dim = vmamba_model.classifier.in_features

        self.fusion_classifier = nn.Sequential(
            nn.Linear(self.res_feat_dim + self.vmamba_feat_dim, 512),
            nn.ReLU(),
            nn.Dropout(0.3),
            nn.Linear(512, num_classes)
        )

    def forward(self, x):
        res_feat = self.resnet_feature_extractor(x)
        x_vm = self.vmamba_patch(x)
        B, C, H, W = x_vm.shape
        x_vm = x_vm.flatten(2).transpose(1, 2)
        x_vm = self.vmamba_blocks(x_vm)
        x_vm = self.vmamba_norm(x_vm)
        x_vm = x_vm.transpose(1, 2)
        x_vm = self.vmamba_pool(x_vm).squeeze(-1)
        fused = torch.cat((res_feat, x_vm), dim=1)
        return self.fusion_classifier(fused)

# === Setup Models ===
num_classes = 38
try:
    eff_model = ResNet50Classifier(num_classes=num_classes).to(device)
    load_model_without_module(eff_model, "./models/resnet50_classifier.pth", device)
    eff_model.eval()

    vmamba_model = VMambaClassifier(num_classes=num_classes).to(device)
    load_model_without_module(vmamba_model, "./models/vmamba_classifier.pth", device)
    vmamba_model.eval()

    resmamba_model = ResMamba(eff_model, vmamba_model, num_classes=num_classes).to(device)
    load_model_without_module(resmamba_model, "./models/ResMamba.pth", device)
    resmamba_model.eval()
except Exception as e:
    print(f"Error initializing models: {str(e)}")
    raise

# === Transform for Image ===
val_transform = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
])

# === Define Class Names ===
class_names = [
    'Apple___Apple_scab', 'Apple___Black_rot', 'Apple___Cedar_apple_rust', 'Apple___healthy',
    'Blueberry___healthy', 'Cherry_(including_sour)___Powdery_mildew', 'Cherry_(including_sour)___healthy',
    'Corn_(maize)___Cercospora_leaf_spot Gray_leaf_spot', 'Corn_(maize)___Common_rust_',
    'Corn_(maize)___Northern_Leaf_Blight', 'Corn_(maize)___healthy', 'Grape___Black_rot',
    'Grape___Esca_(Black_Measles)', 'Grape___Leaf_blight_(Isariopsis_Leaf_Spot)', 'Grape___healthy',
    'Orange___Haunglongbing_(Citrus_greening)', 'Peach___Bacterial_spot', 'Peach___healthy',
    'Pepper,_bell___Bacterial_spot', 'Pepper,_bell___healthy', 'Potato___Early_blight',
    'Potato___Late_blight', 'Potato___healthy', 'Raspberry___healthy', 'Soybean___healthy',
    'Squash___Powdery_mildew', 'Strawberry___Leaf_scorch', 'Strawberry___healthy',
    'Tomato___Bacterial_spot', 'Tomato___Early_blight', 'Tomato___Late_blight',
    'Tomato___Leaf_Mold', 'Tomato___Septoria_leaf_spot', 'Tomato___Spider_mites Two-spotted_spider_mite',
    'Tomato___Target_Spot', 'Tomato___Tomato_Yellow_Leaf_Curl_Virus', 'Tomato___Tomato_mosaic_virus',
    'Tomato___healthy'
]

# === Prediction Function ===
def predict_single_image(image: Image.Image, model, class_names, transform, device):
    def parse_class_name(class_name):
        parts = class_name.split('___')
        crop = parts[0].replace('_', ' ')
        if len(parts) > 1 and parts[1] == "healthy":
            disease = "No Disease Detected"
        else:
            disease = parts[1].replace('_', ' ') if len(parts) > 1 else "Unknown"
        return crop, disease

    model.eval()
    input_tensor = transform(image).unsqueeze(0).to(device)

    with torch.no_grad():
        output = model(input_tensor)
        probabilities = F.softmax(output, dim=1)
        confidence, predicted = torch.max(probabilities, 1)
        class_idx = predicted.item()
        predicted_class = class_names[class_idx]
        accuracy = round(confidence.item() * 100, 2)
        crop, disease = parse_class_name(predicted_class)

    damage_status = "Not Damaged" if disease == "No Disease Detected" else "Damaged"

    return {
        "Crop_name": crop,
        "Disease": disease,
        "Accuracy": accuracy,
        "Damage_Report": damage_status
    }

# === Pydantic Model for Cloudinary Request ===
class CloudinaryRequest(BaseModel):
    publicId: str
    fileType: str
    originalName: str

# === Download and Predict Endpoint ===
@app.post("/api/damage_detection", response_model=dict)
async def predict_from_cloudinary(request: CloudinaryRequest):
    try:
        # Extract file extension from originalName if fileType is generic
        if request.fileType.lower() in ["image", "raw"] and request.originalName:
            file_extension = request.originalName.split('.')[-1].lower() if '.' in request.originalName else 'jpg'
        else:
            file_extension = request.fileType.lower()
        
        # Determine resource type and content type for Cloudinary
        if request.fileType.lower() == 'raw':
            resource_type = 'raw'
            content_type = 'raw'
        else:
            resource_type = 'image'
            content_type = f'image/{file_extension}'
        
        # Validate file extension - support both image and raw file types
        image_extensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'tiff', 'tif', 'webp', 'svg']
        raw_extensions = ['pdf', 'doc', 'docx', 'txt', 'csv', 'xlsx', 'zip', 'rar', 'mp4', 'avi', 'mov', 'mp3', 'wav']
        valid_extensions = image_extensions + raw_extensions + ['raw', 'image']
        
        if file_extension not in valid_extensions:
            raise HTTPException(status_code=400, detail=f"Invalid file type. Supported: {valid_extensions}")

        # For disease detection, we need to check if it's actually an image file that can be processed
        is_processable_image = file_extension in image_extensions or (
            resource_type == 'image' and file_extension in ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'tiff', 'tif', 'webp']
        )
        
        if not is_processable_image:
            raise HTTPException(status_code=400, detail=f"File type '{file_extension}' is not a processable image format for disease detection")

        # Download file using the new download function
        local_path = os.path.join(UPLOAD_FOLDER, f"{uuid.uuid4()}.{file_extension}")
        
        try:
            print(f"Attempting to download {resource_type} file: {request.publicId}")
            success = download_file(request.publicId, local_path, content_type)
            
            if not success:
                raise HTTPException(status_code=500, detail="Failed to download file from Cloudinary")
            
            print(f"Successfully downloaded file to: {local_path}")
            
            # Verify file was created and has content
            if not os.path.exists(local_path) or os.path.getsize(local_path) == 0:
                raise Exception("Downloaded file is empty or doesn't exist")

            # Open and process image for disease detection
            image = Image.open(local_path).convert('RGB')
            print(f"Successfully opened image with size: {image.size}")
            
        except Exception as e:
            print(f"Error in file processing: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Error downloading or opening file: {str(e)}")
        finally:
            # Clean up local file
            if os.path.exists(local_path):
                os.remove(local_path)

        # Perform prediction
        result = predict_single_image(image, resmamba_model, class_names, val_transform, device)

        return JSONResponse(content=result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing request: {str(e)}")

# === Upload and Predict Endpoint ===
@app.post("/predict", response_model=dict)
async def predict(file: UploadFile = File(...)):
    try:
        # Validate file type
        if not file.content_type or not file.content_type.startswith('image/'):
            raise HTTPException(status_code=400, detail="File must be an image")

        # Validate filename
        if not file.filename:
            raise HTTPException(status_code=400, detail="File must have a filename")

        # Generate a unique filename
        file_extension = file.filename.split('.')[-1].lower()
        unique_filename = f"{uuid.uuid4()}.{file_extension}"
        local_path = os.path.join(UPLOAD_FOLDER, unique_filename)

        # Save file locally
        contents = await file.read()
        with open(local_path, 'wb') as f:
            f.write(contents)

        # Upload to Cloudinary
        try:
            upload_result = cloudinary.uploader.upload(
                local_path,
                folder="crop_disease_images",
                resource_type="image"
            )
            cloudinary_url = upload_result['secure_url']
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Cloudinary upload failed: {str(e)}")
        finally:
            # Clean up local file
            if os.path.exists(local_path):
                os.remove(local_path)

        # Process image for prediction
        image = Image.open(io.BytesIO(contents)).convert('RGB')
        result = predict_single_image(image, resmamba_model, class_names, val_transform, device)

        return JSONResponse(content=result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing image: {str(e)}")

# === Root Endpoint ===
@app.get("/")
async def root():
    return {"message": "Welcome to the Crop Disease Detection API. Use POST /predict to upload an image or POST /api/damage_detection to process an image from Cloudinary."}

# === Run the FastAPI app with Uvicorn ===
if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=5003)