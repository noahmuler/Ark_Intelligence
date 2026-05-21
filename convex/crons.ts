// Convex crons configuration
import { action } from "convex/server";
import { upsertPrice, upsertAssetBrief } from "./actions";
import { fetchPriceData, fetchEconomicReports } from "../services/externalFetch"; // hypothetical fetch helpers

// Cron to run every 2 minutes for price updates
export const priceCron = action(async (ctx) => {
  const data = await fetchPriceData(); // Expected: array of {symbol, price, change24h, high, low, history}
  for (const item of data) {
    await upsertPrice(ctx, {
      symbol: item.symbol,
      price: item.price,
      change24h: item.change24h,
      high: item.high,
      low: item.low,
      history: item.history,
      updatedAt: Date.now(),
    });
  }
});

// Cron to run every 30 minutes for economic reports and bias generation
export const reportCron = action(async (ctx) => {
  const reports = await fetchEconomicReports(); // Expected: array of report objects matching schema
  for (const rpt of reports) {
    const biases = generateBiases(rpt); // Helper to map report outcome to asset biases
    await ctx.db.insert("economic_reports", {
      title: rpt.title,
      country: rpt.country,
      actual: rpt.actual,
      forecast: rpt.forecast,
      previous: rpt.previous,
      impact: rpt.impact,
      biases,
      timestamp: Date.now(),
    });
    // Also upsert a one‑sentence brief per asset if available
    if (rpt.briefs) {
      for (const [symbol, brief] of Object.entries(rpt.briefs)) {
        await upsertAssetBrief(ctx, {
          symbol,
          brief,
          updatedAt: Date.now(),
        });
      }
    }
  }
});

function generateBiases(report) {
  // Very simple placeholder bias logic – replace with actual evaluation
  const direction = report.actual > report.forecast ? "Bullish" : "Bearish";
  return {
    XAU: direction,
    BTC: direction,
    OIL: direction,
    DXY: direction,
    NQ: direction,
    ES: direction,
  };
}
