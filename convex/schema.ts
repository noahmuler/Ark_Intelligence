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

  // MT5 connection state
  mt5_connections: defineTable({
    userId: v.string(), // User identifier
    serverName: v.string(), // Broker server name
    accountLogin: v.string(), // Account number (masked)
    isConnected: v.boolean(), // Connection status
    lastSynced: v.number(), // Last sync timestamp
  }).index("by_userId", ["userId"]),

  // MT5 trade history
  mt5_trades: defineTable({
    userId: v.string(), // User identifier
    ticket: v.number(), // Trade ticket ID
    symbol: v.string(), // Trading symbol (e.g., "XAUUSD")
    type: v.string(), // "BUY" or "SELL" or "DEPOSIT" or "WITHDRAWAL"
    lots: v.number(), // Lot size
    openPrice: v.number(), // Open price
    closePrice: v.number(), // Close price
    openTime: v.number(), // Open timestamp
    closeTime: v.number(), // Close timestamp
    profit: v.number(), // Profit/loss
    commission: v.number(), // Commission
    swap: v.number(), // Swap
    isDeposit: v.optional(v.boolean()), // Whether this is a deposit/withdrawal
    stopLoss: v.optional(v.number()), // Stop loss price
    takeProfit: v.optional(v.number()), // Take profit price
    closeReason: v.optional(v.string()), // Close reason (e.g. "sl", "tp", "user")
  }).index("by_userId", ["userId"])
   .index("by_userId_ticket", ["userId", "ticket"]),

  // Market prices from Yahoo Finance (cached)
  marketPrices: defineTable({
    symbol: v.string(), // e.g., "AAPL", "BTC-USD"
    price: v.number(), // Current price
    changePercent: v.number(), // Percentage change
    type: v.union(v.literal("stock"), v.literal("crypto")), // Asset type
    timestamp: v.number(), // Cache timestamp
    high: v.optional(v.number()), // Day high
    low: v.optional(v.number()), // Day low
    volume: v.optional(v.number()), // Volume
    marketCap: v.optional(v.number()), // Market cap
  }).index("by_symbol", ["symbol"])
   .index("by_type", ["type"])
   .index("by_timestamp", ["timestamp"]),

  // Economic calendar events from Yahoo Finance
  economicCalendar: defineTable({
    event: v.string(), // Event name
    country: v.string(), // Country code
    date: v.string(), // Event date (ISO format)
    importance: v.union(v.literal("high"), v.literal("medium"), v.literal("low")), // Importance level
    actual: v.union(v.string(), v.null()), // Actual value
    forecast: v.union(v.string(), v.null()), // Forecast value
    previous: v.union(v.string(), v.null()), // Previous value
    timestamp: v.number(), // Cache timestamp
  }).index("by_date", ["date"])
   .index("by_importance", ["importance"])
   .index("by_timestamp", ["timestamp"]),
});
