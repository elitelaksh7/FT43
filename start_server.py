#!/usr/bin/env python3
"""
Start the WalletWise AI FastAPI backend server.
"""

import uvicorn
from main import app

if __name__ == "__main__":
    print("Starting WalletWise AI Backend Server...")
    print("API documentation will be available at: http://localhost:8000/docs")
    print("Alternative documentation at: http://localhost:8000/redoc")
    uvicorn.run(
        app, 
        host="0.0.0.0", 
        port=8000, 
        reload=True,  # Enable hot reloading for development
        log_level="info"
    )