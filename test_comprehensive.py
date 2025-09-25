#!/usr/bin/env python3
"""
Comprehensive API Test Script for WalletWise Backend
This script tests all API endpoints independently.
"""

import requests
import json
import time
import sys

BASE_URL = "http://127.0.0.1:8000"

def wait_for_server(max_attempts=10):
    """Wait for the server to be ready"""
    for attempt in range(max_attempts):
        try:
            response = requests.get(f"{BASE_URL}/docs")
            if response.status_code in [200, 404]:  # Server is responding
                print("✅ Server is ready!")
                return True
        except requests.exceptions.ConnectionError:
            print(f"⏳ Waiting for server... (attempt {attempt + 1}/{max_attempts})")
            time.sleep(2)
    return False

def test_parse_text():
    """Test the /parse-text/ endpoint"""
    print("\n" + "="*60)
    print("🧪 TEST 1: Transaction Text Parsing")
    print("="*60)
    
    test_cases = [
        {
            "name": "Zomato Transaction",
            "text": "You spent Rs.500 at Zomato on 2024-01-15",
            "expected_merchant": "Zomato",
            "expected_amount": 500.0
        },
        {
            "name": "Swiggy Transaction", 
            "text": "INR 1200 debited from your account. Paid to Swiggy Instamart on 2024-01-16",
            "expected_merchant": "Swiggy Instamart",
            "expected_amount": 1200.0
        },
        {
            "name": "H&M Transaction",
            "text": "Transaction successful! Rs.2500 paid to H&M via UPI Ref: 123456789",
            "expected_merchant": "H&M", 
            "expected_amount": 2500.0
        },
        {
            "name": "Apollo Pharmacy",
            "text": "Amount Rs.150 spent at Apollo Pharmacy on 15-Jan-24",
            "expected_merchant": "Apollo Pharmacy",
            "expected_amount": 150.0
        }
    ]
    
    passed = 0
    total = len(test_cases)
    
    for i, test_case in enumerate(test_cases, 1):
        print(f"\n--- Test {i}: {test_case['name']} ---")
        print(f"Input: {test_case['text']}")
        
        try:
            response = requests.post(
                f"{BASE_URL}/parse-text/",
                json={"text": test_case["text"]}
            )
            
            if response.status_code == 200:
                result = response.json()
                print(f"✅ Status: SUCCESS")
                print(f"📊 Result: {json.dumps(result, indent=2)}")
                
                # Validate results
                if (result.get("recipientName") == test_case["expected_merchant"] and 
                    result.get("amount") == test_case["expected_amount"]):
                    print(f"✅ Validation: PASSED")
                    passed += 1
                else:
                    print(f"❌ Validation: FAILED - Expected {test_case['expected_merchant']}, got {result.get('recipientName')}")
            else:
                print(f"❌ Status: FAILED ({response.status_code})")
                print(f"Error: {response.text}")
                
        except Exception as e:
            print(f"❌ Exception: {e}")
    
    print(f"\n📈 Parse Text Results: {passed}/{total} tests passed")
    return passed == total

def test_categorization():
    """Test the /get-category/ endpoint"""
    print("\n" + "="*60)
    print("🧪 TEST 2: AI Categorization")
    print("="*60)
    
    test_merchants = [
        {"name": "Zomato", "expected_source": "User History (Cache)", "expected_category": "Food"},
        {"name": "Swiggy Instamart", "expected_source": "User History (Cache)", "expected_category": "Groceries"},
        {"name": "H&M", "expected_source": "User History (Cache)", "expected_category": "Clothes"},
        {"name": "Apollo Pharmacy", "expected_source": "User History (Cache)", "expected_category": "Health"},
        {"name": "Netflix", "expected_source": "AI Prediction (Enhanced Gemini)", "expected_category": None},  # Will be AI predicted
        {"name": "Unknown Merchant", "expected_source": "AI Prediction (Enhanced Gemini)", "expected_category": None}
    ]
    
    passed = 0
    total = len(test_merchants)
    
    for i, merchant_test in enumerate(test_merchants, 1):
        print(f"\n--- Test {i}: {merchant_test['name']} ---")
        
        try:
            response = requests.post(
                f"{BASE_URL}/get-category/",
                json={"name": merchant_test["name"]}
            )
            
            if response.status_code == 200:
                result = response.json()
                print(f"✅ Status: SUCCESS")
                print(f"📊 Result: {json.dumps(result, indent=2)}")
                
                # Validate source
                if result.get("source") == merchant_test["expected_source"]:
                    print(f"✅ Source validation: PASSED ({result.get('source')})")
                    if merchant_test["expected_category"]:
                        if result.get("category") == merchant_test["expected_category"]:
                            print(f"✅ Category validation: PASSED ({result.get('category')})")
                            passed += 1
                        else:
                            print(f"❌ Category validation: FAILED - Expected {merchant_test['expected_category']}, got {result.get('category')}")
                    else:
                        print(f"✅ AI prediction received: {result.get('category')}")
                        passed += 1
                else:
                    print(f"❌ Source validation: FAILED - Expected {merchant_test['expected_source']}, got {result.get('source')}")
            else:
                print(f"❌ Status: FAILED ({response.status_code})")
                print(f"Error: {response.text}")
                
        except Exception as e:
            print(f"❌ Exception: {e}")
    
    print(f"\n📈 Categorization Results: {passed}/{total} tests passed")
    return passed == total

