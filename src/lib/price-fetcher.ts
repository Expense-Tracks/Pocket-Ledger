import { Investment } from '@/types/finance';
import { ExchangeRatesCache, loadExchangeRates, saveExchangeRates } from '@/lib/storage';

const FMP_API_KEY = import.meta.env.VITE_FMP_API_KEY;
const EXCHANGERATE_API_KEY = import.meta.env.VITE_EXCHANGERATE_API_KEY;

async function fetchExchangeRate(targetCurrency: string): Promise<number> {
  if (targetCurrency.toUpperCase() === 'USD') return 1;

  const now = new Date();
  const oneDay = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

  const cachedRates: ExchangeRatesCache | null = await loadExchangeRates();

  // Check if cached rates are recent
  if (cachedRates && (now.getTime() - new Date(cachedRates.timestamp).getTime()) < oneDay) {
    if (cachedRates.rates[targetCurrency.toUpperCase()]) {

      return cachedRates.rates[targetCurrency.toUpperCase()];
    }
  }

  if (!EXCHANGERATE_API_KEY) {

    if (cachedRates && cachedRates.rates[targetCurrency.toUpperCase()]) {

        return cachedRates.rates[targetCurrency.toUpperCase()];
    }
    return 1; // Fallback to 1 if API key is missing and no cache
  }

  try {
    const response = await fetch(`https://v6.exchangerate-api.com/v6/${EXCHANGERATE_API_KEY}/latest/USD`);
    const data = await response.json();

    if (data.result === 'success' && data.conversion_rates) {
      const newCache: ExchangeRatesCache = {
        baseCurrency: 'USD',
        rates: data.conversion_rates,
        timestamp: now.toISOString(),
      };
      await saveExchangeRates(newCache);

      return data.conversion_rates[targetCurrency.toUpperCase()] || 1;
    } else {

      if (cachedRates && cachedRates.rates[targetCurrency.toUpperCase()]) {

          return cachedRates.rates[targetCurrency.toUpperCase()];
      }
      return 1; // Fallback to 1 if API failed and no cache
    }
  } catch (error) {

    if (cachedRates && cachedRates.rates[targetCurrency.toUpperCase()]) {

        return cachedRates.rates[targetCurrency.toUpperCase()];
    }
    return 1; // Fallback to 1 on error and no cache
  }
}

export async function fetchStockPrice(symbol: string, currencyCode: string): Promise<number | null> {
  if (!FMP_API_KEY) {

    return null;
  }
  try {
    const response = await fetch(`https://financialmodelingprep.com/stable/profile?symbol=${symbol}&apikey=${FMP_API_KEY}`);
    const data = await response.json();
    if (data && data.length > 0) {
      const basePrice = data[0].price;
      const currency = data[0].currency;
      if (currencyCode.toUpperCase() === currency) {
        return basePrice;
      } else {
        const rate = await fetchExchangeRate(currencyCode);
        return basePrice * rate;
      }
    }
    return null;
  } catch (error) {

    return null;
  }
}

export async function fetchCryptoPrice(id: string, currencyCode: string): Promise<number | null> {
  try {
    const response = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${id}&vs_currencies=${currencyCode.toLowerCase()}`);
    const data = await response.json();
    if (data && data[id] && data[id][currencyCode.toLowerCase()]) {
      return data[id][currencyCode.toLowerCase()];
    }
    return null;
  } catch (error) {

    return null;
  }
}

export async function fetchGoldPrice(currencyCode: string): Promise<number | null> {
  // Using a fixed value for gold for now (in USD)
  const usdGoldPrice = 1900;
  if (currencyCode.toUpperCase() === 'USD') {
    return usdGoldPrice;
  } else {
    const rate = await fetchExchangeRate(currencyCode);
    return usdGoldPrice * rate;
  }
}

export async function updateInvestmentPrices(investments: Investment[], currencyCode: string): Promise<Investment[]> {
  const now = new Date().toISOString();
  const updatedInvestments = await Promise.all(
    investments.map(async (investment) => {
      let currentPrice: number | null = null;
      switch (investment.type) {
        case 'stock':
          currentPrice = await fetchStockPrice(investment.symbol, currencyCode);
          break;
        case 'crypto':
          if (investment.cryptoId) {
            currentPrice = await fetchCryptoPrice(investment.cryptoId, currencyCode);
          }
          break;
        case 'gold':
          currentPrice = await fetchGoldPrice(currencyCode);
          break;
        default:
          currentPrice = investment.currentPrice;
      }

      if (currentPrice !== null) {
        const newHistory = [...investment.history, { date: now, price: currentPrice }];
        return { ...investment, currentPrice, history: newHistory, lastUpdated: now };
      }

      return investment;
    })
  );
  return updatedInvestments;
}
