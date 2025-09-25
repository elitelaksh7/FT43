import AICategorizationEngine from '../AICategorizationEngine';

export default function AICategorizationEngineExample() {
  // TODO: remove mock functionality
  const mockTransactions = [
    {
      id: '1',
      description: 'Coffee and pastry purchase',
      amount: 12.50,
      merchant: 'Starbucks',
      suggestedCategory: 'Food & Dining',
      confidence: 0.95,
      alternativeCategories: ['Entertainment', 'Personal Care']
    },
    {
      id: '2', 
      description: 'Gas station fuel purchase',
      amount: 45.80,
      merchant: 'Shell Gas Station',
      suggestedCategory: 'Transportation',
      confidence: 0.88,
      alternativeCategories: ['Business', 'Travel']
    },
    {
      id: '3',
      description: 'Electronics store purchase',
      amount: 299.99,
      merchant: 'Best Buy',
      suggestedCategory: 'Shopping',
      confidence: 0.72,
      alternativeCategories: ['Business', 'Education', 'Entertainment']
    }
  ];

  const handleCategoryConfirmed = (transactionId: string, category: string) => {
    console.log(`Category confirmed: ${transactionId} -> ${category}`);
  };

  return (
    <AICategorizationEngine
      transactions={mockTransactions}
      onCategoryConfirmed={handleCategoryConfirmed}
    />
  );
}