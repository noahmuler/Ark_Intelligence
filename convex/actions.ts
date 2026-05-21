// Convex actions for Ark Intelligence

import { query, mutation } from "./_generated/server";


// Query all price entries sorted by symbol
export const getAll = query(({ db }) => {
  // Convex ordering only supports "asc"/"desc" on indexes.
  return db.query("prices").withIndex("by_symbol", (q) => q).order("asc");
});

// Query all asset briefs sorted by symbol
export const getAllAssetBriefs = query(({ db }) => {
  return db.query("asset_briefs").order("by_symbol");
});

// Public API expected by the frontend: api.asset_briefs.getAll
export const __compat_getAll_asset_briefs = getAllAssetBriefs;

// Query all price entries (alias for getAll)
export const getAllPrices = query(({ db }) => {
  return db.query("prices").order("by_symbol");
});

// Query the latest asset brief for a given symbol
export const getAssetBrief = query(({ db }, symbol: string) => {
  return db
    .query("asset_briefs")
    .withIndex("by_symbol", (q) => q.eq("symbol", symbol))
    .order("updatedAt", "desc")
    .first();
});

// Mutation to upsert a price record (used by cron jobs)
export const upsertPrice = mutation(
  (
    { db },
    data: {
      symbol: string;
      price: number;
      change24h: number;
      high: number;
      low: number;
      history: number[];
      updatedAt: number;
    }
  ) => {
    const existing = db
      .query("prices")
      .withIndex("by_symbol", (q) => q.eq("symbol", data.symbol))
      .first();
    if (existing) {
      return db.patch(existing._id, data);
    }
    return db.insert("prices", data);
  }
);

// Mutation to upsert an asset brief (used by AI pipeline)
export const upsertAssetBrief = mutation(
  (
    { db },
    data: { symbol: string; brief: string; updatedAt: number }
  ) => {
    const existing = db
      .query("asset_briefs")
      .withIndex("by_symbol", (q) => q.eq("symbol", data.symbol))
      .first();
    if (existing) {
      return db.patch(existing._id, data);
    }
    return db.insert("asset_briefs", data);
  }
);
