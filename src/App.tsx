import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { FinanceProvider } from "@/contexts/FinanceContext";
import { SettingsProvider, useSettings } from "@/contexts/SettingsContext";
import { SplitBillProvider } from "@/contexts/SplitBillContext";
import { BottomNav } from "@/components/BottomNav";
import { useSwUpdate } from "@/hooks/use-sw-update";
import { useTitle } from "@/hooks/use-title";
import { useBiometricAuth } from "@/hooks/use-biometric-auth";
import { LockScreen } from "@/components/LockScreen";

import Dashboard from "./pages/Dashboard";

const Transactions = lazy(() => import("./pages/Transactions"));
const Analytics = lazy(() => import("./pages/Analytics"));
const Budgets = lazy(() => import("./pages/Budgets"));
const Recurring = lazy(() => import("./pages/Recurring"));
const SavingsGoals = lazy(() => import("./pages/SavingsGoals"));
const Debts = lazy(() => import("./pages/Debts"));
const Investments = lazy(() => import("./pages/Investments"));
const Settings = lazy(() => import("./pages/Settings"));
const SplitBill = lazy(() => import("./pages/SplitBill"));
const NewSplitBill = lazy(() => import("./pages/NewSplitBill"));
const ViewSplitBill = lazy(() => import("./pages/ViewSplitBill"));
const NotFound = lazy(() => import("./pages/NotFound"));
const AddTransactionDialog = lazy(() =>
  import("./components/AddTransactionDialog").then(m => ({ default: m.AddTransactionDialog }))
);
const AddInvestmentDialog = lazy(() =>
  import("./components/AddInvestmentDialog").then(m => ({ default: m.AddInvestmentDialog }))
);

// Defer toast systems — they're not needed at first paint
const ToastProviders = lazy(() =>
  import("./components/ToastProviders").then(m => ({ default: m.ToastProviders }))
);

const BiometricGuard = ({ children }: { children: React.ReactNode }) => {
  const { settings } = useSettings();
  const { isLocked, isSupported, isLoading, unlock } = useBiometricAuth(settings.biometricEnabled);

  return (
    <>
      <LockScreen
        isLocked={isLocked}
        onUnlock={unlock}
        isSupported={isSupported}
        isLoading={isLoading}
      />
      {children}
    </>
  );
};

const AppRoutes = () => {
  useTitle();
  return (
    <>
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
            <Route path="/investments" element={<Investments />} />
            <Route path="/split-bill" element={<SplitBill />} />
            <Route path="/split-bill/new" element={<NewSplitBill />} />
            <Route path="/split-bill/:id" element={<ViewSplitBill />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </main>
      <Suspense fallback={null}>
        <AddTransactionDialog />
        <AddInvestmentDialog />
      </Suspense>
      <BottomNav />
    </>
  );
};

const App = () => {
  useSwUpdate();

  return (
    <SettingsProvider>
      <BiometricGuard>
        <SplitBillProvider>
          <FinanceProvider>
            <BrowserRouter future={{ v7_relativeSplatPath: true }}>
              <AppRoutes />
            </BrowserRouter>
          </FinanceProvider>
        </SplitBillProvider>
      </BiometricGuard>
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
