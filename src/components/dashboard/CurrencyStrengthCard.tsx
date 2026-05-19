"use client";

import React, { useEffect, useMemo, useState, useRef } from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingDown, TrendingUp } from "lucide-react";

type SeriesPoint = { x: number; y: number };

type StrengthSeries = {
  label: string;
  color: string;
  value: number; // current strength score
};

function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n));
}

// Memoized SVG path calculation to prevent recalculation on every render
function calculateChartPaths(
  history: Record<string, number[]>,
  labels: string[],
  strength: StrengthSeries[],
  tick: number
) {
  const w = 900;
  const h = 260;
  const pad = 28;
  const innerW = w - pad * 2;
  const innerH = h - pad * 2;

  const xs = Array.from({ length: 30 }, (_, i) => i);
  const getArr = (label: string) => {
    const arr = history[label] ?? [];
    // Normalize to length 30
    const padded = arr.length >= 30 ? arr.slice(-30) : [...Array(30 - arr.length).fill(0), ...arr];
    return padded;
  };

  const yScale = (v: number) => {
    // center at 0. Use fixed range [-100,100]
    const range = 100;
    const t = clamp((v + range) / (2 * range), 0, 1);
    return pad + (1 - t) * innerH;
  };

  const paths = labels.map((label) => {
    const s = strength.find((x) => x.label === label)!;
    const vals = getArr(label);
    const points = xs.map((i) => {
      const x = pad + (innerW * i) / (xs.length - 1);
      const y = yScale(vals[i]);
      return { x, y };
    });

    const d = points
      .map((p, idx) => `${idx === 0 ? "M" : "L"} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`)
      .join(" ");

    return { label, color: s.color, d, latest: vals[vals.length - 1] };
  });

  return { w, h, pad, innerW, innerH, paths };
}

