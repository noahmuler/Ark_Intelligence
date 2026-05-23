// Convex actions for Ark Intelligence

import { query, mutation } from "./_generated/server";
import { v } from "convex/values";


// Query all price entries sorted by symbol
export const getAll = query(({ db }) => {
  // Convex ordering only supports "asc"/"desc" on indexes.
  return db.query("prices").withIndex("by_symbol", (q) => q).order("asc");
});

// Query all asset briefs sorted by symbol
export const getAllAssetBriefs = query(({ db }) => {
  return db.query("asset_briefs").withIndex("by_symbol", (q) => q).order("asc");
});

// Public API expected by the frontend: api.asset_briefs.getAll
export const __compat_getAll_asset_briefs = getAllAssetBriefs;

// Query all price entries (alias for getAll)
export const getAllPrices = query(({ db }) => {
  return db.query("prices").withIndex("by_symbol", (q) => q).order("asc");
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
