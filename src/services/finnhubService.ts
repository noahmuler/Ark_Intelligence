"use node";

interface FinnhubQuote {
  c: number; // Current price
  d: number; // Change
  dp: number; // Percent change
  h: number; // High price of the day
  l: number; // Low price of the day
  o: number; // Open price of the day
  pc: number; // Previous close price
  t: number; // Timestamp
}

interface FinnhubCryptoQuote {
  c: number; // Current price
  h: number; // High
  l: number; // Low
  o: number; // Open
  pc: number; // Previous close
}

export async function fetchFinnhubQuote(symbol: string): Promise<{
  price: number;
  change24h: number;
  high: number;
  low: number;
  timestamp: number;
}> {
  const apiKey = process.env.FINNHUB_API_KEY;
  if (!apiKey) {
    throw new Error("FINNHUB_API_KEY not set");
  }

  // Check if it's a crypto symbol
  const isCrypto = symbol === "BTC" || symbol === "ETH";
  const endpoint = isCrypto
    ? `https://api.finnhub.io/api/v1/crypto/candle?symbol=BINANCE:${symbol}USDT&resolution=D&count=1&token=${apiKey}`
    : `https://api.finnhub.io/api/v1/quote?symbol=${symbol}&token=${apiKey}`;

  const response = await fetch(endpoint);
  if (!response.ok) {
    throw new Error(`Finnhub API error: ${response.statusText}`);
  }

  const data = isCrypto ? await response.json() : (await response.json()) as FinnhubQuote;

  if (isCrypto) {
    const cryptoData = data as any;
    if (!cryptoData.c || cryptoData.c.length === 0) {
      throw new Error("No crypto data returned");
    }
    const latest = cryptoData.c[0];
    const previous = cryptoData.o[0] || latest;
    return {
      price: latest,
      change24h: ((latest - previous) / previous) * 100,
      high: cryptoData.h[0] || latest,
      low: cryptoData.l[0] || latest,
      timestamp: Date.now(),
    };
  }

  return {
    price: data.c,
    change24h: data.dp,
    high: data.h,
    low: data.l,
    timestamp: Date.now(),
  };
}

export async function fetchFinnhubMultipleQuotes(symbols: string[]): Promise<Array<{
  symbol: string;
  price: number;
  change24h: number;
  high: number;
  low: number;
  timestamp: number;
}>> {
  const results = await Promise.allSettled(
    symbols.map(symbol => fetchFinnhubQuote(symbol))
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
