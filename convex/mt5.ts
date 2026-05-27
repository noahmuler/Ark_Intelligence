import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Connect to MT5 account
export const connectMT5 = mutation({
  args: {
    userId: v.string(),
    serverName: v.string(),
    accountLogin: v.string(),
    investorPassword: v.string(),
  },
  handler: async (ctx, args) => {
    // Check if connection already exists
    const existingConnection = await ctx.db
      .query("mt5_connections")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .unique();

    if (existingConnection) {
      // Update existing connection
      await ctx.db.patch(existingConnection._id, {
        serverName: args.serverName,
        accountLogin: args.accountLogin,
        isConnected: true,
        lastSynced: Date.now(),
      });
      return existingConnection._id;
    }

    // Create new connection
    const connectionId = await ctx.db.insert("mt5_connections", {
      userId: args.userId,
      serverName: args.serverName,
      accountLogin: args.accountLogin,
      isConnected: true,
      lastSynced: Date.now(),
    });

    return connectionId;
  },
});

// Disconnect MT5 account
export const disconnectMT5 = mutation({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const connection = await ctx.db
      .query("mt5_connections")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .unique();

    if (connection) {
      await ctx.db.patch(connection._id, {
        isConnected: false,
      });
    }

    return { success: true };
  },
});

// Query to get MT5 connection
export const getMT5Connection = query({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const connection = await ctx.db
      .query("mt5_connections")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .unique();

    return connection;
  },
});


// Store a single trade
export const storeTrade = mutation({
  args: {
    userId: v.string(),
    ticket: v.number(),
    symbol: v.string(),
    type: v.string(),
    lots: v.number(),
    openPrice: v.number(),
    closePrice: v.number(),
    openTime: v.number(),
    closeTime: v.number(),
    profit: v.number(),
    commission: v.number(),
    swap: v.number(),
    isDeposit: v.optional(v.boolean()),
    stopLoss: v.optional(v.number()),
    takeProfit: v.optional(v.number()),
    closeReason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Check if trade already exists using the compound index
    const existing = await ctx.db
      .query("mt5_trades")
      .withIndex("by_userId_ticket", (q) =>
        q.eq("userId", args.userId).eq("ticket", args.ticket)
      )
      .unique();

    if (existing) {
      // Update existing trade
      await ctx.db.patch(existing._id, {
        symbol: args.symbol,
        type: args.type,
        isDeposit: args.isDeposit,
        lots: args.lots,
        openPrice: args.openPrice,
        closePrice: args.closePrice,
        openTime: args.openTime,
        closeTime: args.closeTime,
        profit: args.profit,
        commission: args.commission,
        swap: args.swap,
        stopLoss: args.stopLoss,
        takeProfit: args.takeProfit,
        closeReason: args.closeReason,
      });
      return existing._id;
    }

    // Insert new trade
    const tradeId = await ctx.db.insert("mt5_trades", {
      userId: args.userId,
      ticket: args.ticket,
      symbol: args.symbol,
      type: args.type,
      lots: args.lots,
      openPrice: args.openPrice,
      closePrice: args.closePrice,
      openTime: args.openTime,
      closeTime: args.closeTime,
      profit: args.profit,
      commission: args.commission,
      swap: args.swap,
      isDeposit: args.isDeposit,
      stopLoss: args.stopLoss,
      takeProfit: args.takeProfit,
      closeReason: args.closeReason,
    });

    return tradeId;
  },
});
