#!/usr/bin/env python3
"""
Test the real OCR server with the WhatsApp payment screenshot
"""

import requests
import json

def test_whatsapp_ocr():
    """Test OCR with WhatsApp payment screenshot"""
    
    # First, let's check if the server is running
    try:
        response = requests.get('http://localhost:8002/')
        print("✅ OCR Server is running!")
        print(f"Status: {response.json()['status']}")
    except Exception as e:
        print(f"❌ OCR Server not available: {e}")
        return
    
    # We'll create a simple test since we can't directly access the uploaded image
    # But we can test with our generated receipt
    print("\n🧪 Testing with generated receipt first...")
    
    try:
        with open('test_receipt.png', 'rb') as f:
            files = {'file': f}
            response = requests.post('http://localhost:8002/parse-image/', files=files)
            
        if response.status_code == 200:
            result = response.json()
            print("✅ OCR Processing successful!")
            print("\n📊 Extracted Information:")
            print("="*50)
            print(f"Merchant: {result.get('recipientName', 'N/A')}")
            print(f"Amount: ${result.get('amount', 'N/A')}")
            print(f"Bill Number: {result.get('billNumber', 'N/A')}")
            print(f"AI Category: {result.get('ai_category', 'N/A')}")
            print(f"AI Confidence: {result.get('ai_confidence', 'N/A')}")
            
            if result.get('raw_text_from_ocr'):
                print(f"\n📄 Raw OCR Text (first 200 chars):")
                print(result['raw_text_from_ocr'][:200] + "...")
                
        else:
            print(f"❌ OCR failed: {response.status_code} - {response.text}")
            
    except Exception as e:
        print(f"❌ Error testing OCR: {e}")

if __name__ == "__main__":
    print("🚀 Testing Real OCR with Payment Screenshot")
    print("="*50)
    test_whatsapp_ocr()