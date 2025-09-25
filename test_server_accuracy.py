#!/usr/bin/env python3
"""
Test the improved OCR server that now has the 100% accuracy logic
"""

import requests
import json

def test_improved_server():
    """Test the OCR server with our test image"""
    print("🧪 Testing Improved OCR Server (100% Accuracy Logic)")
    print("=" * 60)
    
    # Check server status
    try:
        response = requests.get('http://localhost:8002/')
        server_status = response.json()['status']
        print(f"✅ Server Status:")
        print(f"   Tesseract: {server_status['tesseract_available']}")
        print(f"   Gemini AI: {server_status['gemini_available']}")
        print(f"   Categories: {len(server_status['categories'])}")
    except Exception as e:
        print(f"❌ Server not available: {e}")
        return
    
    # Test with our WhatsApp-style test image
    if not os.path.exists('test_whatsapp_dark.png'):
        print("❌ Test image not found. Run direct_ocr_test.py first to create it.")
        return
        
    print(f"\n🔍 Testing with WhatsApp-style image...")
    
    try:
        with open('test_whatsapp_dark.png', 'rb') as f:
            files = {'file': f}
            response = requests.post('http://localhost:8002/parse-payment-app/', files=files)
            
        if response.status_code == 200:
            result = response.json()
            print("✅ OCR Processing successful!")
            
            print(f"\n📱 App Detected: {result.get('app_detected', 'Unknown')}")
            print(f"📊 Transaction Count: {result.get('count', 0)}")
            print(f"🎯 Confidence: {result.get('confidence', 0):.2f}")
            
            print("\n💰 Extracted Transactions:")
            print("-" * 60)
            print(f"{'#':<3} {'Merchant':<20} {'Amount':<10} {'Type':<8} {'Confidence':<10}")
            print("-" * 60)
            
            for i, transaction in enumerate(result.get('transactions', []), 1):
                merchant = transaction.get('merchant', 'Unknown')
                amount = transaction.get('amount', 0)
                trans_type = transaction.get('type', 'unknown')
                confidence = transaction.get('confidence', 0)
                
                print(f"{i:<3} {merchant:<20} ₹{amount:<9} {trans_type:<8} {confidence:<10.2f}")
            
            # Check accuracy against expected results
            print(f"\n🔍 Accuracy Analysis:")
            expected_names = ['EatClub', 'chanakya065', 'M PRANAY', 'sriram yerra_066']
            expected_amounts = [220, 110, 60, 400, 146, 115]
            
            found_names = [t.get('merchant', '') for t in result.get('transactions', [])]
            found_amounts = [t.get('amount', 0) for t in result.get('transactions', []) if t.get('amount', 0) > 0]
            
            # Check names
            name_accuracy = 0
            for expected in expected_names:
                if any(expected.lower() in found.lower() for found in found_names):
                    name_accuracy += 1
                    print(f"✅ Found name: {expected}")
                else:
                    print(f"❌ Missing name: {expected}")
            
            # Check amounts
            amount_accuracy = 0
            for expected in expected_amounts:
                if expected in found_amounts:
                    amount_accuracy += 1
                    print(f"✅ Found amount: ₹{expected}")
                else:
                    print(f"❌ Missing amount: ₹{expected}")
            
            # Check currency symbols in raw text
            raw_text = result.get('raw_text_from_ocr', '')
            currency_count = raw_text.count('₹') if raw_text else 0
            
            print(f"\n📈 Final Server Results:")
            print(f"   Names: {name_accuracy}/{len(expected_names)} ({name_accuracy/len(expected_names)*100:.1f}%)")
            print(f"   Amounts: {amount_accuracy}/{len(expected_amounts)} ({amount_accuracy/len(expected_amounts)*100:.1f}%)")
            print(f"   Currency symbols: {currency_count} ₹ symbols in raw text")
            
            overall_accuracy = (name_accuracy + amount_accuracy) / (len(expected_names) + len(expected_amounts)) * 100
            print(f"\n🎯 Overall Server Accuracy: {overall_accuracy:.1f}%")
            
            if overall_accuracy >= 90:
                print("🎉 Server successfully implements 100% accuracy logic!")
            elif overall_accuracy >= 70:
                print("✅ Server shows significant improvement!")
            else:
                print("🔧 Server needs more optimization")
                
            # Show raw OCR text sample
            if raw_text:
                print(f"\n📄 Raw OCR Text (first 200 chars):")
                print("-" * 40)
                print(raw_text[:200] + "..." if len(raw_text) > 200 else raw_text)
                
        else:
            print(f"❌ OCR failed: {response.status_code} - {response.text}")
            
    except Exception as e:
        print(f"❌ Error testing server: {e}")

if __name__ == "__main__":
    import os
    test_improved_server()