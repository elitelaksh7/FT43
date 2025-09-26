import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { 
  BarChart3, FileText, DollarSign, TrendingUp, Target, Zap, 
  ShoppingCart, Calendar, PieChart as PieChartIcon, CheckCircle, 
  Edit3, RefreshCw, Download, X, Building
} from "lucide-react";

export type ReceiptAnalysisPanelProps = {
  receiptId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  aiEnabled?: boolean;
};

export function ReceiptAnalysisPanel({ receiptId, open, onOpenChange }: ReceiptAnalysisPanelProps) {
  const [analysis, setAnalysis] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const mockData = {
    total: 87.45,
    merchant: "Whole Foods Market",
    confidence: 96,
    date: "2025-09-26",
    time: "2:47 PM",
    categoryTrend: "+15.7% vs last month",
    items: [
      { name: "Organic Bananas", price: 6.49, category: "Produce", bestPrice: 4.99, savings: 1.50 },
      { name: "Greek Yogurt", price: 8.99, category: "Dairy", bestPrice: 7.49, savings: 1.50 },
      { name: "Almond Milk", price: 4.29, category: "Dairy", bestPrice: 3.79, savings: 0.50 }
    ],
    categoryBreakdown: [
      { category: "Groceries", amount: 65.2, percentage: 74.6, color: "#10b981" },
      { category: "Tax", amount: 22.25, percentage: 25.4, color: "#6366f1" }
    ],
    aiInsights: [
      "Receipt processed with 96% OCR confidence",
      "Categorized as weekly grocery shopping",
      "Amount is 15.7% above your monthly average",
      "Found 3 price optimization opportunities",
      "Spending pattern aligns with your budget goals"
    ],
    priceComparison: [
      { item: "Organic Bananas", you: 6.49, best: 4.99, savings: 1.50 },
      { item: "Greek Yogurt", you: 8.99, best: 7.49, savings: 1.50 }
    ],
    merchantInfo: {
      name: "Whole Foods Market",
      address: "2500 Pearl Street, Boulder, CO 80304",
      phone: "(303) 545-9900"
    }
  };

  useEffect(() => {
    console.log('ReceiptAnalysisPanel useEffect triggered:', { open, receiptId });
    
    if (!open || !receiptId) {
      console.log('Panel not opened or no receiptId, skipping analysis load');
      return;
    }
    
    console.log('Starting analysis for receiptId:', receiptId);
    setLoading(true);
    
    setTimeout(() => {
      console.log('Mock data loaded for analysis');
      setAnalysis(mockData);
      setLoading(false);
    }, 800);
  }, [open, receiptId]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:w-[600px] lg:w-[800px] max-w-[90vw] overflow-y-auto">
        <SheetHeader className="pb-6 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <FileText className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <SheetTitle className="text-lg font-semibold">Receipt Analysis</SheetTitle>
                <p className="text-sm text-gray-500">AI-powered spending insights</p>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </SheetHeader>

        <div className="py-6 space-y-8">
          {loading ? (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <Skeleton className="h-24" />
                <Skeleton className="h-24" />
              </div>
              <Skeleton className="h-64" />
              <Skeleton className="h-48" />
            </div>
          ) : analysis ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="border-l-4 border-l-green-500">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="p-2 bg-green-100 rounded-lg">
                        <DollarSign className="h-5 w-5 text-green-600" />
                      </div>
                      <Badge variant="secondary" className="text-green-700 bg-green-50">
                        {analysis.confidence}% confident
                      </Badge>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-gray-600">Total Amount</p>
                      <p className="text-3xl font-bold text-green-600">
                        ${analysis.total.toFixed(2)}
                      </p>
                      <p className="text-sm text-gray-500">
                        {analysis.merchant}  {analysis.time}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-l-4 border-l-blue-500">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <TrendingUp className="h-5 w-5 text-blue-600" />
                      </div>
                      <Badge variant="secondary" className="text-blue-700 bg-blue-50">
                        Weekly Pattern
                      </Badge>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-gray-600">Spending Trend</p>
                      <p className="text-2xl font-bold text-blue-600">
                        {analysis.categoryTrend}
                      </p>
                      <p className="text-sm text-gray-500">
                        Compared to your usual grocery spending
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Separator className="my-8" />

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <PieChartIcon className="h-5 w-5 text-purple-600" />
                    Purchase Breakdown
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {analysis.categoryBreakdown.map((category: any, idx: number) => (
                      <div key={idx} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div 
                            className="w-4 h-4 rounded-full"
                            style={{ backgroundColor: category.color }}
                          />
                          <span className="font-medium">{category.category}</span>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">${category.amount.toFixed(2)}</p>
                          <p className="text-sm text-gray-500">{category.percentage}%</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Target className="h-5 w-5 text-orange-600" />
                    Price Opportunities
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {analysis.priceComparison.map((item: any, idx: number) => (
                      <div key={idx} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                        <div className="flex justify-between items-start mb-3">
                          <h4 className="font-medium text-gray-900">{item.item}</h4>
                          <Badge variant="secondary" className="text-green-700 bg-green-50">
                            Save ${item.savings.toFixed(2)}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-3 gap-4 text-center">
                          <div className="space-y-1">
                            <p className="text-xs text-gray-500">You Paid</p>
                            <p className="text-lg font-semibold text-red-600">${item.you.toFixed(2)}</p>
                          </div>
                          <div className="space-y-1">
                            <p className="text-xs text-gray-500">Best Price</p>
                            <p className="text-lg font-semibold text-green-600">${item.best.toFixed(2)}</p>
                          </div>
                          <div className="space-y-1">
                            <p className="text-xs text-gray-500">Potential Savings</p>
                            <p className="text-lg font-semibold text-blue-600">${item.savings.toFixed(2)}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
                      <p className="text-sm text-blue-800">
                         <strong>Total potential savings:</strong> $3.00 on this receipt
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Tabs defaultValue="insights" className="w-full">
                <TabsList className="grid w-full grid-cols-3 mb-6">
                  <TabsTrigger value="insights">AI Insights</TabsTrigger>
                  <TabsTrigger value="items">Item Details</TabsTrigger>
                  <TabsTrigger value="merchant">Store Info</TabsTrigger>
                </TabsList>
                
                <TabsContent value="insights">
                  <Card>
                    <CardContent className="p-6">
                      <div className="space-y-4">
                        {analysis.aiInsights.map((insight: string, idx: number) => (
                          <div key={idx} className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg border-l-4 border-l-blue-500">
                            <div className="p-1 bg-blue-100 rounded-full mt-0.5">
                              <Zap className="h-3 w-3 text-blue-600" />
                            </div>
                            <p className="text-sm text-blue-900">{insight}</p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
                
                <TabsContent value="items">
                  <Card>
                    <CardContent className="p-6">
                      <div className="space-y-3">
                        {analysis.items.map((item: any, idx: number) => (
                          <div key={idx} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                            <div>
                              <p className="font-medium">{item.name}</p>
                              <p className="text-sm text-gray-500">{item.category}</p>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold">${item.price.toFixed(2)}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
                
                <TabsContent value="merchant">
                  <Card>
                    <CardContent className="p-6">
                      <div className="space-y-4">
                        <div className="flex items-start gap-3">
                          <Building className="h-5 w-5 text-gray-600 mt-1" />
                          <div>
                            <p className="font-medium">{analysis.merchantInfo.name}</p>
                            <p className="text-sm text-gray-500">{analysis.merchantInfo.address}</p>
                            <p className="text-sm text-gray-500">{analysis.merchantInfo.phone}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 pt-2">
                          <Badge variant="outline">Grocery Store</Badge>
                          <Badge variant="outline">Organic Products</Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>

              <div className="flex flex-wrap gap-3 pt-6 border-t">
                <Button className="bg-green-600 hover:bg-green-700">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Accept Analysis
                </Button>
                <Button variant="outline">
                  <Edit3 className="h-4 w-4 mr-2" />
                  Edit Details
                </Button>
                <Button variant="outline">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Retrain AI
                </Button>
                <Button variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Export Data
                </Button>
              </div>
            </>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">No analysis data available</p>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

export default ReceiptAnalysisPanel;
