import google.generativeai as genai
import os
import random
import re
import io
import json
from datetime import datetime
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from PIL import Image
import pytesseract
from dotenv import load_dotenv

# --- 1. Configuration & Initialization ---

# Load environment variables
load_dotenv()

# Configure Google AI (Gemini)
GOOGLE_AI_API_KEY = os.getenv("GOOGLE_AI_API_KEY")
if GOOGLE_AI_API_KEY:
    genai.configure(api_key=GOOGLE_AI_API_KEY)
    print("✅ Google AI (Gemini) configured successfully!")
else:
    print("⚠️  Google AI API key not found. Using fallback categorization.")
    print("   Set GOOGLE_AI_API_KEY in your .env file for enhanced AI categorization.")

app = FastAPI(
    title="WalletWise AI API",
    description="API for parsing transactions and providing AI-powered categorization."
)

# Add CORS middleware to allow frontend connections
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5000", "http://127.0.0.1:5000", "http://localhost:3000", "http://localhost:5173", "*"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# The list of master categories your app will use.
CATEGORIES = ['Food', 'Groceries', 'Clothes', 'Health', 'Personal', 'Travelling', 'Bills', 'Entertainment', 'Other']

def get_all_categories() -> list:
    """
    Returns all available categories including user-created custom categories.
    """
    # Get base categories
    base_categories = set(CATEGORIES)
    
    # Get custom categories from user corrections
    custom_categories = set(USER_CORRECTIONS_DB.values())
    
    # Remove "Other" from custom categories as it's already in base
    custom_categories.discard("Other")
    
    # Combine and sort
    all_categories = sorted(list(base_categories.union(custom_categories)))
    
    print(f"📋 Available categories: {all_categories}")  # Debug log
    return all_categories


# --- 2. Simulated Firebase Database ---
# In your real application, these functions would interact with a Firestore collection.
# This dictionary simulates a database to store user-confirmed categorizations.
USER_CORRECTIONS_DB = {
    "Zomato": "Food",
    "Swiggy Instamart": "Groceries",
    "Pratik Jain": "Personal",
    "H&M": "Clothes",
    "IRCTC": "Travelling",
    "Apollo Pharmacy": "Health",
    "KFC": "Food",
    "McDonald's": "Food",
    "Burger King": "Food",
    "Pizza Hut": "Food",
    "Domino's": "Food"
}

# Continuous learning storage
FEEDBACK_TRAINING_DATA = []  # Stores user feedback for model improvement
AI_PREDICTION_LOG = []       # Logs all AI predictions for analysis
AI_AUTO_CACHED = set()       # Tracks which items were auto-cached by AI (vs user-confirmed)

# Enhanced learning system for pattern recognition
def extract_brand_patterns(user_corrections: dict) -> dict:
    """
    Analyzes user corrections to extract brand patterns and category associations.
    Returns patterns that can help predict similar brands.
    """
    patterns = {
        "brand_keywords": {},  # Keywords -> Category mapping
        "category_examples": {},  # Category -> List of examples
        "similar_brands": {}  # Brand type -> Category mapping
    }
    
    # Build category examples
    for merchant, category in user_corrections.items():
        if category not in patterns["category_examples"]:
            patterns["category_examples"][category] = []
        patterns["category_examples"][category].append(merchant.lower())
    
    # Extract brand keywords and patterns
    brand_indicators = {
        "shoes": ["nike", "adidas", "puma", "reebok", "converse", "vans", "jordan", "shoe", "footwear", "sneaker"],
        "food": ["mcdonald", "kfc", "burger", "pizza", "restaurant", "cafe", "zomato", "swiggy", "domino"],
        "tech": ["apple", "samsung", "microsoft", "google", "amazon", "flipkart"],
        "fashion": ["h&m", "zara", "uniqlo", "myntra", "ajio", "fashion"],
        "pharmacy": ["apollo", "1mg", "netmeds", "pharmacy", "medical"],
        "fuel": ["shell", "hp", "indian oil", "petrol", "fuel", "gas station"],
        "telecom": ["jio", "airtel", "bsnl", "vodafone", "telecom"]
    }
    
    # Map brand types to categories based on user corrections
    for merchant, category in user_corrections.items():
        merchant_lower = merchant.lower()
        for brand_type, keywords in brand_indicators.items():
            for keyword in keywords:
                if keyword in merchant_lower:
                    patterns["similar_brands"][brand_type] = category
                    if brand_type not in patterns["brand_keywords"]:
                        patterns["brand_keywords"][brand_type] = []
                    patterns["brand_keywords"][brand_type].append(merchant)
                    break
    
    return patterns

