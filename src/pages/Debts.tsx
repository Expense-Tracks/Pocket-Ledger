import { useState } from 'react';
import { format } from 'date-fns';
import { Plus, User, Calendar, CheckCircle2, Clock, HandCoins, Trash2 } from 'lucide-react';
import { useFinance } from '@/contexts/FinanceContext';
import { useSettings } from '@/contexts/SettingsContext';
import { Debt } from '@/types/finance';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AddDebtDialog } from '@/components/AddDebtDialog';
import { EditDebtDialog } from '@/components/EditDebtDialog';
import DynamicFontSizeText from '@/components/DynamicFontSizeText';

export default function Debts() {
  const { debts } = useFinance();
  const { formatCurrency } = useSettings();
  const [addOpen, setAddOpen] = useState(false);
  const [editDebt, setEditDebt] = useState<Debt | null>(null);
  const [filterType, setFilterType] = useState<'all' | 'owed-to-me' | 'i-owe'>('all');

  const owedToMe = debts.filter(d => d.type === 'owed-to-me');
  const iOwe = debts.filter(d => d.type === 'i-owe');

  const totalOwedToMe = owedToMe.filter(d => d.status === 'pending').reduce((s, d) => s + d.amount, 0);
  const totalIOwe = iOwe.filter(d => d.status === 'pending').reduce((s, d) => s + d.amount, 0);

  const filteredDebts = debts.filter(debt => {
    if (filterType === 'all') return true;
    return debt.type === filterType;
  });

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="mx-auto max-w-lg px-4 pt-6">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Debts</h1>
          <Button onClick={() => setAddOpen(true)} size="sm" variant="outline">
            <Plus className="mr-1 h-4 w-4" /> Add Debt
          </Button>
        </div>

        <div className="mb-6 grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-card p-4 min-w-0">
            <p className="text-sm text-muted-foreground truncate">Owed to Me</p>
            <DynamicFontSizeText
              text={formatCurrency(totalOwedToMe)}
              initialFontSizeClass="text-xl"
              className="mt-1 font-bold text-income"
            />
          </div>
          <div className="rounded-2xl bg-card p-4 min-w-0">
            <p className="text-sm text-muted-foreground truncate">I Owe</p>
            <DynamicFontSizeText
              text={formatCurrency(totalIOwe)}
              initialFontSizeClass="text-xl"
              className="mt-1 font-bold text-expense"
            />
          </div >
        </div >

        <div className="mb-4 flex gap-2 rounded-xl bg-secondary p-1">
          <button
            type="button"
            onClick={() => setFilterType('all')}
            className={`flex-1 rounded-lg py-2 text-sm font-semibold ${filterType === 'all' ? 'bg-card shadow-sm' : 'text-muted-foreground'}`}
          >
            All ({debts.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterType('owed-to-me')}
            className={`flex-1 rounded-lg py-2 text-sm font-semibold ${filterType === 'owed-to-me' ? 'bg-card shadow-sm' : 'text-muted-foreground'}`}
          >
            Owed to Me ({owedToMe.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterType('i-owe')}
            className={`flex-1 rounded-lg py-2 text-sm font-semibold ${filterType === 'i-owe' ? 'bg-card shadow-sm' : 'text-muted-foreground'}`}
          >
            I Owe ({iOwe.length})
          </button>
        </div >

        {filteredDebts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <HandCoins className="mb-3 h-12 w-12 opacity-50" />
            <p className="text-lg font-medium">No debts tracked yet</p>
            <p className="text-sm">Track money you owe or are owed</p>
          </div >
        ) : (
          <div className="space-y-3">
            {filteredDebts.map(debt => (
              <div key={debt.id} className="rounded-2xl bg-card p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="font-semibold">{debt.person}</span>
                      <Badge variant={debt.type === 'owed-to-me' ? 'default' : 'secondary'}>
                        {debt.type === 'owed-to-me' ? 'Owed to Me' : 'I Owe'}
                      </Badge>
                    </div >
                    {debt.description && (
                      <p className="text-sm text-muted-foreground mb-2">{debt.description}</p>
                    )}
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      {debt.dueDate && (
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          <span>{format(new Date(debt.dueDate), 'MMM d, yyyy')}</span>
                        </div >
                      )}
                      <div className="flex items-center gap-1">
                        {debt.status === 'paid' ? (
                          <>
                            <CheckCircle2 className="h-3 w-3 text-green-600" />
                            <span className="text-green-600">Paid</span>
                          </>
                        ) : (
                          <>
                            <Clock className="h-3 w-3" />
                            <span>Pending</span>
                          </>
                        )}
                      </div >
                    </div >
                  </div >
                  <div className="flex items-center gap-2">
                    <div className="text-right shrink-0 min-w-0 flex-1">
                      <DynamicFontSizeText
                        text={formatCurrency(debt.amount)}
                        className={`font-bold ${debt.type === 'owed-to-me' ? 'text-income' : 'text-expense'}`}
                      />
                    </div >
                    <button onClick={() => setEditDebt(debt)} className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors shrink-0">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div >
                </div >
              </div >
            ))}
          </div >
        )}
      </div>

      <AddDebtDialog open={addOpen} onOpenChange={setAddOpen} />
      {editDebt && <EditDebtDialog debt={editDebt} open={!!editDebt} onOpenChange={(open) => !open && setEditDebt(null)} />}
    </div>
  );
}
