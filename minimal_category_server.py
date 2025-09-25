#!/usr/bin/env python3
"""
Minimal Category Server using Flask

This script creates a minimal Flask server for categorization 
that should be more stable than FastAPI.
"""

import os
import json
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Standard Categories
CATEGORIES = [
    "Food", "Entertainment", "Travelling", "Clothes", 
    "Health", "Bills", "Groceries", "Other", "Personal"
]

# --- Simple categorization function ---
def get_mock_category(merchant_name):
    """Provide a mock categorization"""
    merchant_lower = merchant_name.lower()
    
    # Simple keyword-based categorization
    category_keywords = {
        "food": ["restaurant", "cafe", "coffee", "pizza", "burger", "food", "eat", "dining", "takeaway", "mcdonald", "kfc", "starbucks", "subway"],
        "entertainment": ["movie", "cinema", "theater", "netflix", "spotify", "prime", "disney", "hbo", "show", "concert", "game"],
        "travelling": ["air", "flight", "hotel", "train", "bus", "taxi", "uber", "ola", "travel", "booking", "ticket", "fuel", "petrol"],
        "clothes": ["fashion", "cloth", "wear", "apparel", "shoe", "nike", "adidas", "zara", "h&m", "levi"],
        "health": ["pharmacy", "hospital", "clinic", "doctor", "medicine", "medical", "health", "apollo", "wellness"],
        "bills": ["bill", "utility", "electric", "water", "gas", "internet", "phone", "mobile", "recharge", "airtel", "jio", "vodafone"],
        "groceries": ["grocery", "market", "supermarket", "store", "mart", "shop", "bigbasket", "grofer", "fresh"]
    }
    
    # Check for keyword matches
    for category, keywords in category_keywords.items():
        for keyword in keywords:
            if keyword in merchant_lower:
                return {
                    "merchant": merchant_name,
                    "category": category.title(),
                    "confidence": 0.7,
                    "reasoning": f"Contains keyword '{keyword}' associated with {category}",
                    "alternatives": [],
                    "source": "Smart Fallback"
                }
    
    # Default to Other
    return {
        "merchant": merchant_name,
        "category": "Other",
        "confidence": 0.5,
        "reasoning": "No matching keywords found",
        "alternatives": [],
        "source": "Smart Fallback"
    }

# --- Flask application ---
try:
    from flask import Flask, jsonify
    from flask_cors import CORS
    
    app = Flask(__name__)
    CORS(app)
    
    @app.route('/')
    def root():
        """API Root - show basic info"""
        return jsonify({
            "name": "WalletWise Minimal Category API",
            "version": "1.0.0",
            "status": "running",
            "endpoints": [
                "/get-category/<merchant_name>",
                "/api-status"
            ]
        })
    
    @app.route('/get-category/<merchant_name>')
    def get_category(merchant_name):
        """Get category prediction for a merchant name"""
        print(f"Processing request for merchant: {merchant_name}")
        result = get_mock_category(merchant_name)
        return jsonify(result)
    
    @app.route('/api-status')
    def api_status():
        """Get API status information"""
        return jsonify({
            "status": "operational",
            "categories": CATEGORIES,
            "fallback_mode": True
        })
    
    if __name__ == "__main__":
        print("🚀 Starting WalletWise Minimal Category API...")
        app.run(host='0.0.0.0', port=8002, debug=True)
    
except ImportError:
    print("❌ Flask not installed. Please install with: pip install flask flask-cors")
    print("Alternative: pip install -U Flask==2.0.1 flask-cors==3.0.10")
except Exception as e:
    print(f"❌ Error: {str(e)}")
    import traceback
    traceback.print_exc()