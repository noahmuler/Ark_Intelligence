"use node";

import { action } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";

// Fetch trade history from MT5 API
export const fetchTradeHistory = action({
  args: {
    userId: v.string(),
    serverName: v.string(),
    accountLogin: v.string(),
    investorPassword: v.string(),
  },
  handler: async (ctx, args) => {
    // TODO: Implement actual MT5 API integration
    // This is a placeholder that simulates fetching trade data
    // In production, you would use MetaApi or another MT5 connector
    
    // Simulated trade data for demonstration with unique ticket IDs
    const baseTimestamp = Date.now();
    const mockTrades = [
      {
        ticket: baseTimestamp,
        symbol: "XAUUSD",
        type: "BUY",
        lots: 0.1,
        openPrice: 2345.50,
        closePrice: 2350.75,
        openTime: Date.now() - 86400000,
        closeTime: Date.now() - 72000000,
        profit: 52.5,
        commission: 0.5,
        swap: -0.1,
      },
      {
        ticket: baseTimestamp + 1,
        symbol: "XAUUSD",
        type: "SELL",
        lots: 0.1,
        openPrice: 2352.00,
        closePrice: 2348.25,
        openTime: Date.now() - 172800000,
        closeTime: Date.now() - 86400000,
        profit: 37.5,
        commission: 0.5,
        swap: -0.1,
      },
    ];

    // Store trades in database via mutation
    for (const trade of mockTrades) {
      await ctx.runMutation(api.mt5.storeTrade, {
        userId: args.userId,
        ...trade,
      });
    }

    return { success: true, tradesCount: mockTrades.length, trades: mockTrades };
  },
});
