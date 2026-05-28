import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

/**
 * Internal mutation to cache market prices
 */
export const cacheMarketPrices = mutation({
  args: {
    prices: v.array(v.object({
      symbol: v.string(),
      price: v.number(),
      changePercent: v.number(),
      type: v.union(v.literal("stock"), v.literal("crypto")),
      high: v.optional(v.number()),
      low: v.optional(v.number()),
      volume: v.optional(v.number()),
      marketCap: v.optional(v.number()),
    })),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    
    for (const priceData of args.prices) {
      // Check if symbol already exists
      const existing = await ctx.db
        .query("marketPrices")
        .withIndex("by_symbol", (q) => q.eq("symbol", priceData.symbol))
        .first();
      
      if (existing) {
        // Update existing record
        await ctx.db.patch(existing._id, {
          ...priceData,
          timestamp: now,
        });
      } else {
        // Insert new record
        await ctx.db.insert("marketPrices", {
          ...priceData,
          timestamp: now,
        });
      }
    }
  },
});

/**
 * Internal mutation to cache economic calendar events
 */
export const cacheEconomicCalendar = mutation({
  args: {
    events: v.array(v.object({
      event: v.string(),
      country: v.string(),
      date: v.string(),
      importance: v.union(v.literal("high"), v.literal("medium"), v.literal("low")),
      actual: v.union(v.string(), v.null()),
      forecast: v.union(v.string(), v.null()),
      previous: v.union(v.string(), v.null()),
    })),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    
    for (const eventData of args.events) {
      // Check if event already exists (by event name and date)
      const existing = await ctx.db
        .query("economicCalendar")
        .withIndex("by_date", (q) => q.eq("date", eventData.date))
        .filter((q) => q.eq(q.field("event"), eventData.event))
        .first();
      
      if (!existing) {
        // Insert new event
        await ctx.db.insert("economicCalendar", {
          ...eventData,
          timestamp: now,
        });
      }
    }
  },
});

/**
 * Public query to get cached market prices for symbols
 */
export const getMarketPrices = query({
  args: {
    symbols: v.optional(v.array(v.string())),
    type: v.optional(v.union(v.literal("stock"), v.literal("crypto"))),
  },
  handler: async (ctx, args) => {
    let query;
    
    if (args.type) {
      query = ctx.db.query("marketPrices").withIndex("by_type", (q) => q.eq("type", args.type as "stock" | "crypto"));
    } else {
      query = ctx.db.query("marketPrices");
    }
    
    const results = await query.collect();
    
    // Filter by symbols if provided
    if (args.symbols && args.symbols.length > 0) {
      return results.filter((price) => args.symbols!.includes(price.symbol));
    }
    
    return results;
  },
});

/**
 * Public query to get cached economic calendar events
 */
export const getEconomicCalendar = query({
  args: {
    startDate: v.optional(v.string()),
    endDate: v.optional(v.string()),
    importance: v.optional(v.union(v.literal("high"), v.literal("medium"), v.literal("low"))),
  },
  handler: async (ctx, args) => {
    let query;
    
    if (args.importance) {
      query = ctx.db.query("economicCalendar").withIndex("by_importance", (q) => q.eq("importance", args.importance as "high" | "medium" | "low"));
    } else {
      query = ctx.db.query("economicCalendar").withIndex("by_date");
    }
    
    const results = await query.collect();
    
    // Filter by date range if provided
    if (args.startDate || args.endDate) {
      return results.filter((event) => {
        if (args.startDate && event.date < args.startDate) return false;
        if (args.endDate && event.date > args.endDate) return false;
        return true;
      });
    }
    
    return results;
  },
});

/**
 * Public query to get a single market price by symbol
 */
export const getMarketPrice = query({
  args: {
    symbol: v.string(),
  },
  handler: async (ctx, args) => {
    const result = await ctx.db
      .query("marketPrices")
      .withIndex("by_symbol", (q) => q.eq("symbol", args.symbol))
      .first();
    
    return result;
  },
});
