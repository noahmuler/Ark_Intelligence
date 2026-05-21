import { mutation } from "./_generated/server";

// Seed minimal rows so the UI has something to render.
// Safe to run; upserts by symbol.
export const seed = mutation(async ({ db }) => {
  const now = Date.now();

  const priceSymbols = ["XAU", "BTC", "OIL", "DXY", "NQ", "ES"];
  for (const symbol of priceSymbols) {
    const existing = await db
      .query("prices")
      .withIndex("by_symbol", (q) => q.eq("symbol", symbol))
      .first();

    if (existing) {
      await db.patch(existing._id, {
        price: existing.price ?? 0,
        change24h: existing.change24h ?? 0,
        high: existing.high ?? 0,
        low: existing.low ?? 0,
        history: existing.history ?? [0, 0, 0, 0, 0],
        updatedAt: now,
      });
    } else {
      await db.insert("prices", {
        symbol,
        price: 0,
        change24h: 0,
        high: 0,
        low: 0,
        history: [0, 0, 0, 0, 0],
        updatedAt: now,
      });
    }
  }

  const assetSymbols = priceSymbols;
  for (const symbol of assetSymbols) {
    const existing = await db
      .query("asset_briefs")
      .withIndex("by_symbol", (q) => q.eq("symbol", symbol))
      .first();

    if (existing) {
      await db.patch(existing._id, {
        brief: existing.brief ?? "",
        updatedAt: now,
      });
    } else {
      await db.insert("asset_briefs", {
        symbol,
        brief: "Data will populate from Convex crons once ingestion is configured.",
        updatedAt: now,
      });
    }
  }
});

