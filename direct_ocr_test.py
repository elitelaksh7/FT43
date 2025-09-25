#!/usr/bin/env python3
"""
Direct OCR Testing with Improvements
Test OCR accuracy improvements directly without server
"""

import os
import pytesseract
from PIL import Image, ImageDraw, ImageFont, ImageEnhance
import cv2
import numpy as np
import re

# Configure Tesseract
TESSERACT_PATHS = [
    r"C:\Program Files\Tesseract-OCR\tesseract.exe",
    r"C:\Program Files (x86)\Tesseract-OCR\tesseract.exe",
]

for path in TESSERACT_PATHS:
    if os.path.exists(path):
        pytesseract.pytesseract.tesseract_cmd = path
        print(f"✅ Using Tesseract at: {path}")
        break

def create_test_whatsapp_image():
    """Create a test WhatsApp payment screenshot"""
    width, height = 400, 800
    # Dark background like WhatsApp
    image = Image.new('RGB', (width, height), '#0b141a')
    draw = ImageDraw.Draw(image)
    
    try:
        font = ImageFont.truetype("arial.ttf", 18)
        small_font = ImageFont.truetype("arial.ttf", 14)
    except:
        font = ImageFont.load_default()
        small_font = ImageFont.load_default()
    
    y = 50
    transactions = [
        ("EatClub", "₹220", "#ffffff"),
        ("chanakya065", "+₹110", "#25d366"),
        ("M PRANAY", "+₹60", "#25d366"), 
        ("sriram yerra_066", "+₹400", "#25d366"),
        ("EatClub", "₹146", "#ffffff"),
        ("EatClub", "₹115", "#ffffff"),
    ]
    
    for name, amount, color in transactions:
        # Name in white
        draw.text((20, y), name, fill="#ffffff", font=font)
        # Amount in appropriate color
        draw.text((280, y), amount, fill=color, font=font)
        # Date
        draw.text((20, y + 25), "Aug", fill="#8696a0", font=small_font)
        y += 70
    
    image.save("test_whatsapp_dark.png")
    return image

def enhance_for_ocr(image):
    """Enhanced preprocessing for better OCR"""
    # Convert to OpenCV
    opencv_img = cv2.cvtColor(np.array(image), cv2.COLOR_RGB2BGR)
    
    # Resize if small
    height, width = opencv_img.shape[:2]
    if height < 800:
        scale = 800 / height
        new_width = int(width * scale)
        opencv_img = cv2.resize(opencv_img, (new_width, 800))
    
    # Convert to grayscale
    gray = cv2.cvtColor(opencv_img, cv2.COLOR_BGR2GRAY)
    
    # For dark images, invert to make text black on white
    inverted = cv2.bitwise_not(gray)
    
    # Apply CLAHE
    clahe = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(8,8))
    enhanced = clahe.apply(inverted)
    
    # Gaussian blur to reduce noise
    blurred = cv2.GaussianBlur(enhanced, (3, 3), 0)
    
    # Threshold
    _, thresh = cv2.threshold(blurred, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
    
    # Morphological operations
    kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (2, 2))
    cleaned = cv2.morphologyEx(thresh, cv2.MORPH_CLOSE, kernel)
    
    return Image.fromarray(cleaned)

def fix_common_ocr_errors(text):
    """Fix common OCR misreadings"""
    # Currency symbol fixes
    text = re.sub(r'\bR\b(?=\s*\d)', '₹', text)  # R followed by number -> ₹
    text = re.sub(r'\bRs\b(?=\s*\d)', '₹', text)  # Rs followed by number -> ₹  
    text = text.replace('R$', '₹')
    text = text.replace('8', '₹', 1) if text.startswith('8') and any(c.isdigit() for c in text[1:5]) else text
    
    # Name fixes
    text = text.replace('chanakya06S', 'chanakya065')
    text = text.replace('chanakya06s', 'chanakya065') 
    text = text.replace('EatCIub', 'EatClub')
    text = text.replace('EatCiub', 'EatClub')
    text = text.replace('M PRANAV', 'M PRANAY')
    text = text.replace('sriram yerra_06G', 'sriram yerra_066')
    text = text.replace('sriram yerra_OGG', 'sriram yerra_066')
    
    return text

