"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { useMarketPrices } from "@/hooks/useMarketPrices";
import { TrendingUp, TrendingDown, Minus, AlertCircle } from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell } from "recharts";

type StrengthSeries = {
  label: string;
  color: string;
  value: number;
};

function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n));
}

const CURRENCY_CONFIG: Record<string, { label: string; color: string; pair: string; invert: boolean }> = {
  EUR: { label: "EUR", color: "#10b981", pair: "EURUSD", invert: false },
  GBP: { label: "GBP", color: "#3b82f6", pair: "GBPUSD", invert: false },
  JPY: { label: "JPY", color: "#f59e0b", pair: "USDJPY", invert: true },
  AUD: { label: "AUD", color: "#ef4444", pair: "AUDUSD", invert: false },
  CAD: { label: "CAD", color: "#8b5cf6", pair: "USDCAD", invert: true },
  CHF: { label: "CHF", color: "#06b6d4", pair: "USDCHF", invert: true },
  NZD: { label: "NZD", color: "#f97316", pair: "NZDUSD", invert: false },
};

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
}

const CustomTooltip = ({ active, payload }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-xl border border-purple-900/60 bg-purple-950/90 p-3 backdrop-blur-xl shadow-lg shadow-purple-500/10">
        <div className="text-[10px] font-bold text-purple-300/50 uppercase tracking-wider mb-2">Currency Strength</div>
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
                  {val >= 0 ? "+" : ""}{val.toFixed(2)}%
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
  const { data: marketData } = useMarketPrices();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const strength: StrengthSeries[] = useMemo(() => {
    const prices = (marketData?.prices || {}) as Record<string, any>;
    const result: StrengthSeries[] = [];

    // Build from real forex pairs
    for (const [key, config] of Object.entries(CURRENCY_CONFIG)) {
      const priceData = prices[config.pair];
      if (priceData && typeof priceData.changePercent === "number") {
        let value = priceData.changePercent;
        if (config.invert) value = -value;
        result.push({
          label: config.label,
          color: config.color,
          value: +value.toFixed(2),
        });
      }
    }

    // Fallback: derive from DXY if forex pairs are missing
    if (result.length < 3 && prices.DXY) {
      const dxyChange = prices.DXY.changePercent ?? 0;
      // If DXY is up, USD is strong, all others are weak
      if (result.length === 0) {
        return [
          { label: "EUR", color: "#10b981", value: +(-dxyChange * 0.8).toFixed(2) },
          { label: "GBP", color: "#3b82f6", value: +(-dxyChange * 0.7).toFixed(2) },
          { label: "JPY", color: "#f59e0b", value: +(dxyChange * 0.5).toFixed(2) },
          { label: "AUD", color: "#ef4444", value: +(-dxyChange * 0.9).toFixed(2) },
          { label: "CAD", color: "#8b5cf6", value: +(-dxyChange * 0.6).toFixed(2) },
          { label: "CHF", color: "#06b6d4", value: +(-dxyChange * 0.4).toFixed(2) },
          { label: "NZD", color: "#f97316", value: +(-dxyChange * 0.85).toFixed(2) },
        ];
      }
    }

    return result;
  }, [marketData]);

  const chartData = strength.map((item) => ({
    ...item,
    absValue: Math.abs(item.value),
  }));

  const hasData = strength.length > 0;
  const strongest = hasData ? strength.reduce((a, b) => a.value > b.value ? a : b) : null;
  const weakest = hasData ? strength.reduce((a, b) => a.value < b.value ? a : b) : null;

  return (
    <Card className={`overflow-hidden min-h-[300px] rounded-xl border border-white/10 bg-purple-950/30 backdrop-blur-[12px] hover:border-purple-500/40 hover:shadow-lg hover:shadow-purple-500/10 transition-all duration-300 ease-in-out ${className}`}>
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

        {/* Strongest / Weakest summary */}
        {hasData && (
          <div className="flex gap-2 mb-3">
            {strongest && (
              <div className="flex-1 bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-2 py-1.5">
                <div className="text-[10px] text-emerald-400/70 uppercase tracking-wider">Strongest</div>
                <div className="flex items-center gap-1">
                  <TrendingUp className="h-3 w-3 text-emerald-400" />
                  <span className="text-sm font-bold text-emerald-400">{strongest.label}</span>
                  <span className="text-xs text-emerald-300/80">+{strongest.value.toFixed(2)}%</span>
                </div>
              </div>
            )}
            {weakest && (
              <div className="flex-1 bg-red-500/10 border border-red-500/20 rounded-lg px-2 py-1.5">
                <div className="text-[10px] text-red-400/70 uppercase tracking-wider">Weakest</div>
                <div className="flex items-center gap-1">
                  <TrendingDown className="h-3 w-3 text-red-400" />
                  <span className="text-sm font-bold text-red-400">{weakest.label}</span>
                  <span className="text-xs text-red-300/80">{weakest.value.toFixed(2)}%</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Chart Area */}
        <div className="relative flex-1 min-h-[190px] w-full rounded-xl bg-purple-950/20 border border-white/5 p-2 flex items-center justify-center">
          {!isMounted ? (
            <div className="w-full h-[200px] bg-purple-900/30 animate-pulse rounded-xl"></div>
          ) : !hasData ? (
            <div className="flex flex-col items-center gap-2 text-purple-400/60">
              <AlertCircle className="h-8 w-8" />
              <span className="text-sm">Waiting for FX data...</span>
            </div>
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
                    domain={[-5, 5]}
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
                      <Cell key={entry.label} fill={entry.value >= 0 ? entry.color : "#ef4444"} />
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
