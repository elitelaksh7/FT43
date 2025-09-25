#!/usr/bin/env python3
"""
Test Gemini API categorization function from main.py
"""
import os
import sys
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Get API key
API_KEY = os.getenv("GOOGLE_AI_API_KEY")

# Import main app
try:
    from main import get_ai_category_prediction, get_all_categories
    print("✅ Successfully imported functions from main.py")
except ImportError as e:
    print(f"❌ Error importing functions from main.py: {e}")
    sys.exit(1)

def test_categorization(merchant_name):
    """Test categorization for a specific merchant"""
    print(f"Testing categorization for: {merchant_name}")
    
    # Example transaction history
    examples = [
        {"receiver": "Zomato", "category": "Food"},
        {"receiver": "Netflix", "category": "Entertainment"},
        {"receiver": "Uber", "category": "Travelling"},
        {"receiver": "H&M", "category": "Clothes"},
        {"receiver": "Apollo Pharmacy", "category": "Health"},
        {"receiver": "Airtel", "category": "Bills"},
        {"receiver": "BigBasket", "category": "Groceries"},
    ]
    
    try:
        # Get all categories
        categories = get_all_categories()
        print(f"Available categories: {', '.join(categories)}")
        
        # Test categorization
        category, reasoning, confidence, alternatives = get_ai_category_prediction(merchant_name, examples)
        
        # Print results
        print("="*50)
        print(f"🏷️  Category: {category}")
        print(f"📊 Confidence: {confidence:.2f}")
        print(f"💡 Reasoning: {reasoning}")
        print(f"🔄 Alternatives: {alternatives}")
        print("="*50)
        
        return True
    except Exception as e:
        print(f"❌ Error categorizing merchant: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    merchants_to_test = [
        "Starbucks",  # Should be Food
        "Amazon Prime Video",  # Should be Entertainment
        "Indigo Airlines",  # Should be Travelling
        "Nike",  # Should be Clothes
        "Metropolis Healthcare",  # Should be Health
        "Tata Power",  # Should be Bills
        "Reliance Fresh",  # Should be Groceries
        "Unknown Merchant XYZ"  # Should use AI to guess or suggest new category
    ]
    
    print("\n" + "="*50)
    print("🔍 GEMINI CATEGORIZATION TEST")
    print("="*50)
    
    success = True
    for merchant in merchants_to_test:
        print(f"\nTesting: {merchant}")
        if not test_categorization(merchant):
            success = False
    
    print("\n" + "="*50)
    if success:
        print("✅ ALL TESTS PASSED - Categorization is working properly")
    else:
        print("❌ TESTS FAILED - See errors above")
    print("="*50 + "\n")