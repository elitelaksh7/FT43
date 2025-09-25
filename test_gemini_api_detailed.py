#!/usr/bin/env python3
"""
Test Gemini API functionality with detailed error reporting
"""
import os
import sys
from dotenv import load_dotenv
import traceback

# Load environment variables
load_dotenv()

# Get API key
API_KEY = os.getenv("GOOGLE_AI_API_KEY")

def test_gemini_api():
    """Test the Gemini API with detailed error reporting"""
    print(f"API Key found: {bool(API_KEY)}")
    if not API_KEY:
        print("❌ No API key found in .env file")
        print("Please set GOOGLE_AI_API_KEY in your .env file")
        return False
    
    print(f"API Key: {API_KEY[:5]}...")
    
    try:
        import google.generativeai as genai
        print("✅ Successfully imported google.generativeai")
    except ImportError as e:
        print(f"❌ Error importing google.generativeai: {e}")
        print("Try installing the package: pip install google-generativeai")
        return False
    
    try:
        # Configure the library
        genai.configure(api_key=API_KEY)
        print("✅ Successfully configured genai with API key")
    except Exception as e:
        print(f"❌ Error configuring genai: {e}")
        traceback.print_exc()
        return False
    
    try:
        # Try creating a model instance
        model = genai.GenerativeModel('gemini-1.5-flash')
        print("✅ Successfully created model instance")
    except Exception as e:
        print(f"❌ Error creating model instance: {e}")
        traceback.print_exc()
        return False
        
    try:
        # Try generating content
        print("Testing content generation...")
        response = model.generate_content("What's the weather like today?")
        print(f"✅ Successfully generated content")
        print(f"Response text: {response.text[:100]}...")
        return True
    except Exception as e:
        print(f"❌ Error generating content: {e}")
        traceback.print_exc()
        return False

if __name__ == "__main__":
    print("\n" + "="*50)
    print("🔍 GEMINI API TEST")
    print("="*50)
    success = test_gemini_api()
    print("\n" + "="*50)
    if success:
        print("✅ ALL TESTS PASSED - Gemini API is working properly")
    else:
        print("❌ TESTS FAILED - See errors above")
    print("="*50 + "\n")
    sys.exit(0 if success else 1)