"use client";

import React, { useMemo } from "react";
import { useMarketPrices } from "@/hooks/useMarketPrices";

const ASSETS = [
  "XAUUSD",
  "BTCUSD",
  "ETHUSD",
  "EURUSD",
  "GBPUSD",
  "USDJPY",
  "AUDUSD",
  "USDCAD",
  "USDCHF",
  "WTIUSD",
  "XAGUSD",
  "VIX",
  "DXY",
  "US10Y",
];

interface MarketPrice {
  price: number;
  change: number;
  changePercent: number;
}

export function CapitalFlowGraph({ className = "" }: { className?: string }) {
  const { data: marketData, isLoading } = useMarketPrices();

  const rows = useMemo(() => {
    const prices = (marketData?.prices || {}) as Record<string, MarketPrice>;

    const withData = ASSETS.map((symbol) => {
      const p = prices[symbol];
      return {
        symbol,
        changePercent: p?.changePercent ?? 0,
      };
    });

    return withData.sort(
      (a, b) => Math.abs(b.changePercent) - Math.abs(a.changePercent)
    );
  }, [marketData]);

  const maxAbs = useMemo(() => {
    if (rows.length === 0) return 0;
    return Math.max(...rows.map((r) => Math.abs(r.changePercent)));
  }, [rows]);

  const lastUpdate = useMemo(() => {
    const ts = marketData?.fetchedAt;
    if (!ts) return "";
    const date = new Date(ts);
    return date.toLocaleTimeString(undefined, {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  }, [marketData]);

  const isEmpty = !marketData?.prices || isLoading;

  return (
    <div
      className={`bg-purple-950/50 backdrop-blur-xl rounded-2xl border border-purple-900/50 p-4 ${className}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <div className="text-xs font-semibold text-purple-300/80 tracking-wider uppercase">
            Capital Flow
          </div>
          <div className="text-[11px] text-purple-200/70 leading-tight">
            Largest movers by absolute change
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-purple-300/60">
            Last Update {lastUpdate ? `· ${lastUpdate}` : ""}
          </span>
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
          </span>
          <span className="text-[10px] font-bold text-emerald-300/80">Live</span>
        </div>
      </div>

      {/* Loading */}
      {isEmpty ? (
        <div className="flex flex-col items-center justify-center h-64 text-purple-300/50">
          <div className="w-6 h-6 border-2 border-purple-500/30 border-t-purple-400 rounded-full animate-spin mb-3" />
          <span className="text-xs">Loading market data…</span>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {rows.map((row) => {
            const isPositive = row.changePercent >= 0;
            const barWidth =
              maxAbs > 0 ? (Math.abs(row.changePercent) / maxAbs) * 100 : 0;

            return (
              <div
                key={row.symbol}
                className="flex items-center gap-3 py-1.5"
              >
                {/* Symbol */}
                <div className="w-16 text-[11px] font-bold text-purple-100/90 tracking-wide shrink-0">
                  {row.symbol}
                </div>

                {/* Centered bar */}
                <div className="flex-1 relative h-2.5 bg-purple-900/40 rounded-full overflow-hidden">
                  <div
                    className="absolute top-0 bottom-0 rounded-full transition-all duration-500"
                    style={{
                      width: `${barWidth}%`,
                      left: isPositive ? "50%" : `${50 - barWidth}%`,
                      backgroundColor: isPositive
                        ? "rgba(52, 211, 153, 0.85)"
                        : "rgba(244, 63, 94, 0.85)",
                    }}
                  />
                  {/* Zero marker */}
                  <div className="absolute top-0 bottom-0 left-1/2 w-px bg-purple-500/20 -translate-x-1/2" />
                </div>

                {/* Change % */}
                <div
                  className={`w-12 text-right text-[11px] font-bold shrink-0 ${
                    isPositive ? "text-emerald-300" : "text-rose-300"
                  }`}
                >
                  {row.changePercent >= 0 ? "+" : ""}
                  {row.changePercent.toFixed(2)}%
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
