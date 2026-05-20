"use client";

import React, { useMemo } from "react";
import { TrendingUp, TrendingDown } from "lucide-react";

type Sentiment = "Bullish" | "Bearish" | "Neutral";

type AssetCard = {
  symbol: string;
  name: string;
  priceText: string;
  deltaPercentText: string;
  sentiment: "Bullish" | "Bearish" | "Neutral";
  confidence: number;
  aiOneSentence: string;
};

const ASSETS: AssetCard[] = [
  {
    symbol: "XAU",
    name: "Gold / US Dollar",
    priceText: "$2,748.32",
    deltaPercentText: "+0.85%",
    sentiment: "Bullish",
    confidence: 78,
    aiOneSentence:
      "Gold displays strong bullish breakout momentum, supported by solid defensive demand and robust central bank accumulation.",
  },
  {
    symbol: "BTC",
    name: "Bitcoin / US Dollar",
    priceText: "$67,845.00",
    deltaPercentText: "+1.25%",
    sentiment: "Bullish",
    confidence: 88,
    aiOneSentence:
      "Bitcoin is technically highly constructive, exhibiting aggressive spot demand and sustained institutional inflows into capital products.",
  },
  {
    symbol: "OIL",
    name: "Crude Oil",
    priceText: "$82.35",
    deltaPercentText: "-0.35%",
    sentiment: "Bearish",
    confidence: 62,
    aiOneSentence:
      "Crude oil sentiment leans slightly bearish as swelling inventories and mixed demand projections weigh heavily on prompt pricing.",
  },
  {
    symbol: "DXY",
    name: "US Dollar Index",
    priceText: "105.82",
    deltaPercentText: "+0.42%",
    sentiment: "Bullish",
    confidence: 85,
    aiOneSentence:
      "The US Dollar Index remains bid on relative macroeconomic outperformance and yield premiums, indicating broad capital retention.",
  },
  {
    symbol: "NQ",
    name: "Nasdaq 100 Futures",
    priceText: "18,450.50",
    deltaPercentText: "+1.12%",
    sentiment: "Bullish",
    confidence: 80,
    aiOneSentence:
      "Nasdaq 100 futures exhibit a bullish tone as growth sectors attract strong dip-buying during quarterly balance sheet adjustments.",
  },
  {
    symbol: "ES",
    name: "S&P 500 Futures",
    priceText: "5,240.75",
    deltaPercentText: "+0.85%",
    sentiment: "Bullish",
    confidence: 75,
    aiOneSentence:
      "S&P 500 futures sustain a solid upward trend structure, holding above major dynamic supports with broad-based market breadth.",
  },
];

function sentimentColor(sentiment: Sentiment) {
  if (sentiment === "Bullish") return { fg: "text-emerald-400", bar: "bg-emerald-500" };
  if (sentiment === "Bearish") return { fg: "text-rose-400", bar: "bg-rose-500" };
  return { fg: "text-amber-400", bar: "bg-amber-500" };
}

function SentimentIcon({ sentiment }: { sentiment: Sentiment }) {
  if (sentiment === "Bullish") return <TrendingUp className="h-4.5 w-4.5 text-emerald-400" />;
  if (sentiment === "Bearish") return <TrendingDown className="h-4.5 w-4.5 text-rose-400" />;
  return <TrendingUp className="h-4.5 w-4.5 text-amber-400 rotate-90" />; // Neutral fallback
}

const clamp = (n: number, min: number, max: number) => {
  return Math.max(min, Math.min(max, n));
};

export const DashboardMacroDesk = React.memo(function DashboardMacroDesk() {
  const pairs = useMemo(() => ASSETS, []);

  return (
    <div className="bg-purple-950/30 backdrop-blur-[12px] rounded-xl border border-white/10 p-4 min-h-[340px] hover:border-purple-500/40 hover:shadow-lg hover:shadow-purple-500/10 transition-all duration-300 ease-in-out">
      <div className="flex items-center justify-between mb-4 border-b border-purple-900/30 pb-3">
        <div>
          <div className="text-xs font-bold text-purple-300/70 tracking-widest uppercase">Ark Intelligence Desk</div>
          <div className="text-lg font-extrabold text-white tracking-wide mt-0.5">Macro Desk</div>
        </div>
        <div className="flex items-center gap-1.5 bg-purple-900/30 px-2 py-0.5 rounded-full border border-purple-500/10">
          <div className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
          <span className="text-[10px] font-bold text-purple-300/80 tracking-wider uppercase">6 assets</span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-2 gap-3">
        {pairs.map((p) => {
          const c = sentimentColor(p.sentiment);
          const up = p.deltaPercentText.startsWith("+");
          return (
            <div
              key={p.symbol}
              className="bg-purple-900/20 border border-white/5 rounded-xl p-3 hover:bg-purple-900/30 hover:border-purple-500/30 hover:shadow-md hover:shadow-purple-500/5 transition-all duration-300 ease-in-out flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-purple-300/60 uppercase truncate">
                      {p.name}
                    </div>
                    <div className="text-base font-extrabold text-white font-mono tracking-tight mt-1.5">
                      {p.symbol} {p.priceText}
                    </div>
                  </div>

                  <div className="text-right flex flex-col items-end shrink-0">
                    <div className="flex items-center gap-1">
                      <SentimentIcon sentiment={p.sentiment} />
                      <span className={`font-mono text-xs font-black ${up ? "text-emerald-400" : "text-rose-400"}`}>
                        {p.deltaPercentText}
                      </span>
                    </div>
                    <div className={`mt-1 text-[10px] font-black uppercase tracking-wider ${c.fg}`}>{p.sentiment}</div>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between">
                  <div className="text-[10px] text-purple-300/50 font-bold uppercase tracking-wider">Confidence</div>
                  <div className={`text-xs font-mono font-black ${c.fg}`}>{clamp(p.confidence, 0, 100)}%</div>
                </div>

                <div className="mt-1.5 bg-purple-950/40 rounded-full h-1.5 overflow-hidden border border-purple-500/5">
                  <div
                    className={`h-full ${c.bar} transition-all duration-500 ease-out`}
                    style={{ width: `${clamp(p.confidence, 0, 100)}%` }}
                  />
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-purple-900/20">
                <div className="text-[10px] font-bold text-purple-300/50 mb-1 uppercase tracking-wider">AI Intelligence</div>
                <p className="text-xs text-white/80 leading-relaxed font-medium">
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
