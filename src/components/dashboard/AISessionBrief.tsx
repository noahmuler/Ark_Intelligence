"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";

interface SessionBrief {
  mainDriver: string;
  bias: "Bullish" | "Bearish" | "Neutral";
  analysis: string;
  keyLevels: {
    support: string[];
    resistance: string[];
  };
  timestamp: string; // Use string instead of Date to avoid hydration issues
}

/**
 * Transform Convex data to SessionBrief format
 */
function transformConvexToSessionBrief(prices: any[], briefs: any[]): SessionBrief {
  // Calculate overall market bias from price changes
  const totalChange = prices.reduce((sum, p) => sum + (p.change24h || 0), 0);
  const avgChange = prices.length > 0 ? totalChange / prices.length : 0;
  
  const bias = avgChange > 0.5 ? "Bullish" : avgChange < -0.5 ? "Bearish" : "Neutral";

  // Find main driver (asset with largest absolute change)
  const mainDriverAsset = prices.reduce((max, p) => 
    Math.abs(p.change24h || 0) > Math.abs(max.change24h || 0) ? p : max, prices[0]
  );
  
  const mainDriver = `${mainDriverAsset?.symbol || "Market"} leading ${Math.abs(mainDriverAsset?.change24h || 0).toFixed(2)}%`;

  // Calculate support and resistance from prices
  const support = prices.slice(0, 3).map(p => `$${(p.price * 0.98).toFixed(2)}`);
  const resistance = prices.slice(0, 3).map(p => `$${(p.price * 1.02).toFixed(2)}`);

  // Get AI brief from Convex if available
  const briefText = briefs.find(b => b.symbol === mainDriverAsset?.symbol)?.brief || 
                    "Market data sourced live from Convex backend with real-time price feeds.";

  return {
    mainDriver,
    bias,
    analysis: briefText,
    keyLevels: {
      support: support.slice(0, 3),
      resistance: resistance.slice(0, 3)
    },
    timestamp: new Date().toISOString()
  };
}

/**
 * Fetch real session brief from Convex
 */
async function fetchRealSessionBrief(): Promise<SessionBrief> {
  // This function is no longer needed as we use Convex useQuery
  return getFallbackSessionBrief();
}

/**
 * Fallback session brief for when API fails
 */
function getFallbackSessionBrief(): SessionBrief {
  return {
    mainDriver: "Market Analysis Unavailable",
    bias: "Neutral",
    analysis: "Unable to generate real-time analysis. Using fallback data.",
    keyLevels: {
      support: ["Support 1", "Support 2", "Support 3"],
      resistance: ["Resistance 1", "Resistance 2", "Resistance 3"]
    },
    timestamp: "2024-01-01T00:00:00.000Z"
  };
}

export const AISessionBrief = React.memo(function AISessionBrief({ className = "" }: { className?: string }) {
  // Fetch real data from Convex
  const prices = useQuery(api.actions.getAllPrices) ?? [];
  const briefs = useQuery(api.actions.getAllAssetBriefs) ?? [];

  // Transform Convex data to session brief format
  const sessionBrief = React.useMemo(() => {
    if (prices.length === 0) {
      return getFallbackSessionBrief();
    }
    return transformConvexToSessionBrief(prices, briefs);
  }, [prices, briefs]);

  const [isGenerating, setIsGenerating] = useState(false);

  // Simulate loading state for UX
  useEffect(() => {
    if (prices.length > 0) {
      setIsGenerating(false);
    } else {
      setIsGenerating(true);
      const timer = setTimeout(() => setIsGenerating(false), 1000);
      return () => clearTimeout(timer);
    }
  }, [prices.length]);

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

  const handleRefresh = useCallback(() => {
    // Convex useQuery automatically refreshes, just show loading state
    setIsGenerating(true);
    setTimeout(() => setIsGenerating(false), 500);
  }, []);

  // Memoize the timestamp display to prevent unnecessary recalculations
  const displayTime = useMemo(() => {
    return new Date(sessionBrief.timestamp).toLocaleTimeString();
  }, [sessionBrief.timestamp]);

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

      <div className="space-y-2">
        {/* Main Driver */}
        <div className="flex items-baseline gap-2">
          <span className="text-xs text-purple-300/70 tracking-tight">Driver:</span>
          <span className="text-xs font-medium text-white/90 tracking-tight">
            {sessionBrief.mainDriver}
          </span>
        </div>

        {/* Bias */}
        <div className="flex items-baseline gap-2">
          <span className="text-xs text-purple-300/70 tracking-tight">Bias:</span>
          <div className={`flex items-center gap-1 ${getBiasColor(sessionBrief.bias)}`}>
            <div className={`w-1 h-1 rounded-full ${sessionBrief.bias === 'Bullish' ? 'bg-emerald-400/60' : sessionBrief.bias === 'Bearish' ? 'bg-rose-400/60' : 'bg-purple-400/60'}`} />
            <span className="text-xs font-medium tracking-tight">
              {sessionBrief.bias}
            </span>
          </div>
        </div>

        {/* Analysis - 3-sentence constraint with line-clamp */}
        <div>
          <span className="text-xs text-purple-300/70 tracking-tight">Analysis:</span>
          <p className="text-xs text-white/80 tracking-tight leading-snug mt-1 line-clamp-3">
            {sessionBrief.analysis}
          </p>
        </div>

        {/* Key Levels */}
        <div className="flex items-baseline gap-2 pt-1 border-t border-white/5">
          <span className="text-xs text-purple-300/70 tracking-tight">Levels:</span>
          <div className="flex gap-3">
            <div className="flex items-center gap-1">
              <span className="text-xs text-emerald-400/70 tracking-tight">S:</span>
              <span className="text-xs text-emerald-300/80 font-mono tracking-tight">
                {Array.isArray(sessionBrief.keyLevels.support) && sessionBrief.keyLevels.support.length > 0 ? sessionBrief.keyLevels.support[0] : "—"}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-xs text-rose-400/70 tracking-tight">R:</span>
              <span className="text-xs text-rose-300/80 font-mono tracking-tight">
                {Array.isArray(sessionBrief.keyLevels.resistance) && sessionBrief.keyLevels.resistance.length > 0 ? sessionBrief.keyLevels.resistance[0] : "—"}
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-1.5 pt-1">
          <button
            className="flex-1 px-2 py-1 bg-purple-500/10 text-purple-300/70 text-xs rounded hover:bg-purple-500/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed tracking-tight"
            onClick={handleRefresh}
            disabled={isGenerating}
          >
            Refresh
          </button>
          <button className="flex-1 px-2 py-1 bg-purple-800/30 text-purple-300/70 text-xs rounded hover:bg-purple-700/40 transition-colors tracking-tight">
            Export
          </button>
        </div>
      </div>
    </div>
  );
});
