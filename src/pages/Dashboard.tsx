import { useFinance } from '@/contexts/FinanceContext';
import { useSettings } from '@/contexts/SettingsContext';
import { TransactionList } from '@/components/TransactionList';
import { TrendingUp, TrendingDown, Wallet } from 'lucide-react';

export default function Dashboard() {
  const { transactions, getBalance } = useFinance();
  const { formatCurrency } = useSettings();
  const { income, expense, net } = getBalance();
  const recentTransactions = [...transactions]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="mx-auto max-w-lg px-4 pt-6">
        {/* Header */}
        <div className="mb-6">
          <p className="text-sm text-muted-foreground">Total Balance</p>
          <h1 className="text-4xl font-bold tracking-tight">
            {formatCurrency(net)}
          </h1>
        </div>

        {/* Stats */}
        <div className="mb-6 grid grid-cols-2 gap-3">
          <div className="stat-card rounded-2xl bg-income/10">
            <div className="flex items-center gap-2 text-income">
              <TrendingUp className="h-4 w-4" />
              <span className="text-xs font-semibold uppercase tracking-wider">Income</span>
            </div>
            <p className="mt-1 text-xl font-bold text-income">{formatCurrency(income)}</p>
          </div>
          <div className="stat-card rounded-2xl bg-expense/10">
            <div className="flex items-center gap-2 text-expense">
              <TrendingDown className="h-4 w-4" />
              <span className="text-xs font-semibold uppercase tracking-wider">Expenses</span>
            </div>
            <p className="mt-1 text-xl font-bold text-expense">{formatCurrency(expense)}</p>
          </div>
        </div>

        {/* Quick budget overview */}
        <BudgetSummary />

        {/* Recent transactions */}
        <div className="mt-6">
          <h2 className="mb-3 text-lg font-semibold">Recent Transactions</h2>
          <TransactionList transactions={recentTransactions} />
        </div>
      </div>
    </div>
  );
}

function BudgetSummary() {
  const { budgets, categories } = useFinance();
  const { formatCurrency } = useSettings();
  if (budgets.length === 0) return null;

  return (
    <div>
      <h2 className="mb-3 text-lg font-semibold">Budget Overview</h2>
      <div className="space-y-2">
        {budgets.slice(0, 3).map(b => {
          const cat = categories.find(c => c.id === b.category);
          const pct = b.amount > 0 ? Math.min((b.spent / b.amount) * 100, 100) : 0;
          const isWarning = pct >= 80;
          const isOver = pct >= 100;
          return (
            <div key={b.id} className="rounded-xl bg-card p-3">
              <div className="flex justify-between text-sm">
                <span className="font-medium">{cat?.icon} {cat?.name || b.category}</span>
                <span className="text-muted-foreground">{formatCurrency(b.spent)} / {formatCurrency(b.amount)}</span>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-secondary">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    isOver ? 'bg-expense' : isWarning ? 'bg-warning' : 'bg-primary'
                  }`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
