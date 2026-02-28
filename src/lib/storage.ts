import { Transaction, Category, PaymentMethod, Budget, RecurringTransaction, SavingsGoal, Debt, Investment, DEFAULT_CATEGORIES, DEFAULT_PAYMENT_METHODS } from '@/types/finance';

const DB_NAME = 'pocket-ledger';
const DB_VERSION = 2;

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains('transactions')) {
        db.createObjectStore('transactions', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('categories')) {
        db.createObjectStore('categories', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('paymentMethods')) {
        db.createObjectStore('paymentMethods', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('budgets')) {
        db.createObjectStore('budgets', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('recurring')) {
        db.createObjectStore('recurring', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('savingsGoals')) {
        db.createObjectStore('savingsGoals', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('debts')) {
        db.createObjectStore('debts', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('investments')) {
        db.createObjectStore('investments', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('exchangeRates')) {
        // We'll store a single object for exchange rates, keyed by a constant like 'USD' as base
        db.createObjectStore('exchangeRates', { keyPath: 'baseCurrency' });
      }
    };
  });
}

export interface ExchangeRatesCache {
  baseCurrency: string; // e.g., 'USD'
  rates: { [currencyCode: string]: number }; // e.g., { 'EUR': 0.92, 'JPY': 130 }
  timestamp: string; // ISO string of when rates were last fetched
}

async function getAll<T>(storeName: string): Promise<T[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function putAll<T>(storeName: string, items: T[]): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    store.clear();
    items.forEach(item => store.put(item));
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function loadTransactions(): Promise<Transaction[]> {
  try {
    return await getAll<Transaction>('transactions');
  } catch {
    return [];
  }
}

export async function saveTransactions(t: Transaction[]): Promise<void> {
  await putAll('transactions', t);
}

export async function loadCategories(): Promise<Category[]> {
  try {
    const data = await getAll<Category>('categories');
    return data.length > 0 ? data : DEFAULT_CATEGORIES;
  } catch {
    return DEFAULT_CATEGORIES;
  }
}

export async function saveCategories(c: Category[]): Promise<void> {
  await putAll('categories', c);
}

export async function loadPaymentMethods(): Promise<PaymentMethod[]> {
  try {
    const data = await getAll<PaymentMethod>('paymentMethods');
    return data.length > 0 ? data : DEFAULT_PAYMENT_METHODS;
  } catch {
    return DEFAULT_PAYMENT_METHODS;
  }
}

export async function savePaymentMethods(p: PaymentMethod[]): Promise<void> {
  await putAll('paymentMethods', p);
}

export async function loadBudgets(): Promise<Budget[]> {
  try {
    return await getAll<Budget>('budgets');
  } catch {
    return [];
  }
}

export async function saveBudgets(b: Budget[]): Promise<void> {
  await putAll('budgets', b);
}

export async function loadRecurring(): Promise<RecurringTransaction[]> {
  try {
    return await getAll<RecurringTransaction>('recurring');
  } catch {
    return [];
  }
}

export async function saveRecurring(r: RecurringTransaction[]): Promise<void> {
  await putAll('recurring', r);
}

export async function loadSavingsGoals(): Promise<SavingsGoal[]> {
  try {
    return await getAll<SavingsGoal>('savingsGoals');
  } catch {
    return [];
  }
}

export async function saveSavingsGoals(g: SavingsGoal[]): Promise<void> {
  await putAll('savingsGoals', g);
}

export async function loadDebts(): Promise<Debt[]> {
  try {
    return await getAll<Debt>('debts');
  } catch {
    return [];
  }
}

export async function saveDebts(d: Debt[]): Promise<void> {
  await putAll('debts', d);
}

export async function loadInvestments(): Promise<Investment[]> {
  try {
    return await getAll<Investment>('investments');
  } catch {
    return [];
  }
}

export async function saveInvestments(i: Investment[]): Promise<void> {
  await putAll('investments', i);
}

export async function loadExchangeRates(): Promise<ExchangeRatesCache | null> {
  const db = await openDB();
  return new Promise((resolve) => {
    const tx = db.transaction('exchangeRates', 'readonly');
    const store = tx.objectStore('exchangeRates');
    const request = store.get('USD'); // We assume USD is always our base currency for fetching
    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => {
      resolve(null);
    };
  });
}

export async function saveExchangeRates(cache: ExchangeRatesCache): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('exchangeRates', 'readwrite');
    const store = tx.objectStore('exchangeRates');
    store.put(cache);
    tx.oncomplete = () => resolve();
    tx.onerror = () => {
      reject(tx.error);
    };
  });
}

