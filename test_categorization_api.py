#!/usr/bin/env python3
"""
Test the AI categorization server
"""
import requests
import json

API_BASE = "http://localhost:8002"

def test_categorization():
    """Test the AI categorization API"""
    
    test_merchants = [
        "KFC",
        "CyberPunks General Store",
        "McDonald's", 
        "Nike Store",
        "Starbucks"
    ]
    
    print("\n🧪 Testing AI Categorization API:")
    print("=" * 50)
    
    for merchant in test_merchants:
        try:
            # Test POST endpoint
            response = requests.post(f"{API_BASE}/get-category/", 
                                   json={"name": merchant})
            
            if response.status_code == 200:
                result = response.json()
                print(f"🏪 {merchant:25} → {result['category']:12} ({result.get('confidence', 0):.2f}) [{result.get('source', 'unknown')}]")
            else:
                print(f"❌ {merchant:25} → HTTP {response.status_code}: {response.text}")
                
        except Exception as e:
            print(f"❌ {merchant:25} → ERROR: {str(e)}")
    
    print("=" * 50)

def test_cache_performance():
    """Test caching performance"""
    import time
    
    merchant = "KFC"
    print(f"\n⚡ Testing Cache Performance for '{merchant}':")
    print("-" * 40)
    
    # First request (should use AI)
    start = time.time()
    response1 = requests.post(f"{API_BASE}/get-category/", json={"name": merchant})
    time1 = time.time() - start
    
    # Second request (should use cache)
    start = time.time()
    response2 = requests.post(f"{API_BASE}/get-category/", json={"name": merchant})
    time2 = time.time() - start
    
    if response1.status_code == 200 and response2.status_code == 200:
        result1 = response1.json()
        result2 = response2.json()
        
        print(f"First request:  {time1:.3f}s [{result1.get('source', 'unknown')}]")
        print(f"Second request: {time2:.3f}s [{result2.get('source', 'unknown')}]")
        
        if time1 > time2:
            print(f"🚀 Cache is {time1/time2:.1f}x faster!")
        else:
            print("⚡ Both requests were fast")
    
    print("-" * 40)

if __name__ == "__main__":
    test_categorization()
    test_cache_performance()