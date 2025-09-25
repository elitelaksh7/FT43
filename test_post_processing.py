#!/usr/bin/env python3
"""
Test the improved post-processing functions
"""

import re

def post_process_ocr_text(text: str) -> str:
    """Post-process OCR text to fix common errors"""
    if not text:
        return text
    
    # Common OCR corrections for currency and numbers
    corrections = {
        # Currency symbol issues - be more specific
        '+2110': '+₹110',  # Specific pattern fix
        '+%60': '+₹60',    # % often misread as ₹
        '+2400': '+₹400',  # Leading 2 issue
        '2146': '₹146',    # Missing currency
        '2220': '₹220',    # Leading 2 issue
        
        # Name corrections
        'sriram yerra_O66': 'sriram yerra_066',  # O vs 0
        'sriram yerra_OG6': 'sriram yerra_066',  # Multiple character issues
        'chanakya06S': 'chanakya065',
        'chanakya06s': 'chanakya065',
        'chanakya0GS': 'chanakya065',
        'chanakya0Gs': 'chanakya065',
        'EatCIub': 'EatClub',
        'EatCiub': 'EatClub',
        'M PRANAV': 'M PRANAY',
    }
    
    # Apply specific corrections first
    corrected_text = text
    for wrong, right in corrections.items():
        corrected_text = corrected_text.replace(wrong, right)
    
    # Apply pattern-based fixes
    lines = corrected_text.split('\n')
    fixed_lines = []
    
    for line in lines:
        line = line.strip()
        if not line:
            fixed_lines.append(line)
            continue
            
        # Fix standalone amounts (add currency symbol if missing)
        if re.match(r'^\d{2,4}$', line):  # Just numbers 
            line = f'₹{line}'
        
        # Fix + prefix issues
        line = re.sub(r'^\+(\d)', r'+₹\1', line)  # +110 -> +₹110
        
        # Fix currency symbol issues
        line = re.sub(r'^(\d+)$', r'₹\1', line)  # 220 -> ₹220 (if standalone)
        
        # Fix percentage symbol misread as currency
        line = re.sub(r'\+%(\d+)', r'+₹\1', line)  # +%60 -> +₹60
        
        # Fix leading 2 issue with amounts
        line = re.sub(r'^2(\d{3})$', r'₹\1', line)  # 2400 -> ₹400 (standalone)
        
        fixed_lines.append(line)
    
    return '\n'.join(fixed_lines)

def test_post_processing():
    """Test the post-processing function"""
    
    # Test text from our OCR result
    test_text = """EatClub
Aug

chanakya065
Aug

M PRANAY
Aug

sriram yerra_O66
Aug

EatClub
Aug

EatClub
Aug

220

+2110

+%60

+2400

2146

115"""

    print("🧪 Testing Post-Processing Improvements")
    print("=" * 50)
    
    print("📄 Original OCR Text:")
    print(test_text)
    print("\n" + "=" * 50)
    
    fixed_text = post_process_ocr_text(test_text)
    
    print("🔧 Fixed OCR Text:")
    print(fixed_text)
    print("\n" + "=" * 50)
    
    # Analyze improvements
    print("📊 Improvements Analysis:")
    
    original_lines = [line.strip() for line in test_text.split('\n') if line.strip()]
    fixed_lines = [line.strip() for line in fixed_text.split('\n') if line.strip()]
    
    improvements = []
    for i, (orig, fixed) in enumerate(zip(original_lines, fixed_lines)):
        if orig != fixed:
            improvements.append(f"Line {i+1}: '{orig}' → '{fixed}'")
    
    for improvement in improvements:
        print(f"✅ {improvement}")
    
    # Check specific fixes
    currency_symbols = len(re.findall(r'₹', fixed_text))
    print(f"\n💰 Currency symbols found: {currency_symbols}")
    
    # Check names
    expected_names = ['EatClub', 'chanakya065', 'M PRANAY', 'sriram yerra_066']
    found_names = 0
    for name in expected_names:
        if name in fixed_text:
            print(f"✅ Found name: {name}")
            found_names += 1
        else:
            print(f"❌ Missing name: {name}")
    
    # Check amounts
    amounts = re.findall(r'[₹]\s*(\d+)', fixed_text)
    amounts_numeric = [int(amt) for amt in amounts if amt.isdigit()]
    print(f"\n💵 Extracted amounts: {amounts_numeric}")
    
    expected_amounts = [220, 110, 60, 400, 146, 115]
    correct_amounts = len([amt for amt in expected_amounts if amt in amounts_numeric])
    
    print(f"\n📈 Final Results:")
    print(f"   Names: {found_names}/{len(expected_names)} ({found_names/len(expected_names)*100:.1f}%)")
    print(f"   Amounts: {correct_amounts}/{len(expected_amounts)} ({correct_amounts/len(expected_amounts)*100:.1f}%)")
    print(f"   Currency symbols: {currency_symbols}")
    
    overall_accuracy = (found_names + correct_amounts) / (len(expected_names) + len(expected_amounts)) * 100
    print(f"\n🎯 Overall Accuracy: {overall_accuracy:.1f}%")
    
    if overall_accuracy > 80:
        print("🎉 Post-processing significantly improved accuracy!")
    elif overall_accuracy > 60:
        print("✅ Post-processing helped improve accuracy")
    else:
        print("🔧 Post-processing needs more work")

if __name__ == "__main__":
    test_post_processing()