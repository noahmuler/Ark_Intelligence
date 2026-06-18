"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { useMarketPrices } from "@/hooks/useMarketPrices";


import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell } from "recharts";

type StrengthSeries = {
  label: string;
  color: string;
  value: number; // current strength score
};

function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n));
}

type MarketPrice = {
  changePercent?: number;
};

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
  const { data: marketData } = useMarketPrices();

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    setIsMounted(true);
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  // Trigger animation when data updates
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (marketData?.fetchedAt) {
      setDataUpdated(true);
      const timer = setTimeout(() => setDataUpdated(false), 1000);
      return () => clearTimeout(timer);
    }
  }, [marketData?.fetchedAt]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const strength: StrengthSeries[] = useMemo(() => {
    const prices = (marketData?.prices || {}) as Record<string, MarketPrice>;
    return [
      { label: "EUR", color: "#10b981", value: +(prices.EURUSD?.changePercent ?? 0).toFixed(2) },
      { label: "GBP", color: "#3b82f6", value: +(prices.GBPUSD?.changePercent ?? 0).toFixed(2) },
      { label: "JPY", color: "#f59e0b", value: +(-(prices.USDJPY?.changePercent ?? 0)).toFixed(2) },
      { label: "USD", color: "#a855f7", value: +(prices.DXY?.changePercent ?? 0).toFixed(2) },
    ];
  }, [marketData]);

  const chartData = strength.map((item) => ({
    ...item,
    absValue: Math.abs(item.value),
  }));

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
            <span className="text-[10px] font-bold text-purple-300/80 tracking-wider uppercase">Live FX</span>
          </div>
        </div>

        {/* Chart Area */}
        <div className="relative flex-1 min-h-[190px] w-full rounded-xl bg-purple-950/20 border border-white/5 p-2 flex items-center justify-center">
          {!isMounted ? (
            <div className="w-full h-[200px] bg-purple-900/30 animate-pulse rounded-xl"></div>
          ) : (
            <div className="w-full h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} layout="vertical" margin={{ top: 10, right: 12, left: 0, bottom: 4 }}>
                  <CartesianGrid
                    strokeDasharray="4 4"
                    stroke="rgba(147, 51, 234, 0.08)"
                    horizontal={false}
                  />
                  <XAxis
                    type="number"
                    tick={{ fill: "rgba(216, 180, 254, 0.45)", fontSize: 9, fontFamily: "monospace" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    dataKey="label"
                    type="category"
                    width={36}
                    tick={{ fill: "rgba(255, 255, 255, 0.75)", fontSize: 11, fontFamily: "monospace", fontWeight: 700 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="value" radius={[4, 4, 4, 4]} animationDuration={300}>
                    {chartData.map((entry) => (
                      <Cell key={entry.label} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
});

export default CurrencyStrengthCard;
