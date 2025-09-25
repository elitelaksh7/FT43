import ExpenseDashboard from '../ExpenseDashboard';

export default function ExpenseDashboardExample() {
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
  );
}