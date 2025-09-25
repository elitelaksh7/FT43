#!/usr/bin/env python3
"""
Test script to verify real OCR functionality
Creates a test image with text and processes it
"""

from PIL import Image, ImageDraw, ImageFont
import pytesseract
import os

# Configure Tesseract path
TESSERACT_PATHS = [
    r"C:\Program Files\Tesseract-OCR\tesseract.exe",
    r"C:\Program Files (x86)\Tesseract-OCR\tesseract.exe",
    r"C:\Tesseract-OCR\tesseract.exe"
]

for path in TESSERACT_PATHS:
    if os.path.exists(path):
        pytesseract.pytesseract.tesseract_cmd = path
        print(f"📍 Using Tesseract at: {path}")
        break

def create_test_receipt_image():
    """Create a simple test receipt image"""
    # Create a white image
    width, height = 400, 600
    image = Image.new('RGB', (width, height), 'white')
    draw = ImageDraw.Draw(image)
    
    # Try to use a font, fallback to default
    try:
        font = ImageFont.truetype("arial.ttf", 20)
        small_font = ImageFont.truetype("arial.ttf", 16)
    except:
        font = ImageFont.load_default()
        small_font = ImageFont.load_default()
    
    # Draw receipt content
    y_pos = 30
    
    # Header
    draw.text((50, y_pos), "STARBUCKS COFFEE", fill='black', font=font)
    y_pos += 40
    draw.text((50, y_pos), "123 Main Street", fill='black', font=small_font)
    y_pos += 30
    draw.text((50, y_pos), "City, State 12345", fill='black', font=small_font)
    y_pos += 50
    
    # Date and transaction
    draw.text((50, y_pos), "Date: 2024-01-15", fill='black', font=small_font)
    y_pos += 30
    draw.text((50, y_pos), "Transaction ID: TXN123456", fill='black', font=small_font)
    y_pos += 50
    
    # Items
    draw.text((50, y_pos), "Grande Latte         $5.45", fill='black', font=small_font)
    y_pos += 30
    draw.text((50, y_pos), "Blueberry Muffin     $3.25", fill='black', font=small_font)
    y_pos += 30
    draw.text((50, y_pos), "Tax                  $0.70", fill='black', font=small_font)
    y_pos += 40
    
    # Draw line
    draw.line([(50, y_pos), (350, y_pos)], fill='black', width=2)
    y_pos += 20
    
    # Total
    draw.text((50, y_pos), "TOTAL:              $9.40", fill='black', font=font)
    y_pos += 60
    
    # Footer
    draw.text((50, y_pos), "Thank you for visiting!", fill='black', font=small_font)
    
    return image

def test_ocr():
    """Test OCR functionality"""
    print("🧪 Creating test receipt image...")
    
    # Create test image
    test_image = create_test_receipt_image()
    test_image.save("test_receipt.png")
    print("✅ Test receipt image saved as 'test_receipt.png'")
    
    # Test OCR
    print("🔍 Running OCR on test image...")
    try:
        ocr_text = pytesseract.image_to_string(test_image)
        print("\n📄 OCR Results:")
        print("="*50)
        print(ocr_text)
        print("="*50)
        
        # Check if key words were detected
        key_words = ["STARBUCKS", "TOTAL", "$9.40", "Latte"]
        detected_words = []
        
        for word in key_words:
            if word in ocr_text.upper():
                detected_words.append(word)
        
        print(f"\n✅ Detected {len(detected_words)}/{len(key_words)} key words: {detected_words}")
        
        if len(detected_words) >= 2:
            print("🎉 OCR is working correctly!")
            return True
        else:
            print("⚠️ OCR might need improvement")
            return False
            
    except Exception as e:
        print(f"❌ OCR failed: {e}")
        return False

if __name__ == "__main__":
    print("🚀 Testing Real OCR Functionality")
    print("="*40)
    
    try:
        version = pytesseract.get_tesseract_version()
        print(f"✅ Tesseract version: {version}")
    except Exception as e:
        print(f"❌ Tesseract not available: {e}")
        exit(1)
    
    success = test_ocr()
    
    if success:
        print("\n🎊 Real OCR is ready for your images!")
    else:
        print("\n🔧 OCR needs debugging")