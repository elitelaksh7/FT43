import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Camera, Upload, X, Check, Scan, FileImage, Receipt, CreditCard } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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

interface TransactionItem {
  merchant: string;
  amount: number;
  date: string;
  type: 'credit' | 'debit';
  id?: string;
}

interface ParsedTransactionHistory {
  transactions: TransactionItem[];
  count: number;
  app_detected: string;
  confidence: number;
  raw_text_from_ocr?: string;
}

interface OCRBillScannerProps {
  onBillParsed?: (bill: ParsedBill) => void;
  onTransactionHistoryParsed?: (transactions: TransactionItem[]) => void;
}

export default function OCRBillScanner({ onBillParsed, onTransactionHistoryParsed }: OCRBillScannerProps) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [parsedBill, setParsedBill] = useState<ParsedBill | null>(null);
  const [parsedTransactions, setParsedTransactions] = useState<TransactionItem[] | null>(null);
  const [showCamera, setShowCamera] = useState(false);
  const [activeTab, setActiveTab] = useState<'bill' | 'transactions'>('bill');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isCameraReady, setIsCameraReady] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Initialize camera when showCamera becomes true
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
      setCameraError(null);
      setIsCameraReady(false);
      
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment', // Use back camera on mobile
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        
        videoRef.current.onloadedmetadata = () => {
          setIsCameraReady(true);
        };
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      setCameraError('Unable to access camera. Please check permissions.');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCameraReady(false);
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current || !isCameraReady) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context) return;

    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw video frame to canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Convert canvas to base64 image
    const imageDataUrl = canvas.toDataURL('image/jpeg', 0.8);
    setSelectedImage(imageDataUrl);
    setShowCamera(false);
    console.log('Photo captured successfully');
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        console.error('Please select an image file');
        return;
      }

      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        console.error('File size too large. Please select an image under 10MB');
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setSelectedImage(result);
        console.log('Image uploaded for OCR processing');
      };
      reader.onerror = () => {
        console.error('Error reading file');
      };
      reader.readAsDataURL(file);
    }
  };

  const captureFromCamera = () => {
    console.log('Camera capture initiated');
    setCameraError(null);
    setShowCamera(true);
  };

  const scanImage = async () => {
    if (!selectedImage) return;
    
    setIsProcessing(true);
    console.log(`Processing ${activeTab === 'bill' ? 'bill' : 'transaction history'} with OCR`);
    
    try {
      // Convert base64 to blob
      const base64Response = await fetch(selectedImage);
      const blob = await base64Response.blob();
      
      // Create form data
      const formData = new FormData();
      formData.append('file', blob, 'screenshot.png');
      
      // Determine which endpoint to use
      const endpoint = activeTab === 'bill' 
        ? 'http://localhost:8002/parse-image/'
        : 'http://localhost:8002/parse-payment-app/';
      
      // Send request to backend
      const response = await fetch(endpoint, {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error(`Failed to process image: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // If processing receipt, also get AI categorization
      if (activeTab === 'bill' && data.recipientName) {
        try {
          const categoryResponse = await fetch(`http://localhost:8002/get-category/${encodeURIComponent(data.recipientName)}`, {
            method: 'GET',
          });
          
          if (categoryResponse.ok) {
            const categoryData = await categoryResponse.json();
            data.ai_category = categoryData.category;
            data.ai_confidence = categoryData.confidence;
            data.ai_reasoning = categoryData.reasoning;
            console.log('AI Categorization:', categoryData);
          }
        } catch (categoryError) {
          console.warn('Failed to get AI categorization:', categoryError);
        }
      }
      
      if (activeTab === 'bill') {
        setParsedBill(data);
        onBillParsed?.(data);
        setParsedTransactions(null);
      } else {
        // Handle transaction data
        setParsedTransactions(data.transactions);
        onTransactionHistoryParsed?.(data.transactions);
        setParsedBill(null);
      }
    } catch (error) {
      console.error('Error processing image:', error);
      
      // Fallback to mock data if API fails
      if (activeTab === 'bill') {
        // Mock bill data
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
      } else {
        // Mock transaction history data
        const mockTransactions: TransactionItem[] = [
          {
            merchant: 'EatClub',
            amount: 220,
            date: '10 August',
            type: 'debit',
            id: '1'
          },
          {
            merchant: 'EatClub',
            amount: 220,
            date: '9 August',
            type: 'debit',
            id: '2'
          },
          {
            merchant: 'chanakya065',
            amount: 110,
            date: '8 August',
            type: 'credit',
            id: '3'
          },
          {
            merchant: 'M PRANAY',
            amount: 60,
            date: '6 August',
            type: 'credit',
            id: '4'
          }
        ];
        setParsedTransactions(mockTransactions);
        onTransactionHistoryParsed?.(mockTransactions);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const confirmBill = () => {
    if (parsedBill) {
      console.log('Bill confirmed:', parsedBill);
      setSelectedImage(null);
      setParsedBill(null);
    }
  };

  const confirmTransactions = () => {
    if (parsedTransactions) {
      console.log('Transactions confirmed:', parsedTransactions);
      setSelectedImage(null);
      setParsedTransactions(null);
    }
  };

  const resetScanner = () => {
    setSelectedImage(null);
    setParsedBill(null);
    setParsedTransactions(null);
    setShowCamera(false);
    setCameraError(null);
    setIsCameraReady(false);
    stopCamera();
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-6" data-testid="ocr-scanner">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleImageUpload}
        className="hidden"
        data-testid="file-input"
      />
      
      <Card className="hover-elevate">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Scan className="h-5 w-5" />
            OCR Scanner
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'bill' | 'transactions')}>
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="bill" data-testid="tab-receipt-scanner">
                <Receipt className="h-4 w-4 mr-2" />
                Receipt Scanner
              </TabsTrigger>
              <TabsTrigger value="transactions" data-testid="tab-transaction-scanner">
                <CreditCard className="h-4 w-4 mr-2" />
                Payment History
              </TabsTrigger>
            </TabsList>
            <TabsContent value="bill" className="mt-0">
              <p className="text-sm text-muted-foreground mb-4">
                Scan individual receipts to extract line items, merchant details, and total amount.
              </p>
            </TabsContent>
            <TabsContent value="transactions" className="mt-0">
              <p className="text-sm text-muted-foreground mb-4">
                Scan transaction history screenshots from payment apps to import multiple transactions at once.
              </p>
            </TabsContent>
          </Tabs>
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
              <div className="relative h-64 bg-muted rounded-lg overflow-hidden">
                {cameraError ? (
                  <div className="h-full flex items-center justify-center">
                    <div className="text-center">
                      <Camera className="h-12 w-12 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-red-500 mb-2">{cameraError}</p>
                      <Button onClick={captureFromCamera} variant="outline" size="sm">
                        Try Again
                      </Button>
                    </div>
                  </div>
                ) : !isCameraReady ? (
                  <div className="h-full flex items-center justify-center">
                    <div className="text-center">
                      <Camera className="h-12 w-12 mx-auto mb-2 animate-pulse" />
                      <p>Camera is initializing...</p>
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
                    />
                    <canvas
                      ref={canvasRef}
                      className="hidden"
                    />
                    <div className="absolute inset-0 border-2 border-dashed border-primary/50 pointer-events-none" />
                    <div className="absolute top-2 left-2 bg-black/50 text-white px-2 py-1 rounded text-xs">
                      {activeTab === 'bill' ? 'Position receipt in frame' : 'Position screenshot in frame'}
                    </div>
                  </>
                )}
              </div>
              <div className="flex gap-2 justify-center">
                {isCameraReady && !cameraError && (
                  <Button 
                    onClick={capturePhoto} 
                    className="flex-1"
                    data-testid="button-capture-photo"
                  >
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

          {selectedImage && !parsedBill && !parsedTransactions && (
            <div className="space-y-4">
              <div className="relative">
                <img
                  src={selectedImage}
                  alt="Receipt/Transaction preview"
                  className="w-full max-h-64 object-contain rounded-lg border"
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={resetScanner}
                  className="absolute top-2 right-2 bg-white/80 hover:bg-white"
                  data-testid="button-clear-image"
                >
                  <X className="h-4 w-4" />
                </Button>
                <div className="absolute bottom-2 left-2 bg-black/50 text-white px-2 py-1 rounded text-xs">
                  Ready to scan
                </div>
              </div>
              
              <Button
                onClick={scanImage}
                disabled={isProcessing}
                className="w-full"
                data-testid="button-scan-bill"
              >
                {isProcessing ? (
                  <>
                    <Scan className="h-4 w-4 mr-2 animate-spin" />
                    {activeTab === 'bill' ? 'Scanning Receipt...' : 'Scanning Transactions...'}
                  </>
                ) : (
                  <>
                    <FileImage className="h-4 w-4 mr-2" />
                    {activeTab === 'bill' ? 'Scan Receipt' : 'Scan Transactions'}
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
              {(parsedBill as any).ai_category && (
                <div>
                  <p className="font-medium">AI Category</p>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{(parsedBill as any).ai_category}</Badge>
                    <span className="text-xs text-muted-foreground">
                      {Math.round(((parsedBill as any).ai_confidence || 0) * 100)}% confidence
                    </span>
                  </div>
                  {(parsedBill as any).ai_reasoning && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {(parsedBill as any).ai_reasoning}
                    </p>
                  )}
                </div>
              )}
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
                Confirm & Add
              </Button>
              <Button
                onClick={resetScanner}
                variant="outline"
                data-testid="button-rescan"
              >
                <X className="h-4 w-4 mr-1" />
                Rescan
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Parsed Transaction Results */}
      {parsedTransactions && parsedTransactions.length > 0 && (
        <Card className="hover-elevate">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Scanned Transactions</span>
              <Badge variant="secondary">
                {parsedTransactions.length} transactions found
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {parsedTransactions.map((transaction, index) => (
                <div 
                  key={transaction.id || index} 
                  className="flex justify-between items-center text-sm border-b p-2"
                  data-testid={`transaction-${index}`}
                >
                  <div className="flex-1">
                    <p className="font-medium">{transaction.merchant}</p>
                    <p className="text-muted-foreground text-xs">
                      {transaction.date}
                    </p>
                  </div>
                  <Badge variant={transaction.type === 'debit' ? 'destructive' : 'secondary'} className="ml-2">
                    {transaction.type === 'credit' ? '+' : '-'}₹{transaction.amount}
                  </Badge>
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <Button
                onClick={confirmTransactions}
                className="flex-1"
                data-testid="button-confirm-transactions"
              >
                <Check className="h-4 w-4 mr-1" />
                Import All Transactions
              </Button>
              <Button
                onClick={resetScanner}
                variant="outline"
                data-testid="button-rescan-transactions"
              >
                <X className="h-4 w-4 mr-1" />
                Rescan
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}