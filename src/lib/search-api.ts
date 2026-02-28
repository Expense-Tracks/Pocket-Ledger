const FMP_API_KEY = import.meta.env.VITE_FMP_API_KEY;

export interface FMPStockSearchResult {
  symbol: string;
  name: string;
  currency: string;
  stockExchange: string;
}

export async function searchFMPStocks(query: string): Promise<FMPStockSearchResult[]> {
  if (!FMP_API_KEY) {
    console.warn('FMP_API_KEY not configured');
    return [];
  }
  if (!query) {
    return [];
  }
  try {
    const response = await fetch(`https://financialmodelingprep.com/api/v3/search?query=${query}&limit=10&exchange=NASDAQ,NYSE,AMEX,IDX&apikey=${FMP_API_KEY}`);
    
    if (!response.ok) {
      console.warn(`FMP API error: ${response.status}`);
      return [];
    }
    
    const data: FMPStockSearchResult[] = await response.json();
    return data.filter(item => ['NASDAQ', 'NYSE', 'AMEX', 'IDX'].includes(item.stockExchange));
  } catch (error) {
    return [];
  }
}

export interface CoinGeckoCryptoSearchResult {
  id: string;
  name: string;
  symbol: string;
  market_cap_rank: number | null;
}

export async function searchCoinGeckoCryptos(query: string): Promise<CoinGeckoCryptoSearchResult[]> {
  if (!query) {
    return [];
  }
  try {
    const response = await fetch(`https://api.coingecko.com/api/v3/search?query=${query}`);
    const data: { coins: CoinGeckoCryptoSearchResult[] } = await response.json();
    // CoinGecko's search API returns a 'coins' array
    return data.coins || [];
  } catch (error) {

    return [];
  }
}
