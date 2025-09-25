# 🧪 WalletWise AI Backend - Endpoint Testing Guide

This guide provides multiple ways to test the WalletWise AI Backend endpoints, from simple manual testing to automated test suites.

## 📋 Prerequisites

1. **Start the Backend Server:**
   ```bash
   # Using Python directly
   python start_server.py
   
   # Or using uvicorn
   uvicorn main:app --host 127.0.0.1 --port 8000 --reload
   
   # Or using npm script
   npm run python:dev
   ```

2. **Verify Server is Running:**
   - Open http://127.0.0.1:8000/docs in your browser
   - You should see the Swagger UI documentation

---

## 🎯 Method 1: Interactive API Documentation (Easiest)

### Swagger UI Testing
1. **Open:** http://127.0.0.1:8000/docs
2. **Click** on any endpoint to expand it
3. **Click "Try it out"** button
4. **Fill in** the request parameters
5. **Click "Execute"** to test

### ReDoc Documentation
- **Alternative view:** http://127.0.0.1:8000/redoc
- More detailed documentation format
- Better for understanding API structure

---

## 🔧 Method 2: PowerShell/Command Line Testing

### Test Transaction Text Parsing

```powershell
# Test 1: Basic Zomato transaction
$body = @{
    text = "You spent Rs.500 at Zomato on 2024-01-15"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://127.0.0.1:8000/parse-text/" `
                  -Method POST `
                  -Body $body `
                  -ContentType "application/json"
