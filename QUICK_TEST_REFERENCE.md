# 🚀 Quick Testing Reference - WalletWise AI Backend

## Server Commands
```bash
# Start server
uvicorn main:app --host 127.0.0.1 --port 8000 --reload

# Or use the helper script
python start_server.py

# Test all endpoints
python test_comprehensive.py
```

## 🎯 Quick PowerShell Tests

### 1. Parse SMS Transaction
```powershell
$body = @{text="You spent Rs.500 at Zomato on 2024-01-15"} | ConvertTo-Json
Invoke-RestMethod -Uri "http://127.0.0.1:8000/parse-text/" -Method POST -Body $body -ContentType "application/json"
```

### 2. Get Category (Cached)
```powershell
$body = @{name="Zomato"} | ConvertTo-Json
Invoke-RestMethod -Uri "http://127.0.0.1:8000/get-category/" -Method POST -Body $body -ContentType "application/json"
```

### 3. Learn New Category
```powershell
$body = @{receiver_name="Netflix"; confirmed_category="Entertainment"} | ConvertTo-Json
Invoke-RestMethod -Uri "http://127.0.0.1:8000/confirm-category/" -Method POST -Body $body -ContentType "application/json"
```

## 🐍 Quick Python Tests

### Single Function Test
```python
import requests

# Test transaction parsing
response = requests.post("http://127.0.0.1:8000/parse-text/", 
                        json={"text": "Rs.500 spent at Zomato"})
print(response.json())

# Test categorization
response = requests.post("http://127.0.0.1:8000/get-category/", 
                        json={"name": "Zomato"})
print(response.json())
```

## 🌐 Browser Console Test
```javascript
// Quick browser test
fetch('http://127.0.0.1:8000/parse-text/', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({text: "Rs.500 spent at Zomato"})
}).then(r => r.json()).then(console.log);
```

## 📋 Test Data Examples

### SMS Formats
```
"You spent Rs.500 at Zomato on 2024-01-15"
"INR 1200 debited. Paid to Swiggy Instamart on 2024-01-16"
"Rs.2500 paid to H&M via UPI Ref: 123456789"
"Amount Rs.150 spent at Apollo Pharmacy"
```

### Merchants (Pre-loaded)
- Zomato → Food
- Swiggy Instamart → Groceries  
- H&M → Clothes
- Apollo Pharmacy → Health
- IRCTC → Travelling
- Pratik Jain → Personal

### Categories Available
Food, Groceries, Clothes, Health, Personal, Travelling, Bills, Entertainment, Other

## 🔗 Quick Links
- **API Docs:** http://127.0.0.1:8000/docs
- **Alternative Docs:** http://127.0.0.1:8000/redoc

## ✅ Expected Results

### Parse Text Success
```json
{
  "recipientName": "Zomato",
  "amount": 500.0,
  "isDebit": true,
  "timestamp": "2025-09-21T..."
}
```

### Category Success (Cached)
```json
{
  "receiver_name": "Zomato",
  "category": "Food", 
  "source": "User History (Cache)"
}
```

### Learning Success
```json
{
  "status": "success",
  "message": "Saved 'Netflix' as 'Entertainment'."
}
```