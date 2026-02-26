export interface AppSettings {
  currency: CurrencyOption;
  theme: 'light' | 'dark' | 'system';
  language: string;
  dateFormat: 'MM/dd/yyyy' | 'dd/MM/yyyy' | 'yyyy-MM-dd';
  defaultTransactionType: 'income' | 'expense';
  notifications: boolean;
  hideAmounts: boolean;
  biometricEnabled: boolean;
}

export interface CurrencyOption {
  code: string;
  symbol: string;
  name: string;
  position: 'before' | 'after';
}

export const CURRENCIES: CurrencyOption[] = [
  { code: 'USD', symbol: '$', name: 'US Dollar', position: 'before' },
  { code: 'EUR', symbol: '€', name: 'Euro', position: 'before' },
  { code: 'GBP', symbol: '£', name: 'British Pound', position: 'before' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen', position: 'before' },
  { code: 'CNY', symbol: '¥', name: 'Chinese Yuan', position: 'before' },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee', position: 'before' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar', position: 'before' },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar', position: 'before' },
  { code: 'CHF', symbol: 'Fr', name: 'Swiss Franc', position: 'before' },
  { code: 'BRL', symbol: 'R$', name: 'Brazilian Real', position: 'before' },
  { code: 'MXN', symbol: '$', name: 'Mexican Peso', position: 'before' },
  { code: 'ZAR', symbol: 'R', name: 'South African Rand', position: 'before' },
  { code: 'KRW', symbol: '₩', name: 'South Korean Won', position: 'before' },
  { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar', position: 'before' },
  { code: 'IDR', symbol: 'Rp', name: 'Indonesian Rupiah', position: 'before' },
];

export const DEFAULT_SETTINGS: AppSettings = {
  currency: CURRENCIES[0], // USD
  theme: 'system',
  language: 'en',
  dateFormat: 'MM/dd/yyyy',
  defaultTransactionType: 'expense',
  notifications: true,
  hideAmounts: false,
  biometricEnabled: false,
};
