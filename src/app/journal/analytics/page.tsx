"use client";

import React, { useEffect, useState, useMemo } from "react";
import { MainLayout } from "@/components/dashboard/MainLayout";
import { useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { TrendingUp, TrendingDown, DollarSign, Target, ArrowLeft, BrainCircuit, ShieldAlert, ShieldCheck } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from "recharts";
import { ChartTooltip, ChartTooltipContent } from "@/components/charts/chart";

// ─── Animated Counter ────────────────────────────────────────────────────────
function AnimatedCounter({
  value,
  prefix = "",
  suffix = "",
  duration = 1500,
  decimals = 2,
}: {
  value: number;
  prefix?: string;
  suffix?: string;
  duration?: number;
  decimals?: number;
}) {
  const [count, setCount] = useState(0);
  const [hasAnimated, setHasAnimated] = useState(false);

  useEffect(() => {
    if (hasAnimated) return;
    let start = 0;
    const end = value;
    const steps = 50;
    const incrementTime = duration / steps;
    const increment = end / steps;
    let currentStep = 0;

    const timer = setInterval(() => {
      currentStep++;
      start += increment;
      if (currentStep >= steps) {
        setCount(end);
        setHasAnimated(true);
        clearInterval(timer);
      } else {
        setCount(start);
      }
    }, incrementTime);

    return () => clearInterval(timer);
  }, [value, duration, hasAnimated]);

  const formattedCount =
    typeof count === "number"
      ? Number.isInteger(count) && decimals === 2
        ? count.toString()
        : count.toFixed(decimals)
      : count;

  return (
    <span>
      {prefix}
      {formattedCount}
      {suffix}
    </span>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function DeepAnalytics() {
  const router = useRouter();
  const [isConnected, setIsConnected] = useState(false);

  // ── Convex queries ──────────────────────────────────────────────────────────
  const connection = useQuery(api.mt5.getMT5Connection, { userId: "user-1" });
  const metrics = useQuery(api.mt5Queries.getTradingMetrics, { userId: "user-1" });
  const allTrades = useQuery(api.mt5Queries.getAllTrades, { userId: "user-1" });

  // ── Connection check ────────────────────────────────────────────────────────
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    const saved = localStorage.getItem("mt5Connected");
    setIsConnected(saved === "true" && !!connection);
  }, [connection]);
  /* eslint-enable react-hooks/set-state-in-effect */

  // ── Derived trade sets (ALL hooks ABOVE any early return) ───────────────────
  const actualTrades = useMemo(
    () => allTrades?.filter((t) => t.type === "BUY" || t.type === "SELL") ?? [],
    [allTrades]
  );

  const winningTrades = useMemo(() => actualTrades.filter((t) => t.profit > 0), [actualTrades]);
  const losingTrades  = useMemo(() => actualTrades.filter((t) => t.profit < 0), [actualTrades]);

  const avgWinningTrade = useMemo(
    () => (winningTrades.length > 0 ? winningTrades.reduce((s, t) => s + t.profit, 0) / winningTrades.length : 0),
    [winningTrades]
  );
  const avgLosingTrade = useMemo(
    () => (losingTrades.length > 0 ? losingTrades.reduce((s, t) => s + t.profit, 0) / losingTrades.length : 0),
    [losingTrades]
  );
  const bestTrade  = useMemo(() => (winningTrades.length > 0 ? Math.max(...winningTrades.map((t) => t.profit)) : 0), [winningTrades]);
  const worstTrade = useMemo(() => (losingTrades.length  > 0 ? Math.min(...losingTrades.map((t) => t.profit))  : 0), [losingTrades]);

  // SL/TP hit percentages
  const { slHitPercent, tpHitPercent } = useMemo(() => {
    if (actualTrades.length === 0) return { slHitPercent: 0, tpHitPercent: 0 };
    const slCount = actualTrades.filter((t) => t.closeReason?.toLowerCase() === "sl").length;
    const tpCount = actualTrades.filter((t) => t.closeReason?.toLowerCase() === "tp").length;
    return {
      slHitPercent: (slCount / actualTrades.length) * 100,
      tpHitPercent: (tpCount / actualTrades.length) * 100,
    };
  }, [actualTrades]);

  // Average R:R computed from SL/TP price levels
  const averageRR = useMemo(() => {
    const tradesWithRR = actualTrades.filter(
      (t) => t.stopLoss && t.takeProfit && t.stopLoss > 0 && t.takeProfit > 0 && t.openPrice > 0
    );
    if (tradesWithRR.length === 0) return null;
    let total = 0;
    let count = 0;
    for (const t of tradesWithRR) {
      const risk   = Math.abs(t.openPrice - t.stopLoss!);
      const reward = Math.abs(t.openPrice - t.takeProfit!);
      if (risk > 0) { total += reward / risk; count++; }
    }
    return count > 0 ? total / count : null;
  }, [actualTrades]);

  // Long / Short sub-sets
  const longTrades  = useMemo(() => actualTrades.filter((t) => t.type === "BUY"),  [actualTrades]);
  const shortTrades = useMemo(() => actualTrades.filter((t) => t.type === "SELL"), [actualTrades]);
  const longPnL  = useMemo(() => longTrades.reduce((s, t)  => s + t.profit, 0), [longTrades]);
  const shortPnL = useMemo(() => shortTrades.reduce((s, t) => s + t.profit, 0), [shortTrades]);

  // Monthly PnL chart data
  const monthlyPnLData = useMemo(() => {
    if (!actualTrades || actualTrades.length === 0) return [];
    const monthMap = new Map<number, { month: string; profit: number; loss: number }>();
    actualTrades.forEach((trade) => {
      const date      = new Date(trade.closeTime);
      const monthKey  = date.toLocaleDateString("en-US", { month: "short", year: "numeric" });
      const timestamp = new Date(date.getFullYear(), date.getMonth(), 1).getTime();
      if (!monthMap.has(timestamp)) monthMap.set(timestamp, { month: monthKey, profit: 0, loss: 0 });
      const d = monthMap.get(timestamp)!;
      if (trade.profit > 0) d.profit += trade.profit;
      else                   d.loss   += Math.abs(trade.profit);
    });
    return Array.from(monthMap.entries())
      .sort(([a], [b]) => a - b)
      .slice(-12)
      .map(([, d]) => d);
  }, [actualTrades]);

  // Monthly order-count chart data
  const totalOrderData = useMemo(() => {
    if (!actualTrades || actualTrades.length === 0) return [];
    const monthMap = new Map<number, { month: string; profitable: number; unprofitable: number }>();
    actualTrades.forEach((trade) => {
      const date      = new Date(trade.closeTime);
      const monthKey  = date.toLocaleDateString("en-US", { month: "short", year: "numeric" });
      const timestamp = new Date(date.getFullYear(), date.getMonth(), 1).getTime();
      if (!monthMap.has(timestamp)) monthMap.set(timestamp, { month: monthKey, profitable: 0, unprofitable: 0 });
      const d = monthMap.get(timestamp)!;
      if (trade.profit > 0) d.profitable++;
      else                   d.unprofitable++;
    });
    return Array.from(monthMap.entries())
      .sort(([a], [b]) => a - b)
      .slice(-12)
      .map(([, d]) => d);
  }, [actualTrades]);

  // PnL by Symbol chart data
  const pnlBySymbolData = useMemo(() => {
    if (!actualTrades || actualTrades.length === 0) return [];
    const symbolMap = new Map<string, { symbol: string; profit: number; loss: number; totalPnL: number; trades: number }>();
    actualTrades.forEach((trade) => {
      const symbol = trade.symbol || "Unknown";
      if (!symbolMap.has(symbol)) symbolMap.set(symbol, { symbol, profit: 0, loss: 0, totalPnL: 0, trades: 0 });
      const d = symbolMap.get(symbol)!;
      if (trade.profit > 0) d.profit += trade.profit;
      else d.loss += Math.abs(trade.profit);
      d.totalPnL += trade.profit;
      d.trades++;
    });
    return Array.from(symbolMap.values())
      .sort((a, b) => Math.abs(b.totalPnL) - Math.abs(a.totalPnL))
      .slice(0, 10);
  }, [actualTrades]);

  // PnL by Weekday chart data
  const pnlByWeekdayData = useMemo(() => {
    if (!actualTrades || actualTrades.length === 0) return [];
    const weekdayMap = new Map<number, { weekday: string; profit: number; loss: number; totalPnL: number; trades: number }>();
    const weekdays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    actualTrades.forEach((trade) => {
      const date = new Date(trade.closeTime);
      const weekday = weekdays[date.getDay()];
      const dayIndex = date.getDay();
      if (!weekdayMap.has(dayIndex)) weekdayMap.set(dayIndex, { weekday, profit: 0, loss: 0, totalPnL: 0, trades: 0 });
      const d = weekdayMap.get(dayIndex)!;
      if (trade.profit > 0) d.profit += trade.profit;
      else d.loss += Math.abs(trade.profit);
      d.totalPnL += trade.profit;
      d.trades++;
    });
    return Array.from(weekdayMap.entries())
      .sort(([a], [b]) => a - b)
      .map(([, d]) => d);
  }, [actualTrades]);

  // Institutional metrics calculations
  const institutionalMetrics = useMemo(() => {
    if (!actualTrades || actualTrades.length === 0) {
      return {
        sharpeRatio: 0,
        sortinoRatio: 0,
        calmarRatio: 0,
        maxConsecutiveWins: 0,
        maxConsecutiveLosses: 0,
        averageWinLossRatio: 0,
        profitFactor: 0,
        recoveryFactor: 0,
        riskOfRuin: 0,
        kellyCriterion: 0,
        averageHoldingPeriod: 0,
        monthlyVolatility: 0,
        annualizedReturn: 0,
      };
    }

    const sortedTrades = [...actualTrades].sort((a, b) => a.closeTime - b.closeTime);
    const profits = sortedTrades.map(t => t.profit);
    
    // Calculate returns for volatility
    const meanReturn = profits.reduce((a, b) => a + b, 0) / profits.length;
    const variance = profits.reduce((sum, profit) => sum + Math.pow(profit - meanReturn, 2), 0) / profits.length;
    const stdDev = Math.sqrt(variance);
    
    // Sharpe Ratio (assuming 3% annual risk-free rate, approximated daily)
    const dailyRiskFreeRate = 0.03 / 252;
    const excessReturn = meanReturn - dailyRiskFreeRate;
    const sharpeRatio = stdDev !== 0 ? (excessReturn / stdDev) * Math.sqrt(252) : 0;
    
    // Sortino Ratio (downside deviation only)
    const downsideReturns = profits.filter(p => p < 0);
    const downsideVariance = downsideReturns.length > 0 
      ? downsideReturns.reduce((sum, profit) => sum + Math.pow(profit, 2), 0) / downsideReturns.length 
      : 0;
    const downsideDeviation = Math.sqrt(downsideVariance);
    const sortinoRatio = downsideDeviation !== 0 ? (meanReturn / downsideDeviation) * Math.sqrt(252) : 0;
    
    // Calmar Ratio (annual return / max drawdown)
    const totalReturn = profits.reduce((a, b) => a + b, 0);
    const firstTrade = sortedTrades[0];
    const lastTrade = sortedTrades[sortedTrades.length - 1];
    const daysHeld = (lastTrade.closeTime - firstTrade.closeTime) / (1000 * 60 * 60 * 24);
    const annualizedReturnVal = daysHeld > 0 ? (totalReturn / daysHeld) * 365 : 0;
    const maxDrawdown = metrics?.maxDrawdown ?? 0;
    const calmarRatio = maxDrawdown !== 0 ? annualizedReturnVal / (maxDrawdown / 100) : 0;
    
    // Consecutive wins/losses
    let maxWinStreak = 0;
    let maxLossStreak = 0;
    let currentWinStreak = 0;
    let currentLossStreak = 0;
    
    for (const trade of sortedTrades) {
      if (trade.profit > 0) {
        currentWinStreak++;
        currentLossStreak = 0;
        maxWinStreak = Math.max(maxWinStreak, currentWinStreak);
      } else if (trade.profit < 0) {
        currentLossStreak++;
        currentWinStreak = 0;
        maxLossStreak = Math.max(maxLossStreak, currentLossStreak);
      }
    }
    
    // Average Win/Loss Ratio
    const winningTrades = profits.filter(p => p > 0);
    const losingTrades = profits.filter(p => p < 0);
    const avgWin = winningTrades.length > 0 ? winningTrades.reduce((a, b) => a + b, 0) / winningTrades.length : 0;
    const avgLoss = losingTrades.length > 0 ? Math.abs(losingTrades.reduce((a, b) => a + b, 0)) / losingTrades.length : 0;
    const avgWinLossRatio = avgLoss !== 0 ? avgWin / avgLoss : 0;
    
    // Profit Factor
    const grossProfit = winningTrades.reduce((a, b) => a + b, 0);
    const grossLoss = Math.abs(losingTrades.reduce((a, b) => a + b, 0));
    const profitFactor = grossLoss !== 0 ? grossProfit / grossLoss : grossProfit > 0 ? Infinity : 0;
    
    // Recovery Factor (total return / max drawdown)
    const recoveryFactor = maxDrawdown !== 0 ? totalReturn / (maxDrawdown / 100) : 0;
    
    // Risk of Ruin (simplified version)
    const winRate = winningTrades.length / profits.length;
    const avgLossPercent = avgLoss !== 0 ? avgLoss / 100 : 0.01;
    const riskOfRuin = avgLossPercent !== 0 && winRate > 0 
      ? Math.pow((1 - winRate) / winRate, (100 / avgLossPercent)) 
      : 0;
    
    // Kelly Criterion (simplified)
    const kellyCriterion = avgLoss !== 0 ? (winRate * avgWinLossRatio - (1 - winRate)) / avgWinLossRatio : 0;
    
    // Average Holding Period
    const holdingPeriods = sortedTrades.map(t => (t.closeTime - t.openTime) / (1000 * 60 * 60 * 24));
    const averageHoldingPeriod = holdingPeriods.length > 0 ? holdingPeriods.reduce((a, b) => a + b, 0) / holdingPeriods.length : 0;
    
    // Monthly Volatility
    const monthlyVolatility = stdDev * Math.sqrt(21);
    
    return {
      sharpeRatio: isNaN(sharpeRatio) ? 0 : sharpeRatio,
      sortinoRatio: isNaN(sortinoRatio) ? 0 : sortinoRatio,
      calmarRatio: isNaN(calmarRatio) ? 0 : calmarRatio,
      maxConsecutiveWins: maxWinStreak,
      maxConsecutiveLosses: maxLossStreak,
      averageWinLossRatio: isNaN(avgWinLossRatio) ? 0 : avgWinLossRatio,
      profitFactor: isNaN(profitFactor) || !isFinite(profitFactor) ? 0 : profitFactor,
      recoveryFactor: isNaN(recoveryFactor) ? 0 : recoveryFactor,
      riskOfRuin: isNaN(riskOfRuin) ? 0 : riskOfRuin,
      kellyCriterion: isNaN(kellyCriterion) ? 0 : kellyCriterion,
      averageHoldingPeriod: isNaN(averageHoldingPeriod) ? 0 : averageHoldingPeriod,
      monthlyVolatility: isNaN(monthlyVolatility) ? 0 : monthlyVolatility,
      annualizedReturn: isNaN(annualizedReturnVal) ? 0 : annualizedReturnVal,
    };
  }, [actualTrades, metrics]);

  // Session performance helper
  const getSessionPerformance = useMemo(() => {
    return (sessionStart: number, sessionEnd: number) => {
      const sessionTrades = actualTrades.filter((t) => {
        const nyHour = (() => {
          const s = new Date(t.closeTime).toLocaleString("en-US", {
            timeZone: "America/New_York",
            hour: "numeric",
            hour12: false,
          });
          return parseInt(s, 10);
        })();
        return sessionStart < sessionEnd
          ? nyHour >= sessionStart && nyHour < sessionEnd
          : nyHour >= sessionStart || nyHour < sessionEnd;
      });
      const wins     = sessionTrades.filter((t) => t.profit > 0).length;
      const totalPnL = sessionTrades.reduce((s, t) => s + t.profit, 0);
      const winRate  = sessionTrades.length > 0 ? (wins / sessionTrades.length) * 100 : 0;
      return { trades: sessionTrades.length, wins, winRate, totalPnL };
    };
  }, [actualTrades]);

  const sessions = [
    { name: "Asian",        start: 20, end: 4  },
    { name: "London",       start: 3,  end: 12 },
    { name: "New York",     start: 8,  end: 17 },
    { name: "Asian–London", start: 2,  end: 4  },
    { name: "London–NY",    start: 8,  end: 12 },
  ];

  // ── Not connected state ─────────────────────────────────────────────────────
  if (!isConnected) {
    return (
      <MainLayout>
        <div className="p-3 sm:p-4 lg:p-6 h-full">
          <div className="max-w-7xl mx-auto">
            <button
              onClick={() => router.push("/journal")}
              className="mb-6 inline-flex items-center text-purple-300 hover:text-white transition-colors"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              Back to Journal
            </button>
            <div className="flex flex-col items-center justify-center min-h-[400px]">
              <h2 className="text-2xl font-semibold text-white text-center">No Broker Account Connected</h2>
              <p className="mt-3 text-purple-300 text-center max-w-md">
                Connect your MT5 Investor account to access deep analytics.
              </p>
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }

  // ── Connected state ─────────────────────────────────────────────────────────
  const rrDisplay = averageRR !== null ? averageRR : (metrics?.averageRR ?? null);

  return (
    <MainLayout>
      <div className="p-3 sm:p-4 lg:p-6 h-full">
        <div className="max-w-7xl mx-auto">

          {/* ── Header ── */}
          <div className="mb-8">
            <button
              onClick={() => router.push("/journal")}
              className="mb-6 inline-flex items-center text-purple-300 hover:text-white transition-colors"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              Back to Journal
            </button>
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">Deep Analytics</h1>
                <p className="text-purple-300 text-sm sm:text-base">
                  Comprehensive trading performance metrics and session analysis
                </p>
              </div>
              {connection && (
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-purple-400 text-xs">
                    {connection.serverName} — {connection.accountLogin}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* ── AI Summary ── */}
          <div className="mb-8">
            <div className="group relative">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl blur opacity-25 group-hover:opacity-40 transition duration-300" />
              <div className="relative bg-purple-900/90 backdrop-blur-xl rounded-2xl border border-purple-800/50 p-6 shadow-2xl">
                <div className="flex items-start gap-4">
                  <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-r from-purple-500 to-blue-500 flex-shrink-0">
                    <BrainCircuit className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-2">AI Analytics Summary</h3>
                    <p className="text-purple-300 text-sm leading-relaxed">
                      Based on your trading data, you have executed{" "}
                      <span className="text-white font-semibold">{metrics?.totalTrades ?? 0}</span> trades with a win
                      rate of{" "}
                      <span className="text-white font-semibold">{(metrics?.winRate ?? 0).toFixed(1)}%</span>. Your
                      average winning trade is{" "}
                      <span className="text-green-400 font-semibold">${avgWinningTrade.toFixed(2)}</span> while your
                      average losing trade is{" "}
                      <span className="text-red-400 font-semibold">${avgLosingTrade.toFixed(2)}</span>.{" "}
                      {(metrics?.expectancy ?? 0) >= 0
                        ? "Your positive expectancy indicates a profitable trading strategy."
                        : "Your negative expectancy suggests reviewing your risk management approach."}{" "}
                      The London session shows the highest activity with{" "}
                      <span className="text-white font-semibold">{getSessionPerformance(3, 12).trades}</span> trades.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── 10-Card KPI Grid ── */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
            {/* Total Trades */}
            <KPICard gradient="from-purple-600 to-blue-600" iconGrad="from-purple-500 to-blue-500" icon={<Target className="h-5 w-5 text-white" />}>
              <p className="text-3xl font-bold text-white mb-2">
                <AnimatedCounter value={metrics?.totalTrades ?? 0} decimals={0} />
              </p>
              <p className="text-purple-300 text-sm font-medium">Total Trades</p>
            </KPICard>

            {/* Win Rate */}
            <KPICard gradient="from-green-600 to-emerald-600" iconGrad="from-green-500 to-emerald-500" icon={<Target className="h-5 w-5 text-white" />}>
              <p className={`text-3xl font-bold ${(metrics?.winRate ?? 0) >= 50 ? "text-green-400" : "text-red-400"} mb-2`}>
                <AnimatedCounter value={metrics?.winRate ?? 0} suffix="%" />
              </p>
              <p className="text-purple-300 text-sm font-medium">Win Rate</p>
            </KPICard>

            {/* Expectancy */}
            <KPICard gradient="from-purple-600 to-blue-600" iconGrad="from-purple-500 to-blue-500" icon={<TrendingUp className="h-5 w-5 text-white" />}>
              <p className={`text-3xl font-bold ${(metrics?.expectancy ?? 0) >= 0 ? "text-green-400" : "text-red-400"} mb-2`}>
                <AnimatedCounter value={metrics?.expectancy ?? 0} prefix="$" />
              </p>
              <p className="text-purple-300 text-sm font-medium">Expectancy</p>
            </KPICard>

            {/* Average R:R */}
            <KPICard gradient="from-purple-600 to-blue-600" iconGrad="from-purple-500 to-blue-500" icon={<Target className="h-5 w-5 text-white" />}>
              <p className="text-3xl font-bold text-white mb-2">
                {rrDisplay != null ? <AnimatedCounter value={rrDisplay} /> : "N/A"}
              </p>
              <p className="text-purple-300 text-sm font-medium">Avg R:R</p>
            </KPICard>

            {/* Total PnL */}
            <KPICard gradient="from-purple-600 to-blue-600" iconGrad="from-purple-500 to-blue-500" icon={<DollarSign className="h-5 w-5 text-white" />}>
              <p className={`text-3xl font-bold ${(metrics?.totalPnL ?? 0) >= 0 ? "text-green-400" : "text-red-400"} mb-2`}>
                <AnimatedCounter value={metrics?.totalPnL ?? 0} prefix="$" />
              </p>
              <p className="text-purple-300 text-sm font-medium">Total PnL</p>
            </KPICard>

            {/* Avg Winning Trade */}
            <KPICard gradient="from-green-600 to-emerald-600" iconGrad="from-green-500 to-emerald-500" icon={<TrendingUp className="h-5 w-5 text-white" />}>
              <p className="text-3xl font-bold text-green-400 mb-2">
                <AnimatedCounter value={avgWinningTrade} prefix="$" />
              </p>
              <p className="text-purple-300 text-sm font-medium">Avg Winning Trade</p>
            </KPICard>

            {/* Avg Losing Trade */}
            <KPICard gradient="from-red-600 to-orange-600" iconGrad="from-red-500 to-orange-500" icon={<TrendingDown className="h-5 w-5 text-white" />}>
              <p className="text-3xl font-bold text-red-400 mb-2">
                <AnimatedCounter value={avgLosingTrade} prefix="$" />
              </p>
              <p className="text-purple-300 text-sm font-medium">Avg Losing Trade</p>
            </KPICard>

            {/* Best Trade */}
            <KPICard gradient="from-green-600 to-emerald-600" iconGrad="from-green-500 to-emerald-500" icon={<TrendingUp className="h-5 w-5 text-white" />}>
              <p className="text-3xl font-bold text-green-400 mb-2">
                <AnimatedCounter value={bestTrade} prefix="$" />
              </p>
              <p className="text-purple-300 text-sm font-medium">Best Trade</p>
            </KPICard>

            {/* Worst Trade */}
            <KPICard gradient="from-red-600 to-orange-600" iconGrad="from-red-500 to-orange-500" icon={<TrendingDown className="h-5 w-5 text-white" />}>
              <p className="text-3xl font-bold text-red-400 mb-2">
                <AnimatedCounter value={worstTrade} prefix="$" />
              </p>
              <p className="text-purple-300 text-sm font-medium">Worst Trade</p>
            </KPICard>

            {/* Max Drawdown */}
            <KPICard gradient="from-red-600 to-orange-600" iconGrad="from-red-500 to-orange-500" icon={<TrendingDown className="h-5 w-5 text-white" />}>
              <p className="text-3xl font-bold text-red-400 mb-2">
                <AnimatedCounter value={metrics?.maxDrawdown ?? 0} suffix="%" />
              </p>
              <p className="text-purple-300 text-sm font-medium">Max Drawdown</p>
            </KPICard>
          </div>

          {/* ── Charts: Monthly PnL & Total Orders ── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Monthly PnL */}
            <div className="group relative">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl blur opacity-25 group-hover:opacity-40 transition duration-300" />
              <div className="relative bg-purple-900/90 backdrop-blur-xl rounded-2xl border border-purple-800/50 p-5 shadow-2xl">
                <h3 className="text-base font-semibold text-white mb-4">Monthly PnL</h3>
                <div className="h-52">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={monthlyPnLData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#7c3aed" opacity={0.2} vertical={false} />
                      <XAxis dataKey="month" stroke="#a78bfa" fontSize={10} tickLine={false} axisLine={false} interval={0} />
                      <YAxis stroke="#a78bfa" fontSize={10} tickLine={false} axisLine={false} width={35} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="profit" stackId="pnl" fill="#10b981" name="Profit" radius={[2, 2, 0, 0]} />
                      <Bar dataKey="loss"   stackId="pnl" fill="#ef4444" name="Loss"   radius={[0, 0, 2, 2]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Total Orders */}
            <div className="group relative">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl blur opacity-25 group-hover:opacity-40 transition duration-300" />
              <div className="relative bg-purple-900/90 backdrop-blur-xl rounded-2xl border border-purple-800/50 p-5 shadow-2xl">
                <h3 className="text-base font-semibold text-white mb-4">Total Orders</h3>
                <div className="h-52">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={totalOrderData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#7c3aed" opacity={0.2} vertical={false} />
                      <XAxis dataKey="month" stroke="#a78bfa" fontSize={10} tickLine={false} axisLine={false} interval={0} />
                      <YAxis stroke="#a78bfa" fontSize={10} tickLine={false} axisLine={false} width={35} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="profitable"   fill="#10b981" name="Profitable"   radius={[2, 2, 2, 2]} />
                      <Bar dataKey="unprofitable" fill="#ef4444" name="Unprofitable" radius={[2, 2, 2, 2]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>

          {/* ── New Charts: PnL by Symbol & PnL by Weekday ── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* PnL by Symbol */}
            <div className="group relative">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl blur opacity-25 group-hover:opacity-40 transition duration-300" />
              <div className="relative bg-purple-900/90 backdrop-blur-xl rounded-2xl border border-purple-800/50 p-5 shadow-2xl">
                <h3 className="text-base font-semibold text-white mb-4">PnL by Symbol</h3>
                <div className="h-52">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={pnlBySymbolData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="#7c3aed" opacity={0.2} horizontal={false} />
                      <XAxis type="number" stroke="#a78bfa" fontSize={10} tickLine={false} axisLine={false} />
                      <YAxis dataKey="symbol" type="category" stroke="#a78bfa" fontSize={10} tickLine={false} axisLine={false} width={60} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="profit" fill="#10b981" name="Profit" radius={[0, 2, 2, 0]} />
                      <Bar dataKey="loss" fill="#ef4444" name="Loss" radius={[0, 2, 2, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* PnL by Weekday */}
            <div className="group relative">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl blur opacity-25 group-hover:opacity-40 transition duration-300" />
              <div className="relative bg-purple-900/90 backdrop-blur-xl rounded-2xl border border-purple-800/50 p-5 shadow-2xl">
                <h3 className="text-base font-semibold text-white mb-4">PnL by Weekday</h3>
                <div className="h-52">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={pnlByWeekdayData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#7c3aed" opacity={0.2} vertical={false} />
                      <XAxis dataKey="weekday" stroke="#a78bfa" fontSize={10} tickLine={false} axisLine={false} interval={0} />
                      <YAxis stroke="#a78bfa" fontSize={10} tickLine={false} axisLine={false} width={35} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="profit" stackId="weekday" fill="#10b981" name="Profit" radius={[2, 2, 0, 0]} />
                      <Bar dataKey="loss" stackId="weekday" fill="#ef4444" name="Loss" radius={[0, 0, 2, 2]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>

          {/* ── SL/TP Analytics ── */}
          <div className="mb-8">
            <div className="group relative">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl blur opacity-25 group-hover:opacity-40 transition duration-300" />
              <div className="relative bg-purple-900/90 backdrop-blur-xl rounded-2xl border border-purple-800/50 p-6 shadow-2xl">
                <h3 className="text-xl font-semibold text-white mb-6">SL / TP Analytics</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">

                  {/* SL Hit % */}
                  <div className="text-center">
                    <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-r from-red-500 to-orange-500 mx-auto mb-3">
                      <ShieldAlert className="h-5 w-5 text-white" />
                    </div>
                    <p className="text-purple-400 text-sm mb-1">Avg % SL Hit</p>
                    <p className="text-2xl font-bold text-red-400">
                      {actualTrades.length > 0 ? `${slHitPercent.toFixed(1)}%` : "N/A"}
                    </p>
                    <p className="text-purple-500 text-xs mt-1">
                      {actualTrades.filter((t) => t.closeReason?.toLowerCase() === "sl").length} trades
                    </p>
                  </div>

                  {/* TP Hit % */}
                  <div className="text-center">
                    <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 mx-auto mb-3">
                      <ShieldCheck className="h-5 w-5 text-white" />
                    </div>
                    <p className="text-purple-400 text-sm mb-1">Avg % TP Hit</p>
                    <p className="text-2xl font-bold text-green-400">
                      {actualTrades.length > 0 ? `${tpHitPercent.toFixed(1)}%` : "N/A"}
                    </p>
                    <p className="text-purple-500 text-xs mt-1">
                      {actualTrades.filter((t) => t.closeReason?.toLowerCase() === "tp").length} trades
                    </p>
                  </div>

                  {/* Long Trades */}
                  <div className="text-center">
                    <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 mx-auto mb-3">
                      <TrendingUp className="h-5 w-5 text-white" />
                    </div>
                    <p className="text-purple-400 text-sm mb-1">Long Trades</p>
                    <p className="text-2xl font-bold text-white">{longTrades.length}</p>
                    <p className={`text-sm mt-1 ${longPnL >= 0 ? "text-green-400" : "text-red-400"}`}>
                      ${longPnL.toFixed(2)}
                    </p>
                  </div>

                  {/* Short Trades */}
                  <div className="text-center">
                    <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-r from-red-500 to-orange-500 mx-auto mb-3">
                      <TrendingDown className="h-5 w-5 text-white" />
                    </div>
                    <p className="text-purple-400 text-sm mb-1">Short Trades</p>
                    <p className="text-2xl font-bold text-white">{shortTrades.length}</p>
                    <p className={`text-sm mt-1 ${shortPnL >= 0 ? "text-green-400" : "text-red-400"}`}>
                      ${shortPnL.toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── Session Performance Grid ── */}
          <div className="mb-8">
            <div className="group relative">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl blur opacity-25 group-hover:opacity-40 transition duration-300" />
              <div className="relative bg-purple-900/90 backdrop-blur-xl rounded-2xl border border-purple-800/50 p-6 shadow-2xl">
                <h3 className="text-xl font-semibold text-white mb-6">Trading Session Performance</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
                  {sessions.map((session) => {
                    const perf = getSessionPerformance(session.start, session.end);
                    const isPositive = perf.totalPnL >= 0;
                    return (
                      <div
                        key={session.name}
                        className="relative rounded-xl p-4 border bg-purple-800/30 border-purple-700/50 overflow-hidden"
                      >
                        {/* subtle tinted top strip */}
                        <div
                          className={`absolute inset-x-0 top-0 h-1 rounded-t-xl ${
                            isPositive
                              ? "bg-gradient-to-r from-emerald-500 to-green-400"
                              : "bg-gradient-to-r from-red-500 to-orange-400"
                          }`}
                        />
                        <h4 className="text-white font-semibold mb-3 pt-1">{session.name}</h4>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-purple-300 text-sm">Trades:</span>
                            <span className="text-white font-medium">{perf.trades}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-purple-300 text-sm">Wins:</span>
                            <span className="text-green-400 font-medium">{perf.wins}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-purple-300 text-sm">Win Rate:</span>
                            <span className="text-white font-medium">{perf.winRate.toFixed(1)}%</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-purple-300 text-sm">P/L:</span>
                            <span className={`font-medium ${isPositive ? "text-green-400" : "text-red-400"}`}>
                              ${perf.totalPnL.toFixed(2)}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* ── Institutional Metrics Summary Table ── */}
          <div>
            <div className="group relative">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl blur opacity-25 group-hover:opacity-40 transition duration-300" />
              <div className="relative bg-purple-900/90 backdrop-blur-xl rounded-2xl border border-purple-800/50 p-6 shadow-2xl">
                <h3 className="text-xl font-semibold text-white mb-6">Institutional Metrics Summary</h3>
                
                {/* Risk-Adjusted Returns */}
                <div className="mb-6">
                  <h4 className="text-purple-300 text-sm font-semibold mb-3 uppercase tracking-wider">Risk-Adjusted Returns</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <MetricCard 
                      label="Sharpe Ratio" 
                      value={institutionalMetrics.sharpeRatio.toFixed(2)} 
                      color={institutionalMetrics.sharpeRatio >= 1 ? "text-green-400" : institutionalMetrics.sharpeRatio >= 0 ? "text-yellow-400" : "text-red-400"}
                    />
                    <MetricCard 
                      label="Sortino Ratio" 
                      value={institutionalMetrics.sortinoRatio.toFixed(2)} 
                      color={institutionalMetrics.sortinoRatio >= 1 ? "text-green-400" : institutionalMetrics.sortinoRatio >= 0 ? "text-yellow-400" : "text-red-400"}
                    />
                    <MetricCard 
                      label="Calmar Ratio" 
                      value={institutionalMetrics.calmarRatio.toFixed(2)} 
                      color={institutionalMetrics.calmarRatio >= 1 ? "text-green-400" : institutionalMetrics.calmarRatio >= 0 ? "text-yellow-400" : "text-red-400"}
                    />
                    <MetricCard 
                      label="Recovery Factor" 
                      value={institutionalMetrics.recoveryFactor.toFixed(2)} 
                      color={institutionalMetrics.recoveryFactor >= 1 ? "text-green-400" : institutionalMetrics.recoveryFactor >= 0 ? "text-yellow-400" : "text-red-400"}
                    />
                  </div>
                </div>

                {/* Performance Metrics */}
                <div className="mb-6">
                  <h4 className="text-purple-300 text-sm font-semibold mb-3 uppercase tracking-wider">Performance Metrics</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <MetricCard 
                      label="Profit Factor" 
                      value={institutionalMetrics.profitFactor === Infinity ? "∞" : institutionalMetrics.profitFactor.toFixed(2)} 
                      color={institutionalMetrics.profitFactor >= 2 ? "text-green-400" : institutionalMetrics.profitFactor >= 1 ? "text-yellow-400" : "text-red-400"}
                    />
                    <MetricCard 
                      label="Win/Loss Ratio" 
                      value={institutionalMetrics.averageWinLossRatio.toFixed(2)} 
                      color={institutionalMetrics.averageWinLossRatio >= 1 ? "text-green-400" : "text-yellow-400"}
                    />
                    <MetricCard 
                      label="Annualized Return" 
                      value={`$${institutionalMetrics.annualizedReturn.toFixed(2)}`} 
                      color={institutionalMetrics.annualizedReturn >= 0 ? "text-green-400" : "text-red-400"}
                    />
                    <MetricCard 
                      label="Monthly Volatility" 
                      value={`$${institutionalMetrics.monthlyVolatility.toFixed(2)}`} 
                      color="text-purple-300"
                    />
                  </div>
                </div>

                {/* Streak Analysis */}
                <div className="mb-6">
                  <h4 className="text-purple-300 text-sm font-semibold mb-3 uppercase tracking-wider">Streak Analysis</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <MetricCard 
                      label="Max Consecutive Wins" 
                      value={institutionalMetrics.maxConsecutiveWins.toString()} 
                      color="text-green-400"
                    />
                    <MetricCard 
                      label="Max Consecutive Losses" 
                      value={institutionalMetrics.maxConsecutiveLosses.toString()} 
                      color="text-red-400"
                    />
                    <MetricCard 
                      label="Avg Holding Period" 
                      value={`${institutionalMetrics.averageHoldingPeriod.toFixed(1)} days`} 
                      color="text-purple-300"
                    />
                    <MetricCard 
                      label="Risk of Ruin" 
                      value={`${(institutionalMetrics.riskOfRuin * 100).toFixed(2)}%`} 
                      color={institutionalMetrics.riskOfRuin <= 0.01 ? "text-green-400" : institutionalMetrics.riskOfRuin <= 0.05 ? "text-yellow-400" : "text-red-400"}
                    />
                  </div>
                </div>

                {/* Position Sizing */}
                <div>
                  <h4 className="text-purple-300 text-sm font-semibold mb-3 uppercase tracking-wider">Position Sizing</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <MetricCard 
                      label="Kelly Criterion" 
                      value={`${(institutionalMetrics.kellyCriterion * 100).toFixed(1)}%`} 
                      color={institutionalMetrics.kellyCriterion > 0 ? "text-green-400" : institutionalMetrics.kellyCriterion === 0 ? "text-yellow-400" : "text-red-400"}
                    />
                    <MetricCard 
                      label="Total Trades" 
                      value={metrics?.totalTrades?.toString() || "0"} 
                      color="text-purple-300"
                    />
                    <MetricCard 
                      label="Win Rate" 
                      value={`${(metrics?.winRate ?? 0).toFixed(1)}%`} 
                      color={(metrics?.winRate ?? 0) >= 50 ? "text-green-400" : "text-red-400"}
                    />
                    <MetricCard 
                      label="Max Drawdown" 
                      value={`${(metrics?.maxDrawdown ?? 0).toFixed(2)}%`} 
                      color="text-red-400"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </MainLayout>
  );
}

// ─── Reusable KPI Card shell ──────────────────────────────────────────────────
function KPICard({
  gradient,
  iconGrad,
  icon,
  children,
}: {
  gradient: string;
  iconGrad: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="group relative">
      <div className={`absolute -inset-0.5 bg-gradient-to-r ${gradient} rounded-2xl blur opacity-25 group-hover:opacity-40 transition duration-300`} />
      <div className="relative bg-purple-900/90 backdrop-blur-xl rounded-2xl border border-purple-800/50 p-6 shadow-2xl">
        <div className={`flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-r ${iconGrad} mb-4`}>
          {icon}
        </div>
        {children}
      </div>
    </div>
  );
}

// ─── Metric Card for Institutional Metrics Table ─────────────────────────────
function MetricCard({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div className="bg-purple-800/30 rounded-xl p-4 border border-purple-700/50">
      <p className="text-purple-300 text-xs mb-1">{label}</p>
      <p className={`text-lg font-bold ${color}`}>{value}</p>
    </div>
  );
}
