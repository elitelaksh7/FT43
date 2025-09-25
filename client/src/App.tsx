import { useState } from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

// Import Components
import AppHeader from "@/components/AppHeader";
import MobileNavigation from "@/components/MobileNavigation";
import ExpenseDashboard from "@/components/ExpenseDashboard";
import SMSTransactionParser from "@/components/SMSTransactionParser";
import OCRBillScanner from "@/components/OCRBillScanner";
import SimpleCameraTest from "@/components/SimpleCameraTest";
import EnhancedAICategorizationEngine from "@/components/EnhancedAICategorizationEngine";
import SimpleCategorizationTest from "@/components/SimpleCategorizationTest";
import ExpenseTrackerEnhanced from './components/ExpenseTrackerEnhanced';
import SmartPriceComparison from "@/components/SmartPriceComparison";
import IntelligentNudges from "@/components/IntelligentNudges";
import TransactionModal from "@/components/TransactionModal";

function Dashboard() {
  // TODO: remove mock functionality
  const mockExpenseData = [
    { category: 'Food & Dining', amount: 1200, color: 'hsl(var(--chart-1))', percentage: 30 },
    { category: 'Transportation', amount: 800, color: 'hsl(var(--chart-2))', percentage: 20 },
    { category: 'Shopping', amount: 600, color: 'hsl(var(--chart-3))', percentage: 15 },
    { category: 'Entertainment', amount: 400, color: 'hsl(var(--chart-4))', percentage: 10 },
    { category: 'Bills & Utilities', amount: 1000, color: 'hsl(var(--chart-5))', percentage: 25 }
  ];

  const mockMonthlyData = [
    { month: 'Jan', income: 6000, expenses: 4200, savings: 1800 },
    { month: 'Feb', income: 6200, expenses: 4100, savings: 2100 },
    { month: 'Mar', income: 6000, expenses: 4500, savings: 1500 },
    { month: 'Apr', income: 6500, expenses: 4000, savings: 2500 },
    { month: 'May', income: 6300, expenses: 4300, savings: 2000 },
    { month: 'Jun', income: 6700, expenses: 4200, savings: 2500 }
  ];

  return (
    <div className="pb-24">
      <ExpenseDashboard
        totalBalance={25750}
        monthlyIncome={6700}
        monthlyExpenses={4200}
        expenseData={mockExpenseData}
        monthlyData={mockMonthlyData}
        budgetUtilization={78}
        savingsGoal={30000}
        currentSavings={24500}
      />
      <div className="px-4 mt-6">
        <IntelligentNudges />
      </div>
      <div className="px-4 mt-6">
        <SimpleCategorizationTest />
      </div>
    </div>
  );
}

function Scanner() {
  return (
    <div className="p-4 pb-24 space-y-6">
      <SimpleCameraTest />
      <OCRBillScanner />
      <SMSTransactionParser />
    </div>
  );
}

function Categorize() {
  return (
    <div className="p-4 pb-24 space-y-6">
      <div className="grid gap-6">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-xl font-semibold mb-4">🤖 AI Categorization Test</h2>
          <SimpleCategorizationTest />
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-xl font-semibold mb-4">📊 Categorized Expenses Dashboard</h2>
          <ExpenseTrackerEnhanced />
        </div>
      </div>
    </div>
  );
}

function Compare() {
  return (
    <div className="p-4 pb-24">
      <SmartPriceComparison />
    </div>
  );
}

function Insights() {
  return (
    <div className="p-4 pb-24 space-y-6">
      <IntelligentNudges />
    </div>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/scanner" component={Scanner} />
      <Route path="/categorize" component={Categorize} />
      <Route path="/compare" component={Compare} />
      <Route path="/insights" component={Insights} />
      <Route component={Dashboard} />
    </Switch>
  );
}

function App() {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);

  const handleNavigation = (itemId: string) => {
    setCurrentPage(itemId);
    // Navigate using wouter programmatically
    const routes = {
      dashboard: '/',
      scanner: '/scanner',
      categorize: '/categorize',
      compare: '/compare',
      insights: '/insights'
    };
    const route = routes[itemId as keyof typeof routes] || '/';
    window.history.pushState({}, '', route);
  };

  const handleQuickAdd = () => {
    setIsTransactionModalOpen(true);
  };

  const handleTransactionSave = (transaction: any) => {
    console.log('New transaction added:', transaction);
    // TODO: remove mock functionality - save to storage
  };

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className="min-h-screen bg-background">
          <AppHeader 
            userName="Sarah Johnson"
            notificationCount={3}
          />
          
          <main className="min-h-[calc(100vh-4rem)]">
            <Router />
          </main>

          <MobileNavigation 
            onNavigate={handleNavigation}
            onQuickAdd={handleQuickAdd}
          />

          <TransactionModal
            isOpen={isTransactionModalOpen}
            onClose={() => setIsTransactionModalOpen(false)}
            onSave={handleTransactionSave}
            mode="add"
          />
        </div>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
