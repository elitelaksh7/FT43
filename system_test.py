import requests

def test_servers():
    print("🔍 Testing AI Categorization System...")
    print("=" * 50)
    
    # Test Backend API
    try:
        api_response = requests.get("http://localhost:8002/api-status/")
        if api_response.status_code == 200:
            data = api_response.json()
            print(f"✅ Backend API: {data['status']}")
            print(f"   Gemini AI: {'Available' if data['gemini_available'] else 'Unavailable'}")
            print(f"   Categories: {data['categories_count']}")
        else:
            print(f"❌ Backend API: HTTP {api_response.status_code}")
    except Exception as e:
        print(f"❌ Backend API: Connection failed - {e}")
    
    # Test Frontend
    try:
        frontend_response = requests.get("http://localhost:5000/")
        if frontend_response.status_code == 200:
            print(f"✅ Frontend: Running (HTTP {frontend_response.status_code})")
        else:
            print(f"❌ Frontend: HTTP {frontend_response.status_code}")
    except Exception as e:
        print(f"❌ Frontend: Connection failed - {e}")
    
    # Test Categorization
    try:
        cat_response = requests.post("http://localhost:8002/get-category/", json={"name": "McDonald's"})
        if cat_response.status_code == 200:
            result = cat_response.json()
            print(f"✅ Categorization: McDonald's → {result['category']} ({result.get('confidence', 0):.2f})")
        else:
            print(f"❌ Categorization: HTTP {cat_response.status_code}")
    except Exception as e:
        print(f"❌ Categorization: Failed - {e}")
    
    print("=" * 50)
    print("🚀 System Ready!")
    print("📱 Frontend: http://localhost:5000")
    print("🤖 Backend API: http://localhost:8002")
    print("=" * 50)

if __name__ == "__main__":
    test_servers()