// Convex actions for Ark Intelligence

import { query, mutation } from "./_generated/server";
import { v } from "convex/values";


// Query all price entries sorted by symbol
export const getAll = query(({ db }) => {
  // Convex ordering only supports "asc"/"desc" on indexes.
  return db.query("prices").withIndex("by_symbol", (q) => q).order("asc").collect();
});

// Query all asset briefs sorted by symbol
export const getAllAssetBriefs = query(({ db }) => {
  return db.query("asset_briefs").withIndex("by_symbol", (q) => q).order("asc").collect();
});

// Public API expected by the frontend: api.asset_briefs.getAll
export const __compat_getAll_asset_briefs = getAllAssetBriefs;

// Query all price entries (alias for getAll)
export const getAllPrices = query(({ db }) => {
  return db.query("prices").withIndex("by_symbol", (q) => q).order("asc").collect();
});

// Query the latest asset brief for a given symbol
export const getAssetBrief = query({
  args: { symbol: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("asset_briefs")
      .withIndex("by_symbol", (q) => q.eq("symbol", args.symbol))
      .unique();
  },
});

// Mutation to upsert a price record (used by cron jobs)
export const upsertPrice = mutation({
  args: {
    symbol: v.string(),
    price: v.number(),
    change24h: v.number(),
    high: v.number(),
    low: v.number(),
    history: v.array(v.number()),
    updatedAt: v.number(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("prices")
      .withIndex("by_symbol", (q) => q.eq("symbol", args.symbol))
      .unique();
    if (existing) {
      return await ctx.db.patch(existing._id, args);
    }
    return await ctx.db.insert("prices", args);
  },
});

// Mutation to upsert an asset brief (used by AI pipeline)
export const upsertAssetBrief = mutation({
  args: {
    symbol: v.string(),
    brief: v.string(),
    updatedAt: v.number(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("asset_briefs")
      .withIndex("by_symbol", (q) => q.eq("symbol", args.symbol))
      .unique();
    if (existing) {
      return await ctx.db.patch(existing._id, args);
    }
    return await ctx.db.insert("asset_briefs", args);
  },
});

// Mutation to update all asset briefs with rule-based templates
// Briefs are generated from hardcoded templates based on price change24h thresholds.
// The template logic uses the change variable to build brief strings through conditional branching,
// referencing the assetDescriptions map. This is deterministic, threshold-driven templating,
// not real market analysis or AI-generated analysis.
export const updateAllAssetBriefs = mutation({
  args: {},
  handler: async (ctx) => {
    const prices = await ctx.db.query("prices").collect();
    
    const assetDescriptions: Record<string, string> = {
      XAU: "Gold",
      BTC: "Bitcoin",
      OIL: "Crude Oil",
      DXY: "US Dollar Index",
      NQ: "Nasdaq 100 Futures",
      ES: "S&P 500 Futures",
    };

    for (const price of prices) {
      const change = price.change24h || 0;
      const assetName = assetDescriptions[price.symbol] || price.symbol;
      
      // Generate a meaningful brief based on price movement
      let brief = "";
      if (change > 1) {
        brief = `${assetName} showing strong bullish momentum with ${change.toFixed(2)}% gain. Technical indicators suggest continued upward trend with increasing volume. Support levels holding firm as buyers maintain control.`;
      } else if (change > 0) {
        brief = `${assetName} posting modest gains of ${change.toFixed(2)}%. Market sentiment remains cautiously optimistic with price action consolidating near current levels. Watch for breakout above resistance for confirmation.`;
      } else if (change > -1) {
        brief = `${assetName} experiencing minor pullback of ${change.toFixed(2)}%. Profit-taking evident as market digests recent gains. Key support zones remain intact with buyers stepping in on dips.`;
      } else {
        brief = `${assetName} under significant pressure with ${change.toFixed(2)}% decline. Bearish momentum accelerating as sellers dominate. Critical support levels being tested with risk of further downside if broken.`;
      }

      const existing = await ctx.db
        .query("asset_briefs")
        .withIndex("by_symbol", (q) => q.eq("symbol", price.symbol))
        .unique();
      
      if (existing) {
        await ctx.db.patch(existing._id, {
          brief,
          updatedAt: Date.now(),
        });
      } else {
        await ctx.db.insert("asset_briefs", {
          symbol: price.symbol,
          brief,
          updatedAt: Date.now(),
        });
      }
    }
    
    return { success: true, count: prices.length };
  },
});
