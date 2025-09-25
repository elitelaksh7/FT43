import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Brain, Check, X, Edit3, Sparkles, AlertTriangle, TrendingUp, Database, Target } from 'lucide-react';

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

  const API_BASE = 'http://localhost:8000';

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
          accuracyRate: 85, // Mock accuracy rate
          learnedMerchants: stats.learned_merchants_count || 0,
          lowConfidencePredictions: 0
        });
      }
    } catch (error) {
      console.error('Failed to fetch AI stats:', error);
    }
  };

  const categorizeMerchant = async (merchantName: string) => {
    setIsProcessing(true);
    try {
      const response = await fetch(`${API_BASE}/get-category/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: merchantName })
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error:', response.status, errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }
      
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const responseText = await response.text();
        console.error('Non-JSON response:', responseText);
        throw new Error('Server returned non-JSON response');
      }
      
      const result = await response.json();
      return {
        category: result.category,
        confidence: result.confidence,
        confidenceScore: result.confidence_score || 0.7,
        alternatives: result.alternatives || [],
        needsVerification: result.needs_verification || false,
        verificationMessage: result.verification_message
      };
    } catch (error) {
      console.error('Categorization failed:', error);
    } finally {
      setIsProcessing(false);
    }
    return null;
  };
      setIsProcessing(false);
    }
    return null;
  };

  const sendFeedback = async (merchantName: string, aiPrediction: string, userCorrection: string, confidenceScore: number) => {
    try {
      const response = await fetch(`${API_BASE}/confirm-category/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          receiver_name: merchantName,
          confirmed_category: userCorrection
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

  const confirmCategory = async (transactionId: string, category: string) => {
    console.log(`Category confirmed for transaction ${transactionId}: ${category}`);
    
    const transaction = pendingTransactions.find(t => t.id === transactionId);
    if (transaction) {
      await sendFeedback(transaction.merchant, transaction.suggestedCategory, category, transaction.confidenceScore);
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

  const updateCategory = async (transactionId: string, newCategory: string) => {
    const transaction = pendingTransactions.find(t => t.id === transactionId);
    if (transaction && transaction.suggestedCategory !== newCategory) {
      await sendFeedback(transaction.merchant, transaction.suggestedCategory, newCategory, transaction.confidenceScore);
    }
    
    setPendingTransactions(prev =>
      prev.map(t => t.id === transactionId ? { ...t, suggestedCategory: newCategory } : t)
    );
  };

  const processAllTransactions = async () => {
    setIsProcessing(true);
    for (const transaction of pendingTransactions) {
      await confirmCategory(transaction.id, transaction.suggestedCategory);
    }
    setIsProcessing(false);
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600';
    if (confidence >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getConfidenceBadge = (confidence: number) => {
    if (confidence >= 0.8) return { label: 'High', variant: 'default' as const };
    if (confidence >= 0.6) return { label: 'Medium', variant: 'secondary' as const };
    return { label: 'Low', variant: 'destructive' as const };
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
            <Target className="h-5 w-5" />
            Test AI Categorization
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input 
              placeholder="Enter merchant name (e.g., BookMyShow, Myntra)" 
              value={merchantInput}
              onChange={(e) => setMerchantInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && testMerchantCategorization()}
            />
            <Button 
              onClick={testMerchantCategorization} 
              disabled={isProcessing || !merchantInput.trim()}
            >
              {isProcessing ? <Sparkles className="h-4 w-4 animate-spin" /> : <Brain className="h-4 w-4" />}
              Test
            </Button>
          </div>
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
            <div className="text-center py-8">
              <Database className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No pending transactions to categorize</p>
              <p className="text-sm text-muted-foreground mt-2">
                Test the AI by entering a merchant name above
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingTransactions.map((transaction) => {
                const confidenceBadge = getConfidenceBadge(transaction.confidenceScore);
                
                return (
                  <Card key={transaction.id} className="p-4">
                    {transaction.needsVerification && (
                      <Alert className="mb-4">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                          {transaction.verificationMessage}
                        </AlertDescription>
                      </Alert>
                    )}
                    
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-medium">{transaction.merchant}</span>
                          <Badge variant={confidenceBadge.variant}>
                            {confidenceBadge.label} ({Math.round(transaction.confidenceScore * 100)}%)
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{transaction.description}</p>
                        <p className="text-sm font-medium">₹{transaction.amount}</p>
                        
                        {/* Alternative Categories */}
                        {transaction.alternativeCategories && transaction.alternativeCategories.length > 0 && (
                          <div className="mt-2">
                            <p className="text-xs text-muted-foreground mb-1">Alternative suggestions:</p>
                            <div className="flex gap-1 flex-wrap">
                              {transaction.alternativeCategories.map((alt, idx) => (
                                <Button
                                  key={idx}
                                  variant="outline"
                                  size="sm"
                                  className="text-xs h-6"
                                  onClick={() => updateCategory(transaction.id, alt.category)}
                                >
                                  {alt.category} ({Math.round(alt.confidence * 100)}%)
                                </Button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2 ml-4">
                        <Select
                          value={transaction.suggestedCategory}
                          onValueChange={(value) => updateCategory(transaction.id, value)}
                        >
                          <SelectTrigger className="w-40">
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

                        <Button
                          size="sm"
                          variant="default"
                          onClick={() => confirmCategory(transaction.id, transaction.suggestedCategory)}
                          data-testid={`button-confirm-${transaction.id}`}
                        >
                          <Check className="h-4 w-4" />
                        </Button>

                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateCategory(transaction.id, 'Other')}
                          data-testid={`button-reject-${transaction.id}`}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}