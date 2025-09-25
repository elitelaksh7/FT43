"""
OCR Server Requirements Installation Script
This script checks and installs all required dependencies for the OCR server
"""

import sys
import subprocess
import platform

def check_python_version():
    """Check that Python version is at least 3.8"""
    print(f"Checking Python version...")
    major, minor = sys.version_info[:2]
    if major < 3 or (major == 3 and minor < 8):
        print(f"❌ Python 3.8 or higher required. You have {major}.{minor}")
        return False
    print(f"✅ Python version {major}.{minor} - OK")
    return True

def install_requirements():
    """Install required Python packages"""
    requirements = [
        "fastapi",
        "uvicorn",
        "python-multipart",
        "pillow",
        "python-dotenv",
        "requests",
        "pytesseract"
    ]
    
    print(f"Installing required packages: {', '.join(requirements)}")
    
    try:
        subprocess.check_call([sys.executable, "-m", "pip", "install", "--upgrade", "pip"])
        for req in requirements:
            print(f"Installing {req}...")
            subprocess.check_call([sys.executable, "-m", "pip", "install", req])
        print("✅ All required Python packages installed successfully")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ Error installing packages: {e}")
        return False

def check_tesseract():
    """Check if Tesseract OCR is installed"""
    print("Checking for Tesseract OCR...")
    try:
        import pytesseract
        version = pytesseract.get_tesseract_version()
        print(f"✅ Tesseract is installed (version {version})")
        return True
    except Exception as e:
        print(f"⚠️ Tesseract OCR not found or not in PATH: {e}")
        print("The server will run in mock mode (using sample data)")
        
        if platform.system() == "Windows":
            print("\nTo install Tesseract OCR on Windows:")
            print("1. Download from: https://github.com/UB-Mannheim/tesseract/wiki")
            print("2. Install and add to PATH")
            print("3. Restart your terminal and try again")
        elif platform.system() == "Darwin":  # macOS
            print("\nTo install Tesseract OCR on macOS:")
            print("1. Install Homebrew if not installed: /bin/bash -c \"$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)\"")
            print("2. Run: brew install tesseract")
        else:  # Linux
            print("\nTo install Tesseract OCR on Linux:")
            print("1. Run: sudo apt-get update && sudo apt-get install -y tesseract-ocr")
        
        return False

def main():
    """Main function"""
    print("=== OCR Server Setup ===")
    
    if not check_python_version():
        print("Please upgrade Python and try again.")
        return False
    
    if not install_requirements():
        print("Failed to install required packages. Please install them manually.")
        return False
    
    check_tesseract()  # We don't fail if Tesseract is not installed, just warn
    
    print("\n=== Setup Complete ===")
    print("Run the OCR server with: python ocr_server_fixed.py")
    return True

if __name__ == "__main__":
    main()