#!/usr/bin/env python3
"""
Debug Categorization API Server

This script creates a standalone FastAPI server with enhanced debugging
and error handling to diagnose connection issues.
"""

import os
import sys
import json
import traceback
from typing import List, Dict, Any, Optional, Union
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Set debug flag
DEBUG = True

# Configure Google AI (Gemini) - with error handling
GOOGLE_AI_API_KEY = os.getenv("GOOGLE_AI_API_KEY")
GEMINI_AVAILABLE = False

try:
    import google.generativeai as genai
    if GOOGLE_AI_API_KEY:
        genai.configure(api_key=GOOGLE_AI_API_KEY)
        print("✅ Google AI (Gemini) configured successfully!")
        GEMINI_AVAILABLE = True
    else:
        print("⚠️  Google AI API key not found. Using fallback categorization.")
        print("   Set GOOGLE_AI_API_KEY in your .env file for enhanced AI categorization.")
except ImportError:
    print("⚠️  Google Generative AI library not found. Using fallback categorization.")
    print("   Install with: pip install google-generativeai")
except Exception as e:
    print(f"⚠️  Error configuring Google AI: {str(e)}")
    print("   Using fallback categorization.")

# Standard Categories
CATEGORIES = [
    "Food", "Entertainment", "Travelling", "Clothes", 
    "Health", "Bills", "Groceries", "Other", "Personal"
]

