#!/usr/bin/env python3
"""
Enhanced AI Test Script - Test Gemini AI categorization capabilities
This script compares performance with and without Gemini API
"""

import requests
import json
import os
from dotenv import load_dotenv

load_dotenv()

BASE_URL = "http://127.0.0.1:8000"
GOOGLE_AI_API_KEY = os.getenv("GOOGLE_AI_API_KEY")

class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    BOLD = '\033[1m'
    END = '\033[0m'

def print_colored(text: str, color: str = Colors.END):
    print(f"{color}{text}{Colors.END}")

def check_api_status():
    """Check the current API configuration status"""
    try:
        response = requests.get(f"{BASE_URL}/api-status/")
        if response.status_code == 200:
            status = response.json()
            print_colored("🔍 API STATUS CHECK", Colors.BOLD)
            print("="*50)
            print(f"Google AI Status: {status.get('google_ai_status')}")
            print(f"API Key Present: {status.get('google_ai_key_present')}")
            print(f"Learned Merchants: {status.get('learned_merchants_count')}")
            print(f"Fallback Mode: {status.get('fallback_mode')}")
            print()
            return status.get('google_ai_key_present', False)
        else:
            print_colored("❌ Could not check API status", Colors.RED)
            return False
    except Exception as e:
        print_colored(f"❌ Error checking API status: {e}", Colors.RED)
        return False

def test_enhanced_categorization():
    """Test enhanced AI categorization with various Indian merchants"""
    
    print_colored("🤖 ENHANCED AI CATEGORIZATION TEST", Colors.BOLD)
    print("="*60)
    
    # Test cases designed to show AI superiority
    test_merchants = [
        # Food & Dining
        {"name": "Dominos Pizza", "expected": "Food"},
        {"name": "KFC India", "expected": "Food"},
        {"name": "Burger King", "expected": "Food"},
        {"name": "Subway", "expected": "Food"},
        {"name": "Pizza Hut", "expected": "Food"},
        
        # Groceries & Shopping
        {"name": "BigBasket", "expected": "Groceries"},
        {"name": "Grofers", "expected": "Groceries"},
        {"name": "Blinkit", "expected": "Groceries"},
        {"name": "Amazon Fresh", "expected": "Groceries"},
        {"name": "Spencer's Retail", "expected": "Groceries"},
        
        # Fashion & Clothing
        {"name": "Myntra", "expected": "Clothes"},
        {"name": "Ajio", "expected": "Clothes"},
        {"name": "Nykaa Fashion", "expected": "Clothes"},
        {"name": "Lifestyle Stores", "expected": "Clothes"},
        {"name": "Westside", "expected": "Clothes"},
        
        # Entertainment
        {"name": "BookMyShow", "expected": "Entertainment"},
        {"name": "Amazon Prime Video", "expected": "Entertainment"},
        {"name": "Disney+ Hotstar", "expected": "Entertainment"},
        {"name": "Spotify India", "expected": "Entertainment"},
        {"name": "YouTube Premium", "expected": "Entertainment"},
        
        # Travel & Transport
        {"name": "Ola Cabs", "expected": "Travelling"},
        {"name": "Rapido", "expected": "Travelling"},
        {"name": "IndiGo Airlines", "expected": "Travelling"},
        {"name": "MakeMyTrip", "expected": "Travelling"},
        {"name": "Yatra.com", "expected": "Travelling"},
        
        # Health & Pharmacy
        {"name": "Netmeds", "expected": "Health"},
        {"name": "PharmEasy", "expected": "Health"},
        {"name": "1mg", "expected": "Health"},
        {"name": "Apollo 24|7", "expected": "Health"},
        
        # Bills & Utilities
        {"name": "Jio Fiber", "expected": "Bills"},
        {"name": "Airtel Broadband", "expected": "Bills"},
        {"name": "BSES Delhi", "expected": "Bills"},
        {"name": "Paytm Gas Bill", "expected": "Bills"},
        
        # Personal Services
        {"name": "Urban Company", "expected": "Personal"},
        {"name": "Housejoy", "expected": "Personal"},
        
        # Complex/Ambiguous Cases
        {"name": "Rebel Foods", "expected": "Food"},  # Cloud kitchen company
        {"name": "Dunzo", "expected": "Personal"},     # Delivery service
        {"name": "Zepto", "expected": "Groceries"},    # Quick commerce
    ]
    
    correct_predictions = 0
    total_tests = len(test_merchants)
    
    for i, merchant in enumerate(test_merchants, 1):
        print(f"\n--- Test {i}/{total_tests}: {merchant['name']} ---")
        
        try:
            response = requests.post(f"{BASE_URL}/get-category/", 
                                   json={"name": merchant['name']})
            
            if response.status_code == 200:
                result = response.json()
                predicted = result.get('category')
                source = result.get('source')
                confidence = result.get('confidence', '')
                
                print(f"🏪 Merchant: {merchant['name']}")
                print(f"🤖 Predicted: {predicted}")
                print(f"🎯 Expected: {merchant['expected']}")
                print(f"📊 Source: {source}")
                print(f"🔍 Confidence: {confidence}")
                
                if predicted == merchant['expected']:
                    print_colored("✅ CORRECT", Colors.GREEN)
                    correct_predictions += 1
                else:
                    print_colored("❌ INCORRECT", Colors.RED)
                    
            else:
                print_colored(f"❌ API Error: {response.text}", Colors.RED)
                
        except Exception as e:
            print_colored(f"❌ Request Error: {e}", Colors.RED)
    
    # Summary
    accuracy = (correct_predictions / total_tests) * 100
    print("\n" + "="*60)
    print_colored("📊 TEST SUMMARY", Colors.BOLD)
    print("="*60)
    print(f"Total Tests: {total_tests}")
    print(f"Correct Predictions: {correct_predictions}")
    print(f"Accuracy: {accuracy:.1f}%")
    
    if accuracy >= 80:
        print_colored("🎉 EXCELLENT PERFORMANCE!", Colors.GREEN)
    elif accuracy >= 60:
        print_colored("👍 GOOD PERFORMANCE", Colors.YELLOW)
    else:
        print_colored("⚠️  NEEDS IMPROVEMENT", Colors.RED)
    
    return accuracy