def get_smart_examples(receiver_name: str, user_corrections: dict) -> list[dict]:
    """
    Returns smart examples based on pattern recognition and brand similarity.
    """
    patterns = extract_brand_patterns(user_corrections)
    receiver_lower = receiver_name.lower()
    
    # Start with random examples
    num_random = min(len(user_corrections), 3)
    examples = [
        {"receiver": k, "category": v} for k, v in random.sample(list(user_corrections.items()), num_random)
    ] if user_corrections else []
    
    # Add pattern-based examples
    brand_keywords = {
        "shoes": ["nike", "adidas", "puma", "reebok", "converse", "vans", "jordan", "shoe", "footwear", "sneaker"],
        "food": ["mcdonald", "kfc", "burger", "pizza", "restaurant", "cafe", "food", "dining"],
        "tech": ["apple", "samsung", "microsoft", "google", "tech", "electronics"],
        "fashion": ["h&m", "zara", "uniqlo", "fashion", "clothing", "apparel"],
        "pharmacy": ["apollo", "1mg", "netmeds", "pharmacy", "medical", "health"],
        "fuel": ["shell", "hp", "petrol", "fuel", "gas"],
        "telecom": ["jio", "airtel", "bsnl", "vodafone", "telecom", "mobile"]
    }
    
    # Find relevant patterns for current merchant
    for brand_type, keywords in brand_keywords.items():
        for keyword in keywords:
            if keyword in receiver_lower:
                # Find similar examples from user corrections
                for merchant, category in user_corrections.items():
                    merchant_lower = merchant.lower()
                    if any(kw in merchant_lower for kw in keywords):
                        example = {"receiver": merchant, "category": category}
                        if example not in examples:
                            examples.append(example)
                            # Add pattern explanation
                            examples.append({
                                "receiver": f"Pattern: {brand_type.title()} brands", 
                                "category": category
                            })
                break
    
    return examples[:8]  # Limit to 8 examples


# --- 3. Pydantic Models for API Data ---

class TransactionText(BaseModel):
    text: str

class Receiver(BaseModel):
    name: str

class ConfirmedTransaction(BaseModel):
    receiver_name: str
    confirmed_category: str

class FeedbackData(BaseModel):
    receiver_name: str
    ai_predicted_category: str
    user_corrected_category: str
    confidence_score: float
    timestamp: str = ""

class TrainingDataEntry(BaseModel):
    merchant_name: str
    correct_category: str
    context: str = ""
    source: str = "user_feedback"  # user_feedback, historical_data, manual_entry


# --- 4. Core Logic Functions ---

def extract_transaction_details(text: str) -> dict:
    """Extracts transaction details from a raw text string using RegEx."""
    amount_match = re.search(r'(?:Rs|INR)\.?\s*([\d,]+\.?\d*)', text, re.IGNORECASE)
    merchant_match = re.search(r'(?:Paid to|at|to)\s+([A-Za-z0-9\s.&\'\-]+?)(?:\s(?:on|via|Ref))', text, re.IGNORECASE)

    amount = float(amount_match.group(1).replace(',', '')) if amount_match else None
    merchant = merchant_match.group(1).strip() if merchant_match else "Unknown"

    return {
        "recipientName": merchant,
        "amount": amount,
        "isDebit": "spent" in text.lower() or "debited" in text.lower() or "paid to" in text.lower(),
        "timestamp": datetime.now().isoformat()
    }

