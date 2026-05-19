"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";

import { Badge } from "@/components/ui/badge";
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
  return `${sign}${Math.abs(p).toFixed(2)}%`;
}

// Isolated ticker item component to prevent unnecessary re-renders
const TickerItem = React.memo(function TickerItem({ quote }: { quote: Quote & { _k?: string } }) {
  const up = quote.percentChange >= 0;

  return (
    <div className="min-w-[180px] snap-start rounded-2xl border border-purple-900/70 bg-purple-950/70 p-3 cursor-pointer hover:bg-purple-900/60 transition-colors duration-200">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-xs text-purple-300/90 font-mono">{quote.symbol}</div>
          <div className="text-xl font-bold text-white mt-1">
            {quote.symbol.includes("BTC")
              ? quote.price.toLocaleString("en-US", { maximumFractionDigits: 0 })
              : quote.price.toLocaleString("en-US", { maximumFractionDigits: 2 })}
          </div>
        </div>
        <div className={up ? "text-emerald-300" : "text-rose-300"}>
          {up ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
        </div>
      </div>

      <div className="mt-2">
        <div className="text-xs font-semibold text-purple-200">{quote.name ?? quote.symbol}</div>
        <div className={up ? "text-emerald-300" : "text-rose-300"}>
          <span className="font-mono text-sm font-bold">{pctStr(quote.percentChange)}</span>
        </div>
        <div className="text-xs text-purple-200/60">% up/down vs last reference</div>
      </div>
    </div>
  );
});

const TickerTapeCard = React.memo(function TickerTapeCard({ className = "" }: { className?: string }) {
  const [quotes, setQuotes] = useState<Quote[]>([
    { symbol: "XAUUSD", name: "XAU", price: 2748.32, percentChange: 0.85 },
    { symbol: "BTCUSD", name: "BTC", price: 67845.32, percentChange: 1.25 },
    { symbol: "WTIUSD", name: "OIL", price: 82.35, percentChange: -0.35 },
    { symbol: "DXY", name: "DXY", price: 105.82, percentChange: 0.42 },
  ]);

  // Repeat quotes within a single segment so the loop width is long enough for smooth scrolling.
  const TAPE_REPEAT = 3;

  useEffect(() => {
    let cancelled = false;

    const fetchQuotes = async () => {
      try {
        const symbols = ["XAUUSD", "BTCUSD", "WTIUSD", "DXY", "EURUSD", "GBPUSD", "USDJPY"].join(",");
        const res = await fetch(`/api/market/ticker?symbols=${encodeURIComponent(symbols)}`);
        if (!res.ok) throw new Error(`Ticker request failed: ${res.status}`);
        const json = await res.json();
        const data = json?.data ?? {};

        const mapped: Quote[] = [
          {
            symbol: "XAUUSD",
            name: "XAU",
            price: Number(data["XAUUSD"]?.price ?? 0),
            percentChange: Number(data["XAUUSD"]?.percentChange ?? 0),
          },
          {
            symbol: "BTCUSD",
            name: "BTC",
            price: Number(data["BTCUSD"]?.price ?? 0),
            percentChange: Number(data["BTCUSD"]?.percentChange ?? 0),
          },
          {
            symbol: "WTIUSD",
            name: "OIL",
            price: Number(data["WTIUSD"]?.price ?? 0),
            percentChange: Number(data["WTIUSD"]?.percentChange ?? 0),
          },
          {
            symbol: "DXY",
            name: "DXY",
            price: Number(data["DXY"]?.price ?? 0),
            percentChange: Number(data["DXY"]?.percentChange ?? 0),
          },
        ].filter((q) => Number.isFinite(q.price) && q.price !== 0);

        if (!cancelled) setQuotes(mapped);
      } catch {
        if (!cancelled) {
          setQuotes([
            { symbol: "XAUUSD", name: "XAU", price: 2748.32, percentChange: 0.85 },
            { symbol: "BTCUSD", name: "BTC", price: 67845.32, percentChange: 1.25 },
            { symbol: "WTIUSD", name: "OIL", price: 82.35, percentChange: -0.35 },
            { symbol: "DXY", name: "DXY", price: 105.82, percentChange: 0.42 },
          ]);
        }
      }
    };

    fetchQuotes();
    const i = setInterval(fetchQuotes, 30000);
    return () => {
      cancelled = true;
      clearInterval(i);
    };
  }, []);

  // One segment (we will render it twice: [segment][segment])
  const segmentItems = useMemo(() => {
    return Array.from({ length: TAPE_REPEAT }).flatMap((_, i) =>
      quotes.map((q) => ({ ...q, _k: `${q.symbol}-${i}` }))
    );
  }, [quotes]);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);

  const [segmentWidth, setSegmentWidth] = useState(0);

  // Measure width of a single segment so we can wrap perfectly.
  useEffect(() => {
    const measure = () => {
      if (!contentRef.current) return;
      const segmentEl = contentRef.current.querySelector('[data-tape-segment="1"]') as HTMLElement | null;
      if (!segmentEl) return;
      setSegmentWidth(Math.max(1, segmentEl.getBoundingClientRect().width));
    };

    measure();
    const ro = new ResizeObserver(() => measure());
    if (contentRef.current) ro.observe(contentRef.current);
    window.addEventListener("resize", measure);

    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [segmentItems.length]);

  // Optimized animation loop using requestAnimationFrame with CSS transforms
  useEffect(() => {
    let rafId = 0;
    let lastTs = 0;
    let offsetPx = 0;

    const tick = (ts: number) => {
      rafId = requestAnimationFrame(tick);
      if (!containerRef.current) return;

      const dt = lastTs ? ts - lastTs : 16;
      lastTs = ts;

      // Speed in px/s - optimized for smoother performance
      const pxPerMs = 18 / 1000;
      offsetPx += dt * pxPerMs;

      const w = Math.max(1, segmentWidth);
      const wrapped = offsetPx % w;

      // Use transform instead of changing layout properties
      containerRef.current.style.transform = `translateX(${-wrapped}px)`;
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [segmentWidth]);

  return (
    <Card className={`overflow-hidden border-purple-900/60 bg-purple-950/40 backdrop-blur-xl hover:border-purple-500/60 hover:shadow-lg hover:shadow-purple-500/20 transition-all duration-300 ease-in-out ${className}`}>
      <div className="absolute inset-0 bg-gradient-to-br from-purple-600/5 via-transparent to-blue-600/5 -z-10" />
      <CardContent className="p-4 relative">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div>
            <div className="text-base font-bold text-white tracking-wide">Major Asset Tape</div>
            <div className="text-xs text-purple-200/70 tracking-wide">Real-time market snapshot</div>
          </div>
          <Badge variant="outline" className="text-purple-200/80 border-purple-400/30 text-xs">
            Live
          </Badge>
        </div>

        <div className="relative overflow-hidden rounded-xl border border-purple-900/60 bg-purple-950/40 min-h-[120px]">
          <div
            ref={containerRef}
            className="flex overflow-x-auto snap-x snap-mandatory scrollbar-hide will-change-transform"
            style={{
              scrollbarWidth: "none",
              msOverflowStyle: "none",
            }}
          >
            <div ref={contentRef} className="flex gap-2">
              {segmentItems.length === 0 ? (
                <div className="text-purple-200/80 text-sm px-4">Loading…</div>
              ) : (
                <>
                  <div data-tape-segment="1" className="flex gap-2">
                    {segmentItems.map((q: any, idx: number) => (
                      <TickerItem key={q._k ?? `${q.symbol}-${idx}`} quote={q} />
                    ))}
                  </div>

                  {/* Duplicate segment for seamless looping */}
                  <div data-tape-segment="2" className="flex gap-2">
                    {segmentItems.map((q: any, idx: number) => (
                      <TickerItem key={`${q._k ?? `${q.symbol}-${idx}`}-2`} quote={q} />
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

export default TickerTapeCard;
