import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { toast } from 'sonner';
import { Transaction, Category, PaymentMethod, Budget, RecurringTransaction } from '@/types/finance';
import {
  loadTransactions, saveTransactions,
  loadCategories, saveCategories,
  loadPaymentMethods, savePaymentMethods,
  loadBudgets, saveBudgets,
  loadRecurring, saveRecurring,
} from '@/lib/storage';

interface FinanceContextType {
  transactions: Transaction[];
  categories: Category[];
  paymentMethods: PaymentMethod[];
  budgets: Budget[];
  recurringTransactions: RecurringTransaction[];
  addTransaction: (t: Omit<Transaction, 'id' | 'createdAt'>) => void;
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
  importData: (data: ExportData, mode: 'replace' | 'merge') => void;
  getBalance: () => { income: number; expense: number; net: number };
}

export interface ExportData {
  version: 1;
  exportedAt: string;
  transactions: Transaction[];
  categories: Category[];
  paymentMethods: PaymentMethod[];
  budgets: Budget[];
  recurringTransactions: RecurringTransaction[];
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
  const [hydrated, setHydrated] = useState(false);

  // Defer localStorage reads so they don't block first paint
  useEffect(() => {
    setTransactions(loadTransactions());
    setCategories(loadCategories());
    setPaymentMethods(loadPaymentMethods());
    setBudgets(loadBudgets());
    setRecurringTransactions(loadRecurring());
    setHydrated(true);
  }, []);

  // Only persist after initial hydration to avoid overwriting with empty arrays
  useEffect(() => { if (hydrated) saveTransactions(transactions); }, [transactions, hydrated]);
  useEffect(() => { if (hydrated) saveCategories(categories); }, [categories, hydrated]);
  useEffect(() => { if (hydrated) savePaymentMethods(paymentMethods); }, [paymentMethods, hydrated]);
  useEffect(() => { if (hydrated) saveBudgets(budgets); }, [budgets, hydrated]);
  useEffect(() => { if (hydrated) saveRecurring(recurringTransactions); }, [recurringTransactions, hydrated]);

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

  const addTransaction = useCallback((t: Omit<Transaction, 'id' | 'createdAt'>) => {
    const newT: Transaction = { ...t, id: crypto.randomUUID(), createdAt: new Date().toISOString() };
    setTransactions(prev => [newT, ...prev]);
    if (t.type === 'expense') {
      setBudgets(prev => prev.map(b => b.category === t.category ? { ...b, spent: b.spent + t.amount } : b));
    }
  }, []);

  const updateTransaction = useCallback((id: string, updates: Partial<Transaction>) => {
    setTransactions(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
  }, []);

  const deleteTransaction = useCallback((id: string) => {
    setTransactions(prev => {
      const t = prev.find(x => x.id === id);
      if (t && t.type === 'expense') {
        setBudgets(bs => bs.map(b => b.category === t.category ? { ...b, spent: Math.max(0, b.spent - t.amount) } : b));
      }
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

  const importData = useCallback((data: ExportData, mode: 'replace' | 'merge') => {
    if (mode === 'replace') {
      setTransactions(data.transactions);
      setCategories(data.categories);
      setPaymentMethods(data.paymentMethods);
      setBudgets(data.budgets);
      setRecurringTransactions(data.recurringTransactions);
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
    }
  }, []);

  const getBalance = useCallback(() => {
    const income = transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const expense = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    return { income, expense, net: income - expense };
  }, [transactions]);

  return (
    <FinanceContext.Provider value={{
      transactions, categories, paymentMethods, budgets, recurringTransactions,
      addTransaction, updateTransaction, deleteTransaction,
      addCategory, deleteCategory,
      addPaymentMethod, deletePaymentMethod,
      addBudget, updateBudget, deleteBudget,
      addRecurring, updateRecurring, deleteRecurring,
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
