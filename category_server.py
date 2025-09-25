#!/usr/bin/env python3
"""
Lightweight Categorization API Server

This script creates a standalone FastAPI server that provides just the 
merchant categorization functionality using the Gemini AI API.

Run with:
  python category_server.py

The server will run on port 8002 and provide the following endpoints:
- GET /get-category/{merchant_name} - Get category for a merchant name
- GET /api-status/ - Check API status
"""

import os
import json
import uvicorn
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import google.generativeai as genai
from dotenv import load_dotenv
from typing import List, Dict, Any, Optional, Union

# --- 1. Configuration & Initialization ---

# Load environment variables
load_dotenv()

# Configure Google AI (Gemini)
GOOGLE_AI_API_KEY = os.getenv("GOOGLE_AI_API_KEY")
if GOOGLE_AI_API_KEY:
    genai.configure(api_key=GOOGLE_AI_API_KEY)
    print("✅ Google AI (Gemini) configured successfully!")
else:
    print("⚠️  Google AI API key not found. Using fallback categorization.")
    print("   Set GOOGLE_AI_API_KEY in your .env file for enhanced AI categorization.")

# Standard Categories
CATEGORIES = [
    "Food", "Entertainment", "Travelling", "Clothes", 
    "Health", "Bills", "Groceries", "Other", "Personal"
]

# Create FastAPI app
app = FastAPI(
    title="WalletWise AI Category API",
    description="AI-powered merchant categorization API",
    version="1.0.0"
)

# Configure CORS - Allow all origins for testing
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- 2. Helper Functions ---

def get_all_categories() -> List[str]:
    """Get all available categories including any custom ones"""
    # For now, just return standard categories
    # In a full implementation, this would also include user's custom categories
    return CATEGORIES

def get_ai_category_prediction(receiver_name: str, examples: Optional[List[Dict[str, str]]] = None) -> Dict[str, Any]:
    """
    Use the Gemini model to predict the category of a merchant.
    Returns a dictionary with category information.
    """
    
    # If no API key, return fallback
    if not GOOGLE_AI_API_KEY:
        print(f"❌ No Gemini API key found for '{receiver_name}' - using fallback")
        return {
            "primary_category": "Other",
            "confidence": 0.0,
            "reasoning": "No AI API key configured - using fallback",
            "alternatives": []
        }
    
    print(f"🔑 Using Gemini API for '{receiver_name}'...")
    
    # Default examples if none provided
    if examples is None:
        examples = [
            {"receiver": "Zomato", "category": "Food"},
            {"receiver": "Netflix", "category": "Entertainment"},
            {"receiver": "Uber", "category": "Travelling"},
            {"receiver": "H&M", "category": "Clothes"},
            {"receiver": "Apollo Pharmacy", "category": "Health"},
            {"receiver": "Airtel", "category": "Bills"},
            {"receiver": "BigBasket", "category": "Groceries"}
        ]
    
    # Build examples section
    prompt_examples = ""
    if examples:
        prompt_examples = "Here are some examples from the user's transaction history:\n"
        for eg in examples:
            prompt_examples += f"• {eg['receiver']} → {eg['category']}\n"
        prompt_examples += "\n"
    
    # Get all available categories
    all_categories = get_all_categories()
    
    # Enhanced prompt with pattern recognition
    prompt = f"""You are an expert financial categorization AI for an Indian fintech app with advanced pattern recognition capabilities.

AVAILABLE CATEGORIES: {', '.join(all_categories)}

STANDARD CATEGORY DEFINITIONS:
- Food: Restaurants, cafes, food delivery, groceries (Starbucks, McDonald's, Zomato, Swiggy)
- Entertainment: Streaming, movies, games, concerts (Netflix, Spotify, BookMyShow, Prime Video)
- Travelling: Transport, fuel, travel booking (Uber, Ola, Shell, HP Petrol, IRCTC, Airlines)
- Clothes: Fashion, apparel, footwear (H&M, Zara, Myntra, Nike, Adidas)
- Health: Pharmacy, hospitals, medical (Apollo Pharmacy, 1mg, Practo, Netmeds)
- Bills: Utilities, phone, internet (Jio, Airtel, BSNL, electricity, gas)
- Groceries: Supermarkets, daily essentials (BigBasket, Grofers, Blinkit, DMart)
- Other: General marketplaces, unclear merchants (Amazon, Flipkart, unknown stores)

CRITICAL PATTERN LEARNING INSTRUCTIONS:
1. **LEARN FROM USER CORRECTIONS**: If the user has corrected similar brands to custom categories, follow that pattern!
2. **BRAND SIMILARITY**: Nike, Adidas, Puma, Reebok are all similar sportswear brands
3. **CUSTOM CATEGORIES**: User may create categories like "Shoes", "Electronics", "Personal Care" - respect these preferences
4. **PRIORITY**: User-created patterns > Standard definitions
5. **NEW CATEGORIES**: If a merchant doesn't fit well into existing categories, suggest a NEW appropriate category name (e.g., "Fitness", "Wellness", "Pet Care", "Hobbies") instead of defaulting to "Other"

{prompt_examples}MERCHANT: "{receiver_name}"

🔍 PATTERN ANALYSIS:
- Look at the examples above for similar brands or keywords
- If user corrected "Nike" to "Shoes", then "Adidas", "Puma" should also be "Shoes"
- If user corrected "Apple Store" to "Electronics", then "Samsung Store" should also be "Electronics"
- Follow user preferences over standard categories!
- If no existing category fits well, suggest a NEW specific category rather than "Other"

Analyze this merchant name and respond with ONLY valid JSON (no markdown, no extra text):
{{
  "primary_category": "Category_Name",
  "confidence": 0.95,
  "reasoning": "Explain pattern recognition and user preference learning",
  "alternatives": [
    {{"category": "Alternative1", "confidence": 0.03}},
    {{"category": "Alternative2", "confidence": 0.02}}
  ]
}}"""

    try:
        # Use the latest Gemini model with optimized settings
        generation_config = genai.types.GenerationConfig(
            temperature=0.1,
            top_p=0.8,
            top_k=40,
            max_output_tokens=1024
        )
        
        model = genai.GenerativeModel(
            'gemini-1.5-flash',
            generation_config=generation_config
        )
        response = model.generate_content(prompt)
        response_text = response.text.strip()
        
        print(f"🤖 AI Response for '{receiver_name}': {response_text[:200]}...")
        
        try:
            # Try to parse JSON response - clean markdown code blocks first
            cleaned_response = response_text.replace('```json', '').replace('```', '').strip()
            ai_response = json.loads(cleaned_response)
            
            primary_category = ai_response.get("primary_category", "Other")
            
            # Check if primary category is in available categories
            # For this lightweight server, we'll skip the complex mapping logic
            if primary_category not in all_categories:
                primary_category = "Other"
                ai_response["primary_category"] = "Other"
                ai_response["confidence"] = ai_response.get("confidence", 0.5) * 0.5
            
            return ai_response
            
        except Exception as json_error:
            print(f"⚠️ JSON parsing failed for '{receiver_name}': {json_error}")
            print(f"Raw response (first 500 chars): {response_text[:500]}")
            
            # Simple fallback
            return {
                "primary_category": "Other",
                "confidence": 0.3,
                "reasoning": f"Could not parse AI response: {str(json_error)[:100]}...",
                "alternatives": []
            }
            
    except Exception as e:
        print(f"❌ Gemini API error: {str(e)}")
        return {
            "primary_category": "Other",
            "confidence": 0.1,
            "reasoning": f"API error: {str(e)[:100]}...",
            "alternatives": []
        }

