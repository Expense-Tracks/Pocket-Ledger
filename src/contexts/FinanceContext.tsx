import React, { createContext, useContext, useState, useCallback, useEffect, useMemo } from 'react';
import { toast } from 'sonner';
import { startOfWeek, startOfMonth, startOfYear, endOfWeek, endOfMonth, endOfYear } from 'date-fns';
import { Transaction, Category, PaymentMethod, Budget, RecurringTransaction, SavingsGoal, Debt, Investment, SaleRecord } from '@/types/finance';
import {
  loadTransactions, saveTransactions,
  loadCategories, saveCategories,
  loadPaymentMethods, savePaymentMethods,
  loadBudgets, saveBudgets,
  loadRecurring, saveRecurring,
  loadSavingsGoals, saveSavingsGoals,
  loadDebts, saveDebts,
  loadInvestments, saveInvestments,
} from '@/lib/storage';
import { updateInvestmentPrices } from '@/lib/price-fetcher';
import { useSettings } from '@/contexts/SettingsContext';

interface FinanceContextType {
  transactions: Transaction[];
  categories: Category[];
  paymentMethods: PaymentMethod[];
  budgets: Budget[];
  recurringTransactions: RecurringTransaction[];
  savingsGoals: SavingsGoal[];
  debts: Debt[];
  investments: Investment[];
  isLoading: boolean;
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
  addInvestment: (i: Omit<Investment, 'id' | 'currentPrice' | 'history' | 'purchases'>) => void;
  updateInvestment: (id: string, i: Partial<Investment>) => void;
  deleteInvestment: (id: string) => void;
  sellInvestment: (id: string, quantity: number, sellPrice: number) => void;
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
  investments: Investment[];
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
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { settings } = useSettings(); // Call useSettings here

