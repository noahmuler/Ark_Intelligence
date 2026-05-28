"use client";

import React, { useMemo } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";


type AssetKey = "XAU" | "BTC" | "OIL" | "DXY" | "NQ" | "ES";

const ASSETS: AssetKey[] = ["XAU", "BTC", "OIL", "DXY", "NQ", "ES"];

function clamp01(n: number) {
  return Math.max(0, Math.min(1, n));
}

// This is a lightweight, self-contained visual that matches the prompt requirement:
// remove the placeholder DXY chart and replace it with a relational "Capital Flow" graph.
// Now wired to live Convex price data.
export function CapitalFlowGraph({
  className = "",
}: {
  className?: string;
}) {
  // Fetch real price data from Convex
  const prices = useQuery(api.actions.getAllPrices) ?? [];

  // Calculate capital flow based on real price changes
  const { nodes, edges } = useMemo(() => {
    // Node positions: hexagon layout
    const cx = 130;
    const cy = 90;
    const r = 62;
    const nodes = ASSETS.map((a, i) => {
      const angle = (Math.PI * 2 * i) / ASSETS.length - Math.PI / 2;
      return {
        key: a,
        x: cx + r * Math.cos(angle),
        y: cy + r * Math.sin(angle),
      };
    });

    // Edge weights: risk-on -> risk-off and central pivot.
    // Now based on real price changes from Convex
    const riskOn: AssetKey[] = ["NQ", "ES", "BTC", "OIL"];
    const riskOff: AssetKey[] = ["DXY", "XAU"];

    // Get price changes for each asset
    const getPriceChange = (symbol: AssetKey): number => {
      const priceData = prices.find(p => p.symbol === symbol);
      return priceData?.change24h || 0;
    };

    const edges: Array<{
      from: AssetKey;
      to: AssetKey;
      w: number; // 0..1
      dir: "up" | "down";
    }> = [];

    for (const from of riskOn) {
      for (const to of riskOff) {
        // Weight based on real price changes
        const fromChange = getPriceChange(from);
        const toChange = getPriceChange(to);
        
        // Calculate flow strength based on relative performance
        const flowStrength = (fromChange - toChange) / 10; // Normalize
        const w = clamp01(0.3 + Math.abs(flowStrength));
        
        // Direction based on which is performing better
        const dir = fromChange > toChange ? "up" : "down";
        
        edges.push({ from, to, w, dir });
      }
    }

    // Add return flows (risk-off -> risk-on)
    for (const from of riskOff) {
      for (const to of riskOn) {
        const fromChange = getPriceChange(from);
        const toChange = getPriceChange(to);
        
        const flowStrength = (toChange - fromChange) / 10;
        const w = clamp01(0.1 + Math.abs(flowStrength) * 0.5);
        const dir = toChange > fromChange ? "up" : "down";
        
        edges.push({ from, to, w, dir });
      }
    }

    return { nodes, edges };
  }, [prices]);

  const nodeByKey = useMemo(() => {
    const m = new Map<AssetKey, { x: number; y: number }>();
    for (const n of nodes) m.set(n.key, { x: n.x, y: n.y });
    return m;
  }, [nodes]);

  const colorFor = (k: AssetKey) => {
    switch (k) {
      case "DXY":
        return { fg: "#a855f7", glow: "rgba(168,85,247,0.75)" };
      case "XAU":
        return { fg: "#ef4444", glow: "rgba(239,68,68,0.75)" };
      case "BTC":
        return { fg: "#10b981", glow: "rgba(16,185,129,0.75)" };
      case "OIL":
        return { fg: "#f59e0b", glow: "rgba(245,158,11,0.75)" };
      case "NQ":
        return { fg: "#60a5fa", glow: "rgba(96,165,250,0.75)" };
      case "ES":
        return { fg: "#34d399", glow: "rgba(52,211,153,0.75)" };
      default:
        return { fg: "#a855f7", glow: "rgba(168,85,247,0.75)" };
    }
  };

  return (
    <div
      className={`bg-purple-950/50 backdrop-blur-xl rounded-2xl border border-purple-900/50 p-3 ${className}`}
    >
      <div className="flex items-center justify-between mb-2">
        <div>
          <div className="text-xs font-semibold text-purple-300/80 tracking-wider uppercase">
            Capital Flow
          </div>
          <div className="text-[11px] text-purple-200/70 leading-tight">
            Liquidity rotates between risk-on and safe havens.
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400/70" />
          <span className="text-[10px] font-bold text-emerald-200/80">Inbound</span>
          <div className="w-1.5 h-1.5 rounded-full bg-rose-400/70 ml-2" />
          <span className="text-[10px] font-bold text-rose-200/80">Outbound</span>
        </div>
      </div>

      <svg width="100%" viewBox="0 0 260 170" className="block">
        <defs>
          <linearGradient id="edgeUp" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="rgba(16,185,129,0.8)" />
            <stop offset="100%" stopColor="rgba(168,85,247,0.1)" />
          </linearGradient>
          <linearGradient id="edgeDown" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="rgba(239,68,68,0.75)" />
            <stop offset="100%" stopColor="rgba(168,85,247,0.1)" />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="2.4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {edges.map((e, idx) => {
          const a = nodeByKey.get(e.from)!;
          const b = nodeByKey.get(e.to)!;

          // Curved path using mid-point offset.
          const mx = (a.x + b.x) / 2;
          const my = (a.y + b.y) / 2;
          const dx = b.x - a.x;
          const dy = b.y - a.y;
          const nx = -dy;
          const ny = dx;
          const norm = Math.max(1, Math.hypot(nx, ny));
          const ox = (nx / norm) * 18;
          const oy = (ny / norm) * 18;

          const d = `M ${a.x} ${a.y} Q ${mx + ox} ${my + oy} ${b.x} ${b.y}`;

          const strokeWidth = 0.6 + e.w * 2.8;
          const opacity = 0.12 + e.w * 0.55;
          const grad = e.dir === "up" ? "url(#edgeUp)" : "url(#edgeDown)";

          return (
            <path
              key={idx}
              d={d}
              fill="none"
              stroke={grad}
              strokeWidth={strokeWidth}
              opacity={opacity}
              filter="url(#glow)"
              strokeLinecap="round"
            />
          );
        })}

        {nodes.map((n) => {
          const c = colorFor(n.key as AssetKey);
          return (
            <g key={n.key}>
              <circle cx={n.x} cy={n.y} r={14} fill="rgba(147,51,234,0.08)" stroke="rgba(147,51,234,0.25)" />
              <circle cx={n.x} cy={n.y} r={7} fill={c.fg} opacity={0.85} />
              <circle cx={n.x} cy={n.y} r={18} fill="transparent" stroke={c.glow} strokeOpacity={0.22} strokeWidth={1} />

              <text
                x={n.x}
                y={n.y + 30}
                textAnchor="middle"
                fontSize="10"
                fontWeight={800}
                fill="rgba(255,255,255,0.85)"
                style={{ letterSpacing: "0.06em" }}
              >
                {n.key}
              </text>
            </g>
          );
        })}
      </svg>

      <div className="mt-2 grid grid-cols-3 gap-2">
        <div className="rounded-xl border border-purple-900/50 bg-purple-950/30 p-2">
          <div className="text-[10px] text-purple-300/70 font-bold uppercase tracking-wider">Risk-On</div>
          <div className="text-[12px] font-extrabold text-white">NQ / ES / BTC</div>
        </div>
        <div className="rounded-xl border border-purple-900/50 bg-purple-950/30 p-2">
          <div className="text-[10px] text-purple-300/70 font-bold uppercase tracking-wider">Pivot</div>
          <div className="text-[12px] font-extrabold text-white">OIL</div>
        </div>
        <div className="rounded-xl border border-purple-900/50 bg-purple-950/30 p-2">
          <div className="text-[10px] text-purple-300/70 font-bold uppercase tracking-wider">Safety</div>
          <div className="text-[12px] font-extrabold text-white">DXY / XAU</div>
        </div>
      </div>
    </div>
  );
}

