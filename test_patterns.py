#!/usr/bin/env python3
"""
Direct Test of OCR Improvements 
"""

def test_enhanced_patterns():
    """Test the enhanced OCR patterns without needing the server"""
    
    print("🧪 Testing Enhanced OCR Patterns")
    print("=" * 50)
    
    # Test the post-processing improvements
    from real_ocr_server import post_process_ocr_text
    
    # Test with your image's OCR output
    raw_ocr = "Ape lunks_Crontral Store\ntcc. 1 ee\nbasta 7 bbe Boek Pa\nee _~ gto as\nBeen, O° sf"
    
    print("📄 Original OCR Output:")
    print(f"'{raw_ocr}'")
    
    # Apply post-processing
    processed = post_process_ocr_text(raw_ocr)
    
    print("\n✨ After Post-Processing:")
    print(f"'{processed}'")
    
    # Test specific fixes
    print("\n🔧 Testing Specific Fixes:")
    
    test_cases = [
        "Ape lunks_Crontral Store",
        "CyberPunks General Store", 
        "2500",
        "2350",
        "2100", 
        "2120",
        "230",
        "215"
    ]
    
    for test_case in test_cases:
        fixed = post_process_ocr_text(test_case)
        print(f"   '{test_case}' → '{fixed}'")

if __name__ == "__main__":
    test_enhanced_patterns()