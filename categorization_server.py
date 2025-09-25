#!/usr/bin/env python3
"""
Simple AI Categorization Server
Only handles merchant categorization with Gemini AI
"""

import os
import json
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import google.generativeai as genai

# Load environment variables
load_dotenv()

# Simple in-memory cache for AI categorizations
AI_CACHE = {}

# Configure Google AI (Gemini)
GOOGLE_AI_API_KEY = os.getenv("GOOGLE_AI_API_KEY")
GEMINI_AVAILABLE = False

try:
    if GOOGLE_AI_API_KEY:
        genai.configure(api_key=GOOGLE_AI_API_KEY)
        print("✅ Gemini AI configured successfully!")
        GEMINI_AVAILABLE = True
    else:
        print("⚠️  Google AI API key not found. Using fallback categorization.")
except Exception as e:
    print(f"❌ Gemini AI configuration failed: {e}")
    GEMINI_AVAILABLE = False

# Categories
CATEGORIES = [
    "Food", "Entertainment", "Travelling", "Clothes", 
    "Health", "Bills", "Groceries", "Other", "Personal"
]

# FastAPI app
app = FastAPI(
    title="AI Categorization API",
    description="Simple AI-powered merchant categorization service"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5000", "http://127.0.0.1:5000", "*"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)

def get_ai_category_prediction(merchant_name: str) -> dict:
    """Get AI category prediction using Gemini with caching"""
    # Check cache first
    cache_key = merchant_name.lower().strip()
    if cache_key in AI_CACHE:
        cached_result = AI_CACHE[cache_key].copy()
        cached_result["source"] = "cache"
        print(f"✅ Cache hit for: {merchant_name}")
        return cached_result
    
    if not GEMINI_AVAILABLE:
        # Simple rule-based fallback
        merchant_lower = merchant_name.lower()
        
        rules = {
            "Food": ['coffee', 'restaurant', 'cafe', 'pizza', 'burger', 'starbucks', 'mcdonalds', 'kfc', 'subway', 'dominos', 'food', 'kitchen'],
            "Travelling": ['uber', 'lyft', 'taxi', 'gas', 'fuel', 'airlines', 'hotel', 'flight', 'train', 'bus'],
            "Entertainment": ['netflix', 'spotify', 'cinema', 'movie', 'theater', 'game', 'music'],
            "Clothes": ['h&m', 'zara', 'nike', 'adidas', 'clothing', 'fashion', 'apparel'],
            "Health": ['pharmacy', 'doctor', 'hospital', 'medical', 'cvs', 'walgreens', 'medicine'],
            "Bills": ['electric', 'electricity', 'gas', 'internet', 'phone', 'utilities', 'verizon', 'att'],
            "Groceries": ['grocery', 'supermarket', 'walmart', 'target', 'costco', 'store', 'market', 'general store', 'cyber', 'punk']
        }
        
        for category, keywords in rules.items():
            for keyword in keywords:
                if keyword in merchant_lower:
                    result = {"category": category, "confidence": 0.8, "reasoning": f"Matched {category.lower()} keyword: {keyword}", "source": "rules"}
                    # Cache the result
                    AI_CACHE[cache_key] = result.copy()
                    AI_CACHE[cache_key].pop("source", None)
                    print(f"✅ Cached rule-based result: {merchant_name} -> {category}")
                    return result
        
        result = {"category": "Other", "confidence": 0.5, "reasoning": "No matching keywords found", "source": "rules"}
        AI_CACHE[cache_key] = result.copy()
        AI_CACHE[cache_key].pop("source", None)
        return result
    
    # Use Gemini AI
    try:
        prompt = f"""You are a financial categorization AI. Categorize this merchant into one of these categories:
{', '.join(CATEGORIES)}

Merchant: "{merchant_name}"

Respond with only a JSON object:
{{"category": "Category_Name", "confidence": 0.95, "reasoning": "Brief explanation"}}"""

        model = genai.GenerativeModel('gemini-1.5-flash-8b')
        response = model.generate_content(prompt)
        
        response_text = response.text.strip()
        cleaned_response = response_text.replace('```json', '').replace('```', '').strip()
        
        result = json.loads(cleaned_response)
        
        if result.get('category') not in CATEGORIES:
            result['category'] = 'Other'
            result['confidence'] = max(0.3, result.get('confidence', 0.5) - 0.2)
        
        result["source"] = "ai"
        
        # Cache the AI result
        cached_result = result.copy()
        cached_result.pop("source", None)
        AI_CACHE[cache_key] = cached_result
        print(f"✅ Cached AI result: {merchant_name} -> {result['category']}")
        
        return result
        
    except Exception as e:
        print(f"❌ Gemini AI error: {e}")
        return {"category": "Other", "confidence": 0.3, "reasoning": f"AI error: {str(e)[:100]}", "source": "error"}

@app.get("/")
async def root():
    """Root endpoint with API information"""
    return {
        "message": "AI Categorization API",
        "endpoints": [
            "/get-category/{merchant_name} (GET)",
            "/get-category/ (POST)",
            "/categories/ (GET)",
            "/cache-status/ (GET)"
        ],
        "status": {
            "gemini_available": GEMINI_AVAILABLE,
            "categories_count": len(CATEGORIES),
            "cached_merchants": len(AI_CACHE)
        }
    }

@app.get("/get-category/{merchant_name}")
async def get_category_get(merchant_name: str):
    """Get AI category prediction for a merchant name via GET"""
    try:
        result = get_ai_category_prediction(merchant_name)
        return JSONResponse(content=result)
    except Exception as e:
        print(f"❌ Error categorizing {merchant_name}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error categorizing merchant: {str(e)}")

@app.post("/get-category/")
async def get_category_post(request: dict):
    """Get AI category prediction for a merchant name via POST"""
    try:
        # Handle both 'text' and 'name' fields for flexibility
        merchant_name = request.get('text') or request.get('name', '')
        if not merchant_name:
            raise HTTPException(status_code=400, detail="Either 'text' or 'name' field is required")
            
        result = get_ai_category_prediction(merchant_name)
        return JSONResponse(content=result)
    except Exception as e:
        print(f"❌ Error categorizing merchant: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error categorizing merchant: {str(e)}")

@app.get("/categories/")
async def get_categories():
    """Get all available categories"""
    return {"categories": CATEGORIES}

@app.get("/cache-status/")
async def get_cache_status():
    """Get cache status"""
    return {
        "cached_merchants": len(AI_CACHE),
        "gemini_available": GEMINI_AVAILABLE,
        "cache_keys": list(AI_CACHE.keys())
    }

@app.get("/api-status/")
async def api_status():
    """API status endpoint that frontend expects"""
    return {
        "status": "online",
        "message": "AI Categorization API is running",
        "gemini_available": GEMINI_AVAILABLE,
        "categories_count": len(CATEGORIES),
        "cached_merchants": len(AI_CACHE),
        "endpoints": [
            "/get-category/{merchant_name} (GET)",
            "/get-category/ (POST)",
            "/categories/ (GET)",
            "/cache-status/ (GET)",
            "/api-status/ (GET)"
        ]
    }

if __name__ == "__main__":
    import uvicorn
    
    print("\n" + "="*50)
    print("🚀 Starting AI Categorization Server")
    print("="*50)
    print(f"Gemini AI: {'Available' if GEMINI_AVAILABLE else 'Unavailable (using rules)'}")
    print(f"Categories: {len(CATEGORIES)}")
    print("="*50)
    print("Ready to categorize merchants!")
    print("="*50)
    
    uvicorn.run(app, host="0.0.0.0", port=8002)