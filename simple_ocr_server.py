#!/usr/bin/env python3
"""
Simplified OCR and Categorization Server
A lightweight server that provides OCR and AI categorization functionality
"""

import os
import sys
import json
import base64
from datetime import datetime
from io import BytesIO

try:
    from fastapi import FastAPI, File, UploadFile, HTTPException
    from fastapi.middleware.cors import CORSMiddleware
    from fastapi.responses import JSONResponse
    from pydantic import BaseModel
    import uvicorn
except ImportError:
    print("Missing required packages. Please install:")
    print("pip install fastapi uvicorn python-multipart")
    sys.exit(1)

# Optional imports
try:
    from PIL import Image
    PIL_AVAILABLE = True
except ImportError:
    PIL_AVAILABLE = False
    print("PIL not available - using mock OCR")

try:
    import google.generativeai as genai
    from dotenv import load_dotenv
    load_dotenv()
    GOOGLE_AI_API_KEY = os.getenv("GOOGLE_AI_API_KEY")
    if GOOGLE_AI_API_KEY:
        genai.configure(api_key=GOOGLE_AI_API_KEY)
        GEMINI_AVAILABLE = True
        print("✅ Gemini AI configured")
    else:
        GEMINI_AVAILABLE = False
        print("⚠️ Gemini AI not configured - using mock categorization")
except ImportError:
    GEMINI_AVAILABLE = False
    print("⚠️ Gemini AI not available - using mock categorization")

app = FastAPI(
    title="Simple OCR & Categorization API",
    description="Lightweight API for OCR processing and AI categorization",
    version="1.0.0"
)

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Categories
CATEGORIES = [
    "Food", "Entertainment", "Travelling", "Clothes", 
    "Health", "Bills", "Groceries", "Other", "Personal"
]

class TransactionRequest(BaseModel):
    text: str

@app.get("/")
async def root():
    return {
        "message": "Simple OCR & Categorization API",
        "endpoints": [
            "/parse-image/",
            "/parse-payment-app/", 
            "/get-category/{merchant_name}",
            "/categorize-text/"
        ],
        "status": {
            "pil_available": PIL_AVAILABLE,
            "gemini_available": GEMINI_AVAILABLE,
            "categories": len(CATEGORIES)
        }
    }

def mock_ocr_receipt(image_data: bytes) -> dict:
    """Mock OCR processing for receipt"""
    return {
        "recipientName": "Sample Store",
        "amount": 45.99,
        "isDebit": True,
        "timestamp": datetime.now().isoformat(),
        "billNumber": f"INV-{datetime.now().strftime('%Y%m%d')}-001",
        "lineItems": [
            {
                "id": "1",
                "description": "Coffee",
                "quantity": 2,
                "unitPrice": 4.50,
                "total": 9.00,
                "category": "Food"
            },
            {
                "id": "2", 
                "description": "Sandwich",
                "quantity": 1,
                "unitPrice": 12.99,
                "total": 12.99,
                "category": "Food"
            }
        ],
        "confidence": 0.85,
        "raw_text_from_ocr": f"Mock OCR processing - Image size: {len(image_data)} bytes"
    }

def mock_ocr_payment_app(image_data: bytes) -> dict:
    """Mock OCR processing for payment app screenshot"""
    return {
        "transactions": [
            {
                "merchant": "Coffee Shop",
                "amount": 4.50,
                "date": "Today",
                "type": "debit"
            },
            {
                "merchant": "Grocery Store", 
                "amount": 67.89,
                "date": "Yesterday",
                "type": "debit"
            },
            {
                "merchant": "Salary Deposit",
                "amount": 2500.00,
                "date": "2 days ago", 
                "type": "credit"
            }
        ],
        "count": 3,
        "app_detected": "Mock Payment App",
        "confidence": 0.78,
        "raw_text_from_ocr": f"Mock payment app OCR - Image size: {len(image_data)} bytes"
    }

