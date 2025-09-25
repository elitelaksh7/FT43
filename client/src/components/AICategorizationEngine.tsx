import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Brain, Check, X, Edit3, Sparkles, AlertTriangle, TrendingUp, Database } from 'lucide-react';

interface Transaction {
  id: string;
  description: string;
  amount: number;
  merchant: string;
  suggestedCategory: string;
  confidence: number;
  confidenceScore: number;
  alternativeCategories: Array<{category: string, confidence: number}>;
  needsVerification?: boolean;
  verificationMessage?: string;
}

interface AIStats {
  totalPredictions: number;
  accuracyRate: number;
  learnedMerchants: number;
  lowConfidencePredictions: number;
}

interface AICategoryEngineProps {
  transactions?: Transaction[];
  onCategoryConfirmed?: (transactionId: string, category: string) => void;
}

const CATEGORIES = [
  'Food',
  'Groceries', 
  'Travelling',
  'Entertainment',
  'Bills',
  'Health',
  'Clothes',
  'Personal',
  'Other'
];

const API_BASE = 'http://127.0.0.1:8000';

export default function AICategorizationEngine({ 
  transactions = [], 
  onCategoryConfirmed 
}: AICategoryEngineProps) {
  const [pendingTransactions, setPendingTransactions] = useState<Transaction[]>(transactions);
  const [isProcessing, setIsProcessing] = useState(false);
  const [merchantInput, setMerchantInput] = useState('');
  const [aiStats, setAiStats] = useState<AIStats>({
    totalPredictions: 0,
    accuracyRate: 0,
    learnedMerchants: 0,
    lowConfidencePredictions: 0
  });
  const [isLearning, setIsLearning] = useState(false);

  // Fetch AI statistics on component mount
  useEffect(() => {
    fetchAIStats();
  }, []);

  const fetchAIStats = async () => {
    try {
      const response = await fetch(`${API_BASE}/api-status/`);
      if (response.ok) {
        const stats = await response.json();
        setAiStats({
          totalPredictions: stats.learned_merchants_count || 0,
          accuracyRate: 85, // Mock accuracy rate for now
          learnedMerchants: stats.learned_merchants_count || 0,
          lowConfidencePredictions: 0
        });
      } else {
        console.log('API not available, using mock data');
        setAiStats({
          totalPredictions: 5,
          accuracyRate: 85,
          learnedMerchants: 6,
          lowConfidencePredictions: 2
        });
      }
    } catch (error) {
      console.error('Failed to fetch AI stats:', error);
      // Use mock data if API is not available
      setAiStats({
        totalPredictions: 5,
        accuracyRate: 85,
        learnedMerchants: 6,
        lowConfidencePredictions: 2
      });
    }
  };

  const categorizeMerchant = async (merchantName: string) => {
    setIsProcessing(true);
    console.log(`Testing categorization for: ${merchantName}`);
    
    try {
      const response = await fetch(`${API_BASE}/get-category/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: merchantName })
      });
      
      console.log(`Response status: ${response.status}`);
      
      if (response.ok) {
        const result = await response.json();
        console.log('AI categorization result:', result);
        
        return {
          category: result.category,
          confidence: result.confidence,
          confidenceScore: result.confidence_score || 0.7,
          alternatives: result.alternatives || [],
          needsVerification: result.needs_verification || false,
          verificationMessage: result.verification_message
        };
      } else {
        console.error(`API returned status ${response.status}`);
        const errorText = await response.text();
        console.error('Error response:', errorText);
      }
    } catch (error) {
      console.error('Categorization failed:', error);
      console.error('Full error details:', error);
      
      // Provide fallback response for demo purposes
      return {
        category: 'Other',
        confidence: 'Demo mode - API not connected',
        confidenceScore: 0.5,
        alternatives: [{category: 'Food', confidence: 0.3}, {category: 'Entertainment', confidence: 0.2}],
        needsVerification: true,
        verificationMessage: 'Running in demo mode - backend API not connected'
      };
    } finally {
      setIsProcessing(false);
    }
    return null;
  };

  const sendFeedback = async (merchantName: string, aiPrediction: string, userCorrection: string, confidenceScore: number) => {
    try {
      const response = await fetch(`${API_BASE}/feedback/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          receiver_name: merchantName,
          ai_predicted_category: aiPrediction,
          user_corrected_category: userCorrection,
          confidence_score: confidenceScore,
          timestamp: new Date().toISOString()
        })
      });
      
      if (response.ok) {
        console.log('Feedback sent successfully');
        fetchAIStats(); // Refresh stats after feedback
      }
    } catch (error) {
      console.error('Failed to send feedback:', error);
    }
  };

  const confirmCategory = async (transactionId: string, category: string, originalPrediction?: string, originalConfidence?: number) => {
    console.log(`Category confirmed for transaction ${transactionId}: ${category}`);
    
    // Send feedback if this was a correction
    const transaction = pendingTransactions.find(t => t.id === transactionId);
    if (transaction && originalPrediction && originalPrediction !== category) {
      await sendFeedback(transaction.merchant, originalPrediction, category, originalConfidence || 0);
    }
    
    setPendingTransactions(prev => prev.filter(t => t.id !== transactionId));
    onCategoryConfirmed?.(transactionId, category);
  };

  const testMerchantCategorization = async () => {
    if (!merchantInput.trim()) return;
    
    const result = await categorizeMerchant(merchantInput);
    if (result) {
      const newTransaction: Transaction = {
        id: `test-${Date.now()}`,
        description: `Test transaction from ${merchantInput}`,
        amount: 100,
        merchant: merchantInput,
        suggestedCategory: result.category,
        confidence: result.confidenceScore,
        confidenceScore: result.confidenceScore,
        alternativeCategories: result.alternatives,
        needsVerification: result.needsVerification,
        verificationMessage: result.verificationMessage
      };
      
      setPendingTransactions(prev => [newTransaction, ...prev]);
      setMerchantInput('');
    }
  };

  const rejectSuggestion = (transactionId: string) => {
    console.log(`Category suggestion rejected for transaction ${transactionId}`);
    const transaction = pendingTransactions.find(t => t.id === transactionId);
    if (transaction) {
      // Send feedback about the rejection
      sendFeedback(transaction.merchant, transaction.suggestedCategory, 'Other', transaction.confidenceScore);
    }
    setPendingTransactions(prev => 
      prev.map(t => t.id === transactionId ? { ...t, suggestedCategory: 'Other', confidence: 0, confidenceScore: 0 } : t)
    );
  };

  const updateCategory = async (transactionId: string, newCategory: string) => {
    const transaction = pendingTransactions.find(t => t.id === transactionId);
    if (transaction && transaction.suggestedCategory !== newCategory) {
      // Send feedback about the correction
      await sendFeedback(transaction.merchant, transaction.suggestedCategory, newCategory, transaction.confidenceScore);
    }
    
    setPendingTransactions(prev =>
      prev.map(t => t.id === transactionId ? { ...t, suggestedCategory: newCategory } : t)
    );
  };

  const processAllTransactions = async () => {
    setIsProcessing(true);
    console.log('Processing all transactions with AI categorization');
    
    for (const transaction of pendingTransactions) {
      await confirmCategory(transaction.id, transaction.suggestedCategory);
    }
    setIsProcessing(false);
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-chart-2';
    if (confidence >= 0.6) return 'text-chart-3';
    return 'text-destructive';
  };

  const getConfidenceBadge = (confidence: number) => {
    if (confidence >= 0.8) return 'High';
    if (confidence >= 0.6) return 'Medium';
    return 'Low';
  };

  return (
    <div className="space-y-6" data-testid="ai-categorization">
      {/* AI Performance Dashboard */}
      <Card className="hover-elevate">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            AI Performance Dashboard
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{aiStats.accuracyRate}%</div>
              <div className="text-sm text-muted-foreground">Accuracy Rate</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{aiStats.learnedMerchants}</div>
              <div className="text-sm text-muted-foreground">Learned Merchants</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{aiStats.totalPredictions}</div>
              <div className="text-sm text-muted-foreground">Total Predictions</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{aiStats.lowConfidencePredictions}</div>
              <div className="text-sm text-muted-foreground">Need Review</div>
            </div>
          </div>
          <div className="mt-4">
            <div className="flex justify-between text-sm mb-1">
              <span>Learning Progress</span>
              <span>{aiStats.accuracyRate}%</span>
            </div>
            <Progress value={aiStats.accuracyRate} className="h-2" />
          </div>
        </CardContent>
      </Card>

      {/* Test Merchant Categorization */}
      <Card className="hover-elevate">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Test AI Categorization
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input 
              placeholder="Enter merchant name (e.g., BookMyShow, Myntra, Zomato)" 
              value={merchantInput}
              onChange={(e) => setMerchantInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && testMerchantCategorization()}
              className="flex-1"
            />
            <Button 
              onClick={testMerchantCategorization} 
              disabled={isProcessing || !merchantInput.trim()}
            >
              {isProcessing ? (
                <Sparkles className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Brain className="h-4 w-4 mr-2" />
                  Test AI
                </>
              )}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Try merchants like: BookMyShow, Myntra, IRCTC, Dominos, Unknown Store
          </p>
        </CardContent>
      </Card>

      {/* Transaction Categorization */}
      <Card className="hover-elevate">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            AI Transaction Categorization
            <Badge variant="secondary" className="ml-auto">
              {pendingTransactions.length} pending
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {pendingTransactions.length > 0 && (
            <div className="flex justify-between items-center mb-4">
              <p className="text-sm text-muted-foreground">
                Review AI-suggested categories below
              </p>
              <Button
                onClick={processAllTransactions}
                disabled={isProcessing}
                size="sm"
                data-testid="button-process-all"
              >
                {isProcessing ? (
                  <>
                    <Sparkles className="h-4 w-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Accept All
                  </>
                )}
              </Button>
            </div>
          )}

          {pendingTransactions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Brain className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No transactions pending categorization</p>
              <p className="text-sm">New transactions will appear here for AI review</p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingTransactions.map((transaction) => (
                <div 
                  key={transaction.id}
                  className="border rounded-lg p-4 space-y-3"
                  data-testid={`transaction-${transaction.id}`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium">{transaction.merchant}</p>
                        <Badge variant="outline" className="text-xs">
                          ${transaction.amount}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {transaction.description}
                      </p>
                    </div>
                    <Badge 
                      variant="outline" 
                      className={`text-xs ${getConfidenceColor(transaction.confidence)}`}
                    >
                      {getConfidenceBadge(transaction.confidence)} confidence
                    </Badge>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">Suggested Category:</span>
                      <Badge variant="secondary">{transaction.suggestedCategory}</Badge>
                    </div>

                    <div className="flex items-center gap-2">
                      <Select
                        value={transaction.suggestedCategory}
                        onValueChange={(value) => updateCategory(transaction.id, value)}
                      >
                        <SelectTrigger className="w-48" data-testid={`select-category-${transaction.id}`}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {CATEGORIES.map((category) => (
                            <SelectItem key={category} value={category}>
                              {category}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <div className="flex gap-1 ml-auto">
                        <Button
                          size="sm"
                          onClick={() => confirmCategory(transaction.id, transaction.suggestedCategory)}
                          data-testid={`button-confirm-${transaction.id}`}
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => rejectSuggestion(transaction.id)}
                          data-testid={`button-reject-${transaction.id}`}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {transaction.alternativeCategories.length > 0 && (
                      <div className="flex items-center gap-2 pt-2 border-t">
                        <span className="text-xs text-muted-foreground">Alternatives:</span>
                        <div className="flex gap-1 flex-wrap">
                          {transaction.alternativeCategories.map((alt) => (
                            <Button
                              key={alt.category}
                              size="sm"
                              variant="ghost"
                              className="h-6 px-2 text-xs"
                              onClick={() => updateCategory(transaction.id, alt.category)}
                              data-testid={`button-alt-${transaction.id}-${alt.category}`}
                            >
                              {alt.category}
                            </Button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}