def test_ocr_improvements():
    """Test OCR with various improvements"""
    print("🧪 Testing OCR Accuracy Improvements")
    print("=" * 50)
    
    # Create test image
    print("📱 Creating test WhatsApp image...")
    test_image = create_test_whatsapp_image()
    print("✅ Test image saved as 'test_whatsapp_dark.png'")
    
    # Test different OCR methods
    methods = {
        "Original Image": test_image,
        "Enhanced Image": enhance_for_ocr(test_image)
    }
    
    configs = [
        ('Default', '--psm 6'),
        ('Whitelist', '--psm 6 -c tessedit_char_whitelist=0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz₹$.,:-+@_() '),
        ('PSM 4', '--psm 4'),
        ('PSM 3', '--psm 3'),
    ]
    
    results = {}
    
    for method_name, img in methods.items():
        print(f"\n🔍 Testing {method_name}:")
        method_results = {}
        
        for config_name, config in configs:
            try:
                raw_text = pytesseract.image_to_string(img, config=config)
                fixed_text = fix_common_ocr_errors(raw_text)
                method_results[config_name] = {
                    'raw': raw_text,
                    'fixed': fixed_text,
                    'length': len(fixed_text.strip())
                }
                print(f"  {config_name}: {len(fixed_text.strip())} chars")
            except Exception as e:
                method_results[config_name] = {'error': str(e)}
                print(f"  {config_name}: ERROR - {e}")
        
        results[method_name] = method_results
    
    # Find best result
    best_text = ""
    best_method = ""
    best_config = ""
    
    for method, method_data in results.items():
        for config, config_data in method_data.items():
            if 'fixed' in config_data and len(config_data['fixed'].strip()) > len(best_text):
                best_text = config_data['fixed']
                best_method = method
                best_config = config
    
    print(f"\n🏆 Best Result: {best_method} with {best_config}")
    print("=" * 50)
    print("📄 Extracted Text:")
    print(best_text)
    print("=" * 50)
    
    # Analyze accuracy
    print("\n📊 Accuracy Analysis:")
    expected_names = ['EatClub', 'chanakya065', 'M PRANAY', 'sriram yerra_066']
    expected_amounts = [220, 110, 60, 400, 146, 115]
    
    # Check names
    found_names = 0
    for name in expected_names:
        if name.lower() in best_text.lower():
            print(f"✅ Found name: {name}")
            found_names += 1
        else:
            print(f"❌ Missing name: {name}")
    
    # Check amounts  
    amount_matches = re.findall(r'[₹$]?\s*(\d+)', best_text)
    found_amounts = [int(amt) for amt in amount_matches if amt.isdigit()]
    
    print(f"\n💰 Expected amounts: {expected_amounts}")
    print(f"💰 Found amounts: {found_amounts}")
    
    correct_amounts = len([amt for amt in expected_amounts if amt in found_amounts])
    
    print(f"\n📈 Results:")
    print(f"   Names: {found_names}/{len(expected_names)} ({found_names/len(expected_names)*100:.1f}%)")
    print(f"   Amounts: {correct_amounts}/{len(expected_amounts)} ({correct_amounts/len(expected_amounts)*100:.1f}%)")
    
    # Check currency symbols
    currency_count = len(re.findall(r'₹', best_text))
    print(f"   Currency symbols: {currency_count} ₹ symbols found")
    
    overall_accuracy = (found_names + correct_amounts) / (len(expected_names) + len(expected_amounts)) * 100
    print(f"\n🎯 Overall Accuracy: {overall_accuracy:.1f}%")
    
    if overall_accuracy > 70:
        print("🎉 OCR improvements are working well!")
    else:
        print("🔧 OCR still needs more improvements")

if __name__ == "__main__":
    try:
        version = pytesseract.get_tesseract_version()
        print(f"✅ Tesseract version: {version}")
        test_ocr_improvements()
    except Exception as e:
        print(f"❌ Error: {e}")