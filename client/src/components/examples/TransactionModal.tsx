import { useState } from 'react';
import TransactionModal from '../TransactionModal';
import { Button } from "@/components/ui/button";

export default function TransactionModalExample() {
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<'add' | 'edit'>('add');

  const handleSave = (transaction: any) => {
    console.log('Transaction saved:', transaction);
  };

  // TODO: remove mock functionality
  const mockTransaction = {
    id: '1',
    description: 'Coffee and pastry',
    amount: 12.50,
    category: 'Food & Dining',
    date: new Date(),
    merchant: 'Starbucks',
    type: 'debit' as const,
    notes: 'Morning coffee before work'
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Button 
          onClick={() => { setMode('add'); setIsOpen(true); }}
          data-testid="button-add-transaction"
        >
          Add Transaction
        </Button>
        <Button 
          variant="outline" 
          onClick={() => { setMode('edit'); setIsOpen(true); }}
          data-testid="button-edit-transaction"
        >
          Edit Transaction
        </Button>
      </div>
      
      <TransactionModal
        transaction={mode === 'edit' ? mockTransaction : undefined}
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onSave={handleSave}
        mode={mode}
      />
    </div>
  );
}