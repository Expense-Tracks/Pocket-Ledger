import { useState } from 'react';
import { toast } from 'sonner';
import { format, differenceInDays } from 'date-fns';
import { useFinance } from '@/contexts/FinanceContext';
import { useSettings } from '@/contexts/SettingsContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { EmojiPicker } from '@/components/EmojiPicker';
import { DatePicker } from '@/components/DatePicker';
import { Plus, Trash2, PiggyBank, CalendarDays } from 'lucide-react';

export default function SavingsGoals() {
  const { savingsGoals, addSavingsGoal, deleteSavingsGoal, contributeSavingsGoal } = useFinance();
  const { formatCurrency } = useSettings();
  const [createOpen, setCreateOpen] = useState(false);
  const [contributeOpen, setContributeOpen] = useState<string | null>(null);

  // Create form state
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('🎯');
  const [targetAmount, setTargetAmount] = useState('');
  const [targetDate, setTargetDate] = useState<Date>(new Date());

  // Contribute form state
  const [contributeAmount, setContributeAmount] = useState('');

  const resetCreateForm = () => {
    setName('');
    setIcon('🎯');
    setTargetAmount('');
    setTargetDate(new Date());
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseFloat(targetAmount);
    if (!name.trim()) { toast.error('Please enter a goal name'); return; }
    if (isNaN(parsed) || parsed <= 0) { toast.error('Please enter a valid target amount'); return; }
    addSavingsGoal({ name: name.trim(), icon, targetAmount: parsed, targetDate: targetDate.toISOString() });
    resetCreateForm();
    setCreateOpen(false);
    toast.success('Savings goal created', { duration: 1000 });
  };

  const handleContribute = (goalId: string) => {
    const parsed = parseFloat(contributeAmount);
    if (isNaN(parsed) || parsed <= 0) { toast.error('Please enter a valid amount'); return; }
    contributeSavingsGoal(goalId, parsed);
    setContributeAmount('');
    setContributeOpen(null);
    toast.success('Contribution added', { duration: 1000 });
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="mx-auto max-w-lg px-4 pt-6">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Savings Goals</h1>
          <Dialog open={createOpen} onOpenChange={(v) => { setCreateOpen(v); if (!v) resetCreateForm(); }}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline">
                <Plus className="mr-1 h-4 w-4" /> Add Goal
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-[calc(100vw-2rem)] rounded-2xl sm:max-w-md">
              <DialogHeader>
                <DialogTitle>New Savings Goal</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreate} className="space-y-4">
                <div>
                  <Label>Goal Name</Label>
                  <Input value={name} onChange={e => setName(e.target.value)} className="mt-1" placeholder="e.g., Vacation fund" />
                </div>
                <EmojiPicker value={icon} onChange={setIcon} label="Icon" />
                <div>
                  <Label>Target Amount</Label>
                  <Input type="text" value={targetAmount} onChange={e => setTargetAmount(e.target.value)} className="mt-1" inputMode="decimal" placeholder="0.00" />
                </div>
                <DatePicker
                  date={targetDate}
                  onDateChange={setTargetDate}
                  label="Target Date"
                  placeholder="Select target date"
                  showShortcuts={false}
                  allowFuture
                />
                <Button type="submit" className="w-full">Create Goal</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {savingsGoals.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <PiggyBank className="mb-3 h-12 w-12 opacity-50" />
            <p className="text-lg font-medium">No savings goals yet</p>
            <p className="text-sm">Set a goal and start saving toward it</p>
          </div>
        ) : (
          <div className="space-y-3">
            {savingsGoals.map(goal => {
              const pct = goal.targetAmount > 0 ? Math.min((goal.savedAmount / goal.targetAmount) * 100, 100) : 0;
              const isComplete = pct >= 100;
              const daysLeft = differenceInDays(new Date(goal.targetDate), new Date());
              const remaining = goal.targetAmount - goal.savedAmount;

              return (
                <div key={goal.id} className="rounded-2xl bg-card p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{goal.icon}</span>
                      <div>
                        <p className="font-semibold">{goal.name}</p>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <CalendarDays className="h-3 w-3" />
                          <span>{format(new Date(goal.targetDate), 'MMM d, yyyy')}</span>
                          {daysLeft > 0 && <span>· {daysLeft}d left</span>}
                          {daysLeft <= 0 && !isComplete && <span className="text-warning font-semibold">· Overdue</span>}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Dialog open={contributeOpen === goal.id} onOpenChange={(v) => { setContributeOpen(v ? goal.id : null); if (!v) setContributeAmount(''); }}>
                        <DialogTrigger asChild>
                          <Button size="sm" variant="ghost" className="text-primary" disabled={isComplete}>
                            <Plus className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-[calc(100vw-2rem)] rounded-2xl sm:max-w-md">
                          <DialogHeader>
                            <DialogTitle>Add to "{goal.name}"</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <Label>Amount</Label>
                              <Input type="text" value={contributeAmount} onChange={e => setContributeAmount(e.target.value)} className="mt-1" inputMode="decimal" placeholder="0.00" autoFocus />
                            </div>
                            <p className="text-xs text-muted-foreground">Remaining: {formatCurrency(Math.max(remaining, 0))}</p>
                            <Button className="w-full" onClick={() => handleContribute(goal.id)}>Add Contribution</Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                      <button onClick={() => deleteSavingsGoal(goal.id)} className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-secondary">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${isComplete ? 'bg-income' : 'bg-primary'}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <div className="mt-1 flex justify-between text-xs text-muted-foreground">
                    <span>{formatCurrency(goal.savedAmount)} / {formatCurrency(goal.targetAmount)}</span>
                    {isComplete ? (
                      <span className="font-semibold text-income">Goal reached! 🎉</span>
                    ) : (
                      <span>{pct.toFixed(0)}% saved</span>
                    )}
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
