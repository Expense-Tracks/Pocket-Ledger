import { useCallback, useMemo, useState } from 'react';
import { useFinance } from '@/contexts/FinanceContext';
import { useSettings } from '@/contexts/SettingsContext';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import {
  format, startOfMonth, endOfMonth, addMonths, isWithinInterval,
  subDays, differenceInDays, getDay,
} from 'date-fns';
import { CalendarDays, DollarSign, Crown, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { DateRangePicker, type DateRangeValue } from '@/components/DateRangePicker';
import SpendingHeatmap from '@/components/analytics/SpendingHeatmap';
import WaterfallChart from '@/components/analytics/WaterfallChart';
import CategoryTrends from '@/components/analytics/CategoryTrends';

const COLORS = [
  'hsl(220, 60%, 50%)', 'hsl(160, 60%, 42%)', 'hsl(4, 72%, 56%)',
  'hsl(38, 92%, 50%)', 'hsl(280, 60%, 55%)', 'hsl(190, 70%, 45%)',
  'hsl(340, 65%, 50%)', 'hsl(100, 50%, 45%)',
];

export default function Analytics() {
  const { transactions, categories } = useFinance();
  const { formatCurrency } = useSettings();
  const [range, setRange] = useState<DateRangeValue>({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date()),
  });

  // Calculate min date: earliest transaction or 1 year back, whichever is more recent
  const minDate = useMemo(() => {
    if (transactions.length === 0) {
      return startOfMonth(subDays(new Date(), 365));
    }
    const earliestTransaction = transactions.reduce((earliest, t) => {
      const tDate = new Date(t.date);
      return tDate < earliest ? tDate : earliest;
    }, new Date(transactions[0].date));
    
    const oneYearAgo = startOfMonth(subDays(new Date(), 365));
    return earliestTransaction < oneYearAgo ? earliestTransaction : oneYearAgo;
  }, [transactions]);

  // Expense by category (filtered by date range)
  const categoryData = useMemo(() => {
    const monthExpenses = transactions.filter(
      t => t.type === 'expense' && isWithinInterval(new Date(t.date), { start: range.from, end: range.to })
    );
    const grouped: Record<string, number> = {};
    monthExpenses.forEach(t => {
      grouped[t.category] = (grouped[t.category] || 0) + t.amount;
    });
    return Object.entries(grouped).map(([catId, value]) => {
      const cat = categories.find(c => c.id === catId);
      return { name: cat?.name || catId, value, icon: cat?.icon || '📋' };
    }).sort((a, b) => b.value - a.value);
  }, [transactions, categories, range]);

  // Monthly income vs expense (filtered by date range)
  const monthlyData = useMemo(() => {
    const data = [];
    let cursor = startOfMonth(range.from);
    const end = endOfMonth(range.to);
    while (cursor <= end) {
      const monthStart = startOfMonth(cursor);
      const monthEnd = endOfMonth(cursor);
      const monthTxns = transactions.filter(t => isWithinInterval(new Date(t.date), { start: monthStart, end: monthEnd }));
      const income = monthTxns.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
      const expense = monthTxns.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
      data.push({ month: format(monthStart, 'MMM yyyy'), income, expense });
      cursor = addMonths(cursor, 1);
    }
    return data;
  }, [transactions, range]);

  // Spending Insights
  const insights = useMemo(() => {
    const rangeExpenses = transactions.filter(
      t => t.type === 'expense' && isWithinInterval(new Date(t.date), { start: range.from, end: range.to })
    );

    const days = Math.max(differenceInDays(range.to, range.from) + 1, 1);
    const totalSpend = rangeExpenses.reduce((s, t) => s + t.amount, 0);
    const avgDaily = totalSpend / days;

    // Top spending day of the week
    const dayTotals = [0, 0, 0, 0, 0, 0, 0]; // Sun–Sat
    const dayCounts = [0, 0, 0, 0, 0, 0, 0];
    rangeExpenses.forEach(t => {
      const d = getDay(new Date(t.date));
      dayTotals[d] += t.amount;
      dayCounts[d]++;
    });
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    let topDayIdx = 0;
    for (let i = 1; i < 7; i++) {
      if (dayTotals[i] > dayTotals[topDayIdx]) topDayIdx = i;
    }
    const topDay = dayTotals[topDayIdx] > 0 ? { name: dayNames[topDayIdx], total: dayTotals[topDayIdx], count: dayCounts[topDayIdx] } : null;

    // Biggest single expense
    const biggest = rangeExpenses.length > 0
      ? rangeExpenses.reduce((max, t) => t.amount > max.amount ? t : max, rangeExpenses[0])
      : null;
    const biggestCategory = biggest ? categories.find(c => c.id === biggest.category) : null;

    // Category comparison vs previous period of same length
    const prevFrom = subDays(range.from, days);
    const prevTo = subDays(range.from, 1);
    const prevExpenses = transactions.filter(
      t => t.type === 'expense' && isWithinInterval(new Date(t.date), { start: prevFrom, end: prevTo })
    );

    const categoryChanges: { name: string; icon: string; current: number; previous: number; pctChange: number }[] = [];
    const currentByCat: Record<string, number> = {};
    const prevByCat: Record<string, number> = {};
    rangeExpenses.forEach(t => { currentByCat[t.category] = (currentByCat[t.category] || 0) + t.amount; });
    prevExpenses.forEach(t => { prevByCat[t.category] = (prevByCat[t.category] || 0) + t.amount; });

    const allCatIds = new Set([...Object.keys(currentByCat), ...Object.keys(prevByCat)]);
    allCatIds.forEach(catId => {
      const curr = currentByCat[catId] || 0;
      const prev = prevByCat[catId] || 0;
      if (prev > 0 && curr > 0) {
        const pctChange = ((curr - prev) / prev) * 100;
        if (Math.abs(pctChange) >= 5) {
          const cat = categories.find(c => c.id === catId);
          categoryChanges.push({ name: cat?.name || catId, icon: cat?.icon || '📋', current: curr, previous: prev, pctChange });
        }
      }
    });
    categoryChanges.sort((a, b) => Math.abs(b.pctChange) - Math.abs(a.pctChange));

    return { avgDaily, topDay, biggest, biggestCategory, categoryChanges, totalSpend, hasData: rangeExpenses.length > 0 };
  }, [transactions, categories, range]);

  const [tooltipActive, setTooltipActive] = useState(false);
  const handleMouseMove = useCallback(() => setTooltipActive(true), []);
  const handleMouseLeave = useCallback(() => setTooltipActive(false), []);

  const rangeLabel = format(range.from, 'MMM d') === format(startOfMonth(new Date()), 'MMM d') &&
    format(range.to, 'MMM d') === format(endOfMonth(new Date()), 'MMM d')
    ? 'This month'
    : `${format(range.from, 'MMM d')} – ${format(range.to, 'MMM d, yyyy')}`;

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="mx-auto max-w-lg px-4 pt-6">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Analytics</h1>
          <DateRangePicker value={range} onChange={setRange} minDate={minDate} />
        </div>

        {/* Pie Chart - Expenses by Category */}
        <div className="mb-6 rounded-2xl bg-card p-4">
          <h2 className="mb-1 text-base font-semibold">Expenses by Category</h2>
          <p className="mb-4 text-sm text-muted-foreground">{rangeLabel}</p>
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
            <p className="py-8 text-center text-sm text-muted-foreground">No expenses in this period</p>
          )}
        </div>

        {/* Bar Chart - Income vs Expenses */}
        <div className="mb-6 rounded-2xl bg-card p-4">
          <h2 className="mb-1 text-base font-semibold">Income vs Expenses</h2>
          <p className="mb-4 text-sm text-muted-foreground">{rangeLabel}</p>
          {monthlyData.some(d => d.income > 0 || d.expense > 0) ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={monthlyData} barGap={4} onMouseMove={handleMouseMove} onMouseLeave={handleMouseLeave}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12 }} tickFormatter={v => {
                  const abs = Math.abs(v);
                  if (abs >= 1_000_000) return `${(v / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
                  if (abs >= 1_000) return `${(v / 1_000).toFixed(0)}K`;
                  return v.toString();
                }} width={50} />
                <Tooltip
                  active={tooltipActive}
                  formatter={(value: number) => [formatCurrency(value), '']}
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '0.75rem',
                  }}
                  cursor={tooltipActive ? { fill: 'hsl(var(--muted))' } : false}
                />
                <Bar dataKey="income" fill="hsl(var(--income))" radius={[4, 4, 0, 0]} />
                <Bar dataKey="expense" fill="hsl(var(--expense))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="py-8 text-center text-sm text-muted-foreground">No data in this period</p>
          )}
        </div>

        {/* Spending Insights */}
        {insights.hasData && (
          <div className="mb-6 rounded-2xl bg-card p-4">
            <h2 className="mb-4 text-base font-semibold">Spending Insights</h2>
            <div className="space-y-3">
              {/* Average Daily Spend */}
              <div className="flex items-center gap-3 rounded-xl bg-muted/50 p-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
                  <DollarSign className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">Average daily spend</p>
                  <p className="text-base font-semibold">{formatCurrency(insights.avgDaily)}</p>
                </div>
              </div>

              {/* Top Spending Day */}
              {insights.topDay && (
                <div className="flex items-center gap-3 rounded-xl bg-muted/50 p-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-warning/10">
                    <CalendarDays className="h-4 w-4 text-warning" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground">Top spending day</p>
                    <p className="text-base font-semibold">{insights.topDay.name}</p>
                  </div>
                  <span className="text-sm text-muted-foreground">{formatCurrency(insights.topDay.total)} across {insights.topDay.count} txns</span>
                </div>
              )}

              {/* Biggest Expense */}
              {insights.biggest && (
                <div className="flex items-center gap-3 rounded-xl bg-muted/50 p-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-expense/10">
                    <Crown className="h-4 w-4 text-expense" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground">Biggest expense</p>
                    <p className="text-base font-semibold">{formatCurrency(insights.biggest.amount)}</p>
                  </div>
                  <span className="text-sm text-muted-foreground">{insights.biggestCategory?.icon} {insights.biggest.description || insights.biggestCategory?.name}</span>
                </div>
              )}
            </div>

            {/* Category Trends vs Previous Period */}
            {insights.categoryChanges.length > 0 && (
              <div className="mt-4">
                <h3 className="mb-3 text-sm font-medium text-muted-foreground">vs previous period</h3>
                <div className="space-y-2">
                  {insights.categoryChanges.slice(0, 5).map(change => (
                    <div key={change.name} className="flex items-center justify-between rounded-xl bg-muted/50 px-3 py-2">
                      <div className="flex items-center gap-2">
                        <span>{change.icon}</span>
                        <span className="text-sm font-medium">{change.name}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {change.pctChange > 0 ? (
                          <ArrowUpRight className="h-3.5 w-3.5 text-expense" />
                        ) : (
                          <ArrowDownRight className="h-3.5 w-3.5 text-income" />
                        )}
                        <span className={`text-sm font-medium ${change.pctChange > 0 ? 'text-expense' : 'text-income'}`}>
                          {Math.abs(Math.round(change.pctChange))}%
                        </span>
                        <span className="text-xs text-muted-foreground">
                          ({formatCurrency(change.previous)} → {formatCurrency(change.current)})
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Spending Heatmap */}
        <div className="mb-6">
          <SpendingHeatmap transactions={transactions} from={range.from} to={range.to} formatCurrency={formatCurrency} />
        </div>

        {/* Cash Flow Waterfall */}
        <div className="mb-6">
          <WaterfallChart transactions={transactions} from={range.from} to={range.to} formatCurrency={formatCurrency} />
        </div>

        {/* Category Trend Lines */}
        <div className="mb-6">
          <CategoryTrends transactions={transactions} categories={categories} from={range.from} to={range.to} formatCurrency={formatCurrency} />
        </div>
      </div>
    </div>
  );
}
