import { Transaction, Category, PaymentMethod, Budget, RecurringTransaction, SavingsGoal, Debt, DEFAULT_CATEGORIES, DEFAULT_PAYMENT_METHODS } from '@/types/finance';

const KEYS = {
  transactions: 'finance_transactions',
  categories: 'finance_categories',
  paymentMethods: 'finance_payment_methods',
  budgets: 'finance_budgets',
  recurring: 'finance_recurring',
  debts: 'finance_debts',
};

function load<T>(key: string, fallback: T): T {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : fallback;
  } catch {
    return fallback;
  }
}

function save<T>(key: string, data: T): void {
  localStorage.setItem(key, JSON.stringify(data));
}

export function loadTransactions(): Transaction[] {
  return load<Transaction[]>(KEYS.transactions, []);
}
export function saveTransactions(t: Transaction[]) { save(KEYS.transactions, t); }

export function loadCategories(): Category[] {
  return load<Category[]>(KEYS.categories, DEFAULT_CATEGORIES);
}
export function saveCategories(c: Category[]) { save(KEYS.categories, c); }

export function loadPaymentMethods(): PaymentMethod[] {
  return load<PaymentMethod[]>(KEYS.paymentMethods, DEFAULT_PAYMENT_METHODS);
}
export function savePaymentMethods(p: PaymentMethod[]) { save(KEYS.paymentMethods, p); }

export function loadBudgets(): Budget[] {
  return load<Budget[]>(KEYS.budgets, []);
}
export function saveBudgets(b: Budget[]) { save(KEYS.budgets, b); }

export function loadRecurring(): RecurringTransaction[] {
  return load<RecurringTransaction[]>(KEYS.recurring, []);
}
export function saveRecurring(r: RecurringTransaction[]) { save(KEYS.recurring, r); }
export function loadSavingsGoals(): SavingsGoal[] {
  return load<SavingsGoal[]>('finance_savings_goals', []);
}
export function saveSavingsGoals(g: SavingsGoal[]) { save('finance_savings_goals', g); }

export function loadDebts(): Debt[] {
  return load<Debt[]>(KEYS.debts, []);
}
export function saveDebts(d: Debt[]) { save(KEYS.debts, d); }
