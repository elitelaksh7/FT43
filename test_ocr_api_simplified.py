import requests
import os
import time

# Wait a few seconds to ensure server is fully started
print("Waiting for server to initialize...")
time.sleep(2)

# Test basic connection
try:
    print("\n--- Testing basic connection ---")
    response = requests.get("http://localhost:8002/")
    print(f"Status code: {response.status_code}")
    print(f"Response: {response.json()}")
except Exception as e:
    print(f"Error connecting to server: {e}")

# Find a test image file
test_images = []
for root, _, files in os.walk('.'):
    for file in files:
        if file.lower().endswith(('.png', '.jpg', '.jpeg')):
            test_images.append(os.path.join(root, file))
            if len(test_images) >= 3:  # Limit to 3 images
                break
    if len(test_images) >= 3:
        break

if not test_images:
    print("No image files found for testing!")
    # Create a simple test image
    from PIL import Image, ImageDraw, ImageFont
    
    img = Image.new('RGB', (400, 200), color=(255, 255, 255))
    d = ImageDraw.Draw(img)
    d.text((20, 20), "TEST RECEIPT\nTotal: $123.45\nDate: 10/20/2023", fill=(0, 0, 0))
    
    test_image_path = 'test_receipt.png'
    img.save(test_image_path)
    test_images = [test_image_path]
    print(f"Created test image: {test_image_path}")

# Test receipt parsing
print("\n--- Testing receipt parsing ---")
for image_path in test_images:
    try:
        print(f"Testing with image: {image_path}")
        with open(image_path, 'rb') as f:
            files = {'file': (os.path.basename(image_path), f, 'image/jpeg')}
            response = requests.post("http://localhost:8002/parse-image/", files=files)
            print(f"Status code: {response.status_code}")
            print(f"Response: {response.json()}")
    except Exception as e:
        print(f"Error testing image {image_path}: {e}")

# Test payment app parsing
print("\n--- Testing payment app parsing ---")
for image_path in test_images:
    try:
        print(f"Testing with image: {image_path}")
        with open(image_path, 'rb') as f:
            files = {'file': (os.path.basename(image_path), f, 'image/jpeg')}
            response = requests.post("http://localhost:8002/parse-payment-app/", files=files)
            print(f"Status code: {response.status_code}")
            print(f"Response: {response.json()}")
    except Exception as e:
        print(f"Error testing image {image_path}: {e}")

print("\nAll tests completed!")