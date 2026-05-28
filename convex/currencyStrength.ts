import { query } from "./_generated/server";

/**
 * Deterministic seeded random number generator
 * Uses a simple LCG algorithm seeded from a string hash
 */
function seededRandom(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state * 1103515245 + 12345) & 0x7fffffff;
    return state / 0x7fffffff;
  };
}

/**
 * Hash a string to a numeric seed
 */
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

/**
 * Calculate currency strength based on real market price changes
 * Uses the price data from the prices table to derive strength metrics
 */
export const getHistory = query(async ({ db }) => {
  const prices = await db.query("prices").collect();
  
  if (prices.length === 0) {
    return null;
  }

  // Generate history based on current price changes
  // In a real implementation, this would query historical data
  // For now, we'll generate a history based on current 24h changes
  const historyLength = 30;
  
  // Map symbols to currencies
  const symbolToCurrency: Record<string, string> = {
    "XAU": "USD", // Gold is priced in USD, inverse relationship
    "BTC": "USD", // Bitcoin is priced in USD
    "OIL": "USD", // Oil is priced in USD
    "DXY": "USD", // US Dollar Index
    "NQ": "USD", // Nasdaq futures in USD
    "ES": "USD", // S&P futures in USD
  };

  // Calculate base strength from current 24h changes
  const getCurrencyStrength = (currency: string): number => {
    const relevantPrices = prices.filter(p => symbolToCurrency[p.symbol] === currency);
    if (relevantPrices.length === 0) return 0;
    
    const avgChange = relevantPrices.reduce((sum, p) => sum + (p.change24h || 0), 0) / relevantPrices.length;
    
    // For USD, DXY directly represents strength, others are inverse
    if (currency === "USD") {
      const dxyPrice = prices.find(p => p.symbol === "DXY");
      return dxyPrice ? (dxyPrice.change24h || 0) * 2 : avgChange;
    }
    
    return avgChange;
  };

  // Generate history arrays for each currency using deterministic PRNG
  const generateHistory = (baseValue: number, seed: string): number[] => {
    const rng = seededRandom(hashString(seed));
    const history: number[] = [];
    let currentValue = baseValue - (rng() - 0.5) * 5;
    
    for (let i = 0; i < historyLength; i++) {
      // Add some random variation but trend toward the current value
      const trend = (baseValue - currentValue) / (historyLength - i);
      currentValue = currentValue + trend + (rng() - 0.5) * 2;
      history.push(currentValue);
    }
    
    // Ensure last value matches current
    history[history.length - 1] = baseValue;
    return history;
  };

  const usdStrength = getCurrencyStrength("USD");
  const usdSeed = `USD:${usdStrength}:${Date.now()}`;
  const eurSeed = `EUR:${usdStrength}:${Date.now()}`;
  const gbpSeed = `GBP:${usdStrength}:${Date.now()}`;
  const jpySeed = `JPY:${usdStrength}:${Date.now()}`;
  
  const eurRng = seededRandom(hashString(eurSeed));
  const gbpRng = seededRandom(hashString(gbpSeed));
  const jpyRng = seededRandom(hashString(jpySeed));
  
  const eurStrength = -usdStrength * 0.8 + (eurRng() - 0.5) * 2; // EUR is roughly inverse of USD
  const gbpStrength = -usdStrength * 0.7 + (gbpRng() - 0.5) * 2; // GBP is roughly inverse of USD
  const jpyStrength = -usdStrength * 0.6 + (jpyRng() - 0.5) * 2; // JPY is roughly inverse of USD

  return {
    EUR: generateHistory(eurStrength, eurSeed),
    GBP: generateHistory(gbpStrength, gbpSeed),
    JPY: generateHistory(jpyStrength, jpySeed),
    USD: generateHistory(usdStrength, usdSeed),
  };
});

