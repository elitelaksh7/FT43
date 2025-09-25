#!/usr/bin/env python3
"""
Simple OCR Test Server - Standalone version for testing
"""

import os
import sys
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from PIL import Image
import pytesseract
import cv2
import numpy as np
import re
from io import BytesIO

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

app = FastAPI(title="Simple OCR Test API")

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def enhance_image_for_ocr(image):
    """Enhanced image preprocessing for better OCR"""
    try:
        # Convert to OpenCV format
        opencv_image = cv2.cvtColor(np.array(image), cv2.COLOR_RGB2BGR)
        
        # Resize if too small
        height, width = opencv_image.shape[:2]
        if height < 600:
            scale = 600 / height
            new_width = int(width * scale)
            opencv_image = cv2.resize(opencv_image, (new_width, 600))
        
        # Convert to grayscale
        gray = cv2.cvtColor(opencv_image, cv2.COLOR_BGR2GRAY)
        
        # Apply CLAHE for better contrast
        clahe = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(8,8))
        enhanced = clahe.apply(gray)
        
        # Apply threshold
        _, binary = cv2.threshold(enhanced, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
        
        return Image.fromarray(binary)
    except:
        return image

@app.post("/test-ocr/")
async def test_ocr(file: UploadFile = File(...)):
    """Test OCR with improved accuracy"""
    try:
        # Read image
        contents = await file.read()
        image = Image.open(BytesIO(contents))
        
        # Convert to RGB
        if image.mode != 'RGB':
            image = image.convert('RGB')
        
        print(f"Processing image: {image.size}")
        
        # Test multiple OCR approaches
        results = {}
        
        # Original image
        try:
            original_text = pytesseract.image_to_string(image, config='--psm 6')
            results['original'] = original_text[:200] + "..." if len(original_text) > 200 else original_text
        except Exception as e:
            results['original'] = f"Error: {e}"
        
        # Enhanced image
        try:
            enhanced_image = enhance_image_for_ocr(image)
            enhanced_text = pytesseract.image_to_string(enhanced_image, config='--psm 6')
            results['enhanced'] = enhanced_text[:200] + "..." if len(enhanced_text) > 200 else enhanced_text
        except Exception as e:
            results['enhanced'] = f"Error: {e}"
        
        # With character whitelist
        try:
            whitelist_text = pytesseract.image_to_string(
                image, 
                config='--psm 6 -c tessedit_char_whitelist=0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz₹$.,:-+@_() '
            )
            results['whitelist'] = whitelist_text[:200] + "..." if len(whitelist_text) > 200 else whitelist_text
        except Exception as e:
            results['whitelist'] = f"Error: {e}"
        
        # Extract transactions from best result
        best_text = ""
        for method, text in results.items():
            if isinstance(text, str) and len(text) > len(best_text):
                best_text = text
        
        # Parse transactions
        transactions = parse_transactions(best_text)
        
        return {
            "success": True,
            "image_size": f"{image.size[0]}x{image.size[1]}",
            "ocr_methods": results,
            "best_text_length": len(best_text),
            "transactions_found": len(transactions),
            "transactions": transactions[:5],  # First 5 transactions
            "improvements": {
                "currency_symbols_found": len(re.findall(r'[₹$£€]', best_text)),
                "names_detected": detect_names(best_text),
                "amounts_detected": detect_amounts(best_text)
            }
        }
        
    except Exception as e:
        return {"success": False, "error": str(e)}

def parse_transactions(text):
    """Simple transaction parsing"""
    transactions = []
    lines = text.split('\n')
    
    for line in lines:
        line = line.strip()
        if not line:
            continue
            
        # Look for amounts
        amount_match = re.search(r'[₹$]?\s*(\d+(?:,\d+)*(?:\.\d{2})?)', line)
        if amount_match:
            amount = float(amount_match.group(1).replace(',', ''))
            
            # Extract name
            name = line.replace(amount_match.group(0), '').strip()
            name = re.sub(r'[+\-]', '', name).strip()
            
            if name and len(name) > 1:
                transactions.append({
                    "name": name[:30],
                    "amount": amount,
                    "original_line": line
                })
    
    return transactions

def detect_names(text):
    """Detect potential names"""
    names = re.findall(r'[A-Z][a-zA-Z0-9_]{2,}|[a-z]+[0-9]{2,}', text)
    return names[:10]  # First 10 names

def detect_amounts(text):
    """Detect amounts"""
    amounts = re.findall(r'[₹$£€]?\s*(\d+(?:,\d+)*(?:\.\d{2})?)', text)
    return [float(amt.replace(',', '')) for amt in amounts if amt][:10]

@app.get("/")
async def root():
    return {"message": "Simple OCR Test API", "endpoint": "/test-ocr/"}

if __name__ == "__main__":
    print("🚀 Starting Simple OCR Test Server")
    uvicorn.run(app, host="0.0.0.0", port=8003)