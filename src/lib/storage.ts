import { Transaction, Category, PaymentMethod, Budget, RecurringTransaction, SavingsGoal, Debt, DEFAULT_CATEGORIES, DEFAULT_PAYMENT_METHODS } from '@/types/finance';

const DB_NAME = 'pocket-ledger';
const DB_VERSION = 1;
const MIGRATION_KEY = 'pocket-ledger-migrated';

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
    };
  });
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

const LOCAL_STORAGE_KEYS = {
  transactions: 'finance_transactions',
  categories: 'finance_categories',
  paymentMethods: 'finance_payment_methods',
  budgets: 'finance_budgets',
  recurring: 'finance_recurring',
  savingsGoals: 'finance_savings_goals',
  debts: 'finance_debts',
};

function loadFromLocalStorage<T>(key: string, fallback: T): T {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : fallback;
  } catch {
    return fallback;
  }
}

export async function migrateFromLocalStorage(): Promise<boolean> {
  const alreadyMigrated = localStorage.getItem(MIGRATION_KEY);
  if (alreadyMigrated) return false;

  const localTransactions = loadFromLocalStorage<Transaction[]>(LOCAL_STORAGE_KEYS.transactions, []);
  const localCategories = loadFromLocalStorage<Category[]>(LOCAL_STORAGE_KEYS.categories, DEFAULT_CATEGORIES);
  const localPaymentMethods = loadFromLocalStorage<PaymentMethod[]>(LOCAL_STORAGE_KEYS.paymentMethods, DEFAULT_PAYMENT_METHODS);
  const localBudgets = loadFromLocalStorage<Budget[]>(LOCAL_STORAGE_KEYS.budgets, []);
  const localRecurring = loadFromLocalStorage<RecurringTransaction[]>(LOCAL_STORAGE_KEYS.recurring, []);
  const localSavingsGoals = loadFromLocalStorage<SavingsGoal[]>(LOCAL_STORAGE_KEYS.savingsGoals, []);
  const localDebts = loadFromLocalStorage<Debt[]>(LOCAL_STORAGE_KEYS.debts, []);

  await Promise.all([
    putAll('transactions', localTransactions),
    putAll('categories', localCategories),
    putAll('paymentMethods', localPaymentMethods),
    putAll('budgets', localBudgets),
    putAll('recurring', localRecurring),
    putAll('savingsGoals', localSavingsGoals),
    putAll('debts', localDebts),
  ]);

  Object.values(LOCAL_STORAGE_KEYS).forEach(key => {
    localStorage.removeItem(key);
  });
  localStorage.setItem(MIGRATION_KEY, 'true');

  return true;
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
