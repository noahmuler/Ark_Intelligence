"use client";

import React, { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { TrendingDown, TrendingUp } from "lucide-react";

type Quote = {
  symbol: string;
  name?: string;
  price: number;
  percentChange: number;
};

function pctStr(p: number) {
  const sign = p >= 0 ? "+" : "";
  return `${sign}${p.toFixed(2)}%`;
}

const TickerItem = React.memo(function TickerItem({ quote }: { quote: Quote }) {
  const up = quote.percentChange >= 0;

  return (
    <div className="min-w-[190px] rounded-2xl border border-purple-900/70 bg-purple-950/70 p-3 cursor-pointer hover:bg-purple-900/60 hover:border-purple-500/40 transition-all duration-200 shadow-md shadow-purple-500/5">
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

const DEFAULT_QUOTES: Quote[] = [
  { symbol: "XAUUSD", name: "Gold / USD", price: 2748.32, percentChange: 0.85 },
  { symbol: "BTCUSD", name: "Bitcoin / USD", price: 67845.0, percentChange: 1.25 },
  { symbol: "ETHUSD", name: "Ethereum / USD", price: 3450.45, percentChange: 1.62 },
  { symbol: "EURUSD", name: "Euro / USD", price: 1.0876, percentChange: 0.21 },
  { symbol: "GBPUSD", name: "Sterling / USD", price: 1.2654, percentChange: -0.14 },
  { symbol: "USDJPY", name: "Dollar / Yen", price: 154.32, percentChange: 0.29 },
  { symbol: "AUDUSD", name: "Aussie / USD", price: 0.6654, percentChange: 0.45 },
  { symbol: "USDCAD", name: "Loonie / USD", price: 1.3654, percentChange: -0.12 },
  { symbol: "WTIUSD", name: "Crude Oil", price: 82.35, percentChange: -0.35 },
  { symbol: "DXY", name: "US Dollar Index", price: 105.82, percentChange: 0.42 },
  { symbol: "NQ", name: "Nasdaq 100 Fut", price: 18450.5, percentChange: 1.12 },
  { symbol: "ES", name: "S&P 500 Fut", price: 5240.75, percentChange: 0.85 },
];

const TickerTapeCard = React.memo(function TickerTapeCard({ className = "" }: { className?: string }) {
  const [quotes, setQuotes] = useState<Quote[]>(DEFAULT_QUOTES);

  useEffect(() => {
    let cancelled = false;

    const fetchQuotes = async () => {
      try {
        const symbols = DEFAULT_QUOTES.map((q) => q.symbol).join(",");
        const res = await fetch(`/api/market/ticker?symbols=${encodeURIComponent(symbols)}`);
        if (!res.ok) throw new Error(`Ticker request failed: ${res.status}`);
        const json = await res.json();
        const data = json?.data ?? {};

        const mapped: Quote[] = DEFAULT_QUOTES.map((fallback) => {
          const apiData = data[fallback.symbol];
          if (apiData && typeof apiData.price === "number" && apiData.price !== 0) {
            return {
              symbol: fallback.symbol,
              name: fallback.name,
              price: apiData.price,
              percentChange: typeof apiData.changePercent === "number" ? apiData.changePercent : fallback.percentChange,
            };
          }
          return fallback;
        });

        if (!cancelled) setQuotes(mapped);
      } catch {
        if (!cancelled) setQuotes(DEFAULT_QUOTES);
      }
    };

    fetchQuotes();
    const interval = setInterval(fetchQuotes, 30000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

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
