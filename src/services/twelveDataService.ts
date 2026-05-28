"use node";

interface TwelveDataQuote {
  symbol: string;
  price: number;
  day_high: number;
  day_low: number;
  change: number;
  change_percent: string;
  previous_close: number;
  timestamp: number;
}

interface TwelveDataError {
  status: string;
  message: string;
}

export async function fetchTwelveDataQuote(symbol: string): Promise<{
  price: number;
  change24h: number;
  high: number;
  low: number;
  timestamp: number;
}> {
  const apiKey = process.env.TWELVEDATA_API_KEY;
  if (!apiKey) {
    throw new Error("TWELVEDATA_API_KEY not set");
  }

  // Map symbols to TwelveData format
  const symbolMap: Record<string, string> = {
    "XAU": "XAU/USD",
    "BTC": "BTC/USD",
    "OIL": "WTI/USD",
    "DXY": "DXY",
    "NQ": "US100/USD",
    "ES": "US500/USD",
  };

  const mappedSymbol = symbolMap[symbol] || symbol;
  const endpoint = `https://api.twelvedata.com/quote?symbol=${mappedSymbol}&apikey=${apiKey}`;

  const response = await fetch(endpoint);
  if (!response.ok) {
    throw new Error(`TwelveData API error: ${response.statusText}`);
  }

  const data = await response.json() as TwelveDataQuote | TwelveDataError;

  if ("status" in data && data.status === "error") {
    throw new Error(`TwelveData error: ${(data as TwelveDataError).message}`);
  }

  const quote = data as TwelveDataQuote;
  return {
    price: quote.price,
    change24h: parseFloat(quote.change_percent),
    high: quote.day_high,
    low: quote.day_low,
    timestamp: Date.now(),
  };
}

export async function fetchTwelveDataMultipleQuotes(symbols: string[]): Promise<Array<{
  symbol: string;
  price: number;
  change24h: number;
  high: number;
  low: number;
  timestamp: number;
}>> {
  const results = await Promise.allSettled(
    symbols.map(symbol => fetchTwelveDataQuote(symbol))
  );

  return results.map((result, index) => {
    if (result.status === "fulfilled") {
      return { symbol: symbols[index], ...result.value };
    }
    console.error(`Failed to fetch ${symbols[index]}:`, result.reason);
    return {
      symbol: symbols[index],
      price: 0,
      change24h: 0,
      high: 0,
      low: 0,
      timestamp: Date.now(),
    };
  });
}
