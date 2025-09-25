import requests

merchants = ["McDonald's", "Nike Store", "CyberPunks General Store", "Starbucks", "Walmart"]

print("🧪 Testing AI Categorization:")
print("=" * 40)

for merchant in merchants:
    try:
        response = requests.post("http://localhost:8002/get-category/", json={"name": merchant})
        if response.status_code == 200:
            result = response.json()
            print(f"{merchant:25} → {result['category']:12} ({result.get('confidence', 0):.2f})")
        else:
            print(f"{merchant:25} → Error {response.status_code}")
    except Exception as e:
        print(f"{merchant:25} → Error: {e}")

print("=" * 40)