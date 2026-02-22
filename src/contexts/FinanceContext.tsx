import React, { createContext, useContext, useState, useCallback, useEffect, useMemo } from 'react';
import { toast } from 'sonner';
import { startOfWeek, startOfMonth, startOfYear, endOfWeek, endOfMonth, endOfYear } from 'date-fns';
import { Transaction, Category, PaymentMethod, Budget, RecurringTransaction, SavingsGoal, Debt } from '@/types/finance';
import {
  loadTransactions, saveTransactions,
  loadCategories, saveCategories,
  loadPaymentMethods, savePaymentMethods,
  loadBudgets, saveBudgets,
  loadRecurring, saveRecurring,
  loadSavingsGoals, saveSavingsGoals,
  loadDebts, saveDebts,
} from '@/lib/storage';

interface FinanceContextType {
  transactions: Transaction[];
  categories: Category[];
  paymentMethods: PaymentMethod[];
  budgets: Budget[];
  recurringTransactions: RecurringTransaction[];
  savingsGoals: SavingsGoal[];
  debts: Debt[];
  addTransaction: (t: Omit<Transaction, 'id' | 'createdAt'>) => string;
  updateTransaction: (id: string, t: Partial<Transaction>) => void;
  deleteTransaction: (id: string) => void;
  addCategory: (c: Omit<Category, 'id' | 'isDefault'>) => void;
  deleteCategory: (id: string) => void;
  addPaymentMethod: (p: Omit<PaymentMethod, 'id' | 'isDefault'>) => void;
  deletePaymentMethod: (id: string) => void;
  addBudget: (b: Omit<Budget, 'id' | 'spent'>) => void;
  updateBudget: (id: string, b: Partial<Budget>) => void;
  deleteBudget: (id: string) => void;
  addRecurring: (r: Omit<RecurringTransaction, 'id'>) => void;
  updateRecurring: (id: string, r: Partial<RecurringTransaction>) => void;
  deleteRecurring: (id: string) => void;
  addSavingsGoal: (g: Omit<SavingsGoal, 'id' | 'createdAt' | 'savedAmount'>) => void;
  updateSavingsGoal: (id: string, g: Partial<SavingsGoal>) => void;
  deleteSavingsGoal: (id: string) => void;
  contributeSavingsGoal: (id: string, amount: number) => void;
  addDebt: (d: Omit<Debt, 'id' | 'createdAt'>) => string;
  updateDebt: (id: string, d: Partial<Debt>) => void;
  deleteDebt: (id: string) => void;
  importData: (data: ExportData, mode: 'replace' | 'merge') => void;
  getBalance: () => { income: number; expense: number; net: number };
  budgetsWithSpent: Budget[];
}

function getBudgetPeriodRange(period: Budget['period']): { start: Date; end: Date } {
  const now = new Date();
  switch (period) {
    case 'weekly':
      return { start: startOfWeek(now, { weekStartsOn: 1 }), end: endOfWeek(now, { weekStartsOn: 1 }) };
    case 'monthly':
      return { start: startOfMonth(now), end: endOfMonth(now) };
    case 'yearly':
      return { start: startOfYear(now), end: endOfYear(now) };
  }
}

export interface ExportData {
  version: 1;
  exportedAt: string;
  transactions: Transaction[];
  categories: Category[];
  paymentMethods: PaymentMethod[];
  budgets: Budget[];
  recurringTransactions: RecurringTransaction[];
  savingsGoals: SavingsGoal[];
  debts: Debt[];
}

const FinanceContext = createContext<FinanceContextType | null>(null);

function getNextDate(from: string, frequency: RecurringTransaction['frequency']): Date {
  const d = new Date(from);
  switch (frequency) {
    case 'daily': d.setDate(d.getDate() + 1); break;
    case 'weekly': d.setDate(d.getDate() + 7); break;
    case 'monthly': d.setMonth(d.getMonth() + 1); break;
    case 'yearly': d.setFullYear(d.getFullYear() + 1); break;
  }
  return d;
}

