import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Receipt, Save, X } from 'lucide-react';
import { format } from 'date-fns';

interface Transaction {
  id?: string;
  description: string;
  amount: number;
  category: string;
  date: Date;
  merchant: string;
  type: 'debit' | 'credit';
  notes?: string;
  receipt?: string;
}

interface TransactionModalProps {
  transaction?: Transaction;
  isOpen: boolean;
  onClose: () => void;
  onSave: (transaction: Transaction) => void;
  mode: 'add' | 'edit';
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

export default function TransactionModal({ 
  transaction, 
  isOpen, 
  onClose, 
  onSave, 
  mode 
}: TransactionModalProps) {
  const [formData, setFormData] = useState<Transaction>(
    transaction || {
      description: '',
      amount: 0,
      category: '',
      date: new Date(),
      merchant: '',
      type: 'debit',
      notes: '',
      receipt: ''
    }
  );

  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  const handleSave = () => {
    console.log(`${mode === 'add' ? 'Adding' : 'Updating'} transaction:`, formData);
    onSave(formData);
    onClose();
  };

  const handleClose = () => {
    onClose();
    // Reset form if adding new transaction
    if (mode === 'add') {
      setFormData({
        description: '',
        amount: 0,
        category: '',
        date: new Date(),
        merchant: '',
        type: 'debit',
        notes: '',
        receipt: ''
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md" data-testid="transaction-modal">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            {mode === 'add' ? 'Add Transaction' : 'Edit Transaction'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="type">Type</Label>
              <Select 
                value={formData.type} 
                onValueChange={(value: 'debit' | 'credit') => 
                  setFormData(prev => ({ ...prev, type: value }))
                }
              >
                <SelectTrigger data-testid="select-transaction-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="debit">Expense</SelectItem>
                  <SelectItem value="credit">Income</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">Amount</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={formData.amount || ''}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  amount: parseFloat(e.target.value) || 0 
                }))}
                data-testid="input-amount"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="merchant">Merchant</Label>
            <Input
              id="merchant"
              placeholder="Store or service name"
              value={formData.merchant}
              onChange={(e) => setFormData(prev => ({ ...prev, merchant: e.target.value }))}
              data-testid="input-merchant"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              placeholder="What was purchased"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              data-testid="input-description"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select 
                value={formData.category} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
              >
                <SelectTrigger data-testid="select-category">
                  <SelectValue placeholder="Select category" />
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

            <div className="space-y-2">
              <Label>Date</Label>
              <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                    data-testid="button-date-picker"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.date ? format(formData.date, "MMM dd, yyyy") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={formData.date}
                    onSelect={(date) => {
                      if (date) {
                        setFormData(prev => ({ ...prev, date }));
                        setIsCalendarOpen(false);
                      }
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (optional)</Label>
            <Textarea
              id="notes"
              placeholder="Additional details..."
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              rows={3}
              data-testid="input-notes"
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button 
              onClick={handleSave}
              className="flex-1"
              disabled={!formData.amount || !formData.merchant || !formData.category}
              data-testid="button-save-transaction"
            >
              <Save className="h-4 w-4 mr-2" />
              {mode === 'add' ? 'Add Transaction' : 'Save Changes'}
            </Button>
            <Button 
              variant="outline" 
              onClick={handleClose}
              data-testid="button-cancel-transaction"
            >
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}