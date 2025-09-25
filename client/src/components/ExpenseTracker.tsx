import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, ChevronRight, RotateCcw, ReceiptText, Plus, X, Move } from 'lucide-react';

interface Bill {
  id: string;
  merchant: string;
  amount: number;
  date: string;
  description: string;
  category?: string;
  confidence?: number;
}

interface CategorySummary {
  category: string;
  totalAmount: number;
  billCount: number;
  bills: Bill[];
}

const ExpenseTracker: React.FC = () => {
  const [bills, setBills] = useState<Bill[]>([]);
  const [categorizedExpenses, setCategorizedExpenses] = useState<CategorySummary[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [customCategories, setCustomCategories] = useState<string[]>([]);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [selectedTransactions, setSelectedTransactions] = useState<Set<string>>(new Set());
  const [showMoveToCategory, setShowMoveToCategory] = useState(false);

  const API_BASE = '/api';

  // Generate realistic mock bills
  const generateMockBills = (): Bill[] => {
    const mockBills: Bill[] = [
      // Food & Dining
      { id: '1', merchant: 'McDonald\'s', amount: 450, date: '2024-09-20', description: 'Lunch - Big Mac Meal' },
      { id: '2', merchant: 'Zomato', amount: 680, date: '2024-09-19', description: 'Dinner delivery from Pizza Hut' },
      { id: '3', merchant: 'Starbucks', amount: 320, date: '2024-09-18', description: 'Venti Caramel Latte' },
      { id: '4', merchant: 'KFC', amount: 520, date: '2024-09-17', description: 'Family bucket meal' },
      { id: '5', merchant: 'Swiggy', amount: 750, date: '2024-09-16', description: 'Indian dinner from Biryani House' },
      { id: '6', merchant: 'Dunkin Donuts', amount: 180, date: '2024-09-15', description: 'Coffee and donut' },
      { id: '7', merchant: 'Dominos Pizza', amount: 890, date: '2024-09-14', description: 'Large pizza order' },

      // Shopping & Retail
      { id: '8', merchant: 'Amazon', amount: 2499, date: '2024-09-13', description: 'Electronics and books' },
      { id: '9', merchant: 'Flipkart', amount: 1850, date: '2024-09-12', description: 'Home appliances' },
      { id: '10', merchant: 'Reliance Trends', amount: 3200, date: '2024-09-11', description: 'Clothing shopping' },
      { id: '11', merchant: 'Shoppers Stop', amount: 4500, date: '2024-09-10', description: 'Formal wear and accessories' },
      { id: '12', merchant: 'Lifestyle Store', amount: 2800, date: '2024-09-09', description: 'Casual clothing' },
      { id: '13', merchant: 'Max Fashion', amount: 1650, date: '2024-09-08', description: 'Kids clothing' },

      // Clothes & Fashion
      { id: '14', merchant: 'Nike Store', amount: 8999, date: '2024-09-07', description: 'Air Max sneakers' },
      { id: '15', merchant: 'H&M', amount: 2499, date: '2024-09-06', description: 'Casual shirt and jeans' },
      { id: '16', merchant: 'Adidas Outlet', amount: 4500, date: '2024-09-05', description: 'Running shoes' },
      { id: '17', merchant: 'Myntra', amount: 1899, date: '2024-09-04', description: 'Formal wear' },
      { id: '18', merchant: 'Zara', amount: 3500, date: '2024-09-03', description: 'Designer jacket' },
      { id: '19', merchant: 'Puma Store', amount: 2200, date: '2024-09-02', description: 'Sports wear' },

      // Entertainment & Subscriptions
      { id: '20', merchant: 'Netflix', amount: 799, date: '2024-09-01', description: 'Monthly subscription - Premium' },
      { id: '21', merchant: 'BookMyShow', amount: 480, date: '2024-08-31', description: 'Movie tickets - 2 adults' },
      { id: '22', merchant: 'Spotify', amount: 119, date: '2024-08-30', description: 'Premium subscription' },
      { id: '23', merchant: 'PlayStation Store', amount: 3999, date: '2024-08-29', description: 'FIFA 25 game' },
      { id: '24', merchant: 'Disney+ Hotstar', amount: 399, date: '2024-08-28', description: 'Annual subscription' },
      { id: '25', merchant: 'PVR Cinemas', amount: 650, date: '2024-08-27', description: 'IMAX movie experience' },

      // Transportation & Travelling
      { id: '26', merchant: 'Uber', amount: 280, date: '2024-08-26', description: 'Office to home ride' },
      { id: '27', merchant: 'Ola Cab', amount: 150, date: '2024-08-25', description: 'Short city ride' },
      { id: '28', merchant: 'Indian Railways', amount: 1850, date: '2024-08-24', description: 'Train ticket - Delhi to Mumbai' },
      { id: '29', merchant: 'IndiGo Airlines', amount: 8500, date: '2024-08-23', description: 'Domestic flight booking' },
      { id: '30', merchant: 'Shell Petrol', amount: 3500, date: '2024-08-22', description: 'Full tank fuel' },
      { id: '31', merchant: 'Metro Card', amount: 200, date: '2024-08-21', description: 'Metro card recharge' },
      { id: '32', merchant: 'Rapido', amount: 45, date: '2024-08-20', description: 'Bike taxi ride' },

      // Bills & Utilities
      { id: '33', merchant: 'Jio Recharge', amount: 599, date: '2024-08-19', description: 'Monthly mobile plan' },
      { id: '34', merchant: 'Electricity Bill', amount: 2400, date: '2024-08-18', description: 'Monthly electricity - August' },
      { id: '35', merchant: 'Airtel DTH', amount: 350, date: '2024-08-17', description: 'DTH recharge' },
      { id: '36', merchant: 'Gas Cylinder', amount: 850, date: '2024-08-16', description: 'LPG cylinder refill' },
      { id: '37', merchant: 'Water Bill', amount: 450, date: '2024-08-15', description: 'Municipal water bill' },
      { id: '38', merchant: 'Broadband Bill', amount: 999, date: '2024-08-14', description: 'Internet connection' },

      // Health & Pharmacy
      { id: '39', merchant: 'Apollo Pharmacy', amount: 850, date: '2024-08-13', description: 'Medicines and supplements' },
      { id: '40', merchant: '1mg', amount: 320, date: '2024-08-12', description: 'Online medicine order' },
      { id: '41', merchant: 'Max Hospital', amount: 2500, date: '2024-08-11', description: 'Doctor consultation' },
      { id: '42', merchant: 'PharmEasy', amount: 480, date: '2024-08-10', description: 'Health supplements' },

      // Groceries
      { id: '43', merchant: 'BigBasket', amount: 2800, date: '2024-08-09', description: 'Monthly grocery shopping' },
      { id: '44', merchant: 'Blinkit', amount: 450, date: '2024-08-08', description: 'Quick grocery delivery' },
      { id: '45', merchant: 'DMart', amount: 1950, date: '2024-08-07', description: 'Household items and snacks' },
      { id: '46', merchant: 'Grofers', amount: 680, date: '2024-08-06', description: 'Fresh vegetables and fruits' },

      // Technology & Electronics
      { id: '47', merchant: 'Apple Store', amount: 8900, date: '2024-08-05', description: 'AirPods Pro' },
      { id: '48', merchant: 'Croma', amount: 15999, date: '2024-08-04', description: 'Bluetooth headphones' },
      { id: '49', merchant: 'Reliance Digital', amount: 12500, date: '2024-08-03', description: 'Smartphone accessories' },

      // Education & Learning
      { id: '50', merchant: 'Coursera', amount: 3999, date: '2024-08-02', description: 'Professional certificate course' },
      { id: '51', merchant: 'Udemy', amount: 1299, date: '2024-08-01', description: 'Programming course' },
      { id: '52', merchant: 'Byju\'s', amount: 2500, date: '2024-07-31', description: 'Online tutoring subscription' },

      // Fitness & Sports
      { id: '53', merchant: 'Gold\'s Gym', amount: 5000, date: '2024-07-30', description: 'Monthly gym membership' },
      { id: '54', merchant: 'Cult.fit', amount: 2499, date: '2024-07-29', description: 'Fitness classes subscription' },
      { id: '55', merchant: 'Decathlon', amount: 3500, date: '2024-07-28', description: 'Sports equipment' },

      // Beauty & Personal Care
      { id: '56', merchant: 'Nykaa', amount: 1850, date: '2024-07-27', description: 'Skincare products' },
      { id: '57', merchant: 'Lakme Salon', amount: 1200, date: '2024-07-26', description: 'Hair cut and styling' },

      // Investment & Finance
      { id: '58', merchant: 'SIP Investment', amount: 10000, date: '2024-07-25', description: 'Monthly SIP - Mutual funds' },
      { id: '59', merchant: 'Stock Purchase', amount: 15000, date: '2024-07-24', description: 'Equity investment' },

      // Insurance
      { id: '60', merchant: 'Life Insurance', amount: 5000, date: '2024-07-23', description: 'Monthly premium' }
    ];

    return mockBills;
  };

  // Categorize bills using AI
  const categorizeBills = async (bills: Bill[]): Promise<Bill[]> => {
    setIsLoading(true);
    const categorizedBills: Bill[] = [];
    let processed = 0;

    for (const bill of bills) {
      try {
        const response = await fetch(`${API_BASE}/get-category/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: bill.merchant })
        });

        if (response.ok) {
          const result = await response.json();
          categorizedBills.push({
            ...bill,
            category: result.category || 'Other',
            confidence: result.confidence_score || 0
          });
        } else {
          // Fallback categorization
          categorizedBills.push({
            ...bill,
            category: 'Other',
            confidence: 0
          });
        }
      } catch (error) {
        console.error(`Failed to categorize ${bill.merchant}:`, error);
        categorizedBills.push({
          ...bill,
          category: 'Other',
          confidence: 0
        });
      }
      
      processed++;
      // Small delay to show progress (remove in production)
      if (processed % 3 === 0) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    setIsLoading(false);
    return categorizedBills;
  };

  // Group bills by category
  const groupBillsByCategory = (bills: Bill[]): CategorySummary[] => {
    const categoryMap = new Map<string, CategorySummary>();

    bills.forEach(bill => {
      const category = bill.category || 'Other';
      
      if (!categoryMap.has(category)) {
        categoryMap.set(category, {
          category,
          totalAmount: 0,
          billCount: 0,
          bills: []
        });
      }

      const categoryData = categoryMap.get(category)!;
      categoryData.totalAmount += bill.amount;
      categoryData.billCount += 1;
      categoryData.bills.push(bill);
    });

    // Sort by total amount (highest first)
    return Array.from(categoryMap.values()).sort((a, b) => b.totalAmount - a.totalAmount);
  };

  // Initialize with mock data
  useEffect(() => {
    const initializeData = async () => {
      const mockBills = generateMockBills();
      setBills(mockBills);
      
      const categorized = await categorizeBills(mockBills);
      setBills(categorized);
      
      const grouped = groupBillsByCategory(categorized);
      setCategorizedExpenses(grouped);
    };

    initializeData();
  }, []);

  // Toggle category expansion
  const toggleCategory = (category: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(category)) {
      newExpanded.delete(category);
    } else {
      newExpanded.add(category);
    }
    setExpandedCategories(newExpanded);
  };

  // Generate new bills and categorize them
  const generateBills = async () => {
    const mockBills = generateMockBills();
    setBills(mockBills);
    
    const categorized = await categorizeBills(mockBills);
    setBills(categorized);
    
    const grouped = groupBillsByCategory(categorized);
    setCategorizedExpenses(grouped);
  };

  // Add custom category
  const addCustomCategory = () => {
    if (newCategoryName.trim() && !customCategories.includes(newCategoryName.trim())) {
      setCustomCategories([...customCategories, newCategoryName.trim()]);
      setNewCategoryName('');
      setShowAddCategory(false);
    }
  };

  // Remove custom category
  const removeCustomCategory = (categoryToRemove: string) => {
    setCustomCategories(customCategories.filter(cat => cat !== categoryToRemove));
  };

  // Toggle transaction selection
  const toggleTransactionSelection = (transactionId: string) => {
    const newSelected = new Set(selectedTransactions);
    if (newSelected.has(transactionId)) {
      newSelected.delete(transactionId);
    } else {
      newSelected.add(transactionId);
    }
    setSelectedTransactions(newSelected);
  };

  // Move selected transactions to a category
  const moveTransactionsToCategory = (targetCategory: string) => {
    const updatedBills = bills.map(bill => {
      if (selectedTransactions.has(bill.id)) {
        return { ...bill, category: targetCategory };
      }
      return bill;
    });
    
    setBills(updatedBills);
    const grouped = groupBillsByCategory(updatedBills);
    setCategorizedExpenses(grouped);
    setSelectedTransactions(new Set());
    setShowMoveToCategory(false);
  };

  // Get all available categories for movement
  const getAllCategories = (): string[] => {
    const defaultCategories = ['Food', 'Shopping', 'Clothes', 'Entertainment', 'Travelling', 'Bills', 'Health', 'Groceries', 'Electronics', 'Education', 'Fitness', 'Beauty', 'Investment', 'Insurance', 'Home', 'Pets'];
    return [...defaultCategories, ...customCategories];
  };

  // Calculate total expenses
  const totalExpenses = categorizedExpenses.reduce((sum, cat) => sum + cat.totalAmount, 0);

  // Get category color
  const getCategoryColor = (category: string): string => {
    const colors: { [key: string]: string } = {
      'Food': 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900 dark:text-orange-300',
      'Shopping': 'bg-pink-100 text-pink-800 border-pink-200 dark:bg-pink-900 dark:text-pink-300',
      'Clothes': 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900 dark:text-purple-300',
      'Entertainment': 'bg-indigo-100 text-indigo-800 border-indigo-200 dark:bg-indigo-900 dark:text-indigo-300',
      'Travelling': 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900 dark:text-blue-300',
      'Bills': 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900 dark:text-red-300',
      'Health': 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900 dark:text-green-300',
      'Groceries': 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900 dark:text-yellow-300',
      'Electronics': 'bg-cyan-100 text-cyan-800 border-cyan-200 dark:bg-cyan-900 dark:text-cyan-300',
      'Education': 'bg-teal-100 text-teal-800 border-teal-200 dark:bg-teal-900 dark:text-teal-300',
      'Fitness': 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900 dark:text-emerald-300',
      'Beauty': 'bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-900 dark:text-rose-300',
      'Investment': 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900 dark:text-amber-300',
      'Insurance': 'bg-slate-100 text-slate-800 border-slate-200 dark:bg-slate-900 dark:text-slate-300',
      'Home': 'bg-lime-100 text-lime-800 border-lime-200 dark:bg-lime-900 dark:text-lime-300',
      'Pets': 'bg-violet-100 text-violet-800 border-violet-200 dark:bg-violet-900 dark:text-violet-300',
      'Other': 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900 dark:text-gray-300'
    };
    
    // For custom categories, use a rotating set of colors
    if (!colors[category] && customCategories.includes(category)) {
      const customColors = [
        'bg-fuchsia-100 text-fuchsia-800 border-fuchsia-200 dark:bg-fuchsia-900 dark:text-fuchsia-300',
        'bg-sky-100 text-sky-800 border-sky-200 dark:bg-sky-900 dark:text-sky-300',
        'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900 dark:text-emerald-300',
        'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900 dark:text-orange-300',
        'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900 dark:text-purple-300'
      ];
      const index = customCategories.indexOf(category) % customColors.length;
      return customColors[index];
    }
    
    return colors[category] || colors['Other'];
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950">
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="text-center sm:text-left">
              <CardTitle className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                💰 AI-Powered Expense Tracker
              </CardTitle>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                Smart categorization with machine learning
              </p>
            </div>
            <Button
              onClick={generateBills}
              disabled={isLoading}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold px-6 py-2"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Processing...
                </>
              ) : (
                <>
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Generate New Bills
                </>
              )}
            </Button>
          </div>
          
          <div className="text-center mt-6">
            <div className="text-4xl font-bold text-gray-900 dark:text-white">
              {formatCurrency(totalExpenses)}
            </div>
            <div className="flex justify-center items-center gap-4 mt-2">
              <p className="text-gray-600 dark:text-gray-400">
                Total Expenses ({bills.length} transactions)
              </p>
              {bills.length > 0 && (
                <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-200">
                  Last updated: {formatDate(bills[0]?.date || new Date().toISOString())}
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Loading State */}
      {isLoading && (
        <Card>
          <CardContent className="p-6 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Categorizing expenses with AI...</p>
          </CardContent>
        </Card>
      )}

      {/* Custom Categories Management & Transaction Movement */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="text-lg font-semibold">🏷️ Category Management</CardTitle>
            <div className="flex gap-2">
              {selectedTransactions.size > 0 && (
                <Button
                  onClick={() => setShowMoveToCategory(!showMoveToCategory)}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <Move className="w-4 h-4" />
                  Move {selectedTransactions.size} transaction{selectedTransactions.size > 1 ? 's' : ''}
                </Button>
              )}
              <Button
                onClick={() => setShowAddCategory(!showAddCategory)}
                size="sm"
                className="flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Category
              </Button>
            </div>
          </div>
          
          {/* Add New Category */}
          {showAddCategory && (
            <div className="mt-4 flex gap-2">
              <Input
                placeholder="Enter category name..."
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addCustomCategory()}
                className="flex-1"
              />
              <Button onClick={addCustomCategory} size="sm">
                Add
              </Button>
              <Button onClick={() => {
                setShowAddCategory(false);
                setNewCategoryName('');
              }} variant="outline" size="sm">
                Cancel
              </Button>
            </div>
          )}

          {/* Move Transactions Interface */}
          {showMoveToCategory && selectedTransactions.size > 0 && (
            <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
              <p className="text-sm text-blue-700 dark:text-blue-300 mb-3">
                Move {selectedTransactions.size} selected transaction{selectedTransactions.size > 1 ? 's' : ''} to:
              </p>
              <div className="flex gap-2">
                <Select onValueChange={moveTransactionsToCategory}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {getAllCategories().map(category => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button onClick={() => {
                  setShowMoveToCategory(false);
                  setSelectedTransactions(new Set());
                }} variant="outline" size="sm">
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {/* Custom Categories Display */}
          {customCategories.length > 0 && (
            <div className="mt-4">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Custom Categories:</p>
              <div className="flex flex-wrap gap-2">
                {customCategories.map(category => (
                  <Badge
                    key={category}
                    variant="secondary"
                    className={`${getCategoryColor(category)} px-3 py-1 flex items-center gap-2`}
                  >
                    {category}
                    <button
                      onClick={() => removeCustomCategory(category)}
                      className="hover:bg-black/10 rounded-full p-0.5"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardHeader>
      </Card>
              onClick={() => setShowAddCategory(!showAddCategory)}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Category
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Add Category Form */}
          {showAddCategory && (
            <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="flex gap-2">
                <Input
                  placeholder="Enter category name..."
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addCustomCategory()}
                  className="flex-1"
                />
                <Button onClick={addCustomCategory} disabled={!newCategoryName.trim()}>
                  Add
                </Button>
                <Button variant="outline" onClick={() => setShowAddCategory(false)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
          
          {/* Custom Categories Display */}
          {customCategories.length > 0 && (
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">Your Custom Categories:</p>
              <div className="flex flex-wrap gap-2">
                {customCategories.map((category) => (
                  <Badge
                    key={category}
                    variant="secondary"
                    className={`${getCategoryColor(category)} flex items-center gap-1 cursor-pointer`}
                  >
                    {category}
                    <X
                      className="w-3 h-3 hover:text-red-600"
                      onClick={() => removeCustomCategory(category)}
                    />
                  </Badge>
                ))}
              </div>
            </div>
          )}
          
          {customCategories.length === 0 && !showAddCategory && (
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
              No custom categories yet. Click "Add Category" to create your own!
            </p>
          )}
        </CardContent>
      </Card>

      {/* Category-wise Breakdown */}
      <div className="grid gap-4">
        {categorizedExpenses.map((categoryData) => (
          <Card key={categoryData.category} className="overflow-hidden">
            <Collapsible>
              <CollapsibleTrigger
                className="w-full"
                onClick={() => toggleCategory(categoryData.category)}
              >
                <CardHeader className="cursor-pointer hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {expandedCategories.has(categoryData.category) ? (
                        <ChevronDown className="h-5 w-5 text-gray-500" />
                      ) : (
                        <ChevronRight className="h-5 w-5 text-gray-500" />
                      )}
                      <Badge variant="secondary" className={`${getCategoryColor(categoryData.category)} px-3 py-1`}>
                        {categoryData.category}
                      </Badge>
                      <span className="text-sm text-gray-600">
                        {categoryData.billCount} transactions
                      </span>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-bold">
                        {formatCurrency(categoryData.totalAmount)}
                      </div>
                      <div className="text-sm text-gray-500">
                        {((categoryData.totalAmount / totalExpenses) * 100).toFixed(1)}% of total
                      </div>
                    </div>
                  </div>
                </CardHeader>
              </CollapsibleTrigger>
              
              <CollapsibleContent>
                <CardContent className="pt-0 pb-4">
                  <div className="space-y-3">
                    {categoryData.bills.map((bill) => (
                      <div
                        key={bill.id}
                        className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all duration-200"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-3">
                            <div className="flex-shrink-0">
                              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                                {bill.merchant.charAt(0).toUpperCase()}
                              </div>
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center space-x-2">
                                <span className="font-semibold text-gray-900 dark:text-white truncate">
                                  {bill.merchant}
                                </span>
                                {bill.confidence !== undefined && bill.confidence > 0.8 && (
                                  <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                                    AI: {(bill.confidence * 100).toFixed(0)}%
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                                {bill.description}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-500">
                                {formatDate(bill.date)}
                              </p>
                            </div>
                          </div>
                        </div>
                        <div className="flex-shrink-0 text-right ml-4">
                          <div className="font-bold text-lg text-gray-900 dark:text-white">
                            {formatCurrency(bill.amount)}
                          </div>
                          <div className="text-xs text-gray-500">
                            {((bill.amount / categoryData.totalAmount) * 100).toFixed(1)}% of category
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Category Total ({categoryData.billCount} transactions):
                      </span>
                      <span className="text-xl font-bold text-gray-900 dark:text-white">
                        {formatCurrency(categoryData.totalAmount)}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500 text-right mt-1">
                      {((categoryData.totalAmount / totalExpenses) * 100).toFixed(1)}% of total expenses
                    </div>
                  </div>
                </CardContent>
              </CollapsibleContent>
            </Collapsible>
          </Card>
        ))}
      </div>

      {/* Summary Stats */}
      <Card>
        <CardHeader>
          <CardTitle>📊 Expense Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{categorizedExpenses.length}</div>
              <p className="text-sm text-gray-600">Categories</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{bills.length}</div>
              <p className="text-sm text-gray-600">Transactions</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {formatCurrency(totalExpenses / bills.length)}
              </div>
              <p className="text-sm text-gray-600">Avg Transaction</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {categorizedExpenses.length > 0 ? categorizedExpenses[0].category : 'N/A'}
              </div>
              <p className="text-sm text-gray-600">Top Category</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ExpenseTracker;