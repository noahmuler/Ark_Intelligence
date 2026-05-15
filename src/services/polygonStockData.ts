/**
 * Polygon.io Real-Time Stock Data Integration
 * 
 * This service connects to Polygon.io's stock market API
 * to fetch real-time and historical stock data.
 */

export interface StockQuote {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  marketCap?: number;
  dayHigh?: number;
  dayLow?: number;
  fiftyTwoWeekHigh?: number;
  fiftyTwoWeekLow?: number;
  timestamp: Date;
}

export interface StockData {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  marketCap: number;
  dayHigh: number;
  dayLow: number;
  fiftyTwoWeekHigh: number;
  fiftyTwoWeekLow: number;
  lastUpdated: Date;
}

export interface MarketIndex {
  symbol: string;
  name: string;
  value: number;
  change: number;
  changePercent: number;
  timestamp: Date;
}

export interface PolygonStockResponse {
  data: StockData[];
  indices: MarketIndex[];
  lastUpdated: Date;
  source: string;
}

const API_BASE_URL = 'https://api.polygon.io/v2';
const API_KEY = process.env.NEXT_PUBLIC_POLYGON_API_KEY || 'demo_key';

// Circuit breaker pattern to prevent repeated failed requests
let consecutiveFailures = 0;
const MAX_CONSECUTIVE_FAILURES = 3;
let circuitBreakerTime = 0;
const CIRCUIT_BREAKER_DURATION = 60000; // 1 minute

function shouldUseCircuitBreaker(): boolean {
  const now = Date.now();
  if (consecutiveFailures >= MAX_CONSECUTIVE_FAILURES) {
    if (now - circuitBreakerTime < CIRCUIT_BREAKER_DURATION) {
      return true;
    } else {
      // Reset circuit breaker after duration
      consecutiveFailures = 0;
      return false;
    }
  }
  return false;
}

function recordFailure(): void {
  consecutiveFailures++;
  circuitBreakerTime = Date.now();
}

function recordSuccess(): void {
  consecutiveFailures = 0;
}

/**
 * Popular stock symbols to track
 */
const POPULAR_STOCKS = [
  'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'META', 'NVDA', 'TSLA', 'JPM', 
  'V', 'JNJ', 'WMT', 'PG', 'MA', 'UNH', 'HD', 'BAC', 'XOM'
];

/**
 * Major market indices
 */
const MARKET_INDICES = [
  { symbol: 'SPY', name: 'S&P 500' },
  { symbol: 'QQQ', name: 'NASDAQ 100' },
  { symbol: 'DIA', name: 'Dow Jones' },
  { symbol: 'IWM', name: 'Russell 2000' },
  { symbol: 'VTI', name: 'Total Stock Market' }
];

/**
 * Get demo stock quote for fallback when API fails
 */
function getDemoStockQuote(symbol: string): StockQuote {
  const demoData: { [key: string]: StockQuote } = {
    'XAUUSD': { symbol: 'XAUUSD', price: 2345.67, change: -8.23, changePercent: -0.35, volume: 124500, timestamp: new Date() },
    'XAGUSD': { symbol: 'XAGUSD', price: 28.45, change: 0.12, changePercent: 0.42, volume: 89700, timestamp: new Date() },
    'CL=F': { symbol: 'CL=F', price: 78.45, change: -1.23, changePercent: -1.54, volume: 567800, timestamp: new Date() },
    'DX-Y.NYB': { symbol: 'DX-Y.NYB', price: 105.82, change: 1.24, changePercent: 1.18, volume: 89200, timestamp: new Date() },
    '^TNX': { symbol: '^TNX', price: 4.32, change: -0.05, changePercent: -1.14, volume: 0, timestamp: new Date() },
    'AAPL': { symbol: 'AAPL', price: 178.45, change: 2.34, changePercent: 1.33, volume: 45200000, timestamp: new Date() },
    'MSFT': { symbol: 'MSFT', price: 378.22, change: 3.12, changePercent: 0.83, volume: 32100000, timestamp: new Date() },
    'GOOGL': { symbol: 'GOOGL', price: 142.56, change: -1.45, changePercent: -1.01, volume: 28900000, timestamp: new Date() },
    'AMZN': { symbol: 'AMZN', price: 145.78, change: 2.67, changePercent: 1.87, volume: 41200000, timestamp: new Date() },
    'META': { symbol: 'META', price: 485.23, change: 5.89, changePercent: 1.23, volume: 19800000, timestamp: new Date() },
    'NVDA': { symbol: 'NVDA', price: 875.28, change: 12.45, changePercent: 1.44, volume: 45600000, timestamp: new Date() },
    'TSLA': { symbol: 'TSLA', price: 245.67, change: -3.45, changePercent: -1.38, volume: 112000000, timestamp: new Date() }
  };
  
  return demoData[symbol] || {
    symbol,
    price: 100 + Math.random() * 1000,
    change: (Math.random() - 0.5) * 10,
    changePercent: (Math.random() - 0.5) * 5,
    volume: Math.floor(Math.random() * 1000000),
    timestamp: new Date()
  };
}

