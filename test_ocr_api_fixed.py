import requests
import base64
import os
import sys
from PIL import Image
import io
import json

def test_server_endpoints():
    """Test if the server is running by accessing the root endpoint"""
    try:
        response = requests.get("http://localhost:8002/")
        if response.status_code == 200:
            print("✅ Server is running!")
            print(f"Response: {response.json()}")
            return True
        else:
            print(f"❌ Server returned status code: {response.status_code}")
            print(f"Response: {response.text}")
            return False
    except requests.exceptions.ConnectionError:
        print("❌ Server connection failed. Make sure the server is running on port 8002.")
        return False

def create_test_image():
    """Create a simple test image with text for OCR testing"""
    try:
        # Create a white image
        width, height = 500, 200
        image = Image.new("RGB", (width, height), color="white")
        
        # Save image to BytesIO object
        img_byte_array = io.BytesIO()
        image.save(img_byte_array, format="PNG")
        img_byte_array.seek(0)
        
        return img_byte_array
    except Exception as e:
        print(f"❌ Error creating test image: {e}")
        return None

def test_image_upload():
    """Test image upload to the parse-image endpoint"""
    try:
        img_data = create_test_image()
        if not img_data:
            return False
        
        files = {"file": ("test_image.png", img_data, "image/png")}
        
        print("\nTesting image upload to parse-image endpoint...")
        response = requests.post("http://localhost:8002/parse-image/", files=files)
        
        if response.status_code == 200:
            print("✅ Image upload successful!")
            print(f"Response: {json.dumps(response.json(), indent=2)}")
            return True
        else:
            print(f"❌ Image upload failed with status code: {response.status_code}")
            print(f"Response: {response.text}")
            return False
    except Exception as e:
        print(f"❌ Error testing image upload: {e}")
        return False

def test_payment_app_upload():
    """Test image upload to the parse-payment-app endpoint"""
    try:
        img_data = create_test_image()
        if not img_data:
            return False
        
        files = {"file": ("payment_app_screenshot.png", img_data, "image/png")}
        
        print("\nTesting image upload to parse-payment-app endpoint...")
        response = requests.post("http://localhost:8002/parse-payment-app/", files=files)
        
        if response.status_code == 200:
            print("✅ Payment app screenshot upload successful!")
            print(f"Response: {json.dumps(response.json(), indent=2)}")
            return True
        else:
            print(f"❌ Payment app screenshot upload failed with status code: {response.status_code}")
            print(f"Response: {response.text}")
            return False
    except Exception as e:
        print(f"❌ Error testing payment app screenshot upload: {e}")
        return False

def main():
    print("=== OCR Server Test Script ===")
    
    if not test_server_endpoints():
        print("❌ Server endpoint test failed. Cannot proceed with further tests.")
        return
    
    test_image_upload()
    test_payment_app_upload()
    
    print("\n=== All tests completed! ===")

if __name__ == "__main__":
    main()