  useEffect(() => {
    let mounted = true;

    async function loadData() {
      try {
        if (!mounted) return;
        
        const [
          loadedTransactions,
          loadedCategories,
          loadedPaymentMethods,
          loadedBudgets,
          loadedRecurring,
          loadedSavingsGoals,
          loadedDebts,
          loadedInvestments,
        ] = await Promise.all([
          loadTransactions(),
          loadCategories(),
          loadPaymentMethods(),
          loadBudgets(),
          loadRecurring(),
          loadSavingsGoals(),
          loadDebts(),
          loadInvestments(),
        ]);

        if (!mounted) return;

        setTransactions(loadedTransactions);
        setCategories(loadedCategories);
        setPaymentMethods(loadedPaymentMethods);
        setBudgets(loadedBudgets);
        setRecurringTransactions(loadedRecurring);
        setSavingsGoals(loadedSavingsGoals);
        setDebts(loadedDebts);
        setInvestments(loadedInvestments);
      } catch (error) {
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    }

    loadData();

    return () => { mounted = false; };
  }, []);

  useEffect(() => { if (!isLoading) saveTransactions(transactions); }, [transactions, isLoading]);
  useEffect(() => { if (!isLoading) saveCategories(categories); }, [categories, isLoading]);
  useEffect(() => { if (!isLoading) savePaymentMethods(paymentMethods); }, [paymentMethods, isLoading]);
  useEffect(() => { if (!isLoading) saveBudgets(budgets); }, [budgets, isLoading]);
  useEffect(() => { if (!isLoading) saveRecurring(recurringTransactions); }, [recurringTransactions, isLoading]);
  useEffect(() => { if (!isLoading) saveSavingsGoals(savingsGoals); }, [savingsGoals, isLoading]);
  useEffect(() => { if (!isLoading) saveDebts(debts); }, [debts, isLoading]);
  useEffect(() => { if (!isLoading) saveInvestments(investments); }, [investments, isLoading]);

  useEffect(() => {
    if (isLoading) return;
    
    const now = new Date();
    now.setHours(23, 59, 59, 999);
    const generated: Transaction[] = [];
    const updates = new Map<string, { lastGenerated: string; active?: boolean }>();
    
    recurringTransactions.forEach(r => {
      if (!r.active) return;
      
      if (r.endDate && new Date(r.endDate) < now) {
        updates.set(r.id, { lastGenerated: r.lastGenerated || r.startDate, active: false });
        return;
      }
      
      let newLastGenerated = r.lastGenerated || r.startDate;
      let didGenerate = false;
      
      if (!r.lastGenerated) {
        const startDate = new Date(r.startDate);
        if (startDate <= now) {
          generated.push({
            id: crypto.randomUUID(),
            amount: r.amount,
            type: r.type,
            category: r.category,
            paymentMethod: r.paymentMethod,
            description: r.description,
            date: startDate.toISOString(),
            createdAt: new Date().toISOString(),
          });
          newLastGenerated = startDate.toISOString();
          didGenerate = true;
        }
      }
      
      let nextDate = getNextDate(newLastGenerated, r.frequency);
      while (nextDate <= now) {
        if (r.endDate && nextDate > new Date(r.endDate)) break;
        
        generated.push({
          id: crypto.randomUUID(),
          amount: r.amount,
          type: r.type,
          category: r.category,
          paymentMethod: r.paymentMethod,
          description: r.description,
          date: nextDate.toISOString(),
          createdAt: new Date().toISOString(),
        });
        newLastGenerated = nextDate.toISOString();
        didGenerate = true;
        nextDate = getNextDate(newLastGenerated, r.frequency);
      }
      
      if (didGenerate) {
        updates.set(r.id, { lastGenerated: newLastGenerated });
      }
    });
    
    if (updates.size > 0 || generated.length > 0) {
      if (generated.length > 0) {
        setTransactions(prev => [...generated, ...prev]);
      }
      if (updates.size > 0) {
        setRecurringTransactions(prev =>
          prev.map(r => {
            const update = updates.get(r.id);
            return update ? { ...r, ...update } : r;
          })
        );
      }
    }
  }, [isLoading, recurringTransactions]);

  useEffect(() => {
    if (isLoading || investments.length === 0) return;

    const now = new Date();
    const oneDay = 24 * 60 * 60 * 1000;

    const needsUpdate = investments.some(inv => {
      if (!inv.lastUpdated) return true;
      return (now.getTime() - new Date(inv.lastUpdated).getTime()) >= oneDay;
    });

    if (!needsUpdate) return;

    async function updatePrices() {
      const investmentsNeedingUpdate = investments.filter(inv => {
        if (!inv.lastUpdated) return true;
        return (now.getTime() - new Date(inv.lastUpdated).getTime()) >= oneDay;
      });
      
      if (investmentsNeedingUpdate.length === 0) return;
      
      const updatedInvestments = await updateInvestmentPrices(investmentsNeedingUpdate, settings.currency.code);
      
      setInvestments(prev => prev.map(inv => {
        const updated = updatedInvestments.find(u => u.id === inv.id);
        return updated || inv;
      }));
    }

    updatePrices();
  }, [isLoading, investments, settings.currency.code]);

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
    const t = transactions.find(x => x.id === id);
    if (t) {
      toast('Transaction deleted', {
        action: { label: 'Undo', onClick: () => setTransactions(p => [t, ...p]) },
      });
    }
    setTransactions(prev => prev.filter(x => x.id !== id));
  }, [transactions]);

  const addCategory = useCallback((c: Omit<Category, 'id' | 'isDefault'>) => {
    setCategories(prev => [...prev, { ...c, id: crypto.randomUUID(), isDefault: false }]);
  }, []);

  const deleteCategory = useCallback((id: string) => {
    const removed = categories.find(c => c.id === id && !c.isDefault);
    if (!removed) {
      setCategories(prev => prev.filter(c => c.id !== id || c.isDefault));
      return;
    }
    const affectedTxnIds = transactions.filter(t => t.category === id).map(t => t.id);
    setCategories(prev => prev.filter(c => c.id !== id || c.isDefault));
    setTransactions(prev => prev.map(t => t.category === id ? { ...t, category: 'uncategorized' } : t));
    toast('Category deleted', {
      action: {
        label: 'Undo',
        onClick: () => {
          setCategories(p => [...p, removed]);
          setTransactions(p => p.map(t => affectedTxnIds.includes(t.id) ? { ...t, category: id } : t));
        },
      },
    });
  }, [categories, transactions]);

  const addPaymentMethod = useCallback((p: Omit<PaymentMethod, 'id' | 'isDefault'>) => {
    setPaymentMethods(prev => [...prev, { ...p, id: crypto.randomUUID(), isDefault: false }]);
  }, []);

  const deletePaymentMethod = useCallback((id: string) => {
    const removed = paymentMethods.find(p => p.id === id && !p.isDefault);
    if (!removed) {
      setPaymentMethods(prev => prev.filter(p => p.id !== id || p.isDefault));
      return;
    }
    const affectedTxnIds = transactions.filter(t => t.paymentMethod === id).map(t => t.id);
    setPaymentMethods(prev => prev.filter(p => p.id !== id || p.isDefault));
    setTransactions(prev => prev.map(t => t.paymentMethod === id ? { ...t, paymentMethod: 'other' } : t));
    toast('Payment method deleted', {
      action: {
        label: 'Undo',
        onClick: () => {
          setPaymentMethods(p => [...p, removed]);
          setTransactions(p => p.map(t => affectedTxnIds.includes(t.id) ? { ...t, paymentMethod: id } : t));
        },
      },
    });
  }, [paymentMethods, transactions]);

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
    const id = crypto.randomUUID();
    const now = new Date();
    now.setHours(23, 59, 59, 999);
    const startDate = new Date(r.startDate);

    if (r.active && startDate <= now) {
      const generated: Transaction[] = [];
      let lastGen = r.startDate;

      generated.push({
        id: crypto.randomUUID(),
        amount: r.amount,
        type: r.type,
        category: r.category,
        paymentMethod: r.paymentMethod,
        description: r.description,
        date: startDate.toISOString(),
        createdAt: new Date().toISOString(),
      });

      let nextDate = getNextDate(lastGen, r.frequency);
      while (nextDate <= now) {
        if (r.endDate && nextDate > new Date(r.endDate)) break;
        generated.push({
          id: crypto.randomUUID(),
          amount: r.amount,
          type: r.type,
          category: r.category,
          paymentMethod: r.paymentMethod,
          description: r.description,
          date: nextDate.toISOString(),
          createdAt: new Date().toISOString(),
        });
        lastGen = nextDate.toISOString();
        nextDate = getNextDate(lastGen, r.frequency);
      }

      setTransactions(prev => [...generated, ...prev]);
      setRecurringTransactions(prev => [...prev, { ...r, id, lastGenerated: lastGen }]);
    } else {
      setRecurringTransactions(prev => [...prev, { ...r, id }]);
    }
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

  const addInvestment = useCallback((i: Omit<Investment, 'id' | 'currentPrice' | 'history' | 'lastUpdated' | 'purchases'>) => {
    const existingInvestment = investments.find(inv => {
      if (inv.type !== i.type) return false;
      
      if (i.type === 'crypto') {
        const newCryptoId = i.cryptoId;
        const existingCryptoId = inv.cryptoId;
        if (newCryptoId && existingCryptoId) {
          return newCryptoId.toLowerCase() === existingCryptoId.toLowerCase();
        }
      }
      return inv.symbol.toLowerCase() === i.symbol.toLowerCase();
    });

    if (existingInvestment) {
      const existingTotalCost = existingInvestment.purchasePrice * existingInvestment.quantity;
      const newTotalCost = i.purchasePrice * i.quantity;
      const totalQuantity = existingInvestment.quantity + i.quantity;
      const averagePrice = (existingTotalCost + newTotalCost) / totalQuantity;

      const newPurchaseRecord = {
        date: i.purchaseDate,
        quantity: i.quantity,
        price: i.purchasePrice,
        totalCost: newTotalCost,
      };

      // Update the existing investment
      setInvestments(prev => prev.map(inv => {
        if (inv.id === existingInvestment.id) {
          return {
            ...inv,
            quantity: totalQuantity,
            purchasePrice: averagePrice,
            purchaseDate: i.purchaseDate, // Update to most recent purchase date
            purchases: [...(inv.purchases || []), newPurchaseRecord],
          };
        }
        return inv;
      }));

      toast.success(`Added ${i.quantity} ${i.symbol} to existing investment`, {
        description: `New average price: ${averagePrice.toFixed(2)}`,
      });
    } else {
      // Create new investment entry
      const initialPurchaseRecord = {
        date: i.purchaseDate,
        quantity: i.quantity,
        price: i.purchasePrice,
        totalCost: i.purchasePrice * i.quantity,
      };

      const newInvestment: Investment = {
        ...i,
        id: crypto.randomUUID(),
        currentPrice: i.purchasePrice,
        history: [{ date: new Date().toISOString(), price: i.purchasePrice }],
        purchases: [initialPurchaseRecord],
      };
      setInvestments(prev => [newInvestment, ...prev]);
    }
  }, [investments]);

  const updateInvestment = useCallback((id: string, updates: Partial<Investment>) => {
    setInvestments(prev => prev.map(i => i.id === id ? { ...i, ...updates } : i));
  }, []);

  const deleteInvestment = useCallback((id: string) => {
    const removed = investments.find(i => i.id === id);
    setInvestments(prev => prev.filter(i => i.id !== id));
    if (removed) {
      toast('Investment deleted', {
        action: { label: 'Undo', onClick: () => setInvestments(p => [removed, ...p]) },
      });
    }
  }, [investments]);

  const sellInvestment = useCallback((id: string, quantity: number, sellPrice: number) => {
    const investment = investments.find(i => i.id === id);
    if (!investment) {
      toast.error('Investment not found');
      return;
    }

    if (quantity > investment.quantity) {
      toast.error(`Cannot sell more than you own (${investment.quantity} ${investment.symbol})`);
      return;
    }

    const multiplier = investment.type === 'stock' && investment.exchange === 'JKT' ? 100 : 1;
    const totalRevenue = quantity * sellPrice * multiplier;
    const profitLoss = (sellPrice - investment.purchasePrice) * quantity * multiplier;
    
    const transactionId = addTransaction({
      amount: totalRevenue,
      type: 'income',
      category: 'investment',
      paymentMethod: 'transfer',
      description: `Sold ${quantity} ${investment.symbol} @ ${sellPrice}`,
      date: new Date().toISOString(),
    });

    // Create sale record
    const saleRecord: SaleRecord = {
      date: new Date().toISOString(),
      quantity,
      price: sellPrice,
      totalRevenue,
      profitLoss,
      transactionId,
    };

    const newQuantity = investment.quantity - quantity;
    
    if (newQuantity === 0) {
      // Sold all - delete investment but keep sale record
      setInvestments(prev => prev.filter(i => i.id !== id));
      toast.success(`Sold all ${investment.symbol}`, {
        description: `Profit/Loss: ${profitLoss >= 0 ? '+' : ''}${profitLoss.toFixed(2)}`,
      });
    } else {
      // Partial sale - update investment
      setInvestments(prev => prev.map(inv => {
        if (inv.id === id) {
          return {
            ...inv,
            quantity: newQuantity,
            sales: [...(inv.sales || []), saleRecord],
          };
        }
        return inv;
      }));
      
      toast.success(`Sold ${quantity} ${investment.symbol}`, {
        description: `Profit/Loss: ${profitLoss >= 0 ? '+' : ''}${profitLoss.toFixed(2)}`,
      });
    }
  }, [investments, addTransaction]);

  const importData = useCallback((data: ExportData, mode: 'replace' | 'merge') => {
    if (mode === 'replace') {
      setTransactions(data.transactions);
      setCategories(data.categories);
      setPaymentMethods(data.paymentMethods);
      setBudgets(data.budgets);
      setRecurringTransactions(data.recurringTransactions);
      setSavingsGoals(data.savingsGoals || []);
      setDebts(data.debts || []);
      setInvestments(data.investments || []);
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
      setInvestments(prev => mergeById(prev, data.investments || []));
    }
  }, []);

  const getBalance = useCallback(() => {
    const income = transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const expense = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    return { income, expense, net: income - expense };
  }, [transactions]);

  if (isLoading) {
    return (
      <FinanceContext.Provider value={{
        transactions: [], categories: [], paymentMethods: [], budgets: [],
        recurringTransactions: [], savingsGoals: [], debts: [], investments: [], isLoading: true,
        budgetsWithSpent: [],
        addTransaction: () => '', updateTransaction: () => {}, deleteTransaction: () => {},
        addCategory: () => {}, deleteCategory: () => {},
        addPaymentMethod: () => {}, deletePaymentMethod: () => {},
        addBudget: () => {}, updateBudget: () => {}, deleteBudget: () => {},
        addRecurring: () => {}, updateRecurring: () => {}, deleteRecurring: () => {},
        addSavingsGoal: () => {}, updateSavingsGoal: () => {}, deleteSavingsGoal: () => {},
        contributeSavingsGoal: () => {},
        addDebt: () => '', updateDebt: () => {}, deleteDebt: () => {},
        addInvestment: () => {}, updateInvestment: () => {}, deleteInvestment: () => {}, sellInvestment: () => {},
        importData: () => {}, getBalance: () => ({ income: 0, expense: 0, net: 0 }),
      }}>
        {children}
      </FinanceContext.Provider>
    );
  }

  return (
    <FinanceContext.Provider value={{
      transactions, categories, paymentMethods, budgets, recurringTransactions, savingsGoals, debts, investments, isLoading,
      budgetsWithSpent,
      addTransaction, updateTransaction, deleteTransaction,
      addCategory, deleteCategory,
      addPaymentMethod, deletePaymentMethod,
      addBudget, updateBudget, deleteBudget,
      addRecurring, updateRecurring, deleteRecurring,
      addSavingsGoal, updateSavingsGoal, deleteSavingsGoal, contributeSavingsGoal,
      addDebt, updateDebt, deleteDebt,
      addInvestment, updateInvestment, deleteInvestment, sellInvestment,
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