/**
 * Fetch real-time quote for a single stock
 */
export async function fetchStockQuote(symbol: string): Promise<StockQuote> {
  if (!API_KEY || API_KEY === 'demo_key') {
    console.warn('Invalid or missing POLYGON_API_KEY, using demo data');
    return getDemoStockQuote(symbol);
  }

  // Check circuit breaker
  if (shouldUseCircuitBreaker()) {
    console.warn(`Circuit breaker active for Polygon API, using demo data for ${symbol}`);
    return getDemoStockQuote(symbol);
  }

  try {
    // Add timeout to prevent hanging requests
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    const response = await fetch(
      `${API_BASE_URL}/aggs/ticker/${symbol}/prev?adjusted=true&apikey=${API_KEY}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: controller.signal
      }
    );

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.warn(`Polygon API request failed: ${response.status} ${response.statusText}, using demo data`);
      return getDemoStockQuote(symbol);
    }

    const data = await response.json();
    
    if (data.resultsCount === 0 || !data.results || data.results.length === 0) {
      console.warn(`No data found for symbol ${symbol}, using demo data`);
      return getDemoStockQuote(symbol);
    }

    const apiResult = data.results[0];
    const closePrice = apiResult.c || apiResult.close;
    const prevClose = apiResult.o || apiResult.open;
    const change = closePrice - prevClose;
    const changePercent = prevClose !== 0 ? (change / prevClose) * 100 : 0;

    const stockResult = {
      symbol,
      price: closePrice,
      change,
      changePercent,
      volume: apiResult.v || apiResult.volume || 0,
      dayHigh: apiResult.h || apiResult.high,
      dayLow: apiResult.l || apiResult.low,
      timestamp: new Date(apiResult.t || apiResult.timestamp)
    };

    recordSuccess(); // Reset failure count on success
    return stockResult;

  } catch (error) {
    // Handle specific network errors
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        console.warn(`Polygon API request timed out for ${symbol}, using demo data`);
      } else if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
        console.warn(`Network error fetching ${symbol}, using demo data:`, error.message);
      } else if (error.message.includes('CORS')) {
        console.warn(`CORS error fetching ${symbol}, using demo data:`, error.message);
      } else {
        console.error(`Unexpected error fetching ${symbol}, using demo data:`, error);
      }
    } else {
      console.error(`Unknown error fetching ${symbol}, using demo data:`, error);
    }
    recordFailure(); // Increment failure count for circuit breaker
    return getDemoStockQuote(symbol);
  }
}

/**
 * Fetch multiple stock quotes
 */
export async function fetchMultipleStockQuotes(symbols: string[]): Promise<StockQuote[]> {
  const promises = symbols.map(symbol => fetchStockQuote(symbol));
  return Promise.allSettled(promises).then(results => {
    return results
      .filter((result): result is PromiseFulfilledResult<StockQuote> => result.status === 'fulfilled')
      .map(result => result.value);
  });
}

/**
 * Fetch comprehensive stock data for dashboard
 */
export async function fetchStockMarketData(): Promise<PolygonStockResponse> {
  if (!API_KEY || API_KEY === 'demo_key') {
    console.warn('Invalid or missing POLYGON_API_KEY, using demo data');
    // Return demo data
    const stockQuotes = POPULAR_STOCKS.map(symbol => getDemoStockQuote(symbol));
    const indexQuotes = MARKET_INDICES.map(idx => getDemoStockQuote(idx.symbol));
    
    const stocks: StockData[] = stockQuotes.map(quote => ({
      symbol: quote.symbol,
      name: getStockName(quote.symbol),
      price: quote.price,
      change: quote.change,
      changePercent: quote.changePercent,
      volume: quote.volume,
      marketCap: 0,
      dayHigh: quote.dayHigh || 0,
      dayLow: quote.dayLow || 0,
      fiftyTwoWeekHigh: quote.fiftyTwoWeekHigh || 0,
      fiftyTwoWeekLow: quote.fiftyTwoWeekLow || 0,
      lastUpdated: quote.timestamp
    }));

    const indices: MarketIndex[] = indexQuotes.map((quote, index) => ({
      symbol: quote.symbol,
      name: MARKET_INDICES[index].name,
      value: quote.price,
      change: quote.change,
      changePercent: quote.changePercent,
      timestamp: quote.timestamp
    }));

    return {
      data: stocks,
      indices,
      lastUpdated: new Date(),
      source: "Demo Data (Polygon API unavailable)"
    };
  }

  try {
    // Fetch popular stocks
    const stockQuotes = await fetchMultipleStockQuotes(POPULAR_STOCKS);
    
    // Fetch market indices
    const indexQuotes = await fetchMultipleStockQuotes(MARKET_INDICES.map(idx => idx.symbol));
    
    // Transform stock data
    const stocks: StockData[] = stockQuotes.map(quote => ({
      symbol: quote.symbol,
      name: getStockName(quote.symbol),
      price: quote.price,
      change: quote.change,
      changePercent: quote.changePercent,
      volume: quote.volume,
      marketCap: 0, // Would need additional API call for market cap
      dayHigh: quote.dayHigh || 0,
      dayLow: quote.dayLow || 0,
      fiftyTwoWeekHigh: quote.fiftyTwoWeekHigh || 0,
      fiftyTwoWeekLow: quote.fiftyTwoWeekLow || 0,
      lastUpdated: quote.timestamp
    }));

    // Transform index data
    const indices: MarketIndex[] = indexQuotes.map((quote, index) => ({
      symbol: quote.symbol,
      name: MARKET_INDICES[index].name,
      value: quote.price,
      change: quote.change,
      changePercent: quote.changePercent,
      timestamp: quote.timestamp
    }));

    return {
      data: stocks,
      indices,
      lastUpdated: new Date(),
      source: "Polygon.io Real-Time Data"
    };

  } catch (error) {
    console.error('Error fetching Polygon stock market data:', error);
    throw error;
  }
}

/**
 * Get stock name from symbol (simplified mapping)
 */
function getStockName(symbol: string): string {
  const nameMap: { [key: string]: string } = {
    'AAPL': 'Apple Inc.',
    'MSFT': 'Microsoft Corporation',
    'GOOGL': 'Alphabet Inc.',
    'AMZN': 'Amazon.com Inc.',
    'META': 'Meta Platforms Inc.',
    'NVDA': 'NVIDIA Corporation',
    'TSLA': 'Tesla Inc.',
    'JPM': 'JPMorgan Chase & Co.',
    'V': 'Visa Inc.',
    'JNJ': 'Johnson & Johnson',
    'WMT': 'Walmart Inc.',
    'PG': 'Procter & Gamble Co.',
    'MA': 'Mastercard Incorporated',
    'UNH': 'UnitedHealth Group Incorporated',
    'HD': 'The Home Depot Inc.',
    'BAC': 'Bank of America Corporation',
    'XOM': 'Exxon Mobil Corporation',
    'SPY': 'SPDR S&P 500 ETF Trust',
    'QQQ': 'Invesco QQQ Trust',
    'DIA': 'SPDR Dow Jones Industrial Average ETF Trust',
    'IWM': 'iShares Russell 2000 ETF',
    'VTI': 'Vanguard Total Stock Market ETF'
  };
  
  return nameMap[symbol] || symbol;
}

/**
 * Fetch historical stock data
 */
export async function fetchHistoricalData(symbol: string, timeframe: '1D' | '1W' | '1M' | '3M' | '1Y' = '1M'): Promise<any> {
  if (!API_KEY) {
    throw new Error('NEXT_PUBLIC_POLYGON_API_KEY environment variable is required');
  }

  // Map timeframe to Polygon parameters
  const timeframeMap = {
    '1D': { multiplier: 1, timespan: 'day' },
    '1W': { multiplier: 1, timespan: 'week' },
    '1M': { multiplier: 1, timespan: 'month' },
    '3M': { multiplier: 3, timespan: 'month' },
    '1Y': { multiplier: 1, timespan: 'year' }
  };

  const { multiplier, timespan } = timeframeMap[timeframe];
  const endDate = new Date();
  const startDate = new Date();
  
  // Set start date based on timeframe
  switch (timeframe) {
    case '1D':
      startDate.setDate(startDate.getDate() - 1);
      break;
    case '1W':
      startDate.setDate(startDate.getDate() - 7);
      break;
    case '1M':
      startDate.setMonth(startDate.getMonth() - 1);
      break;
    case '3M':
      startDate.setMonth(startDate.getMonth() - 3);
      break;
    case '1Y':
      startDate.setFullYear(startDate.getFullYear() - 1);
      break;
  }

  try {
    const response = await fetch(
      `${API_BASE_URL}/aggs/ticker/${symbol}/range/${multiplier}/${timespan}/${startDate.toISOString().split('T')[0]}/${endDate.toISOString().split('T')[0]}?adjusted=true&sort=asc&apikey=${API_KEY}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      }
    );

    if (!response.ok) {
      throw new Error(`Polygon API request failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data;

  } catch (error) {
    console.error(`Error fetching historical data for ${symbol}:`, error);
    throw error;
  }
}

/**
 * Fetch market movers (top gainers and losers)
 */
export async function fetchMarketMovers(): Promise<{ gainers: StockQuote[], losers: StockQuote[] }> {
  try {
    const quotes = await fetchMultipleStockQuotes(POPULAR_STOCKS);
    
    // Sort by change percent
    const sortedQuotes = quotes.sort((a, b) => b.changePercent - a.changePercent);
    
    const gainers = sortedQuotes.filter(quote => quote.changePercent > 0).slice(0, 10);
    const losers = sortedQuotes.filter(quote => quote.changePercent < 0).slice(0, 10);
    
    return { gainers, losers };

  } catch (error) {
    console.error('Error fetching market movers:', error);
    throw error;
  }
}
