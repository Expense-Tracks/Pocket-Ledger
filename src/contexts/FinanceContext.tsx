import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { Transaction, Category, PaymentMethod, Budget } from '@/types/finance';
import {
  loadTransactions, saveTransactions,
  loadCategories, saveCategories,
  loadPaymentMethods, savePaymentMethods,
  loadBudgets, saveBudgets,
} from '@/lib/storage';

interface FinanceContextType {
  transactions: Transaction[];
  categories: Category[];
  paymentMethods: PaymentMethod[];
  budgets: Budget[];
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
  getBalance: () => { income: number; expense: number; net: number };
}

const FinanceContext = createContext<FinanceContextType | null>(null);

export function FinanceProvider({ children }: { children: React.ReactNode }) {
  const [transactions, setTransactions] = useState<Transaction[]>(loadTransactions);
  const [categories, setCategories] = useState<Category[]>(loadCategories);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>(loadPaymentMethods);
  const [budgets, setBudgets] = useState<Budget[]>(loadBudgets);

  useEffect(() => { saveTransactions(transactions); }, [transactions]);
  useEffect(() => { saveCategories(categories); }, [categories]);
  useEffect(() => { savePaymentMethods(paymentMethods); }, [paymentMethods]);
  useEffect(() => { saveBudgets(budgets); }, [budgets]);

  const addTransaction = useCallback((t: Omit<Transaction, 'id' | 'createdAt'>) => {
    const newT: Transaction = { ...t, id: crypto.randomUUID(), createdAt: new Date().toISOString() };
    setTransactions(prev => [newT, ...prev]);
    // Update budget spent
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
      return prev.filter(x => x.id !== id);
    });
  }, []);

  const addCategory = useCallback((c: Omit<Category, 'id' | 'isDefault'>) => {
    setCategories(prev => [...prev, { ...c, id: crypto.randomUUID(), isDefault: false }]);
  }, []);

  const deleteCategory = useCallback((id: string) => {
    setCategories(prev => prev.filter(c => c.id !== id || c.isDefault));
    setTransactions(prev => prev.map(t => t.category === id ? { ...t, category: 'uncategorized' } : t));
  }, []);

  const addPaymentMethod = useCallback((p: Omit<PaymentMethod, 'id' | 'isDefault'>) => {
    setPaymentMethods(prev => [...prev, { ...p, id: crypto.randomUUID(), isDefault: false }]);
  }, []);

  const deletePaymentMethod = useCallback((id: string) => {
    setPaymentMethods(prev => prev.filter(p => p.id !== id || p.isDefault));
    setTransactions(prev => prev.map(t => t.paymentMethod === id ? { ...t, paymentMethod: 'other' } : t));
  }, []);

  const addBudget = useCallback((b: Omit<Budget, 'id' | 'spent'>) => {
    setBudgets(prev => [...prev, { ...b, id: crypto.randomUUID(), spent: 0 }]);
  }, []);

  const updateBudget = useCallback((id: string, updates: Partial<Budget>) => {
    setBudgets(prev => prev.map(b => b.id === id ? { ...b, ...updates } : b));
  }, []);

  const deleteBudget = useCallback((id: string) => {
    setBudgets(prev => prev.filter(b => b.id !== id));
  }, []);

  const getBalance = useCallback(() => {
    const income = transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const expense = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    return { income, expense, net: income - expense };
  }, [transactions]);

  return (
    <FinanceContext.Provider value={{
      transactions, categories, paymentMethods, budgets,
      addTransaction, updateTransaction, deleteTransaction,
      addCategory, deleteCategory,
      addPaymentMethod, deletePaymentMethod,
      addBudget, updateBudget, deleteBudget,
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
