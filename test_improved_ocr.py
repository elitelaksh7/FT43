#!/usr/bin/env python3
"""
Test improved OCR accuracy for receiver names and currency symbols
"""

import requests
import json
from PIL import Image, ImageDraw, ImageFont
import os

def create_whatsapp_style_image():
    """Create a WhatsApp-style transaction image to test OCR improvements"""
    # Create a dark background image (like WhatsApp dark mode)
    width, height = 400, 600
    image = Image.new('RGB', (width, height), '#0b141a')  # WhatsApp dark background
    draw = ImageDraw.Draw(image)
    
    # Try to use a font
    try:
        font = ImageFont.truetype("arial.ttf", 16)
        small_font = ImageFont.truetype("arial.ttf", 14)
    except:
        font = ImageFont.load_default()
        small_font = ImageFont.load_default()
    
    # Draw transaction entries with white text (like WhatsApp)
    y_pos = 50
    text_color = '#ffffff'  # White text
    
    # Transaction entries that test common OCR issues
    transactions = [
        ("EatClub", "₹220", "10 August"),
        ("chanakya065", "+₹110", "8 August"),  
        ("M PRANAY", "+₹60", "6 August"),
        ("sriram yerra_066", "+₹400", "3 August"),
        ("EatClub", "₹146", "7 August"),
        ("EatClub", "₹115", "6 August"),
    ]
    
    for name, amount, date in transactions:
        # Draw merchant name
        draw.text((20, y_pos), name, fill=text_color, font=font)
        
        # Draw amount on the right
        amount_color = '#25d366' if '+' in amount else '#ffffff'  # Green for received
        draw.text((300, y_pos), amount, fill=amount_color, font=font)
        
        # Draw date below
        draw.text((20, y_pos + 20), date, fill='#8696a0', font=small_font)
        
        y_pos += 60
    
    return image

def test_improved_ocr():
    """Test the improved OCR with problematic names and currency symbols"""
    print("🧪 Testing Improved OCR Accuracy")
    print("="*50)
    
    # Check server status
    try:
        response = requests.get('http://localhost:8002/')
        server_status = response.json()['status']
        print(f"✅ Server Status: Tesseract={server_status['tesseract_available']}, Gemini={server_status['gemini_available']}")
    except Exception as e:
        print(f"❌ Server not available: {e}")
        return
    
    # Create test image
    print("\n📱 Creating WhatsApp-style test image...")
    test_image = create_whatsapp_style_image()
    test_image.save("whatsapp_test.png")
    print("✅ Test image saved as 'whatsapp_test.png'")
    
    # Test payment app parsing
    print("\n🔍 Testing payment app OCR...")
    try:
        with open('whatsapp_test.png', 'rb') as f:
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
            
            for i, transaction in enumerate(result.get('transactions', []), 1):
                merchant = transaction.get('merchant', 'Unknown')
                amount = transaction.get('amount', 0)
                trans_type = transaction.get('type', 'unknown')
                confidence = transaction.get('confidence', 0)
                
                print(f"{i:2d}. {merchant:<20} {amount:>8.2f} ({trans_type}) [{confidence:.2f}]")
            
            # Test specific improvements
            print(f"\n🔍 Accuracy Analysis:")
            expected_names = ['EatClub', 'chanakya065', 'M PRANAY', 'sriram yerra_066']
            found_names = [t.get('merchant', '') for t in result.get('transactions', [])]
            
            name_accuracy = 0
            for expected in expected_names:
                if any(expected.lower() in found.lower() for found in found_names):
                    name_accuracy += 1
                    print(f"✅ Found: {expected}")
                else:
                    print(f"❌ Missing: {expected}")
            
            print(f"\n📈 Name Recognition Accuracy: {name_accuracy}/{len(expected_names)} ({name_accuracy/len(expected_names)*100:.1f}%)")
            
            # Check currency symbol detection
            amounts_found = [t.get('amount', 0) for t in result.get('transactions', []) if t.get('amount', 0) > 0]
            print(f"💹 Currency Amounts Detected: {len(amounts_found)} amounts")
            
            if len(amounts_found) >= 4:
                print("🎉 Improved OCR is working well!")
            else:
                print("🔧 OCR still needs more tuning")
                
            # Show raw OCR text
            if result.get('raw_text_from_ocr'):
                print(f"\n📄 Raw OCR Text (first 300 chars):")
                print("-" * 40)
                print(result['raw_text_from_ocr'][:300] + "...")
                
        else:
            print(f"❌ OCR failed: {response.status_code} - {response.text}")
            
    except Exception as e:
        print(f"❌ Error testing OCR: {e}")

if __name__ == "__main__":
    test_improved_ocr()