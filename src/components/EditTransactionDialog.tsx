import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useFinance } from '@/contexts/FinanceContext';
import { Transaction, TransactionType } from '@/types/finance';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DatePicker } from '@/components/DatePicker';

interface Props {
  transaction: Transaction | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditTransactionDialog({ transaction, open, onOpenChange }: Props) {
  const { updateTransaction, categories, paymentMethods } = useFinance();
  const [type, setType] = useState<TransactionType>('expense');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState<Date>(new Date());

  useEffect(() => {
    if (transaction) {
      setType(transaction.type);
      setAmount(String(transaction.amount));
      setCategory(transaction.category);
      setPaymentMethod(transaction.paymentMethod);
      setDescription(transaction.description);
      setDate(new Date(transaction.date));
    }
  }, [transaction]);

  const filteredCategories = categories.filter(c => c.type === type);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!transaction) return;
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }
    if (!category && filteredCategories.length > 0) {
      toast.error('Please select a category');
      return;
    }
    updateTransaction(transaction.id, {
      amount: parsedAmount,
      type,
      category: category || filteredCategories[0]?.id || 'uncategorized',
      paymentMethod,
      description,
      date: date.toISOString(),
    });
    toast.success('Transaction updated');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[calc(100vw-2rem)] rounded-2xl sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Transaction</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex gap-2 rounded-xl bg-secondary p-1">
            <button
              type="button"
              onClick={() => setType('expense')}
              className={`flex-1 rounded-lg py-2 text-sm font-semibold transition-all ${
                type === 'expense' ? 'bg-expense text-expense-foreground shadow-sm' : 'text-muted-foreground'
              }`}
            >
              Expense
            </button>
            <button
              type="button"
              onClick={() => setType('income')}
              className={`flex-1 rounded-lg py-2 text-sm font-semibold transition-all ${
                type === 'income' ? 'bg-income text-income-foreground shadow-sm' : 'text-muted-foreground'
              }`}
            >
              Income
            </button>
          </div>

          <div>
            <Label htmlFor="edit-amount">Amount</Label>
            <Input
              id="edit-amount"
              type="text"
              placeholder="0.00"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              className="mt-1 text-2xl font-bold"
              inputMode="decimal"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select..." />
                </SelectTrigger>
                <SelectContent>
                  {filteredCategories.map(c => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.icon} {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Payment</Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {paymentMethods.map(p => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.icon} {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="edit-description">Description</Label>
            <Input
              id="edit-description"
              placeholder="What was this for?"
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="mt-1"
              maxLength={200}
            />
          </div>

          <DatePicker
            date={date}
            onDateChange={setDate}
            label="Date"
            placeholder="Select transaction date"
          />

          <Button type="submit" className="w-full" size="lg">
            Save Changes
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
