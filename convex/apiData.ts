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
    const { default: yahooFinance } = await import('yahoo-finance2');

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
        const quote = await yahooFinance.quote(yahooSymbol) as any;
        const price = quote.regularMarketPrice ?? 0;
        const prev  = quote.regularMarketPreviousClose ?? price;
        const change24h = prev > 0 ? ((price - prev) / prev) * 100 : 0;

        await ctx.runMutation(api.actions.upsertPrice, {
          symbol: convexKey,
          price,
          change24h,
          high: quote.regularMarketDayHigh ?? price,
          low: quote.regularMarketDayLow ?? price,
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
