import { useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { Upload, Scan, CheckCircle, AlertCircle, Loader2, Eye } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProcessedTransaction {
  id: string;
  merchant: string;
  amount: number;
  date: string;
  category: string;
  confidence: number;
  aiCategory?: string;
  aiConfidence?: number;
}

interface OCRResult {
  receiptId: string;
  ocrConfidence: number;
  extractedText: string;
  transactions: ProcessedTransaction[];
  metadata: {
    merchantName?: string;
    totalAmount?: number;
    date?: string;
    processingTime: number;
  };
}

const OCRBillScannerEnhanced = () => {
  const { toast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processStep, setProcessStep] = useState<string>('');
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<OCRResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  }, []);

  const handleFileSelect = (selectedFile: File) => {
    if (!selectedFile) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf'];
    if (!allowedTypes.includes(selectedFile.type)) {
      setError('Please select a valid image file (JPEG, PNG, WebP) or PDF');
      return;
    }

    // Validate file size (10MB limit)
    if (selectedFile.size > 10 * 1024 * 1024) {
      setError('File size must be less than 10MB');
      return;
    }

    setFile(selectedFile);
    setError(null);
    setResult(null);

    // Create preview for images
    if (selectedFile.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreview(e.target?.result as string);
      };
      reader.readAsDataURL(selectedFile);
    } else {
      setPreview(null);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      handleFileSelect(selectedFile);
    }
  };

  const processReceipt = async () => {
    if (!file) return;

    setIsProcessing(true);
    setError(null);
    setResult(null);
    setProgress(0);
    setProcessStep('Uploading receipt...');

    try {
      const formData = new FormData();
      formData.append('receipt', file);

      // Start progress simulation
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev < 85) return prev + Math.random() * 10;
          return prev;
        });
      }, 500);

      const response = await fetch('/api/receipts/upload', {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressInterval);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Upload failed' }));
        throw new Error(errorData.message || `Upload failed with status ${response.status}`);
      }

      const uploadResult = await response.json();
      const receiptId = uploadResult.receiptId;

      setProcessStep('Processing with OCR...');
      setProgress(25);

      // Poll for OCR completion
      const pollOCR = async () => {
        for (let attempt = 0; attempt < 30; attempt++) {
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          const ocrResponse = await fetch(`/api/receipts/${receiptId}/status`);
          if (!ocrResponse.ok) continue;
          
          const status = await ocrResponse.json();
          
          if (status.ocrProcessed) {
            setProcessStep('Extracting transactions...');
            setProgress(50);
            
            // Wait for AI categorization
            if (status.aiProcessed) {
              setProcessStep('Finalizing...');
              setProgress(90);
              
              // Get final results
              const resultsResponse = await fetch(`/api/receipts/${receiptId}`);
              if (resultsResponse.ok) {
                const finalResult = await resultsResponse.json();
                setResult(finalResult);
                setProgress(100);
                setProcessStep('Complete!');
                
                toast({
                  title: "Receipt Processed Successfully",
                  description: `Found ${finalResult.transactions?.length || 0} transactions`,
                  duration: 5000,
                });
                
                return true;
              }
            } else {
              setProcessStep('AI categorizing transactions...');
              setProgress(70);
            }
          } else if (status.error) {
            throw new Error(status.error);
          }
        }
        throw new Error('Processing timeout');
      };

      await pollOCR();

    } catch (err) {
      console.error('Processing error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Processing failed';
      setError(errorMessage);
      
      toast({
        title: "Processing Failed",
        description: errorMessage,
        variant: "destructive",
        duration: 5000,
      });
    } finally {
      setIsProcessing(false);
      setProcessStep('');
    }
  };

  const resetScanner = () => {
    setFile(null);
    setPreview(null);
    setResult(null);
    setError(null);
    setProgress(0);
    setProcessStep('');
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-foreground mb-2">Enhanced OCR Receipt Scanner</h1>
        <p className="text-muted-foreground">
          Upload receipts for automatic OCR processing, transaction extraction, and AI categorization
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Upload Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Upload Receipt
            </CardTitle>
            <CardDescription>
              Upload receipt images (JPEG, PNG, WebP) or PDF files up to 10MB
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* File Upload Area */}
            <div
              className={cn(
                "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors",
                dragActive 
                  ? "border-primary bg-primary/5" 
                  : file 
                  ? "border-green-500 bg-green-50 dark:bg-green-950" 
                  : "border-muted-foreground/25 hover:border-primary"
              )}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => document.getElementById('receipt-upload')?.click()}
            >
              {file ? (
                <div className="space-y-2">
                  <CheckCircle className="h-8 w-8 text-green-600 mx-auto" />
                  <p className="font-medium text-green-700 dark:text-green-400">
                    {file.name}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {(file.size / 1024 / 1024).toFixed(1)} MB
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <Upload className="h-8 w-8 text-muted-foreground mx-auto" />
                  <p className="text-sm text-muted-foreground">
                    Drag and drop your receipt here, or click to browse
                  </p>
                </div>
              )}
            </div>

            <Input
              id="receipt-upload"
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp,application/pdf"
              onChange={handleFileInputChange}
              className="hidden"
            />

            {/* Preview */}
            {preview && (
              <div className="space-y-2">
                <Label>Preview</Label>
                <div className="border rounded-lg overflow-hidden">
                  <img 
                    src={preview} 
                    alt="Receipt preview" 
                    className="w-full h-48 object-contain bg-muted"
                  />
                </div>
              </div>
            )}

            {/* Processing Progress */}
            {isProcessing && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm font-medium">{processStep}</span>
                </div>
                <Progress value={progress} className="w-full" />
              </div>
            )}

            {/* Error Display */}
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Action Buttons */}
            <div className="flex gap-2">
              <Button 
                onClick={processReceipt}
                disabled={!file || isProcessing}
                className="flex-1"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Scan className="h-4 w-4 mr-2" />
                    Scan Receipt
                  </>
                )}
              </Button>
              
              {(file || result) && (
                <Button 
                  variant="outline"
                  onClick={resetScanner}
                  disabled={isProcessing}
                >
                  Reset
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Results Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Processing Results
            </CardTitle>
            <CardDescription>
              OCR extraction and transaction details
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {result ? (
              <div className="space-y-4">
                {/* OCR Metadata */}
                <div className="p-3 bg-muted rounded-lg space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">OCR Confidence</span>
                    <Badge variant={result.ocrConfidence > 0.8 ? "default" : "secondary"}>
                      {Math.round(result.ocrConfidence * 100)}%
                    </Badge>
                  </div>
                  
                  {result.metadata.merchantName && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Merchant</span>
                      <span className="text-sm">{result.metadata.merchantName}</span>
                    </div>
                  )}
                  
                  {result.metadata.totalAmount && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Total Amount</span>
                      <span className="text-sm font-mono">
                        ${result.metadata.totalAmount.toFixed(2)}
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Processing Time</span>
                    <span className="text-sm">{result.metadata.processingTime}ms</span>
                  </div>
                </div>

                {/* Transactions */}
                {result.transactions && result.transactions.length > 0 && (
                  <div className="space-y-2">
                    <Label>Extracted Transactions ({result.transactions.length})</Label>
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {result.transactions.map((transaction, index) => (
                        <div key={index} className="p-3 border rounded-lg space-y-2">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-medium">{transaction.merchant}</p>
                              <p className="text-sm text-muted-foreground">
                                {new Date(transaction.date).toLocaleDateString()}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-mono font-medium">
                                ${transaction.amount.toFixed(2)}
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex flex-wrap gap-1">
                            <Badge variant="outline" className="text-xs">
                              {transaction.category}
                            </Badge>
                            
                            {transaction.aiCategory && (
                              <Badge variant="secondary" className="text-xs">
                                AI: {transaction.aiCategory} ({Math.round((transaction.aiConfidence || 0) * 100)}%)
                              </Badge>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Raw OCR Text */}
                {result.extractedText && (
                  <details className="space-y-2">
                    <summary className="cursor-pointer font-medium text-sm">
                      Raw OCR Text
                    </summary>
                    <div className="p-3 bg-muted rounded text-xs font-mono whitespace-pre-wrap max-h-32 overflow-y-auto">
                      {result.extractedText}
                    </div>
                  </details>
                )}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <Scan className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Upload a receipt to see processing results</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default OCRBillScannerEnhanced;