def test_learning_system():
    """Test the /confirm-category/ endpoint and learning"""
    print("\n" + "="*60)
    print("🧪 TEST 3: Learning System")
    print("="*60)
    
    # Step 1: Add new categories
    new_confirmations = [
        {"receiver_name": "Netflix", "confirmed_category": "Entertainment"},
        {"receiver_name": "Uber", "confirmed_category": "Travelling"},
        {"receiver_name": "BigBasket", "confirmed_category": "Groceries"}
    ]
    
    print("Step 1: Adding new merchant categories...")
    for i, confirmation in enumerate(new_confirmations, 1):
        print(f"\n--- Adding {i}: {confirmation['receiver_name']} -> {confirmation['confirmed_category']} ---")
        
        try:
            response = requests.post(
                f"{BASE_URL}/confirm-category/",
                json=confirmation
            )
            
            if response.status_code == 200:
                result = response.json()
                print(f"✅ Status: SUCCESS")
                print(f"📊 Result: {json.dumps(result, indent=2)}")
            else:
                print(f"❌ Status: FAILED ({response.status_code})")
                print(f"Error: {response.text}")
                
        except Exception as e:
            print(f"❌ Exception: {e}")
    
    # Step 2: Verify learning by checking categories again
    print("\nStep 2: Verifying learning (should return cached results)...")
    learned_correctly = 0
    
    for i, confirmation in enumerate(new_confirmations, 1):
        merchant = confirmation['receiver_name']
        expected_category = confirmation['confirmed_category']
        
        print(f"\n--- Verifying {i}: {merchant} ---")
        
        try:
            response = requests.post(
                f"{BASE_URL}/get-category/",
                json={"name": merchant}
            )
            
            if response.status_code == 200:
                result = response.json()
                print(f"📊 Result: {json.dumps(result, indent=2)}")
                
                if (result.get("source") == "User History (Cache)" and 
                    result.get("category") == expected_category):
                    print(f"✅ Learning verified: {merchant} correctly cached as {expected_category}")
                    learned_correctly += 1
                else:
                    print(f"❌ Learning failed: Expected cached {expected_category}, got {result.get('category')} from {result.get('source')}")
            else:
                print(f"❌ Status: FAILED ({response.status_code})")
                
        except Exception as e:
            print(f"❌ Exception: {e}")
    
    print(f"\n📈 Learning Results: {learned_correctly}/{len(new_confirmations)} merchants learned correctly")
    return learned_correctly == len(new_confirmations)

def main():
    """Run all tests"""
    print("🚀 WalletWise AI Backend - Comprehensive API Test")
    print("="*80)
    
    # Wait for server to be ready
    if not wait_for_server():
        print("❌ Server is not responding. Please start the server first:")
        print("   uvicorn main:app --host 127.0.0.1 --port 8000")
        sys.exit(1)
    
    # Run all tests
    results = []
    
    try:
        results.append(("Text Parsing", test_parse_text()))
        results.append(("Categorization", test_categorization()))
        results.append(("Learning System", test_learning_system()))
        
        # Summary
        print("\n" + "="*80)
        print("🎯 TEST SUMMARY")
        print("="*80)
        
        passed_tests = 0
        for test_name, passed in results:
            status = "✅ PASSED" if passed else "❌ FAILED"
            print(f"{test_name:20} {status}")
            if passed:
                passed_tests += 1
        
        print(f"\n📊 Overall Result: {passed_tests}/{len(results)} test suites passed")
        
        if passed_tests == len(results):
            print("🎉 ALL TESTS PASSED! Your backend is working perfectly!")
            print("\n📖 API Documentation available at:")
            print("   • Swagger UI: http://127.0.0.1:8000/docs")
            print("   • ReDoc: http://127.0.0.1:8000/redoc")
        else:
            print("⚠️  Some tests failed. Please check the output above.")
            
    except KeyboardInterrupt:
        print("\n⚠️  Tests interrupted by user")
    except Exception as e:
        print(f"\n❌ Unexpected error: {e}")

if __name__ == "__main__":
    main()