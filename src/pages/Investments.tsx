import { useFinance } from "@/contexts/FinanceContext";
import { useSettings } from "@/contexts/SettingsContext";
import { AddInvestmentDialog } from "@/components/AddInvestmentDialog";
import { TrendingUp, TrendingDown, Trash2 } from "lucide-react";
import { format } from "date-fns";

export default function Investments() {
  const { investments, deleteInvestment } = useFinance();
  const { formatCurrency } = useSettings();

  const totalValue = investments.reduce((acc, i) => acc + i.currentPrice * i.quantity, 0);
  const totalCost = investments.reduce((acc, i) => acc + i.purchasePrice * i.quantity, 0);
  const totalGain = totalValue - totalCost;

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="mx-auto max-w-lg px-4 pt-6">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Investments</h1>
          <AddInvestmentDialog />
        </div>

        {investments.length > 0 && (
          <div className="mb-6 rounded-2xl bg-card p-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-muted-foreground">Total Value</p>
                <p className="text-2xl font-bold">{formatCurrency(totalValue)}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Total Gain/Loss</p>
                <p className={`text-2xl font-bold ${totalGain >= 0 ? 'text-income' : 'text-expense'}`}>
                  {totalGain >= 0 ? '+' : ''}
                  {formatCurrency(totalGain)}
                </p>
              </div>
            </div>
          </div>
        )}

        {investments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <TrendingUp className="mb-3 h-12 w-12 opacity-50" />
            <p className="text-lg font-medium">No investments yet</p>
            <p className="text-sm">Add stocks, crypto, or other investments</p>
          </div>
        ) : (
          <div className="space-y-3">
            {investments.map(investment => {
              const gain = investment.currentPrice - investment.purchasePrice;
              const gainPct = investment.purchasePrice > 0 ? (gain / investment.purchasePrice) * 100 : 0;
              return (
                <div key={investment.id} className="rounded-2xl bg-card p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-xl shrink-0">
                        {investment.type === 'stock' ? '📈' : investment.type === 'crypto' ? '💎' : investment.type === 'gold' ? '🥇' : '📊'}
                      </span>
                      <div className="min-w-0">
                        <p className="font-semibold truncate">{investment.name}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>{investment.symbol}</span>
                          <span>·</span>
                          <span>{format(new Date(investment.purchaseDate), 'MMM d, yyyy')}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <div className="text-right">
                        <p className="font-bold">{formatCurrency(investment.currentPrice * investment.quantity)}</p>
                        <p className={`text-xs ${gain >= 0 ? 'text-income' : 'text-expense'}`}>
                          {gain >= 0 ? <TrendingUp className="h-3 w-3 inline" /> : <TrendingDown className="h-3 w-3 inline" />}
                          {' '}{gain >= 0 ? '+' : ''}{gainPct.toFixed(1)}%
                        </p>
                      </div>
                      <button onClick={() => deleteInvestment(investment.id)} className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  <div className="mt-3 flex justify-between text-xs text-muted-foreground">
                    <span>{investment.quantity} {investment.symbol} @ {formatCurrency(investment.purchasePrice)}</span>
                    <span>Now: {formatCurrency(investment.currentPrice)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
