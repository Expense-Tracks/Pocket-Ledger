import React, { createContext, useContext, useState, useEffect } from 'react';
import { AppSettings, DEFAULT_SETTINGS, CurrencyOption } from '@/types/settings';

interface SettingsContextType {
  settings: AppSettings;
  updateSettings: (updates: Partial<AppSettings>) => void;
  formatCurrency: (amount: number, forceShow?: boolean) => string;
  resetSettings: () => void;
}

const SettingsContext = createContext<SettingsContextType | null>(null);

const SETTINGS_KEY = 'app_settings';

function loadSettings(): AppSettings {
  try {
    const stored = localStorage.getItem(SETTINGS_KEY);
    if (stored) {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
    }
  } catch (error) {
    console.error('Failed to load settings:', error);
  }
  return DEFAULT_SETTINGS;
}

function saveSettings(settings: AppSettings): void {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (error) {
    console.error('Failed to save settings:', error);
  }
}

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>(() => loadSettings());
  const [hydrated] = useState(true);

  // Apply theme on mount and when it changes
  useEffect(() => {
    const applyTheme = () => {
      const root = document.documentElement;

      if (settings.theme === 'system') {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        root.classList.toggle('dark', prefersDark);
      } else {
        root.classList.toggle('dark', settings.theme === 'dark');
      }
    };

    applyTheme();

    if (settings.theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handler = () => applyTheme();
      mediaQuery.addEventListener('change', handler);
      return () => mediaQuery.removeEventListener('change', handler);
    }
  }, [settings.theme]);

  // Only persist after initial hydration
  useEffect(() => {
    if (hydrated) saveSettings(settings);
  }, [settings, hydrated]);

  const updateSettings = (updates: Partial<AppSettings>) => {
    setSettings(prev => ({ ...prev, ...updates }));
  };

  const formatCurrency = (amount: number, forceShow = false): string => {
    if (settings.hideAmounts && !forceShow) {
      return '****';
    }
    const { symbol, position } = settings.currency;
    const formatted = amount.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    return position === 'before' ? `${symbol}${formatted}` : `${formatted}${symbol}`;
  };

  const resetSettings = () => {
    setSettings(DEFAULT_SETTINGS);
  };

  return (
    <SettingsContext.Provider value={{ settings, updateSettings, formatCurrency, resetSettings }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings must be used within SettingsProvider');
  return ctx;
}
