#!/usr/bin/env python3
"""
WalletWise AI Backend - Improved Test Suite
This test properly handles the cache-first behavior and tests real AI accuracy
"""

import requests
import json

BASE_URL = "http://127.0.0.1:8000"

def test_ai_accuracy_fresh_merchants():
    """Test AI categorization accuracy with completely fresh merchants"""
    print("\n" + "="*60)
    print("🧪 AI ACCURACY TEST: Fresh Merchants")
    print("="*60)
    
    # These are merchants that shouldn't be in cache
    fresh_merchants = [
        {"name": "BookMyShow", "expected": "Entertainment"},
        {"name": "Myntra", "expected": "Clothes"}, 
        {"name": "Nykaa", "expected": "Health"},
        {"name": "IRCTC", "expected": "Travelling"},
        {"name": "Dominos Pizza", "expected": "Food"},
        {"name": "Croma", "expected": "Other"},
        {"name": "Urban Company", "expected": "Other"},
        {"name": "Paytm Electricity", "expected": "Bills"}
    ]
    
    correct_predictions = 0
    total_tests = len(fresh_merchants)
    
    for i, merchant in enumerate(fresh_merchants, 1):
        print(f"\n--- Test {i}: {merchant['name']} ---")
        
        try:
            response = requests.post(
                f"{BASE_URL}/get-category/",
                json={"name": merchant["name"]}
            )
            
            if response.status_code == 200:
                result = response.json()
                predicted = result.get("category")
                source = result.get("source", "")
                
                print(f"📊 Merchant: {merchant['name']}")
                print(f"🎯 Expected: {merchant['expected']}")
                print(f"🤖 Predicted: {predicted}")
                print(f"📍 Source: {source}")
                
                if predicted == merchant["expected"]:
                    print("✅ CORRECT PREDICTION!")
                    correct_predictions += 1
                else:
                    print(f"❌ Wrong prediction (but may still be reasonable)")
                    
            else:
                print(f"❌ API Error: {response.status_code}")
                
        except Exception as e:
            print(f"❌ Exception: {e}")
    
    accuracy = (correct_predictions / total_tests) * 100
    print(f"\n📈 AI ACCURACY: {correct_predictions}/{total_tests} = {accuracy:.1f}%")
    
    if accuracy >= 70:
        print("🎉 EXCELLENT: AI accuracy is above 70%!")
    elif accuracy >= 50:
        print("👍 GOOD: AI accuracy is decent")
    else:
        print("⚠️ NEEDS IMPROVEMENT: AI accuracy is below 50%")
    
    return accuracy

def test_cache_performance():
    """Test that cache works correctly for learned merchants"""
    print("\n" + "="*60)
    print("🧪 CACHE PERFORMANCE TEST")
    print("="*60)
    
    # Add a new merchant to cache
    print("Step 1: Teaching the system a new merchant...")
    learn_response = requests.post(
        f"{BASE_URL}/save-category/",
        json={"receiver_name": "TestMerchant123", "category": "Food"}
    )
    
    if learn_response.status_code == 200:
        print("✅ Merchant learned successfully")
        
        # Now test if it uses cache
        print("\nStep 2: Testing cache retrieval...")
        test_response = requests.post(
            f"{BASE_URL}/get-category/",
            json={"name": "TestMerchant123"}
        )
        
        if test_response.status_code == 200:
            result = test_response.json()
            source = result.get("source", "")
            
            if "Cache" in source:
                print("✅ CACHE WORKING: System correctly uses cache for learned merchants")
                return True
            else:
                print(f"❌ CACHE ISSUE: Expected cache, got {source}")
                return False
    
    print("❌ Learning failed")
    return False

def main():
    """Run improved test suite"""
    print("🚀 WalletWise AI Backend - Improved Test Suite")
    print("="*70)
    
    # Check server
    try:
        response = requests.get(f"{BASE_URL}/")
        if response.status_code == 200:
            print("✅ Server is ready!")
        else:
            print("❌ Server not responding correctly")
            return
    except:
        print("❌ Server not reachable. Make sure it's running on port 8000")
        return
    
    # Run tests
    ai_accuracy = test_ai_accuracy_fresh_merchants()
    cache_works = test_cache_performance()
    
    print("\n" + "="*70)
    print("🎯 FINAL RESULTS")
    print("="*70)
    print(f"🤖 AI Accuracy: {ai_accuracy:.1f}%")
    print(f"⚡ Cache System: {'✅ Working' if cache_works else '❌ Issues'}")
    
    if ai_accuracy >= 70 and cache_works:
        print("\n🎉 SYSTEM STATUS: EXCELLENT - Ready for production!")
    elif ai_accuracy >= 50 and cache_works:
        print("\n👍 SYSTEM STATUS: GOOD - Minor improvements possible")
    else:
        print("\n⚠️ SYSTEM STATUS: NEEDS IMPROVEMENT")

if __name__ == "__main__":
    main()