def extract_payment_app_transactions(text: str, image=None) -> dict:
    """
    Extracts transaction details from payment app screenshots (like PhonePe, PayTM, Google Pay).
    
    Args:
        text: The OCR-extracted text from the screenshot
        image: Optional PIL Image object for advanced image analysis
    
    Returns:
        Dictionary with transactions list and metadata
    """
    # Parse the transaction lines from the OCR text
    transactions = []
    
    # Common patterns in payment apps
    date_pattern = r'(\d{1,2}\s+\w+|\d{1,2}[-/]\d{1,2}[-/]\d{2,4})'
    amount_pattern = r'[₹₨]?(\d+(?:[,.]\d+)?)|[-+]?\s?[₹₨]?\s?(\d+(?:[,.]\d+)?)'
    
    # Try to extract transactions from the text
    # Split by lines and look for patterns that indicate transaction entries
    lines = text.split('\n')
    
    # First, try to identify a structured transaction list pattern
    current_merchant = None
    current_date = None
    current_amount = None
    is_credit = False
    
    for i, line in enumerate(lines):
        line = line.strip()
        if not line:
            continue
        
        # Check for merchant name patterns (typically followed by date or amount)
        merchant_match = re.search(r'([A-Za-z0-9\s&\'\-]+)(?:\s+\d|\s+[₹₨])', line)
        
        # Check for amounts with currency symbols or +/- indicators
        amount_match = re.search(amount_pattern, line)
        
        # Check for date patterns
        date_match = re.search(date_pattern, line)
        
        # Detect credit/debit based on "+" prefix or green color (determined by position)
        credit_indicator = "+" in line or "received" in line.lower() or "added" in line.lower()
        
        # If we find a merchant and amount on the same line, it's likely a transaction
        if merchant_match and amount_match:
            merchant = merchant_match.group(1).strip()
            amount_str = amount_match.group(1) if amount_match.group(1) else amount_match.group(2)
            amount = float(amount_str.replace(',', ''))
            
            # Check next line for date if not found in current line
            transaction_date = date_match.group(1) if date_match else None
            if not transaction_date and i+1 < len(lines):
                next_line_date_match = re.search(date_pattern, lines[i+1])
                if next_line_date_match:
                    transaction_date = next_line_date_match.group(1)
            
            transactions.append({
                "merchant": merchant,
                "amount": amount,
                "date": transaction_date if transaction_date else datetime.now().strftime("%d %b"),
                "type": "credit" if credit_indicator else "debit"
            })
            
        # Handle special case where information is split across lines
        elif merchant_match and not amount_match and i+1 < len(lines):
            current_merchant = merchant_match.group(1).strip()
            next_line = lines[i+1].strip()
            amount_match_next = re.search(amount_pattern, next_line)
            if amount_match_next:
                amount_str = amount_match_next.group(1) if amount_match_next.group(1) else amount_match_next.group(2)
                amount = float(amount_str.replace(',', ''))
                
                # Look for date in either line
                date_match_current = re.search(date_pattern, line)
                date_match_next = re.search(date_pattern, next_line)
                transaction_date = None
                if date_match_current:
                    transaction_date = date_match_current.group(1)
                elif date_match_next:
                    transaction_date = date_match_next.group(1)
                
                transactions.append({
                    "merchant": current_merchant,
                    "amount": amount,
                    "date": transaction_date if transaction_date else datetime.now().strftime("%d %b"),
                    "type": "credit" if credit_indicator or "+" in next_line else "debit"
                })
    
    # If no transactions were found with standard patterns, try extracting common app-specific patterns
    if not transactions:
        # Check for EatClub pattern (based on the screenshot provided)
        eatclub_pattern = r'EatClub\s+(\d+\s+\w+).*?[₹₨]?(\d+)'
        eatclub_matches = re.findall(eatclub_pattern, text, re.IGNORECASE)
        
        for match in eatclub_matches:
            date = match[0].strip()
            amount = float(match[1].replace(',', ''))
            transactions.append({
                "merchant": "EatClub",
                "amount": amount,
                "date": date,
                "type": "debit"  # Assuming payments to EatClub are debits
            })
            
        # Check for PayTM/PhonePe pattern
        paytm_pattern = r'(paid to|received from)\s+([A-Za-z0-9\s&\'\-]+)\s+[₹₨]?\s*(\d+(?:[,.]\d+)?)'
        paytm_matches = re.findall(paytm_pattern, text, re.IGNORECASE)
        
        for match in paytm_matches:
            transaction_type = "debit" if "paid" in match[0].lower() else "credit"
            merchant = match[1].strip()
            amount = float(match[2].replace(',', ''))
            transactions.append({
                "merchant": merchant,
                "amount": amount,
                "date": datetime.now().strftime("%d %b"),
                "type": transaction_type
            })
    
    # Process results
    result = {
        "transactions": transactions,
        "count": len(transactions),
        "app_detected": detect_payment_app(text, image),
        "confidence": 0.85 if transactions else 0.4
    }
    
    return result

def detect_payment_app(text: str, image=None) -> str:
    """Detects which payment app the screenshot is from based on text and image characteristics."""
    text_lower = text.lower()
    
    if "phonep" in text_lower or "phone p" in text_lower:
        return "PhonePe"
    elif "paytm" in text_lower:
        return "Paytm"
    elif "gpay" in text_lower or "google pay" in text_lower:
        return "Google Pay"
    elif "eatclub" in text_lower:
        return "EatClub"
    elif "whatsapp" in text_lower and "upi" in text_lower:
        return "WhatsApp Payments"
    elif "amazon pay" in text_lower:
        return "Amazon Pay"
    elif "bhim" in text_lower:
        return "BHIM"
    else:
        return "Unknown Payment App"

