"use client";

import React, { useMemo } from "react";
import { TrendingUp, TrendingDown, Eye } from "lucide-react";

type Sentiment = "Bullish" | "Bearish" | "Neutral";

type AssetCard = {
  symbol: string;
  name: string;
  priceText: string;
  deltaPercentText: string;
  sentiment: "Bullish" | "Bearish";
  confidence: number;
  aiOneSentence: string;
};

const ASSETS: AssetCard[] = [
  {
    symbol: "XAU",
    name: "Gold / US Dollar",
    priceText: "$4530.32",
    deltaPercentText: "+15.23%",
    sentiment: "Bullish",
    confidence: 78,
    aiOneSentence:
      "Gold looks bullish because improving risk sentiment and supportive fundamentals are aligning with current momentum.",
  },
  {
    symbol: "BTC",
    name: "Bitcoin / US Dollar",
    priceText: "$87845.32",
    deltaPercentText: "+12.45%",
    sentiment: "Bullish",
    confidence: 88,
    aiOneSentence:
      "Bitcoin is bullish as strong demand signals are reinforcing upside continuation in the current trend.",
  },
  {
    symbol: "OIL",
    name: "Crude Oil",
    priceText: "$82.35",
    deltaPercentText: "+2.85%",
    sentiment: "Bullish",
    confidence: 68,
    aiOneSentence:
      "Oil is confident bullish as supply expectations keep the downside limited while price holds above key levels.",
  },
  {
    symbol: "DXY",
    name: "US Dollar Index",
    priceText: "105.82",
    deltaPercentText: "+3.67%",
    sentiment: "Bullish",
    confidence: 85,
    aiOneSentence:
      "DXY remains bullish because relative strength is still supported by macro data and yield expectations.",
  },
  {
    symbol: "NQ",
    name: "Nasdaq 100",
    priceText: "105.82",
    deltaPercentText: "+3.67%",
    sentiment: "Bullish",
    confidence: 85,
    aiOneSentence:
      "DXY remains bullish because relative strength is still supported by macro data and yield expectations.",
  },
  {
    symbol: "SPY",
    name: "S&P 500",
    priceText: "105.82",
    deltaPercentText: "+3.67%",
    sentiment: "Bullish",
    confidence: 85,
    aiOneSentence:
      "DXY remains bullish because relative strength is still supported by macro data and yield expectations.",
  },
];

function sentimentColor(sentiment: Sentiment) {
  if (sentiment === "Bullish") return { fg: "text-emerald-300", bar: "bg-emerald-500" };
  if (sentiment === "Bearish") return { fg: "text-rose-300", bar: "bg-rose-500" };
  return { fg: "text-amber-300", bar: "bg-amber-500" };
}

function SentimentIcon({ sentiment }: { sentiment: "Bullish" | "Bearish" }) {
  if (sentiment === "Bullish") return <TrendingUp className="h-4 w-4 text-emerald-300" />;
  return <TrendingDown className="h-4 w-4 text-rose-300" />;
}

const clamp = (n: number, min: number, max: number) => {
  return Math.max(min, Math.min(max, n));
};

export const DashboardMacroDesk = React.memo(function DashboardMacroDesk() {
  const pairs = useMemo(() => ASSETS, []);

  return (
    <div className="bg-purple-950/30 backdrop-blur-[12px] rounded-xl border border-white/10 p-3 min-h-[340px] hover:border-purple-500/40 hover:shadow-lg hover:shadow-purple-500/10 transition-all duration-300 ease-in-out">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="text-xs font-semibold text-white/90 tracking-wider uppercase">Macro Desk</div>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-1 h-1 rounded-full bg-purple-400/60" />
          <span className="text-xs text-purple-300/60 tracking-tight">4 pairs</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {pairs.map((p) => {
          const c = sentimentColor(p.sentiment);
          return (
            <div
              key={p.symbol}
              className="bg-purple-900/20 border border-white/5 rounded-lg p-3 hover:bg-purple-900/30 hover:border-purple-500/30 transition-all duration-300 ease-in-out"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-sm font-medium text-white/90 truncate">
                    {p.name}
                  </div>
                  <div className="text-sm text-purple-300/80 font-mono mt-1">
                    {p.symbol} {p.priceText}
                  </div>
                </div>

                <div className="text-right">
                  <div className="flex items-center justify-end gap-1 text-sm">
                    <SentimentIcon sentiment={p.sentiment} />
                    <span className="font-mono text-white/90">{p.deltaPercentText}</span>
                  </div>
                  <div className={`mt-1 text-xs font-semibold ${c.fg}`}>{p.sentiment}</div>
                </div>
              </div>

              <div className="mt-3 flex items-center justify-between">
                <div className="text-xs text-purple-300/70 font-medium">Confidence</div>
                <div className={`text-xs font-mono ${c.fg}`}>{clamp(p.confidence, 0, 100)}%</div>
              </div>

              <div className="mt-2 bg-purple-950/40 rounded-full h-1.5 overflow-hidden">
                <div
                  className={`h-full ${c.bar}`}
                  style={{ width: `${clamp(p.confidence, 0, 100)}%` }}
                />
              </div>

              <div className="mt-3">
                <div className="text-xs font-semibold text-purple-200/80 mb-1">AI Analysis</div>
                <p className="text-sm text-white/80 leading-snug line-clamp-3">
                  {p.aiOneSentence}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
});
