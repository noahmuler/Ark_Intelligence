"use node";

interface PolygonQuote {
  c: number; // Close price
  h: number; // High price
  l: number; // Low price
  o: number; // Open price
  v: number; // Volume
  vw: number; // Volume weighted average price
}

interface PolygonPreviousClose {
  c: number; // Close price
  h: number; // High price
  l: number; // Low price
  o: number; // Open price
  v: number; // Volume
  vw: number; // Volume weighted average price
}

export async function fetchPolygonQuote(symbol: string): Promise<{
  price: number;
  change24h: number;
  high: number;
  low: number;
  timestamp: number;
}> {
  const apiKey = process.env.POLYGON_API_KEY;
  if (!apiKey) {
    throw new Error("POLYGON_API_KEY not set");
  }

  // Map symbols to Polygon format
  const symbolMap: Record<string, string> = {
    "XAU": "X:AUUSD",
    "BTC": "X:BTCUSD",
    "OIL": "X:WTIUSD",
    "DXY": "I:DXY",
    "NQ": "I:NDX",
    "ES": "I:SPX",
  };

  const mappedSymbol = symbolMap[symbol] || symbol;
  const today = new Date().toISOString().split("T")[0];

  // Fetch previous close
  const prevCloseEndpoint = `https://api.polygon.io/v2/aggs/ticker/${mappedSymbol}/prev?adjusted=true&apiKey=${apiKey}`;
  const prevCloseResponse = await fetch(prevCloseEndpoint);
  if (!prevCloseResponse.ok) {
    throw new Error(`Polygon previous close API error: ${prevCloseResponse.statusText}`);
  }
  const prevCloseData = await prevCloseResponse.json();
  const previousClose = prevCloseData.results?.[0]?.c || 0;

  // Fetch current day's data
  const endpoint = `https://api.polygon.io/v2/aggs/ticker/${mappedSymbol}/range/1/day/${today}/${today}?adjusted=true&apiKey=${apiKey}`;
  const response = await fetch(endpoint);
  if (!response.ok) {
    throw new Error(`Polygon API error: ${response.statusText}`);
  }

  const data = await response.json();
  
  if (!data.results || data.results.length === 0) {
    throw new Error("No data returned from Polygon");
  }

  const result = data.results[0] as PolygonQuote;
  const change24h = previousClose > 0 ? ((result.c - previousClose) / previousClose) * 100 : 0;

  return {
    price: result.c,
    change24h,
    high: result.h,
    low: result.l,
    timestamp: Date.now(),
  };
}

export async function fetchPolygonMultipleQuotes(symbols: string[]): Promise<Array<{
  symbol: string;
  price: number;
  change24h: number;
  high: number;
  low: number;
  timestamp: number;
}>> {
  const results = await Promise.allSettled(
    symbols.map(symbol => fetchPolygonQuote(symbol))
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
