import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Trash2 } from 'lucide-react';
import { useFinance } from '@/contexts/FinanceContext';
import { Debt, DebtType, DebtStatus, TransactionType } from '@/types/finance';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DatePicker } from '@/components/DatePicker';
import { AmountInput } from '@/components/AmountInput';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface EditDebtDialogProps {
  debt: Debt;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditDebtDialog({ debt, open, onOpenChange }: EditDebtDialogProps) {
  const { updateDebt, deleteDebt, addTransaction, deleteTransaction, categories, paymentMethods } = useFinance();
  const [dueDate, setDueDate] = useState<Date | undefined>(debt.dueDate ? new Date(debt.dueDate) : undefined);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const previousStatus = debt.status;

  const [person, setPerson] = useState(debt.person);
  const [amount, setAmount] = useState(debt.amount.toString());
  const [type, setType] = useState<DebtType>(debt.type);
  const [status, setStatus] = useState<DebtStatus>(debt.status);
  const [description, setDescription] = useState(debt.description);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('');

  useEffect(() => {
    setPerson(debt.person);
    setAmount(debt.amount.toString());
    setType(debt.type);
    setStatus(debt.status);
    setDescription(debt.description);
    setDueDate(debt.dueDate ? new Date(debt.dueDate) : undefined);
    setSelectedCategory('');
    setSelectedPaymentMethod('');
  }, [debt]);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!person.trim()) {
      toast.error('Please enter a person name');
      return;
    }

    const amountNum = parseFloat(amount);
    if (!amount || isNaN(amountNum) || amountNum <= 0) {
      toast.error('Please enter a valid amount greater than 0');
      return;
    }

    const wasJustPaid = previousStatus === 'pending' && status === 'paid';
    const wasJustUnpaid = previousStatus === 'paid' && status === 'pending';
    
    let linkedTransactionId = debt.linkedTransactionId;

    // Delete linked transaction if marking as pending again
    if (wasJustUnpaid && debt.linkedTransactionId) {
      deleteTransaction(debt.linkedTransactionId);
      linkedTransactionId = undefined;
      toast.success('Debt marked as pending and linked transaction deleted');
    }

    // Auto-create transaction when marking as paid
    if (wasJustPaid) {
      const transactionType: TransactionType = type === 'owed-to-me' ? 'income' : 'expense';
      const debtCategoryId = type === 'owed-to-me' ? 'debt-collection' : 'debt-payment';
      const defaultCategory = categories.find(c => c.id === debtCategoryId) || 
                              categories.find(c => c.type === transactionType && c.isDefault) || 
                              categories.find(c => c.type === transactionType);
      const defaultPayment = paymentMethods.find(p => p.isDefault) || paymentMethods[0];

      linkedTransactionId = addTransaction({
        amount: amountNum,
        type: transactionType,
        category: selectedCategory || defaultCategory?.id || 'uncategorized',
        paymentMethod: selectedPaymentMethod || defaultPayment?.id || 'other',
        description: `Debt ${type === 'owed-to-me' ? 'received from' : 'paid to'} ${person}${description ? ': ' + description : ''}`,
        date: new Date().toISOString(),
      });

      toast.success(`Debt marked as paid and ${transactionType} transaction created`);
    } else if (!wasJustUnpaid) {
      toast.success('Debt updated');
    }

    updateDebt(debt.id, {
      person: person.trim(),
      amount: amountNum,
      type,
      status,
      description: description.trim(),
      dueDate: dueDate?.toISOString(),
      linkedTransactionId,
    });

    onOpenChange(false);
  };

  const handleDelete = () => {
    deleteDebt(debt.id);
    setDeleteOpen(false);
    onOpenChange(false);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Debt</DialogTitle>
          </DialogHeader>
          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <Label htmlFor="person">Person</Label>
              <Input
                id="person"
                value={person}
                onChange={(e) => setPerson(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="amount">Amount</Label>
              <AmountInput
                value={amount}
                onChange={setAmount}
                placeholder="0.00"
              />
            </div>

            <div>
              <Label htmlFor="type">Type</Label>
              <Select value={type} onValueChange={(v) => setType(v as DebtType)}>
                <SelectTrigger id="type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="i-owe">I Owe</SelectItem>
                  <SelectItem value="owed-to-me">Owed to Me</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="status">Status</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as DebtStatus)}>
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Due Date (Optional)</Label>
              <DatePicker date={dueDate} onDateChange={setDueDate} />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>

            {status === 'paid' && previousStatus === 'pending' && (
              <>
                <div className="pt-2 border-t">
                  <p className="text-sm font-medium mb-3">Transaction Details (Optional)</p>
                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="category">Category</Label>
                      <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                        <SelectTrigger id="category">
                          <SelectValue placeholder={
                            (() => {
                              const transactionType = type === 'owed-to-me' ? 'income' : 'expense';
                              const debtCategoryId = type === 'owed-to-me' ? 'debt-collection' : 'debt-payment';
                              const defaultCat = categories.find(c => c.id === debtCategoryId) || 
                                                categories.find(c => c.type === transactionType && c.isDefault) || 
                                                categories.find(c => c.type === transactionType);
                              return defaultCat ? `${defaultCat.icon} ${defaultCat.name}` : 'Select category';
                            })()
                          } />
                        </SelectTrigger>
                        <SelectContent>
                          {categories
                            .filter(c => c.type === (type === 'owed-to-me' ? 'income' : 'expense'))
                            .map(cat => (
                              <SelectItem key={cat.id} value={cat.id}>
                                {cat.icon} {cat.name}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="paymentMethod">Payment Method</Label>
                      <Select value={selectedPaymentMethod} onValueChange={setSelectedPaymentMethod}>
                        <SelectTrigger id="paymentMethod">
                          <SelectValue placeholder={
                            (() => {
                              const defaultPm = paymentMethods.find(p => p.isDefault) || paymentMethods[0];
                              return defaultPm ? `${defaultPm.icon} ${defaultPm.name}` : 'Select payment method';
                            })()
                          } />
                        </SelectTrigger>
                        <SelectContent>
                          {paymentMethods.map(pm => (
                            <SelectItem key={pm.id} value={pm.id}>
                              {pm.icon} {pm.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </>
            )}

            <div className="flex gap-2 pt-4">
              <Button
                type="button"
                variant="destructive"
                size="icon"
                onClick={() => setDeleteOpen(true)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
                Cancel
              </Button>
              <Button type="submit" className="flex-1">Save Changes</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Debt</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this debt? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
