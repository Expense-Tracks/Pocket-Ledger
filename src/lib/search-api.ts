const FMP_API_KEY = import.meta.env.VITE_FMP_API_KEY;

export interface FMPStockSearchResult {
  symbol: string;
  name: string;
  currency: string;
  exchange: string;
}

export async function searchFMPStocks(query: string): Promise<FMPStockSearchResult[]> {
  if (!FMP_API_KEY) {
    return [];
  }
  if (!query) {
    return [];
  }
  try {
    const response = await fetch(`https://financialmodelingprep.com/stable/search-symbol?query=${query}&limit=10&apikey=${FMP_API_KEY}`);
    if (!response.ok) {
      return [];
    }
    
    const data: FMPStockSearchResult[] = await response.json();
    return data.filter(item => ['NASDAQ', 'NYSE', 'AMEX', 'JKT'].includes(item.exchange));
  } catch (error) {
    return [];
  }
}

export interface CoinGeckoCryptoSearchResult {
  id: string;
  name: string;
  symbol: string;
  market_cap_rank: number | null;
  thumb?: string;
}

interface CoinGeckoCoinDetails {
  id: string;
  symbol: string;
  name: string;
  image: {
    thumb: string;
    small: string;
    large: string;
  };
}

export async function searchCoinGeckoCryptos(query: string): Promise<CoinGeckoCryptoSearchResult[]> {
  if (!query) {
    return [];
  }
  try {
    const response = await fetch(`https://api.coingecko.com/api/v3/search?query=${query}`);
    const data: { coins: CoinGeckoCryptoSearchResult[] } = await response.json();
    return data.coins || [];
  } catch (error) {
    return [];
  }
}

export function getStockLogoUrl(symbol: string): string {
  return `https://financialmodelingprep.com/image-stock/${symbol}.png`;
}

export async function fetchCryptoLogoUrl(cryptoId: string): Promise<string | undefined> {
  try {
    const response = await fetch(`https://api.coingecko.com/api/v3/coins/${cryptoId}`);
    if (!response.ok) {
      return undefined;
    }
    const data: CoinGeckoCoinDetails = await response.json();
    return data.image?.small || data.image?.thumb;
  } catch (error) {
    return undefined;
  }
}

