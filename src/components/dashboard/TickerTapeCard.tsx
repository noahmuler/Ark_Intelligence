"use client";

import React, { useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { TrendingDown, TrendingUp } from "lucide-react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";

type Quote = {
  symbol: string;
  name?: string;
  price: number;
  percentChange: number;
  priceChanged: boolean;
};

function pctStr(p: number) {
  const sign = p >= 0 ? "+" : "";
  return `${sign}${p.toFixed(2)}%`;
}

const TickerItem = React.memo(function TickerItem({ quote }: { quote: Quote }) {
  const up = quote.percentChange >= 0;

  return (
    <div className={`min-w-[190px] rounded-2xl border border-purple-900/70 bg-purple-950/70 p-3 cursor-pointer hover:bg-purple-900/60 hover:border-purple-500/40 transition-all duration-200 shadow-md shadow-purple-500/5 ${quote.priceChanged ? 'animate-pulse border-emerald-400/50' : ''}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-xs text-purple-300/90 font-mono font-bold">{quote.symbol}</div>
          <div className="text-lg font-black text-white mt-1 font-mono tracking-tight">
            {quote.symbol.includes("BTC") || quote.symbol.includes("ETH") || quote.symbol === "NQ"
              ? quote.price.toLocaleString("en-US", { maximumFractionDigits: 0 })
              : quote.price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
          </div>
        </div>
        <div className={up ? "text-emerald-400" : "text-rose-400"}>
          {up ? <TrendingUp className="h-4.5 w-4.5" /> : <TrendingDown className="h-4.5 w-4.5" />}
        </div>
      </div>

      <div className="mt-2 flex items-center justify-between">
        <span className="text-[10px] font-bold text-purple-300/60 uppercase">{quote.name ?? quote.symbol}</span>
        <span className={`font-mono text-xs font-black ${up ? "text-emerald-400" : "text-rose-400"}`}>
          {pctStr(quote.percentChange)}
        </span>
      </div>
    </div>
  );
});

// Mapping of Convex symbols to ticker display symbols
const SYMBOL_MAP: Record<string, { symbol: string; name: string }> = {
  XAU: { symbol: "XAUUSD", name: "Gold / USD" },
  BTC: { symbol: "BTCUSD", name: "Bitcoin / USD" },
  OIL: { symbol: "WTIUSD", name: "Crude Oil" },
  DXY: { symbol: "DXY", name: "US Dollar Index" },
  NQ: { symbol: "NQ", name: "Nasdaq 100 Fut" },
  ES: { symbol: "ES", name: "S&P 500 Fut" },
};

const TickerTapeCard = React.memo(function TickerTapeCard({ className = "" }: { className?: string }) {
  // Fetch real data from Convex
  const priceRecords = useQuery(api.actions.getAllPrices) ?? [];

  // Track previous prices to detect changes
  const previousPricesRef = useRef<Map<string, number>>(new Map());

  // Map Convex data to ticker format
  const quotes: Quote[] = React.useMemo(() => {
    return priceRecords.map((record) => {
      const mapping = SYMBOL_MAP[record.symbol];
      
      // Detect if price changed
      const previousPrice = previousPricesRef.current.get(record.symbol);
      const priceChanged = previousPrice !== undefined && previousPrice !== record.price;
      
      // Update previous price
      previousPricesRef.current.set(record.symbol, record.price);
      
      return {
        symbol: mapping?.symbol || record.symbol,
        name: mapping?.name,
        price: record.price,
        percentChange: record.change24h,
        priceChanged,
      };
    });
  }, [priceRecords]);

  return (
    <Card className={`overflow-hidden rounded-xl border border-white/10 bg-purple-950/30 backdrop-blur-[12px] hover:border-purple-500/40 hover:shadow-lg hover:shadow-purple-500/10 transition-all duration-300 ease-in-out ${className}`}>
      {/* Global CSS for seamless infinite horizontal marquee */}
      <style>{`
        @keyframes marquee-scroll {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
        .marquee-container {
          display: flex;
          overflow: hidden;
          width: 100%;
          user-select: none;
          mask-image: linear-gradient(to right, transparent, white 5%, white 95%, transparent);
        }
        .marquee-track {
          display: flex;
          gap: 12px;
          width: max-content;
          animation: marquee-scroll 45s linear infinite;
        }
        .marquee-track:hover {
          animation-play-state: paused;
        }
      `}</style>

      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="text-xs font-bold text-purple-300/70 tracking-widest uppercase">Global Market Stream</div>
            <div className="text-lg font-extrabold text-white tracking-wide mt-0.5">Asset Tape</div>
          </div>
          <div className="flex items-center gap-1.5 bg-purple-900/30 px-2 py-0.5 rounded-full border border-purple-500/10">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
            <span className="text-[10px] font-bold text-emerald-300 tracking-wider uppercase">Live Feeds</span>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-xl border border-white/5 bg-purple-950/20 p-2">
          <div className="marquee-container">
            <div className="marquee-track">
              {/* Copy 1 */}
              <div className="flex gap-3 shrink-0">
                {quotes.map((q, idx) => (
                  <TickerItem key={`${q.symbol}-c1-${idx}`} quote={q} />
                ))}
              </div>

              {/* Copy 2 (Perfect Duplicate for seamless infinite loop) */}
              <div className="flex gap-3 shrink-0">
                {quotes.map((q, idx) => (
                  <TickerItem key={`${q.symbol}-c2-${idx}`} quote={q} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

export default TickerTapeCard;
