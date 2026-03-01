import { useState, useMemo } from 'react';
import { useFinance } from '@/contexts/FinanceContext';
import { TransactionList } from '@/components/TransactionList';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import { DateRangePicker, type DateRangeValue } from '@/components/DateRangePicker';
import { startOfMonth, endOfMonth, isWithinInterval, subDays } from 'date-fns';

export default function Transactions() {
  const { transactions, categories, paymentMethods } = useFinance();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [paymentMethodFilter, setPaymentMethodFilter] = useState<string>('all');
  const [minAmount, setMinAmount] = useState('');
  const [maxAmount, setMaxAmount] = useState('');
  const [dateRange, setDateRange] = useState<DateRangeValue | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const minDate = useMemo(() => {
    if (transactions.length === 0) return startOfMonth(subDays(new Date(), 365));
    const earliest = transactions.reduce((min, t) => {
      const tDate = new Date(t.date);
      return tDate < min ? tDate : min;
    }, new Date(transactions[0].date));
    return startOfMonth(subDays(new Date(), 365)) < earliest ? startOfMonth(subDays(new Date(), 365)) : earliest;
  }, [transactions]);

  const hasAdvancedFilters = paymentMethodFilter !== 'all' || minAmount || maxAmount || dateRange !== null;

  const clearAdvancedFilters = () => {
    setPaymentMethodFilter('all');
    setMinAmount('');
    setMaxAmount('');
    setDateRange(null);
  };

  const filtered = useMemo(() => {
    return [...transactions]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .filter(t => {
        if (search && !t.description.toLowerCase().includes(search.toLowerCase())) return false;
        if (typeFilter !== 'all' && t.type !== typeFilter) return false;
        if (categoryFilter !== 'all' && t.category !== categoryFilter) return false;
        if (paymentMethodFilter !== 'all' && t.paymentMethod !== paymentMethodFilter) return false;
        if (minAmount && t.amount < parseFloat(minAmount)) return false;
        if (maxAmount && t.amount > parseFloat(maxAmount)) return false;
        if (dateRange && !isWithinInterval(new Date(t.date), { start: dateRange.from, end: dateRange.to })) return false;
        return true;
      });
  }, [transactions, search, typeFilter, categoryFilter, paymentMethodFilter, minAmount, maxAmount, dateRange]);

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="mx-auto max-w-lg px-4 pt-6">
        <h1 className="mb-4 text-2xl font-bold">Transactions</h1>

        {/* Search */}
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search transactions..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Basic Filters */}
        <div className="mb-3 flex gap-2">
          <Select value={typeFilter} onValueChange={(v) => { setTypeFilter(v); setCategoryFilter('all'); }}>
            <SelectTrigger className="flex-1">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="expense">Expenses</SelectItem>
              <SelectItem value="income">Income</SelectItem>
            </SelectContent>
          </Select>
          <Select value={categoryFilter} onValueChange={(v) => {
            setCategoryFilter(v);
            if (v !== 'all') {
              const cat = categories.find(c => c.id === v);
              if (cat) setTypeFilter(cat.type);
            }
          }}>
            <SelectTrigger className="flex-1">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories
                .filter(c => typeFilter === 'all' || c.type === typeFilter)
                .map(c => (
                  <SelectItem key={c.id} value={c.id}>{c.icon} {c.name}</SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>

        {/* Advanced Filters */}
        <Collapsible open={showAdvanced} onOpenChange={setShowAdvanced}>
          <div className="mb-3 flex items-center justify-between">
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-2">
                <SlidersHorizontal className="h-4 w-4" />
                Advanced Filters
                {hasAdvancedFilters && <span className="text-xs text-primary">(active)</span>}
              </Button>
            </CollapsibleTrigger>
            {hasAdvancedFilters && (
              <Button variant="ghost" size="sm" onClick={clearAdvancedFilters} className="gap-1">
                <X className="h-3 w-3" />
                Clear
              </Button>
            )}
          </div>

          <CollapsibleContent className="space-y-3 mb-3">
            {/* Payment Method */}
            <Select value={paymentMethodFilter} onValueChange={setPaymentMethodFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Payment Method" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Payment Methods</SelectItem>
                {paymentMethods.map(pm => (
                  <SelectItem key={pm.id} value={pm.id}>{pm.icon} {pm.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Amount Range */}
            <div className="flex gap-2">
              <Input
                type="number"
                placeholder="Min amount"
                value={minAmount}
                onChange={e => setMinAmount(e.target.value)}
                className="flex-1"
              />
              <Input
                type="number"
                placeholder="Max amount"
                value={maxAmount}
                onChange={e => setMaxAmount(e.target.value)}
                className="flex-1"
              />
            </div>

            {/* Date Range */}
            {dateRange ? (
              <div className="space-y-2">
                <DateRangePicker
                  value={dateRange}
                  onChange={setDateRange}
                  minDate={minDate}
                  maxDate={new Date()}
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setDateRange(null)}
                  className="w-full"
                >
                  Clear Date Filter
                </Button>
              </div>
            ) : (
              <Button
                variant="outline"
                onClick={() => setDateRange({ from: startOfMonth(new Date()), to: endOfMonth(new Date()) })}
                className="w-full"
              >
                Filter by Date Range
              </Button>
            )}
          </CollapsibleContent>
        </Collapsible>

        <p className="mb-3 text-sm text-muted-foreground">{filtered.length} transaction{filtered.length !== 1 ? 's' : ''}</p>

        <TransactionList transactions={filtered} showDelete />
      </div>
    </div>
  );
}
