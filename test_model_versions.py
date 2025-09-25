#!/usr/bin/env python3
"""
Test different Gemini model versions
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

def test_model_versions():
    """Test different Gemini model versions to find working one"""
    
    model_versions = [
        "gemini-1.5-flash",
        "gemini-1.5-pro",
        "gemini-pro",
        "gemini-1.0-pro",
        "gemini-1.5-flash-8b"
    ]
    
    test_prompt = """Categorize this merchant: "KFC" 
    Categories: Food, Groceries, Other
    Respond with JSON: {"category": "Food", "confidence": 0.95}"""
    
    print("\n🧪 Testing Model Versions:")
    print("=" * 50)
    
    for model_name in model_versions:
        try:
            print(f"Testing: {model_name}")
            model = genai.GenerativeModel(model_name)
            response = model.generate_content(test_prompt)
            print(f"✅ {model_name}: SUCCESS")
            print(f"   Response: {response.text[:100]}...")
            print()
            break  # Use first working model
            
        except Exception as e:
            print(f"❌ {model_name}: {str(e)[:200]}...")
            print()
    
    print("=" * 50)

def list_available_models():
    """List available models"""
    try:
        print("\n📋 Available Models:")
        print("=" * 30)
        for model in genai.list_models():
            if 'gemini' in model.name.lower():
                print(f"Model: {model.name}")
                print(f"Display: {model.display_name}")
                print("-" * 30)
    except Exception as e:
        print(f"Error listing models: {e}")

if __name__ == "__main__":
    list_available_models()
    test_model_versions()