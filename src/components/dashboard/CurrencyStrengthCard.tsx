"use client";

import React, { useEffect, useMemo, useState, useRef } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Card, CardContent } from "@/components/ui/card";


import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";

type StrengthSeries = {
  label: string;
  color: string;
  value: number; // current strength score
};

function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n));
}

// Generate premium pre-seeded history for authentic chart display instantly
function generateSeedHistory(baseValue: number, length: number = 30): number[] {
  const arr: number[] = [];
  let val = baseValue - (Math.random() - 0.5) * 15;
  for (let i = 0; i < length; i++) {
    val = clamp(val + (Math.random() - 0.5) * 4, -40, 40);
    arr.push(val);
  }
  // Make the last item exactly match current value
  arr[arr.length - 1] = baseValue;
  return arr;
}

const DEFAULT_STRENGTH: StrengthSeries[] = [
  { label: "EUR", color: "#10b981", value: 12.5 },
  { label: "GBP", color: "#3b82f6", value: 8.3 },
  { label: "JPY", color: "#f59e0b", value: -5.2 },
  { label: "USD", color: "#a855f7", value: -10.4 },
];

// Convex query and data preparation moved inside component

interface TooltipPayloadItem {
  name: string;
  value: number;
  color: string;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayloadItem[];
}

