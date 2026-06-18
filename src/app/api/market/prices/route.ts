import { NextResponse } from 'next/server';

const SYMBOLS = {
  // Finnhub forex symbols
  DXY:    'OANDA:DXY',        // US Dollar Index via OANDA feed
  XAUUSD: 'OANDA:XAU_USD',   // Gold
  XAGUSD: 'OANDA:XAG_USD',   // Silver
  EURUSD: 'OANDA:EUR_USD',
  GBPUSD: 'OANDA:GBP_USD',
  USDJPY: 'OANDA:USD_JPY',
  // Crypto — Finnhub uses BINANCE prefix
  BTCUSD: 'BINANCE:BTCUSDT',
  ETHUSD: 'BINANCE:ETHUSDT',
  // US10Y — use FRED or Finnhub bond endpoint
};

export async function GET() {
  const apiKey = process.env.FINNHUB_API_KEY;
  if (!apiKey) return NextResponse.json({ error: 'No API key' }, { status: 500 });

  const entries = Object.entries(SYMBOLS);
  
  const results = await Promise.allSettled(
    entries.map(async ([name, symbol]) => {
      const res = await fetch(
        `https://finnhub.io/api/v1/quote?symbol=${encodeURIComponent(symbol)}&token=${apiKey}`,
        { next: { revalidate: 10 } } // 10-second server cache
      );
      const data = await res.json();
      // Finnhub quote: { c: current, h: high, l: low, o: open, pc: prev_close, t: timestamp }
      return {
        name,
        symbol,
        price: data.c,
        open: data.o,
        high: data.h,
        low: data.l,
        prevClose: data.pc,
        change: data.c - data.pc,
        changePercent: ((data.c - data.pc) / data.pc) * 100,
        timestamp: data.t,
      };
    })
  );

  const prices: Record<string, object> = {};
  results.forEach((r, i) => {
    if (r.status === 'fulfilled') {
      prices[entries[i][0]] = r.value;
    }
  });

  // US10Y — fetch from FRED
  try {
    const fredRes = await fetch(
      `https://api.stlouisfed.org/fred/series/observations?series_id=DGS10&api_key=${process.env.FRED_API_KEY}&file_type=json&limit=1&sort_order=desc`,
      { next: { revalidate: 3600 } }
    );
    const fredData = await fredRes.json();
    const obs = fredData.observations?.[0];
    prices['US10Y'] = {
      name: 'US10Y',
      price: parseFloat(obs?.value),
      change: 0,
      changePercent: 0,
      timestamp: new Date(obs?.date).getTime() / 1000,
    };
  } catch (e) {
    console.error('[ARK] FRED fetch failed', e);
  }

  return NextResponse.json({ prices, fetchedAt: Date.now() });
}
