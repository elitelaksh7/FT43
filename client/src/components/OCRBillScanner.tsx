import { useState, useRef, useEffect, lazy, Suspense } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Camera, Upload, X, Check, Scan, FileImage, Play } from 'lucide-react';

interface LineItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
  category?: string;
}

interface ParsedBill {
  id: string;
  merchantName: string;
  totalAmount: number;
  date: string;
  billNumber?: string;
  lineItems: LineItem[];
  confidence: number;
}

interface OCRBillScannerProps {
  onBillParsed?: (bill: ParsedBill) => void;
}

export default function OCRBillScanner({ onBillParsed }: OCRBillScannerProps) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [parsedBill, setParsedBill] = useState<ParsedBill | null>(null);
  const [showCamera, setShowCamera] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isStartingCamera, setIsStartingCamera] = useState(false);
  const [videoPlaying, setVideoPlaying] = useState(false);
  const [videoReady, setVideoReady] = useState(false);
  const [analysisOpen, setAnalysisOpen] = useState(false);
  const [ingesting, setIngesting] = useState(false);
  const [analysisReceiptId, setAnalysisReceiptId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const ReceiptAnalysisPanel = lazy(() => import('./ReceiptAnalysisPanel'));

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setSelectedImage(result);
        console.log('Image uploaded for OCR processing');
      };
      reader.readAsDataURL(file);
    }
  };

  const startCamera = async () => {
    if (isStartingCamera) return;
    setIsStartingCamera(true);
    setCameraError(null);
    try {
      // First try with default constraints for better compatibility
      const constraints: MediaStreamConstraints = {
        video: {
          width: { ideal: 1280, max: 1920 },
          height: { ideal: 720, max: 1080 },
          frameRate: { ideal: 30 }
        },
        audio: false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        
        // Wait for video metadata to load before playing
        videoRef.current.onloadedmetadata = () => {
          console.log('Video metadata loaded');
          if (videoRef.current) {
            videoRef.current.play()
              .then(() => {
                console.log('Video play started successfully');
                setVideoPlaying(true);
                setCameraError(null);
              })
              .catch(err => {
                console.warn('Auto-play blocked, user interaction required:', err);
                setVideoPlaying(false);
              });
          }
        };
        
        // Additional event to ensure video is ready
        videoRef.current.oncanplay = () => {
          console.log('Video can start playing');
          setCameraError(null);
        };
        
        videoRef.current.oncanplaythrough = () => {
          console.log('Video can play through without buffering');
          setCameraError(null);
        };
        
        // Force video to load metadata
        videoRef.current.load();
      }
      setShowCamera(true);
    } catch (err: any) {
      console.error('Failed to start camera', err);
      setCameraError(
        err?.name === 'NotAllowedError'
          ? 'Camera permission denied. Please allow camera access in your browser.'
          : err?.name === 'NotFoundError'
          ? 'No camera device found. Please connect a camera.'
          : 'Unable to access the camera.'
      );
      setShowCamera(false);
    } finally {
      setIsStartingCamera(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setShowCamera(false);
    setVideoPlaying(false);
    setVideoReady(false);
  };

  const manualPlayVideo = () => {
    if (videoRef.current) {
      videoRef.current.play()
        .then(() => {
          console.log('Manual video play successful');
          setVideoPlaying(true);
          setCameraError(null);
        })
        .catch(err => {
          console.error('Failed to play video:', err);
          setCameraError('Failed to start video playback');
        });
    }
  };

  const captureFromCamera = async () => {
    console.log('Camera capture initiated');
    if (!showCamera) await startCamera();
  };

  const takePhoto = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) {
      console.error('Video or canvas element not available');
      setCameraError('Camera elements not available');
      return;
    }
    
    // Check if video is playing and has valid dimensions
    if (video.readyState < 2 || video.videoWidth === 0 || video.videoHeight === 0) {
      console.warn('Video not fully loaded, attempting capture anyway...');
      // Don't return early, try to capture anyway
    }
    
    const width = video.videoWidth || video.clientWidth || 1280;
    const height = video.videoHeight || video.clientHeight || 720;
    
    console.log('Capturing photo with dimensions:', { width, height, readyState: video.readyState });
    
    // Ensure canvas has valid dimensions
    if (width <= 0 || height <= 0) {
      setCameraError('Invalid video dimensions for capture');
      return;
    }
    
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      // Clear canvas first
      ctx.clearRect(0, 0, width, height);
      // Draw the video frame
      ctx.drawImage(video, 0, 0, width, height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
      
      // Verify we got a valid image (not just black)
      if (dataUrl && dataUrl.length > 1000) {
        setSelectedImage(dataUrl);
        stopCamera();
      } else {
        setCameraError('Failed to capture image. Please try again.');
      }
    }
  };

  // Clean up camera on unmount
  useEffect(() => {
    return () => stopCamera();
  }, []);

  const scanBill = async () => {
    if (!selectedImage) return;
    
    setIsProcessing(true);
    console.log('Processing bill with OCR');
    
    // TODO: remove mock functionality - integrate with OpenAI Vision API
    setTimeout(() => {
      const mockBill: ParsedBill = {
        id: Date.now().toString(),
        merchantName: 'Whole Foods Market',
        totalAmount: 87.45,
        date: new Date().toISOString().split('T')[0],
        billNumber: 'INV-2024-001234',
        lineItems: [
          {
            id: '1',
            description: 'Organic Bananas',
            quantity: 2,
            unitPrice: 3.99,
            total: 7.98,
            category: 'Groceries'
          },
          {
            id: '2',
            description: 'Almond Milk',
            quantity: 1,
            unitPrice: 4.49,
            total: 4.49,
            category: 'Groceries'
          },
          {
            id: '3',
            description: 'Chicken Breast',
            quantity: 1,
            unitPrice: 12.99,
            total: 12.99,
            category: 'Groceries'
          },
          {
            id: '4',
            description: 'Mixed Salad',
            quantity: 2,
            unitPrice: 5.99,
            total: 11.98,
            category: 'Groceries'
          }
        ],
        confidence: 0.92
      };
      
      setParsedBill(mockBill);
      onBillParsed?.(mockBill);
      setIsProcessing(false);
    }, 3000);
  };

  const confirmBill = () => {
    if (parsedBill) {
      console.log('Bill confirmed:', parsedBill);
      setSelectedImage(null);
      setParsedBill(null);
    }
  };

  const openDetailedAnalysis = async () => {
    if (!parsedBill) {
      console.log('No parsed bill available');
      return;
    }
    
    console.log('Opening detailed analysis for:', parsedBill);
    
    try {
      setIngesting(true);
      
      // Generate a unique receipt ID for mock analysis
      const mockReceiptId = `receipt-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      // Simulate a brief loading time for better UX
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Set the receipt ID and open the analysis panel
      setAnalysisReceiptId(mockReceiptId);
      setAnalysisOpen(true);
      
      console.log('Analysis panel opened with ID:', mockReceiptId);
      
    } catch (error) {
      console.error('Error opening detailed analysis:', error);
    } finally {
      setIngesting(false);
    }
  };

  const resetScanner = () => {
    setSelectedImage(null);
    setParsedBill(null);
    setShowCamera(false);
  };

  return (
    <div className="space-y-6" data-testid="ocr-scanner">
      <Card className="hover-elevate">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Scan className="h-5 w-5" />
            OCR Bill Scanner
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!selectedImage && !showCamera && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button
                onClick={captureFromCamera}
                className="h-32 border-dashed border-2"
                variant="outline"
                data-testid="button-camera-capture"
              >
                <div className="text-center">
                  <Camera className="h-8 w-8 mx-auto mb-2" />
                  <p>Capture Receipt</p>
                  <p className="text-xs text-muted-foreground">Use camera</p>
                </div>
              </Button>

              <Button
                onClick={() => fileInputRef.current?.click()}
                className="h-32 border-dashed border-2"
                variant="outline"
                data-testid="button-upload-receipt"
              >
                <div className="text-center">
                  <Upload className="h-8 w-8 mx-auto mb-2" />
                  <p>Upload Receipt</p>
                  <p className="text-xs text-muted-foreground">Select from gallery</p>
                </div>
              </Button>
            </div>
          )}

          {showCamera && (
            <div className="text-center space-y-4">
              <div className="relative w-full max-w-md mx-auto">
                <video
                  ref={videoRef}
                  className="w-full h-64 object-cover bg-gray-900 rounded-lg border-2 border-gray-300"
                  autoPlay
                  playsInline
                  muted
                  style={{ transform: 'scaleX(-1)' }} // Mirror the video like a selfie
                  onLoadedData={() => {
                    console.log('Video loaded, dimensions:', videoRef.current?.videoWidth, 'x', videoRef.current?.videoHeight);
                    console.log('Video ready state:', videoRef.current?.readyState);
                    console.log('Video paused:', videoRef.current?.paused);
                    setCameraError(null);
                    setVideoPlaying(!videoRef.current?.paused);
                    
                    // Give video a moment to stabilize before allowing capture
                    setTimeout(() => {
                      if (videoRef.current && videoRef.current.videoWidth > 0) {
                        setVideoReady(true);
                        console.log('Video is ready for capture');
                      }
                    }, 1000);
                  }}
                  onPlay={() => {
                    console.log('Video started playing');
                    setVideoPlaying(true);
                    // Additional delay after play starts
                    setTimeout(() => setVideoReady(true), 500);
                  }}
                  onPause={() => {
                    console.log('Video paused');
                    setVideoPlaying(false);
                    setVideoReady(false);
                  }}
                  onError={(e) => {
                    console.error('Video element error:', e);
                    setCameraError('Video display error. Please try again.');
                  }}
                />
                <canvas ref={canvasRef} className="hidden" />
                
                {/* Loading overlay while starting */}
                {isStartingCamera && (
                  <div className="absolute inset-0 bg-black bg-opacity-50 rounded-lg flex items-center justify-center">
                    <div className="text-white text-center">
                      <Camera className="h-8 w-8 mx-auto mb-2 animate-pulse" />
                      <p>Starting camera...</p>
                    </div>
                  </div>
                )}
                
                {/* Manual play button if video isn't playing */}
                {!isStartingCamera && !videoPlaying && (
                  <div className="absolute inset-0 bg-black bg-opacity-50 rounded-lg flex items-center justify-center">
                    <Button onClick={manualPlayVideo} variant="outline" size="lg">
                      <Play className="h-6 w-6 mr-2" />
                      Start Video
                    </Button>
                  </div>
                )}
              </div>

              {cameraError && (
                <div className="text-sm text-destructive bg-red-50 p-3 rounded-lg">
                  {cameraError}
                </div>
              )}

              <div className="flex gap-2 justify-center">
                <Button 
                  onClick={takePhoto} 
                  disabled={!!cameraError || isStartingCamera || !videoReady}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Camera className="h-4 w-4 mr-2" />
                  {videoReady ? 'Capture' : 'Getting Ready...'}
                </Button>
                <Button onClick={stopCamera} variant="outline">
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {selectedImage && !parsedBill && (
            <div className="space-y-4">
              <div className="relative">
                <img
                  src={selectedImage}
                  alt="Receipt preview"
                  className="w-full max-h-64 object-contain rounded-lg"
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={resetScanner}
                  className="absolute top-2 right-2"
                  data-testid="button-clear-image"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              
              <Button
                onClick={scanBill}
                disabled={isProcessing}
                className="w-full"
                data-testid="button-scan-bill"
              >
                {isProcessing ? (
                  <>
                    <Scan className="h-4 w-4 mr-2 animate-spin" />
                    Scanning Receipt...
                  </>
                ) : (
                  <>
                    <FileImage className="h-4 w-4 mr-2" />
                    Scan Receipt
                  </>
                )}
              </Button>
            </div>
          )}

          <Input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
          />
        </CardContent>
      </Card>

      {/* Parsed Bill Results */}
      {parsedBill && (
        <Card className="hover-elevate">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Scanned Receipt</span>
              <Badge variant="secondary">
                {Math.round(parsedBill.confidence * 100)}% confidence
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="font-medium">Merchant</p>
                <p className="text-muted-foreground">{parsedBill.merchantName}</p>
              </div>
              <div>
                <p className="font-medium">Date</p>
                <p className="text-muted-foreground">{parsedBill.date}</p>
              </div>
              <div>
                <p className="font-medium">Total Amount</p>
                <p className="text-lg font-bold text-primary">${parsedBill.totalAmount}</p>
              </div>
              <div>
                <p className="font-medium">Bill Number</p>
                <p className="text-muted-foreground">{parsedBill.billNumber}</p>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-medium">Line Items</h4>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {parsedBill.lineItems.map((item) => (
                  <div 
                    key={item.id} 
                    className="flex justify-between items-center text-sm border-b pb-2"
                    data-testid={`line-item-${item.id}`}
                  >
                    <div className="flex-1">
                      <p className="font-medium">{item.description}</p>
                      <p className="text-muted-foreground text-xs">
                        {item.quantity} × ${item.unitPrice}
                        {item.category && (
                          <Badge variant="outline" className="ml-2 text-xs">
                            {item.category}
                          </Badge>
                        )}
                      </p>
                    </div>
                    <p className="font-medium">${item.total}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={confirmBill}
                className="flex-1"
                data-testid="button-confirm-bill"
              >
                <Check className="h-4 w-4 mr-1" />
                Confirm & Close
              </Button>
              <Button
                onClick={resetScanner}
                variant="outline"
                data-testid="button-rescan"
              >
                <X className="h-4 w-4 mr-1" />
                Rescan
              </Button>
              <Button
                onClick={openDetailedAnalysis}
                variant="secondary"
                disabled={ingesting}
                aria-haspopup="dialog"
              >
                {ingesting ? 'Opening…' : 'View detailed analysis'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {analysisReceiptId && (
        <Suspense fallback={null}>
          <ReceiptAnalysisPanel
            receiptId={analysisReceiptId}
            open={analysisOpen}
            onOpenChange={setAnalysisOpen}
            aiEnabled
          />
        </Suspense>
      )}
    </div>
  );
}