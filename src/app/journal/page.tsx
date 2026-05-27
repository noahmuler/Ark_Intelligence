"use client";

import React, { useEffect, useState } from "react";
import { MainLayout } from "@/components/dashboard/MainLayout";
import { useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { BookOpen, ArrowRight, TrendingUp, TrendingDown, DollarSign, Target, ChevronLeft, ChevronRight } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from "recharts";

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
  const itemsPerPage = 10;

  // Fetch data from Convex
  const connection = useQuery(api.mt5.getMT5Connection, { userId: "user-1" });
  const metrics = useQuery(api.mt5Queries.getTradingMetrics, { userId: "user-1" });
  const allTrades = useQuery(api.mt5Queries.getAllTrades, { userId: "user-1" });
  const equityCurve = useQuery(api.mt5Queries.getEquityCurve, { userId: "user-1" });

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
  useEffect(() => {
    const savedConnection = localStorage.getItem("mt5Connected");
    if (savedConnection === "true" && connection) {
      setIsConnected(true);
    } else {
      setIsConnected(false);
    }
  }, [connection]);

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

          {/* KPI Cards - 2-row 4-column grid */}
          <div className="grid grid-cols-4 gap-4 mb-8">
            {/* Row 1 */}
            {/* Current Balance */}
            <div className="group relative">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl blur opacity-25 group-hover:opacity-40 transition duration-300"></div>
              <div className="relative bg-purple-900/90 backdrop-blur-xl rounded-2xl border border-purple-800/50 p-6 shadow-2xl">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-r from-purple-500 to-blue-500">
                    <DollarSign className="h-5 w-5 text-white" />
                  </div>
                  <span className={`text-3xl font-bold ${(metrics?.currentBalance ?? 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
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
                  <span className={`text-3xl font-bold ${(metrics?.profitFactor ?? 0) >= 1 ? 'text-green-400' : 'text-red-400'}`}>
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
                  <span className={`text-3xl font-bold ${(metrics?.winRate ?? 0) >= 50 ? 'text-green-400' : 'text-red-400'}`}>
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
                  <span className={`text-3xl font-bold ${(metrics?.totalPnL ?? 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
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
                  <span className="text-3xl font-bold text-white">
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
                  <span className={`text-3xl font-bold ${(metrics?.expectancy ?? 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
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
                  <span className="text-3xl font-bold text-white">
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
          <div className="mb-8">
            <div className="group relative">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl blur opacity-25 group-hover:opacity-40 transition duration-300"></div>
              <div className="relative bg-purple-900/90 backdrop-blur-xl rounded-2xl border border-purple-800/50 p-6 shadow-2xl">
                <h3 className="text-xl font-semibold text-white mb-6">Equity Curve</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={equityCurve ?? []}>
                      <defs>
                        <linearGradient id="colorEquityGreen" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorEquityRed" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
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
                        stroke={(equityCurve?.[equityCurve.length - 1]?.equity ?? 0) >= 0 ? '#10b981' : '#ef4444'}
                        strokeWidth={2}
                        fillOpacity={1}
                        fill={(equityCurve?.[equityCurve.length - 1]?.equity ?? 0) >= 0 ? 'url(#colorEquityGreen)' : 'url(#colorEquityRed)'}
                        animationDuration={1000}
                        dot={{ fill: (equityCurve?.[equityCurve.length - 1]?.equity ?? 0) >= 0 ? '#10b981' : '#ef4444', strokeWidth: 2, r: 4 }}
                        activeDot={{ r: 6 }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>

          {/* PnL Calendar */}
          <div className="mb-8">
            <div className="group relative">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl blur opacity-25 group-hover:opacity-40 transition duration-300"></div>
              <div className="relative bg-purple-900/90 backdrop-blur-xl rounded-2xl border border-purple-800/50 p-6 shadow-2xl">
                <div className="flex items-center justify-between mb-6">
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
                    <h3 className="text-xl font-semibold text-white">
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
                  <div className="flex gap-2">
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
