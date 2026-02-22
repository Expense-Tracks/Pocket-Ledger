import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { FinanceProvider } from "@/contexts/FinanceContext";
import { SettingsProvider } from "@/contexts/SettingsContext";
import { BottomNav } from "@/components/BottomNav";
import { useSwUpdate } from "@/hooks/use-sw-update";

import Dashboard from "./pages/Dashboard";

const Transactions = lazy(() => import("./pages/Transactions"));
const Analytics = lazy(() => import("./pages/Analytics"));
const Budgets = lazy(() => import("./pages/Budgets"));
const Recurring = lazy(() => import("./pages/Recurring"));
const SavingsGoals = lazy(() => import("./pages/SavingsGoals"));
const Debts = lazy(() => import("./pages/Debts"));
const Settings = lazy(() => import("./pages/Settings"));
const NotFound = lazy(() => import("./pages/NotFound"));
const AddTransactionDialog = lazy(() =>
  import("./components/AddTransactionDialog").then(m => ({ default: m.AddTransactionDialog }))
);

// Defer toast systems — they're not needed at first paint
const ToastProviders = lazy(() =>
  import("./components/ToastProviders").then(m => ({ default: m.ToastProviders }))
);

const App = () => {
  useSwUpdate();

  return (
    <SettingsProvider>
      <FinanceProvider>
        <BrowserRouter future={{ v7_relativeSplatPath: true }}>
          <main>
            <Suspense fallback={<div className="flex h-screen items-center justify-center text-muted-foreground">Loading…</div>}>
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/transactions" element={<Transactions />} />
                <Route path="/analytics" element={<Analytics />} />
                <Route path="/budgets" element={<Budgets />} />
                <Route path="/recurring" element={<Recurring />} />
                <Route path="/savings" element={<SavingsGoals />} />
                <Route path="/debts" element={<Debts />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </main>
          <Suspense fallback={null}>
            <AddTransactionDialog />
          </Suspense>
          <BottomNav />
        </BrowserRouter>
      </FinanceProvider>
    </SettingsProvider>
  );
};

// Lazy-mount toast systems after initial render
const AppWithToasts = () => (
  <>
    <App />
    <Suspense fallback={null}>
      <ToastProviders />
    </Suspense>
  </>
);

export default AppWithToasts;