def get_ai_category_prediction(merchant_name: str) -> dict:
    """Get AI category prediction using Gemini or fallback"""
    if not GEMINI_AVAILABLE:
        # Simple rule-based fallback
        merchant_lower = merchant_name.lower()
        
        food_keywords = ['coffee', 'restaurant', 'cafe', 'pizza', 'burger', 'starbucks', 'mcdonalds', 'kfc', 'subway']
        travel_keywords = ['uber', 'lyft', 'taxi', 'gas', 'fuel', 'airlines', 'hotel']
        entertainment_keywords = ['netflix', 'spotify', 'cinema', 'movie', 'theater']
        clothes_keywords = ['h&m', 'zara', 'nike', 'adidas', 'clothing']
        health_keywords = ['pharmacy', 'doctor', 'hospital', 'medical', 'cvs', 'walgreens']
        bills_keywords = ['electric', 'gas', 'internet', 'phone', 'utilities', 'verizon', 'att']
        groceries_keywords = ['grocery', 'supermarket', 'walmart', 'target', 'costco']
        
        for keyword in food_keywords:
            if keyword in merchant_lower:
                return {"category": "Food", "confidence": 0.8, "reasoning": f"Matched food keyword: {keyword}"}
        
        for keyword in travel_keywords:
            if keyword in merchant_lower:
                return {"category": "Travelling", "confidence": 0.8, "reasoning": f"Matched travel keyword: {keyword}"}
        
        for keyword in entertainment_keywords:
            if keyword in merchant_lower:
                return {"category": "Entertainment", "confidence": 0.8, "reasoning": f"Matched entertainment keyword: {keyword}"}
                
        for keyword in clothes_keywords:
            if keyword in merchant_lower:
                return {"category": "Clothes", "confidence": 0.8, "reasoning": f"Matched clothes keyword: {keyword}"}
                
        for keyword in health_keywords:
            if keyword in merchant_lower:
                return {"category": "Health", "confidence": 0.8, "reasoning": f"Matched health keyword: {keyword}"}
                
        for keyword in bills_keywords:
            if keyword in merchant_lower:
                return {"category": "Bills", "confidence": 0.8, "reasoning": f"Matched bills keyword: {keyword}"}
                
        for keyword in groceries_keywords:
            if keyword in merchant_lower:
                return {"category": "Groceries", "confidence": 0.8, "reasoning": f"Matched groceries keyword: {keyword}"}
        
        return {"category": "Other", "confidence": 0.5, "reasoning": "No matching keywords found"}
    
    # Use Gemini AI
    try:
        prompt = f"""You are a financial categorization AI. Categorize this merchant into one of these categories:
{', '.join(CATEGORIES)}

Merchant: "{merchant_name}"

Respond with only a JSON object:
{{"category": "Category_Name", "confidence": 0.95, "reasoning": "Brief explanation"}}"""

        model = genai.GenerativeModel('gemini-1.5-flash')
        response = model.generate_content(prompt)
        
        # Clean and parse response
        response_text = response.text.strip()
        cleaned_response = response_text.replace('```json', '').replace('```', '').strip()
        
        result = json.loads(cleaned_response)
        
        # Validate category
        if result.get('category') not in CATEGORIES:
            result['category'] = 'Other'
            result['confidence'] = max(0.3, result.get('confidence', 0.5) - 0.2)
        
        return result
        
    except Exception as e:
        print(f"Gemini AI error: {e}")
        return {"category": "Other", "confidence": 0.3, "reasoning": f"AI error: {str(e)[:100]}"}

@app.post("/parse-image/")
async def parse_image(file: UploadFile = File(...)):
    """Parse receipt/bill image with OCR"""
    try:
        # Read image data
        image_data = await file.read()
        
        # For now, use mock OCR
        result = mock_ocr_receipt(image_data)
        
        # Add AI categorization
        if result.get("recipientName"):
            category_info = get_ai_category_prediction(result["recipientName"])
            result.update({
                "ai_category": category_info["category"],
                "ai_confidence": category_info["confidence"], 
                "ai_reasoning": category_info["reasoning"]
            })
        
        return JSONResponse(content=result)
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing image: {str(e)}")

@app.post("/parse-payment-app/")
async def parse_payment_app(file: UploadFile = File(...)):
    """Parse payment app screenshot with OCR"""
    try:
        # Read image data
        image_data = await file.read()
        
        # For now, use mock OCR
        result = mock_ocr_payment_app(image_data)
        
        return JSONResponse(content=result)
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing payment app image: {str(e)}")

@app.get("/get-category/{merchant_name}")
async def get_category(merchant_name: str):
    """Get AI category prediction for a merchant name"""
    try:
        result = get_ai_category_prediction(merchant_name)
        return JSONResponse(content=result)
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error categorizing merchant: {str(e)}")

@app.post("/categorize-text/")
async def categorize_text(request: TransactionRequest):
    """Categorize transaction text"""
    try:
        # Extract merchant name from transaction text
        merchant_name = request.text
        
        # Simple extraction - look for common patterns
        if "at " in merchant_name.lower():
            merchant_name = merchant_name.split("at ")[-1].split(" on")[0].strip()
        elif "to " in merchant_name.lower():
            merchant_name = merchant_name.split("to ")[-1].split(" on")[0].strip()
        
        result = get_ai_category_prediction(merchant_name)
        result["extracted_merchant"] = merchant_name
        result["original_text"] = request.text
        
        return JSONResponse(content=result)
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error categorizing text: {str(e)}")

@app.get("/api-status/")
async def api_status():
    """Get API status and configuration"""
    return {
        "google_ai_status": "configured" if GEMINI_AVAILABLE else "not configured",
        "google_ai_key_present": GEMINI_AVAILABLE,
        "pil_available": PIL_AVAILABLE,
        "fallback_mode": not GEMINI_AVAILABLE,
        "categories": CATEGORIES,
        "server_time": datetime.now().isoformat()
    }

if __name__ == "__main__":
    print("\n" + "="*50)
    print("🚀 Starting Simple OCR & Categorization Server")
    print("="*50)
    print(f"PIL Available: {PIL_AVAILABLE}")
    print(f"Gemini AI Available: {GEMINI_AVAILABLE}")
    print(f"Categories: {len(CATEGORIES)}")
    print("="*50)
    
    uvicorn.run(
        app, 
        host="0.0.0.0", 
        port=8002, 
        log_level="info",
        access_log=True
    )