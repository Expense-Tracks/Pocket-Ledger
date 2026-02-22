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
  const data = useMemo(() => {
    const items: { name: string; value: number; start: number; end: number; type: 'income' | 'expense' | 'net' }[] = [];
    let cursor = startOfMonth(from);
    const endDate = endOfMonth(to);
    let running = 0;

    while (cursor <= endDate) {
      const ms = startOfMonth(cursor);
      const me = endOfMonth(cursor);
      // Filter transactions within both the month AND the selected range
      const monthTxns = transactions.filter(t => {
        const txDate = new Date(t.date);
        return isWithinInterval(txDate, { start: ms, end: me }) && 
               isWithinInterval(txDate, { start: from, end: to });
      });
      const income = monthTxns.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
      const expense = monthTxns.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
      const label = format(ms, 'MMM');

      if (income > 0) {
        items.push({ name: `${label} +`, value: income, start: running, end: running + income, type: 'income' });
        running += income;
      }
      if (expense > 0) {
        items.push({ name: `${label} −`, value: -expense, start: running, end: running - expense, type: 'expense' });
        running -= expense;
      }
      cursor = addMonths(cursor, 1);
    }

    // Net total bar
    if (items.length > 0) {
      items.push({ name: 'Net', value: running, start: 0, end: running, type: 'net' });
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
          <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11 }} tickFormatter={v => formatCurrency(v)} />
          <Tooltip
            formatter={(value: number) => [formatCurrency(Math.abs(value)), '']}
            contentStyle={{
              backgroundColor: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '0.75rem',
            }}
          />
          <ReferenceLine y={0} stroke="hsl(var(--muted-foreground))" strokeDasharray="3 3" />
          {/* Invisible base bar */}
          <Bar dataKey="start" stackId="waterfall" fill="transparent" isAnimationActive={false} />
          {/* Visible segment */}
          <Bar dataKey={(entry: typeof data[0]) => entry.end - entry.start} stackId="waterfall" radius={[3, 3, 0, 0]}>
            {data.map((entry, i) => (
              <Cell
                key={i}
                fill={
                  entry.type === 'income'
                    ? 'hsl(var(--income))'
                    : entry.type === 'expense'
                    ? 'hsl(var(--expense))'
                    : 'hsl(var(--primary))'
                }
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
