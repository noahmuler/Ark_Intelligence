"use client";

import React, { useEffect, useState } from "react";
import { MainLayout } from "@/components/dashboard/MainLayout";
import { useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { BookOpen, ArrowRight, TrendingUp, TrendingDown, DollarSign, Target } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface TradingMetrics {
  winRate: number;
  profitFactor: number;
  maxDrawdown: number;
  expectancy: number;
  totalPnL: number;
  totalTrades: number;
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

  // Fetch data from Convex
  const connection = useQuery(api.mt5.getMT5Connection, { userId: "user-1" });
  const metrics = useQuery(api.mt5Queries.getTradingMetrics, { userId: "user-1" });
  const trades = useQuery(api.mt5Queries.getRecentTrades, { userId: "user-1" });
  const equityCurve = useQuery(api.mt5Queries.getEquityCurve, { userId: "user-1" });

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
          <div className="mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">Trading Journal</h1>
            <p className="text-purple-300 text-sm sm:text-base">
              Real-time trading analytics and performance metrics
            </p>
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {/* Win Rate */}
            <div className="group relative">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-green-600 to-emerald-600 rounded-2xl blur opacity-25 group-hover:opacity-40 transition duration-300"></div>
              <div className="relative bg-purple-900/90 backdrop-blur-xl rounded-2xl border border-purple-800/50 p-6 shadow-2xl">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500">
                    <Target className="h-5 w-5 text-white" />
                  </div>
                  <span className={`text-2xl font-bold ${(metrics?.winRate ?? 0) >= 50 ? 'text-green-400' : 'text-red-400'}`}>
                    {(metrics?.winRate ?? 0).toFixed(1)}%
                  </span>
                </div>
                <p className="text-purple-300 text-sm font-medium">Win Rate</p>
                <p className="text-purple-400 text-xs mt-1">{metrics?.totalTrades ?? 0} total trades</p>
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
                  <span className={`text-2xl font-bold ${(metrics?.profitFactor ?? 0) >= 1 ? 'text-green-400' : 'text-red-400'}`}>
                    {(metrics?.profitFactor ?? 0).toFixed(2)}
                  </span>
                </div>
                <p className="text-purple-300 text-sm font-medium">Profit Factor</p>
                <p className="text-purple-400 text-xs mt-1">Gross Win / Gross Loss</p>
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
                  <span className={`text-2xl font-bold ${(metrics?.totalPnL ?? 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    ${(metrics?.totalPnL ?? 0).toFixed(2)}
                  </span>
                </div>
                <p className="text-purple-300 text-sm font-medium">Total PnL</p>
                <p className="text-purple-400 text-xs mt-1">Cumulative profit/loss</p>
              </div>
            </div>

            {/* Max Drawdown */}
            <div className="group relative">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-red-600 to-orange-600 rounded-2xl blur opacity-25 group-hover:opacity-40 transition duration-300"></div>
              <div className="relative bg-purple-900/90 backdrop-blur-xl rounded-2xl border border-purple-800/50 p-6 shadow-2xl">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-r from-red-500 to-orange-500">
                    <TrendingDown className="h-5 w-5 text-white" />
                  </div>
                  <span className="text-2xl font-bold text-red-400">
                    {metrics?.maxDrawdown?.toFixed(1) ?? 0}%
                  </span>
                </div>
                <p className="text-purple-300 text-sm font-medium">Max Drawdown</p>
                <p className="text-purple-400 text-xs mt-1">Peak to trough decline</p>
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
                    <LineChart data={equityCurve ?? []}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#7c3aed" opacity={0.3} />
                      <XAxis
                        dataKey="timestamp"
                        stroke="#a78bfa"
                        tickFormatter={(value) => new Date(value).toLocaleDateString()}
                      />
                      <YAxis stroke="#a78bfa" />
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
                      <Line
                        type="monotone"
                        dataKey="equity"
                        stroke="#8b5cf6"
                        strokeWidth={2}
                        dot={{ fill: '#8b5cf6', strokeWidth: 2, r: 4 }}
                        activeDot={{ r: 6 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
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
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