# --- Create FastAPI app with error handling ---
try:
    from fastapi import FastAPI, HTTPException
    from fastapi.middleware.cors import CORSMiddleware
    
    app = FastAPI(
        title="WalletWise AI Category API (Debug)",
        description="AI-powered merchant categorization API with enhanced debugging",
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
    print("✅ FastAPI app created successfully!")
except ImportError:
    print("❌ FastAPI not installed. Please install with: pip install fastapi uvicorn")
    sys.exit(1)
except Exception as e:
    print(f"❌ Error creating FastAPI app: {str(e)}")
    traceback.print_exc()
    sys.exit(1)

# --- Helper Functions ---

def safe_log(message: str, level: str = "INFO"):
    """Safe logging function that won't crash"""
    prefix = {
        "INFO": "ℹ️",
        "WARNING": "⚠️",
        "ERROR": "❌",
        "SUCCESS": "✅",
        "DEBUG": "🔍"
    }.get(level, "ℹ️")
    
    try:
        print(f"{prefix} {message}")
    except:
        print(f"Log message error (could not print message)")

def get_all_categories() -> List[str]:
    """Get all available categories including any custom ones"""
    return CATEGORIES

def get_mock_category(merchant_name: str) -> Dict[str, Any]:
    """Provide a mock categorization when AI is not available"""
    merchant_lower = merchant_name.lower()
    
    # Simple keyword-based categorization
    category_keywords = {
        "food": ["restaurant", "cafe", "coffee", "pizza", "burger", "food", "eat", "dining", "takeaway", "mcdonald", "kfc", "starbucks", "subway"],
        "entertainment": ["movie", "cinema", "theater", "netflix", "spotify", "prime", "disney", "hbo", "show", "concert", "game"],
        "travelling": ["air", "flight", "hotel", "train", "bus", "taxi", "uber", "ola", "travel", "booking", "ticket", "fuel", "petrol"],
        "clothes": ["fashion", "cloth", "wear", "apparel", "shoe", "nike", "adidas", "zara", "h&m", "levi"],
        "health": ["pharmacy", "hospital", "clinic", "doctor", "medicine", "medical", "health", "apollo", "wellness"],
        "bills": ["bill", "utility", "electric", "water", "gas", "internet", "phone", "mobile", "recharge", "airtel", "jio", "vodafone"],
        "groceries": ["grocery", "market", "supermarket", "store", "mart", "shop", "bigbasket", "grofer", "fresh"]
    }
    
    # Check for keyword matches
    for category, keywords in category_keywords.items():
        for keyword in keywords:
            if keyword in merchant_lower:
                return {
                    "primary_category": category.title(),
                    "confidence": 0.7,
                    "reasoning": f"Contains keyword '{keyword}' associated with {category}",
                    "alternatives": []
                }
    
    # Default to Other
    return {
        "primary_category": "Other",
        "confidence": 0.5,
        "reasoning": "No matching keywords found",
        "alternatives": []
    }

def get_ai_category_prediction(receiver_name: str, examples: Optional[List[Dict[str, str]]] = None) -> Dict[str, Any]:
    """
    Use the Gemini model to predict the category of a merchant.
    Returns a dictionary with category information.
    """
    safe_log(f"Processing categorization request for '{receiver_name}'", "INFO")
    
    # If Gemini is not available, use mock categorization
    if not GEMINI_AVAILABLE:
        safe_log("Gemini not available, using mock categorization", "WARNING")
        return get_mock_category(receiver_name)
    
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
    
    try:
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

        # Use the latest Gemini model with optimized settings
        generation_config = genai.types.GenerationConfig(
            temperature=0.1,
            top_p=0.8,
            top_k=40,
            max_output_tokens=1024
        )
        
        safe_log(f"Calling Gemini API for '{receiver_name}'", "INFO")
        model = genai.GenerativeModel(
            'gemini-1.5-flash',
            generation_config=generation_config
        )
        response = model.generate_content(prompt)
        response_text = response.text.strip()
        
        safe_log(f"Got response from Gemini API", "SUCCESS")
        
        # Try to parse JSON response - clean markdown code blocks first
        cleaned_response = response_text.replace('```json', '').replace('```', '').strip()
        ai_response = json.loads(cleaned_response)
        
        primary_category = ai_response.get("primary_category", "Other")
        
        # Check if primary category is in available categories
        if primary_category not in all_categories:
            primary_category = "Other"
            ai_response["primary_category"] = "Other"
            ai_response["confidence"] = ai_response.get("confidence", 0.5) * 0.5
        
        safe_log(f"Categorized '{receiver_name}' as '{primary_category}'", "SUCCESS")
        return ai_response
        
    except Exception as e:
        safe_log(f"Error in AI categorization: {str(e)}", "ERROR")
        if DEBUG:
            traceback.print_exc()
        return {
            "primary_category": "Other",
            "confidence": 0.1,
            "reasoning": f"Error: {str(e)[:100]}...",
            "alternatives": []
        }

# --- API Endpoints ---

@app.get("/")
def root():
    """API Root - show basic info"""
    safe_log("Root endpoint accessed", "INFO")
    return {
        "name": "WalletWise AI Category API (Debug)",
        "version": "1.0.0",
        "status": "running",
        "gemini_available": GEMINI_AVAILABLE,
        "endpoints": [
            "/get-category/{merchant_name}",
            "/api-status/"
        ]
    }

@app.get("/get-category/{merchant_name}")
def get_category(merchant_name: str):
    """Get category prediction for a merchant name"""
    safe_log(f"GET /get-category/{merchant_name}", "INFO")
    try:
        result = get_ai_category_prediction(merchant_name)
        response = {
            "merchant": merchant_name,
            "category": result.get("primary_category", "Other"),
            "confidence": result.get("confidence", 0.0),
            "reasoning": result.get("reasoning", "Not available"),
            "alternatives": result.get("alternatives", []),
            "source": "AI Prediction (Enhanced Gemini)" if GEMINI_AVAILABLE else "Smart Fallback"
        }
        safe_log(f"Successfully categorized '{merchant_name}' as '{response['category']}'", "SUCCESS")
        return response
    except Exception as e:
        error_msg = f"Error processing {merchant_name}: {str(e)}"
        safe_log(error_msg, "ERROR")
        if DEBUG:
            traceback.print_exc()
        raise HTTPException(
            status_code=500,
            detail=error_msg
        )

@app.get("/api-status/")
def api_status():
    """Get API status information"""
    safe_log("GET /api-status/", "INFO")
    return {
        "status": "operational",
        "google_ai_status": "configured" if GEMINI_AVAILABLE else "not_configured",
        "google_ai_key_present": bool(GOOGLE_AI_API_KEY),
        "debug_mode": DEBUG,
        "fallback_mode": not GEMINI_AVAILABLE,
        "categories": get_all_categories()
    }

# --- Main Entry Point ---

if __name__ == "__main__":
    try:
        import uvicorn
        safe_log("🚀 Starting WalletWise AI Category API (Debug Mode)...", "INFO")
        uvicorn.run(app, host="0.0.0.0", port=8002, log_level="debug")
    except ImportError:
        safe_log("❌ Uvicorn not installed. Please install with: pip install uvicorn", "ERROR")
        sys.exit(1)
    except KeyboardInterrupt:
        safe_log("\n👋 Server stopped by user", "INFO")
    except Exception as e:
        safe_log(f"❌ Error starting server: {str(e)}", "ERROR")
        traceback.print_exc()
        sys.exit(1)