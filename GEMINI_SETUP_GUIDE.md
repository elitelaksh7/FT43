# 🤖 Setting Up Google Gemini AI for WalletWise Backend

## Why Use Gemini AI?

Google's Gemini AI provides **significantly better** transaction categorization with:
- 🧠 **Advanced reasoning** for complex merchant names
- 🌐 **Web knowledge** of latest businesses and services  
- 🇮🇳 **Indian market awareness** (Zomato, Swiggy, IRCTC, etc.)
- 📊 **Context understanding** for ambiguous cases
- 🎯 **High accuracy** compared to simple rule-based systems

---

## 🔑 Getting Your Gemini API Key (Free!)

### Step 1: Visit Google AI Studio
1. Go to: **https://makersuite.google.com/app/apikey**
2. Sign in with your Google account

### Step 2: Create API Key
1. Click **"Create API Key"**
2. Choose **"Create API key in new project"** (recommended)
3. Copy the generated API key (starts with `AIza...`)

### Step 3: Configure in WalletWise
1. **Copy the environment file:**
   ```bash
   cp .env.example .env
   ```

2. **Edit the .env file:**
   ```
   GOOGLE_AI_API_KEY=AIzaSyA...your_actual_key_here
   ```

3. **Restart the server:**
   ```bash
   python start_server.py
   ```

---

## 🚀 Testing Enhanced AI Categorization

### Test These Merchants (Should be Much More Accurate):

#### Indian Food Services:
- `Zomato` → Should return "Food"
- `Swiggy` → Should return "Food" 
- `Dominos Pizza` → Should return "Food"
- `KFC India` → Should return "Food"

#### Grocery & Shopping:
- `Swiggy Instamart` → Should return "Groceries"
- `BigBasket` → Should return "Groceries"
- `Grofers` → Should return "Groceries"
- `Amazon Fresh` → Should return "Groceries"

#### Clothing & Fashion:
- `Myntra` → Should return "Clothes"
- `Ajio` → Should return "Clothes"
- `H&M India` → Should return "Clothes"

#### Entertainment:
- `Netflix India` → Should return "Entertainment"
- `Amazon Prime Video` → Should return "Entertainment"
- `BookMyShow` → Should return "Entertainment"

#### Travel:
- `IRCTC` → Should return "Travelling"
- `Uber India` → Should return "Travelling"
- `Ola Cabs` → Should return "Travelling"

---

## 🧪 Quick Test Commands

### PowerShell Test:
```powershell
# Test enhanced AI categorization
$body = @{name="BookMyShow"} | ConvertTo-Json
Invoke-RestMethod -Uri "http://127.0.0.1:8000/get-category/" -Method POST -Body $body -ContentType "application/json"
```

### Check API Status:
```powershell
Invoke-RestMethod -Uri "http://127.0.0.1:8000/api-status/" -Method GET
```

---

## 📊 Expected Enhanced Responses

### With Gemini API Key (Enhanced):
```json
{
  "receiver_name": "BookMyShow",
  "category": "Entertainment",
  "source": "AI Prediction (Enhanced Gemini)",
  "confidence": "AI prediction with high confidence",
  "api_status": "Connected"
}
```

### Without API Key (Fallback):
```json
{
  "receiver_name": "BookMyShow", 
  "category": "Other",
  "source": "Smart Fallback",
  "confidence": "AI unavailable, used smart fallback",
  "api_status": "API key not configured"
}
```

---

## 🔍 Verification Steps

1. **Check API Status:**
   - Visit: `http://127.0.0.1:8000/api-status/`
   - Should show: `"google_ai_status": "Connected"`

2. **Test Complex Merchants:**
   - Try: "Rebel Foods" (should detect as Food)
   - Try: "Nykaa Fashion" (should detect as Clothes)
   - Try: "Urban Company" (should detect as Personal)

3. **Compare Accuracy:**
   - Test same merchants with/without API key
   - Enhanced version should be significantly more accurate

---

## 💡 Benefits You'll See

### Before (Fallback Mode):
- Limited to pre-programmed merchant list
- Many merchants categorized as "Other"
- No context awareness

### After (Gemini Enhanced):
- ✅ Understands new/unknown merchants
- ✅ Considers business context and industry
- ✅ Handles variations in merchant names
- ✅ Better accuracy for Indian businesses
- ✅ Learns from context and patterns

---

## 🔧 Troubleshooting

### API Key Not Working:
1. Check key format (should start with `AIza`)
2. Ensure no extra spaces in .env file
3. Restart server after adding key
4. Check Google AI Studio for usage limits

### Still Getting "Other" Category:
1. Try more specific merchant names
2. Check if merchant exists in cached database first
3. Look at confidence explanation in response

### Rate Limits:
- Gemini has generous free tier limits
- For production, consider upgrading to paid plan
- System will fallback gracefully if limits exceeded

---

## 🎯 Next Steps

1. **Get your API key** from Google AI Studio
2. **Configure it** in the .env file  
3. **Test the enhanced accuracy** with various merchants
4. **Compare results** with and without the API key
5. **Enjoy significantly better categorization!**

---

**🚀 With Gemini AI, your transaction categorization will be much more accurate and intelligent!**