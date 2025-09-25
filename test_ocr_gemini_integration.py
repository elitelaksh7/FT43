#!/usr/bin/env python3
"""
Test OCR and Gemini API functionality together
"""
import os
import sys
from dotenv import load_dotenv
import requests
import json
import base64
from PIL import Image
from io import BytesIO

# Load environment variables
load_dotenv()

# Get API key
GOOGLE_AI_API_KEY = os.getenv("GOOGLE_AI_API_KEY")

# Check if Gemini API is configured
print(f"Gemini API Key configured: {bool(GOOGLE_AI_API_KEY)}")

# Generate a simple test image with text
def create_test_image(text="Test Receipt\nTotal: $25.99\nMerchant: Starbucks\nDate: 2023-09-25"):
    """Create a simple test image with text"""
    try:
        from PIL import Image, ImageDraw, ImageFont
        
        # Create a blank image
        img = Image.new('RGB', (400, 200), color=(255, 255, 255))
        d = ImageDraw.Draw(img)
        
        # Try to use a system font, fallback to default if not found
        try:
            font = ImageFont.truetype("arial.ttf", 15)
        except:
            font = ImageFont.load_default()
        
        # Draw text
        d.text((10, 10), text, fill=(0, 0, 0), font=font)
        
        # Save to buffer
        buffer = BytesIO()
        img.save(buffer, format="PNG")
        buffer.seek(0)
        
        return buffer
    except Exception as e:
        print(f"Error creating test image: {e}")
        return None

# Test OCR functionality
def test_ocr_with_api():
    """Test OCR functionality with API"""
    print("\n" + "="*50)
    print("🔍 TESTING OCR FUNCTIONALITY")
    print("="*50)
    
    # Create test image
    image_buffer = create_test_image()
    if not image_buffer:
        print("❌ Failed to create test image")
        return False
    
    # Save test image for reference
    with open("test_receipt.png", "wb") as f:
        f.write(image_buffer.getvalue())
    print("✅ Created test image: test_receipt.png")
    
    # Reset buffer position
    image_buffer.seek(0)
    
    try:
        # Test direct API call
        url = "http://localhost:8002/parse-image/"
        files = {"file": ("test_receipt.png", image_buffer, "image/png")}
        
        print(f"Making API request to {url}")
        response = requests.post(url, files=files)
        
        if response.status_code == 200:
            result = response.json()
            print("✅ OCR API returned successfully")
            print(f"Response: {json.dumps(result, indent=2)}")
            return True
        else:
            print(f"❌ OCR API returned status code: {response.status_code}")
            print(f"Response: {response.text}")
            return False
    except Exception as e:
        print(f"❌ Error testing OCR API: {e}")
        import traceback
        traceback.print_exc()
        return False

# Mock server if API call fails
def test_with_mock_data():
    """Test with mock data if API call fails"""
    print("\n" + "="*50)
    print("🔍 TESTING WITH MOCK DATA")
    print("="*50)
    
    # Mock OCR result
    ocr_result = {
        "recipientName": "Starbucks",
        "amount": 25.99,
        "isDebit": True,
        "timestamp": "2023-09-25T12:00:00Z",
        "raw_text_from_ocr": "Test Receipt\nTotal: $25.99\nMerchant: Starbucks\nDate: 2023-09-25"
    }
    
    print(f"Mock OCR Result: {json.dumps(ocr_result, indent=2)}")
    
    try:
        # Mock categorization
        from main import get_ai_category_prediction
        examples = [
            {"receiver": "Zomato", "category": "Food"},
            {"receiver": "Netflix", "category": "Entertainment"},
        ]
        category, reasoning, confidence, alternatives = get_ai_category_prediction(
            ocr_result["recipientName"], examples
        )
        
        print("\nMock Categorization Result:")
        print(f"Category: {category}")
        print(f"Confidence: {confidence:.2f}")
        print(f"Reasoning: {reasoning}")
        
        # Combined result
        ocr_result["ai_category"] = category
        ocr_result["ai_confidence"] = confidence
        ocr_result["ai_reasoning"] = reasoning
        
        print("\nFinal Combined Result:")
        print(json.dumps(ocr_result, indent=2))
        return True
    except Exception as e:
        print(f"❌ Error with mock processing: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    # Test OCR API
    ocr_success = test_ocr_with_api()
    
    # If OCR API fails, test with mock data
    if not ocr_success:
        mock_success = test_with_mock_data()
    else:
        mock_success = True
    
    # Print final result
    print("\n" + "="*50)
    if ocr_success and mock_success:
        print("✅ ALL TESTS PASSED")
    else:
        print("❌ TESTS FAILED - See errors above")
        if not ocr_success:
            print("❌ OCR API test failed - Backend server may not be running or has errors")
            print("   Try: python -c \"import uvicorn; from main import app; uvicorn.run(app, host='0.0.0.0', port=8002)\"")
        if not mock_success:
            print("❌ Mock test failed - There may be issues with the Gemini API integration")
    print("="*50)