import { useState } from 'react';
import { useSettings } from '@/contexts/SettingsContext';
import { useFinance } from '@/contexts/FinanceContext';
import { CURRENCIES } from '@/types/settings';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { EmojiPicker } from '@/components/EmojiPicker';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Separator } from '@/components/ui/separator';
import {
  DollarSign,
  Palette,
  Tag,
  CreditCard,
  Trash2,
  Plus,
  RotateCcw,
  Download,
  Upload,
  Database,
} from 'lucide-react';
import { toast } from 'sonner';
import { ExportData } from '@/contexts/FinanceContext';

export default function Settings() {
  const { settings, updateSettings, formatCurrency, resetSettings } = useSettings();
  const { categories, paymentMethods, addCategory, deleteCategory, addPaymentMethod, deletePaymentMethod, transactions, budgets, recurringTransactions, importData } = useFinance();

  const [newCategory, setNewCategory] = useState<{ name: string; icon: string; type: 'income' | 'expense' }>({ name: '', icon: '📁', type: 'expense' });
  const [newPayment, setNewPayment] = useState({ name: '', icon: '💳' });
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);

  const handleAddCategory = () => {
    if (!newCategory.name.trim()) {
      toast.error('Please enter a category name');
      return;
    }
    addCategory(newCategory);
    setNewCategory({ name: '', icon: '📁', type: 'expense' });
    setCategoryDialogOpen(false);
    toast.success('Category added successfully', { duration: 1000 });
  };

  const handleAddPayment = () => {
    if (!newPayment.name.trim()) {
      toast.error('Please enter a payment method name', { duration: 1000 });
      return;
    }
    addPaymentMethod(newPayment);
    setNewPayment({ name: '', icon: '💳' });
    setPaymentDialogOpen(false);
    toast.success('Payment method added successfully', { duration: 1000 });
  };

  const handleDeleteCategory = (id: string, name: string) => {
    deleteCategory(id);
    toast.success(`Deleted category: ${name}`);
  };

  const handleDeletePayment = (id: string, name: string) => {
    deletePaymentMethod(id);
    toast.success(`Deleted payment method: ${name}`);
  };

  const handleResetSettings = () => {
    resetSettings();
    toast.success('Settings reset to defaults', { duration: 1000 });
  };

  const buildExportData = (): ExportData => ({
    version: 1,
    exportedAt: new Date().toISOString(),
    transactions,
    categories,
    paymentMethods,
    budgets,
    recurringTransactions,
  });

  const downloadFile = (content: string, filename: string, type: string) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportJSON = () => {
    const data = buildExportData();
    const dateStr = new Date().toISOString().slice(0, 10);
    downloadFile(JSON.stringify(data, null, 2), `expense-ledger-${dateStr}.json`, 'application/json');
    toast.success('Data exported as JSON', { duration: 1000 });
  };

  const handleExportCSV = () => {
    const headers = ['Date', 'Type', 'Amount', 'Category', 'Payment Method', 'Description'];
    const rows = transactions.map(t => {
      const cat = categories.find(c => c.id === t.category);
      const pm = paymentMethods.find(p => p.id === t.paymentMethod);
      return [
        t.date.slice(0, 10),
        t.type,
        formatCurrency(t.amount),
        cat?.name || t.category,
        pm?.name || t.paymentMethod,
        `"${(t.description || '').replace(/"/g, '""')}"`,
      ].join(',');
    });
    const csv = [headers.join(','), ...rows].join('\n');
    const dateStr = new Date().toISOString().slice(0, 10);
    downloadFile(csv, `expense-ledger-${dateStr}.csv`, 'text/csv');
    toast.success('Transactions exported as CSV', { duration: 1000 });
  };

  const [pendingImport, setPendingImport] = useState<ExportData | null>(null);
  const [importDialogOpen, setImportDialogOpen] = useState(false);

  const handlePickImportFile = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      try {
        const text = await file.text();
        const data = JSON.parse(text) as ExportData;
        if (!data.version || !Array.isArray(data.transactions)) {
          toast.error('Invalid backup file format');
          return;
        }
        setPendingImport(data);
        setImportDialogOpen(true);
      } catch {
        toast.error('Failed to read backup file');
      }
    };
    input.click();
  };

  const handleImport = (mode: 'replace' | 'merge') => {
    if (!pendingImport) return;
    importData(pendingImport, mode);
    const count = pendingImport.transactions.length;
    toast.success(mode === 'replace' ? `Replaced with ${count} transactions` : `Merged ${count} transactions`, { duration: 1000 });
    setPendingImport(null);
    setImportDialogOpen(false);
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="mx-auto max-w-lg px-4 pt-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-sm text-muted-foreground">Customize your app preferences</p>
        </div>

        {/* Currency Settings */}
        <section className="mb-6">
          <div className="mb-3 flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">Currency</h2>
          </div>
          <div className="rounded-xl bg-card p-4">
            <Label htmlFor="currency">Preferred Currency</Label>
            <Select
              value={settings.currency.code}
              onValueChange={(code) => {
                const currency = CURRENCIES.find(c => c.code === code);
                if (currency) updateSettings({ currency });
              }}
            >
              <SelectTrigger id="currency" className="mt-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CURRENCIES.map(curr => (
                  <SelectItem key={curr.code} value={curr.code}>
                    {curr.symbol} {curr.name} ({curr.code})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="mt-2 text-sm text-muted-foreground">
              Preview: {formatCurrency(1234.56)}
            </p>
          </div>
        </section>

        {/* Theme Settings */}
        <section className="mb-6">
          <div className="mb-3 flex items-center gap-2">
            <Palette className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">Appearance</h2>
          </div>
          <div className="rounded-xl bg-card p-4">
            <Label htmlFor="theme">Theme</Label>
            <Select
              value={settings.theme}
              onValueChange={(theme: 'light' | 'dark' | 'system') => updateSettings({ theme })}
            >
              <SelectTrigger id="theme" className="mt-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="light">Light</SelectItem>
                <SelectItem value="dark">Dark</SelectItem>
                <SelectItem value="system">System</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </section>

        {/* Categories Management */}
        <section className="mb-6">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Tag className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold">Categories</h2>
            </div>
            <Dialog open={categoryDialogOpen} onOpenChange={setCategoryDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline">
                  <Plus className="h-4 w-4 mr-1" />
                  Add
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Category</DialogTitle>
                  <DialogDescription>Create a new transaction category</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div>
                    <Label htmlFor="cat-name">Name</Label>
                    <Input
                      id="cat-name"
                      value={newCategory.name}
                      onChange={(e) => setNewCategory(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="e.g., Rent, Food, etc."
                    />
                  </div>
                  <EmojiPicker
                    value={newCategory.icon}
                    onChange={(emoji) => setNewCategory(prev => ({ ...prev, icon: emoji }))}
                    label="Icon"
                  />
                  <div>
                    <Label htmlFor="cat-type">Type</Label>
                    <Select
                      value={newCategory.type}
                      onValueChange={(type: 'income' | 'expense') => setNewCategory(prev => ({ ...prev, type }))}
                    >
                      <SelectTrigger id="cat-type">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="expense">Expense</SelectItem>
                        <SelectItem value="income">Income</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={handleAddCategory}>Add Category</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
          <div className="space-y-2">
            {categories.map(cat => (
              <div key={cat.id} className="flex items-center justify-between rounded-xl bg-card p-3">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{cat.icon}</span>
                  <div>
                    <p className="font-medium">{cat.name}</p>
                    <p className="text-xs text-muted-foreground capitalize">{cat.type}</p>
                  </div>
                </div>
                {!cat.isDefault && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button size="sm" variant="ghost" className="text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Category</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete "{cat.name}"? Transactions using this category will be moved to "Uncategorized".
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDeleteCategory(cat.id, cat.name)}>
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Payment Methods Management */}
        <section className="mb-6">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold">Payment Methods</h2>
            </div>
            <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline">
                  <Plus className="h-4 w-4 mr-1" />
                  Add
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Payment Method</DialogTitle>
                  <DialogDescription>Create a new payment method</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div>
                    <Label htmlFor="pay-name">Name</Label>
                    <Input
                      id="pay-name"
                      value={newPayment.name}
                      onChange={(e) => setNewPayment(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="e.g., PayPal, Venmo, etc."
                    />
                  </div>
                  <EmojiPicker
                    value={newPayment.icon}
                    onChange={(emoji) => setNewPayment(prev => ({ ...prev, icon: emoji }))}
                    label="Icon"
                  />
                </div>
                <DialogFooter>
                  <Button onClick={handleAddPayment}>Add Payment Method</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
          <div className="space-y-2">
            {paymentMethods.map(pm => (
              <div key={pm.id} className="flex items-center justify-between rounded-xl bg-card p-3">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{pm.icon}</span>
                  <p className="font-medium">{pm.name}</p>
                </div>
                {!pm.isDefault && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button size="sm" variant="ghost" className="text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Payment Method</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete "{pm.name}"? Transactions using this method will be moved to "Other".
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDeletePayment(pm.id, pm.name)}>
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </div>
            ))}
          </div>
        </section>

        <Separator className="my-6" />

        {/* Data Export/Import */}
        <section className="mb-6">
          <div className="mb-3 flex items-center gap-2">
            <Database className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">Data</h2>
          </div>
          <div className="space-y-3">
            <div className="rounded-xl bg-card p-4">
              <p className="text-sm font-medium mb-1">Export</p>
              <p className="text-xs text-muted-foreground mb-3">Download a backup of all your data</p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1" onClick={handleExportJSON}>
                  <Download className="h-4 w-4 mr-1" /> JSON
                </Button>
                <Button variant="outline" size="sm" className="flex-1" onClick={handleExportCSV}>
                  <Download className="h-4 w-4 mr-1" /> CSV
                </Button>
              </div>
            </div>
            <div className="rounded-xl bg-card p-4">
              <p className="text-sm font-medium mb-1">Import</p>
              <p className="text-xs text-muted-foreground mb-3">Restore from a JSON backup file</p>
              <Button variant="outline" size="sm" className="w-full" onClick={handlePickImportFile}>
                <Upload className="h-4 w-4 mr-1" /> Import JSON Backup
              </Button>
              <Dialog open={importDialogOpen} onOpenChange={(v) => { setImportDialogOpen(v); if (!v) setPendingImport(null); }}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Import Data</DialogTitle>
                    <DialogDescription>
                      {pendingImport && `Found ${pendingImport.transactions.length} transactions, ${pendingImport.categories.length} categories, ${pendingImport.budgets.length} budgets, and ${pendingImport.recurringTransactions.length} recurring rules.`}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-3 py-2">
                    <button
                      onClick={() => handleImport('merge')}
                      className="w-full rounded-xl bg-secondary p-4 text-left transition-colors hover:bg-accent"
                    >
                      <p className="text-sm font-semibold">Merge</p>
                      <p className="text-xs text-muted-foreground">Add new items, keep existing data intact</p>
                    </button>
                    <button
                      onClick={() => handleImport('replace')}
                      className="w-full rounded-xl bg-secondary p-4 text-left transition-colors hover:bg-destructive/10"
                    >
                      <p className="text-sm font-semibold text-destructive">Replace</p>
                      <p className="text-xs text-muted-foreground">Overwrite all current data with the backup</p>
                    </button>
                  </div>
                  <DialogFooter>
                    <Button variant="ghost" onClick={() => { setImportDialogOpen(false); setPendingImport(null); }}>Cancel</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </section>

        <Separator className="my-6" />

        {/* Reset Settings */}
        <section className="mb-6">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" className="w-full">
                <RotateCcw className="h-4 w-4 mr-2" />
                Reset All Settings
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Reset Settings</AlertDialogTitle>
                <AlertDialogDescription>
                  This will reset all settings to their default values. Your transactions and custom categories/payment methods will not be affected.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleResetSettings}>
                  Reset
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </section>
      </div>
    </div>
  );
}
