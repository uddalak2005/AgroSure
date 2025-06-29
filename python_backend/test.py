import requests
import os

# Base URL of the running Flask API
BASE_URL = " https://6bed-2a09-bac5-3ada-1a46-00-29e-42.ngrok-free.app"

# Paths to test images (update these paths to point to actual images on your system)
TEST_IMAGE_PATHS = {
    "exif_metadata": "D:\\CodeStation\\AgroSure\\Test_Image\\metadata_check_image.jpg",
    "damage_detection": "D:\\CodeStation\\AgroSure\\Test_Image\\Damage_crop.jpg",
    "crop_type": "D:\\CodeStation\\AgroSure\\Test_Image\\sugercane_for_typeofCrop.jpg"
}

def test_exif_metadata():
    """Test the /api/exif_metadata endpoint"""
    endpoint = f"{BASE_URL}/api/exif_metadata"
    image_path = TEST_IMAGE_PATHS["exif_metadata"]
    
    if not os.path.exists(image_path):
        print(f"Error: Image not found at {image_path}")
        return
    
    with open(image_path, 'rb') as img:
        files = {'image': (os.path.basename(image_path), img, 'image/jpeg')}
        response = requests.post(endpoint, files=files)
    
    print("\nTesting /api/exif_metadata")
    print(f"Status Code: {response.status_code}")
    print("Response:")
    print(response.json())

def test_damage_detection():
    """Test the /api/damage_detection endpoint"""
    endpoint = f"{BASE_URL}/api/damage_detection"
    image_path = TEST_IMAGE_PATHS["damage_detection"]
    
    if not os.path.exists(image_path):
        print(f"Error: Image not found at {image_path}")
        return
    
    with open(image_path, 'rb') as img:
        files = {'image': (os.path.basename(image_path), img, 'image/jpeg')}
        response = requests.post(endpoint, files=files)
    
    print("\nTesting /api/damage_detection")
    print(f"Status Code: {response.status_code}")
    print("Response:")
    print(response.json())

def test_crop_type():
    """Test the /api/crop_type endpoint"""
    endpoint = f"{BASE_URL}/api/crop_type"
    image_path = TEST_IMAGE_PATHS["crop_type"]
    
    if not os.path.exists(image_path):
        print(f"Error: Image not found at {image_path}")
        return
    
    with open(image_path, 'rb') as img:
        files = {'image': (os.path.basename(image_path), img, 'image/jpeg')}
        response = requests.post(endpoint, files=files)
    
    print("\nTesting /api/crop_type")
    print(f"Status Code: {response.status_code}")
    print("Response:")
    print(response.json())

def predictForCrop():
    """Test the /api/crop_type endpoint"""
    endpoint = f"{BASE_URL}/predictForCrop"
    # image_path = TEST_IMAGE_PATHS["crop_type"]
    
    # if not os.path.exists(image_path):
    #     print(f"Error: Image not found at {image_path}")
    #     return
    
    # with open(image_path, 'rb') as img:
    #     files = {'image': (os.path.basename(image_path), img, 'image/jpeg')}
    #     response = requests.post(endpoint, files=files)
    # print("\nTesting /api/crop_type")

    headers = {'Content-Type': 'application/json'}

    CROP_YIELD_CONFIG = {
    "cropName": "RICE",
    "locationLat": 22.9749723,
    "locationLong": 88.4345915
    }



    payload = {
        "cropName": CROP_YIELD_CONFIG["cropName"],
        "locationLat": CROP_YIELD_CONFIG["locationLat"],
        "locationLong": CROP_YIELD_CONFIG["locationLong"]
    }
    response = requests.post(endpoint, json=payload, headers=headers)



    print("\nTesting /predictForCrop")
    print(f"Status Code: {response.status_code}")
    print("Response:")
    print(response.json())

def futureWeather():
    """Test the /api/crop_type endpoint"""
    endpoint = f"{BASE_URL}/futureWeatherPrediction"

    headers = {'Content-Type': 'application/json'}

    CROP_YIELD_CONFIG = {
    "locationLat": 22.9749723,
    "locationLong": 88.4345915,
    "language": "Bengali"
    }



    payload = {
        "locationLat": CROP_YIELD_CONFIG["locationLat"],
        "locationLong": CROP_YIELD_CONFIG["locationLong"],
        "language": CROP_YIELD_CONFIG["language"]
    }
    response = requests.post(endpoint, json=payload, headers=headers)



    print("\nTesting /predictForCrop")
    print(f"Status Code: {response.status_code}")
    print("Response:")
    print(response.json())

def run_tests():
    """Run all tests"""
    print("Starting API tests...\n")
    test_exif_metadata()
    test_damage_detection()
    test_crop_type()
    predictForCrop()
    futureWeather()
    print("\nAll tests completed.")

if __name__ == "__main__":
    run_tests()