// Custom glassmorphic tooltip component
const CustomTooltip = ({ active, payload }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-xl border border-purple-900/60 bg-purple-950/90 p-3 backdrop-blur-xl shadow-lg shadow-purple-500/10">
        <div className="text-[10px] font-bold text-purple-300/50 uppercase tracking-wider mb-2">Relational Strength</div>
        <div className="space-y-1.5">
          {payload.map((p) => {
            const val = typeof p.value === "number" ? p.value : 0;
            return (
              <div key={p.name} className="flex items-center gap-4 justify-between">
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: p.color }} />
                  <span className="text-xs font-bold text-white font-mono">{p.name}</span>
                </div>
                <span className="text-xs font-mono font-black" style={{ color: p.color }}>
                  {val >= 0 ? "+" : ""}{val.toFixed(2)}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  }
  return null;
};

const CurrencyStrengthCard = React.memo(function CurrencyStrengthCard({ className = "" }: { className?: string }) {
  const [isMounted, setIsMounted] = useState(false);
  const [dataUpdated, setDataUpdated] = useState(false);
  
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Convex query and data preparation
  const rawHistory = useQuery(api.currencyStrength.getHistory) ?? null;
  const history = rawHistory ?? {
    EUR: generateSeedHistory(DEFAULT_STRENGTH.find(s => s.label === "EUR")?.value ?? 0),
    GBP: generateSeedHistory(DEFAULT_STRENGTH.find(s => s.label === "GBP")?.value ?? 0),
    JPY: generateSeedHistory(DEFAULT_STRENGTH.find(s => s.label === "JPY")?.value ?? 0),
    USD: generateSeedHistory(DEFAULT_STRENGTH.find(s => s.label === "USD")?.value ?? 0),
  };

  // Trigger animation when data updates
  useEffect(() => {
    if (rawHistory) {
      setDataUpdated(true);
      const timer = setTimeout(() => setDataUpdated(false), 1000);
      return () => clearTimeout(timer);
    }
  }, [rawHistory]);

  // Derive current strength values from the latest history point
  const strength: StrengthSeries[] = [
    { label: "EUR", color: "#10b981", value: history.EUR?.[history.EUR.length - 1] ?? 0 },
    { label: "GBP", color: "#3b82f6", value: history.GBP?.[history.GBP.length - 1] ?? 0 },
    { label: "JPY", color: "#f59e0b", value: history.JPY?.[history.JPY.length - 1] ?? 0 },
    { label: "USD", color: "#a855f7", value: history.USD?.[history.USD.length - 1] ?? 0 },
  ];

  // Format Recharts friendly data points
  const chartData = useMemo(() => {
    const pointsCount = Math.max(
      history.EUR?.length ?? 0,
      history.GBP?.length ?? 0,
      history.JPY?.length ?? 0,
      history.USD?.length ?? 0
    );

    return Array.from({ length: pointsCount }, (_, idx) => ({
      name: idx.toString(),
      EUR: history.EUR?.[idx] ?? 0,
      GBP: history.GBP?.[idx] ?? 0,
      JPY: history.JPY?.[idx] ?? 0,
      USD: history.USD?.[idx] ?? 0,
    }));
  }, [history]);

  return (
    <Card className={`overflow-hidden min-h-[300px] rounded-xl border border-white/10 bg-purple-950/30 backdrop-blur-[12px] hover:border-purple-500/40 hover:shadow-lg hover:shadow-purple-500/10 transition-all duration-300 ease-in-out ${dataUpdated ? 'animate-pulse border-purple-400/50' : ''} ${className}`}>
      <CardContent className="p-4 flex flex-col h-full justify-between">
        {/* Header Block */}
        <div className="flex items-center justify-between mb-4 border-b border-purple-900/30 pb-3">
          <div>
            <div className="text-xs font-bold text-purple-300/70 tracking-widest uppercase">
              Ark Currency Index
            </div>
            <div className="text-lg font-extrabold text-white tracking-wide mt-0.5">
              Currency Strength
            </div>
          </div>
          <div className="flex items-center gap-1.5 bg-purple-900/30 px-2 py-0.5 rounded-full border border-purple-500/10">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[10px] font-bold text-purple-300/80 tracking-wider uppercase">Relational Graph</span>
          </div>
        </div>

        {/* Chart Area */}
        <div className="relative flex-1 min-h-[190px] w-full rounded-xl bg-purple-950/20 border border-white/5 p-2 flex items-center justify-center">
          {!isMounted ? (
            <div className="w-full h-[200px] bg-purple-900/30 animate-pulse rounded-xl"></div>
          ) : (
            <div className="w-full h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 5, right: 10, left: -25, bottom: 0 }}>
                  <defs>
                    {/* Glowing Filters */}
                    <filter id="glow-effect" x="-20%" y="-20%" width="140%" height="140%">
                      <feGaussianBlur stdDeviation="2.5" result="blur" />
                      <feMerge>
                        <feMergeNode in="blur" />
                        <feMergeNode in="SourceGraphic" />
                      </feMerge>
                    </filter>
                  </defs>
                  
                  <CartesianGrid
                    strokeDasharray="4 4"
                    stroke="rgba(147, 51, 234, 0.08)"
                    vertical={false}
                  />
                  
                  <XAxis 
                    dataKey="name" 
                    hide 
                  />
                  
                  <YAxis
                    domain={["auto", "auto"]}
                    tick={{ fill: "rgba(216, 180, 254, 0.4)", fontSize: 9, fontFamily: "monospace" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  
                  <Tooltip content={<CustomTooltip />} />
                  
                  <Legend 
                    verticalAlign="bottom"
                    height={30}
                    iconType="circle"
                    iconSize={8}
                    content={({ payload }) => {
                      if (!payload) return null;
                      return (
                        <div className="flex gap-4 items-center justify-center mt-3 flex-wrap">
                          {payload.map((entry) => {
                            const cur = strength.find((s) => s.label === entry.value);
                            const val = cur ? cur.value : 0;
                            return (
                              <div key={entry.value} className="flex items-center gap-1.5">
                                <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: entry.color }} />
                                <span className="text-[10px] font-extrabold text-white font-mono tracking-wide">{entry.value}</span>
                                <span className="text-[10px] font-mono font-bold" style={{ color: entry.color }}>
                                  {val >= 0 ? "+" : ""}{val.toFixed(1)}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      );
                    }}
                  />

                  {strength.map((s) => (
                    <Line
                      key={s.label}
                      type="monotone"
                      dataKey={s.label}
                      name={s.label}
                      stroke={s.color}
                      strokeWidth={2}
                      dot={false}
                      activeDot={{ r: 4, stroke: s.color, strokeWidth: 1, fill: "#fff" }}
                      filter="url(#glow-effect)"
                      animationDuration={300}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
});

export default CurrencyStrengthCard;
