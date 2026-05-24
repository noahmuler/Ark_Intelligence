"use client";

import React, { useEffect, useState, useMemo } from "react";
import { MainLayout } from "@/components/dashboard/MainLayout";
import { useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { TrendingUp, TrendingDown, DollarSign, Target, ArrowLeft, BrainCircuit } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Legend } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/charts/chart";

// Animated Counter Component
function AnimatedCounter({ value, prefix = '', suffix = '', duration = 1500 }: { value: number; prefix?: string; suffix?: string; duration?: number }) {
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

  return (
    <span>
      {prefix}{typeof count === 'number' ? count.toFixed(2) : count}{suffix}
    </span>
  );
}

interface TradingMetrics {
  winRate: number;
  profitFactor: number;
  maxDrawdown: number;
  expectancy: number;
  totalPnL: number;
  totalTrades: number;
  currentBalance: number;
  averageRR: number;
  streaks: { wins: number; losses: number };
}

interface Trade {
  ticket: number;
  symbol: string;
  type: string;
  lots: number;
  openPrice: number;
  closePrice: number;
  openTime: number;
  closeTime: number;
  profit: number;
  commission: number;
  swap: number;
}

export default function DeepAnalytics() {
  const router = useRouter();
  const [isConnected, setIsConnected] = useState(false);

  // Fetch data from Convex
  const connection = useQuery(api.mt5.getMT5Connection, { userId: "user-1" });
  const metrics = useQuery(api.mt5Queries.getTradingMetrics, { userId: "user-1" });
  const allTrades = useQuery(api.mt5Queries.getAllTrades, { userId: "user-1" });

  // Check connection status
  useEffect(() => {
    const savedConnection = localStorage.getItem("mt5Connected");
    if (savedConnection === "true" && connection) {
      setIsConnected(true);
    } else {
      setIsConnected(false);
    }
  }, [connection]);

  // Calculate monthly PnL data
  const monthlyPnLData = useMemo(() => {
    if (!allTrades) return [];
    
    const monthlyData: { month: string; profit: number; loss: number }[] = [];
    const monthMap = new Map<number, { month: string; profit: number; loss: number }>();
    
    allTrades.forEach(trade => {
      if (trade.isDeposit) return;
      
      const date = new Date(trade.closeTime);
      const monthKey = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      const timestamp = new Date(date.getFullYear(), date.getMonth(), 1).getTime();
      
      if (!monthMap.has(timestamp)) {
        monthMap.set(timestamp, { month: monthKey, profit: 0, loss: 0 });
      }
      
      const monthData = monthMap.get(timestamp)!;
      if (trade.profit > 0) {
        monthData.profit += trade.profit;
      } else {
        monthData.loss += Math.abs(trade.profit);
      }
    });
    
    // Convert to array and sort by timestamp
    const sortedMonths = Array.from(monthMap.entries()).sort((a, b) => a[0] - b[0]);
    
    // Get the last 12 months (at least 1 year of data)
    const last12Months = sortedMonths.slice(-12);
    
    last12Months.forEach(([timestamp, data]) => {
      monthlyData.push({
        month: data.month,
        profit: data.profit,
        loss: data.loss
      });
    });
    
    return monthlyData;
  }, [allTrades]);

  // Calculate total order data
  const totalOrderData = useMemo(() => {
    if (!allTrades) return [];
    
    const orderData: { month: string; profitable: number; unprofitable: number }[] = [];
    const monthMap = new Map<number, { month: string; profitable: number; unprofitable: number }>();
    
    allTrades.forEach(trade => {
      if (trade.isDeposit) return;
      
      const date = new Date(trade.closeTime);
      const monthKey = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      const timestamp = new Date(date.getFullYear(), date.getMonth(), 1).getTime();
      
      if (!monthMap.has(timestamp)) {
        monthMap.set(timestamp, { month: monthKey, profitable: 0, unprofitable: 0 });
      }
      
      const monthData = monthMap.get(timestamp)!;
      if (trade.profit > 0) {
        monthData.profitable += 1;
      } else {
        monthData.unprofitable += 1;
      }
    });
    
    // Convert to array and sort by timestamp
    const sortedMonths = Array.from(monthMap.entries()).sort((a, b) => a[0] - b[0]);
    
    // Get the last 12 months (at least 1 year of data)
    const last12Months = sortedMonths.slice(-12);
    
    last12Months.forEach(([timestamp, data]) => {
      orderData.push({
        month: data.month,
        profitable: data.profitable,
        unprofitable: data.unprofitable
      });
    });
    
    return orderData;
  }, [allTrades]);

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
              <h2 className="text-2xl font-semibold text-white text-center">
                No Broker Account Connected
              </h2>
              <p className="mt-3 text-purple-300 text-center max-w-md">
                Connect your MT5 Investor account to access deep analytics.
              </p>
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }

  // Calculate additional metrics
  const winningTrades = allTrades?.filter(t => !t.isDeposit && t.profit > 0) ?? [];
  const losingTrades = allTrades?.filter(t => !t.isDeposit && t.profit < 0) ?? [];
  const breakevenTrades = allTrades?.filter(t => !t.isDeposit && t.profit === 0) ?? [];
  const avgWinningTrade = winningTrades.length > 0 ? winningTrades.reduce((sum, t) => sum + t.profit, 0) / winningTrades.length : 0;
  const avgLosingTrade = losingTrades.length > 0 ? losingTrades.reduce((sum, t) => sum + t.profit, 0) / losingTrades.length : 0;
  const bestTrade = winningTrades.length > 0 ? Math.max(...winningTrades.map(t => t.profit)) : 0;
  const worstTrade = losingTrades.length > 0 ? Math.min(...losingTrades.map(t => t.profit)) : 0;

  // Calculate session performance
  const getSessionPerformance = (sessionStart: number, sessionEnd: number) => {
    const sessionTrades = allTrades?.filter(t => {
      if (t.isDeposit) return false;
      const tradeHour = new Date(t.closeTime).getUTCHours();
      return tradeHour >= sessionStart && tradeHour < sessionEnd;
    }) ?? [];
    
    const wins = sessionTrades.filter(t => t.profit > 0).length;
    const totalPnL = sessionTrades.reduce((sum, t) => sum + t.profit, 0);
    const winRate = sessionTrades.length > 0 ? (wins / sessionTrades.length) * 100 : 0;
    
    return {
      trades: sessionTrades.length,
      wins,
      winRate,
      totalPnL
    };
  };

  const sessions = [
    { name: 'Asian', start: 0, end: 8 },
    { name: 'London', start: 8, end: 16 },
    { name: 'New York', start: 16, end: 24 },
    { name: 'Asian-London', start: 6, end: 10 },
    { name: 'London-NY', start: 14, end: 18 },
  ];

  return (
    <MainLayout>
      <div className="p-3 sm:p-4 lg:p-6 h-full">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
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
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                  <span className="text-purple-400 text-xs">
                    {connection.serverName} - {connection.accountLogin}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* AI Analytics Summary Card */}
          <div className="mb-8">
            <div className="group relative">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl blur opacity-25 group-hover:opacity-40 transition duration-300"></div>
              <div className="relative bg-purple-900/90 backdrop-blur-xl rounded-2xl border border-purple-800/50 p-6 shadow-2xl">
                <div className="flex items-start gap-4">
                  <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-r from-purple-500 to-blue-500 flex-shrink-0">
                    <BrainCircuit className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-2">AI Analytics Summary</h3>
                    <p className="text-purple-300 text-sm leading-relaxed">
                      Based on your trading data, you have executed {metrics?.totalTrades ?? 0} trades with a win rate of {(metrics?.winRate ?? 0).toFixed(1)}%. 
                      Your average winning trade is ${avgWinningTrade.toFixed(2)} while your average losing trade is ${avgLosingTrade.toFixed(2)}. 
                      {(metrics?.expectancy ?? 0) >= 0 ? 'Your positive expectancy indicates a profitable trading strategy.' : 'Your negative expectancy suggests reviewing your risk management approach.'}
                      The London session shows the highest activity with {getSessionPerformance(8, 16).trades} trades.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 10-Card Metric Grid */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
            {/* Total Trades */}
            <div className="group relative">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl blur opacity-25 group-hover:opacity-40 transition duration-300"></div>
              <div className="relative bg-purple-900/90 backdrop-blur-xl rounded-2xl border border-purple-800/50 p-6 shadow-2xl">
                <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-r from-purple-500 to-blue-500 mb-4">
                  <Target className="h-5 w-5 text-white" />
                </div>
                <p className="text-3xl font-bold text-white mb-2">
                  <AnimatedCounter value={metrics?.totalTrades ?? 0} />
                </p>
                <p className="text-purple-300 text-sm font-medium">Total Trades</p>
              </div>
            </div>

            {/* Win Rate */}
            <div className="group relative">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-green-600 to-emerald-600 rounded-2xl blur opacity-25 group-hover:opacity-40 transition duration-300"></div>
              <div className="relative bg-purple-900/90 backdrop-blur-xl rounded-2xl border border-purple-800/50 p-6 shadow-2xl">
                <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 mb-4">
                  <Target className="h-5 w-5 text-white" />
                </div>
                <p className={`text-3xl font-bold ${(metrics?.winRate ?? 0) >= 50 ? 'text-green-400' : 'text-red-400'} mb-2`}>
                  <AnimatedCounter value={metrics?.winRate ?? 0} suffix="%" />
                </p>
                <p className="text-purple-300 text-sm font-medium">Win Rate</p>
              </div>
            </div>

            {/* Expectancy */}
            <div className="group relative">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl blur opacity-25 group-hover:opacity-40 transition duration-300"></div>
              <div className="relative bg-purple-900/90 backdrop-blur-xl rounded-2xl border border-purple-800/50 p-6 shadow-2xl">
                <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-r from-purple-500 to-blue-500 mb-4">
                  <TrendingUp className="h-5 w-5 text-white" />
                </div>
                <p className={`text-3xl font-bold ${(metrics?.expectancy ?? 0) >= 0 ? 'text-green-400' : 'text-red-400'} mb-2`}>
                  <AnimatedCounter value={metrics?.expectancy ?? 0} prefix="$" />
                </p>
                <p className="text-purple-300 text-sm font-medium">Expectancy</p>
              </div>
            </div>

            {/* Average R:R */}
            <div className="group relative">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl blur opacity-25 group-hover:opacity-40 transition duration-300"></div>
              <div className="relative bg-purple-900/90 backdrop-blur-xl rounded-2xl border border-purple-800/50 p-6 shadow-2xl">
                <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-r from-purple-500 to-blue-500 mb-4">
                  <Target className="h-5 w-5 text-white" />
                </div>
                <p className="text-3xl font-bold text-white mb-2">
                  {metrics?.averageRR != null ? <AnimatedCounter value={metrics?.averageRR ?? 0} /> : 'N/A'}
                </p>
                <p className="text-purple-300 text-sm font-medium">Avg R:R</p>
              </div>
            </div>

            {/* Total PnL */}
            <div className="group relative">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl blur opacity-25 group-hover:opacity-40 transition duration-300"></div>
              <div className="relative bg-purple-900/90 backdrop-blur-xl rounded-2xl border border-purple-800/50 p-6 shadow-2xl">
                <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-r from-purple-500 to-blue-500 mb-4">
                  <DollarSign className="h-5 w-5 text-white" />
                </div>
                <p className={`text-3xl font-bold ${(metrics?.totalPnL ?? 0) >= 0 ? 'text-green-400' : 'text-red-400'} mb-2`}>
                  <AnimatedCounter value={metrics?.totalPnL ?? 0} prefix="$" />
                </p>
                <p className="text-purple-300 text-sm font-medium">Total PnL</p>
              </div>
            </div>

            {/* Avg Winning Trade */}
            <div className="group relative">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-green-600 to-emerald-600 rounded-2xl blur opacity-25 group-hover:opacity-40 transition duration-300"></div>
              <div className="relative bg-purple-900/90 backdrop-blur-xl rounded-2xl border border-purple-800/50 p-6 shadow-2xl">
                <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 mb-4">
                  <TrendingUp className="h-5 w-5 text-white" />
                </div>
                <p className="text-3xl font-bold text-green-400 mb-2">
                  <AnimatedCounter value={avgWinningTrade} prefix="$" />
                </p>
                <p className="text-purple-300 text-sm font-medium">Avg Winning Trade</p>
              </div>
            </div>

            {/* Avg Losing Trade */}
            <div className="group relative">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-red-600 to-orange-600 rounded-2xl blur opacity-25 group-hover:opacity-40 transition duration-300"></div>
              <div className="relative bg-purple-900/90 backdrop-blur-xl rounded-2xl border border-purple-800/50 p-6 shadow-2xl">
                <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-r from-red-500 to-orange-500 mb-4">
                  <TrendingDown className="h-5 w-5 text-white" />
                </div>
                <p className="text-3xl font-bold text-red-400 mb-2">
                  <AnimatedCounter value={avgLosingTrade} prefix="$" />
                </p>
                <p className="text-purple-300 text-sm font-medium">Avg Losing Trade</p>
              </div>
            </div>

            {/* Best Trade */}
            <div className="group relative">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-green-600 to-emerald-600 rounded-2xl blur opacity-25 group-hover:opacity-40 transition duration-300"></div>
              <div className="relative bg-purple-900/90 backdrop-blur-xl rounded-2xl border border-purple-800/50 p-6 shadow-2xl">
                <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 mb-4">
                  <TrendingUp className="h-5 w-5 text-white" />
                </div>
                <p className="text-3xl font-bold text-green-400 mb-2">
                  <AnimatedCounter value={bestTrade} prefix="$" />
                </p>
                <p className="text-purple-300 text-sm font-medium">Best Trade</p>
              </div>
            </div>

            {/* Worst Trade */}
            <div className="group relative">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-red-600 to-orange-600 rounded-2xl blur opacity-25 group-hover:opacity-40 transition duration-300"></div>
              <div className="relative bg-purple-900/90 backdrop-blur-xl rounded-2xl border border-purple-800/50 p-6 shadow-2xl">
                <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-r from-red-500 to-orange-500 mb-4">
                  <TrendingDown className="h-5 w-5 text-white" />
                </div>
                <p className="text-3xl font-bold text-red-400 mb-2">
                  <AnimatedCounter value={worstTrade} prefix="$" />
                </p>
                <p className="text-purple-300 text-sm font-medium">Worst Trade</p>
              </div>
            </div>

            {/* Max Drawdown */}
            <div className="group relative">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-red-600 to-orange-600 rounded-2xl blur opacity-25 group-hover:opacity-40 transition duration-300"></div>
              <div className="relative bg-purple-900/90 backdrop-blur-xl rounded-2xl border border-purple-800/50 p-6 shadow-2xl">
                <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-r from-red-500 to-orange-500 mb-4">
                  <TrendingDown className="h-5 w-5 text-white" />
                </div>
                <p className="text-3xl font-bold text-red-400 mb-2">
                  <AnimatedCounter value={metrics?.maxDrawdown ?? 0} suffix="%" />
                </p>
                <p className="text-purple-300 text-sm font-medium">Max Drawdown</p>
              </div>
            </div>
          </div>

          {/* Charts Section - PnL and Total Orders */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Monthly PnL Bar Chart */}
            <div className="group relative">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl blur opacity-25 group-hover:opacity-40 transition duration-300"></div>
              <div className="relative bg-purple-900/90 backdrop-blur-xl rounded-2xl border border-purple-800/50 p-5 shadow-2xl">
                <h3 className="text-base font-semibold text-white mb-4">Monthly PnL</h3>
                <div className="h-52">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={monthlyPnLData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#7c3aed" opacity={0.2} vertical={false} />
                      <XAxis 
                        dataKey="month" 
                        stroke="#a78bfa" 
                        fontSize={10}
                        tickLine={false}
                        axisLine={false}
                        interval={0}
                      />
                      <YAxis 
                        stroke="#a78bfa" 
                        fontSize={10}
                        tickLine={false}
                        axisLine={false}
                        width={35}
                      />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="profit" stackId="pnl" fill="#10b981" name="Profit" radius={[2, 2, 0, 0]} />
                      <Bar dataKey="loss" stackId="pnl" fill="#ef4444" name="Loss" radius={[0, 0, 2, 2]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Total Order Bar Chart */}
            <div className="group relative">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl blur opacity-25 group-hover:opacity-40 transition duration-300"></div>
              <div className="relative bg-purple-900/90 backdrop-blur-xl rounded-2xl border border-purple-800/50 p-5 shadow-2xl">
                <h3 className="text-base font-semibold text-white mb-4">Total Orders</h3>
                <div className="h-52">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={totalOrderData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#7c3aed" opacity={0.2} vertical={false} />
                      <XAxis 
                        dataKey="month" 
                        stroke="#a78bfa" 
                        fontSize={10}
                        tickLine={false}
                        axisLine={false}
                        interval={0}
                      />
                      <YAxis 
                        stroke="#a78bfa" 
                        fontSize={10}
                        tickLine={false}
                        axisLine={false}
                        width={35}
                      />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="profitable" fill="#10b981" name="Profitable" radius={[2, 2, 2, 2]} />
                      <Bar dataKey="unprofitable" fill="#ef4444" name="Unprofitable" radius={[2, 2, 2, 2]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>

          {/* SL/TP Analytics Section */}
          <div className="mb-8">
            <div className="group relative">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl blur opacity-25 group-hover:opacity-40 transition duration-300"></div>
              <div className="relative bg-purple-900/90 backdrop-blur-xl rounded-2xl border border-purple-800/50 p-6 shadow-2xl">
                <h3 className="text-xl font-semibold text-white mb-6">SL/TP Analytics</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <p className="text-purple-400 text-sm mb-2">Avg % SL Hit</p>
                    <p className="text-2xl font-bold text-white">N/A</p>
                  </div>
                  <div className="text-center">
                    <p className="text-purple-400 text-sm mb-2">Avg % TP Hit</p>
                    <p className="text-2xl font-bold text-white">N/A</p>
                  </div>
                  <div className="text-center">
                    <p className="text-purple-400 text-sm mb-2">Long Trades</p>
                    <p className="text-2xl font-bold text-white">
                      {allTrades?.filter(t => !t.isDeposit && t.type === 'BUY').length ?? 0}
                    </p>
                    <p className={`text-sm ${(allTrades?.filter(t => !t.isDeposit && t.type === 'BUY').reduce((sum, t) => sum + t.profit, 0) ?? 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      ${(allTrades?.filter(t => !t.isDeposit && t.type === 'BUY').reduce((sum, t) => sum + t.profit, 0) ?? 0).toFixed(2)}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-purple-400 text-sm mb-2">Short Trades</p>
                    <p className="text-2xl font-bold text-white">
                      {allTrades?.filter(t => !t.isDeposit && t.type === 'SELL').length ?? 0}
                    </p>
                    <p className={`text-sm ${(allTrades?.filter(t => !t.isDeposit && t.type === 'SELL').reduce((sum, t) => sum + t.profit, 0) ?? 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      ${(allTrades?.filter(t => !t.isDeposit && t.type === 'SELL').reduce((sum, t) => sum + t.profit, 0) ?? 0).toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Trading Session Performance Grid */}
          <div>
            <div className="group relative">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl blur opacity-25 group-hover:opacity-40 transition duration-300"></div>
              <div className="relative bg-purple-900/90 backdrop-blur-xl rounded-2xl border border-purple-800/50 p-6 shadow-2xl">
                <h3 className="text-xl font-semibold text-white mb-6">Trading Session Performance</h3>
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                  {sessions.map((session) => {
                    const perf = getSessionPerformance(session.start, session.end);
                    return (
                      <div key={session.name} className="bg-purple-800/30 rounded-xl p-4 border border-purple-700/50">
                        <h4 className="text-white font-semibold mb-3">{session.name}</h4>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-purple-300 text-sm">Trades:</span>
                            <span className="text-white font-medium">{perf.trades}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-purple-300 text-sm">Wins:</span>
                            <span className="text-white font-medium">{perf.wins}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-purple-300 text-sm">Win Rate:</span>
                            <span className="text-white font-medium">{perf.winRate.toFixed(1)}%</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-purple-300 text-sm">P/L:</span>
                            <span className={`font-medium ${perf.totalPnL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
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
        </div>
      </div>
    </MainLayout>
  );
}
