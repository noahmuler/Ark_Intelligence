import { mutation } from "./_generated/server";
import { v } from "convex/values";

/**
 * Mutation to store or update a price record in the "prices" table.
 * 
 * Table distinction:
 * - prices = real-time/dashboard schema with history and change24h (used by this mutation)
 * - marketPrices = Yahoo cache with changePercent and no history (used by marketData.ts)
 * 
 * This mutation targets the "prices" table for dashboard/real-time use cases.
 */
export const storePrice = mutation({
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
      // Update existing record, preserving history if new history is empty
      const history = args.history.length > 0 ? args.history : existing.history;
      return await ctx.db.patch(existing._id, {
        ...args,
        history,
      });
    }

    return await ctx.db.insert("prices", args);
  },
});
