"""
SMS Parser Server Start Script - Runs the SMS Parser server without reloading
"""
import uvicorn

if __name__ == "__main__":
    print("Starting SMS Transaction Parser API Server...")
    print("API documentation will be available at: http://localhost:8002/docs")
    # Direct import approach to avoid reload issues
    from sms_parser_server import app
    uvicorn.run(app, host="0.0.0.0", port=8002, log_level="info", reload=False)