import { useState } from "react";
import { useFinance } from "@/contexts/FinanceContext";
import { useSettings } from "@/contexts/SettingsContext";
import { AddInvestmentDialog } from "@/components/AddInvestmentDialog";
import { InvestmentDetailDialog } from "@/components/InvestmentDetailDialog";
import { Investment } from "@/types/finance";
import DynamicFontSizeText from '@/components/DynamicFontSizeText';
import { TrendingUp, TrendingDown } from "lucide-react";
import { cn } from '@/lib/utils';
import { format } from "date-fns";

export default function Investments() {
  const { investments } = useFinance();
  const { formatCurrency } = useSettings();
  const [selectedInvestment, setSelectedInvestment] = useState<Investment | null>(null);

  const totalValue = investments.reduce((acc, i) => {
    const multiplier = i.type === 'stock' && i.exchange === 'JKT' ? 100 : 1;
    return acc + i.currentPrice * i.quantity * multiplier;
  }, 0);
  const totalCost = investments.reduce((acc, i) => {
    const multiplier = i.type === 'stock' && i.exchange === 'JKT' ? 100 : 1;
    return acc + i.purchasePrice * i.quantity * multiplier;
  }, 0);
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
            <div className="flex justify-between items-center gap-4">
              <div className="min-w-0 flex-1">
                <p className="text-sm text-muted-foreground truncate">Total Value</p>
                <DynamicFontSizeText
                  text={formatCurrency(totalValue)}
                  initialFontSizeClass="text-xl"
                  className="font-bold"
                />
              </div>
              <div className="text-right min-w-0 flex-1">
                <p className="text-sm text-muted-foreground truncate">Total Gain/Loss</p>
                <DynamicFontSizeText
                  text={`${totalGain >= 0 ? '+' : '-'}${formatCurrency(Math.abs(totalGain))}`}
                  initialFontSizeClass="text-xl"
                  className={cn(
                    "font-bold",
                    totalGain >= 0 ? "text-income" : "text-expense"
                  )}
                />
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
              const multiplier = investment.type === 'stock' && investment.exchange === 'JKT' ? 100 : 1;
              return (
                <div 
                  key={investment.id} 
                  className="rounded-2xl bg-card p-4 cursor-pointer hover:bg-accent/50 transition-colors"
                  onClick={() => setSelectedInvestment(investment)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center">
                        {investment.logoUrl ? (
                          <img src={investment.logoUrl} alt={`${investment.name} logo`} className="w-full h-full object-contain rounded-full" />
                        ) : (
                          <span className="text-xl">
                            {investment.type === 'stock' ? '📈' : investment.type === 'crypto' ? '💎' : investment.type === 'gold' ? '🥇' : '📊'}
                          </span>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold truncate">{investment.name}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>{investment.symbol}</span>
                          <span>·</span>
                          <span>{format(new Date(investment.purchaseDate), 'MMM d, yyyy')}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <DynamicFontSizeText
                        text={formatCurrency(investment.currentPrice * investment.quantity * multiplier)}
                        initialFontSizeClass="text-base"
                        className="font-bold"
                      />
                      <p className={`text-xs ${gain >= 0 ? 'text-income' : 'text-expense'}`}>
                        {gain >= 0 ? <TrendingUp className="h-3 w-3 inline" /> : <TrendingDown className="h-3 w-3 inline" />}
                        {' '}{gain >= 0 ? '+' : ''}{gainPct.toFixed(1)}%
                      </p>
                    </div>
                  </div>
                  <div className="mt-3 flex justify-between text-xs text-muted-foreground overflow-hidden">
                    <span className="truncate">{investment.quantity} {investment.symbol} @ {formatCurrency(investment.purchasePrice)}</span>
                    <span className="ml-2 shrink-0">Now: {formatCurrency(investment.currentPrice)}</span>
                  </div>
                </div>
              );
            })}
            
            {selectedInvestment && (
              <InvestmentDetailDialog
                investment={selectedInvestment}
                open={!!selectedInvestment}
                onOpenChange={(open) => !open && setSelectedInvestment(null)}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
