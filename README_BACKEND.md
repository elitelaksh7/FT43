# WalletWise AI Backend

This is the Python FastAPI backend for the WalletWise fintech application, providing AI-powered transaction categorization and OCR capabilities.

## Features

- **Transaction Parsing**: Extract transaction details from text (SMS) or images (bills/screenshots)
- **AI Categorization**: Use Google's Gemini AI to categorize transactions intelligently
- **OCR Support**: Extract text from images using Tesseract OCR
- **Learning System**: Improve categorization accuracy based on user feedback
- **RESTful API**: FastAPI-based endpoints with automatic documentation

## Setup

### 1. Install Dependencies

```bash
pip install -r requirements.txt
```

### 2. Configure API Keys

1. Copy `.env.example` to `.env`
2. Get your Google AI API key from [Google AI Studio](https://makersuite.google.com/app/apikey)
3. Add your API key to the `.env` file

### 3. Install Tesseract OCR

For Windows:
1. Download Tesseract from [GitHub releases](https://github.com/UB-Mannheim/tesseract/wiki)
2. Install and add to PATH, or update the path in your code

For Ubuntu/Debian:
```bash
sudo apt-get install tesseract-ocr
```

For macOS:
```bash
brew install tesseract
```

## Running the Server

### Option 1: Using the start script
```bash
python start_server.py
```

### Option 2: Direct uvicorn command
```bash
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

### Option 3: Python module
```bash
python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

## API Documentation

Once the server is running, visit:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## API Endpoints

### 1. Transaction Parsing

#### Parse from Text (SMS)
```http
POST /parse-text/
Content-Type: application/json

{
    "text": "You spent Rs.500 at Zomato on 2024-01-15"
}
```

#### Parse from Image (OCR)
```http
POST /parse-image/
Content-Type: multipart/form-data

file: [image file]
```

### 2. AI Categorization

#### Get Category Prediction
```http
POST /get-category/
Content-Type: application/json

{
    "name": "Zomato"
}
```

#### Confirm User Category (Learning)
```http
POST /confirm-category/
Content-Type: application/json

{
    "receiver_name": "Zomato",
    "confirmed_category": "Food"
}
```

## Categories

The system uses these predefined categories:
- Food
- Groceries
- Clothes
- Health
- Personal
- Travelling
- Bills
- Entertainment
- Other

## Architecture

- **FastAPI**: Modern, fast web framework for building APIs
- **Google Gemini AI**: Advanced language model for transaction categorization
- **Tesseract OCR**: Optical character recognition for image processing
- **Pydantic**: Data validation and settings management
- **PIL/Pillow**: Image processing

## Development

The backend includes:
- Automatic API documentation generation
- Input validation with Pydantic models
- Error handling
- Hot reloading for development
- Simulated database (replace with real database in production)

## Production Considerations

For production deployment:
1. Replace the simulated database with a real database (PostgreSQL, MongoDB, etc.)
2. Add proper authentication and authorization
3. Implement rate limiting
4. Use environment variables for all configuration
5. Add logging and monitoring
6. Consider using Docker for containerization

## Environment Variables

- `GOOGLE_AI_API_KEY`: Your Google AI API key
- `DEBUG`: Enable debug mode (default: false)
- `LOG_LEVEL`: Logging level (default: info)