def get_ai_category_prediction(receiver_name: str, examples: list[dict]) -> tuple[str, str, float, list]:
    """
    Calls the Gemini model with enhanced confidence scoring for better categorization.
    Returns (category, confidence_explanation, confidence_score, alternatives)
    """
    
    # If no API key, return fallback
    if not GOOGLE_AI_API_KEY:
        print(f"❌ No Gemini API key found for '{receiver_name}' - using fallback")
        return "Other", "No AI API key configured - using fallback", 0.0, []
    
    print(f"🔑 Using Gemini API for '{receiver_name}'...")  # Debug log
    
    # Build examples section
    prompt_examples = ""
    if examples:
        prompt_examples = "Here are some examples from the user's transaction history:\n"
        for eg in examples:
            prompt_examples += f"• {eg['receiver']} → {eg['category']}\n"
        prompt_examples += "\n"
    
    # Get all available categories including custom ones
    all_categories = get_all_categories()
    
    # Enhanced prompt with pattern recognition
    prompt = f"""You are an expert financial categorization AI for an Indian fintech app with advanced pattern recognition capabilities.

AVAILABLE CATEGORIES: {', '.join(all_categories)}

STANDARD CATEGORY DEFINITIONS:
- Food: Restaurants, cafes, food delivery, groceries (Starbucks, McDonald's, Zomato, Swiggy)
- Entertainment: Streaming, movies, games, concerts (Netflix, Spotify, BookMyShow, Prime Video)
- Travelling: Transport, fuel, travel booking (Uber, Ola, Shell, HP Petrol, IRCTC, Airlines)
- Clothes: Fashion, apparel, footwear (H&M, Zara, Myntra, Nike, Adidas)
- Health: Pharmacy, hospitals, medical (Apollo Pharmacy, 1mg, Practo, Netmeds)
- Bills: Utilities, phone, internet (Jio, Airtel, BSNL, electricity, gas)
- Groceries: Supermarkets, daily essentials (BigBasket, Grofers, Blinkit, DMart)
- Other: General marketplaces, unclear merchants (Amazon, Flipkart, unknown stores)

CRITICAL PATTERN LEARNING INSTRUCTIONS:
1. **LEARN FROM USER CORRECTIONS**: If the user has corrected similar brands to custom categories, follow that pattern!
2. **BRAND SIMILARITY**: Nike, Adidas, Puma, Reebok are all similar sportswear brands
3. **CUSTOM CATEGORIES**: User may create categories like "Shoes", "Electronics", "Personal Care" - respect these preferences
4. **PRIORITY**: User-created patterns > Standard definitions
5. **NEW CATEGORIES**: If a merchant doesn't fit well into existing categories, suggest a NEW appropriate category name (e.g., "Fitness", "Wellness", "Pet Care", "Hobbies") instead of defaulting to "Other"

{prompt_examples}MERCHANT: "{receiver_name}"

🔍 PATTERN ANALYSIS:
- Look at the examples above for similar brands or keywords
- If user corrected "Nike" to "Shoes", then "Adidas", "Puma" should also be "Shoes"
- If user corrected "Apple Store" to "Electronics", then "Samsung Store" should also be "Electronics"
- Follow user preferences over standard categories!
- If no existing category fits well, suggest a NEW specific category rather than "Other"

Analyze this merchant name and respond with ONLY valid JSON (no markdown, no extra text):
{{
  "primary_category": "Category_Name",
  "confidence": 0.95,
  "reasoning": "Explain pattern recognition and user preference learning",
  "alternatives": [
    {{"category": "Alternative1", "confidence": 0.03}},
    {{"category": "Alternative2", "confidence": 0.02}}
  ]
}}"""

    try:
        # Use the latest Gemini model with optimized settings
        generation_config = genai.types.GenerationConfig(
            temperature=0.1,
            top_p=0.8,
            top_k=40,
            max_output_tokens=1024
        )
        
        model = genai.GenerativeModel(
            'gemini-1.5-flash-8b',
            generation_config=generation_config
        )
        response = model.generate_content(prompt)
        response_text = response.text.strip()
        
        print(f"🤖 AI Response for '{receiver_name}': {response_text[:200]}...")  # Debug log
        
        try:
            # Try to parse JSON response - clean markdown code blocks first
            cleaned_response = response_text.replace('```json', '').replace('```', '').strip()
            ai_response = json.loads(cleaned_response)
            
            primary_category = ai_response.get("primary_category", "Other")
            confidence = ai_response.get("confidence", 0.5)
            reasoning = ai_response.get("reasoning", "AI prediction")
            alternatives = ai_response.get("alternatives", [])
            
            # Validate primary category
            if primary_category not in all_categories:
                # Try mapping common variations to standard categories
                category_mapping = {
                    "food & dining": "Food",
                    "dining": "Food", 
                    "restaurant": "Food",
                    "food delivery": "Food",
                    "grocery": "Groceries",
                    "shopping": "Clothes",
                    "fashion": "Clothes",
                    "medical": "Health",
                    "healthcare": "Health",
                    "transport": "Travelling",
                    "travel": "Travelling",
                    "utilities": "Bills",
                    "entertainment & media": "Entertainment",
                    "streaming": "Entertainment"
                }
                mapped_category = category_mapping.get(primary_category.lower())
                if mapped_category and mapped_category in all_categories:
                    primary_category = mapped_category
                    confidence = max(0.3, confidence - 0.2)  # Lower confidence for mapped categories
                else:
                    # Check if it's close to any user-created category
                    for category in all_categories:
                        if primary_category.lower() in category.lower() or category.lower() in primary_category.lower():
                            primary_category = category
                            break
                    else:
                        # AI suggested a new category - keep it for potential new category creation
                        # Don't force to "Other" - let the frontend handle new category suggestions
                        pass  # Keep the AI's suggested category name
            
            return primary_category, reasoning, confidence, alternatives
            
        except Exception as json_error:
            # Fallback to simple parsing if JSON fails
            print(f"⚠️ JSON parsing failed for '{receiver_name}': {json_error}")
            print(f"Raw response (first 500 chars): {response_text[:500]}")
            
            # Try to extract category from natural language response
            response_lower = response_text.lower()
            for category in all_categories:
                if category.lower() in response_lower:
                    print(f"✅ Found category '{category}' in response text")
                    return category, "AI prediction (extracted from text)", 0.6, []
            
            # Check for common category synonyms
            category_synonyms = {
                "food": ["restaurant", "cafe", "dining", "meal", "coffee", "pizza", "burger"],
                "entertainment": ["movie", "streaming", "music", "game", "show", "cinema"],
                "travelling": ["transport", "fuel", "gas", "petrol", "taxi", "flight", "train"],
                "clothes": ["fashion", "apparel", "clothing", "shoe", "footwear"],
                "health": ["medical", "pharmacy", "doctor", "hospital", "medicine"],
                "bills": ["utility", "telecom", "phone", "internet", "electricity"],
                "groceries": ["supermarket", "grocery", "mart", "store"]
            }
            
            for category, synonyms in category_synonyms.items():
                for synonym in synonyms:
                    if synonym in response_lower:
                        mapped_category = category.title()
                        if mapped_category in CATEGORIES:
                            print(f"✅ Mapped '{synonym}' to category '{mapped_category}'")
                            return mapped_category, f"AI prediction (mapped from '{synonym}')", 0.5, []
            
            # If no category found, use intelligent fallback
            print(f"❌ No category found in response, using fallback logic")
            return "Other", f"AI prediction unclear: {response_text[:100]}...", 0.3, []
            
    except Exception as e:
        print(f"Gemini API error: {e}")
        # Enhanced fallback logic based on common Indian merchants
        fallback_mapping = {
            "zomato": "Food",
            "swiggy": "Food", 
            "swiggy instamart": "Groceries",
            "bigbasket": "Groceries",
            "grofers": "Groceries",
            "blinkit": "Groceries",
            "dunzo": "Groceries",
            "h&m": "Clothes",
            "myntra": "Clothes",
            "ajio": "Clothes",
            "flipkart": "Other",
            "amazon": "Other",
            "apollo pharmacy": "Health",
            "netmeds": "Health",
            "pharmeasy": "Health",
            "irctc": "Travelling",
            "uber": "Travelling",
            "ola": "Travelling",
            "rapido": "Travelling",
            "netflix": "Entertainment",
            "amazon prime": "Entertainment",
            "hotstar": "Entertainment",
            "spotify": "Entertainment",
            "jio": "Bills",
            "airtel": "Bills",
            "bescom": "Bills",
            "bsnl": "Bills"
        }
        
        fallback_category = fallback_mapping.get(receiver_name.lower(), "Other")
        return fallback_category, f"AI unavailable, used smart fallback", 0.4, []


