/**
 * CoinGecko API Integration for Cryptocurrency Data
 * Provides real-time crypto prices and market data
 */

const API_KEY = process.env.COIN_GECKO_API_KEY;
const API_BASE_URL = 'https://api.coingecko.com/api/v3';

export interface CryptoData {
  id: string;
  symbol: string;
  name: string;
  current_price: number;
  price_change_percentage_24h: number;
  price_change_percentage_7d: number;
  market_cap: number;
  total_volume: number;
  high_24h: number;
  low_24h: number;
  sparkline_7d: number[];
  last_updated: string;
}

export interface CryptoPriceResponse {
  [key: string]: {
    usd: number;
    usd_24h_change: number;
    usd_24h_vol: number;
    last_updated_at: number;
  };
}

/**
 * Fetch cryptocurrency data by ID
 */
export async function fetchCryptoData(cryptoId: string): Promise<CryptoData | null> {
  if (!API_KEY) {
    console.warn('COIN_GECKO_API_KEY not found, using fallback data');
    return null;
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(
      `${API_BASE_URL}/coins/${cryptoId}?localization=false&tickers=false&market_data=true&community_data=false&developer_data=false&sparkline=true&x_cg_demo_api_key=${API_KEY}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Ark-Intelligence/1.0'
        },
        signal: controller.signal
      }
    );

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.warn(`CoinGecko API request failed for ${cryptoId}: ${response.status} ${response.statusText}`);
      return null;
    }

    const data = await response.json();

    return {
      id: data.id,
      symbol: data.symbol.toUpperCase(),
      name: data.name,
      current_price: data.market_data.current_price.usd,
      price_change_percentage_24h: data.market_data.price_change_percentage_24h,
      price_change_percentage_7d: data.market_data.price_change_percentage_7d,
      market_cap: data.market_data.market_cap.usd,
      total_volume: data.market_data.total_volume.usd,
      high_24h: data.market_data.high_24h.usd,
      low_24h: data.market_data.low_24h.usd,
      sparkline_7d: data.market_data.sparkline_7d.price,
      last_updated: data.market_data.last_updated
    };

  } catch (error) {
    console.error(`Error fetching crypto data for ${cryptoId}:`, error);
    return null;
  }
}

/**
 * Fetch multiple cryptocurrencies by IDs
 */
export async function fetchMultipleCryptoData(cryptoIds: string[]): Promise<CryptoData[]> {
  if (!API_KEY) {
    console.warn('COIN_GECKO_API_KEY not found, using fallback data');
    return [];
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(
      `${API_BASE_URL}/coins/markets?vs_currency=usd&ids=${cryptoIds.join(',')}&order=market_cap_desc&per_page=100&page=1&sparkline=true&price_change_percentage=24h,7d&x_cg_demo_api_key=${API_KEY}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Ark-Intelligence/1.0'
        },
        signal: controller.signal
      }
    );

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.warn(`CoinGecko API request failed: ${response.status} ${response.statusText}`);
      return [];
    }

    const data = await response.json();

    return data.map((crypto: any) => ({
      id: crypto.id,
      symbol: crypto.symbol.toUpperCase(),
      name: crypto.name,
      current_price: crypto.current_price,
      price_change_percentage_24h: crypto.price_change_percentage_24h,
      price_change_percentage_7d: crypto.price_change_percentage_7d,
      market_cap: crypto.market_cap,
      total_volume: crypto.total_volume,
      high_24h: crypto.high_24h,
      low_24h: crypto.low_24h,
      sparkline_7d: crypto.sparkline_in_7d?.price || [],
      last_updated: crypto.last_updated
    }));

  } catch (error) {
    console.error('Error fetching multiple crypto data:', error);
    return [];
  }
}

/**
 * Get simple price data for multiple cryptocurrencies
 */
export async function fetchSimplePrices(cryptoIds: string[]): Promise<CryptoPriceResponse | null> {
  if (!API_KEY) {
    console.warn('COIN_GECKO_API_KEY not found, using fallback data');
    return null;
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    const response = await fetch(
      `${API_BASE_URL}/simple/price?ids=${cryptoIds.join(',')}&vs_currencies=usd&include_24hr_change=true&include_24hr_vol=true&x_cg_demo_api_key=${API_KEY}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Ark-Intelligence/1.0'
        },
        signal: controller.signal
      }
    );

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.warn(`CoinGecko simple price request failed: ${response.status} ${response.statusText}`);
      return null;
    }

    return await response.json();

  } catch (error) {
    console.error('Error fetching simple crypto prices:', error);
    return null;
  }
}

/**
 * Get fallback crypto data when API fails
 */
export function getFallbackCryptoData(symbol: string): CryptoData {
  const fallbackData: { [key: string]: CryptoData } = {
    'BTC': {
      id: 'bitcoin',
      symbol: 'BTC',
      name: 'Bitcoin',
      current_price: 67234.89,
      price_change_percentage_24h: 3.6,
      price_change_percentage_7d: 12.45,
      market_cap: 1310000000000,
      total_volume: 2800000000,
      high_24h: 68500,
      low_24h: 66500,
      sparkline_7d: [],
      last_updated: new Date().toISOString()
    },
    'ETH': {
      id: 'ethereum',
      symbol: 'ETH',
      name: 'Ethereum',
      current_price: 3524.78,
      price_change_percentage_24h: 3.5,
      price_change_percentage_7d: 8.34,
      market_cap: 423500000000,
      total_volume: 1200000000,
      high_24h: 3580,
      low_24h: 3450,
      sparkline_7d: [],
      last_updated: new Date().toISOString()
    }
  };

  return fallbackData[symbol] || fallbackData['BTC'];
}

/**
 * Map common crypto symbols to CoinGecko IDs
 */
export const CRYPTO_SYMBOL_MAP: { [key: string]: string } = {
  'BTCUSD': 'bitcoin',
  'ETHUSD': 'ethereum',
  'ADAUSD': 'cardano',
  'SOLUSD': 'solana',
  'DOTUSD': 'polkadot',
  'BTC': 'bitcoin',
  'ETH': 'ethereum',
  'ADA': 'cardano',
  'SOL': 'solana',
  'DOT': 'polkadot'
};
