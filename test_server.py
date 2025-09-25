import sys
import logging

# Configure detailed logging
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[logging.StreamHandler(sys.stdout)]
)

try:
    import uvicorn
    from fastapi import FastAPI
    
    # Create a very simple FastAPI app
    test_app = FastAPI()
    
    @test_app.get("/")
    def root():
        return {"message": "Test server is running!"}
    
    logging.info("Starting the test FastAPI server...")
    uvicorn.run(test_app, host="0.0.0.0", port=8003)
except Exception as e:
    logging.error(f"Error running server: {e}", exc_info=True)