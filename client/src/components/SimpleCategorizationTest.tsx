import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';

const SimpleCategorizationTest: React.FC = () => {
  const [merchantInput, setMerchantInput] = useState('');
  const [result, setResult] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [apiStats, setApiStats] = useState<any>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [selectedCorrection, setSelectedCorrection] = useState('');
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  const [customCategory, setCustomCategory] = useState('');
  const [useCustomCategory, setUseCustomCategory] = useState(false);

  const API_BASE = 'http://localhost:8002';
  
  // Test connectivity function
  const testConnectivity = async () => {
    console.log('🔧 Testing API connectivity...');
    try {
      const response = await fetch(`${API_BASE}/api-status/`);
      console.log('🔍 Connectivity test result:', {
        status: response.status,
        contentType: response.headers.get('content-type'),
        url: response.url
      });
      if (response.ok) {
        const data = await response.json();
        console.log('✅ API Status:', data);
      } else {
        console.log('❌ API Status failed:', await response.text());
      }
    } catch (error) {
      console.error('❌ Connectivity test failed:', error);
    }
  };
  
  // Available categories for correction
  const CATEGORIES = ['Food', 'Entertainment', 'Travelling', 'Clothes', 'Health', 'Bills', 'Groceries', 'Other'];

  // Fetch API stats on component mount
  useEffect(() => {
    testConnectivity();
    fetchApiStats();
  }, []);

  const fetchApiStats = async () => {
    try {
      const response = await fetch(`${API_BASE}/api-status/`);
      if (response.ok) {
        const stats = await response.json();
        setApiStats(stats);
      }
    } catch (error) {
      console.error('Failed to fetch API stats:', error);
    }
  };

  const sendFeedback = async (merchantName: string, predictedCategory: string, userCategory: string) => {
    try {
      const response = await fetch(`${API_BASE}/confirm-category/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          receiver_name: merchantName,
          confirmed_category: userCategory
        })
      });
      
      if (response.ok) {
        console.log('Feedback sent successfully');
        setFeedbackSubmitted(true);
        fetchApiStats(); // Refresh stats after feedback
        setTimeout(() => {
          setShowFeedback(false);
          setFeedbackSubmitted(false);
          setSelectedCorrection('');
          setCustomCategory('');
          setUseCustomCategory(false);
        }, 2000);
      }
    } catch (error) {
      console.error('Failed to send feedback:', error);
    }
  };

  const handleCorrectPrediction = () => {
    if (result && merchantInput) {
      sendFeedback(merchantInput, result.category, result.category);
    }
  };

  const handleIncorrectPrediction = () => {
    setShowFeedback(true);
  };

  const submitCorrection = () => {
    if (result && merchantInput) {
      const finalCategory = useCustomCategory ? customCategory.trim() : selectedCorrection;
      if (finalCategory) {
        sendFeedback(merchantInput, result.category, finalCategory);
      }
    }
  };

  const resetSession = () => {
    setResult(null);
    setError(null);
    setShowFeedback(false);
    setFeedbackSubmitted(false);
    setSelectedCorrection('');
    setCustomCategory('');
    setUseCustomCategory(false);
    setMerchantInput('');
  };

  const testMerchantCategorization = async () => {
    if (!merchantInput.trim()) return;
    
    setIsProcessing(true);
    setError(null);
    setResult(null);

    try {
      const requestUrl = `${API_BASE}/get-category/`;
      const requestBody = { name: merchantInput };
      
      console.log('🚀 Making request to:', requestUrl);
      console.log('📦 Request payload:', requestBody);
      console.log('🔧 API_BASE value:', API_BASE);
      
      const response = await fetch(requestUrl, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      console.log('📡 Response status:', response.status);
      console.log('📋 Response headers:', Object.fromEntries(response.headers.entries()));
      console.log('📄 Response URL:', response.url);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ API Error:', response.status, errorText);
        setError(`HTTP ${response.status}: ${errorText}`);
        return;
      }

      const contentType = response.headers.get('content-type');
      console.log('📝 Content-Type:', contentType);
      
      if (!contentType || !contentType.includes('application/json')) {
        const responseText = await response.text();
        console.error('❌ Non-JSON response received!');
        console.error('🔍 Response Content-Type:', contentType);
        console.error('📄 Response Text (first 500 chars):', responseText.substring(0, 500));
        
        if (responseText.includes('<!DOCTYPE html>')) {
          setError('❌ Received HTML instead of JSON. This suggests a proxy/routing issue. Check if backend is running on port 8000.');
        } else {
          setError('❌ Server returned non-JSON response: ' + responseText.substring(0, 200));
        }
        return;
      }

      const data = await response.json();
      console.log('API Response:', data);
      
      // Ensure data structure is as expected
      const processedResult = {
        ...data,
        category: data.category || 'Other',
        confidence_score: typeof data.confidence_score === 'number' ? data.confidence_score : 
                         typeof data.confidence === 'number' ? data.confidence : 0,
        alternatives: Array.isArray(data.alternatives) ? data.alternatives : []
      };
      
      setResult(processedResult);

    } catch (error: any) {
      console.error('Categorization failed:', error);
      setError(`Network error: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>🤖 AI Categorization Engine Test</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex space-x-2">
            <Input
              placeholder="Enter merchant name (e.g., McDonald's, Amazon, Shell)"
              value={merchantInput}
              onChange={(e) => setMerchantInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && testMerchantCategorization()}
            />
            <Button 
              onClick={testMerchantCategorization}
              disabled={isProcessing || !merchantInput.trim()}
            >
              {isProcessing ? 'Processing...' : 'Categorize'}
            </Button>
          </div>

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <h4 className="font-semibold text-red-800">Error:</h4>
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          {result && (
            <Card className="mt-6">
              <CardHeader>
                <h3 className="text-lg font-semibold text-green-600 dark:text-green-400">
                  ✓ Categorization Result
                </h3>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <div>
                    <p className="font-medium">Primary Category</p>
                    <p className="text-lg text-green-700 dark:text-green-300">{result.category}</p>
                  </div>
                  <Badge variant="secondary" className="text-sm">
                    {((result.confidence_score || (typeof result.confidence === 'number' ? result.confidence : 0)) * 100).toFixed(1)}% confidence
                  </Badge>
                </div>

                {result.alternatives && result.alternatives.length > 0 && (
                  <div>
                    <p className="font-medium mb-2">Alternative Categories:</p>
                    <div className="flex flex-wrap gap-2">
                      {result.alternatives.map((alt: any, idx: number) => (
                        <Badge key={idx} variant="outline" className="text-sm">
                          {typeof alt === 'string' ? alt : `${alt.category} (${(alt.confidence * 100).toFixed(0)}%)`}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {result.needs_verification && (
                  <div className="p-3 bg-yellow-50 border border-yellow-200 rounded">
                    <p className="text-sm text-yellow-800">
                      ⚠️ {result.verification_message || 'This prediction needs verification'}
                    </p>
                  </div>
                )}

                {/* Human Intervention Section */}
                <div className="border-t pt-4 mt-4">
                  <h4 className="font-medium mb-3">Was this categorization correct?</h4>
                  <div className="flex gap-3 mb-4">
                    <Button
                      onClick={handleCorrectPrediction}
                      className="bg-green-600 hover:bg-green-700 text-white"
                      disabled={feedbackSubmitted}
                    >
                      ✓ Correct
                    </Button>
                    <Button
                      onClick={handleIncorrectPrediction}
                      variant="outline"
                      className="border-red-300 text-red-600 hover:bg-red-50"
                      disabled={feedbackSubmitted}
                    >
                      ✗ Incorrect
                    </Button>
                  </div>

                  {/* Feedback Submission Form */}
                  {showFeedback && !feedbackSubmitted && (
                    <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg space-y-4">
                      <div>
                        <label className="block text-sm font-medium mb-3">
                          How would you like to correct this?
                        </label>
                        
                        {/* Category Selection Mode Toggle */}
                        <div className="flex gap-4 mb-4">
                          <label className="flex items-center">
                            <input
                              type="radio"
                              name="correctionMode"
                              checked={!useCustomCategory}
                              onChange={() => {
                                setUseCustomCategory(false);
                                setCustomCategory('');
                              }}
                              className="mr-2"
                            />
                            Select from predefined categories
                          </label>
                          <label className="flex items-center">
                            <input
                              type="radio"
                              name="correctionMode"
                              checked={useCustomCategory}
                              onChange={() => {
                                setUseCustomCategory(true);
                                setSelectedCorrection('');
                              }}
                              className="mr-2"
                            />
                            Create custom category
                          </label>
                        </div>

                        {/* Predefined Category Selection */}
                        {!useCustomCategory && (
                          <div>
                            <label className="block text-sm font-medium mb-2">
                              Select the correct category:
                            </label>
                            <Select value={selectedCorrection} onValueChange={setSelectedCorrection}>
                              <SelectTrigger className="w-full">
                                <SelectValue placeholder="Choose correct category" />
                              </SelectTrigger>
                              <SelectContent>
                                {CATEGORIES.map((category) => (
                                  <SelectItem key={category} value={category}>
                                    {category}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        )}

                        {/* Custom Category Input */}
                        {useCustomCategory && (
                          <div>
                            <label className="block text-sm font-medium mb-2">
                              Enter your custom category:
                            </label>
                            <Input
                              type="text"
                              placeholder="e.g., Shoes, Personal Care, Hobbies..."
                              value={customCategory}
                              onChange={(e) => setCustomCategory(e.target.value)}
                              className="w-full"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                              This will help personalize future categorizations for similar merchants
                            </p>
                          </div>
                        )}
                      </div>

                      <div className="flex gap-3">
                        <Button
                          onClick={submitCorrection}
                          disabled={useCustomCategory ? !customCategory.trim() : !selectedCorrection}
                          className="bg-blue-600 hover:bg-blue-700 text-white"
                        >
                          Submit Correction
                        </Button>
                        <Button
                          onClick={() => setShowFeedback(false)}
                          variant="outline"
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Feedback Success Message */}
                  {feedbackSubmitted && (
                    <Alert className="border-green-200 bg-green-50 dark:bg-green-900/20">
                      <AlertDescription className="text-green-700 dark:text-green-300">
                        Thank you! Your feedback helps improve our AI categorization.
                      </AlertDescription>
                    </Alert>
                  )}
                </div>

                <div className="pt-4 border-t">
                  <Button 
                    onClick={resetSession}
                    variant="outline"
                    className="w-full"
                  >
                    Test Another Merchant
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SimpleCategorizationTest;