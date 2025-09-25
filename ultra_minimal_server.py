#!/usr/bin/env python3
"""
Ultra-Minimal Category Server using Flask
"""

from flask import Flask, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

# Standard Categories
CATEGORIES = [
    "Food", "Entertainment", "Travelling", "Clothes", 
    "Health", "Bills", "Groceries", "Other", "Personal"
]

@app.route('/')
def root():
    return jsonify({
        "name": "WalletWise Ultra-Minimal Category API",
        "status": "running"
    })

@app.route('/get-category/<merchant_name>')
def get_category(merchant_name):
    merchant_lower = merchant_name.lower()
    
    # Simple keyword mapping
    if any(food_kw in merchant_lower for food_kw in ["restaurant", "cafe", "food", "eat", "starbucks"]):
        category = "Food"
    elif any(ent_kw in merchant_lower for ent_kw in ["movie", "netflix", "spotify", "game"]):
        category = "Entertainment"
    elif any(travel_kw in merchant_lower for travel_kw in ["uber", "flight", "hotel", "travel"]):
        category = "Travelling"
    elif any(clothes_kw in merchant_lower for clothes_kw in ["fashion", "cloth", "nike", "adidas"]):
        category = "Clothes"
    elif any(health_kw in merchant_lower for health_kw in ["pharmacy", "doctor", "health"]):
        category = "Health"
    elif any(bill_kw in merchant_lower for bill_kw in ["bill", "utility", "electric", "airtel"]):
        category = "Bills"
    elif any(grocery_kw in merchant_lower for grocery_kw in ["grocery", "market", "supermarket"]):
        category = "Groceries"
    else:
        category = "Other"
    
    return jsonify({
        "merchant": merchant_name,
        "category": category,
        "confidence": 0.7,
        "reasoning": "Keyword-based categorization",
        "source": "Smart Fallback"
    })

@app.route('/api-status')
def api_status():
    return jsonify({
        "status": "operational",
        "categories": CATEGORIES
    })

if __name__ == "__main__":
    print("Starting Ultra-Minimal Category API on port 8002...")
    # Use threaded=False for simplicity
    app.run(host='0.0.0.0', port=8002, debug=False, threaded=False)