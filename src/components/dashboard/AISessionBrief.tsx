"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { generateMarketOverview } from "@/services/geminiMarketAnalysis";
import { fetchComprehensiveMarketData } from "@/services/dataServiceManager";

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
 * Transform AI analysis to SessionBrief format
 */
function transformAIToSessionBrief(aiAnalysis: any, marketData: any): SessionBrief {
  // Validate aiAnalysis and marketData shapes
  const isValidAI = aiAnalysis && aiAnalysis.analysis;
  const isValidMarket = marketData && Array.isArray(marketData.stocks);

  const bias = isValidAI && aiAnalysis.analysis.marketOutlook === "Positive" ? "Bullish" :
               isValidAI && aiAnalysis.analysis.marketOutlook === "Negative" ? "Bearish" : "Neutral";

  // Extract key levels from market data (simplified)
  const getTopStocks = () => {
    if (!isValidMarket || !Array.isArray(marketData.stocks)) {
      return [];
    }
    return marketData.stocks.slice(0, 3);
  };

  const topStocks = getTopStocks();
  const support = topStocks.map((stock: any) => `$${(stock.price * 0.98).toFixed(2)}`);
  const resistance = topStocks.map((stock: any) => `$${(stock.price * 1.02).toFixed(2)}`);

  return {
    mainDriver: (isValidAI && Array.isArray(aiAnalysis.analysis.keyInsights) && aiAnalysis.analysis.keyInsights[0]?.title) || "Market Analysis",
    bias,
    analysis: (isValidAI && aiAnalysis.analysis.summary) || "Market analysis in progress...",
    keyLevels: {
      support: support.slice(0, 3),
      resistance: resistance.slice(0, 3)
    },
    timestamp: "2024-01-01T00:00:00.000Z"
  };
}

/**
 * Fetch real AI session brief
 */
async function fetchRealSessionBrief(): Promise<SessionBrief> {
  try {
    const [aiAnalysis, marketData] = await Promise.all([
      generateMarketOverview(),
      fetchComprehensiveMarketData()
    ]);
    
    return transformAIToSessionBrief(aiAnalysis, marketData.data);
  } catch (error) {
    console.error('Error fetching session brief:', error);
    return getFallbackSessionBrief();
  }
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
  const [sessionBrief, setSessionBrief] = useState<SessionBrief>(getFallbackSessionBrief());
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    
    // Initial AI brief fetch
    const fetchInitialBrief = async () => {
      try {
        setIsGenerating(true);
        const realBrief = await fetchRealSessionBrief();
        setSessionBrief(realBrief);
      } catch (error) {
        console.error('Initial AI brief fetch failed:', error);
        // Keep fallback data if initial fetch fails
      } finally {
        setIsGenerating(false);
      }
    };

    fetchInitialBrief();
    
    // Set up interval for real-time AI brief updates
    const interval = setInterval(async () => {
      try {
        setIsGenerating(true);
        const realBrief = await fetchRealSessionBrief();
        setSessionBrief(realBrief);
      } catch (error) {
        console.error('Periodic AI brief fetch failed:', error);
        // Keep current data if periodic fetch fails
      } finally {
        setIsGenerating(false);
      }
    }, 300000); // Update every 5 minutes for AI analysis

    return () => clearInterval(interval);
  }, []);

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
    setIsGenerating(true);
    fetchRealSessionBrief().then(realBrief => {
      setSessionBrief(realBrief);
      setIsGenerating(false);
    }).catch(error => {
      console.error('Manual refresh failed:', error);
      setIsGenerating(false);
    });
  }, []);

  // Memoize the timestamp display to prevent unnecessary recalculations
  const displayTime = useMemo(() => {
    return new Date(sessionBrief.timestamp).toLocaleTimeString();
  }, [sessionBrief.timestamp]);

  return (
    <div className={`bg-purple-900/30 rounded-lg border border-purple-900/40 p-2.5 backdrop-blur-md ${className}`}>
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-xs font-semibold text-white tracking-tight">AI Brief</h2>
        <div className="flex items-center gap-1.5">
          {isGenerating && (
            <div className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
          )}
          <span className="text-xs text-purple-300/60 tracking-tight" suppressHydrationWarning>
            {displayTime}
          </span>
        </div>
      </div>

      <div className="space-y-2">
        {/* Main Driver */}
        <div className="flex items-baseline gap-2">
          <span className="text-xs text-purple-400/80 tracking-tight">Driver:</span>
          <span className="text-xs font-medium text-white tracking-tight">
            {sessionBrief.mainDriver}
          </span>
        </div>

        {/* Bias */}
        <div className="flex items-baseline gap-2">
          <span className="text-xs text-purple-400/80 tracking-tight">Bias:</span>
          <div className={`flex items-center gap-1 ${getBiasColor(sessionBrief.bias)}`}>
            <div className={`w-1 h-1 rounded-full ${sessionBrief.bias === 'Bullish' ? 'bg-emerald-400' : sessionBrief.bias === 'Bearish' ? 'bg-rose-400' : 'bg-purple-400'}`} />
            <span className="text-xs font-medium tracking-tight">
              {sessionBrief.bias}
            </span>
          </div>
        </div>

        {/* Analysis */}
        <div className="flex items-baseline gap-2">
          <span className="text-xs text-purple-400/80 tracking-tight">Analysis:</span>
          <span className="text-xs text-white/90 tracking-tight leading-snug">
            {sessionBrief.analysis}
          </span>
        </div>

        {/* Key Levels */}
        <div className="flex items-baseline gap-2 pt-1 border-t border-white/5">
          <span className="text-xs text-purple-400/80 tracking-tight">Levels:</span>
          <div className="flex gap-3">
            <div className="flex items-center gap-1">
              <span className="text-xs text-emerald-400/80 tracking-tight">S:</span>
              <span className="text-xs text-emerald-300 font-mono tracking-tight">
                {Array.isArray(sessionBrief.keyLevels.support) && sessionBrief.keyLevels.support.length > 0 ? sessionBrief.keyLevels.support[0] : "—"}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-xs text-rose-400/80 tracking-tight">R:</span>
              <span className="text-xs text-rose-300 font-mono tracking-tight">
                {Array.isArray(sessionBrief.keyLevels.resistance) && sessionBrief.keyLevels.resistance.length > 0 ? sessionBrief.keyLevels.resistance[0] : "—"}
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-1.5 pt-1">
          <button
            className="flex-1 px-2 py-1 bg-purple-500/15 text-purple-300/80 text-xs rounded hover:bg-purple-500/25 transition-colors disabled:opacity-50 disabled:cursor-not-allowed tracking-tight"
            onClick={handleRefresh}
            disabled={isGenerating}
          >
            Refresh
          </button>
          <button className="flex-1 px-2 py-1 bg-purple-800/50 text-purple-300/80 text-xs rounded hover:bg-purple-700/60 transition-colors tracking-tight">
            Export
          </button>
        </div>
      </div>
    </div>
  );
});