# --- 5. API Endpoints ---

@app.get("/", tags=["0. Root"])
def root():
    """Root endpoint to verify API is working."""
    return {
        "message": "WalletWise AI API is running!",
        "status": "healthy",
        "endpoints": [
            "/docs",
            "/get-category/",
            "/api-status/",
            "/parse-text/",
            "/parse-image/"
        ]
    }

@app.post("/parse-image/", tags=["1. Parsing"])
async def parse_from_image(file: UploadFile = File(...), is_payment_app: bool = False):
    """Upload an image of a bill/screenshot to extract transaction details.
    Use is_payment_app=true for payment app transaction history screenshots."""
    image_bytes = await file.read()
    image = Image.open(io.BytesIO(image_bytes))
    
    try:
        extracted_text = pytesseract.image_to_string(image)
        
        if is_payment_app:
            # Process as payment app screenshot (transaction history)
            structured_data = extract_payment_app_transactions(extracted_text, image)
        else:
            # Process as regular bill/receipt
            structured_data = extract_transaction_details(extracted_text)
        
        structured_data["raw_text_from_ocr"] = extracted_text
        return structured_data
    
    except pytesseract.pytesseract.TesseractNotFoundError:
        # Fallback when Tesseract is not available
        print("⚠️ Tesseract OCR not found. Using mock data.")
        if is_payment_app:
            mock_data = {
                "transactions": [
                    {
                        "merchant": "Mock Payment",
                        "amount": 42.99,
                        "date": "September 25",
                        "type": "debit"
                    },
                    {
                        "merchant": "Mock Refund",
                        "amount": 15.00,
                        "date": "September 24",
                        "type": "credit"
                    }
                ],
                "count": 2,
                "app_detected": "Mock App",
                "confidence": 0.99,
                "is_mock": True,
                "raw_text_from_ocr": "MOCK DATA - Tesseract not available"
            }
        else:
            mock_data = {
                "recipientName": "Mock Receipt",
                "amount": 42.99,
                "isDebit": True,
                "timestamp": datetime.now().isoformat(),
                "is_mock": True,
                "raw_text_from_ocr": "MOCK DATA - Tesseract not available"
            }
        return mock_data

