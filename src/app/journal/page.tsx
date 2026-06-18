"use client";

import React, { useEffect, useState, useMemo } from "react";
import { MainLayout } from "@/components/dashboard/MainLayout";
import { useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { BookOpen, ArrowRight, TrendingUp, TrendingDown, DollarSign, Target, ChevronLeft, ChevronRight, PieChart } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart, BarChart, Bar, PieChart as RechartsPieChart, Pie, Cell, RadialBarChart, RadialBar } from "recharts";
import { motion } from "framer-motion";
import { calcJournalStats, calcRollingStats, calcPnl, Trade as JournalTrade } from "@/lib/journalCalculations";

// Animated Counter Component
function AnimatedCounter({ value, prefix = '', suffix = '', duration = 1500 }: { value: number; prefix?: string; suffix?: string; duration?: number }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
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
        clearInterval(timer);
      } else {
        setCount(start);
      }
    }, incrementTime);
    
    return () => clearInterval(timer);
  }, [value, duration]);

  // Format: integer if whole number, otherwise 2 decimal places
  const formattedCount = typeof count === 'number' 
    ? (Number.isInteger(count) ? count.toString() : count.toFixed(2))
    : count;

  return (
    <span>
      {prefix}{formattedCount}{suffix}
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

export default function Journal() {
  const router = useRouter();
  const [isConnected, setIsConnected] = useState(false);
  const [calendarView, setCalendarView] = useState<'weekly' | 'monthly'>('monthly');
  const [currentPage, setCurrentPage] = useState(1);
  const [symbolFilter, setSymbolFilter] = useState('');
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({ start: '', end: '' });
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [selectedPeriod, setSelectedPeriod] = useState<'all' | '30d' | '7d'>('all');
  const itemsPerPage = 10;

  // Fetch data from Convex
  const connection = useQuery(api.mt5.getMT5Connection, { userId: "user-1" });
  const metrics = useQuery(api.mt5Queries.getTradingMetrics, { userId: "user-1" });
  const allTrades = useQuery(api.mt5Queries.getAllTrades, { userId: "user-1" });
  const equityCurve = useQuery(api.mt5Queries.getEquityCurve, { userId: "user-1" });

  const periodFilteredTrades = useMemo(() => {
    if (!allTrades || selectedPeriod === 'all') return allTrades ?? [];
    const now = Date.now();
    const cutoff = selectedPeriod === '30d'
      ? now - 30 * 24 * 60 * 60 * 1000
      : now - 7 * 24 * 60 * 60 * 1000;
    return allTrades.filter((trade) => trade.closeTime >= cutoff);
  }, [allTrades, selectedPeriod]);

  const pnlDistributionData = useMemo(() => ([
    { name: '< -$500', value: periodFilteredTrades.filter(t => t.profit < -500).length },
    { name: '-$500 to -$200', value: periodFilteredTrades.filter(t => t.profit >= -500 && t.profit < -200).length },
    { name: '-$200 to $0', value: periodFilteredTrades.filter(t => t.profit >= -200 && t.profit < 0).length },
    { name: '$0 to $200', value: periodFilteredTrades.filter(t => t.profit >= 0 && t.profit < 200).length },
    { name: '$200 to $500', value: periodFilteredTrades.filter(t => t.profit >= 200 && t.profit < 500).length },
    { name: '>$500', value: periodFilteredTrades.filter(t => t.profit >= 500).length },
  ]), [periodFilteredTrades]);

  const rMultipleData = useMemo(() => {
    const buckets: Record<string, number> = {
      '< -2R': 0,
      '-2R to -1R': 0,
      '-1R to 0': 0,
      '0 to +1R': 0,
      '+1R to +2R': 0,
      '+2R to +3R': 0,
      '> +3R': 0,
    };

    const actualTrades = periodFilteredTrades.filter(t => t.type === 'BUY' || t.type === 'SELL');
    for (const trade of actualTrades) {
      if (!trade.stopLoss || !trade.openPrice || trade.stopLoss === 0) continue;
      const risk = Math.abs(trade.openPrice - trade.stopLoss) * trade.lots;
      if (risk === 0) continue;
      const rMultiple = trade.profit / risk;

      if (rMultiple < -2) buckets['< -2R']++;
      else if (rMultiple < -1) buckets['-2R to -1R']++;
      else if (rMultiple < 0) buckets['-1R to 0']++;
      else if (rMultiple < 1) buckets['0 to +1R']++;
      else if (rMultiple < 2) buckets['+1R to +2R']++;
      else if (rMultiple < 3) buckets['+2R to +3R']++;
      else buckets['> +3R']++;
    }

    return Object.entries(buckets).map(([name, value]) => ({ name, value }));
  }, [periodFilteredTrades]);

  // Calculate max/min and offset for dual-color split gradient in Recharts AreaChart
  const { maxVal, minVal } = useMemo(() => {
    if (!equityCurve || equityCurve.length === 0) return { maxVal: 0, minVal: 0 };
    const values = equityCurve.map(d => d.equity);
    return {
      maxVal: Math.max(...values),
      minVal: Math.min(...values),
    };
  }, [equityCurve]);

  const offset = useMemo(() => {
    if (maxVal <= 0) return 0;
    if (minVal >= 0) return 1;
    return maxVal / (maxVal - minVal);
  }, [maxVal, minVal]);

  // Filter trades
  const startDate = dateRange.start ? new Date(dateRange.start) : null;
  const endDate = dateRange.end ? new Date(dateRange.end) : null;
  if (endDate) {
    endDate.setHours(23, 59, 59, 999);
  }

  const filteredTrades = allTrades?.filter(trade => {
    const symbolMatch = symbolFilter === '' || trade.symbol.toLowerCase().includes(symbolFilter.toLowerCase());
    const startDateMatch = !startDate || new Date(trade.closeTime) >= startDate;
    const endDateMatch = !endDate || new Date(trade.closeTime) <= endDate;
    return symbolMatch && startDateMatch && endDateMatch;
  }) ?? [];

  // Pagination
  const totalPages = Math.ceil(filteredTrades.length / itemsPerPage);
  const paginatedTrades = filteredTrades.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const trades = paginatedTrades;

  // Check connection status
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    const savedConnection = localStorage.getItem("mt5Connected");
    if (savedConnection === "true" && connection) {
      setIsConnected(true);
    } else {
      setIsConnected(false);
    }
  }, [connection]);
  /* eslint-enable react-hooks/set-state-in-effect */

  if (!isConnected) {
    return (
      <MainLayout>
        <div className="p-3 sm:p-4 lg:p-6 h-full">
          <div className="max-w-7xl mx-auto">
            {/* Page Header */}
            <div className="mb-8">
              <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">Trading Journal</h1>
              <p className="text-purple-300 text-sm sm:text-base">
                Real-time trading analytics and performance metrics
              </p>
            </div>

            {/* Empty State */}
            <div className="flex flex-col items-center justify-center min-h-[400px]">
              <div className="relative">
                <div className="absolute -inset-4 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full blur-2xl opacity-20" />
                <div className="relative flex items-center justify-center w-24 h-24 rounded-full bg-purple-900/50 backdrop-blur-xl border border-purple-700/50">
                  <BookOpen className="h-12 w-12 text-purple-400" />
                </div>
              </div>

              <h2 className="mt-8 text-2xl font-semibold text-white text-center">
                No Broker Account Connected
              </h2>
              <p className="mt-3 text-purple-300 text-center max-w-md">
                Connect your MT5 Investor account to unlock real-time trading analytics.
              </p>

              <button
                onClick={() => router.push("/settings")}
                className="mt-8 group relative inline-flex items-center px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold rounded-xl hover:from-purple-700 hover:to-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                <span>Go to Settings</span>
                <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
              </button>
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="p-3 sm:p-4 lg:p-6 h-full">
        <div className="max-w-7xl mx-auto">
          {/* Page Header */}
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">Trading Journal</h1>
              <p className="text-purple-300 text-sm sm:text-base">
                Real-time trading analytics and performance metrics
              </p>
              {connection && (
                <div className="mt-2 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                  <span className="text-purple-400 text-xs">
                    Connected: {connection.serverName} - {connection.accountLogin}
                  </span>
                </div>
              )}
            </div>
            <button
              onClick={() => router.push("/journal/analytics")}
              className="group relative inline-flex items-center px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              <span>Deep Analytics</span>
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </button>
          </div>

          {/* Rolling Metrics Selector */}
          <div className="mb-6 flex items-center gap-2">
            <span className="text-sm text-purple-400">Time Period:</span>
            {['all', '30d', '7d'].map((period) => (
              <button
                key={period}
                className={`px-3 py-1 text-sm rounded border transition-colors ${
                  period === 'all'
                    ? 'bg-purple-600/30 border-purple-500/60 text-white'
                    : 'bg-purple-900/30 border-purple-800/40 text-purple-400 hover:bg-purple-800/40'
                }`}
              >
                {period === 'all' ? 'All Time' : period === '30d' ? '30 Days' : '7 Days'}
              </button>
            ))}
          </div>

          {/* KPI Cards - Responsive Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {/* Row 1 */}
            {/* Current Balance */}
            <div className="group relative">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl blur opacity-25 group-hover:opacity-40 transition duration-300"></div>
              <div className="relative bg-purple-900/90 backdrop-blur-xl rounded-2xl border border-purple-800/50 p-6 shadow-2xl">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-r from-purple-500 to-blue-500">
                    <DollarSign className="h-5 w-5 text-white" />
                  </div>
                  <span className={`text-3xl sm:text-4xl font-bold ${(metrics?.currentBalance ?? 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    <AnimatedCounter value={metrics?.currentBalance ?? 0} prefix="$" />
                  </span>
                </div>
                <p className="text-purple-300 text-sm font-medium">Current Balance</p>
                <p className="text-purple-400 text-xs mt-1">Deposits + PnL</p>
              </div>
            </div>
 
            {/* Profit Factor */}
            <div className="group relative">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl blur opacity-25 group-hover:opacity-40 transition duration-300"></div>
              <div className="relative bg-purple-900/90 backdrop-blur-xl rounded-2xl border border-purple-800/50 p-6 shadow-2xl">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-r from-purple-500 to-blue-500">
                    <TrendingUp className="h-5 w-5 text-white" />
                  </div>
                  <span className={`text-3xl sm:text-4xl font-bold ${(metrics?.profitFactor ?? 0) >= 1 ? 'text-green-400' : 'text-red-400'}`}>
                    <AnimatedCounter value={metrics?.profitFactor ?? 0} />
                  </span>
                </div>
                <p className="text-purple-300 text-sm font-medium">Profit Factor</p>
                <p className="text-purple-400 text-xs mt-1">Gross Win / Gross Loss</p>
              </div>
            </div>
 
            {/* Win Rate */}
            <div className="group relative">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-green-600 to-emerald-600 rounded-2xl blur opacity-25 group-hover:opacity-40 transition duration-300"></div>
              <div className="relative bg-purple-900/90 backdrop-blur-xl rounded-2xl border border-purple-800/50 p-6 shadow-2xl">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500">
                    <Target className="h-5 w-5 text-white" />
                  </div>
                  <span className={`text-3xl sm:text-4xl font-bold ${(metrics?.winRate ?? 0) >= 50 ? 'text-green-400' : 'text-red-400'}`}>
                    <AnimatedCounter value={metrics?.winRate ?? 0} suffix="%" />
                  </span>
                </div>
                <p className="text-purple-300 text-sm font-medium">Win Rate</p>
                <p className="text-purple-400 text-xs mt-1">{metrics?.totalTrades ?? 0} total trades</p>
              </div>
            </div>
 
            {/* Total PnL */}
            <div className="group relative">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl blur opacity-25 group-hover:opacity-40 transition duration-300"></div>
              <div className="relative bg-purple-900/90 backdrop-blur-xl rounded-2xl border border-purple-800/50 p-6 shadow-2xl">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-r from-purple-500 to-blue-500">
                    <DollarSign className="h-5 w-5 text-white" />
                  </div>
                  <span className={`text-3xl sm:text-4xl font-bold ${(metrics?.totalPnL ?? 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    <AnimatedCounter value={metrics?.totalPnL ?? 0} prefix="$" />
                  </span>
                </div>
                <p className="text-purple-300 text-sm font-medium">Total PnL</p>
                <p className="text-purple-400 text-xs mt-1">Cumulative profit/loss</p>
              </div>
            </div>
 
            {/* Row 2 */}
            {/* Total Trades */}
            <div className="group relative">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl blur opacity-25 group-hover:opacity-40 transition duration-300"></div>
              <div className="relative bg-purple-900/90 backdrop-blur-xl rounded-2xl border border-purple-800/50 p-6 shadow-2xl">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-r from-purple-500 to-blue-500">
                    <Target className="h-5 w-5 text-white" />
                  </div>
                  <span className="text-3xl sm:text-4xl font-bold text-white">
                    <AnimatedCounter value={metrics?.totalTrades ?? 0} />
                  </span>
                </div>
                <p className="text-purple-300 text-sm font-medium">Total Trades</p>
                <p className="text-purple-400 text-xs mt-1">Trade count</p>
              </div>
            </div>
 
            {/* Expectancy */}
            <div className="group relative">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl blur opacity-25 group-hover:opacity-40 transition duration-300"></div>
              <div className="relative bg-purple-900/90 backdrop-blur-xl rounded-2xl border border-purple-800/50 p-6 shadow-2xl">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-r from-purple-500 to-blue-500">
                    <TrendingUp className="h-5 w-5 text-white" />
                  </div>
                  <span className={`text-3xl sm:text-4xl font-bold ${(metrics?.expectancy ?? 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    <AnimatedCounter value={metrics?.expectancy ?? 0} prefix="$" />
                  </span>
                </div>
                <p className="text-purple-300 text-sm font-medium">Expectancy</p>
                <p className="text-purple-400 text-xs mt-1">Average trade profit</p>
              </div>
            </div>
 
            {/* Average R:R */}
            <div className="group relative">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl blur opacity-25 group-hover:opacity-40 transition duration-300"></div>
              <div className="relative bg-purple-900/90 backdrop-blur-xl rounded-2xl border border-purple-800/50 p-6 shadow-2xl">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-r from-purple-500 to-blue-500">
                    <Target className="h-5 w-5 text-white" />
                  </div>
                  <span className="text-3xl sm:text-4xl font-bold text-white">
                    {metrics?.averageRR != null ? <AnimatedCounter value={metrics?.averageRR ?? 0} /> : 'N/A'}
                  </span>
                </div>
                <p className="text-purple-300 text-sm font-medium">Average R:R</p>
                <p className="text-purple-400 text-xs mt-1">Risk to Reward ratio</p>
              </div>
            </div>

            {/* Streaks - Redesigned with separate columns */}
            <div className="group relative">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl blur opacity-25 group-hover:opacity-40 transition duration-300"></div>
              <div className="relative bg-purple-900/90 backdrop-blur-xl rounded-2xl border border-purple-800/50 p-6 shadow-2xl">
                <p className="text-purple-300 text-sm font-medium mb-4">Streaks</p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <p className="text-purple-400 text-xs mb-1">Max Win Streak</p>
                    <p className="text-2xl font-bold text-green-400">
                      <AnimatedCounter value={metrics?.streaks?.wins ?? 0} />
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-purple-400 text-xs mb-1">Max Loss Streak</p>
                    <p className="text-2xl font-bold text-red-400">
                      <AnimatedCounter value={metrics?.streaks?.losses ?? 0} />
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Equity Curve Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-8"
          >
            <div className="group relative">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl blur opacity-25 group-hover:opacity-40 transition duration-300"></div>
              <div className="relative bg-purple-900/90 backdrop-blur-xl rounded-2xl border border-purple-800/50 p-6 shadow-2xl">
                <h3 className="text-xl font-semibold text-white mb-6">Equity Curve</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={equityCurve ?? []}>
                      <defs>
                        <linearGradient id="splitColor" x1="0" y1="0" x2="0" y2="1">
                          <stop offset={offset} stopColor="#10b981" stopOpacity={1} />
                          <stop offset={offset} stopColor="#ef4444" stopOpacity={1} />
                        </linearGradient>
                        <linearGradient id="splitFill" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#10b981" stopOpacity={0.3} />
                          <stop offset={offset} stopColor="#10b981" stopOpacity={0} />
                          <stop offset={offset} stopColor="#ef4444" stopOpacity={0} />
                          <stop offset="100%" stopColor="#ef4444" stopOpacity={0.3} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#7c3aed" opacity={0.3} />
                      <XAxis
                        dataKey="timestamp"
                        stroke="#a78bfa"
                        tickFormatter={(value) => new Date(value).toLocaleDateString()}
                      />
                      <YAxis stroke="#a78bfa" domain={['auto', 'auto']} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'rgba(88, 28, 135, 0.9)',
                          border: '1px solid #7c3aed',
                          borderRadius: '8px',
                          color: '#fff'
                        }}
                        labelFormatter={(value) => new Date(value as number).toLocaleString()}
                        formatter={(value: unknown) => [`$${typeof value === 'number' ? value.toFixed(2) : '0.00'}`, 'Equity']}
                      />
                      <Area
                        type="monotone"
                        dataKey="equity"
                        stroke="url(#splitColor)"
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#splitFill)"
                        animationDuration={1000}
                        dot={{ fill: (equityCurve?.[equityCurve.length - 1]?.equity ?? 0) >= 0 ? '#10b981' : '#ef4444', strokeWidth: 2, r: 4 }}
                        activeDot={{ r: 6 }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </motion.div>

          {/* New Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Win Rate Donut */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <div className="group relative">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl blur opacity-25 group-hover:opacity-40 transition duration-300"></div>
                <div className="relative bg-purple-900/90 backdrop-blur-xl rounded-2xl border border-purple-800/50 p-6 shadow-2xl">
                  <h3 className="text-xl font-semibold text-white mb-6">Win Rate</h3>
                  <div className="h-64 flex items-center justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsPieChart>
                        <Pie
                          data={[
                            { name: 'Wins', value: metrics?.totalTrades ? Math.round((metrics?.winRate ?? 0) / 100 * metrics.totalTrades) : 0 },
                            { name: 'Losses', value: metrics?.totalTrades ? metrics.totalTrades - Math.round((metrics?.winRate ?? 0) / 100 * metrics.totalTrades) : 0 },
                          ]}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                          isAnimationActive={true}
                          animationDuration={800}
                        >
                          <Cell fill="#10b981" />
                          <Cell fill="#ef4444" />
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'rgba(88, 28, 135, 0.9)',
                            border: '1px solid #7c3aed',
                            borderRadius: '8px',
                            color: '#fff'
                          }}
                        />
                      </RechartsPieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="text-center">
                        <span className="text-3xl font-bold text-white">{metrics?.winRate ?? 0}%</span>
                        <span className="block text-xs text-purple-400">Win Rate</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* P&L Distribution Histogram */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <div className="group relative">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl blur opacity-25 group-hover:opacity-40 transition duration-300"></div>
                <div className="relative bg-purple-900/90 backdrop-blur-xl rounded-2xl border border-purple-800/50 p-6 shadow-2xl">
                  <h3 className="text-xl font-semibold text-white mb-6">P&L Distribution</h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={[
                        { name: '< -$500', value: allTrades?.filter(t => t.profit < -500).length ?? 0 },
                        { name: '-$500 to -$200', value: allTrades?.filter(t => t.profit >= -500 && t.profit < -200).length ?? 0 },
                        { name: '-$200 to $0', value: allTrades?.filter(t => t.profit >= -200 && t.profit < 0).length ?? 0 },
                        { name: '$0 to $200', value: allTrades?.filter(t => t.profit >= 0 && t.profit < 200).length ?? 0 },
                        { name: '$200 to $500', value: allTrades?.filter(t => t.profit >= 200 && t.profit < 500).length ?? 0 },
                        { name: '>$500', value: allTrades?.filter(t => t.profit >= 500).length ?? 0 },
                      ]}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#7c3aed" opacity={0.3} />
                        <XAxis dataKey="name" stroke="#a78bfa" tick={{ fontSize: 10 }} />
                        <YAxis stroke="#a78bfa" />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'rgba(88, 28, 135, 0.9)',
                            border: '1px solid #7c3aed',
                            borderRadius: '8px',
                            color: '#fff'
                          }}
                        />
                        <Bar dataKey="value" isAnimationActive={true} animationDuration={800}>
                          {[0, 1, 2].map((index) => (
                            <Cell key={`cell-${index}`} fill="#ef4444" />
                          ))}
                          {[3, 4, 5].map((index) => (
                            <Cell key={`cell-${index}`} fill="#10b981" />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* R-Multiple Distribution */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mb-8"
          >
            <div className="group relative">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl blur opacity-25 group-hover:opacity-40 transition duration-300"></div>
              <div className="relative bg-purple-900/90 backdrop-blur-xl rounded-2xl border border-purple-800/50 p-6 shadow-2xl">
                <h3 className="text-xl font-semibold text-white mb-6">R-Multiple Distribution</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={[
                      { name: '-3R', value: 0 },
                      { name: '-2R', value: 0 },
                      { name: '-1R', value: 0 },
                      { name: '0', value: 0 },
                      { name: '+1R', value: 0 },
                      { name: '+2R', value: 0 },
                      { name: '+3R', value: 0 },
                      { name: '+4R+', value: 0 },
                    ]}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#7c3aed" opacity={0.3} />
                      <XAxis dataKey="name" stroke="#a78bfa" />
                      <YAxis stroke="#a78bfa" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'rgba(88, 28, 135, 0.9)',
                          border: '1px solid #7c3aed',
                          borderRadius: '8px',
                          color: '#fff'
                        }}
                      />
                      <Bar dataKey="value" fill="#8b5cf6" isAnimationActive={true} animationDuration={800} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </motion.div>

          {/* PnL Calendar */}
          <div className="mb-8">
            <div className="group relative">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl blur opacity-25 group-hover:opacity-40 transition duration-300"></div>
              <div className="relative bg-purple-900/90 backdrop-blur-xl rounded-2xl border border-purple-800/50 p-6 shadow-2xl">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
                  {/* Left spacer to visually balance the toggle on the right */}
                  <div className="hidden sm:block w-32"></div>
                  
                  {/* Positioned precisely at the top-center */}
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => {
                        const newDate = new Date(calendarDate);
                        if (calendarView === 'monthly') {
                          newDate.setMonth(newDate.getMonth() - 1);
                        } else {
                          newDate.setDate(newDate.getDate() - 7);
                        }
                        setCalendarDate(newDate);
                      }}
                      className="p-2 rounded-lg bg-purple-800 text-purple-300 hover:bg-purple-700 transition-colors"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                    <h3 className="text-xl font-semibold text-white text-center min-w-[150px]">
                      {calendarView === 'monthly' 
                        ? calendarDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
                        : (() => {
                            const firstDayOfMonth = new Date(calendarDate.getFullYear(), calendarDate.getMonth(), 1);
                            const shift = firstDayOfMonth.getDay();
                            const weekNumber = Math.floor((calendarDate.getDate() + shift - 1) / 7) + 1;
                            return `Week ${weekNumber}, ${calendarDate.getFullYear()}`;
                          })()
                      }
                    </h3>
                    <button
                      onClick={() => {
                        const newDate = new Date(calendarDate);
                        if (calendarView === 'monthly') {
                          newDate.setMonth(newDate.getMonth() + 1);
                        } else {
                          newDate.setDate(newDate.getDate() + 7);
                        }
                        setCalendarDate(newDate);
                      }}
                      className="p-2 rounded-lg bg-purple-800 text-purple-300 hover:bg-purple-700 transition-colors"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </button>
                  </div>
 
                  <div className="flex gap-2 sm:w-32 sm:justify-end">
                    <button
                      onClick={() => setCalendarView('weekly')}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        calendarView === 'weekly'
                          ? 'bg-purple-600 text-white'
                          : 'bg-purple-800 text-purple-300 hover:bg-purple-700'
                      }`}
                    >
                      Weekly
                    </button>
                    <button
                      onClick={() => setCalendarView('monthly')}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        calendarView === 'monthly'
                          ? 'bg-purple-600 text-white'
                          : 'bg-purple-800 text-purple-300 hover:bg-purple-700'
                      }`}
                    >
                      Monthly
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-7 gap-2">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                    <div key={day} className="text-center text-purple-400 text-sm font-medium py-2">
                      {day}
                    </div>
                  ))}
                  {calendarView === 'monthly' ? (() => {
                    const currentYear = calendarDate.getFullYear();
                    const currentMonth = calendarDate.getMonth();
                    const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
                    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
                    const startDayOfWeek = firstDayOfMonth.getDay();
                    
                    const calendarDays = [];
                    // Add empty cells for days before the first day of the month
                    for (let i = 0; i < startDayOfWeek; i++) {
                      calendarDays.push(null);
                    }
                    // Add days of the month
                    for (let day = 1; day <= daysInMonth; day++) {
                      calendarDays.push(day);
                    }

                    return calendarDays.map((day, i) => {
                      if (day === null) {
                        return <div key={i} className="p-3"></div>;
                      }

                      const dayPnL = allTrades?.reduce((sum, t) => {
                        if (t.isDeposit) return sum; // Skip deposits (isDeposit = true)
                        if (t.type === 'WITHDRAWAL') return sum; // Skip withdrawals
                        const tradeDate = new Date(t.closeTime);
                        if (
                          tradeDate.getDate() === day &&
                          tradeDate.getMonth() === currentMonth &&
                          tradeDate.getFullYear() === currentYear
                        ) {
                          return sum + t.profit;
                        }
                        return sum;
                      }, 0) ?? 0;

                      return (
                        <div
                          key={i}
                          className="relative group p-3 rounded-lg bg-purple-800/30 hover:bg-purple-800/50 transition-colors cursor-pointer"
                        >
                          <span className="text-white text-sm">{day}</span>
                          {dayPnL !== 0 && (
                            <span className={`block text-xs mt-1 ${dayPnL > 0 ? 'text-emerald-400' : 'text-rose-500'}`}>
                              ${dayPnL.toFixed(0)}
                            </span>
                          )}
                          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-purple-900 rounded-lg border border-purple-700 text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                            {dayPnL !== 0 ? `Day PnL: $${dayPnL.toFixed(2)}` : 'No trades'}
                          </div>
                        </div>
                      );
                    });
                  })() : (() => {
                    // Weekly view - show selected week
                    const currentDayOfWeek = calendarDate.getDay();
                    const startOfWeek = new Date(calendarDate);
                    startOfWeek.setDate(calendarDate.getDate() - currentDayOfWeek);
                    startOfWeek.setHours(0, 0, 0, 0);

                    const weekDays = [];
                    for (let i = 0; i < 7; i++) {
                      const day = new Date(startOfWeek);
                      day.setDate(startOfWeek.getDate() + i);
                      weekDays.push(day);
                    }

                    return weekDays.map((date, i) => {
                      const dayPnL = allTrades?.reduce((sum, t) => {
                        if (t.isDeposit) return sum; // Skip deposits (isDeposit = true)
                        if (t.type === 'WITHDRAWAL') return sum; // Skip withdrawals
                        const tradeDate = new Date(t.closeTime);
                        if (
                          tradeDate.getDate() === date.getDate() &&
                          tradeDate.getMonth() === date.getMonth() &&
                          tradeDate.getFullYear() === date.getFullYear()
                        ) {
                          return sum + t.profit;
                        }
                        return sum;
                      }, 0) ?? 0;

                      return (
                        <div
                          key={i}
                          className="relative group p-3 rounded-lg bg-purple-800/30 hover:bg-purple-800/50 transition-colors cursor-pointer"
                        >
                          <span className="text-white text-sm">{date.getDate()}</span>
                          {dayPnL !== 0 && (
                            <span className={`block text-xs mt-1 ${dayPnL > 0 ? 'text-emerald-400' : 'text-rose-500'}`}>
                              ${dayPnL.toFixed(0)}
                            </span>
                          )}
                          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-purple-900 rounded-lg border border-purple-700 text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                            {dayPnL !== 0 ? `Day PnL: $${dayPnL.toFixed(2)}` : 'No trades'}
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>
            </div>
          </div>

          {/* Recent Executions Table */}
          <div>
            <div className="group relative">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl blur opacity-25 group-hover:opacity-40 transition duration-300"></div>
              <div className="relative bg-purple-900/90 backdrop-blur-xl rounded-2xl border border-purple-800/50 p-6 shadow-2xl">
                <h3 className="text-xl font-semibold text-white mb-6">Recent Executions</h3>
                
                {/* Filters */}
                <div className="flex gap-4 mb-6 flex-wrap">
                  <div className="flex-1 min-w-[200px]">
                    <label className="block text-purple-300 text-sm mb-2">Symbol</label>
                    <input
                      type="text"
                      value={symbolFilter}
                      onChange={(e) => {
                        setSymbolFilter(e.target.value);
                        setCurrentPage(1);
                      }}
                      placeholder="Filter by symbol (e.g., XAUUSDm)"
                      className="w-full bg-purple-800 text-white text-sm rounded-lg px-4 py-2 border border-purple-700 focus:border-purple-500 focus:ring-2 focus:ring-purple-500 placeholder-purple-400"
                    />
                  </div>
                  <div className="flex-1 min-w-[200px]">
                    <label className="block text-purple-300 text-sm mb-2">Start Date</label>
                    <input
                      type="date"
                      value={dateRange.start}
                      onChange={(e) => {
                        setDateRange({ ...dateRange, start: e.target.value });
                        setCurrentPage(1);
                      }}
                      className="w-full bg-purple-800 text-white text-sm rounded-lg px-4 py-2 border border-purple-700 focus:border-purple-500 focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  <div className="flex-1 min-w-[200px]">
                    <label className="block text-purple-300 text-sm mb-2">End Date</label>
                    <input
                      type="date"
                      value={dateRange.end}
                      onChange={(e) => {
                        setDateRange({ ...dateRange, end: e.target.value });
                        setCurrentPage(1);
                      }}
                      className="w-full bg-purple-800 text-white text-sm rounded-lg px-4 py-2 border border-purple-700 focus:border-purple-500 focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-purple-700/50">
                        <th className="text-left text-purple-300 text-sm font-medium py-3 px-4">Symbol</th>
                        <th className="text-left text-purple-300 text-sm font-medium py-3 px-4">Type</th>
                        <th className="text-left text-purple-300 text-sm font-medium py-3 px-4">Lots</th>
                        <th className="text-left text-purple-300 text-sm font-medium py-3 px-4">Open Time</th>
                        <th className="text-left text-purple-300 text-sm font-medium py-3 px-4">Close Time</th>
                        <th className="text-right text-purple-300 text-sm font-medium py-3 px-4">Profit/Loss</th>
                      </tr>
                    </thead>
                    <tbody>
                      {trades?.map((trade) => (
                        <tr key={trade.ticket} className="border-b border-purple-800/30 hover:bg-purple-800/20 transition-colors">
                          <td className="text-white text-sm py-3 px-4 font-medium">{trade.symbol}</td>
                          <td className="py-3 px-4">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              trade.type === 'BUY' 
                                ? 'bg-green-900/30 text-green-400 border border-green-700/50' 
                                : 'bg-red-900/30 text-red-400 border border-red-700/50'
                            }`}>
                              {trade.type}
                            </span>
                          </td>
                          <td className="text-purple-300 text-sm py-3 px-4">{trade.lots}</td>
                          <td className="text-purple-300 text-sm py-3 px-4">
                            {new Date(trade.openTime).toLocaleString()}
                          </td>
                          <td className="text-purple-300 text-sm py-3 px-4">
                            {new Date(trade.closeTime).toLocaleString()}
                          </td>
                          <td className={`text-right text-sm font-medium py-3 px-4 ${
                            trade.profit >= 0 ? 'text-green-400' : 'text-red-400'
                          }`}>
                            {trade.profit >= 0 ? '+' : ''}${trade.profit.toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between mt-6">
                    <div className="text-purple-300 text-sm">
                      Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredTrades.length)} of {filteredTrades.length} trades
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                        className="px-4 py-2 bg-purple-700 text-white rounded-lg hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        Previous
                      </button>
                      <span className="px-4 py-2 text-purple-300">
                        Page {currentPage} of {totalPages}
                      </span>
                      <button
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
                        className="px-4 py-2 bg-purple-700 text-white rounded-lg hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
