"""
Simple API test to check if the OCR server is running and responding
"""
import requests

def test_server_endpoints():
    """Test if the server is responding to basic requests"""
    
    endpoints = [
        "http://localhost:8002/",  # Root endpoint
        "http://localhost:8002/docs",  # Swagger docs
        "http://localhost:8002/parse-image/",  # Image parsing endpoint
        "http://localhost:8002/parse-payment-app/",  # Payment app parsing
        "http://localhost:8002/parse-text/"  # Text parsing endpoint
    ]
    
    print("Testing server endpoints...")
    for endpoint in endpoints:
        try:
            if "/parse" in endpoint:
                # For endpoints that expect POST, just check if they exist
                method = "POST"
                # For POST endpoints, we just check if the server responds, not if the request is valid
                response = requests.options(endpoint)
            else:
                method = "GET"
                response = requests.get(endpoint)
            
            status = response.status_code
            if status < 500:  # Any response that's not a server error is good for testing
                print(f"✅ {method} {endpoint}: {status}")
            else:
                print(f"❌ {method} {endpoint}: {status} - Server Error")
        except requests.exceptions.ConnectionError:
            print(f"❌ {endpoint}: Connection refused - Server not running or endpoint doesn't exist")
        except Exception as e:
            print(f"❌ {endpoint}: {str(e)}")

if __name__ == "__main__":
    test_server_endpoints()