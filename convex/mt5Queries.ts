import { query } from "./_generated/server";
import { v } from "convex/values";

// Get all trades for a user
export const getUserTrades = query({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const trades = await ctx.db
      .query("mt5_trades")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .order("desc")
      .take(100);

    return trades;
  },
});

// Get recent trades (last 20)
export const getRecentTrades = query({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const trades = await ctx.db
      .query("mt5_trades")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .order("desc")
      .take(20);

    return trades;
  },
});

// Calculate trading metrics
export const getTradingMetrics = query({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const trades = await ctx.db
      .query("mt5_trades")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .collect();

    if (trades.length === 0) {
      return {
        winRate: 0,
        profitFactor: 0,
        maxDrawdown: 0,
        expectancy: 0,
        totalPnL: 0,
        totalTrades: 0,
      };
    }

    // Calculate basic metrics
    const winningTrades = trades.filter((t) => t.profit > 0);
    const losingTrades = trades.filter((t) => t.profit <= 0);

    const winRate = (winningTrades.length / trades.length) * 100;

    const grossProfit = winningTrades.reduce((sum, t) => sum + t.profit, 0);
    const grossLoss = Math.abs(losingTrades.reduce((sum, t) => sum + t.profit, 0));
    let profitFactor: number | null;
    if (grossLoss === 0 && grossProfit > 0) {
      profitFactor = Infinity;
    } else if (grossLoss === 0 && grossProfit === 0) {
      profitFactor = null;
    } else {
      profitFactor = grossProfit / grossLoss;
    }

    const totalPnL = trades.reduce((sum, t) => sum + t.profit, 0);
    const expectancy = totalPnL / trades.length;

    // Calculate maximum drawdown
    let peak = 0;
    let maxDrawdown = 0;
    let cumulativePnL = 0;

    const sortedTrades = [...trades].sort((a, b) => a.closeTime - b.closeTime);
    for (const trade of sortedTrades) {
      cumulativePnL += trade.profit;
      if (cumulativePnL > peak) {
        peak = cumulativePnL;
      }
      const drawdown = peak - cumulativePnL;
      if (drawdown > maxDrawdown) {
        maxDrawdown = drawdown;
      }
    }

    const maxDrawdownPercent = peak === 0 ? 0 : (maxDrawdown / peak) * 100;

    return {
      winRate: Math.round(winRate * 100) / 100,
      profitFactor: profitFactor === null ? null : Math.round(profitFactor * 100) / 100,
      maxDrawdown: Math.round(maxDrawdownPercent * 100) / 100,
      expectancy: Math.round(expectancy * 100) / 100,
      totalPnL: Math.round(totalPnL * 100) / 100,
      totalTrades: trades.length,
    };
  },
});

// Get equity curve data
export const getEquityCurve = query({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const trades = await ctx.db
      .query("mt5_trades")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .collect();

    if (trades.length === 0) {
      return [];
    }

    // Sort trades by close time
    const sortedTrades = [...trades].sort((a, b) => a.closeTime - b.closeTime);

    // Build equity curve
    const equityCurve: { timestamp: number; equity: number }[] = [];
    let cumulativePnL = 0;

    for (const trade of sortedTrades) {
      cumulativePnL += trade.profit;
      equityCurve.push({
        timestamp: trade.closeTime,
        equity: cumulativePnL,
      });
    }

    return equityCurve;
  },
});
