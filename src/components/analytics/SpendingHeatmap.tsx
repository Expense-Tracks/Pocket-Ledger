import { useMemo, useState } from 'react';
import {
  eachDayOfInterval, format, getDay, startOfWeek, endOfWeek, isWithinInterval,
  startOfMonth, endOfMonth, isSameMonth, addMonths, differenceInCalendarMonths,
} from 'date-fns';
import { Button } from '@/components/ui/button';
import type { Transaction } from '@/types/finance';

interface Props {
  transactions: Transaction[];
  from: Date;
  to: Date;
  formatCurrency: (v: number) => string;
}

export default function SpendingHeatmap({ transactions, from, to, formatCurrency }: Props) {
  const isSingleMonth = isSameMonth(from, to);
  const [showAll, setShowAll] = useState(false);

  // Calendar view for single month
  const calendarData = useMemo(() => {
    if (!isSingleMonth) return null;

    // Show the full month containing the range
    const monthStart = startOfMonth(from);
    const monthEnd = endOfMonth(from);

    // Build daily spend map for the ENTIRE month (not just the selected range)
    const dailySpend: Record<string, number> = {};
    transactions
      .filter(t => t.type === 'expense' && isWithinInterval(new Date(t.date), { start: monthStart, end: monthEnd }))
      .forEach(t => {
        const key = format(new Date(t.date), 'yyyy-MM-dd');
        dailySpend[key] = (dailySpend[key] || 0) + t.amount;
      });

    let max = 0;
    Object.values(dailySpend).forEach(v => { if (v > max) max = v; });

    const weekStart = startOfWeek(monthStart, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
    const allDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

    // Group into weeks (7 days each)
    const weeks: { day: number; date: Date; spend: number; inRange: boolean }[][] = [];
    for (let i = 0; i < allDays.length; i += 7) {
      const week = allDays.slice(i, i + 7).map(d => ({
        day: getDay(d),
        date: d,
        spend: dailySpend[format(d, 'yyyy-MM-dd')] || 0,
        inRange: isWithinInterval(d, { start: from, end: to }),
      }));
      weeks.push(week);
    }

    return { weeks, maxSpend: max, hasData: Object.keys(dailySpend).length > 0 };
  }, [transactions, from, to, isSingleMonth]);

  // Monthly summary view for multi-month ranges
  const monthlyData = useMemo(() => {
    if (isSingleMonth) return null;

    const monthlySpend: Record<string, number> = {};
    transactions
      .filter(t => t.type === 'expense' && isWithinInterval(new Date(t.date), { start: from, end: to }))
      .forEach(t => {
        const key = format(startOfMonth(new Date(t.date)), 'yyyy-MM');
        monthlySpend[key] = (monthlySpend[key] || 0) + t.amount;
      });

    let max = 0;
    Object.values(monthlySpend).forEach(v => { if (v > max) max = v; });

    // Build list of months in range
    const months: { date: Date; spend: number; label: string }[] = [];
    let cursor = startOfMonth(from);
    const end = endOfMonth(to);
    while (cursor <= end) {
      const key = format(cursor, 'yyyy-MM');
      months.push({
        date: cursor,
        spend: monthlySpend[key] || 0,
        label: format(cursor, 'MMM yy'),
      });
      cursor = addMonths(cursor, 1);
    }

    return { months, maxSpend: max, hasData: Object.keys(monthlySpend).length > 0 };
  }, [transactions, from, to, isSingleMonth]);

  const getIntensity = (spend: number, maxSpend: number, dimmed: boolean = false): string => {
    if (dimmed) return 'bg-muted/20';
    if (spend === 0 || maxSpend === 0) return 'bg-muted/40';
    const ratio = spend / maxSpend;
    if (ratio < 0.25) return 'bg-expense/20';
    if (ratio < 0.5) return 'bg-expense/40';
    if (ratio < 0.75) return 'bg-expense/60';
    return 'bg-expense/90';
  };

  const dayLabels = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

  return (
    <div className="rounded-2xl bg-card p-4">
      <h2 className="mb-1 text-base font-semibold">Spending Heatmap</h2>
      <p className="mb-4 text-sm text-muted-foreground">
        {isSingleMonth ? 'Daily spending intensity' : 'Monthly spending intensity'}
      </p>

      {isSingleMonth && calendarData ? (
        calendarData.hasData || true ? (
          <>
            {/* Day labels */}
            <div className="flex gap-1 mb-1">
              {dayLabels.map((l, i) => (
                <div key={i} className="flex-1 text-center text-[10px] text-muted-foreground font-medium">{l}</div>
              ))}
            </div>

            {/* Calendar grid */}
            <div className="flex flex-col gap-1">
              {calendarData.weeks.map((week, wi) => (
                <div key={wi} className="flex gap-1">
                  {week.map((cell, ci) => (
                    <div
                      key={ci}
                      className={`flex-1 aspect-square rounded-sm transition-colors ${getIntensity(cell.spend, calendarData.maxSpend, !cell.inRange)}`}
                      title={`${format(cell.date, 'MMM d')}: ${formatCurrency(cell.spend)}`}
                    />
                  ))}
                </div>
              ))}
            </div>

            {/* Legend */}
            <div className="mt-3 flex items-center gap-2 text-[10px] text-muted-foreground">
              <span>Less</span>
              <div className="h-3 w-3 rounded-sm bg-muted/40" />
              <div className="h-3 w-3 rounded-sm bg-expense/20" />
              <div className="h-3 w-3 rounded-sm bg-expense/40" />
              <div className="h-3 w-3 rounded-sm bg-expense/60" />
              <div className="h-3 w-3 rounded-sm bg-expense/90" />
              <span>More</span>
            </div>
          </>
        ) : (
          <p className="py-8 text-center text-sm text-muted-foreground">No expenses in this period</p>
        )
      ) : monthlyData ? (
        monthlyData.hasData || true ? (
          <>
            {/* Monthly bars */}
            <div className="space-y-2">
              {(showAll ? monthlyData.months : monthlyData.months.slice(0, 3)).map((month) => (
                <div key={month.label} className="flex items-center gap-3">
                  <div className="w-14 text-xs text-muted-foreground font-medium">{month.label}</div>
                  <div className="flex-1 h-8 rounded-md bg-muted/40 overflow-hidden relative">
                    {month.spend > 0 && (
                      <div
                        className="h-full bg-expense/70 transition-all rounded-md"
                        style={{ width: `${(month.spend / monthlyData.maxSpend) * 100}%` }}
                      />
                    )}
                  </div>
                  <div className="w-20 text-right text-xs font-medium">
                    {month.spend > 0 ? formatCurrency(month.spend) : '—'}
                  </div>
                </div>
              ))}
            </div>

            {/* See more button */}
            {monthlyData.months.length > 3 && (
              <div className="mt-3 text-center">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAll(!showAll)}
                  className="text-xs"
                >
                  {showAll ? 'Show less' : `Show ${monthlyData.months.length - 3} more months`}
                </Button>
              </div>
            )}

            {/* Legend */}
            <div className="mt-4 flex items-center gap-2 text-[10px] text-muted-foreground">
              <span>Less</span>
              <div className="h-3 w-8 rounded-sm bg-muted/40" />
              <div className="h-3 w-8 rounded-sm bg-expense/30" />
              <div className="h-3 w-8 rounded-sm bg-expense/50" />
              <div className="h-3 w-8 rounded-sm bg-expense/70" />
              <span>More</span>
            </div>
          </>
        ) : (
          <p className="py-8 text-center text-sm text-muted-foreground">No expenses in this period</p>
        )
      ) : null}
    </div>
  );
}
