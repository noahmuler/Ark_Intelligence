"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { TrendingUp, TrendingDown } from "lucide-react";
import { useMarketPrices } from "@/hooks/useMarketPrices";

type Sentiment = "Bullish" | "Bearish" | "Neutral";

type AssetCard = {
  symbol: string;
  name: string;
  priceText: string;
  deltaPercentText: string;
  sentiment: Sentiment;
  confidence: number;
  description: string;
  priceChanged: boolean;
};

type MarketPrice = {
  price: number;
  change?: number;
  changePercent?: number;
};

const ASSET_DISPLAY: Record<string, { name: string; description: string }> = {
  DXY: { name: "US Dollar Index", description: "Measures USD strength against a basket of major currencies." },
  VIX: { name: "CBOE Volatility Index", description: "Equity volatility gauge. Rising VIX signals broader risk stress." },
  XAUUSD: { name: "Gold / USD", description: "Safe-haven metal. Sensitive to real rates and dollar strength." },
  XAGUSD: { name: "Silver / USD", description: "Industrial and monetary metal with higher beta than gold." },
  BTCUSD: { name: "Bitcoin / USD", description: "Dominant cryptocurrency. Often trades as high-beta risk exposure." },
  ETHUSD: { name: "Ethereum / USD", description: "Smart contract asset. Usually tracks BTC with higher beta." },
  US10Y: { name: "US 10Y Yield", description: "Benchmark yield. Rising yields often support USD and pressure gold." },
  EURUSD: { name: "EUR / USD", description: "Most liquid forex pair and a major inverse DXY input." },
  GBPUSD: { name: "GBP / USD", description: "Sterling-dollar pair driven by UK rates, growth, and USD regime." },
  USDJPY: { name: "USD / JPY", description: "Tracks US-Japan yield differential and safe-haven flows." },
};

const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));

export const DashboardMacroDesk = React.memo(function DashboardMacroDesk() {
  const { data: marketData } = useMarketPrices();

  // Track previous prices to detect changes
  const previousPricesRef = useRef<Map<string, number>>(new Map());

  // Build asset cards from live data
  const ASSETS: AssetCard[] = useMemo(() => {
    if (!marketData?.prices) return [];

    const desiredOrder = ["XAUUSD", "DXY", "BTCUSD", "US10Y", "EURUSD", "XAGUSD"];
    const prices = marketData.prices as Record<string, MarketPrice>;

    return desiredOrder.map((symbol) => {
      const p = prices[symbol];
      if (!p) return null;

      const display = ASSET_DISPLAY[symbol];
      const name = display?.name ?? symbol;
      const priceText = `${symbol === "US10Y" ? "" : "$"}${p.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
      const delta = p.changePercent ?? 0;
      const deltaPercentText = `${delta >= 0 ? "+" : ""}${delta.toFixed(2)}%`;
      const sentiment: Sentiment = delta > 0 ? "Bullish" : delta < 0 ? "Bearish" : "Neutral";
      const confidence = Math.min(100, Math.max(0, Math.round(Math.abs(delta) * 10)));

      // Detect if price changed
      const previousPrice = previousPricesRef.current.get(symbol);
      const priceChanged = previousPrice !== undefined && previousPrice !== p.price;
      previousPricesRef.current.set(symbol, p.price);

      return {
        symbol,
        name,
        priceText,
        deltaPercentText,
        sentiment,
        confidence,
        description: display?.description ?? "",
        priceChanged,
      };
    }).filter((asset): asset is AssetCard => asset !== null);
  }, [marketData]);

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
                {ASSETS.length ? `${ASSETS.length} assets` : "Loading..."}
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
                  className={`bg-purple-900/20 border border-white/5 rounded-xl p-3 hover:bg-purple-900/30 hover:border-purple-500/30 hover:shadow-md hover:shadow-purple-500/5 transition-all duration-300 ease-in-out flex flex-col justify-between ${p.priceChanged ? 'animate-pulse border-purple-400/50' : ''}`}
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
                      <p className="text-xs text-white/80 leading-relaxed font-medium">{p.description}</p>
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
