import torch
from torchvision import transforms
from PIL import Image
import torch.nn as nn
import torch.nn.functional as F
from timm import create_model
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.responses import JSONResponse
import io
import os

# FastAPI app
app = FastAPI(
    title="Crop Disease Detection API",
    description="API for detecting crop diseases using ResMamba model"
)

# === Device Setup ===
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

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
        layers = [nn.Dropout(dropout_rate)]
        if hidden_dim:
            layers.extend([nn.Linear(self.feature_dim, hidden_dim)])
            if use_bn:
                layers.append(nn.BatchNorm1d(hidden_dim))
            layers.extend([act_fn, nn.Dropout(dropout_rate), nn.Linear(hidden_dim, num_classes)])
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
    load_model_without_module(eff_model, "/content/drive/MyDrive/Damage_Detection_Crop_Resmamba/resnet50_classifier.pth", device)
    eff_model.eval()

    vmamba_model = VMambaClassifier(num_classes=num_classes).to(device)
    load_model_without_module(vmamba_model, "/content/drive/MyDrive/Damage_Detection_Crop_Resmamba/vmamba_classifier.pth", device)
    vmamba_model.eval()

    resmamba_model = ResMamba(eff_model, vmamba_model, num_classes=num_classes).to(device)
    load_model_without_module(resmamba_model, "/content/drive/MyDrive/Damage_Detection_Crop_Resmamba/ResMamba.pth", device)
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
        "Accuracy (%)": accuracy,
        "Damage_Report": damage_status
    }

# === FastAPI Endpoint ===
@app.post("/predict", response_model=dict)
async def predict(file: UploadFile = File(...)):
    try:
        # Validate file type
        if not file.content_type.startswith('image/'):
            raise HTTPException(status_code=400, detail="File must be an image")

        # Read and process image
        contents = await file.read()
        image = Image.open(io.BytesIO(contents)).convert('RGB')

        # Perform prediction
        result = predict_single_image(image, resmamba_model, class_names, val_transform, device)

        return JSONResponse(content=result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing image: {str(e)}")

# === Root Endpoint ===
@app.get("/")
async def root():
    return {"message": "Welcome to the Crop Disease Detection API. Use POST /predict to upload an image for disease detection."}

# === Run the FastAPI app with Uvicorn ===
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5003)