@app.post("/parse-payment-app/", tags=["1. Parsing"])
async def parse_payment_app_screenshot(file: UploadFile = File(...)):
    """Upload a screenshot from a payment app to extract multiple transactions.
    Specialized for processing transaction history from apps like PhonePe, PayTM, Google Pay, EatClub, etc."""
    image_bytes = await file.read()
    image = Image.open(io.BytesIO(image_bytes))
    
    try:
        extracted_text = pytesseract.image_to_string(image)
        structured_data = extract_payment_app_transactions(extracted_text, image)
        structured_data["raw_text_from_ocr"] = extracted_text
        return structured_data
    
    except pytesseract.pytesseract.TesseractNotFoundError:
        # Fallback when Tesseract is not available
        print("⚠️ Tesseract OCR not found. Using mock payment app data.")
        mock_data = {
            "transactions": [
                {
                    "merchant": "EatClub",
                    "amount": 220,
                    "date": "September 25",
                    "type": "debit"
                },
                {
                    "merchant": "EatClub",
                    "amount": 220,
                    "date": "September 24",
                    "type": "debit"
                }
            ],
            "count": 2,
            "app_detected": "EatClub",
            "confidence": 0.95,
            "is_mock": True,
            "raw_text_from_ocr": "MOCK DATA - Tesseract not available"
        }
        return mock_data

@app.post("/parse-text/", tags=["1. Parsing"])
def parse_from_text(transaction: TransactionText):
    """Provide raw text (e.g., from an SMS) to extract transaction details."""
    return extract_transaction_details(transaction.text)

@app.post("/get-category/", tags=["2. Categorization"])
def master_categorizer(receiver: Receiver):
    """
    Get an AI-powered category prediction with enhanced accuracy.
    For cached items: return user preference
    For "Other" items: get AI suggestion and allow new category creation
    """
    receiver_name = receiver.name
    
    # Check if we have user preference (from cache)
    if receiver_name in USER_CORRECTIONS_DB:
        user_category = USER_CORRECTIONS_DB[receiver_name]
        print(f"⚡ INSTANT Cache HIT for: {receiver_name} → {user_category}")
        
        # Determine source type based on how the item was cached
        if receiver_name in AI_AUTO_CACHED:
            source_type = "AI Auto-Cache"
            confidence_text = "High Confidence - Auto-cached"
        else:
            source_type = "User History (Cache)"
            confidence_text = "100% - User confirmed"
        
        # Return cached result immediately without AI call (for speed)
        return {
            "receiver_name": receiver_name,
            "category": user_category,
            "source": source_type,
            "confidence": confidence_text,
            "confidence_score": 1.0,
            "is_new_category": False,
            "can_add_category": False,
            "api_status": "Cached"
        }
    
    print(f"Cache MISS for: {receiver_name}. Calling AI for categorization.")
    
    # Get AI prediction for new items
    smart_examples = get_smart_examples(receiver_name, USER_CORRECTIONS_DB)
    ai_predicted_category, ai_confidence_info, ai_confidence_score, alternatives = get_ai_category_prediction(receiver_name, smart_examples)
    
    # Check if AI suggests a new category
    predefined_categories = get_all_categories()
    is_new_category = ai_predicted_category not in predefined_categories and ai_predicted_category.lower() != "other"
    
    # Log this prediction for continuous learning
    prediction_log = {
        "merchant": receiver_name,
        "predicted_category": ai_predicted_category,
        "confidence_score": ai_confidence_score,
        "is_new_category": is_new_category,
        "timestamp": datetime.now().isoformat(),
        "source": "AI Prediction (Enhanced Gemini)" if GOOGLE_AI_API_KEY else "Smart Fallback"
    }
    AI_PREDICTION_LOG.append(prediction_log)
    
    # 🚀 AUTO-CACHE: Add AI prediction to cache for future instant responses
    # Only cache if confidence is reasonable (above 70%) to avoid caching poor predictions
    if ai_confidence_score >= 0.7:
        USER_CORRECTIONS_DB[receiver_name] = ai_predicted_category
        AI_AUTO_CACHED.add(receiver_name)  # Track that this was auto-cached
        print(f"✅ AUTO-CACHED: {receiver_name} → {ai_predicted_category} (confidence: {ai_confidence_score:.2f})")
    else:
        print(f"⚠️  LOW CONFIDENCE: Not caching {receiver_name} → {ai_predicted_category} (confidence: {ai_confidence_score:.2f})")
    
    response = {
        "receiver_name": receiver_name,
        "category": ai_predicted_category,
        "source": "AI Prediction (Enhanced Gemini)" if GOOGLE_AI_API_KEY else "Smart Fallback",
        "confidence": ai_confidence_info,
        "confidence_score": ai_confidence_score,
        "is_new_category": is_new_category,
        "can_add_category": is_new_category and ai_confidence_score > 0.7,
        "api_status": "Connected" if GOOGLE_AI_API_KEY else "API key not configured"
    }
    
    # Add alternatives if available
    if alternatives:
        response["alternatives"] = alternatives
        
    # Add verification flag if confidence is low
    if ai_confidence_score < 0.6:
        response["needs_verification"] = True
        response["verification_message"] = "Low confidence - please verify this categorization"
    
    return response

