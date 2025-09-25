#!/usr/bin/env python3
"""
Bare Bones HTTP Server for Category API

Uses only the standard library for maximum compatibility.
"""

import http.server
import socketserver
import json
import urllib.parse

# Define port
PORT = 8002

# Standard Categories
CATEGORIES = [
    "Food", "Entertainment", "Travelling", "Clothes", 
    "Health", "Bills", "Groceries", "Other", "Personal"
]

class CategoryHandler(http.server.BaseHTTPRequestHandler):
    def _set_headers(self):
        self.send_response(200)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')  # CORS
        self.send_header('Access-Control-Allow-Methods', 'GET')
        self.end_headers()
    
    def do_GET(self):
        parsed_path = urllib.parse.urlparse(self.path)
        path = parsed_path.path
        
        # Root endpoint
        if path == "/":
            self._set_headers()
            response = {
                "name": "Bare Bones Category API",
                "status": "running",
                "endpoints": ["/get-category/<merchant>", "/api-status"]
            }
            self.wfile.write(json.dumps(response).encode())
        
        # API status endpoint
        elif path == "/api-status":
            self._set_headers()
            response = {
                "status": "operational",
                "categories": CATEGORIES
            }
            self.wfile.write(json.dumps(response).encode())
        
        # Get category endpoint
        elif path.startswith("/get-category/"):
            merchant_name = path.replace("/get-category/", "")
            merchant_name = urllib.parse.unquote(merchant_name)
            
            self._set_headers()
            response = categorize_merchant(merchant_name)
            self.wfile.write(json.dumps(response).encode())
        
        # 404 for unknown endpoints
        else:
            self.send_response(404)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            response = {"error": "Not found"}
            self.wfile.write(json.dumps(response).encode())
    
    def do_OPTIONS(self):
        # Handle preflight requests for CORS
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

def categorize_merchant(merchant_name):
    """Categorize a merchant name using simple keyword matching"""
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
    
    return {
        "merchant": merchant_name,
        "category": category,
        "confidence": 0.7,
        "reasoning": "Keyword-based categorization",
        "source": "Smart Fallback"
    }

def run_server():
    """Run the HTTP server"""
    handler = CategoryHandler
    
    # Make sure we can reuse the address immediately after the server stops
    socketserver.TCPServer.allow_reuse_address = True
    
    with socketserver.TCPServer(("", PORT), handler) as httpd:
        print(f"Starting Bare Bones Category API on port {PORT}...")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nShutting down server...")
            httpd.shutdown()

if __name__ == "__main__":
    run_server()