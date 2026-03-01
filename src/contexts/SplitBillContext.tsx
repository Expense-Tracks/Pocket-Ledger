import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { SplitBill } from '@/types/splitbill';
import { loadSplitBills, saveSplitBills } from '@/lib/storage';

interface SplitBillContextType {
  bills: SplitBill[];
  addBill: (bill: Omit<SplitBill, 'id' | 'createdAt'>) => void;
  updateBill: (id: string, bill: Partial<SplitBill>) => void;
  deleteBill: (id: string) => void;
}

const SplitBillContext = createContext<SplitBillContextType | undefined>(undefined);

export function useSplitBill() {
  const context = useContext(SplitBillContext);
  if (!context) throw new Error('useSplitBill must be used within SplitBillProvider');
  return context;
}

export function SplitBillProvider({ children }: { children: ReactNode }) {
  const [bills, setBills] = useState<SplitBill[]>([]);

  useEffect(() => {
    loadSplitBills().then(setBills).catch(console.error);
  }, []);

  useEffect(() => {
    saveSplitBills(bills).catch(console.error);
  }, [bills]);

  const addBill = (bill: Omit<SplitBill, 'id' | 'createdAt'>) => {
    const newBill: SplitBill = {
      ...bill,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    setBills(prev => [newBill, ...prev]);
  };

  const updateBill = (id: string, updates: Partial<SplitBill>) => {
    setBills(prev => prev.map(b => b.id === id ? { ...b, ...updates } : b));
  };

  const deleteBill = (id: string) => {
    setBills(prev => prev.filter(b => b.id !== id));
  };

  return (
    <SplitBillContext.Provider value={{ bills, addBill, updateBill, deleteBill }}>
      {children}
    </SplitBillContext.Provider>
  );
}
