// "use client"

import React, { useState, useEffect, useMemo } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { TrendingUp, TrendingDown } from "lucide-react";

type Sentiment = "Bullish" | "Bearish" | "Neutral";

type AssetCard = {
  symbol: string;
  name: string;
  priceText: string;
  deltaPercentText: string;
  sentiment: Sentiment;
  confidence: number;
  aiOneSentence: string;
};

// Mapping of symbols to display names
const ASSET_NAME_MAP: Record<string, string> = {
  XAU: "Gold / US Dollar",
  BTC: "Bitcoin / US Dollar",
  OIL: "Crude Oil",
  DXY: "US Dollar Index",
  NQ: "Nasdaq 100 Futures",
  ES: "S&P 500 Futures",
};

const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));

export const DashboardMacroDesk = React.memo(function DashboardMacroDesk() {
  // Live data from Convex
  const priceRecords = useQuery(api.prices.getAll) ?? [];
  const briefs = useQuery(api.asset_briefs.getAll) ?? [];

  // Build asset cards from live data
  const ASSETS: AssetCard[] = useMemo(() => {
    return priceRecords.map((p) => {
      const name = ASSET_NAME_MAP[p.symbol] ?? p.symbol;
      const priceText = `$${p.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
      const delta = p.change24h ?? 0;
      const deltaPercentText = `${delta >= 0 ? "+" : ""}${delta.toFixed(2)}%`;
      const sentiment: Sentiment = delta > 0 ? "Bullish" : delta < 0 ? "Bearish" : "Neutral";
      const confidence = Math.min(100, Math.max(0, Math.round(Math.abs(delta) * 10)));
      const briefObj = briefs.find((b) => b.symbol === p.symbol);
      const aiOneSentence = briefObj?.brief ?? "Data sourced live from Convex backend.";
      return { symbol: p.symbol, name, priceText, deltaPercentText, sentiment, confidence, aiOneSentence };
    });
  }, [priceRecords, briefs]);

  // Mounting state for skeleton loading (prevents layout shift)
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setIsMounted(true), 0);
    return () => clearTimeout(timer);
  }, []);

  const sentimentColor = (sentiment: Sentiment) => {
    if (sentiment === "Bullish") return { fg: "text-emerald-400", bar: "bg-emerald-500" };
    if (sentiment === "Bearish") return { fg: "text-rose-400", bar: "bg-rose-500" };
    return { fg: "text-amber-400", bar: "bg-amber-500" };
  };

  const SentimentIcon = ({ sentiment }: { sentiment: Sentiment }) => {
    if (sentiment === "Bullish") return <TrendingUp className="h-4.5 w-4.5 text-emerald-400" />;
    if (sentiment === "Bearish") return <TrendingDown className="h-4.5 w-4.5 text-rose-400" />;
    return <TrendingUp className="h-4.5 w-4.5 text-amber-400 rotate-90" />; // Neutral fallback
  };

  return (
    <div className="bg-purple-950/30 backdrop-blur-[12px] rounded-xl border border-white/10 p-4 min-h-[340px] hover:border-purple-500/40 hover:shadow-lg hover:shadow-purple-500/10 transition-all duration-300 ease-in-out">
      {!isMounted ? (
        // Glassmorphic skeleton grid – six placeholders matching the final layout
        <div className="grid grid-cols-2 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-32 bg-purple-900/30 animate-pulse rounded-xl" />
          ))}
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between mb-4 border-b border-purple-900/30 pb-3">
            <div>
              <div className="text-xs font-bold text-purple-300/70 tracking-widest uppercase">Ark Intelligence Desk</div>
              <div className="text-lg font-extrabold text-white tracking-wide mt-0.5">Macro Desk</div>
            </div>
            <div className="flex items-center gap-1.5 bg-purple-900/30 px-2 py-0.5 rounded-full border border-purple-500/10">
              <div className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
              <span className="text-[10px] font-bold text-purple-300/80 tracking-wider uppercase">
                {priceRecords.length ? `${priceRecords.length} assets` : "Loading..."}
              </span>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-2 gap-3">
            {ASSETS.map((p) => {
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
                        <div className="text-xs font-bold text-purple-300/60 uppercase truncate">{p.name}</div>
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
                      <div className={`h-full ${c.bar} transition-all duration-500 ease-out`} style={{ width: `${clamp(p.confidence, 0, 100)}%` }} />
                    </div>
                    <div className="mt-4 pt-3 border-t border-purple-900/20">
                      <div className="text-[10px] font-bold text-purple-300/50 mb-1 uppercase tracking-wider">AI Intelligence</div>
                      <p className="text-xs text-white/80 leading-relaxed font-medium">{p.aiOneSentence}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
});
