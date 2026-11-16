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

function quoteNumber(quote: Record<string, unknown>, field: string, fallback: number): number {
  const value = quote[field];
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function buildYahooPrice(name: string, symbol: string, quote: Record<string, unknown>): PriceRecord | null {
  const price = quoteNumber(quote, 'regularMarketPrice', 0);
  if (price <= 0) return null;

  const prevClose = quoteNumber(quote, 'regularMarketPreviousClose', price);
  return {
    name,
    symbol,
    price,
    open: quoteNumber(quote, 'regularMarketOpen', price),
    high: quoteNumber(quote, 'regularMarketDayHigh', price),
    low: quoteNumber(quote, 'regularMarketDayLow', price),
    prevClose,
    change: price - prevClose,
    changePercent: prevClose > 0 ? ((price - prevClose) / prevClose) * 100 : 0,
    timestamp: Math.floor(Date.now() / 1000),
  };
}

export async function GET() {
  const apiKey = process.env.FINNHUB_API_KEY;
  const warnings = apiKey
    ? []
    : ['FINNHUB_API_KEY is not configured; Finnhub quotes are unavailable.'];
  const entries = Object.entries(FINNHUB_SYMBOLS);

  const [finnhubResults, yahooResults, us10yData, coingeckoData] = await Promise.allSettled([
    apiKey
      ? Promise.allSettled(
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
        )
      : Promise.resolve(null),
    (async () => {
      const { default: YahooFinance } = await import('yahoo-finance2');
      const yahooFinance = new YahooFinance();
      const [dxyQuote, vixQuote, esQuote, nqQuote] = await Promise.allSettled([
        yahooFinance.quote('DX-Y.NYB'),
        yahooFinance.quote('^VIX'),
        yahooFinance.quote('ES=F'),
        yahooFinance.quote('NQ=F'),
      ]);

      return {
        DXY: dxyQuote.status === 'fulfilled' ? buildYahooPrice('DXY', 'DX-Y.NYB', dxyQuote.value) : null,
        VIX: vixQuote.status === 'fulfilled' ? buildYahooPrice('VIX', '^VIX', vixQuote.value) : null,
        ES: esQuote.status === 'fulfilled' ? buildYahooPrice('ES', 'ES=F', esQuote.value) : null,
        NQ: nqQuote.status === 'fulfilled' ? buildYahooPrice('NQ', 'NQ=F', nqQuote.value) : null,
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

  if (finnhubResults.status === 'fulfilled' && finnhubResults.value) {
    finnhubResults.value.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        prices[entries[index][0]] = result.value;
      }
    });
  }

  if (yahooResults.status === 'fulfilled') {
    if (yahooResults.value.DXY) prices.DXY = yahooResults.value.DXY;
    if (yahooResults.value.VIX) prices.VIX = yahooResults.value.VIX;
    if (yahooResults.value.ES) prices.ES = yahooResults.value.ES;
    if (yahooResults.value.NQ) prices.NQ = yahooResults.value.NQ;
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

  if (Object.keys(prices).length === 0) {
    return NextResponse.json(
      { error: 'No market prices could be fetched', warnings },
      { status: 503 }
    );
  }

  return NextResponse.json({ prices, fetchedAt: Date.now(), warnings });
}
