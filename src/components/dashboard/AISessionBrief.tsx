"use client";

import React, { useState, useEffect } from "react";
import { Brain, TrendingUp, TrendingDown, Minus } from "lucide-react";
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
const transformAIToSessionBrief = (aiAnalysis: any, marketData: any): SessionBrief => {
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
    timestamp: new Date().toISOString()
  };
};

/**
 * Fetch real AI session brief
 */
const fetchRealSessionBrief = async (): Promise<SessionBrief> => {
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
};

/**
 * Fallback session brief for when API fails
 */
const getFallbackSessionBrief = (): SessionBrief => ({
  mainDriver: "Market Analysis Unavailable",
  bias: "Neutral",
  analysis: "Unable to generate real-time analysis. Using fallback data.",
  keyLevels: {
    support: ["Support 1", "Support 2", "Support 3"],
    resistance: ["Resistance 1", "Resistance 2", "Resistance 3"]
  },
  timestamp: new Date().toISOString()
});

export function AISessionBrief({ className = "" }: { className?: string }) {
  const [sessionBrief, setSessionBrief] = useState<SessionBrief>(getFallbackSessionBrief());
  const [isGenerating, setIsGenerating] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    
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
  }, [mounted]);

  const getBiasColor = (bias: string) => {
    switch (bias) {
      case "Bullish": return "text-emerald-400";
      case "Bearish": return "text-rose-400";
      default: return "text-amber-400";
    }
  };

  const getBiasIcon = (bias: string) => {
    switch (bias) {
      case "Bullish": return <TrendingUp className="h-4 w-4" />;
      case "Bearish": return <TrendingDown className="h-4 w-4" />;
      default: return <Minus className="h-4 w-4" />;
    }
  };

  return (
    <div className={`bg-purple-900 rounded-lg border border-purple-800 p-3 sm:p-4 ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-base sm:text-lg font-semibold text-white flex items-center">
          <Brain className="h-5 w-5 mr-2 text-purple-400" />
          AI Session Brief
        </h2>
        <div className="flex items-center space-x-2">
          {isGenerating && (
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
              <span className="text-xs text-purple-400">Generating...</span>
            </div>
          )}
          <span className="text-xs text-purple-400">
            {mounted ? new Date(sessionBrief.timestamp).toLocaleTimeString() : ""}
          </span>
        </div>
      </div>

      <div className="space-y-3">
        {/* Main Driver */}
        <div>
          <div className="text-xs text-purple-400 mb-1">Main Driver</div>
          <div className="text-sm font-medium text-purple-200">
            {sessionBrief.mainDriver}
          </div>
        </div>

        {/* Bias */}
        <div>
          <div className="text-xs text-purple-400 mb-1">Market Bias</div>
          <div className={`flex items-center space-x-2 ${getBiasColor(sessionBrief.bias)}`}>
            {getBiasIcon(sessionBrief.bias)}
            <span className="text-sm font-medium">
              {sessionBrief.bias} on Metals
            </span>
          </div>
        </div>

        {/* Analysis */}
        <div>
          <div className="text-xs text-purple-400 mb-1">AI Analysis</div>
          <div className="text-xs text-purple-200 leading-relaxed">
            {sessionBrief.analysis}
          </div>
        </div>

        {/* Key Levels */}
        <div className="grid grid-cols-2 gap-3 pt-2 border-t border-purple-800">
          <div>
            <div className="text-xs text-purple-400 mb-2">Support</div>
            <div className="space-y-1">
              {sessionBrief.keyLevels.support.map((level, index) => (
                <div key={index} className="text-xs text-emerald-400 font-mono">
                  {level}
                </div>
              ))}
            </div>
          </div>
          <div>
            <div className="text-xs text-purple-400 mb-2">Resistance</div>
            <div className="space-y-1">
              {sessionBrief.keyLevels.resistance.map((level, index) => (
                <div key={index} className="text-xs text-rose-400 font-mono">
                  {level}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-2 pt-2">
          <button 
            className="flex-1 px-3 py-1 bg-purple-500/20 text-purple-300 text-xs rounded hover:bg-purple-500/30 transition-colors"
            onClick={() => setIsGenerating(true)}
          >
            Refresh Brief
          </button>
          <button className="flex-1 px-3 py-1 bg-purple-800 text-purple-300 text-xs rounded hover:bg-purple-700 transition-colors">
            Export PDF
          </button>
        </div>
      </div>
    </div>
  );
}
