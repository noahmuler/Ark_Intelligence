"use client";

import React, { useMemo } from "react";
import { TrendingUp, TrendingDown, Minus, Clock, Calendar, Target, AlertTriangle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useMarketPrices } from "@/hooks/useMarketPrices";

interface MarketMover {
  symbol: string;
  change: number;
  price: number;
}

function getCurrentSession(): string {
  const now = new Date();
  const hour = now.getUTCHours();
  if (hour >= 0 && hour < 8) return "Asia Session (Tokyo)";
  if (hour >= 8 && hour < 16) return "London Session";
  return "New York Session";
}

function formatTimeAgo(timestamp: number): string {
  const minutes = Math.floor((Date.now() - timestamp) / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export const AISessionBrief = React.memo(function AISessionBrief({ className = "" }: { className?: string }) {
  const { data: marketData } = useMarketPrices();

  const { data: reportsData } = useQuery({
    queryKey: ["session-brief-reports"],
    queryFn: async () => {
      const res = await fetch("/api/reports");
      if (!res.ok) return null;
      return res.json();
    },
    staleTime: 300_000,
    retry: 1,
  });

  const brief = useMemo(() => {
    if (!marketData?.prices) return null;

    const prices = marketData.prices as Record<string, any>;
    const session = getCurrentSession();

    // Find major movers
    const movers: MarketMover[] = [];
    for (const [key, p] of Object.entries(prices)) {
      if (p?.changePercent !== undefined) {
        movers.push({ symbol: key, change: p.changePercent, price: p.price });
      }
    }
    movers.sort((a, b) => Math.abs(b.change) - Math.abs(a.change));

    const topGainer = movers.find((m) => m.change > 0);
    const topLoser = movers.find((m) => m.change < 0);
    const dxy = prices.DXY;
    const vix = prices.VIX;

    // Today's economic events
    const todayEvents = (reportsData?.upcoming || [])
      .filter((e: any) => {
        const d = new Date(e.releaseDate);
        const now = new Date();
        return d.toDateString() === now.toDateString();
      })
      .slice(0, 3);

    return {
      session,
      topGainer,
      topLoser,
      dxyChange: dxy?.changePercent ?? 0,
      vixLevel: vix?.price ?? 0,
      events: todayEvents,
      timestamp: marketData.fetchedAt,
    };
  }, [marketData, reportsData]);

  if (!brief) {
    return (
      <div className={`bg-purple-950/20 rounded-lg border border-white/10 p-2.5 backdrop-blur-[12px] ${className}`}>
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xs font-semibold text-white/90 tracking-wider uppercase">Pre-Session Brief</h2>
        </div>
        <div className="space-y-2">
          <div className="h-3 w-2/3 rounded bg-purple-900/40 animate-pulse" />
          <div className="h-3 w-1/2 rounded bg-purple-900/40 animate-pulse" />
          <div className="h-10 rounded bg-purple-900/40 animate-pulse" />
        </div>
      </div>
    );
  }

  const vixText =
    brief.vixLevel > 25 ? "Elevated fear" : brief.vixLevel > 18 ? "Moderate anxiety" : "Calm markets";

  return (
    <div className={`bg-purple-950/20 rounded-lg border border-white/10 p-2.5 backdrop-blur-[12px] ${className}`}>
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-xs font-semibold text-white/90 tracking-wider uppercase">Pre-Session Brief</h2>
        <div className="flex items-center gap-1.5">
          <Clock className="w-3 h-3 text-purple-400/60" />
          <span className="text-xs text-purple-300/50 tracking-tight">
            {brief.timestamp ? formatTimeAgo(brief.timestamp) : "--"}
          </span>
        </div>
      </div>

      <div className="space-y-2.5">
        {/* Session */}
        <div className="flex items-center gap-2">
          <Calendar className="h-3.5 w-3.5 text-purple-400" />
          <span className="text-xs text-purple-300/70">Session:</span>
          <span className="text-xs font-bold text-white/90">{brief.session}</span>
        </div>

        {/* Major Movers */}
        <div className="space-y-1.5">
          <div className="text-[10px] text-purple-400/60 uppercase tracking-wider font-bold">Major Movers</div>
          {brief.topGainer && (
            <div className="flex items-center gap-2">
              <TrendingUp className="h-3 w-3 text-emerald-400" />
              <span className="text-xs font-mono text-white/90">{brief.topGainer.symbol}</span>
              <span className="text-xs text-emerald-400 font-bold">+{brief.topGainer.change.toFixed(2)}%</span>
            </div>
          )}
          {brief.topLoser && (
            <div className="flex items-center gap-2">
              <TrendingDown className="h-3 w-3 text-rose-400" />
              <span className="text-xs font-mono text-white/90">{brief.topLoser.symbol}</span>
              <span className="text-xs text-rose-400 font-bold">{brief.topLoser.change.toFixed(2)}%</span>
            </div>
          )}
          {!brief.topGainer && !brief.topLoser && (
            <div className="flex items-center gap-2 text-purple-400/50">
              <Minus className="h-3 w-3" />
              <span className="text-xs">No significant movers</span>
            </div>
          )}
        </div>

        {/* DXY & VIX */}
        <div className="flex gap-2">
          <div className="flex-1 bg-purple-900/30 rounded-lg px-2 py-1.5 border border-purple-500/10">
            <div className="text-[10px] text-purple-400/60 uppercase tracking-wider">DXY</div>
            <div className={`text-xs font-bold ${brief.dxyChange >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
              {brief.dxyChange >= 0 ? "+" : ""}{brief.dxyChange.toFixed(2)}%
            </div>
          </div>
          <div className="flex-1 bg-purple-900/30 rounded-lg px-2 py-1.5 border border-purple-500/10">
            <div className="text-[10px] text-purple-400/60 uppercase tracking-wider">VIX</div>
            <div className="text-xs font-bold text-white/90">{brief.vixLevel.toFixed(1)}</div>
            <div className="text-[10px] text-purple-400/60">{vixText}</div>
          </div>
        </div>

        {/* Today's Events */}
        {brief.events.length > 0 && (
          <div className="space-y-1">
            <div className="flex items-center gap-1.5">
              <Target className="h-3 w-3 text-amber-400" />
              <span className="text-[10px] text-amber-400/80 uppercase tracking-wider font-bold">Today's Events</span>
            </div>
            {brief.events.map((e: any) => (
              <div key={e.id} className="flex items-center justify-between text-xs">
                <span className="text-white/80 truncate">{e.name}</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded ${e.impact === "high" ? "bg-red-500/20 text-red-300" : "bg-amber-500/20 text-amber-300"}`}>
                  {e.impact}
                </span>
              </div>
            ))}
          </div>
        )}

        {brief.events.length === 0 && (
          <div className="flex items-center gap-1.5 text-purple-400/50">
            <AlertTriangle className="h-3 w-3" />
            <span className="text-xs">No major USD events today</span>
          </div>
        )}
      </div>
    </div>
  );
});
