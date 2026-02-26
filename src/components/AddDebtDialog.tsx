import { useState } from 'react';
import { toast } from 'sonner';
import { useFinance } from '@/contexts/FinanceContext';
import { DebtType, DebtStatus, TransactionType } from '@/types/finance';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DatePicker } from '@/components/DatePicker';
import { AmountInput } from '@/components/AmountInput';

interface AddDebtDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddDebtDialog({ open, onOpenChange }: AddDebtDialogProps) {
  const { addDebt, addTransaction, categories, paymentMethods } = useFinance();
  const [dueDate, setDueDate] = useState<Date | undefined>();
  const [person, setPerson] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<DebtType>('i-owe');
  const [status, setStatus] = useState<DebtStatus>('pending');
  const [description, setDescription] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('');

  const resetForm = () => {
    setPerson('');
    setAmount('');
    setType('i-owe');
    setStatus('pending');
    setDescription('');
    setDueDate(undefined);
    setSelectedCategory('');
    setSelectedPaymentMethod('');
  };

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

    // Auto-create transaction if debt is already marked as paid
    if (status === 'paid') {
      const transactionType: TransactionType = type === 'owed-to-me' ? 'income' : 'expense';
      const debtCategoryId = type === 'owed-to-me' ? 'debt-collection' : 'debt-payment';
      const defaultCategory = categories.find(c => c.id === debtCategoryId) || 
                              categories.find(c => c.type === transactionType && c.isDefault) || 
                              categories.find(c => c.type === transactionType);
      const defaultPayment = paymentMethods.find(p => p.isDefault) || paymentMethods[0];

      const transactionId = addTransaction({
        amount: amountNum,
        type: transactionType,
        category: selectedCategory || defaultCategory?.id || 'uncategorized',
        paymentMethod: selectedPaymentMethod || defaultPayment?.id || 'other',
        description: `Debt ${type === 'owed-to-me' ? 'received from' : 'paid to'} ${person}${description ? ': ' + description : ''}`,
        date: new Date().toISOString(),
      });
      
      addDebt({
        person: person.trim(),
        amount: amountNum,
        type,
        status,
        description: description.trim(),
        dueDate: dueDate?.toISOString(),
        linkedTransactionId: transactionId,
      });

      toast.success(`Debt added and ${transactionType} transaction created`);
    } else {
      addDebt({
        person: person.trim(),
        amount: amountNum,
        type,
        status,
        description: description.trim(),
        dueDate: dueDate?.toISOString(),
      });
      toast.success('Debt added');
    }

    resetForm();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add Debt</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <Label htmlFor="person">Person</Label>
            <Input
              id="person"
              value={person}
              onChange={(e) => setPerson(e.target.value)}
              placeholder="John Doe"
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
            <DatePicker date={dueDate} onDateChange={setDueDate} />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Shared dinner expenses..."
              rows={3}
            />
          </div>

          {status === 'paid' && (
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
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" className="flex-1">Add Debt</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
