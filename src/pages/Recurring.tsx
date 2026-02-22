import { useState } from 'react';
import { toast } from 'sonner';
import { useFinance } from '@/contexts/FinanceContext';
import { useSettings } from '@/contexts/SettingsContext';
import { TransactionType, RecurringTransaction } from '@/types/finance';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { DatePicker } from '@/components/DatePicker';
import { Plus, Trash2, Pause, Play } from 'lucide-react';

const FREQUENCY_LABELS: Record<RecurringTransaction['frequency'], string> = {
  daily: 'Daily',
  weekly: 'Weekly',
  monthly: 'Monthly',
  yearly: 'Yearly',
};

export default function Recurring() {
  const { recurringTransactions, categories, paymentMethods, addRecurring, updateRecurring, deleteRecurring } = useFinance();
  const { formatCurrency } = useSettings();
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<TransactionType>('expense');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [description, setDescription] = useState('');
  const [frequency, setFrequency] = useState<RecurringTransaction['frequency']>('monthly');
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [hasEndDate, setHasEndDate] = useState(false);
  const [endDate, setEndDate] = useState<Date>(new Date());

  const filteredCategories = categories.filter(c => c.type === type);

  const resetForm = () => {
    setAmount('');
    setCategory('');
    setDescription('');
    setFrequency('monthly');
    setStartDate(new Date());
    setHasEndDate(false);
    setType('expense');
    setPaymentMethod('cash');
  };

  const handleAdd = (e: React.FormEvent) => {
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
    addRecurring({
      amount: parsedAmount,
      type,
      category: category || filteredCategories[0]?.id || 'uncategorized',
      paymentMethod,
      description,
      frequency,
      startDate: startDate.toISOString(),
      endDate: hasEndDate ? endDate.toISOString() : undefined,
      active: true,
    });
    setOpen(false);
    resetForm();
  };

  const active = recurringTransactions.filter(r => r.active);
  const inactive = recurringTransactions.filter(r => !r.active);

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="mx-auto max-w-lg px-4 pt-6">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Recurring</h1>
          <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm(); }}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline">
                <Plus className="mr-1 h-4 w-4" /> Add
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-[calc(100vw-2rem)] rounded-2xl sm:max-w-md max-h-[85vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>New Recurring Transaction</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleAdd} className="space-y-4">
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
                  <Label htmlFor="rec-amount">Amount</Label>
                  <Input
                    id="rec-amount"
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
                      <SelectTrigger className="mt-1"><SelectValue placeholder="Select..." /></SelectTrigger>
                      <SelectContent>
                        {filteredCategories.map(c => (
                          <SelectItem key={c.id} value={c.id}>{c.icon} {c.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Payment</Label>
                    <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                      <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {paymentMethods.map(p => (
                          <SelectItem key={p.id} value={p.id}>{p.icon} {p.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="rec-desc">Description</Label>
                  <Input
                    id="rec-desc"
                    placeholder="e.g. Netflix, Rent, Salary"
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    className="mt-1"
                    maxLength={200}
                  />
                </div>

                <div>
                  <Label>Frequency</Label>
                  <Select value={frequency} onValueChange={v => setFrequency(v as RecurringTransaction['frequency'])}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="yearly">Yearly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <DatePicker date={startDate} onDateChange={setStartDate} label="Start Date" placeholder="Select start date" />

                <div className="flex items-center justify-between">
                  <Label htmlFor="has-end">Set end date</Label>
                  <Switch id="has-end" checked={hasEndDate} onCheckedChange={setHasEndDate} />
                </div>
                {hasEndDate && (
                  <DatePicker date={endDate} onDateChange={setEndDate} label="End Date" placeholder="Select end date" />
                )}

                <Button type="submit" className="w-full" size="lg">
                  Create Recurring {type === 'expense' ? 'Expense' : 'Income'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {recurringTransactions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <p className="text-lg font-medium">No recurring transactions</p>
            <p className="text-sm">Set up rent, subscriptions, salary, and more</p>
          </div>
        ) : (
          <div className="space-y-6">
            {active.length > 0 && (
              <div className="space-y-3">
                <p className="text-sm font-medium text-muted-foreground">Active ({active.length})</p>
                {active.map(r => <RecurringCard key={r.id} item={r} categories={categories} formatCurrency={formatCurrency} onToggle={() => updateRecurring(r.id, { active: false })} onDelete={() => deleteRecurring(r.id)} />)}
              </div>
            )}
            {inactive.length > 0 && (
              <div className="space-y-3">
                <p className="text-sm font-medium text-muted-foreground">Paused ({inactive.length})</p>
                {inactive.map(r => <RecurringCard key={r.id} item={r} categories={categories} formatCurrency={formatCurrency} onToggle={() => updateRecurring(r.id, { active: true })} onDelete={() => deleteRecurring(r.id)} />)}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function RecurringCard({ item, categories, formatCurrency, onToggle, onDelete }: {
  item: RecurringTransaction;
  categories: { id: string; name: string; icon: string }[];
  formatCurrency: (n: number) => string;
  onToggle: () => void;
  onDelete: () => void;
}) {
  const cat = categories.find(c => c.id === item.category);
  return (
    <div className={`rounded-2xl bg-card p-4 ${!item.active ? 'opacity-60' : ''}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <span className="text-xl shrink-0">{cat?.icon || '📋'}</span>
          <div className="min-w-0">
            <p className="font-semibold truncate">{item.description || cat?.name || 'Untitled'}</p>
            <p className="text-xs text-muted-foreground capitalize">{FREQUENCY_LABELS[item.frequency]}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className={`text-sm font-bold ${item.type === 'income' ? 'text-income' : 'text-expense'}`}>
            {item.type === 'income' ? '+' : '-'}{formatCurrency(item.amount)}
          </span>
          <button onClick={onToggle} className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors" aria-label={item.active ? 'Pause' : 'Resume'}>
            {item.active ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </button>
          <button onClick={onDelete} className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors" aria-label="Delete">
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
