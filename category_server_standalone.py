"""
Standalone Categorization Server

This script runs a lightweight FastAPI server that only handles the categorization
functionality, without the OCR features that might be causing issues.
"""

import os
import json
from typing import List, Dict, Any
import google.generativeai as genai
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

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

# Create the FastAPI app - only for categorization
app = FastAPI(
    title="Categorization API",
    description="API for categorizing transactions using Google AI Gemini",
    version="1.0",
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

# Define models
class Receiver(BaseModel):
    name: str
    examples: List[Dict[str, str]] = []

# Pre-defined categories
CATEGORIES = [
    "Food", "Entertainment", "Travelling", "Clothes", 
    "Health", "Bills", "Groceries", "Other", "Personal"
]

# Transaction categorization cache
categorization_cache = {}

def get_all_categories():
    """Get all available categories, including custom ones."""
    # In this simplified version, we just return the pre-defined categories
    return CATEGORIES

def get_ai_category_prediction(receiver_name: str, examples: list[dict]) -> tuple[str, str, float, list]:
    """
    Calls the Gemini model with enhanced confidence scoring for better categorization.
    Returns (category, confidence_explanation, confidence_score, alternatives)
    """
    
    # If no API key, return fallback
    if not GOOGLE_AI_API_KEY:
        print(f"❌ No Gemini API key found for '{receiver_name}' - using fallback")
        return "Other", "No AI API key configured - using fallback", 0.0, []
    
    print(f"🔑 Using Gemini API for '{receiver_name}'...")  # Debug log
    
    # Build examples section
    prompt_examples = ""
    if examples:
        prompt_examples = "Here are some examples from the user's transaction history:\n"
        for eg in examples:
            prompt_examples += f"• {eg['receiver']} → {eg['category']}\n"
        prompt_examples += "\n"
    
    # Get all available categories including custom ones
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

{prompt_examples}MERCHANT: "{receiver_name}"

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
        
        print(f"🤖 AI Response for '{receiver_name}': {response_text[:200]}...")  # Debug log
        
        try:
            # Try to parse JSON response - clean markdown code blocks first
            cleaned_response = response_text.replace('```json', '').replace('```', '').strip()
            ai_response = json.loads(cleaned_response)
            
            primary_category = ai_response.get("primary_category", "Other")
            confidence = ai_response.get("confidence", 0.5)
            reasoning = ai_response.get("reasoning", "AI prediction")
            alternatives = ai_response.get("alternatives", [])
            
            # Validate primary category
            if primary_category not in all_categories:
                primary_category = "Other"
            
            return primary_category, reasoning, confidence, alternatives
            
        except Exception as json_error:
            print(f"⚠️ JSON parsing failed for '{receiver_name}': {json_error}")
            return "Other", f"AI prediction unclear: {response_text[:100]}...", 0.3, []
            
    except Exception as e:
        print(f"❌ Gemini API error: {e}")
        return "Other", f"Error: {str(e)}", 0.0, []

@app.post("/get-category/")
def master_categorizer(receiver: Receiver):
    """
    Get an AI-powered category prediction with enhanced accuracy.
    For cached items: return user preference
    For "Other" items: get AI suggestion and allow new category creation
    """
    merchant = receiver.name.strip()
    examples = receiver.examples

    # Check cache first for fast response (case-insensitive)
    cache_key = merchant.lower()
    if cache_key in categorization_cache:
        print(f"⚡ INSTANT Cache HIT for: {merchant} → {categorization_cache[cache_key]['category']}")
        return categorization_cache[cache_key]
    
    print(f"Cache MISS for: {merchant}. Calling AI for categorization.")
    
    # If not in cache, use AI for prediction
    category, explanation, confidence_score, alternatives = get_ai_category_prediction(
        merchant, examples
    )
    
    # Format the final response
    result = {
        "merchant": merchant,
        "category": category,
        "confidence": confidence_score,
        "reasoning": explanation,
        "alternatives": alternatives,
        "source": "AI Prediction (Enhanced Gemini)" if GOOGLE_AI_API_KEY else "Smart Fallback"
    }
    
    # Cache the result for future fast responses (case-insensitive lookup)
    categorization_cache[cache_key] = result
    print(f"✅ AUTO-CACHED: {merchant} → {category} (confidence: {confidence_score})")
    
    return result

@app.get("/")
def read_root():
    """Root endpoint to verify the server is running."""
    return {"message": "Categorization API is running"}

@app.get("/api-status/")
def api_status():
    """Get the status of the API."""
    return {
        "status": "operational",
        "version": "1.0",
        "google_ai_status": "active" if GOOGLE_AI_API_KEY else "not_configured",
        "google_ai_key_present": bool(GOOGLE_AI_API_KEY),
        "fallback_mode": not bool(GOOGLE_AI_API_KEY),
        "learned_merchants_count": len(categorization_cache),
        "categories_available": get_all_categories()
    }

# Start the server when run directly
if __name__ == "__main__":
    import uvicorn
    print("🚀 Starting Categorization API server...")
    uvicorn.run(app, host="0.0.0.0", port=8002)