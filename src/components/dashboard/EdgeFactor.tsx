"use client";

import React from "react";
import { Gauge } from "@/components/ui/gauge";

interface EdgeFactorProps {
  overallScore: number;
  macroScore: number;
  technicalScore: number;
  sentimentScore: number;
  className?: string;
}

export function EdgeFactor({ 
  overallScore, 
  macroScore, 
  technicalScore, 
  sentimentScore,
  className = "" 
}: EdgeFactorProps) {
  const getScoreColor = (score: number) => {
    if (score >= 75) return "text-emerald-400";
    if (score >= 50) return "text-amber-400";
    return "text-rose-400";
  };

  const getScoreBackground = (score: number) => {
    if (score >= 75) return "bg-emerald-500";
    if (score >= 50) return "bg-amber-400";
    return "bg-rose-500";
  };

  return (
    <div className={`bg-purple-900 rounded-lg border border-purple-800 p-3 sm:p-4 ${className}`}>
      <h2 className="text-base sm:text-lg font-semibold text-white mb-4">Edge Factor</h2>
      
      {/* Radial Gauge */}
      <div className="flex justify-center mb-4">
        <Gauge
          value={overallScore}
          size={128}
          strokeWidth={8}
          showValue={true}
          showPercentage={true}
          label="Confidence"
        />
      </div>

      {/* Breakdown */}
      <div className="space-y-3">
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-purple-400">Macro (33%)</span>
            <span className={`font-mono ${getScoreColor(macroScore)}`}>{macroScore}%</span>
          </div>
          <div className="w-full bg-purple-800 rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all duration-500 ${getScoreBackground(macroScore)}`}
              style={{ width: `${macroScore}%` }}
            ></div>
          </div>
        </div>
        
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-purple-400">Technical (33%)</span>
            <span className={`font-mono ${getScoreColor(technicalScore)}`}>{technicalScore}%</span>
          </div>
          <div className="w-full bg-purple-800 rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all duration-500 ${getScoreBackground(technicalScore)}`}
              style={{ width: `${technicalScore}%` }}
            ></div>
          </div>
        </div>
        
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-purple-400">Sentiment (33%)</span>
            <span className={`font-mono ${getScoreColor(sentimentScore)}`}>{sentimentScore}%</span>
          </div>
          <div className="w-full bg-purple-800 rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all duration-500 ${getScoreBackground(sentimentScore)}`}
              style={{ width: `${sentimentScore}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Signal Strength Indicator */}
      <div className="mt-4 pt-3 border-t border-purple-800">
        <div className="flex items-center justify-center space-x-1">
          {[1, 2, 3, 4, 5].map((bar) => (
            <div
              key={bar}
              className={`w-1 rounded-full transition-all duration-300 ${
                bar <= Math.ceil(overallScore / 20)
                  ? getScoreBackground(overallScore)
                  : 'bg-purple-800'
              }`}
              style={{ height: `${bar * 4}px` }}
            ></div>
          ))}
        </div>
        <div className="text-center mt-2">
          <span className={`text-xs font-medium ${
            overallScore >= 75 ? 'text-emerald-400' :
            overallScore >= 50 ? 'text-amber-400' :
            'text-rose-400'
          }`}>
            {overallScore >= 75 ? 'STRONG SIGNAL' :
             overallScore >= 50 ? 'MODERATE SIGNAL' :
             'WEAK SIGNAL'}
          </span>
        </div>
      </div>
    </div>
  );
}
