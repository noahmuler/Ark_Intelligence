"use client";

import React, { useState, useEffect } from "react";
import { Brain, TrendingUp, TrendingDown, Minus } from "lucide-react";

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

const mockSessionBrief: SessionBrief = {
  mainDriver: "Yield-Driven USD Strength",
  bias: "Neutral",
  analysis: "US 10Y yields climbing to 4.32% are supporting USD strength. Gold and Silver showing resilience but facing headwinds from higher rates. Watch for DXY breakout above 105.50 for confirmation.",
  keyLevels: {
    support: ["$2,320.00", "$2,305.50", "$2,290.00"],
    resistance: ["$2,355.00", "$2,370.00", "$2,385.00"]
  },
  timestamp: new Date().toISOString() // Convert to string for consistent SSR
};

export function AISessionBrief({ className = "" }: { className?: string }) {
  const [sessionBrief, setSessionBrief] = useState<SessionBrief>(mockSessionBrief);
  const [isGenerating, setIsGenerating] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    
    // Simulate periodic AI brief updates
    const interval = setInterval(() => {
      setIsGenerating(true);
      setTimeout(() => {
        setSessionBrief(prev => ({
          ...prev,
          timestamp: new Date().toISOString(),
          analysis: prev.analysis + " [Updated]"
        }));
        setIsGenerating(false);
      }, 2000);
    }, 60000); // Update every minute

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
