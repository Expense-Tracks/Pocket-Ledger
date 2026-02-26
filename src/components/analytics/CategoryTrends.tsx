import { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { format, startOfMonth, endOfMonth, addMonths, isWithinInterval } from 'date-fns';
import type { Transaction, Category } from '@/types/finance';

const TREND_COLORS = [
  'hsl(220, 60%, 50%)', 'hsl(160, 60%, 42%)', 'hsl(4, 72%, 56%)',
  'hsl(38, 92%, 50%)', 'hsl(280, 60%, 55%)',
];

interface Props {
  transactions: Transaction[];
  categories: Category[];
  from: Date;
  to: Date;
  formatCurrency: (v: number) => string;
}

export default function CategoryTrends({ transactions, categories, from, to, formatCurrency }: Props) {
  const { data, topCats } = useMemo(() => {
    // Find top 5 expense categories by total spend in range
    const totals: Record<string, number> = {};
    transactions
      .filter(t => t.type === 'expense' && isWithinInterval(new Date(t.date), { start: from, end: to }))
      .forEach(t => { totals[t.category] = (totals[t.category] || 0) + t.amount; });

    const sorted = Object.entries(totals).sort((a, b) => b[1] - a[1]).slice(0, 5);
    const topCatIds = sorted.map(([id]) => id);
    const topCats = topCatIds.map(id => {
      const cat = categories.find(c => c.id === id);
      return { id, name: cat?.name || id, icon: cat?.icon || '📋' };
    });

    // Build monthly data
    const rows: Record<string, number | string>[] = [];
    let cursor = startOfMonth(from);
    const endDate = endOfMonth(to);
    while (cursor <= endDate) {
      const ms = startOfMonth(cursor);
      const me = endOfMonth(cursor);
      const row: Record<string, number | string> = { month: format(ms, 'MMM yy') };
      topCatIds.forEach(catId => {
        row[catId] = transactions
          .filter(t => {
            const txDate = new Date(t.date);
            return t.type === 'expense' && 
                   t.category === catId && 
                   isWithinInterval(txDate, { start: ms, end: me }) &&
                   isWithinInterval(txDate, { start: from, end: to });
          })
          .reduce((s, t) => s + t.amount, 0);
      });
      rows.push(row);
      cursor = addMonths(cursor, 1);
    }

    return { data: rows, topCats };
  }, [transactions, categories, from, to]);

  if (topCats.length === 0) {
    return (
      <div className="rounded-2xl bg-card p-4">
        <h2 className="mb-1 text-base font-semibold">Category Trends</h2>
        <p className="py-8 text-center text-sm text-muted-foreground">No expense data in this period</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-card p-4">
      <h2 className="mb-1 text-base font-semibold">Category Trends</h2>
      <p className="mb-4 text-sm text-muted-foreground">Top categories over time</p>

      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
          <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11 }} />
          <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11 }} tickFormatter={v => {
            const abs = Math.abs(v);
            if (abs >= 1_000_000) return `${(v / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
            if (abs >= 1_000) return `${(v / 1_000).toFixed(0)}K`;
            return v.toString();
          }} width={50} />
          <Tooltip
            formatter={(value: number, name: string) => {
              const cat = topCats.find(c => c.id === name);
              return [formatCurrency(value), `${cat?.icon} ${cat?.name}`];
            }}
            contentStyle={{
              backgroundColor: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '0.75rem',
            }}
          />
          {topCats.map((cat, i) => (
            <Line
              key={cat.id}
              type="monotone"
              dataKey={cat.id}
              stroke={TREND_COLORS[i % TREND_COLORS.length]}
              strokeWidth={2}
              dot={{ r: 3 }}
              activeDot={{ r: 5 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>

      {/* Legend */}
      <div className="mt-3 flex flex-wrap gap-3">
        {topCats.map((cat, i) => (
          <div key={cat.id} className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <div className="h-2 w-2 rounded-full" style={{ backgroundColor: TREND_COLORS[i % TREND_COLORS.length] }} />
            <span>{cat.icon} {cat.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
