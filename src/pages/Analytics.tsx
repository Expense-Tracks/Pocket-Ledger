import { useMemo, useState } from 'react';
import { useFinance } from '@/contexts/FinanceContext';
import { useSettings } from '@/contexts/SettingsContext';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { format, startOfMonth, endOfMonth, subMonths, isWithinInterval } from 'date-fns';

const COLORS = [
  'hsl(220, 60%, 50%)', 'hsl(160, 60%, 42%)', 'hsl(4, 72%, 56%)',
  'hsl(38, 92%, 50%)', 'hsl(280, 60%, 55%)', 'hsl(190, 70%, 45%)',
  'hsl(340, 65%, 50%)', 'hsl(100, 50%, 45%)',
];

export default function Analytics() {
  const { transactions, categories } = useFinance();
  const { formatCurrency } = useSettings();
  const [months, setMonths] = useState(6);

  // Expense by category (current month)
  const categoryData = useMemo(() => {
    const now = new Date();
    const start = startOfMonth(now);
    const end = endOfMonth(now);
    const monthExpenses = transactions.filter(
      t => t.type === 'expense' && isWithinInterval(new Date(t.date), { start, end })
    );
    const grouped: Record<string, number> = {};
    monthExpenses.forEach(t => {
      grouped[t.category] = (grouped[t.category] || 0) + t.amount;
    });
    return Object.entries(grouped).map(([catId, value]) => {
      const cat = categories.find(c => c.id === catId);
      return { name: cat?.name || catId, value, icon: cat?.icon || '📋' };
    }).sort((a, b) => b.value - a.value);
  }, [transactions, categories]);

  // Monthly income vs expense
  const monthlyData = useMemo(() => {
    const data = [];
    for (let i = months - 1; i >= 0; i--) {
      const monthStart = startOfMonth(subMonths(new Date(), i));
      const monthEnd = endOfMonth(monthStart);
      const monthTxns = transactions.filter(t => isWithinInterval(new Date(t.date), { start: monthStart, end: monthEnd }));
      const income = monthTxns.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
      const expense = monthTxns.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
      data.push({ month: format(monthStart, 'MMM'), income, expense });
    }
    return data;
  }, [transactions, months]);

  const totalExpenseThisMonth = categoryData.reduce((s, d) => s + d.value, 0);

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="mx-auto max-w-lg px-4 pt-6">
        <h1 className="mb-6 text-2xl font-bold">Analytics</h1>

        {/* Pie Chart - Expenses by Category */}
        <div className="mb-6 rounded-2xl bg-card p-4">
          <h2 className="mb-1 text-base font-semibold">Expenses by Category</h2>
          <p className="mb-4 text-sm text-muted-foreground">This month</p>
          {categoryData.length > 0 ? (
            <div className="flex items-center gap-4">
              <ResponsiveContainer width={160} height={160}>
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={75}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {categoryData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1 space-y-2">
                {categoryData.slice(0, 5).map((d, i) => (
                  <div key={d.name} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                      <span className="text-muted-foreground">{d.icon} {d.name}</span>
                    </div>
                    <span className="font-medium">{formatCurrency(d.value)}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="py-8 text-center text-sm text-muted-foreground">No expenses this month</p>
          )}
        </div>

        {/* Bar Chart - Income vs Expenses */}
        <div className="rounded-2xl bg-card p-4">
          <h2 className="mb-1 text-base font-semibold">Income vs Expenses</h2>
          <p className="mb-4 text-sm text-muted-foreground">Last {months} months</p>
          {monthlyData.some(d => d.income > 0 || d.expense > 0) ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={monthlyData} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12 }} tickFormatter={v => `$${v}`} />
                <Tooltip
                  formatter={(value: number) => [`$${value.toFixed(2)}`, '']}
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '0.75rem',
                  }}
                />
                <Bar dataKey="income" fill="hsl(var(--income))" radius={[4, 4, 0, 0]} />
                <Bar dataKey="expense" fill="hsl(var(--expense))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="py-8 text-center text-sm text-muted-foreground">No data yet</p>
          )}
        </div>
      </div>
    </div>
  );
}
