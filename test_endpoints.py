import requests
import json

def test_api_status():
    try:
        response = requests.get("http://localhost:8002/api-status/")
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print("✅ API Status Response:")
            print(json.dumps(data, indent=2))
        else:
            print(f"❌ Error: {response.text}")
            
    except Exception as e:
        print(f"❌ Connection Error: {e}")

def test_categorization():
    try:
        response = requests.post("http://localhost:8002/get-category/", json={"name": "KFC"})
        print(f"\nCategorization Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print("✅ Categorization Response:")
            print(json.dumps(data, indent=2))
        else:
            print(f"❌ Error: {response.text}")
            
    except Exception as e:
        print(f"❌ Connection Error: {e}")

if __name__ == "__main__":
    test_api_status()
    test_categorization()