export function FinanceProvider({ children }: { children: React.ReactNode }) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [recurringTransactions, setRecurringTransactions] = useState<RecurringTransaction[]>([]);
  const [savingsGoals, setSavingsGoals] = useState<SavingsGoal[]>([]);
  const [debts, setDebts] = useState<Debt[]>([]);
  const [hydrated, setHydrated] = useState(false);

  // Defer localStorage reads so they don't block first paint
  useEffect(() => {
    setTransactions(loadTransactions());
    setCategories(loadCategories());
    setPaymentMethods(loadPaymentMethods());
    setBudgets(loadBudgets());
    setRecurringTransactions(loadRecurring());
    setSavingsGoals(loadSavingsGoals());
    setDebts(loadDebts());
    setHydrated(true);
  }, []);

  // Only persist after initial hydration to avoid overwriting with empty arrays
  useEffect(() => { if (hydrated) saveTransactions(transactions); }, [transactions, hydrated]);
  useEffect(() => { if (hydrated) saveCategories(categories); }, [categories, hydrated]);
  useEffect(() => { if (hydrated) savePaymentMethods(paymentMethods); }, [paymentMethods, hydrated]);
  useEffect(() => { if (hydrated) saveBudgets(budgets); }, [budgets, hydrated]);
  useEffect(() => { if (hydrated) saveRecurring(recurringTransactions); }, [recurringTransactions, hydrated]);
  useEffect(() => { if (hydrated) saveSavingsGoals(savingsGoals); }, [savingsGoals, hydrated]);
  useEffect(() => { if (hydrated) saveDebts(debts); }, [debts, hydrated]);

  // Auto-generate transactions from active recurring rules
  useEffect(() => {
    if (!hydrated) return;
    const now = new Date();
    const generated: Transaction[] = [];
    const updated = recurringTransactions.map(r => {
      if (!r.active) return r;
      if (r.endDate && new Date(r.endDate) < now) return { ...r, active: false };
      let cursor = r.lastGenerated || r.startDate;
      let next = getNextDate(cursor, r.frequency);
      let lastGen = cursor;
      while (next <= now) {
        if (r.endDate && next > new Date(r.endDate)) break;
        generated.push({
          id: crypto.randomUUID(),
          amount: r.amount,
          type: r.type,
          category: r.category,
          paymentMethod: r.paymentMethod,
          description: r.description,
          date: next.toISOString(),
          createdAt: new Date().toISOString(),
        });
        lastGen = next.toISOString();
        next = getNextDate(lastGen, r.frequency);
      }
      return lastGen !== cursor ? { ...r, lastGenerated: lastGen } : r;
    });
    if (generated.length > 0) {
      setTransactions(prev => [...generated, ...prev]);
      setRecurringTransactions(updated);
    }
  }, [hydrated]); // eslint-disable-line react-hooks/exhaustive-deps

  // Compute spent per budget from transactions in the current period
  const budgetsWithSpent = useMemo(() => {
    return budgets.map(b => {
      const { start, end } = getBudgetPeriodRange(b.period);
      const spent = transactions
        .filter(t => t.type === 'expense' && t.category === b.category)
        .filter(t => {
          const d = new Date(t.date);
          return d >= start && d <= end;
        })
        .reduce((sum, t) => sum + t.amount, 0);
      return { ...b, spent };
    });
  }, [budgets, transactions]);

  const addTransaction = useCallback((t: Omit<Transaction, 'id' | 'createdAt'>) => {
    const newT: Transaction = { ...t, id: crypto.randomUUID(), createdAt: new Date().toISOString() };
    setTransactions(prev => [newT, ...prev]);
    return newT.id;
  }, []);

  const updateTransaction = useCallback((id: string, updates: Partial<Transaction>) => {
    setTransactions(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
  }, []);

  const deleteTransaction = useCallback((id: string) => {
    setTransactions(prev => {
      const t = prev.find(x => x.id === id);
      if (t) {
        toast('Transaction deleted', {
          action: { label: 'Undo', onClick: () => setTransactions(p => [t, ...p]) },
        });
      }
      return prev.filter(x => x.id !== id);
    });
  }, []);

  const addCategory = useCallback((c: Omit<Category, 'id' | 'isDefault'>) => {
    setCategories(prev => [...prev, { ...c, id: crypto.randomUUID(), isDefault: false }]);
  }, []);

  const deleteCategory = useCallback((id: string) => {
    const removed = categories.find(c => c.id === id && !c.isDefault);
    setCategories(prev => prev.filter(c => c.id !== id || c.isDefault));
    setTransactions(prev => prev.map(t => t.category === id ? { ...t, category: 'uncategorized' } : t));
    if (removed) {
      toast('Category deleted', {
        action: { label: 'Undo', onClick: () => setCategories(p => [...p, removed]) },
      });
    }
  }, [categories]);

  const addPaymentMethod = useCallback((p: Omit<PaymentMethod, 'id' | 'isDefault'>) => {
    setPaymentMethods(prev => [...prev, { ...p, id: crypto.randomUUID(), isDefault: false }]);
  }, []);

  const deletePaymentMethod = useCallback((id: string) => {
    const removed = paymentMethods.find(p => p.id === id && !p.isDefault);
    setPaymentMethods(prev => prev.filter(p => p.id !== id || p.isDefault));
    setTransactions(prev => prev.map(t => t.paymentMethod === id ? { ...t, paymentMethod: 'other' } : t));
    if (removed) {
      toast('Payment method deleted', {
        action: { label: 'Undo', onClick: () => setPaymentMethods(p => [...p, removed]) },
      });
    }
  }, [paymentMethods]);

  const addBudget = useCallback((b: Omit<Budget, 'id' | 'spent'>) => {
    setBudgets(prev => [...prev, { ...b, id: crypto.randomUUID(), spent: 0 }]);
  }, []);

  const updateBudget = useCallback((id: string, updates: Partial<Budget>) => {
    setBudgets(prev => prev.map(b => b.id === id ? { ...b, ...updates } : b));
  }, []);

  const deleteBudget = useCallback((id: string) => {
    const removed = budgets.find(b => b.id === id);
    setBudgets(prev => prev.filter(b => b.id !== id));
    if (removed) {
      toast('Budget deleted', {
        action: { label: 'Undo', onClick: () => setBudgets(p => [...p, removed]) },
      });
    }
  }, [budgets]);

  const addRecurring = useCallback((r: Omit<RecurringTransaction, 'id'>) => {
    setRecurringTransactions(prev => [...prev, { ...r, id: crypto.randomUUID() }]);
  }, []);

  const updateRecurring = useCallback((id: string, updates: Partial<RecurringTransaction>) => {
    setRecurringTransactions(prev => prev.map(r => r.id === id ? { ...r, ...updates } : r));
  }, []);

  const deleteRecurring = useCallback((id: string) => {
    const removed = recurringTransactions.find(r => r.id === id);
    setRecurringTransactions(prev => prev.filter(r => r.id !== id));
    if (removed) {
      toast('Recurring transaction deleted', {
        action: { label: 'Undo', onClick: () => setRecurringTransactions(p => [...p, removed]) },
      });
    }
  }, [recurringTransactions]);

  const addSavingsGoal = useCallback((g: Omit<SavingsGoal, 'id' | 'createdAt' | 'savedAmount'>) => {
    setSavingsGoals(prev => [...prev, { ...g, id: crypto.randomUUID(), savedAmount: 0, createdAt: new Date().toISOString() }]);
  }, []);

  const updateSavingsGoal = useCallback((id: string, updates: Partial<SavingsGoal>) => {
    setSavingsGoals(prev => prev.map(g => g.id === id ? { ...g, ...updates } : g));
  }, []);

  const deleteSavingsGoal = useCallback((id: string) => {
    const removed = savingsGoals.find(g => g.id === id);
    setSavingsGoals(prev => prev.filter(g => g.id !== id));
    if (removed) {
      toast('Savings goal deleted', {
        action: { label: 'Undo', onClick: () => setSavingsGoals(p => [...p, removed]) },
      });
    }
  }, [savingsGoals]);

  const contributeSavingsGoal = useCallback((id: string, amount: number) => {
    setSavingsGoals(prev => prev.map(g => g.id === id ? { ...g, savedAmount: g.savedAmount + amount } : g));
  }, []);

  const addDebt = useCallback((d: Omit<Debt, 'id' | 'createdAt'>) => {
    const newDebt: Debt = { ...d, id: crypto.randomUUID(), createdAt: new Date().toISOString() };
    setDebts(prev => [newDebt, ...prev]);
    return newDebt.id;
  }, []);

  const updateDebt = useCallback((id: string, updates: Partial<Debt>) => {
    setDebts(prev => prev.map(d => d.id === id ? { ...d, ...updates } : d));
  }, []);

  const deleteDebt = useCallback((id: string) => {
    const removed = debts.find(d => d.id === id);
    setDebts(prev => prev.filter(d => d.id !== id));
    if (removed) {
      toast('Debt deleted', {
        action: { label: 'Undo', onClick: () => setDebts(p => [removed, ...p]) },
      });
    }
  }, [debts]);

  const importData = useCallback((data: ExportData, mode: 'replace' | 'merge') => {
    if (mode === 'replace') {
      setTransactions(data.transactions);
      setCategories(data.categories);
      setPaymentMethods(data.paymentMethods);
      setBudgets(data.budgets);
      setRecurringTransactions(data.recurringTransactions);
      setSavingsGoals(data.savingsGoals || []);
      setDebts(data.debts || []);
    } else {
      const mergeById = <T extends { id: string }>(existing: T[], incoming: T[]): T[] => {
        const ids = new Set(existing.map(i => i.id));
        return [...existing, ...incoming.filter(i => !ids.has(i.id))];
      };
      setTransactions(prev => mergeById(prev, data.transactions));
      setCategories(prev => mergeById(prev, data.categories));
      setPaymentMethods(prev => mergeById(prev, data.paymentMethods));
      setBudgets(prev => mergeById(prev, data.budgets));
      setRecurringTransactions(prev => mergeById(prev, data.recurringTransactions));
      setSavingsGoals(prev => mergeById(prev, data.savingsGoals || []));
      setDebts(prev => mergeById(prev, data.debts || []));
    }
  }, []);

  const getBalance = useCallback(() => {
    const income = transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const expense = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    return { income, expense, net: income - expense };
  }, [transactions]);

  return (
    <FinanceContext.Provider value={{
      transactions, categories, paymentMethods, budgets, recurringTransactions, savingsGoals, debts,
      budgetsWithSpent,
      addTransaction, updateTransaction, deleteTransaction,
      addCategory, deleteCategory,
      addPaymentMethod, deletePaymentMethod,
      addBudget, updateBudget, deleteBudget,
      addRecurring, updateRecurring, deleteRecurring,
      addSavingsGoal, updateSavingsGoal, deleteSavingsGoal, contributeSavingsGoal,
      addDebt, updateDebt, deleteDebt,
      importData,
      getBalance,
    }}>
      {children}
    </FinanceContext.Provider>
  );
}

export function useFinance() {
  const ctx = useContext(FinanceContext);
  if (!ctx) throw new Error('useFinance must be used within FinanceProvider');
  return ctx;
}
