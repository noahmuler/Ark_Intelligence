import { NextResponse } from 'next/server';

type PriceRecord = {
  name: string;
  symbol: string;
  price: number;
  open?: number;
  high?: number;
  low?: number;
  prevClose: number;
  change: number;
  changePercent: number;
  timestamp: number;
};

type YahooQuote = {
  regularMarketPrice?: number;
  regularMarketPreviousClose?: number;
  regularMarketOpen?: number;
  regularMarketDayHigh?: number;
  regularMarketDayLow?: number;
};

const FINNHUB_SYMBOLS: Record<string, string> = {
  XAUUSD: 'OANDA:XAU_USD',
  XAGUSD: 'OANDA:XAG_USD',
  EURUSD: 'OANDA:EUR_USD',
  GBPUSD: 'OANDA:GBP_USD',
  USDJPY: 'OANDA:USD_JPY',
  AUDUSD: 'OANDA:AUD_USD',
  USDCAD: 'OANDA:USD_CAD',
  USDCHF: 'OANDA:USD_CHF',
  NZDUSD: 'OANDA:NZD_USD',
  BTCUSD: 'BINANCE:BTCUSDT',
  ETHUSD: 'BINANCE:ETHUSDT',
  WTIUSD: 'OANDA:WTICO_USD',
};

function buildYahooPrice(name: string, symbol: string, quote: YahooQuote): PriceRecord | null {
  const price = quote.regularMarketPrice ?? 0;
  if (price <= 0) return null;

  const prevClose = quote.regularMarketPreviousClose ?? price;
  return {
    name,
    symbol,
    price,
    open: quote.regularMarketOpen ?? price,
    high: quote.regularMarketDayHigh ?? price,
    low: quote.regularMarketDayLow ?? price,
    prevClose,
    change: price - prevClose,
    changePercent: prevClose > 0 ? ((price - prevClose) / prevClose) * 100 : 0,
    timestamp: Math.floor(Date.now() / 1000),
  };
}

export async function GET() {
  const apiKey = process.env.FINNHUB_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'FINNHUB_API_KEY missing' }, { status: 500 });
  }

  const entries = Object.entries(FINNHUB_SYMBOLS);

  const [finnhubResults, yahooResults, us10yData, coingeckoData] = await Promise.allSettled([
    Promise.allSettled(
      entries.map(async ([name, symbol]) => {
        const res = await fetch(
          `https://finnhub.io/api/v1/quote?symbol=${encodeURIComponent(symbol)}&token=${apiKey}`,
          { next: { revalidate: 10 } }
        );
        const data = await res.json();
        if (!data.c || data.c === 0) throw new Error(`No data for ${symbol}`);

        const prevClose = data.pc ?? data.c;
        return {
          name,
          symbol,
          price: data.c,
          open: data.o,
          high: data.h,
          low: data.l,
          prevClose,
          change: data.c - prevClose,
          changePercent: prevClose > 0 ? ((data.c - prevClose) / prevClose) * 100 : 0,
          timestamp: data.t,
        } satisfies PriceRecord;
      })
    ),
    (async () => {
      const { default: yahooFinance } = await import('yahoo-finance2');
      const [dxyQuote, vixQuote] = await Promise.allSettled([
        yahooFinance.quote('DX-Y.NYB') as Promise<YahooQuote>,
        yahooFinance.quote('^VIX') as Promise<YahooQuote>,
      ]);

      return {
        DXY: dxyQuote.status === 'fulfilled' ? buildYahooPrice('DXY', 'DX-Y.NYB', dxyQuote.value) : null,
        VIX: vixQuote.status === 'fulfilled' ? buildYahooPrice('VIX', '^VIX', vixQuote.value) : null,
      };
    })(),
    (async () => {
      const fredKey = process.env.FRED_API_KEY;
      if (!fredKey) return null;

      const res = await fetch(
        `https://api.stlouisfed.org/fred/series/observations?series_id=DGS10&api_key=${fredKey}&file_type=json&limit=2&sort_order=desc`,
        { next: { revalidate: 3600 } }
      );
      const data = await res.json();
      const obs = data.observations;
      const current = parseFloat(obs?.[0]?.value);
      const prev = parseFloat(obs?.[1]?.value);
      if (!Number.isFinite(current)) return null;

      const prevClose = Number.isFinite(prev) ? prev : current;
      return {
        name: 'US10Y',
        symbol: 'DGS10',
        price: current,
        prevClose,
        change: current - prevClose,
        changePercent: prevClose > 0 ? ((current - prevClose) / prevClose) * 100 : 0,
        timestamp: new Date(obs?.[0]?.date).getTime() / 1000,
      } satisfies PriceRecord;
    })(),
    // CoinGecko fallback for BTC
    (async () => {
      const cgKey = process.env.COINGECKO_API_KEY;
      if (!cgKey) return null;
      try {
        const url = cgKey.startsWith('CG-') 
          ? `https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd&include_24hr_change=true&x_cg_demo_api_key=${cgKey}`
          : `https://pro-api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd&include_24hr_change=true&x_cg_pro_api_key=${cgKey}`;
        const res = await fetch(url, { next: { revalidate: 60 } });
        const data = await res.json();
        const btc = data.bitcoin;
        if (!btc?.usd) return null;
        const price = btc.usd;
        const changePercent = btc.usd_24h_change ?? 0;
        const prevClose = price / (1 + changePercent / 100);
        return {
          name: 'BTCUSD',
          symbol: 'BTC-USD',
          price,
          prevClose,
          change: price - prevClose,
          changePercent,
          timestamp: Math.floor(Date.now() / 1000),
        } satisfies PriceRecord;
      } catch {
        return null;
      }
    })(),
  ]);

  const prices: Record<string, PriceRecord> = {};

  if (finnhubResults.status === 'fulfilled') {
    finnhubResults.value.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        prices[entries[index][0]] = result.value;
      }
    });
  }

  if (yahooResults.status === 'fulfilled') {
    if (yahooResults.value.DXY) prices.DXY = yahooResults.value.DXY;
    if (yahooResults.value.VIX) prices.VIX = yahooResults.value.VIX;
  }

  if (us10yData.status === 'fulfilled' && us10yData.value) {
    prices.US10Y = us10yData.value;
  }

  // Use CoinGecko BTC if Finnhub BTC failed or is missing
  if (coingeckoData.status === 'fulfilled' && coingeckoData.value) {
    if (!prices.BTCUSD || prices.BTCUSD.price === 0) {
      prices.BTCUSD = coingeckoData.value;
    }
  }

  return NextResponse.json({ prices, fetchedAt: Date.now() });
}