const CurrencyStrengthCard = React.memo(function CurrencyStrengthCard({ className = "" }: { className?: string }) {
  const [strength, setStrength] = useState<StrengthSeries[]>([
    { label: "EUR", color: "#34d399", value: 12.5 },
    { label: "GBP", color: "#60a5fa", value: 8.3 },
    { label: "JPY", color: "#fbbf24", value: -5.2 },
    { label: "USD", color: "#a78bfa", value: -10.4 },
  ]);

  const [history, setHistory] = useState<Record<string, number[]>>({ EUR: [], GBP: [], JPY: [], USD: [] });
  const [tick, setTick] = useState(0);
  const strengthRef = useRef<StrengthSeries[]>(strength);

  useEffect(() => {
    const load = async () => {
      try {
        // Best-effort: compute relative performance from FX tickers if available.
        const symbols = ["EURUSD", "GBPUSD", "USDJPY"].join(",");
        const res = await fetch(`/api/market/ticker?symbols=${encodeURIComponent(symbols)}`);
        if (!res.ok) throw new Error(`Ticker request failed: ${res.status}`);
        const json = await res.json();
        const data = json?.data ?? {};

        const eur = Number(data["EURUSD"]?.changePercent ?? 0);
        const gbp = Number(data["GBPUSD"]?.changePercent ?? 0);
        const jpy = Number(data["USDJPY"]?.changePercent ?? 0);

        // Convert to "strength" proxy around 0 center.
        // If EURUSD is up, EUR tends stronger vs USD; if USDJPY up, USD stronger vs JPY.
        // USD is averaged from EUR and GBP (divided by 2) to avoid double-counting since it's derived from two pairs.
        const usdProxy = -(eur + gbp) / 2;

        const next = [
          { label: "EUR", color: "#34d399", value: clamp(eur * 10, -100, 100) },
          { label: "GBP", color: "#60a5fa", value: clamp(gbp * 10, -100, 100) },
          { label: "JPY", color: "#fbbf24", value: clamp(-jpy * 10, -100, 100) },
          { label: "USD", color: "#a78bfa", value: clamp(usdProxy * 10, -100, 100) },
        ] satisfies StrengthSeries[];

        setStrength(next);
        strengthRef.current = next;
        setHistory((h) => {
          const copy: Record<string, number[]> = { ...h };
          for (const s of next) {
            const arr = copy[s.label] ? [...copy[s.label]] : [];
            arr.push(s.value);
            copy[s.label] = arr.slice(-30);
          }
          return copy;
        });
      } catch {
        // fallback: random-walk around 0
        const newStrength = strengthRef.current.map((s) => ({
          ...s,
          value: clamp(s.value + (Math.random() - 0.5) * 8, -100, 100),
        }));
        setStrength(newStrength);
        strengthRef.current = newStrength;

        setHistory((h) => {
          const copy: Record<string, number[]> = { ...h };
          for (const k of Object.keys(copy)) {
            const arr = copy[k] ? [...copy[k]] : [];
            const base = strengthRef.current.find((s) => s.label === k)?.value ?? 0;
            arr.push(clamp(base + (Math.random() - 0.5) * 8, -100, 100));
            copy[k] = arr.slice(-30);
          }
          return copy;
        });
      }
    };

    load();
    const i = setInterval(() => {
      setTick((t) => t + 1);
      load();
    }, 30000);

    return () => clearInterval(i);
  }, []);

  const labels = useMemo(() => {
    const base = ["EUR", "GBP", "JPY", "USD"];
    return base;
  }, []);

  // Memoize chart calculations
  const chart = useMemo(() => {
    return calculateChartPaths(history, labels, strength, tick);
  }, [history, labels, strength, tick]);

  return (
    <Card className={`overflow-hidden min-h-[340px] border-purple-900/60 bg-purple-950/40 backdrop-blur-xl hover:border-purple-500/60 hover:shadow-lg hover:shadow-purple-500/20 transition-all duration-300 ease-in-out ${className}`}>
      <div className="absolute inset-0 bg-gradient-to-br from-purple-600/5 via-transparent to-blue-600/5 -z-10" />
      <CardContent className="p-4 relative">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div>
            <div className="text-base font-bold text-white tracking-wide">Currency Strength</div>
            <div className="text-xs text-purple-200/70 tracking-wide">Relative performance around 0 (center line)</div>
          </div>
          <Badge variant="outline" className="text-purple-200/80 border-purple-400/30 text-xs">
            0-center
          </Badge>
        </div>

        <div>
          <svg viewBox={`0 0 ${chart.w} ${chart.h}`} className="w-full h-[220px]">
            {/* center line */}
            <line x1={chart.pad} x2={chart.w - chart.pad} y1={chart.pad + chart.innerH / 2} y2={chart.pad + chart.innerH / 2} stroke="rgba(167,139,250,0.35)" strokeDasharray="6 6" />
            {/* grid */}
            {[0.25, 0.5, 0.75].map((t) => {
              const y = chart.pad + chart.innerH * t;
              return (
                <line key={t} x1={chart.pad} x2={chart.w - chart.pad} y1={y} y2={y} stroke="rgba(167,139,250,0.12)" />
              );
            })}

            {chart.paths.map((p) => (
              <path
                key={p.label}
                  d={p.d}
                  fill="none"
                  stroke={p.color}
                  strokeWidth="2.5"
                  opacity={0.95}
                />
              ))}

              {/* latest dots */}
              {chart.paths.map((p) => {
                // latest at i=29
                const vals = history[p.label] ?? [];
                const arr = vals.length >= 30 ? vals.slice(-30) : [...Array(30 - vals.length).fill(0), ...vals];
                const last = arr[arr.length - 1] ?? 0;
                const range = 100;
                const t = clamp((last + range) / (2 * range), 0, 1);
                const y = chart.pad + (1 - t) * chart.innerH;
                const x = chart.pad + (chart.innerW * 29) / 29;
                return (
                  <circle
                    key={p.label}
                    cx={x}
                    cy={y}
                    r="4.3"
                    fill={p.color}
                    stroke="rgba(255,255,255,0.35)"
                    strokeWidth="1"
                  />
                );
              })}
            </svg>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-4">
            {strength.map((s) => {
              const up = s.value >= 0;
              return (
                <div
                  key={s.label}
                  className="rounded-xl border border-purple-900/60 bg-purple-950/60 p-3 cursor-pointer hover:bg-purple-900/40 transition-colors duration-200"
                >
                  <div className="flex items-center justify-between">
                    <div className="text-xs font-semibold text-purple-200">{s.label}</div>
                    <div className={up ? "text-emerald-300" : "text-rose-300"}>
                      {up ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                    </div>
                  </div>
                  <div className={`mt-1 text-sm font-mono ${up ? "text-emerald-300" : "text-rose-300"}`}>
                    {s.value >= 0 ? "+" : ""}{s.value.toFixed(1)}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
  );
});

export default CurrencyStrengthCard;
