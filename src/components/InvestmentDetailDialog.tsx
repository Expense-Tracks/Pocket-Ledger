import { useState } from 'react';
import { Investment } from '@/types/finance';
import { useFinance } from '@/contexts/FinanceContext';
import { useSettings } from '@/contexts/SettingsContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { AmountInput } from '@/components/AmountInput';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import DynamicFontSizeText from '@/components/DynamicFontSizeText';
import { format } from 'date-fns';
import { TrendingUp, TrendingDown, History, DollarSign } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface InvestmentDetailDialogProps {
  investment: Investment;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function InvestmentDetailDialog({ investment, open, onOpenChange }: InvestmentDetailDialogProps) {
  const { sellInvestment } = useFinance();
  const { formatCurrency } = useSettings();
  const [sellQuantity, setSellQuantity] = useState('');
  const [sellPrice, setSellPrice] = useState('');

  const multiplier = investment.type === 'stock' && investment.exchange === 'JKT' ? 100 : 1;
  const currentValue = investment.currentPrice * investment.quantity * multiplier;
  const totalCost = investment.purchasePrice * investment.quantity * multiplier;
  const totalGain = currentValue - totalCost;
  const gainPct = investment.purchasePrice > 0 ? (totalGain / totalCost) * 100 : 0;

  const handleSell = () => {
    const parsedQuantity = parseFloat(sellQuantity);
    const parsedPrice = parseFloat(sellPrice);

    if (isNaN(parsedQuantity) || parsedQuantity <= 0) {
      toast.error('Please enter a valid quantity');
      return;
    }

    if (parsedQuantity > investment.quantity) {
      toast.error(`You only have ${investment.quantity} ${investment.symbol} to sell`);
      return;
    }

    if (isNaN(parsedPrice) || parsedPrice <= 0) {
      toast.error('Please enter a valid sell price');
      return;
    }

    sellInvestment(investment.id, parsedQuantity, parsedPrice);
    setSellQuantity('');
    setSellPrice('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[calc(100vw-2rem)] rounded-2xl sm:max-w-md max-h-[90vh] overflow-y-auto overflow-x-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-start gap-3 pr-8">
            {investment.logoUrl ? (
              <img src={investment.logoUrl} alt={`${investment.name} logo`} className="w-8 h-8 object-contain rounded-full shrink-0" />
            ) : (
              <span className="text-2xl shrink-0">
                {investment.type === 'stock' ? '📈' : investment.type === 'crypto' ? '💎' : investment.type === 'gold' ? '🥇' : '📊'}
              </span>
            )}
            <div className="min-w-0 flex-1">
              <div className="break-words">{investment.name}</div>
              <div className="text-sm font-normal text-muted-foreground truncate">{investment.symbol}</div>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 overflow-x-hidden">
          {/* Summary Card */}
          <div className="rounded-lg bg-muted p-4 space-y-2">
            <div className="flex justify-between items-center gap-2">
              <span className="text-sm text-muted-foreground shrink-0">Holdings</span>
              <span className="font-semibold text-right truncate min-w-0">{investment.quantity} {investment.symbol}</span>
            </div>
            <div className="flex justify-between items-center gap-2">
              <span className="text-sm text-muted-foreground shrink-0">Avg. Purchase Price</span>
              <DynamicFontSizeText
                text={formatCurrency(investment.purchasePrice)}
                initialFontSizeClass="text-l"
                className="font-semibold text-right"
              />
            </div>
            <div className="flex justify-between items-center gap-2">
              <span className="text-sm text-muted-foreground shrink-0">Current Price</span>
              <DynamicFontSizeText
                text={formatCurrency(investment.currentPrice)}
                initialFontSizeClass="text-l"
                className="font-semibold text-right"
              />
            </div>
            <div className="border-t pt-2 mt-2">
              <div className="flex justify-between items-center gap-2">
                <span className="text-sm text-muted-foreground shrink-0">Current Value</span>
                <DynamicFontSizeText
                  text={formatCurrency(currentValue)}
                  initialFontSizeClass="text-l"
                  className="font-bold text-right"
                />
              </div>
              <div className="flex justify-between items-center gap-2">
                <span className="text-sm text-muted-foreground shrink-0">Total Gain/Loss</span>
                <div className="flex items-center gap-1 min-w-0 flex-1 justify-end">
                  {totalGain >= 0 ? <TrendingUp className="h-3 w-3 shrink-0 text-income" /> : <TrendingDown className="h-3 w-3 shrink-0 text-expense" />}
                  <DynamicFontSizeText
                    text={`${totalGain >= 0 ? '+' : ''}${formatCurrency(Math.abs(totalGain))} (${gainPct >= 0 ? '+' : ''}${gainPct.toFixed(2)}%)`}
                    className={cn("font-bold", totalGain >= 0 ? "text-income" : "text-expense")}
                    initialFontSizeClass="text-l"
                  />
                </div>
              </div>
            </div>
          </div>

          <Tabs defaultValue="sell" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="sell">
                <DollarSign className="h-4 w-4 mr-1" />
                Sell
              </TabsTrigger>
              <TabsTrigger value="history">
                <History className="h-4 w-4 mr-1" />
                History
              </TabsTrigger>
            </TabsList>

            <TabsContent value="sell" className="space-y-4">
              <div>
                <Label htmlFor="sell-quantity">Quantity to Sell</Label>
                <AmountInput
                  value={sellQuantity}
                  onChange={setSellQuantity}
                  className="mt-1"
                  placeholder={`Max: ${investment.quantity}`}
                />
              </div>

              <div>
                <Label htmlFor="sell-price">Sell Price (per unit)</Label>
                <AmountInput
                  value={sellPrice}
                  onChange={setSellPrice}
                  className="mt-1"
                  placeholder="0.00"
                />
              </div>

              {sellQuantity && sellPrice && !isNaN(parseFloat(sellQuantity)) && !isNaN(parseFloat(sellPrice)) && (
                <div className="rounded-lg bg-muted p-3 space-y-1">
                  <div className="flex justify-between items-center gap-2 text-sm">
                    <span className="text-muted-foreground shrink-0">Total Sale Value</span>
                    <DynamicFontSizeText
                      text={formatCurrency(parseFloat(sellQuantity) * parseFloat(sellPrice) * multiplier)}
                      initialFontSizeClass="text-l"
                      className="font-semibold text-right"
                    />
                  </div>
                  <div className="flex justify-between items-center gap-2 text-sm">
                    <span className="text-muted-foreground shrink-0">Cost Basis</span>
                    <DynamicFontSizeText
                      text={formatCurrency(parseFloat(sellQuantity) * investment.purchasePrice * multiplier)}
                      initialFontSizeClass="text-l"
                      className="font-semibold text-right"
                    />
                  </div>
                  <div className="flex justify-between items-center gap-2 text-sm border-t pt-1">
                    <span className="text-muted-foreground shrink-0">Profit/Loss</span>
                    <DynamicFontSizeText
                      text={formatCurrency(Math.abs((parseFloat(sellPrice) - investment.purchasePrice) * parseFloat(sellQuantity) * multiplier))}
                      initialFontSizeClass="text-l"
                      className={cn(
                        "font-bold text-right",
                        (parseFloat(sellPrice) - investment.purchasePrice) >= 0 ? "text-income" : "text-expense"
                      )}
                    />
                  </div>
                </div>
              )}

              <Button onClick={handleSell} className="w-full" size="lg">
                Sell {sellQuantity ? parseFloat(sellQuantity) : ''} {investment.symbol}
              </Button>
            </TabsContent>

            <TabsContent value="history" className="space-y-3">
              <div className="text-sm text-muted-foreground mb-2">
                Purchase History ({investment.purchases?.length || 0} transactions)
              </div>
              
              {investment.purchases && investment.purchases.length > 0 ? (
                <div className="space-y-2">
                  {investment.purchases.map((purchase, index) => {
                    const purchaseValue = purchase.quantity * purchase.price * multiplier;
                    return (
                      <div key={index} className="rounded-lg border p-3 space-y-1">
                        <div className="flex justify-between items-start gap-2">
                          <div className="min-w-0 flex-1">
                            <div className="font-semibold truncate">{purchase.quantity} {investment.symbol}</div>
                            <div className="text-xs text-muted-foreground truncate">
                              {format(new Date(purchase.date), 'MMM d, yyyy')}
                            </div>
                          </div>
                          <div className="text-right shrink-0 min-w-0 flex-1">
                            <DynamicFontSizeText
                              text={formatCurrency(purchaseValue)}
                              initialFontSizeClass="text-l"
                              className="font-semibold"
                            />
                            <div className="text-xs text-muted-foreground truncate">
                              @ {formatCurrency(purchase.price)}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center text-muted-foreground py-8">
                  No purchase history available
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}