# --- 3. API Endpoints ---

@app.get("/")
def root():
    """API Root - show basic info"""
    return {
        "name": "WalletWise AI Category API",
        "version": "1.0.0",
        "status": "running",
        "endpoints": [
            "/get-category/{merchant_name}",
            "/api-status/"
        ]
    }

@app.get("/get-category/{merchant_name}")
def get_category(merchant_name: str):
    """Get category prediction for a merchant name"""
    try:
        result = get_ai_category_prediction(merchant_name)
        return {
            "merchant": merchant_name,
            "category": result.get("primary_category", "Other"),
            "confidence": result.get("confidence", 0.0),
            "reasoning": result.get("reasoning", "Not available"),
            "alternatives": result.get("alternatives", []),
            "source": "AI Prediction (Enhanced Gemini)" if GOOGLE_AI_API_KEY else "Smart Fallback"
        }
    except Exception as e:
        print(f"❌ Error in get_category: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Internal server error: {str(e)}"
        )

@app.get("/api-status/")
def api_status():
    """Get API status information"""
    return {
        "status": "operational",
        "google_ai_status": "configured" if GOOGLE_AI_API_KEY else "not_configured",
        "google_ai_key_present": bool(GOOGLE_AI_API_KEY),
        "learned_merchants_count": 0,  # Simplified version doesn't track this
        "fallback_mode": not bool(GOOGLE_AI_API_KEY),
        "categories": get_all_categories()
    }

# --- 4. Main Entry Point ---

if __name__ == "__main__":
    try:
        # Run the server
        print("🚀 Starting WalletWise AI Category API...")
        uvicorn.run(app, host="0.0.0.0", port=8002, log_level="info")
    except KeyboardInterrupt:
        print("\n👋 Server stopped by user")
    except Exception as e:
        print(f"❌ Error starting server: {str(e)}")