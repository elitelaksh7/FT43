#!/usr/bin/env python3
"""
Gemini API Categorization Demo Script

This standalone script demonstrates how the Gemini AI API categorizes merchants
without requiring the full server to be running.

Usage:
  python gemini_categorization_demo.py [merchant_name]
  
Example:
  python gemini_categorization_demo.py "Starbucks"
"""

import os
import sys
import json
import google.generativeai as genai
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configure Google AI (Gemini)
GOOGLE_AI_API_KEY = os.getenv("GOOGLE_AI_API_KEY")
if GOOGLE_AI_API_KEY:
    genai.configure(api_key=GOOGLE_AI_API_KEY)
    print("✅ Google AI (Gemini) configured successfully!")
else:
    print("❌ No Google AI API key found in .env file")
    print("Please set GOOGLE_AI_API_KEY in your .env file")
    sys.exit(1)

# Available categories
CATEGORIES = [
    "Food", "Entertainment", "Travelling", "Clothes", 
    "Health", "Bills", "Groceries", "Other", "Personal"
]

def get_ai_category_prediction(merchant_name, examples=None):
    """Get AI category prediction for a merchant"""
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
    
    # Enhanced prompt with pattern recognition
    prompt = f"""You are an expert financial categorization AI for an Indian fintech app with advanced pattern recognition capabilities.

AVAILABLE CATEGORIES: {', '.join(CATEGORIES)}

STANDARD CATEGORY DEFINITIONS:
- Food: Restaurants, cafes, food delivery, groceries (Starbucks, McDonald's, Zomato, Swiggy)
- Entertainment: Streaming, movies, games, concerts (Netflix, Spotify, BookMyShow, Prime Video)
- Travelling: Transport, fuel, travel booking (Uber, Ola, Shell, HP Petrol, IRCTC, Airlines)
- Clothes: Fashion, apparel, footwear (H&M, Zara, Myntra, Nike, Adidas)
- Health: Pharmacy, hospitals, medical (Apollo Pharmacy, 1mg, Practo, Netmeds)
- Bills: Utilities, phone, internet (Jio, Airtel, BSNL, electricity, gas)
- Groceries: Supermarkets, daily essentials (BigBasket, Grofers, Blinkit, DMart)
- Other: General marketplaces, unclear merchants (Amazon, Flipkart, unknown stores)

{prompt_examples}MERCHANT: "{merchant_name}"

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
        
        # Try to parse JSON response - clean markdown code blocks first
        cleaned_response = response_text.replace('```json', '').replace('```', '').strip()
        ai_response = json.loads(cleaned_response)
        
        return ai_response
            
    except Exception as e:
        print(f"❌ Gemini API error: {e}")
        return {"error": str(e)}

def main():
    # Get merchant name from command line argument or use default
    merchant_name = sys.argv[1] if len(sys.argv) > 1 else "Starbucks"
    
    print(f"🔍 Analyzing merchant: {merchant_name}")
    result = get_ai_category_prediction(merchant_name)
    
    # Pretty print the result
    print("\n" + "="*50)
    print("🤖 GEMINI AI CATEGORIZATION RESULT")
    print("="*50)
    print(json.dumps(result, indent=2))
    print("="*50)
    
    # Print a more human-friendly summary
    if "primary_category" in result:
        print(f"\n✅ {merchant_name} is categorized as: {result['primary_category']}")
        print(f"   Confidence: {result.get('confidence', 0) * 100:.1f}%")
        print(f"   Reasoning: {result.get('reasoning', 'Not provided')}")
        
        if "alternatives" in result and result["alternatives"]:
            print("\nAlternative categories:")
            for alt in result["alternatives"]:
                if isinstance(alt, dict):
                    print(f"   - {alt.get('category', 'Unknown')}: {alt.get('confidence', 0) * 100:.1f}%")
                else:
                    print(f"   - {alt}")
    else:
        print(f"\n❌ Failed to categorize {merchant_name}")
        print(f"   Error: {result.get('error', 'Unknown error')}")

if __name__ == "__main__":
    main()