@app.post("/confirm-category/", tags=["2. Categorization"])
def save_user_correction(transaction: ConfirmedTransaction):
    """
    Endpoint for the app to send user-confirmed categories.
    This is how the system learns and improves.
    """
    USER_CORRECTIONS_DB[transaction.receiver_name] = transaction.confirmed_category
    
    # Remove from auto-cache since this is now user-confirmed
    AI_AUTO_CACHED.discard(transaction.receiver_name)
    
    print(f"Updated DB: {USER_CORRECTIONS_DB}")
    return {"status": "success", "message": f"Saved '{transaction.receiver_name}' as '{transaction.confirmed_category}'."}

@app.post("/feedback/", tags=["2. Categorization"])
def submit_feedback(feedback: FeedbackData):
    """
    Enhanced feedback endpoint for continuous learning.
    Captures when AI predictions are corrected by users.
    """
    # Add timestamp if not provided
    if not feedback.timestamp:
        feedback.timestamp = datetime.now().isoformat()
    
    # Store in feedback training data
    FEEDBACK_TRAINING_DATA.append({
        "merchant": feedback.receiver_name,
        "ai_prediction": feedback.ai_predicted_category,
        "user_correction": feedback.user_corrected_category,
        "confidence": feedback.confidence_score,
        "timestamp": feedback.timestamp,
        "was_correct": feedback.ai_predicted_category == feedback.user_corrected_category
    })
    
    # Also update the user corrections DB for immediate learning
    USER_CORRECTIONS_DB[feedback.receiver_name] = feedback.user_corrected_category
    
    # Remove from auto-cache since this is now user-corrected
    AI_AUTO_CACHED.discard(feedback.receiver_name)
    
    return {
        "status": "success",
        "message": f"Feedback recorded for '{feedback.receiver_name}'",
        "learning_data_count": len(FEEDBACK_TRAINING_DATA)
    }

@app.post("/accept-ai-suggestion/", tags=["2. Categorization"])
def accept_ai_suggestion(suggestion_data: dict):
    """
    Endpoint for accepting AI suggestions with one click.
    Updates user preferences to match AI prediction.
    """
    receiver_name = suggestion_data.get("receiver_name")
    ai_suggested_category = suggestion_data.get("ai_suggested_category")
    
    if not receiver_name or not ai_suggested_category:
        raise HTTPException(status_code=400, detail="Missing receiver_name or ai_suggested_category")
    
    # Update user corrections DB with AI suggestion
    USER_CORRECTIONS_DB[receiver_name] = ai_suggested_category
    
    # Remove from auto-cache since this is now user-confirmed
    AI_AUTO_CACHED.discard(receiver_name)
    
    # Log this acceptance for learning
    acceptance_log = {
        "merchant": receiver_name,
        "accepted_ai_category": ai_suggested_category,
        "timestamp": datetime.now().isoformat(),
        "action": "accepted_ai_suggestion"
    }
    AI_PREDICTION_LOG.append(acceptance_log)
    
    return {
        "status": "success",
        "message": f"Accepted AI suggestion: '{receiver_name}' → '{ai_suggested_category}'",
        "updated_category": ai_suggested_category
    }

@app.post("/add-new-category/", tags=["2. Categorization"])
def add_new_category(category_data: dict):
    """
    Add a new category suggested by AI and assign merchant to it.
    """
    receiver_name = category_data.get("receiver_name")
    new_category = category_data.get("new_category")
    
    if not receiver_name or not new_category:
        raise HTTPException(status_code=400, detail="Missing receiver_name or new_category")
    
    # Add to global categories list if not already present
    global CATEGORIES
    if new_category not in CATEGORIES:
        CATEGORIES.append(new_category)
        print(f"Added new category: {new_category}")
    
    # Assign merchant to new category
    USER_CORRECTIONS_DB[receiver_name] = new_category
    
    # Remove from auto-cache since this is now user-confirmed
    AI_AUTO_CACHED.discard(receiver_name)
    
    # Log this new category creation
    category_log = {
        "merchant": receiver_name,
        "new_category": new_category,
        "timestamp": datetime.now().isoformat(),
        "action": "created_new_category"
    }
    AI_PREDICTION_LOG.append(category_log)
    
    return {
        "status": "success",
        "message": f"Created new category '{new_category}' and assigned '{receiver_name}' to it",
        "new_category": new_category,
        "total_categories": len(CATEGORIES)
    }

