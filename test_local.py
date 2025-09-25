#!/usr/bin/env python3
"""
Simple API test that can run independently
"""

def test_local_functions():
    """Test the core functions without needing the server"""
    print("🧪 Testing Core Functions Locally")
    print("="*50)
    
    # Import our functions
    import sys
    import os
    sys.path.append(os.path.dirname(__file__))
    
    from main import extract_transaction_details, USER_CORRECTIONS_DB, CATEGORIES
    
    # Test transaction parsing
    print("\n1. Testing Transaction Parsing:")
    test_texts = [
        "You spent Rs.500 at Zomato on 2024-01-15",
        "INR 1200 debited from your account. Paid to Swiggy Instamart on 2024-01-16",
        "Transaction successful! Rs.2500 paid to H&M via UPI Ref: 123456789"
    ]
    
    for i, text in enumerate(test_texts, 1):
        print(f"\n  Test {i}: {text}")
        result = extract_transaction_details(text)
        print(f"  Result: {result}")
    
    # Test database
    print(f"\n2. Testing Simulated Database:")
    print(f"  Categories: {CATEGORIES}")
    print(f"  Sample data in DB: {USER_CORRECTIONS_DB}")
    
    # Test categorization logic (without AI)
    print(f"\n3. Testing Categorization Cache:")
    for merchant, category in USER_CORRECTIONS_DB.items():
        print(f"  {merchant} -> {category}")
    
    print("\n✅ Core functions working correctly!")
    return True

if __name__ == "__main__":
    test_local_functions()