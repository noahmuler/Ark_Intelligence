"use client";

import React, { useState } from "react";
import { MainLayout } from "@/components/dashboard/MainLayout";
import { RefreshCw, TrendingUp, TrendingDown, Minus, AlertTriangle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { useQuery } from "@tanstack/react-query";

import { getReportAnalysis, getAssetImpacts } from "@/lib/reportAnalysis";

export interface ReportData {
  id: string;
  name: string;
  category: string;
  impact: string;
  releaseDate: string | null;
  actual: number | null;
  previous: number | null;
  isReleased: boolean;
  nextRelease: string | null;
  unit: string;
  direction: 'beat' | 'miss' | 'inline' | null;
}

interface ReportsResponse {
  released: ReportData[];
  upcoming: ReportData[];
  fetchedAt: number;
  source?: string;
  warnings?: string[];
  error?: string;
  details?: string;
  help?: string;
}

export default function Reports() {
  const [activeTab, setActiveTab] = useState<'released' | 'upcoming' | 'all'>('released');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const { data, isLoading, isError, error, refetch } = useQuery<ReportsResponse>({
    queryKey: ['reports'],
    queryFn: async () => {
      const res = await fetch('/api/reports');
      const json = await res.json();
      if (!res.ok) {
        const parts = [json.error, json.details, json.help].filter(Boolean);
        throw new Error(parts.join(' | ') || `Failed to fetch reports: ${res.status}`);
      }
      return json as ReportsResponse;
    },
    refetchInterval: 300_000,
    staleTime: 60_000,
  });

  const categories = ['all', 'Inflation', 'Employment', 'Growth', 'Fed', 'Consumer', 'Production', 'Housing', 'Sentiment'];

  const getFilteredReports = () => {
    if (!data) return { released: [], upcoming: [] };
    
    const filterByCategory = (reports: ReportData[]) => {
      if (selectedCategory === 'all') return reports;
      return reports.filter(r => r.category === selectedCategory);
    };

    return {
      released: filterByCategory(data.released),
      upcoming: filterByCategory(data.upcoming),
    };
  };

  const { released, upcoming } = getFilteredReports();

  const getImpactBadge = (impact: string) => {
    const upper = impact.toUpperCase();
    if (upper === 'HIGH') return 'bg-red-500/20 text-red-300 border-red-500/30';
    if (upper === 'MEDIUM') return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
    return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
  };

  const getDirectionBadge = (direction: string | null) => {
    if (!direction) return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
    if (direction === 'beat') return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
    if (direction === 'miss') return 'bg-rose-500/20 text-rose-300 border-rose-500/30';
    return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '—';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const formatValue = (value: number | null, unit: string) => {
    if (value === null) return '—';
    return `${value}${unit}`;
  };

  const getDisplayReports = () => {
    if (activeTab === 'released') return released;
    if (activeTab === 'upcoming') return upcoming;
    return [...released, ...upcoming];
  };

  return (
    <MainLayout>
      <div className="p-6 h-full">
        <div className="max-w-7xl mx-auto">
          {/* Page Header */}
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Economic Reports</h1>
              <div className="flex items-center gap-2">
                <p className="text-purple-300">US economic calendar with FRED data</p>
                {data?.source && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-800/50 border border-purple-700/40 text-purple-300">
                    Source: {data.source}
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={() => refetch()}
              className="flex items-center gap-2 px-4 py-2 bg-purple-800/30 border border-purple-700/50 rounded-lg hover:bg-purple-800/50 transition-colors"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              <span className="text-sm">Refresh</span>
            </button>
          </div>

          {/* API Error with diagnostics */}
          {isError && (
            <div className="mb-4 p-4 bg-red-500/10 border border-red-500/30 rounded-lg flex items-start gap-3 text-red-400">
              <AlertTriangle className="h-5 w-5 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="font-semibold mb-2">Failed to load reports</p>
                <p className="text-sm mb-2">{error instanceof Error ? error.message : 'Failed to load reports'}</p>
                <p className="text-xs text-red-300/70">
                  Diagnose: <a href="/api/reports/test" target="_blank" className="underline hover:text-red-200">/api/reports/test</a>
                </p>
              </div>
            </div>
          )}

          {/* Tabs */}
          <div className="mb-6 flex items-center gap-2">
            {(['released', 'upcoming', 'all'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-lg border transition-colors ${
                  activeTab === tab
                    ? 'bg-purple-600/30 border-purple-500/60 text-white'
                    : 'bg-purple-900/30 border-purple-800/40 text-purple-400 hover:bg-purple-800/40'
                }`}
              >
                {tab === 'released' && 'Released ✓'}
                {tab === 'upcoming' && 'Upcoming 📅'}
                {tab === 'all' && 'All'}
              </button>
            ))}
          </div>

          {/* Category Filter */}
          <div className="mb-6 flex items-center gap-2 flex-wrap">
            <span className="text-sm text-purple-400 mr-2">Filter by category:</span>
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-3 py-1 text-sm rounded border transition-colors ${
                  selectedCategory === category
                    ? 'bg-purple-600/30 border-purple-500/60 text-white'
                    : 'bg-purple-900/30 border-purple-800/40 text-purple-400 hover:bg-purple-800/40'
                }`}
              >
                {category === 'all' ? 'All Categories' : category}
              </button>
            ))}
          </div>

          {/* Loading State */}
          {isLoading && (
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-32 bg-purple-900/30 border border-purple-800/20 rounded-lg animate-pulse" />
              ))}
            </div>
          )}

          {/* Reports Grid */}
          {!isLoading && (
            <div className="space-y-4">
              <AnimatePresence mode="popLayout">
                {getDisplayReports().map((report, index) => (
                  <motion.div
                    key={report.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    className="backdrop-blur-md bg-purple-950/40 border border-purple-700/30 rounded-lg p-4 hover:border-purple-600/50 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <span className={`px-2 py-1 text-xs font-semibold rounded border ${getImpactBadge(report.impact)}`}>
                          {report.impact.toUpperCase()}
                        </span>
                        <h3 className="text-lg font-semibold text-white">{report.name}</h3>
                        <span className="text-sm text-purple-400">{report.category}</span>
                      </div>
                      {report.isReleased && report.direction && (
                        <span className={`px-2 py-1 text-xs font-semibold rounded border ${getDirectionBadge(report.direction)}`}>
                          {report.direction.toUpperCase()}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-6 mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-purple-400">Date:</span>
                        <span className="text-sm text-white font-medium">
                          {report.isReleased ? formatDate(report.releaseDate) : formatDate(report.nextRelease || '')}
                        </span>
                      </div>
                      {report.isReleased ? (
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-purple-400">Actual:</span>
                          <span className="text-xl font-bold text-white">{formatValue(report.actual, report.unit)}</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-purple-400">Actual:</span>
                          <span className="text-xl font-bold text-purple-500 animate-pulse">—</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-purple-400">Previous:</span>
                        <span className="text-sm text-white">{formatValue(report.previous, report.unit)}</span>
                      </div>
                    </div>

                    {report.isReleased && report.actual !== null && report.previous !== null && (
                      <div className="h-16">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={[
                            { name: 'Previous', value: report.previous },
                            { name: 'Actual', value: report.actual }
                          ]}>
                            <XAxis dataKey="name" hide />
                            <YAxis hide domain={['auto', 'auto']} />
                            <Tooltip 
                              contentStyle={{ backgroundColor: 'var(--tooltip-bg)', border: '1px solid var(--tooltip-border)', borderRadius: '8px' }}
                              itemStyle={{ color: 'var(--tooltip-fg)' }}
                            />
                            <Line 
                              type="monotone" 
                              dataKey="value" 
                              stroke={report.actual > report.previous ? '#10b981' : '#f43f5e'}
                              strokeWidth={2}
                              dot={{ fill: report.actual > report.previous ? '#10b981' : '#f43f5e', r: 4 }}
                              isAnimationActive={true}
                              animationDuration={800}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    )}

                    {report.isReleased && report.direction && (
                      <div className="mt-3 flex items-center gap-2">
                        {report.direction === 'beat' && <TrendingUp className="h-4 w-4 text-emerald-400" />}
                        {report.direction === 'miss' && <TrendingDown className="h-4 w-4 text-rose-400" />}
                        {report.direction === 'inline' && <Minus className="h-4 w-4 text-gray-400" />}
                        <span className="text-sm text-purple-300">
                          {report.direction === 'beat' && 'Beat previous'}
                          {report.direction === 'miss' && 'Missed previous'}
                          {report.direction === 'inline' && 'In line with previous'}
                        </span>
                      </div>
                    )}

                    {/* 3-Sentence Analysis */}
                    {report.isReleased && (
                      <div className="mt-4 pt-3 border-t border-purple-800/30">
                        <p className="text-sm text-purple-200 leading-relaxed">
                          {getReportAnalysis(report)}
                        </p>
                      </div>
                    )}

                    {/* Asset Impact */}
                    {report.isReleased && (
                      <div className="mt-3 pt-3 border-t border-purple-800/30">
                        <div className="flex items-center gap-1 flex-wrap">
                          <span className="text-xs text-purple-400 mr-2">Asset Impact:</span>
                          {Object.entries(getAssetImpacts(report)).map(([asset, impact]) => (
                            <span
                              key={asset}
                              className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded border ${
                                impact === 'bullish'
                                  ? 'bg-green-500/10 border-green-500/30 text-green-400'
                                  : impact === 'bearish'
                                  ? 'bg-red-500/10 border-red-500/30 text-red-400'
                                  : 'bg-gray-500/10 border-gray-500/30 text-gray-400'
                              }`}
                            >
                              {impact === 'bullish' && <TrendingUp className="h-3 w-3" />}
                              {impact === 'bearish' && <TrendingDown className="h-3 w-3" />}
                              {impact === 'neutral' && <Minus className="h-3 w-3" />}
                              {asset}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}

          {!isLoading && getDisplayReports().length === 0 && (
            <div className="text-center py-12 text-purple-400">
              No reports found for the selected filters.
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
