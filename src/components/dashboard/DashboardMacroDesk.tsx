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
    priceText: "$2748.32",
    deltaPercentText: "+15.23%",
    sentiment: "Bullish",
    confidence: 78,
    aiOneSentence:
      "Gold looks bullish because improving risk sentiment and supportive fundamentals are aligning with current momentum.",
  },
  {
    symbol: "BTC",
    name: "Bitcoin / US Dollar",
    priceText: "$67845.32",
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

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export function DashboardMacroDesk() {
  const pairs = useMemo(() => ASSETS, []);

  return (
    <div className="bg-purple-950/90 backdrop-blur-xl rounded-2xl border border-purple-900/50 p-5 shadow-xl">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <div className="h-10 w-10 rounded-xl bg-purple-900/80 border border-purple-800/70 flex items-center justify-center">
            <span className="text-purple-200 font-bold">M</span>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-purple-100">Macro Desk</h3>
            <p className="text-sm text-purple-300">4-key pairs snapshot</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {pairs.map((p) => {
          const c = sentimentColor(p.sentiment);
          return (
            <div
              key={p.symbol}
              className="bg-purple-900/50 border border-purple-800/50 rounded-xl p-4"
            >
              {/* Row 1: Asset name + price left, icon + delta + Bullish/Bearish right */}
              <div className="flex items-start justify-between gap-3">

                <div className="min-w-0">
                  <div className="text-sm font-medium text-purple-100 truncate">
                    {p.name}
                  </div>
                  <div className="text-sm text-purple-300 font-mono mt-1">
                    {p.symbol} {p.priceText}
                  </div>
                </div>

                <div className="text-right">
                  <div className="flex items-center justify-end gap-1 text-sm">
                    <SentimentIcon sentiment={p.sentiment} />
                    <span className="font-mono text-purple-100">{p.deltaPercentText}</span>
                  </div>
                  <div className={`mt-1 text-xs font-semibold ${c.fg}`}>{p.sentiment}</div>
                </div>
              </div>

              {/* Row 2: Confidence label left, percent right */}
              <div className="mt-4 flex items-center justify-between">
                <div className="text-xs text-purple-300 font-medium">Confidence</div>
                <div className={`text-xs font-mono ${c.fg}`}>{clamp(p.confidence, 0, 100)}%</div>
              </div>

              {/* Row 4: Progress bar */}
              <div className="mt-2 bg-purple-950/60 rounded-full h-2 overflow-hidden">
                <div
                  className={`h-full ${c.bar}`}
                  style={{ width: `${clamp(p.confidence, 0, 100)}%` }}
                />
              </div>

              {/* Row 5: AI analysis one sentence */}
              <div className="mt-4">
                <div className="text-xs font-semibold text-purple-200 mb-1">AI Analysis</div>
                <div className="text-sm text-purple-200 leading-relaxed">
                  {p.aiOneSentence}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}


