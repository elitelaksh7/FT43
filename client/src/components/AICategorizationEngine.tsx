import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Brain, Check, X, Edit3, Sparkles } from 'lucide-react';

interface Transaction {
  id: string;
  description: string;
  amount: number;
  merchant: string;
  suggestedCategory: string;
  confidence: number;
  alternativeCategories: string[];
}

interface AICategoryEngineProps {
  transactions?: Transaction[];
  onCategoryConfirmed?: (transactionId: string, category: string) => void;
}

const CATEGORIES = [
  'Food & Dining',
  'Transportation',
  'Shopping',
  'Entertainment',
  'Bills & Utilities',
  'Healthcare',
  'Travel',
  'Education',
  'Personal Care',
  'Home & Garden',
  'Gifts & Donations',
  'Business',
  'Other'
];

export default function AICategorizationEngine({ 
  transactions = [], 
  onCategoryConfirmed 
}: AICategoryEngineProps) {
  const [pendingTransactions, setPendingTransactions] = useState<Transaction[]>(transactions);
  const [isProcessing, setIsProcessing] = useState(false);

  const confirmCategory = (transactionId: string, category: string) => {
    console.log(`Category confirmed for transaction ${transactionId}: ${category}`);
    setPendingTransactions(prev => prev.filter(t => t.id !== transactionId));
    onCategoryConfirmed?.(transactionId, category);
  };

  const rejectSuggestion = (transactionId: string) => {
    console.log(`Category suggestion rejected for transaction ${transactionId}`);
    setPendingTransactions(prev => 
      prev.map(t => t.id === transactionId ? { ...t, suggestedCategory: 'Other', confidence: 0 } : t)
    );
  };

  const updateCategory = (transactionId: string, newCategory: string) => {
    setPendingTransactions(prev =>
      prev.map(t => t.id === transactionId ? { ...t, suggestedCategory: newCategory } : t)
    );
  };

  const processAllTransactions = async () => {
    setIsProcessing(true);
    console.log('Processing all transactions with AI categorization');
    
    // TODO: remove mock functionality - integrate with OpenAI for real categorization
    setTimeout(() => {
      pendingTransactions.forEach(transaction => {
        confirmCategory(transaction.id, transaction.suggestedCategory);
      });
      setIsProcessing(false);
    }, 2000);
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
                              key={alt}
                              size="sm"
                              variant="ghost"
                              className="h-6 px-2 text-xs"
                              onClick={() => updateCategory(transaction.id, alt)}
                              data-testid={`button-alt-${transaction.id}-${alt}`}
                            >
                              {alt}
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