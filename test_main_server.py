import requests
import json

def test_main_server():
    print("🔍 Testing main.py AI Categorization Server...")
    print("=" * 50)
    
    # Test API Status
    try:
        api_response = requests.get("http://localhost:8002/api-status/")
        if api_response.status_code == 200:
            print("✅ API Status: Working")
        else:
            print(f"❌ API Status: HTTP {api_response.status_code}")
            print(f"   Error: {api_response.text}")
    except Exception as e:
        print(f"❌ API Status: Connection failed - {e}")
    
    # Test Categorization with proper format
    test_merchants = ["KFC", "McDonald's", "Nike Store", "Starbucks"]
    
    for merchant in test_merchants:
        try:
            # Use the exact format main.py expects
            cat_response = requests.post("http://localhost:8002/get-category/", 
                                       json={"name": merchant})
            if cat_response.status_code == 200:
                result = cat_response.json()
                category = result.get('ai_predicted_category', 'Unknown')
                confidence = result.get('ai_confidence_score', 0)
                print(f"✅ {merchant:15} → {category:12} ({confidence:.2f})")
            else:
                print(f"❌ {merchant:15} → HTTP {cat_response.status_code}")
                print(f"   Error: {cat_response.text}")
        except Exception as e:
            print(f"❌ {merchant:15} → Error: {e}")
    
    print("=" * 50)

if __name__ == "__main__":
    test_main_server()