def test_learning_with_complex_merchants():
    """Test the learning system with complex merchant names"""
    
    print_colored("\n🎓 LEARNING SYSTEM TEST - Complex Merchants", Colors.BOLD)
    print("="*60)
    
    complex_merchants = [
        {"name": "Swiggy Genie", "category": "Personal"},
        {"name": "Flipkart Grocery", "category": "Groceries"},
        {"name": "Paytm Movie Tickets", "category": "Entertainment"},
        {"name": "Google Pay Business", "category": "Bills"}
    ]
    
    for merchant in complex_merchants:
        print(f"\n--- Teaching: {merchant['name']} → {merchant['category']} ---")
        
        # Step 1: Get initial prediction
        try:
            response = requests.post(f"{BASE_URL}/get-category/", 
                                   json={"name": merchant['name']})
            if response.status_code == 200:
                initial = response.json()
                print(f"Initial: {initial.get('category')} ({initial.get('source')})")
        except:
            pass
        
        # Step 2: Teach the system
        try:
            teach_data = {
                "receiver_name": merchant['name'],
                "confirmed_category": merchant['category']
            }
            response = requests.post(f"{BASE_URL}/confirm-category/", json=teach_data)
            if response.status_code == 200:
                print_colored("✅ Teaching successful", Colors.GREEN)
            else:
                print_colored("❌ Teaching failed", Colors.RED)
                continue
        except Exception as e:
            print_colored(f"❌ Teaching error: {e}", Colors.RED)
            continue
        
        # Step 3: Verify learning
        try:
            response = requests.post(f"{BASE_URL}/get-category/", 
                                   json={"name": merchant['name']})
            if response.status_code == 200:
                learned = response.json()
                if (learned.get('source') == 'User History (Cache)' and 
                    learned.get('category') == merchant['category']):
                    print_colored("✅ Learning verified!", Colors.GREEN)
                else:
                    print_colored("❌ Learning verification failed", Colors.RED)
        except:
            print_colored("❌ Verification error", Colors.RED)

def main():
    """Run enhanced AI testing"""
    print_colored("🚀 WalletWise AI - Enhanced Gemini Testing", Colors.BOLD)
    print("="*70)
    
    # Check if server is running
    try:
        requests.get(f"{BASE_URL}/docs", timeout=5)
    except:
        print_colored("❌ Server not running. Start with: python start_server.py", Colors.RED)
        return
    
    # Check API configuration
    has_gemini = check_api_status()
    
    if not has_gemini:
        print_colored("⚠️  Gemini API not configured. Results will show fallback performance.", Colors.YELLOW)
        print_colored("📖 See GEMINI_SETUP_GUIDE.md for setup instructions.", Colors.BLUE)
        print()
    else:
        print_colored("✅ Gemini AI is configured! Testing enhanced capabilities...", Colors.GREEN)
        print()
    
    # Run tests
    accuracy = test_enhanced_categorization()
    test_learning_with_complex_merchants()
    
    # Final recommendations
    print("\n" + "="*70)
    print_colored("🎯 RECOMMENDATIONS", Colors.BOLD)
    print("="*70)
    
    if has_gemini:
        if accuracy >= 80:
            print("✅ Your AI setup is working excellently!")
            print("✅ Gemini is providing high-accuracy categorizations")
            print("✅ Ready for production use")
        else:
            print("⚠️  Consider fine-tuning prompts for better accuracy")
            print("⚠️  Check if API usage limits are being hit")
    else:
        print("📖 Get Gemini API key for much better accuracy:")
        print("   1. Visit: https://makersuite.google.com/app/apikey")
        print("   2. Create API key")
        print("   3. Add to .env file: GOOGLE_AI_API_KEY=your_key")
        print("   4. Restart server")
        print(f"   5. Expected accuracy improvement: {max(0, 85 - accuracy):.0f}%+ boost")

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print_colored("\n👋 Testing interrupted. Goodbye!", Colors.YELLOW)