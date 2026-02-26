import { useState } from 'react';
import { toast } from 'sonner';
import { useFinance } from '@/contexts/FinanceContext';
import { TransactionType } from '@/types/finance';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DatePicker } from '@/components/DatePicker';
import { AmountInput } from '@/components/AmountInput';
import { Plus } from 'lucide-react';

export function AddTransactionDialog() {
  const { addTransaction, categories, paymentMethods } = useFinance();
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<TransactionType>('expense');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState<Date>(new Date());

  const filteredCategories = categories.filter(c => c.type === type);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }
    if (!category && filteredCategories.length > 0) {
      toast.error('Please select a category');
      return;
    }
    addTransaction({
      amount: parsedAmount,
      type,
      category: category || filteredCategories[0]?.id || 'uncategorized',
      paymentMethod,
      description,
      date: date.toISOString(),
    });
    setOpen(false);
    resetForm();
  };

  const resetForm = () => {
    setAmount('');
    setCategory('');
    setDescription('');
    setDate(new Date());
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="icon" className="fixed bottom-20 right-4 z-50 h-14 w-14 rounded-full shadow-lg" aria-label="Add transaction">
          <Plus className="h-6 w-6" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-[calc(100vw-2rem)] rounded-2xl sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Transaction</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Type toggle */}
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
            <Label htmlFor="amount">Amount</Label>
            <AmountInput
              value={amount}
              onChange={setAmount}
              className="mt-1"
              placeholder="0.00"
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
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
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
            Add {type === 'expense' ? 'Expense' : 'Income'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