@app.get("/learning-stats/", tags=["3. System"])
def get_learning_statistics():
    """Get comprehensive AI learning and performance statistics."""
    if not FEEDBACK_TRAINING_DATA:
        return {
            "total_feedback_entries": 0,
            "accuracy_rate": 0.0,
            "category_performance": {},
            "recent_corrections": [],
            "low_confidence_predictions": 0
        }
    
    total_entries = len(FEEDBACK_TRAINING_DATA)
    correct_predictions = sum(1 for entry in FEEDBACK_TRAINING_DATA if entry["was_correct"])
    accuracy_rate = (correct_predictions / total_entries) * 100 if total_entries > 0 else 0
    
    # Category-wise performance
    category_stats = {}
    for entry in FEEDBACK_TRAINING_DATA:
        cat = entry["ai_prediction"]
        if cat not in category_stats:
            category_stats[cat] = {"total": 0, "correct": 0}
        category_stats[cat]["total"] += 1
        if entry["was_correct"]:
            category_stats[cat]["correct"] += 1
    
    # Calculate accuracy per category
    for cat in category_stats:
        stats = category_stats[cat]
        stats["accuracy"] = (stats["correct"] / stats["total"]) * 100
    
    # Recent corrections (last 10)
    recent_corrections = FEEDBACK_TRAINING_DATA[-10:] if len(FEEDBACK_TRAINING_DATA) > 10 else FEEDBACK_TRAINING_DATA
    
    # Low confidence predictions
    low_confidence = sum(1 for entry in FEEDBACK_TRAINING_DATA if entry["confidence"] < 0.6)
    
    return {
        "total_feedback_entries": total_entries,
        "accuracy_rate": round(accuracy_rate, 2),
        "learned_merchants": len(USER_CORRECTIONS_DB),
        "category_performance": category_stats,
        "recent_corrections": recent_corrections,
        "low_confidence_predictions": low_confidence,
        "ai_prediction_log_count": len(AI_PREDICTION_LOG)
    }

@app.get("/training-data/", tags=["3. System"])
def export_training_data():
    """
    Export training data for model retraining.
    This endpoint provides all the feedback data in a format suitable for model improvement.
    """
    return {
        "feedback_data": FEEDBACK_TRAINING_DATA,
        "user_corrections": USER_CORRECTIONS_DB,
        "prediction_log": AI_PREDICTION_LOG,
        "export_timestamp": datetime.now().isoformat(),
        "total_entries": len(FEEDBACK_TRAINING_DATA),
        "data_quality_score": len([f for f in FEEDBACK_TRAINING_DATA if f["confidence"] > 0.7]) / len(FEEDBACK_TRAINING_DATA) if FEEDBACK_TRAINING_DATA else 0
    }

@app.get("/api-status/", tags=["3. System"])
def get_api_status():
    """Check the status of various AI services and configurations."""
    return {
        "google_ai_status": "Connected" if GOOGLE_AI_API_KEY else "Not configured",
        "google_ai_key_present": bool(GOOGLE_AI_API_KEY),
        "available_categories": CATEGORIES,
        "learned_merchants_count": len(USER_CORRECTIONS_DB),
        "sample_learned_merchants": dict(list(USER_CORRECTIONS_DB.items())[:3]) if USER_CORRECTIONS_DB else {},
        "fallback_mode": not bool(GOOGLE_AI_API_KEY)
    }

@app.get("/categories/", tags=["3. System"])
def get_available_categories():
    """Get all available transaction categories."""
    return {
        "categories": CATEGORIES,
        "total_count": len(CATEGORIES),
        "description": "These are all supported transaction categories for the WalletWise AI system"
    }

@app.get("/learned-merchants/", tags=["3. System"])
def get_learned_merchants():
    """Get all merchants that the system has learned from user feedback."""
    return {
        "learned_merchants": USER_CORRECTIONS_DB,
        "total_count": len(USER_CORRECTIONS_DB),
        "description": "These merchants have been categorized by users and are cached for instant prediction"
    }

if __name__ == "__main__":
    import uvicorn
    print("🚀 Starting WalletWise AI API Server...")
    print("📡 API will be available at: http://localhost:8002")
    print("📋 Documentation: http://localhost:8002/docs")
    uvicorn.run(app, host="0.0.0.0", port=8002, log_level="info")