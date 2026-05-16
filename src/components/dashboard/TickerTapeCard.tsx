"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";

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

export default function TickerTapeCard({ className = "" }: { className?: string }) {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [now, setNow] = useState(() => new Date());

  // Repeat quotes within a single segment so the loop width is long enough for smooth scrolling.
  const TAPE_REPEAT = 3;

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 15000);
    return () => clearInterval(t);
  }, []);

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

  // Seamless loop: translateX from 0..segmentWidth, then wrap.
  useEffect(() => {
    let rafId = 0;
    let lastTs = 0;
    let offsetPx = 0;

    const tick = (ts: number) => {
      rafId = requestAnimationFrame(tick);
      if (!containerRef.current) return;

      const dt = lastTs ? ts - lastTs : 16;
      lastTs = ts;

      // Speed in px/s
      const pxPerMs = 18 / 1000;
      offsetPx += dt * pxPerMs;

      const w = Math.max(1, segmentWidth);
      const wrapped = offsetPx % w;

      containerRef.current.style.transform = `translateX(${-wrapped}px)`;
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [segmentWidth]);

  return (
    <Card className={"overflow-hidden " + className}>
      <CardContent className="p-0">
        <div className="px-6 pt-5 pb-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-lg font-bold text-white">Major Assets Tape</div>
              <div className="text-xs text-purple-200/80">Horizontally scroll for the latest pricing</div>
            </div>
            <Badge variant="outline" className="text-purple-200/80 border-purple-400/30">
              {now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
            </Badge>
          </div>
        </div>

        <div className="px-4 pb-4">
          <div className="overflow-hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <div ref={containerRef} className="flex gap-3 will-change-transform">
              <div ref={contentRef} className="flex gap-3">
                {segmentItems.length === 0 ? (
                  <div className="text-purple-200/80 text-sm px-4">Loading…</div>
                ) : (
                  <>
                    <div data-tape-segment="1" className="flex gap-3">
                      {segmentItems.map((q: any, idx: number) => {
                        const up = q.percentChange >= 0;
                        return (
                          <div
                            key={q._k ?? `${q.symbol}-${idx}`}
                            className="min-w-[220px] snap-start rounded-2xl border border-purple-900/70 bg-purple-950/70 p-4"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <div className="text-xs text-purple-300/90 font-mono">{q.symbol}</div>
                                <div className="text-2xl font-bold text-white mt-1">
                                  {q.symbol.includes("BTC")
                                    ? q.price.toLocaleString("en-US", { maximumFractionDigits: 0 })
                                    : q.price.toLocaleString("en-US", { maximumFractionDigits: 2 })}
                                </div>
                              </div>
                              <div className={up ? "text-emerald-300" : "text-rose-300"}>
                                {up ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                              </div>
                            </div>

                            <div className="mt-3">
                              <div className="text-sm font-semibold text-purple-200">{q.name ?? q.symbol}</div>
                              <div className={up ? "text-emerald-300" : "text-rose-300"}>
                                <span className="font-mono text-sm font-bold">{pctStr(q.percentChange)}</span>
                              </div>
                              <div className="text-xs text-purple-200/60">% up/down vs last reference</div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Duplicate segment for seamless looping */}
                    <div data-tape-segment="2" className="flex gap-3">
                      {segmentItems.map((q: any, idx: number) => {
                        const up = q.percentChange >= 0;
                        return (
                          <div
                            key={`${q._k ?? `${q.symbol}-${idx}`}-2`}
                            className="min-w-[220px] snap-start rounded-2xl border border-purple-900/70 bg-purple-950/70 p-4"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <div className="text-xs text-purple-300/90 font-mono">{q.symbol}</div>
                                <div className="text-2xl font-bold text-white mt-1">
                                  {q.symbol.includes("BTC")
                                    ? q.price.toLocaleString("en-US", { maximumFractionDigits: 0 })
                                    : q.price.toLocaleString("en-US", { maximumFractionDigits: 2 })}
                                </div>
                              </div>
                              <div className={up ? "text-emerald-300" : "text-rose-300"}>
                                {up ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                              </div>
                            </div>

                            <div className="mt-3">
                              <div className="text-sm font-semibold text-purple-200">{q.name ?? q.symbol}</div>
                              <div className={up ? "text-emerald-300" : "text-rose-300"}>
                                <span className="font-mono text-sm font-bold">{pctStr(q.percentChange)}</span>
                              </div>
                              <div className="text-xs text-purple-200/60">% up/down vs last reference</div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

