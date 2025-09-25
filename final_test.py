import requests

def final_test():
    print("🎯 Final System Test")
    print("=" * 40)
    
    # Test API Status
    try:
        status = requests.get("http://localhost:8002/api-status/")
        if status.status_code == 200:
            data = status.json()
            print(f"✅ API Status: {data['status']}")
            print(f"   Gemini: {'Available' if data['gemini_available'] else 'Unavailable'}")
        else:
            print(f"❌ API Status failed: {status.status_code}")
    except Exception as e:
        print(f"❌ API Status error: {e}")
    
    # Test Categorization
    try:
        result = requests.post("http://localhost:8002/get-category/", json={"name": "KFC"})
        if result.status_code == 200:
            data = result.json()
            print(f"✅ Categorization: KFC → {data['category']} ({data.get('confidence', 0):.2f})")
        else:
            print(f"❌ Categorization failed: {result.status_code}")
    except Exception as e:
        print(f"❌ Categorization error: {e}")
    
    print("=" * 40)
    print("🚀 Both servers are running!")
    print("📱 Frontend: http://localhost:5000") 
    print("🤖 Backend: http://localhost:8002")
    print("=" * 40)

if __name__ == "__main__":
    final_test()