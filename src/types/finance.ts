export type TransactionType = 'income' | 'expense';

export interface Transaction {
  id: string;
  amount: number;
  type: TransactionType;
  category: string;
  paymentMethod: string;
  description: string;
  date: string; // ISO string
  createdAt: string;
}

export interface Category {
  id: string;
  name: string;
  type: TransactionType;
  icon: string;
  isDefault: boolean;
}

export interface PaymentMethod {
  id: string;
  name: string;
  icon: string;
  isDefault: boolean;
}

export interface Budget {
  id: string;
  category: string;
  amount: number;
  period: 'weekly' | 'monthly' | 'yearly';
  spent: number;
}

export interface RecurringTransaction {
  id: string;
  amount: number;
  type: TransactionType;
  category: string;
  paymentMethod: string;
  description: string;
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  startDate: string;
  endDate?: string;
  lastGenerated?: string;
  active: boolean;
}

export interface SavingsGoal {
  id: string;
  name: string;
  icon: string;
  targetAmount: number;
  savedAmount: number;
  targetDate: string; // ISO string
  createdAt: string;
}

export const DEFAULT_CATEGORIES: Category[] = [
  { id: 'groceries', name: 'Groceries', type: 'expense', icon: '🛒', isDefault: true },
  { id: 'transport', name: 'Transportation', type: 'expense', icon: '🚗', isDefault: true },
  { id: 'utilities', name: 'Utilities', type: 'expense', icon: '💡', isDefault: true },
  { id: 'entertainment', name: 'Entertainment', type: 'expense', icon: '🎬', isDefault: true },
  { id: 'healthcare', name: 'Healthcare', type: 'expense', icon: '🏥', isDefault: true },
  { id: 'dining', name: 'Dining', type: 'expense', icon: '🍽️', isDefault: true },
  { id: 'shopping', name: 'Shopping', type: 'expense', icon: '🛍️', isDefault: true },
  { id: 'salary', name: 'Salary', type: 'income', icon: '💰', isDefault: true },
  { id: 'freelance', name: 'Freelance', type: 'income', icon: '💻', isDefault: true },
  { id: 'investment', name: 'Investment', type: 'income', icon: '📈', isDefault: true },
  { id: 'gift', name: 'Gift', type: 'income', icon: '🎁', isDefault: true },
  { id: 'uncategorized', name: 'Uncategorized', type: 'expense', icon: '📋', isDefault: true },
];

export const DEFAULT_PAYMENT_METHODS: PaymentMethod[] = [
  { id: 'cash', name: 'Cash', icon: '💵', isDefault: true },
  { id: 'credit', name: 'Credit Card', icon: '💳', isDefault: true },
  { id: 'debit', name: 'Debit Card', icon: '🏦', isDefault: true },
  { id: 'transfer', name: 'Bank Transfer', icon: '🏧', isDefault: true },
  { id: 'digital', name: 'Digital Wallet', icon: '📱', isDefault: true },
  { id: 'other', name: 'Other', icon: '📋', isDefault: true },
];