```

```powershell
# Test 2: Swiggy Instamart transaction
$body = @{
    text = "INR 1200 debited from your account. Paid to Swiggy Instamart on 2024-01-16"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://127.0.0.1:8000/parse-text/" `
                  -Method POST `
                  -Body $body `
                  -ContentType "application/json"
```

### Test Category Prediction

```powershell
# Test cached category (should return from User History)
$body = @{
    name = "Zomato"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://127.0.0.1:8000/get-category/" `
                  -Method POST `
                  -Body $body `
                  -ContentType "application/json"
```

```powershell
# Test AI prediction (should use AI for unknown merchant)
$body = @{
    name = "Netflix"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://127.0.0.1:8000/get-category/" `
                  -Method POST `
                  -Body $body `
                  -ContentType "application/json"
```

### Test Learning System

```powershell
# Step 1: Add a new category
$body = @{
    receiver_name = "Netflix"
    confirmed_category = "Entertainment"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://127.0.0.1:8000/confirm-category/" `
                  -Method POST `
                  -Body $body `
                  -ContentType "application/json"
```

```powershell
# Step 2: Verify learning (should now return cached result)
$body = @{
    name = "Netflix"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://127.0.0.1:8000/get-category/" `
                  -Method POST `
                  -Body $body `
                  -ContentType "application/json"
```

---

## 🐍 Method 3: Python Testing Scripts

### Quick Individual Tests

```python
import requests
import json

BASE_URL = "http://127.0.0.1:8000"

# Test 1: Parse transaction text
def test_parse_text():
    data = {"text": "You spent Rs.500 at Zomato on 2024-01-15"}
    response = requests.post(f"{BASE_URL}/parse-text/", json=data)
    print(f"Status: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")

# Test 2: Get category prediction
def test_categorization():
    data = {"name": "Zomato"}
    response = requests.post(f"{BASE_URL}/get-category/", json=data)
    print(f"Status: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")

# Test 3: Confirm category (learning)
def test_learning():
    data = {"receiver_name": "Netflix", "confirmed_category": "Entertainment"}
    response = requests.post(f"{BASE_URL}/confirm-category/", json=data)
    print(f"Status: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")

# Run tests
test_parse_text()
test_categorization()
test_learning()
```

### Use Existing Test Scripts

```bash
# Run comprehensive test suite
python test_comprehensive.py

# Run local function tests (no server needed)
python test_local.py

# Run basic API tests
python test_api.py
```

---

## 🌐 Method 4: Web Browser/Postman Testing

### Using Browser Developer Tools

1. **Open Browser Developer Tools** (F12)
2. **Go to Console tab**
3. **Run JavaScript fetch requests:**

```javascript
// Test parse-text endpoint
fetch('http://127.0.0.1:8000/parse-text/', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
    },
    body: JSON.stringify({
        text: "You spent Rs.500 at Zomato on 2024-01-15"
    })
})
.then(response => response.json())
.then(data => console.log(data));
```

```javascript
// Test categorization endpoint
fetch('http://127.0.0.1:8000/get-category/', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
    },
    body: JSON.stringify({
        name: "Zomato"
    })
})
.then(response => response.json())
.then(data => console.log(data));
```

### Using Postman

1. **Install Postman** (if not already installed)
2. **Create new request collection**
3. **Set up requests:**

**Parse Text Request:**
- Method: `POST`
- URL: `http://127.0.0.1:8000/parse-text/`
- Headers: `Content-Type: application/json`
- Body (raw JSON):
  ```json
  {
    "text": "You spent Rs.500 at Zomato on 2024-01-15"
  }
  ```

**Get Category Request:**
- Method: `POST`
- URL: `http://127.0.0.1:8000/get-category/`
- Headers: `Content-Type: application/json`
- Body (raw JSON):
  ```json
  {
    "name": "Zomato"
  }
  ```

---

## 📸 Method 5: Testing Image Upload (OCR)

### Using PowerShell

```powershell
# Test image upload (requires an image file)
$imagePath = "C:\path\to\your\receipt.jpg"
$uri = "http://127.0.0.1:8000/parse-image/"

# Create multipart form data
$boundary = [System.Guid]::NewGuid().ToString()
$bodyLines = @(
    "--$boundary",
    'Content-Disposition: form-data; name="file"; filename="receipt.jpg"',
    'Content-Type: image/jpeg',
    '',
    [System.Convert]::ToBase64String([System.IO.File]::ReadAllBytes($imagePath)),
    "--$boundary--"
)
$body = $bodyLines -join "`r`n"

Invoke-RestMethod -Uri $uri -Method POST -Body $body -ContentType "multipart/form-data; boundary=$boundary"
```

### Using Python

```python
import requests

def test_image_upload():
    url = "http://127.0.0.1:8000/parse-image/"
    
    # Use a sample image file
    with open("sample_receipt.jpg", "rb") as image_file:
        files = {"file": image_file}
        response = requests.post(url, files=files)
        
    print(f"Status: {response.status_code}")
    print(f"Response: {response.json()}")

# Note: You need to have an image file for this test
```

---

## 🧪 Method 6: Automated Testing with Different Scenarios

### Create Custom Test Script

```python
#!/usr/bin/env python3
"""
Custom test scenarios for specific use cases
"""

import requests
import json

BASE_URL = "http://127.0.0.1:8000"

def run_indian_transaction_tests():
    """Test with various Indian transaction formats"""
    
    test_cases = [
        # UPI transactions
        "UPI: Rs.299 sent to Netflix from SBI Bank on 2024-01-15",
        "Amount Rs.1500 transferred to Swiggy via GooglePay Ref:GP123456",
        
        # Card transactions  
        "Your HDFC Card ending 1234 charged Rs.2500 at H&M Store",
        "Debit Card transaction: Rs.450 at Apollo Pharmacy POS",
        
        # Net banking
        "NEFT: Rs.5000 transferred to IRCTC for ticket booking",
        "IMPS: Rs.150 sent to Pratik Jain mobile: 9876543210",
        
        # Wallet transactions
        "Paytm Wallet: Rs.200 spent at Big Bazaar",
        "PhonePe: Rs.75 paid to auto driver via QR scan"
    ]
    
    print("🇮🇳 Testing Indian Transaction Formats")
    print("="*50)
    
    for i, text in enumerate(test_cases, 1):
        print(f"\nTest {i}: {text}")
        response = requests.post(f"{BASE_URL}/parse-text/", json={"text": text})
        if response.status_code == 200:
            result = response.json()
            print(f"✅ Merchant: {result.get('recipientName')}")
            print(f"💰 Amount: Rs.{result.get('amount')}")
        else:
            print(f"❌ Failed: {response.text}")

def test_category_learning_flow():
    """Test complete learning workflow"""
    
    print("\n🧠 Testing Category Learning Flow")
    print("="*50)
    
    # New merchants to learn
    merchants = [
        {"name": "Dominos Pizza", "category": "Food"},
        {"name": "Reliance Fresh", "category": "Groceries"},
        {"name": "BookMyShow", "category": "Entertainment"}
    ]
    
    for merchant in merchants:
        # Step 1: Get initial prediction
        print(f"\n--- Testing: {merchant['name']} ---")
        response = requests.post(f"{BASE_URL}/get-category/", 
                               json={"name": merchant['name']})
        initial = response.json()
        print(f"Initial prediction: {initial.get('category')} ({initial.get('source')})")
        
        # Step 2: Provide correction
        correction_data = {
            "receiver_name": merchant['name'],
            "confirmed_category": merchant['category']
        }
        requests.post(f"{BASE_URL}/confirm-category/", json=correction_data)
        print(f"User correction: {merchant['category']}")
        
        # Step 3: Verify learning
        response = requests.post(f"{BASE_URL}/get-category/", 
                               json={"name": merchant['name']})
        learned = response.json()
        print(f"After learning: {learned.get('category')} ({learned.get('source')})")
        
        if learned.get('source') == 'User History (Cache)':
            print("✅ Learning successful!")
        else:
            print("❌ Learning failed!")

if __name__ == "__main__":
    run_indian_transaction_tests()
    test_category_learning_flow()
```

---

## 📊 Expected Responses

### Parse Text Response
```json
{
  "recipientName": "Zomato",
  "amount": 500.0,
  "isDebit": true,
  "timestamp": "2025-09-21T19:33:56.286330"
}
```

### Get Category Response (Cached)
```json
{
  "receiver_name": "Zomato",
  "category": "Food",
  "source": "User History (Cache)"
}
```

### Get Category Response (AI Predicted)
```json
{
  "receiver_name": "Netflix",
  "category": "Entertainment",
  "source": "AI Prediction"
}
```

### Confirm Category Response
```json
{
  "status": "success",
  "message": "Saved 'Netflix' as 'Entertainment'."
}
```

---

## 🚨 Troubleshooting

### Common Issues:

1. **Connection Refused:**
   - Check if server is running: `http://127.0.0.1:8000/docs`
   - Restart server if needed

2. **422 Validation Error:**
   - Check request body format
   - Ensure required fields are present

3. **500 Internal Server Error:**
   - Check server logs in terminal
   - Verify dependencies are installed

4. **CORS Issues (Browser):**
   - Use server-side tools instead
   - Or configure CORS in main.py

### Debug Commands:
```bash
# Check server status
curl http://127.0.0.1:8000/docs

# View server logs
# Check the terminal where uvicorn is running

# Test with verbose output
python test_comprehensive.py
```

---

## 🎯 Quick Testing Checklist

- [ ] Server is running (check /docs)
- [ ] Parse text endpoint works
- [ ] Category prediction works (cached items)
- [ ] Category prediction works (new items)
- [ ] Learning system accepts corrections
- [ ] Learning system returns cached results
- [ ] All responses have correct format
- [ ] Error handling works for invalid requests

---

**💡 Pro Tip:** Start with the Swagger UI (Method 1) for quick testing, then use Python scripts (Method 3) for comprehensive testing and automation.