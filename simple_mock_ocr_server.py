from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"message": "WalletWise Mock OCR API is running", "status": "ok"}

@app.post("/parse-image/")
async def parse_image(file: UploadFile = File(...)):
    # Return mock receipt data
    return {
        "recipientName": "Whole Foods Market",
        "amount": 87.45,
        "isDebit": True,
        "timestamp": "2025-09-25T12:00:00",
        "raw_text_from_ocr": "Mock OCR text for receipt",
        "mock_mode": True
    }

@app.post("/parse-payment-app/")
async def parse_payment_app_screenshot(file: UploadFile = File(...)):
    # Return mock transaction history
    return {
        "transactions": [
            {
                "merchant": "EatClub",
                "amount": 220,
                "date": "10 August",
                "type": "debit"
            },
            {
                "merchant": "EatClub",
                "amount": 220,
                "date": "9 August",
                "type": "debit"
            },
            {
                "merchant": "chanakya065",
                "amount": 110,
                "date": "8 August",
                "type": "credit"
            },
            {
                "merchant": "M PRANAY",
                "amount": 60,
                "date": "6 August",
                "type": "credit"
            }
        ],
        "count": 4,
        "app_detected": "EatClub",
        "confidence": 0.85,
        "mock_mode": True
    }

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8002)