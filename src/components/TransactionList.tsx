import { Transaction } from '@/types/finance';
import { useFinance } from '@/contexts/FinanceContext';
import { useSettings } from '@/contexts/SettingsContext';
import { format } from 'date-fns';
import { Trash2 } from 'lucide-react';

interface Props {
  transactions: Transaction[];
  showDelete?: boolean;
}

export function TransactionList({ transactions, showDelete = false }: Props) {
  const { categories, paymentMethods, deleteTransaction } = useFinance();
  const { formatCurrency } = useSettings();

  const getCategoryInfo = (id: string) => categories.find(c => c.id === id);
  const getPaymentInfo = (id: string) => paymentMethods.find(p => p.id === id);

  if (transactions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <p className="text-lg font-medium">No transactions yet</p>
        <p className="text-sm">Tap + to add your first one</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {transactions.map(t => {
        const cat = getCategoryInfo(t.category);
        const pm = getPaymentInfo(t.paymentMethod);
        return (
          <div
            key={t.id}
            className="flex items-center gap-3 rounded-xl bg-card p-3 transition-all hover:bg-accent"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary text-lg">
              {cat?.icon || '📋'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="truncate font-medium text-sm">{t.description || cat?.name || 'Transaction'}</p>
              <p className="text-xs text-muted-foreground">
                {cat?.name} · {pm?.name} · {format(new Date(t.date), 'MMM d')}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className={`font-semibold text-sm ${t.type === 'income' ? 'text-income' : 'text-expense'}`}>
                {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount)}
              </span>
              {showDelete && (
                <button
                  onClick={() => deleteTransaction(t.id)}
                  className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
