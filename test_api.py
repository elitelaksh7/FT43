#!/usr/bin/env python3
"""
Test script for WalletWise AI Backend API
Tests all endpoints to ensure they work correctly.
"""

import requests
import json
import sys
from typing import Dict, Any

BASE_URL = "http://localhost:8000"

def test_endpoint(method: str, endpoint: str, data: Dict[Any, Any] = None, files: Dict[str, Any] = None) -> Dict[str, Any]:
    """Test an API endpoint and return the response."""
    url = f"{BASE_URL}{endpoint}"
    
    try:
        if method.upper() == "POST":
            if files:
                response = requests.post(url, files=files)
            elif data:
                response = requests.post(url, json=data)
            else:
                response = requests.post(url)
        else:
            response = requests.get(url)
        
        print(f"\n{'='*60}")
        print(f"Testing: {method.upper()} {endpoint}")
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            print(f"Response: {json.dumps(result, indent=2)}")
            return {"success": True, "data": result}
        else:
            print(f"Error: {response.text}")
            return {"success": False, "error": response.text}
            
    except Exception as e:
        print(f"Exception: {str(e)}")
        return {"success": False, "error": str(e)}

def main():
    """Run all API tests."""
    print("🚀 Starting WalletWise AI Backend API Tests")
    print(f"Testing server at: {BASE_URL}")
    
    # Test 1: Parse transaction from text (SMS)
    print("\n" + "="*60)
    print("TEST 1: Parse Transaction from Text")
    sms_examples = [
        "You spent Rs.500 at Zomato on 2024-01-15",
        "INR 1200 debited from your account. Paid to Swiggy Instamart on 2024-01-16",
        "Transaction successful! Rs.2500 paid to H&M via UPI Ref: 123456789",
        "Amount Rs.150 spent at Apollo Pharmacy on 15-Jan-24"
    ]
    
    for i, sms_text in enumerate(sms_examples, 1):
        print(f"\n--- SMS Example {i} ---")
        test_data = {"text": sms_text}
        result = test_endpoint("POST", "/parse-text/", data=test_data)
    
    # Test 2: Get category predictions
    print("\n" + "="*60)
    print("TEST 2: AI Category Prediction")
    merchants = [
        "Zomato",
        "Swiggy Instamart", 
        "H&M",
        "Apollo Pharmacy",
        "IRCTC",
        "Netflix",
        "Uber",
        "BigBasket"
    ]
    
    for merchant in merchants:
        print(f"\n--- Testing merchant: {merchant} ---")
        test_data = {"name": merchant}
        result = test_endpoint("POST", "/get-category/", data=test_data)
    
    # Test 3: Confirm category (Learning system)
    print("\n" + "="*60)
    print("TEST 3: User Feedback/Learning System")
    confirmations = [
        {"receiver_name": "Netflix", "confirmed_category": "Entertainment"},
        {"receiver_name": "Uber", "confirmed_category": "Travelling"},
        {"receiver_name": "BigBasket", "confirmed_category": "Groceries"}
    ]
    
    for confirmation in confirmations:
        print(f"\n--- Confirming: {confirmation['receiver_name']} -> {confirmation['confirmed_category']} ---")
        result = test_endpoint("POST", "/confirm-category/", data=confirmation)
    
    # Test 4: Test learning - check if categories are cached
    print("\n" + "="*60)
    print("TEST 4: Verify Learning System (Should return cached results)")
    
    for confirmation in confirmations:
        merchant = confirmation['receiver_name']
        print(f"\n--- Re-testing cached merchant: {merchant} ---")
        test_data = {"name": merchant}
        result = test_endpoint("POST", "/get-category/", data=test_data)
        if result["success"] and result["data"].get("source") == "User History (Cache)":
            print("✅ Learning system working - returned cached result!")
        else:
            print("❌ Learning system may not be working correctly")
    
    # Test 5: Health check (if root endpoint exists)
    print("\n" + "="*60)
    print("TEST 5: Server Health Check")
    try:
        response = requests.get(f"{BASE_URL}/")
        print(f"Root endpoint status: {response.status_code}")
        if response.status_code == 404:
            print("✅ Server is running (404 is expected for root endpoint)")
        else:
            print(f"Response: {response.text}")
    except Exception as e:
        print(f"❌ Server health check failed: {e}")
    
    print("\n" + "="*80)
    print("🎉 API Testing Complete!")
    print("✅ Check the results above to verify all endpoints are working")
    print("📖 View API docs at: http://localhost:8000/docs")
    print("📚 Alternative docs at: http://localhost:8000/redoc")

if __name__ == "__main__":
    main()