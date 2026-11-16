"use node";

import { internalAction } from "./_generated/server";
import { api } from "./_generated/api";

/**
 * Fetch prices from Yahoo Finance and store in database.
 * Called by the cron job every minute.
 */
export const fetchAndStorePrices = internalAction({
  args: {},
  handler: async (ctx) => {
    const { default: YahooFinance } = await import('yahoo-finance2');
    const yahooFinance = new YahooFinance();

    const symbolMap = [
      { convexKey: 'XAU',  yahooSymbol: 'GC=F'      },
      { convexKey: 'BTC',  yahooSymbol: 'BTC-USD'   },
      { convexKey: 'OIL',  yahooSymbol: 'CL=F'      },
      { convexKey: 'DXY',  yahooSymbol: 'DX-Y.NYB'  },
      { convexKey: 'NQ',   yahooSymbol: 'NQ=F'      },
      { convexKey: 'ES',   yahooSymbol: 'ES=F'      },
    ];

    const results = [];
    for (const { convexKey, yahooSymbol } of symbolMap) {
      try {
        const quote = await yahooFinance.quote(yahooSymbol);
        const quoteData: Record<string, unknown> = quote;
        const priceValue = quoteData.regularMarketPrice;
        const price = typeof priceValue === 'number' ? priceValue : 0;
        const previousClose = quoteData.regularMarketPreviousClose;
        const prev = typeof previousClose === 'number' ? previousClose : price;
        const change24h = prev > 0 ? ((price - prev) / prev) * 100 : 0;
        const dayHigh = quoteData.regularMarketDayHigh;
        const dayLow = quoteData.regularMarketDayLow;

        await ctx.runMutation(api.actions.upsertPrice, {
          symbol: convexKey,
          price,
          change24h,
          high: typeof dayHigh === 'number' ? dayHigh : price,
          low: typeof dayLow === 'number' ? dayLow : price,
          history: [],
          updatedAt: Date.now(),
        });
        results.push({ symbol: convexKey, price, success: true });
      } catch (err) {
        console.error(`[ark] fetchAndStorePrices failed for ${convexKey}:`, err);
        results.push({ symbol: convexKey, success: false });
      }
    }

    return { success: true, count: results.filter(r => r.success).length, results };
  },
});
