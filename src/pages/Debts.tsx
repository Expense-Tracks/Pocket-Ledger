import { useState } from 'react';
import { format } from 'date-fns';
import { Plus, User, Calendar, CheckCircle2, Clock } from 'lucide-react';
import { useFinance } from '@/contexts/FinanceContext';
import { useSettings } from '@/contexts/SettingsContext';
import { Debt } from '@/types/finance';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AddDebtDialog } from '@/components/AddDebtDialog';
import { EditDebtDialog } from '@/components/EditDebtDialog';

export default function Debts() {
  const { debts } = useFinance();
  const { settings } = useSettings();
  const [addOpen, setAddOpen] = useState(false);
  const [editDebt, setEditDebt] = useState<Debt | null>(null);

  const owedToMe = debts.filter(d => d.type === 'owed-to-me');
  const iOwe = debts.filter(d => d.type === 'i-owe');

  const totalOwedToMe = owedToMe.filter(d => d.status === 'pending').reduce((s, d) => s + d.amount, 0);
  const totalIOwe = iOwe.filter(d => d.status === 'pending').reduce((s, d) => s + d.amount, 0);

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="max-w-lg mx-auto p-4 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Debts</h1>
          <Button onClick={() => setAddOpen(true)} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Debt
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Card className="p-4">
            <p className="text-sm text-muted-foreground">Owed to Me</p>
            <p className="text-2xl font-bold text-income">
              {settings.currency.symbol}{totalOwedToMe.toFixed(2)}
            </p>
          </Card>
          <Card className="p-4">
            <p className="text-sm text-muted-foreground">I Owe</p>
            <p className="text-2xl font-bold text-expense">
              {settings.currency.symbol}{totalIOwe.toFixed(2)}
            </p>
          </Card>
        </div>

        <Tabs defaultValue="all" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="owed-to-me">Owed to Me</TabsTrigger>
            <TabsTrigger value="i-owe">I Owe</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-3 mt-4">
            {debts.length === 0 ? (
              <Card className="p-8 text-center">
                <p className="text-muted-foreground">No debts tracked yet</p>
              </Card>
            ) : (
              debts.map(debt => <DebtCard key={debt.id} debt={debt} onEdit={setEditDebt} />)
            )}
          </TabsContent>

          <TabsContent value="owed-to-me" className="space-y-3 mt-4">
            {owedToMe.length === 0 ? (
              <Card className="p-8 text-center">
                <p className="text-muted-foreground">No debts owed to you</p>
              </Card>
            ) : (
              owedToMe.map(debt => <DebtCard key={debt.id} debt={debt} onEdit={setEditDebt} />)
            )}
          </TabsContent>

          <TabsContent value="i-owe" className="space-y-3 mt-4">
            {iOwe.length === 0 ? (
              <Card className="p-8 text-center">
                <p className="text-muted-foreground">No debts you owe</p>
              </Card>
            ) : (
              iOwe.map(debt => <DebtCard key={debt.id} debt={debt} onEdit={setEditDebt} />)
            )}
          </TabsContent>
        </Tabs>
      </div>

      <AddDebtDialog open={addOpen} onOpenChange={setAddOpen} />
      {editDebt && <EditDebtDialog debt={editDebt} open={!!editDebt} onOpenChange={(open) => !open && setEditDebt(null)} />}
    </div>
  );
}

function DebtCard({ debt, onEdit }: { debt: Debt; onEdit: (d: Debt) => void }) {
  const { settings } = useSettings();
  const isOverdue = debt.dueDate && new Date(debt.dueDate) < new Date() && debt.status === 'pending';

  return (
    <Card
      className="p-4 cursor-pointer hover:bg-accent/50 transition-colors"
      onClick={() => onEdit(debt)}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <User className="h-4 w-4 text-muted-foreground" />
            <span className="font-semibold">{debt.person}</span>
            <Badge variant={debt.type === 'owed-to-me' ? 'default' : 'secondary'}>
              {debt.type === 'owed-to-me' ? 'Owed to Me' : 'I Owe'}
            </Badge>
          </div>
          {debt.description && (
            <p className="text-sm text-muted-foreground mb-2">{debt.description}</p>
          )}
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            {debt.dueDate && (
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                <span className={isOverdue ? 'text-destructive font-medium' : ''}>
                  {format(new Date(debt.dueDate), 'MMM d, yyyy')}
                </span>
              </div>
            )}
            <div className="flex items-center gap-1">
              {debt.status === 'paid' ? (
                <>
                  <CheckCircle2 className="h-3 w-3 text-green-600" />
                  <span className="text-green-600">Paid</span>
                </>
              ) : (
                <>
                  <Clock className="h-3 w-3" />
                  <span>Pending</span>
                </>
              )}
            </div>
          </div>
        </div>
        <div className="text-right">
          <p className={`text-xl font-bold ${debt.type === 'owed-to-me' ? 'text-income' : 'text-expense'}`}>
            {settings.currency.symbol}{debt.amount.toFixed(2)}
          </p>
        </div>
      </div>
    </Card>
  );
}
