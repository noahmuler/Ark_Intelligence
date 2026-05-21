import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // Live price data for each asset
  prices: defineTable({
    symbol: v.string(), // e.g., "XAU", "BTC"
    price: v.number(),
    change24h: v.number(),
    high: v.number(),
    low: v.number(),
    history: v.array(v.number()), // sparkline data points
    updatedAt: v.number(),
  }).index("by_symbol", ["symbol"]),

  // Macro economic reports and generated bias mapping
  economic_reports: defineTable({
    title: v.string(),
    country: v.string(),
    actual: v.union(v.string(), v.null()),
    forecast: v.union(v.string(), v.null()),
    previous: v.union(v.string(), v.null()),
    impact: v.string(), // "high" | "medium" | "low"
    biases: v.object({
      XAU: v.string(),
      BTC: v.string(),
      OIL: v.string(),
      DXY: v.string(),
      NQ: v.string(),
      ES: v.string(),
    }),
    timestamp: v.number(),
  }).index("by_timestamp", ["timestamp"]),

  // Short analyst briefs for each asset
  asset_briefs: defineTable({
    symbol: v.string(),
    brief: v.string(), // strict three‑sentence summary
    updatedAt: v.number(),
  }).index("by_symbol", ["symbol"]),
});
