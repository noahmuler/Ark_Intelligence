"use client";

import React from "react";

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

  const getGaugeRotation = (score: number) => {
    // Map score (0-100) to rotation (-90 to 90 degrees)
    return (score / 100) * 180 - 90;
  };

  return (
    <div className={`bg-purple-900 rounded-lg border border-purple-800 p-3 sm:p-4 ${className}`}>
      <h2 className="text-base sm:text-lg font-semibold text-white mb-4">Edge Factor</h2>
      
      {/* Radial Gauge */}
      <div className="relative w-28 h-28 sm:w-32 sm:h-32 mx-auto mb-4">
        {/* Background circle */}
        <div className="absolute inset-0 rounded-full border-8 border-purple-800"></div>
        
        {/* Progress arc */}
        <div className="absolute inset-0 rounded-full">
          <svg className="w-full h-full transform -rotate-90">
            <circle
              cx="56"
              cy="56"
              r="48"
              stroke="currentColor"
              strokeWidth="8"
              fill="none"
              className="text-purple-800"
            />
            <circle
              cx="56"
              cy="56"
              r="48"
              stroke="currentColor"
              strokeWidth="8"
              fill="none"
              strokeDasharray={`${(overallScore / 100) * 301.59} 301.59`}
              className={getScoreColor(overallScore).replace('text-', 'text-')}
              strokeLinecap="round"
            />
          </svg>
        </div>
        
        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className={`text-xl sm:text-2xl font-bold font-mono ${getScoreColor(overallScore)}`}>
            {overallScore}%
          </div>
          <div className="text-xs text-purple-400">Confidence</div>
        </div>
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
