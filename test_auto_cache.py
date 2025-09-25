import requests
import time

API_BASE = "http://localhost:8002"

def test_auto_caching():
    print("=== TESTING AUTO-CACHING ===")
    
    merchant = "Nike Store"
    
    print(f"\n1. First request to '{merchant}' (should call AI and auto-cache):")
    start = time.time()
    response1 = requests.post(f"{API_BASE}/get-category/", json={"name": merchant})
    time1 = time.time() - start
    
    if response1.status_code == 200:
        result1 = response1.json()
        print(f"   Response time: {time1:.3f}s")
        print(f"   Category: {result1['category']}")
        print(f"   Source: {result1['source']}")
        print(f"   Confidence: {result1['confidence_score']}")
    
    print(f"\n2. Second request to '{merchant}' (should be cached and instant):")
    start = time.time()
    response2 = requests.post(f"{API_BASE}/get-category/", json={"name": merchant})
    time2 = time.time() - start
    
    if response2.status_code == 200:
        result2 = response2.json()
        print(f"   Response time: {time2:.3f}s ({time1/time2:.1f}x faster!)")
        print(f"   Category: {result2['category']}")
        print(f"   Source: {result2['source']}")
        print(f"   Confidence: {result2['confidence_score']}")
    
    print(f"\n🎯 AUTO-CACHING PERFORMANCE:")
    print(f"   First request (AI): {time1:.3f}s")
    print(f"   Second request (cached): {time2:.3f}s")
    print(f"   Speed improvement: {time1/time2:.1f}x faster!")

if __name__ == "__main__":
    test_auto_caching()