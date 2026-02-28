import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useFinance } from '@/contexts/FinanceContext';
import { InvestmentType } from '@/types/finance';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DatePicker } from '@/components/DatePicker';
import { AmountInput } from '@/components/AmountInput';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Check, ChevronsUpDown, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { searchFMPStocks, searchCoinGeckoCryptos, getStockLogoUrl, fetchCryptoLogoUrl, FMPStockSearchResult, CoinGeckoCryptoSearchResult } from '@/lib/search-api';

export function AddInvestmentDialog() {
  const { addInvestment } = useFinance();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [symbol, setSymbol] = useState('');
  const [type, setType] = useState<InvestmentType>('stock');
  const [quantity, setQuantity] = useState('');
  const [purchasePrice, setPurchasePrice] = useState('');
  const [purchaseDate, setPurchaseDate] = useState<Date>(new Date());
  const [logoUrl, setLogoUrl] = useState<string | undefined>(undefined);
  const [exchange, setExchange] = useState<string | undefined>(undefined);
  const [cryptoId, setCryptoId] = useState<string | undefined>(undefined);

  const [stockSearchQuery, setStockSearchQuery] = useState('');
  const [stockSearchResults, setStockSearchResults] = useState<FMPStockSearchResult[]>([]);
  const [isStockSearching, setIsStockSearching] = useState(false);
  const [isStockPopoverOpen, setIsStockPopoverOpen] = useState(false);

  const [cryptoSearchQuery, setCryptoSearchQuery] = useState('');
  const [cryptoSearchResults, setCryptoSearchResults] = useState<CoinGeckoCryptoSearchResult[]>([]);
  const [isCryptoSearching, setIsCryptoSearching] = useState(false);
  const [isCryptoPopoverOpen, setIsCryptoPopoverOpen] = useState(false);

  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (type === 'stock' && stockSearchQuery) {
        setIsStockSearching(true);
        const results = await searchFMPStocks(stockSearchQuery);
        setStockSearchResults(results);
        setIsStockSearching(false);
      } else {
        setStockSearchResults([]);
      }
    }, 1000);
    return () => clearTimeout(delayDebounceFn);
  }, [stockSearchQuery, type]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (type === 'crypto' && cryptoSearchQuery) {
        setIsCryptoSearching(true);
        const results = await searchCoinGeckoCryptos(cryptoSearchQuery);
        setCryptoSearchResults(results);
        setIsCryptoSearching(false);
      } else {
        setCryptoSearchResults([]);
      }
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [cryptoSearchQuery, type]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsedQuantity = parseFloat(quantity);
    const parsedPurchasePrice = parseFloat(purchasePrice);

    if (type === 'stock' || type === 'crypto') {
      if (!name) {
        toast.error('Please select a stock/crypto from the search results');
        return;
      }
      if (!symbol) {
        toast.error(`Please select a ${type} from the search results`);
        return;
      }
    }

    if (type === 'gold') {
      if (!name) {
        toast.error('Please enter a name for the investment');
        return;
      }
      if (!symbol) {
        toast.error('Please enter a symbol for the investment');
        return;
      }
    }

    if (type === 'other') {
      if (!name) {
        toast.error('Please enter a name for the investment');
        return;
      }
    }

    if (isNaN(parsedQuantity) || parsedQuantity <= 0) {
      toast.error('Please enter a valid quantity');
      return;
    }
    if (isNaN(parsedPurchasePrice) || parsedPurchasePrice <= 0) {
      toast.error('Please enter a valid purchase price');
      return;
    }

    addInvestment({
      name,
      symbol,
      type,
      quantity: parsedQuantity,
      purchasePrice: parsedPurchasePrice,
      purchaseDate: purchaseDate.toISOString(),
      logoUrl,
      exchange, // Include exchange in addInvestment call
      cryptoId, // Include cryptoId for crypto investments
    });
    setOpen(false);
    resetForm();
  };

  const resetForm = () => {
    setName('');
    setSymbol('');
    setType('stock');
    setQuantity('');
    setPurchasePrice('');
    setPurchaseDate(new Date());
    setLogoUrl(undefined);
    setExchange(undefined); // Reset exchange
    setCryptoId(undefined); // Reset cryptoId
    setStockSearchQuery('');
    setCryptoSearchQuery('');
    setStockSearchResults([]);
    setCryptoSearchResults([]);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <Plus className="mr-1 h-4 w-4" /> Add Investment
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-[calc(100vw-2rem)] rounded-2xl sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Investment</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Type</Label>
            <Select value={type} onValueChange={(value) => {
              setType(value as InvestmentType);
              setName('');
              setSymbol('');
              setLogoUrl(undefined);
              setExchange(undefined); // Reset exchange when type changes
              setCryptoId(undefined); // Reset cryptoId when type changes
              setStockSearchQuery('');
              setCryptoSearchQuery('');
              setStockSearchResults([]);
              setCryptoSearchResults([]);
            }}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="stock">Stock</SelectItem>
                <SelectItem value="crypto">Crypto</SelectItem>
                <SelectItem value="gold">Gold</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {type === 'stock' && (
            <>
              <div>
                <Label htmlFor="stock-search">Stock Search</Label>
                <Popover open={isStockPopoverOpen} onOpenChange={setIsStockPopoverOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={isStockPopoverOpen}
                      className="w-full justify-between mt-1"
                    >
                      {symbol ? stockSearchResults.find((item) => item.symbol === symbol)?.name || name : "Search stock..."}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
                    <Command>
                      <CommandInput
                        placeholder="Search stock..."
                        value={stockSearchQuery}
                        onValueChange={setStockSearchQuery}
                      />
                      <CommandList>
                        {isStockSearching && <CommandEmpty>Searching...</CommandEmpty>}
                        {!isStockSearching && stockSearchResults.length === 0 && (
                          <CommandEmpty>No stock found.</CommandEmpty>
                        )}
                        <CommandGroup>
                          {stockSearchResults.map((item) => (
                            <CommandItem
                              key={item.symbol}
                              value={item.name}
                              onSelect={() => {
                                setName(item.name);
                                setSymbol(item.symbol);
                                setLogoUrl(getStockLogoUrl(item.symbol));
                                setExchange(item.exchange); // Set exchange
                                setIsStockPopoverOpen(false);
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  symbol === item.symbol ? "opacity-100" : "opacity-0"
                                )}
                              />
                              {item.name} ({item.symbol})
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
            </>
          )}

          {type === 'crypto' && (
            <>
              <div>
                <Label htmlFor="crypto-search">Crypto Search</Label>
                <Popover open={isCryptoPopoverOpen} onOpenChange={setIsCryptoPopoverOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={isCryptoPopoverOpen}
                      className="w-full justify-between mt-1"
                    >
                      {cryptoId ? cryptoSearchResults.find((item) => item.id === cryptoId)?.name || name : "Search crypto..."}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
                    <Command>
                      <CommandInput
                        placeholder="Search crypto..."
                        value={cryptoSearchQuery}
                        onValueChange={setCryptoSearchQuery}
                      />
                      <CommandList>
                        {isCryptoSearching && <CommandEmpty>Searching...</CommandEmpty>}
                        {!isCryptoSearching && cryptoSearchResults.length === 0 && (
                          <CommandEmpty>No crypto found.</CommandEmpty>
                        )}
                        <CommandGroup>
                          {cryptoSearchResults.map((item) => (
                            <CommandItem
                              key={item.id}
                              value={item.name}
                              onSelect={async () => {
                                setName(item.name);
                                setSymbol(item.symbol.toUpperCase()); // Store the actual symbol (e.g., "BTC")
                                setCryptoId(item.id); // Store the CoinGecko ID (e.g., "bitcoin") for API calls
                                const logo = await fetchCryptoLogoUrl(item.id);
                                setLogoUrl(logo); 
                                setIsCryptoPopoverOpen(false);
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  cryptoId === item.id ? "opacity-100" : "opacity-0"
                                )}
                              />
                              {item.name} ({item.symbol.toUpperCase()})
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
            </>
          )}

          {type === 'gold' && (
            <>
              <div>
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  placeholder="e.g. Gold"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="symbol">Symbol</Label>
                <Input
                  id="symbol"
                  placeholder="e.g. XAU"
                  value={symbol}
                  onChange={e => setSymbol(e.target.value)}
                  className="mt-1"
                />
              </div>
            </>
          )}

          {type === 'other' && (
            <>
              <div>
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  placeholder="e.g. Real Estate"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="symbol">Symbol (Optional)</Label>
                <Input
                  id="symbol"
                  placeholder="e.g. REIT"
                  value={symbol}
                  onChange={e => setSymbol(e.target.value)}
                  className="mt-1"
                />
              </div>
            </>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="quantity">Quantity</Label>
              <AmountInput
                value={quantity}
                onChange={setQuantity}
                className="mt-1"
                placeholder="0.00"
              />
            </div>
            <div>
              <Label htmlFor="purchasePrice">Purchase Price</Label>
              <AmountInput
                value={purchasePrice}
                onChange={setPurchasePrice}
                className="mt-1"
                placeholder="0.00"
              />
            </div>
          </div>

          <DatePicker
            date={purchaseDate}
            onDateChange={setPurchaseDate}
            label="Purchase Date"
            placeholder="Select purchase date"
          />

          <Button type="submit" className="w-full" size="lg">
            Add Investment
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
