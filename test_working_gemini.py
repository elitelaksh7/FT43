#!/usr/bin/env python3
"""
Test working Gemini model with our categorization
"""
import google.generativeai as genai
import os
import json
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configure Google AI (Gemini)
GOOGLE_AI_API_KEY = os.getenv("GOOGLE_AI_API_KEY")
if GOOGLE_AI_API_KEY:
    genai.configure(api_key=GOOGLE_AI_API_KEY)
    print("✅ Google AI (Gemini) configured successfully!")
else:
    print("❌ Google AI API key not found!")
    exit(1)

# Test categories
CATEGORIES = [
    "Food", "Entertainment", "Travelling", "Clothes", 
    "Health", "Bills", "Groceries", "Other", "Personal"
]

def test_working_gemini():
    """Test working Gemini model with various merchants"""
    
    test_merchants = [
        "KFC",
        "CyberPunks General Store", 
        "Starbucks",
        "Nike Store",
        "Shell Petrol Station",
        "Walmart",
        "McDonald's"
    ]
    
    print("\n🧪 Testing Working Gemini Model (gemini-1.5-flash-8b):")
    print("=" * 60)
    
    for merchant in test_merchants:
        try:
            prompt = f"""You are a financial categorization AI. Categorize this merchant into one of these categories:
{', '.join(CATEGORIES)}

Merchant: "{merchant}"

Respond with only a JSON object:
{{"category": "Category_Name", "confidence": 0.95, "reasoning": "Brief explanation"}}"""

            model = genai.GenerativeModel('gemini-1.5-flash-8b')
            response = model.generate_content(prompt)
            
            response_text = response.text.strip()
            cleaned_response = response_text.replace('```json', '').replace('```', '').strip()
            
            result = json.loads(cleaned_response)
            
            # Validate category
            if result.get('category') not in CATEGORIES:
                result['category'] = 'Other'
                result['confidence'] = max(0.3, result.get('confidence', 0.5) - 0.2)
            
            print(f"🏪 {merchant:25} → {result['category']:12} ({result.get('confidence', 0):.2f})")
            
        except Exception as e:
            print(f"❌ {merchant:25} → ERROR: {str(e)}")
    
    print("=" * 60)

if __name__ == "__main__":
    test_working_gemini()