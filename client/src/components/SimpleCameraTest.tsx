import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Camera, Upload, X, AlertCircle, CheckCircle } from 'lucide-react';

export default function SimpleCameraTest() {
  const [showCamera, setShowCamera] = useState(false);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [ocrResult, setOcrResult] = useState<any>(null);
  const [activeMode, setActiveMode] = useState<'receipt' | 'payment'>('receipt');
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const addDebugInfo = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setDebugInfo(prev => [...prev, `[${timestamp}] ${message}`]);
    console.log(`[Camera Debug] ${message}`);
  };

  useEffect(() => {
    if (showCamera) {
      initializeCamera();
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [showCamera]);

  const initializeCamera = async () => {
    try {
      addDebugInfo('Starting camera initialization...');
      setCameraError(null);
      setIsCameraReady(false);
      
      // Check if getUserMedia is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera API not supported in this browser');
      }

      addDebugInfo('Requesting camera permissions...');
      
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment', // Use back camera on mobile
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });
      
      addDebugInfo('Camera permission granted');
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        
        videoRef.current.onloadedmetadata = () => {
          addDebugInfo(`Video loaded: ${videoRef.current?.videoWidth}x${videoRef.current?.videoHeight}`);
          setIsCameraReady(true);
        };

        videoRef.current.onerror = (e) => {
          addDebugInfo(`Video error: ${e}`);
          setCameraError('Video element error');
        };
      }
    } catch (error: any) {
      addDebugInfo(`Camera initialization failed: ${error.message}`);
      console.error('Error accessing camera:', error);
      
      let errorMessage = 'Unable to access camera. ';
      if (error.name === 'NotAllowedError') {
        errorMessage += 'Permission denied. Please allow camera access and try again.';
      } else if (error.name === 'NotFoundError') {
        errorMessage += 'No camera found on this device.';
      } else if (error.name === 'NotSupportedError') {
        errorMessage += 'Camera not supported on this browser.';
      } else {
        errorMessage += error.message;
      }
      
      setCameraError(errorMessage);
    }
  };

  const stopCamera = () => {
    addDebugInfo('Stopping camera...');
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        track.stop();
        addDebugInfo(`Stopped track: ${track.kind}`);
      });
      streamRef.current = null;
    }
    setIsCameraReady(false);
  };

  const capturePhoto = () => {
    addDebugInfo('Capturing photo...');
    if (!videoRef.current || !canvasRef.current || !isCameraReady) {
      addDebugInfo('Camera not ready for capture');
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context) {
      addDebugInfo('Canvas context not available');
      return;
    }

    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw video frame to canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Convert canvas to base64 image
    const imageDataUrl = canvas.toDataURL('image/jpeg', 0.8);
    setCapturedImage(imageDataUrl);
    setShowCamera(false);
    
    addDebugLog(`Photo captured: ${canvas.width}x${canvas.height}, Size: ${Math.round(imageDataUrl.length/1024)}KB`);
  };

  const processImageWithOCR = async () => {
    if (!capturedImage) {
      addDebugInfo('No image to process');
      return;
    }

    setIsProcessing(true);
    addDebugInfo(`Starting OCR processing in ${activeMode} mode...`);

    try {
      // Convert base64 to blob
      const response = await fetch(capturedImage);
      const blob = await response.blob();
      
      // Create form data
      const formData = new FormData();
      formData.append('file', blob, 'image.jpg');
      
      // Determine endpoint based on mode
      const endpoint = activeMode === 'receipt' 
        ? 'http://localhost:8002/parse-image/'
        : 'http://localhost:8002/parse-payment-app/';
      
      addDebugInfo(`Making API request to ${endpoint}`);
      
      // Send request to backend
      const apiResponse = await fetch(endpoint, {
        method: 'POST',
        body: formData,
      });
      
      if (!apiResponse.ok) {
        throw new Error(`API responded with status: ${apiResponse.status} ${apiResponse.statusText}`);
      }
      
      const result = await apiResponse.json();
      setOcrResult(result);
      addDebugInfo(`OCR processing successful: ${JSON.stringify(result, null, 2)}`);
      
    } catch (error: any) {
      addDebugInfo(`OCR processing failed: ${error.message}`);
      console.error('OCR Error:', error);
      
      // Fallback to mock data for demonstration
      const mockResult = activeMode === 'receipt' ? {
        recipientName: "Mock Store",
        amount: 25.99,
        isDebit: true,
        timestamp: new Date().toISOString(),
        raw_text_from_ocr: "Mock OCR text - API connection failed",
        confidence: 0.75,
        ai_category: "Food",
        ai_confidence: 0.85
      } : {
        transactions: [
          {
            merchant: "EatClub",
            amount: 220,
            date: "Today",
            type: "debit"
          },
          {
            merchant: "Coffee Shop",
            amount: 45,
            date: "Yesterday", 
            type: "debit"
          }
        ],
        count: 2,
        app_detected: "Payment App",
        confidence: 0.80
      };
      
      setOcrResult(mockResult);
      addDebugInfo(`Using mock data due to API failure: ${JSON.stringify(mockResult, null, 2)}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const categorizeTransaction = async (merchantName: string) => {
    addDebugInfo(`Categorizing merchant: ${merchantName}`);
    
    try {
      const response = await fetch(`http://localhost:8002/get-category/${encodeURIComponent(merchantName)}`, {
        method: 'GET',
      });
      
      if (!response.ok) {
        throw new Error(`Categorization API responded with status: ${response.status}`);
      }
      
      const result = await response.json();
      addDebugInfo(`Categorization result: ${JSON.stringify(result)}`);
      return result;
      
    } catch (error: any) {
      addDebugInfo(`Categorization failed: ${error.message}`);
      // Return mock categorization
      return {
        category: "Food",
        confidence: 0.75,
        reasoning: "Mock categorization - API connection failed"
      };
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      addDebugInfo(`File selected: ${file.name}, Size: ${Math.round(file.size/1024)}KB`);
      
      if (!file.type.startsWith('image/')) {
        addDebugInfo('Invalid file type');
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setCapturedImage(result);
        addDebugInfo('File uploaded successfully');
      };
      reader.onerror = () => {
        addDebugInfo('File reading error');
      };
      reader.readAsDataURL(file);
    }
  };

  const reset = () => {
    setCapturedImage(null);
    setShowCamera(false);
    setCameraError(null);
    setDebugInfo([]);
    setOcrResult(null);
    setIsProcessing(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-6">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileUpload}
        className="hidden"
      />
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            Camera Debug Test
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Mode Selector */}
          <div className="flex gap-2 p-1 bg-muted rounded-lg">
            <button
              onClick={() => setActiveMode('receipt')}
              className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                activeMode === 'receipt'
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              🧾 Receipt Scanner
            </button>
            <button
              onClick={() => setActiveMode('payment')}
              className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                activeMode === 'payment'
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              💳 Payment History
            </button>
          </div>
          
          {/* Control Buttons */}
          <div className="flex gap-2 flex-wrap">
            <Button
              onClick={() => setShowCamera(true)}
              disabled={showCamera}
              variant={showCamera ? "secondary" : "default"}
            >
              <Camera className="h-4 w-4 mr-2" />
              Start Camera
            </Button>
            
            <Button
              onClick={() => fileInputRef.current?.click()}
              variant="outline"
            >
              <Upload className="h-4 w-4 mr-2" />
              Upload Image
            </Button>
            
            <Button onClick={reset} variant="outline">
              <X className="h-4 w-4 mr-2" />
              Reset
            </Button>
          </div>

          {/* Camera Status */}
          <div className="flex items-center gap-2 text-sm">
            {cameraError ? (
              <>
                <AlertCircle className="h-4 w-4 text-red-500" />
                <span className="text-red-500">Camera Error</span>
              </>
            ) : isCameraReady ? (
              <>
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-green-500">Camera Ready</span>
              </>
            ) : showCamera ? (
              <>
                <Camera className="h-4 w-4 animate-pulse text-blue-500" />
                <span className="text-blue-500">Initializing...</span>
              </>
            ) : (
              <>
                <Camera className="h-4 w-4 text-gray-500" />
                <span className="text-gray-500">Camera Stopped</span>
              </>
            )}
          </div>

          {/* Camera View */}
          {showCamera && (
            <div className="space-y-4">
              <div className="relative bg-black rounded-lg overflow-hidden" style={{ height: '300px' }}>
                {cameraError ? (
                  <div className="h-full flex items-center justify-center text-white">
                    <div className="text-center">
                      <AlertCircle className="h-12 w-12 mx-auto mb-2 text-red-400" />
                      <p className="mb-2">{cameraError}</p>
                      <Button onClick={() => setShowCamera(false)} variant="outline" size="sm">
                        Close
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-full object-cover"
                      style={{ display: isCameraReady ? 'block' : 'none' }}
                    />
                    {!isCameraReady && (
                      <div className="h-full flex items-center justify-center text-white">
                        <div className="text-center">
                          <Camera className="h-12 w-12 mx-auto mb-2 animate-pulse" />
                          <p>Loading camera...</p>
                        </div>
                      </div>
                    )}
                    <canvas ref={canvasRef} className="hidden" />
                  </>
                )}
              </div>
              
              {/* Camera Controls */}
              <div className="flex gap-2 justify-center">
                {isCameraReady && !cameraError && (
                  <Button onClick={capturePhoto} className="flex-1 max-w-xs">
                    <Camera className="h-4 w-4 mr-2" />
                    Capture Photo
                  </Button>
                )}
                <Button onClick={() => setShowCamera(false)} variant="outline">
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {/* Captured Image */}
          {capturedImage && (
            <div className="space-y-4">
              <div className="relative">
                <img
                  src={capturedImage}
                  alt="Captured"
                  className="w-full max-h-64 object-contain rounded-lg border"
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setCapturedImage(null)}
                  className="absolute top-2 right-2 bg-white/80"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="text-center">
                <div className="text-sm text-muted-foreground mb-3">
                  Image ready for {activeMode === 'receipt' ? 'receipt' : 'payment history'} processing
                </div>
                
                <Button 
                  onClick={processImageWithOCR}
                  disabled={isProcessing}
                  className="w-full max-w-sm"
                >
                  {isProcessing ? (
                    <>
                      <Camera className="h-4 w-4 mr-2 animate-spin" />
                      Processing {activeMode}...
                    </>
                  ) : (
                    <>
                      <Camera className="h-4 w-4 mr-2" />
                      Process {activeMode === 'receipt' ? 'Receipt' : 'Payment History'}
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* OCR Results */}
          {ocrResult && (
            <div className="space-y-4">
              <div className="bg-muted/50 rounded-lg p-4">
                <h3 className="font-semibold text-green-600 mb-2 flex items-center">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  OCR Processing Complete
                </h3>
                
                {activeMode === 'receipt' ? (
                  <div className="space-y-2 text-sm">
                    <div><strong>Merchant:</strong> {ocrResult.recipientName}</div>
                    <div><strong>Amount:</strong> ${ocrResult.amount}</div>
                    <div><strong>Date:</strong> {new Date(ocrResult.timestamp).toLocaleDateString()}</div>
                    <div><strong>Type:</strong> {ocrResult.isDebit ? 'Debit' : 'Credit'}</div>
                    {ocrResult.ai_category && (
                      <div><strong>AI Category:</strong> {ocrResult.ai_category} ({Math.round(ocrResult.ai_confidence * 100)}% confidence)</div>
                    )}
                    <div><strong>OCR Confidence:</strong> {Math.round(ocrResult.confidence * 100)}%</div>
                  </div>
                ) : (
                  <div className="space-y-2 text-sm">
                    <div><strong>App Detected:</strong> {ocrResult.app_detected}</div>
                    <div><strong>Transactions Found:</strong> {ocrResult.count}</div>
                    <div><strong>Confidence:</strong> {Math.round(ocrResult.confidence * 100)}%</div>
                    
                    {ocrResult.transactions && ocrResult.transactions.length > 0 && (
                      <div className="mt-3">
                        <strong>Transactions:</strong>
                        <div className="space-y-1 mt-1 max-h-32 overflow-y-auto">
                          {ocrResult.transactions.map((transaction: any, index: number) => (
                            <div key={index} className="flex justify-between text-xs p-2 bg-background rounded border">
                              <span>{transaction.merchant}</span>
                              <span className={transaction.type === 'debit' ? 'text-red-600' : 'text-green-600'}>
                                {transaction.type === 'debit' ? '-' : '+'}${transaction.amount}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
                
                <div className="mt-3 pt-3 border-t">
                  <details>
                    <summary className="text-xs font-medium cursor-pointer">Raw OCR Data</summary>
                    <pre className="text-xs bg-background p-2 rounded mt-2 overflow-auto">
                      {JSON.stringify(ocrResult, null, 2)}
                    </pre>
                  </details>
                </div>
              </div>
            </div>
          )}

          {/* Debug Information */}
          {debugInfo.length > 0 && (
            <details className="mt-4">
              <summary className="cursor-pointer text-sm font-medium mb-2">
                Debug Information ({debugInfo.length} messages)
              </summary>
              <div className="bg-gray-100 p-3 rounded text-xs font-mono max-h-40 overflow-y-auto">
                {debugInfo.map((info, index) => (
                  <div key={index}>{info}</div>
                ))}
              </div>
            </details>
          )}
        </CardContent>
      </Card>
    </div>
  );
}