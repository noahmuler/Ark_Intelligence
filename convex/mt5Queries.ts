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

// Get recent trades (last 20) - for UI table pagination only
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

// Get all trades for metrics calculation - full dataset
export const getAllTrades = query({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const trades = await ctx.db
      .query("mt5_trades")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .collect();

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
        currentBalance: 0,
        averageRR: 0,
        streaks: { wins: 0, losses: 0 },
      };
    }

    // Separate trades from deposits/withdrawals
    const actualTrades = trades.filter((t) => !t.isDeposit);
    const deposits = trades.filter((t) => t.isDeposit && t.profit > 0);
    const withdrawals = trades.filter((t) => t.isDeposit && t.profit < 0);

    // Calculate current balance (deposits - withdrawals + trading PnL)
    const totalDeposits = deposits.reduce((sum, t) => sum + t.profit, 0);
    const totalWithdrawals = Math.abs(withdrawals.reduce((sum, t) => sum + t.profit, 0));
    const tradingPnL = actualTrades.reduce((sum, t) => sum + t.profit, 0);
    const currentBalance = Math.max(0, totalDeposits - totalWithdrawals + tradingPnL);

    // Calculate basic metrics (only on actual trades)
    const winningTrades = actualTrades.filter((t) => t.profit > 0);
    const losingTrades = actualTrades.filter((t) => t.profit <= 0);

    const winRate = actualTrades.length > 0 ? (winningTrades.length / actualTrades.length) * 100 : 0;

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

    const totalPnL = tradingPnL;
    const expectancy = actualTrades.length > 0 ? totalPnL / actualTrades.length : 0;

    // Calculate average risk-reward ratio
    // Note: Cannot compute accurate R:R without pipValue/lotSize data to convert price units to account currency
    // Returning null to indicate this metric is unavailable with current data
    const averageRR = null;

    // Calculate streaks
    let currentStreak = 0;
    let maxWinStreak = 0;
    let maxLossStreak = 0;
    let tempWinStreak = 0;
    let tempLossStreak = 0;

    const sortedTrades = [...actualTrades].sort((a, b) => a.closeTime - b.closeTime);
    for (const trade of sortedTrades) {
      if (trade.profit > 0) {
        tempWinStreak++;
        tempLossStreak = 0;
        if (tempWinStreak > maxWinStreak) {
          maxWinStreak = tempWinStreak;
        }
      } else {
        tempLossStreak++;
        tempWinStreak = 0;
        if (tempLossStreak > maxLossStreak) {
          maxLossStreak = tempLossStreak;
        }
      }
    }

    // Calculate maximum drawdown
    let peak = 0;
    let maxDrawdown = 0;
    let cumulativePnL = 0;

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
      totalTrades: actualTrades.length,
      currentBalance: Math.round(currentBalance * 100) / 100,
      averageRR: averageRR === null ? null : Math.round(averageRR * 100) / 100,
      streaks: { wins: maxWinStreak, losses: maxLossStreak },
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

    // Filter out deposits/withdrawals for equity curve
    const actualTrades = trades.filter((t) => !t.isDeposit);

    // Sort trades by close time
    const sortedTrades = [...actualTrades].sort((a, b) => a.closeTime - b.closeTime);

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
