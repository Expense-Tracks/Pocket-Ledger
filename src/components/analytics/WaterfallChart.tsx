import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell, ReferenceLine } from 'recharts';
import { format, startOfMonth, endOfMonth, addMonths, isWithinInterval } from 'date-fns';
import type { Transaction } from '@/types/finance';

interface Props {
  transactions: Transaction[];
  from: Date;
  to: Date;
  formatCurrency: (v: number) => string;
}

export default function WaterfallChart({ transactions, from, to, formatCurrency }: Props) {
  const compactTick = (v: number) => {
    const abs = Math.abs(v);
    if (abs >= 1_000_000) return `${(v / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
    if (abs >= 1_000) return `${(v / 1_000).toFixed(0)}K`;
    return v.toString();
  };

  const data = useMemo(() => {
    const items: { name: string; range: [number, number]; displayValue: number; type: 'income' | 'expense' | 'net' }[] = [];
    let cursor = startOfMonth(from);
    const endDate = endOfMonth(to);
    let running = 0;

    while (cursor <= endDate) {
      const ms = startOfMonth(cursor);
      const me = endOfMonth(cursor);
      const monthTxns = transactions.filter(t => {
        const txDate = new Date(t.date);
        return isWithinInterval(txDate, { start: ms, end: me }) &&
               isWithinInterval(txDate, { start: from, end: to });
      });
      const income = monthTxns.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
      const expense = monthTxns.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
      const label = format(ms, 'MMM');

      if (income > 0) {
        items.push({ name: `${label} +`, range: [0, income], displayValue: income, type: 'income' });
        running += income;
      }
      if (expense > 0) {
        // Expense bar goes downward from 0
        items.push({ name: `${label} −`, range: [-expense, 0], displayValue: expense, type: 'expense' });
        running -= expense;
      }
      cursor = addMonths(cursor, 1);
    }

    if (items.length > 0) {
      items.push({
        name: 'Net',
        range: running >= 0 ? [0, running] : [running, 0],
        displayValue: running,
        type: 'net',
      });
    }
    return items;
  }, [transactions, from, to]);

  if (data.length <= 1) {
    return (
      <div className="rounded-2xl bg-card p-4">
        <h2 className="mb-1 text-base font-semibold">Cash Flow Waterfall</h2>
        <p className="py-8 text-center text-sm text-muted-foreground">No data in this period</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-card p-4">
      <h2 className="mb-1 text-base font-semibold">Cash Flow Waterfall</h2>
      <p className="mb-4 text-sm text-muted-foreground">Cumulative cash flow</p>
      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={data} barCategoryGap="20%">
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11 }} />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 11 }}
            tickFormatter={compactTick}
            width={50}
          />
          <Tooltip
            cursor={false}
            content={({ active, payload }) => {
              if (!active || !payload || !payload.length) return null;
              const entry = payload[0]?.payload;
              if (!entry) return null;
              const color =
                entry.type === 'income' ? 'hsl(142, 76%, 36%)' :
                entry.type === 'expense' ? 'hsl(0, 84%, 60%)' :
                'hsl(220, 60%, 50%)';
              return (
                <div style={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '0.75rem',
                  padding: '8px 12px',
                }}>
                  <p style={{ margin: 0, fontWeight: 600, color }}>{formatCurrency(Math.abs(entry.displayValue))}</p>
                </div>
              );
            }}
          />
          <ReferenceLine y={0} stroke="hsl(var(--muted-foreground))" strokeDasharray="3 3" />
          <Bar dataKey="range" radius={[3, 3, 0, 0]} isAnimationActive={false}>
            {data.map((entry, i) => (
              <Cell
                key={i}
                fill={
                  entry.type === 'income'
                    ? 'hsl(var(--income))'
                    : entry.type === 'expense'
                    ? 'hsl(var(--expense))'
                    : 'hsl(220, 60%, 50%)'
                }
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
