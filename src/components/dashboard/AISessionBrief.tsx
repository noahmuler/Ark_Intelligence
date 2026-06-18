"use client";

import React, { useCallback, useMemo } from "react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { useQuery as useTanstackQuery } from "@tanstack/react-query";
import { useMarketPrices } from "@/hooks/useMarketPrices";

interface SessionBrief {
  mainDriver: string;
  bias: "Bullish" | "Bearish" | "Neutral";
  analysis: string;
  keyLevels: {
    support: string[];
    resistance: string[];
  };
  timestamp: string;
}

type ApiSessionBrief = Omit<SessionBrief, "bias"> & {
  bias: string;
};

function normalizeBias(value: string): SessionBrief["bias"] {
  const normalized = value.toLowerCase();
  if (normalized === "bullish") return "Bullish";
  if (normalized === "bearish") return "Bearish";
  return "Neutral";
}

export const AISessionBrief = React.memo(function AISessionBrief({ className = "" }: { className?: string }) {
  const { data: marketData } = useMarketPrices();

  const { data: sessionBrief, isLoading, isError, refetch, isFetching } = useTanstackQuery({
    queryKey: ["session-brief", marketData?.fetchedAt ? Math.floor(marketData.fetchedAt / 900_000) : 0],
    queryFn: async (): Promise<SessionBrief> => {
      const res = await fetch("/api/ai/session-brief", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionTime: "london", assets: ["XAUUSD", "DXY", "US10Y"] }),
      });

      if (!res.ok) throw new Error("Failed to generate brief");
      const json = await res.json();
      if (!json.success || !json.data) throw new Error(json.error || "Failed to generate brief");

      const data = json.data as ApiSessionBrief;
      return {
        ...data,
        bias: normalizeBias(data.bias),
        keyLevels: {
          support: Array.isArray(data.keyLevels?.support) ? data.keyLevels.support : [],
          resistance: Array.isArray(data.keyLevels?.resistance) ? data.keyLevels.resistance : [],
        },
        timestamp: data.timestamp ?? new Date().toISOString(),
      };
    },
    staleTime: 15 * 60 * 1000,
    retry: 1,
    enabled: !!marketData,
  });

  const getBiasColor = useCallback((bias: string) => {
    switch (bias) {
      case "Bullish": return "text-emerald-400";
      case "Bearish": return "text-rose-400";
      default: return "text-amber-400";
    }
  }, []);

  const getBiasIcon = useCallback((bias: string) => {
    switch (bias) {
      case "Bullish": return <TrendingUp className="h-4 w-4" />;
      case "Bearish": return <TrendingDown className="h-4 w-4" />;
      default: return <Minus className="h-4 w-4" />;
    }
  }, []);

  const displayTime = useMemo(() => {
    if (!sessionBrief?.timestamp) return "--:--";
    return new Date(sessionBrief.timestamp).toLocaleTimeString();
  }, [sessionBrief?.timestamp]);

  const isGenerating = isLoading || isFetching;

  return (
    <div className={`bg-purple-950/20 rounded-lg border border-white/10 p-2.5 backdrop-blur-[12px] ${className}`}>
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-xs font-semibold text-white/90 tracking-wider uppercase">AI Brief</h2>
        <div className="flex items-center gap-1.5">
          {isGenerating && (
            <div className="w-1 h-1 rounded-full bg-purple-400/60 animate-pulse" />
          )}
          <span className="text-xs text-purple-300/50 tracking-tight" suppressHydrationWarning>
            {displayTime}
          </span>
        </div>
      </div>

      {isError ? (
        <div className="rounded border border-amber-500/20 bg-amber-500/10 p-2 text-xs text-amber-200">
          Brief unavailable - market data loading or OpenAI is not configured.
        </div>
      ) : !sessionBrief ? (
        <div className="space-y-2">
          <div className="h-3 w-2/3 rounded bg-purple-900/40 animate-pulse" />
          <div className="h-3 w-1/2 rounded bg-purple-900/40 animate-pulse" />
          <div className="h-10 rounded bg-purple-900/40 animate-pulse" />
        </div>
      ) : (
        <div className="space-y-2">
          <div className="flex items-baseline gap-2">
            <span className="text-xs text-purple-300/70 tracking-tight">Driver:</span>
            <span className="text-xs font-medium text-white/90 tracking-tight">
              {sessionBrief.mainDriver}
            </span>
          </div>

          <div className="flex items-baseline gap-2">
            <span className="text-xs text-purple-300/70 tracking-tight">Bias:</span>
            <div className={`flex items-center gap-1 ${getBiasColor(sessionBrief.bias)}`}>
              {getBiasIcon(sessionBrief.bias)}
              <span className="text-xs font-medium tracking-tight">
                {sessionBrief.bias}
              </span>
            </div>
          </div>

          <div>
            <span className="text-xs text-purple-300/70 tracking-tight">Analysis:</span>
            <p className="text-xs text-white/80 tracking-tight leading-snug mt-1 line-clamp-3">
              {sessionBrief.analysis}
            </p>
          </div>

          <div className="flex items-baseline gap-2 pt-1 border-t border-white/5">
            <span className="text-xs text-purple-300/70 tracking-tight">Levels:</span>
            <div className="flex gap-3">
              <div className="flex items-center gap-1">
                <span className="text-xs text-emerald-400/70 tracking-tight">S:</span>
                <span className="text-xs text-emerald-300/80 font-mono tracking-tight">
                  {sessionBrief.keyLevels.support[0] ?? "-"}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-xs text-rose-400/70 tracking-tight">R:</span>
                <span className="text-xs text-rose-300/80 font-mono tracking-tight">
                  {sessionBrief.keyLevels.resistance[0] ?? "-"}
                </span>
              </div>
            </div>
          </div>

          <div className="flex gap-1.5 pt-1">
            <button
              className="flex-1 px-2 py-1 bg-purple-500/10 text-purple-300/70 text-xs rounded hover:bg-purple-500/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed tracking-tight"
              onClick={() => refetch()}
              disabled={isGenerating}
            >
              Refresh
            </button>
            <button className="flex-1 px-2 py-1 bg-purple-800/30 text-purple-300/70 text-xs rounded hover:bg-purple-700/40 transition-colors tracking-tight">
              Export
            </button>
          </div>
        </div>
      )}
    </div>
  );
});
