"""
Simple Flask-based SMS Parser Server
"""
from flask import Flask, request, jsonify
import re
import uuid
from datetime import datetime
import logging
import sys

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout)
    ]
)

app = Flask(__name__)

# Common bank patterns in Indian SMS notifications
BANK_PATTERNS = {
    "HDFC": r"(?:HDFC|HDFC Bank)",
    "SBI": r"(?:SBI|State Bank|State Bank of India)",
    "ICICI": r"(?:ICICI|ICICI Bank)",
    "Axis": r"(?:Axis Bank|AxisBk)",
    "Kotak": r"(?:Kotak|Kotak Bank|Kotak Mahindra)",
    "PNB": r"(?:PNB|Punjab National Bank)",
    "BOB": r"(?:BOB|Bank of Baroda)",
    "Yes Bank": r"(?:Yes Bank|YesBank)",
    "IDFC": r"(?:IDFC|IDFC First|IDFC Bank)",
    "IndusInd": r"(?:IndusInd|IndusInd Bank)",
    "Canara": r"(?:Canara Bank)",
    "Union Bank": r"(?:Union Bank)",
    "Bank of India": r"(?:Bank of India|BOI)"
}

def extract_bank_name(text: str) -> str:
    """Extract bank name from SMS text"""
    text = text.upper()  # Ensure consistent case for matching
    
    for bank_name, pattern in BANK_PATTERNS.items():
        if re.search(pattern, text, re.IGNORECASE):
            return bank_name
    
    # Additional patterns to try if the direct bank name isn't found
    account_match = re.search(r'(?:AC|a/c|account).*?(\w+)', text, re.IGNORECASE)
    if account_match:
        account = account_match.group(1)
        if any(bank in account for bank in ["HDFC", "SBI", "ICICI", "AXIS"]):
            return next(bank for bank in ["HDFC", "SBI", "ICICI", "AXIS"] if bank in account)
    
    # Default if no bank is recognized
    return "Unknown Bank"

def extract_transaction_details(text: str) -> dict:
    """
    Extract transaction details from SMS text
    Returns a structured dictionary with transaction information
    """
    # Normalize text for better pattern matching
    text = text.replace('\n', ' ').replace('\r', ' ')
    
    # Extract amount
    amount_match = re.search(r'(?:INR|Rs\.?|₹)\s*([\d,.]+)', text, re.IGNORECASE)
    amount = 0.0
    if amount_match:
        amount_str = amount_match.group(1).replace(',', '')
        try:
            amount = float(amount_str)
        except ValueError:
            amount = 0.0
    
    # Determine transaction type (debit or credit)
    is_debit = any(keyword in text.lower() for keyword in ['debited', 'spent', 'paid', 'payment', 'purchase', 'withdrawn'])
    is_credit = any(keyword in text.lower() for keyword in ['credited', 'received', 'refund', 'cashback', 'deposited'])
    
    # Default to debit if cannot determine (most common)
    transaction_type = 'debit' if is_debit or not is_credit else 'credit'
    
    # Extract merchant/recipient
    merchant_patterns = [
        r'(?:at|to|in)\s+([A-Za-z0-9\s&\'-]+?)(?:\s+on|\.|\son|,|\svide)',
        r'(?:purchase at|paid to|payment to)\s+([A-Za-z0-9\s&\'-]+)',
        r'(?<=to\s)([A-Za-z0-9\s&\'-]+)(?=\s*[\.,])'
    ]
    
    merchant = "Unknown Merchant"
    for pattern in merchant_patterns:
        merchant_match = re.search(pattern, text, re.IGNORECASE)
        if merchant_match:
            merchant = merchant_match.group(1).strip()
            break
    
    # Extract date (if available)
    date_match = re.search(r'(?:on|dated|date)\s+([0-9]{1,2}[\/-][0-9]{1,2}[\/-][0-9]{2,4})', text, re.IGNORECASE)
    timestamp = datetime.now().isoformat()
    if date_match:
        date_str = date_match.group(1)
        # Here you could parse this date_str into a proper timestamp
        # For simplicity, we're using current timestamp
    
    # Get bank name
    bank_name = extract_bank_name(text)
    
    # Create transaction object
    transaction = {
        "id": str(uuid.uuid4()),
        "amount": amount,
        "type": transaction_type,
        "merchant": merchant,
        "timestamp": timestamp,
        "bankName": bank_name,
        "category": determine_category(merchant),
        "confidence": 0.95
    }
    
    return transaction

def determine_category(merchant: str) -> str:
    """
    Determine a category based on merchant name
    This is a simplified version - in production, you would use AI or more sophisticated rules
    """
    merchant_lower = merchant.lower()
    
    # Simple keyword-based categorization
    categories = {
        "food": ["restaurant", "cafe", "food", "swiggy", "zomato", "pizza", "burger", "kitchen", "bakery", "hotel"],
        "shopping": ["mart", "shop", "store", "market", "retail", "mall"],
        "travel": ["travel", "hotel", "flight", "train", "bus", "cab", "uber", "ola", "ticket"],
        "entertainment": ["movie", "cinema", "theater", "entertainment", "game", "netflix", "amazon prime"],
        "utilities": ["bill", "electric", "water", "gas", "internet", "broadband", "mobile", "telephone"],
        "healthcare": ["hospital", "clinic", "pharmacy", "medical", "doctor", "health"]
    }
    
    for category, keywords in categories.items():
        if any(keyword in merchant_lower for keyword in keywords):
            return category.capitalize()
    
    return "Other"

@app.route('/', methods=['GET'])
def home():
    """Root endpoint for health check"""
    return jsonify({
        "status": "ok", 
        "service": "SMS Transaction Parser API", 
        "version": "1.0.0",
        "endpoints": ["/parse-sms"]
    })

@app.route('/parse-sms', methods=['POST'])
def parse_sms_transaction():
    """Parse SMS text to extract transaction details"""
    try:
        data = request.get_json()
        if not data or 'text' not in data or not data['text'].strip():
            return jsonify({"error": "SMS text is required"}), 400
        
        transaction_details = extract_transaction_details(data['text'])
        logging.info(f"Successfully parsed SMS: {transaction_details['merchant']}")
        return jsonify(transaction_details)
    except Exception as e:
        logging.error(f"Error parsing SMS: {str(e)}")
        return jsonify({"error": f"Error parsing SMS: {str(e)}"}), 500

@app.route('/examples', methods=['GET'])
def get_examples():
    """Return example SMS formats that can be parsed"""
    examples = [
        "INR 1,234.56 has been debited from your A/c XXXX1234 on 15-May-2024 to Amazon India. Avl Bal: INR 5,432.10.",
        "Dear Customer, payment of Rs. 890 to Swiggy is debited from your account XX1234. Avl Bal is Rs 4,542.10.",
        "Rs. 500.00 is credited to your account XXXX5678 from JOHN DOE on 16-05-2024. Available balance Rs. 6,432.10.",
        "Your HDFC Bank Credit Card XX1234 has been used for Rs.2,345.50 at Flipkart on 15-May-2024.",
        "You've spent Rs.750 at Croma Retail using your ICICI Bank Card XX5678 on 16/05/24. Available Credit: Rs.45,000."
    ]
    return jsonify({"examples": examples})

if __name__ == '__main__':
    logging.info("Starting SMS Transaction Parser API Server on port 8002...")
    # Enable CORS
    from flask_cors import CORS
    CORS(app)
    app.run(host='0.0.0.0', port=8002, debug=False)