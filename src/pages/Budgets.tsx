import { useState } from 'react';
import { toast } from 'sonner';
import { useFinance } from '@/contexts/FinanceContext';
import { useSettings } from '@/contexts/SettingsContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AmountInput } from '@/components/AmountInput';
import { Plus, Trash2 } from 'lucide-react';

export default function Budgets() {
  const { budgets, budgetsWithSpent, categories, addBudget, deleteBudget } = useFinance();
  const { formatCurrency } = useSettings();
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState('');
  const [amount, setAmount] = useState('');
  const [period, setPeriod] = useState<'weekly' | 'monthly' | 'yearly'>('monthly');

  const expenseCategories = categories.filter(c => c.type === 'expense');

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }
    if (!category) {
      toast.error('Please select a category');
      return;
    }
    addBudget({ category, amount: parsedAmount, period });
    setOpen(false);
    setAmount('');
    setCategory('');
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="mx-auto max-w-lg px-4 pt-6">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Budgets</h1>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline">
                <Plus className="mr-1 h-4 w-4" /> Add Budget
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-[calc(100vw-2rem)] rounded-2xl sm:max-w-md">
              <DialogHeader>
                <DialogTitle>New Budget</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleAdd} className="space-y-4">
                <div>
                  <Label>Category</Label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger className="mt-1"><SelectValue placeholder="Select category" /></SelectTrigger>
                    <SelectContent>
                      {expenseCategories.map(c => (
                        <SelectItem key={c.id} value={c.id}>{c.icon} {c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Budget Amount</Label>
                  <AmountInput value={amount} onChange={setAmount} className="mt-1" placeholder="0.00" />
                </div>
                <div>
                  <Label>Period</Label>
                  <Select value={period} onValueChange={v => setPeriod(v as any)}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="yearly">Yearly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button type="submit" className="w-full">Create Budget</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {budgets.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <p className="text-lg font-medium">No budgets set</p>
            <p className="text-sm">Create a budget to track your spending</p>
          </div>
        ) : (
          <div className="space-y-3">
            {budgetsWithSpent.map(b => {
              const cat = categories.find(c => c.id === b.category);
              const pct = b.amount > 0 ? Math.min((b.spent / b.amount) * 100, 100) : 0;
              const isWarning = pct >= 80;
              const isOver = pct >= 100;
              return (
                <div key={b.id} className="rounded-2xl bg-card p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{cat?.icon}</span>
                      <div>
                        <p className="font-semibold">{cat?.name || b.category}</p>
                        <p className="text-xs text-muted-foreground capitalize">{b.period}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-right">
                        <p className="text-sm font-bold">{formatCurrency(b.spent)}</p>
                        <p className="text-xs text-muted-foreground">of {formatCurrency(b.amount)}</p>
                      </div>
                      <button onClick={() => deleteBudget(b.id)} className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-secondary">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isOver ? 'bg-expense' : isWarning ? 'bg-warning' : 'bg-primary'
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <div className="mt-1 flex justify-between text-xs text-muted-foreground">
                    <span>{pct.toFixed(0)}% used</span>
                    {isOver && <span className="font-semibold text-expense">Over budget!</span>}
                    {isWarning && !isOver && <span className="font-semibold text-warning">Almost there</span>}
                    {!isWarning && <span>{formatCurrency(b.amount - b.spent)} remaining</span>}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
