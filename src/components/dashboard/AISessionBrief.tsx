"use client";

import React, { useMemo } from "react";
import { Clock } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useMarketPrices } from "@/hooks/useMarketPrices";

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

interface ReportEvent {
  id: string;
  name: string;
  releaseDate: string;
  impact: "high" | "medium" | "low";
}

interface ReportsResponse {
  upcoming?: ReportEvent[];
}

interface BriefResult {
  session: string;
  timestamp: number;
  riskTone: string;
  riskColor: string;
  keyDriver: string;
  driverColor: string;
  watch: string;
  watchColor: string;
  avoid: string;
  avoidColor: string;
}

function computeBrief(
  marketData: { prices: Record<string, any>; fetchedAt: number } | undefined | null,
  reportsData: ReportsResponse | undefined | null
): BriefResult | null {
  if (!marketData?.prices) return null;

  const prices = marketData.prices;
  const vix = prices.VIX;
  const dxy = prices.DXY;
  const us10y = prices.US10Y;

  if (!vix || !dxy || !us10y) return null;

  const now = new Date();
  const upcoming = reportsData?.upcoming || [];
  const highEvents = upcoming
    .filter((e) => e.impact === "high" && new Date(e.releaseDate) > now)
    .sort((a, b) => new Date(a.releaseDate).getTime() - new Date(b.releaseDate).getTime());

  const nextEvent = highEvents[0];
  const hoursUntil = nextEvent
    ? (new Date(nextEvent.releaseDate).getTime() - now.getTime()) / (1000 * 60 * 60)
    : Infinity;

  const vixLevel = vix.price ?? 0;
  const dxyChange = dxy.changePercent ?? 0;
  const yieldChange = us10y.changePercent ?? 0;
  const dxyStr = `${dxyChange >= 0 ? "+" : ""}${dxyChange.toFixed(2)}%`;
  const yieldStr = `${yieldChange >= 0 ? "+" : ""}${yieldChange.toFixed(2)}%`;

  // 1. Risk Tone — derived from VIX level + upcoming high-impact event proximity
  let riskTone: string;
  let riskColor: string;
  if (vixLevel > 25) {
    riskTone = `Elevated — VIX at ${vixLevel.toFixed(1)}`;
    riskColor = "bg-rose-500";
  } else if (vixLevel > 18) {
    riskTone = `Moderate — VIX at ${vixLevel.toFixed(1)}`;
    riskColor = "bg-amber-400";
  } else {
    riskTone = `Calm — VIX at ${vixLevel.toFixed(1)}`;
    riskColor = "bg-emerald-400";
  }
  if (nextEvent && hoursUntil < 4) {
    riskTone += `, ${nextEvent.name} in ${Math.ceil(hoursUntil)}h`;
  }

  // 2. Key Driver — derived from DXY trend + US10Y yield direction
  let keyDriver: string;
  let driverColor: string;
  if (Math.abs(dxyChange) < 0.1 && Math.abs(yieldChange) < 0.01) {
    keyDriver = `Sideways macro — DXY ${dxyStr}, US10Y ${yieldStr}`;
    driverColor = "bg-gray-400";
  } else if (dxyChange > 0 && yieldChange > 0) {
    keyDriver = `Dollar strength + rising yields — DXY ${dxyStr}, US10Y ${yieldStr}`;
    driverColor = "bg-blue-400";
  } else if (dxyChange > 0 && yieldChange < 0) {
    keyDriver = `Dollar strength, yields falling — DXY ${dxyStr}, US10Y ${yieldStr}`;
    driverColor = "bg-blue-400";
  } else if (dxyChange < 0 && yieldChange > 0) {
    keyDriver = `Dollar weaker, yields rising — DXY ${dxyStr}, US10Y ${yieldStr}`;
    driverColor = "bg-purple-400";
  } else if (dxyChange < 0 && yieldChange < 0) {
    keyDriver = `Dollar weakness + falling yields — DXY ${dxyStr}, US10Y ${yieldStr}`;
    driverColor = "bg-purple-400";
  } else if (dxyChange > 0) {
    keyDriver = `Dollar strength — DXY ${dxyStr}, US10Y ${yieldStr}`;
    driverColor = "bg-blue-400";
  } else if (dxyChange < 0) {
    keyDriver = `Dollar weakness — DXY ${dxyStr}, US10Y ${yieldStr}`;
    driverColor = "bg-purple-400";
  } else if (yieldChange > 0) {
    keyDriver = `Rising yields — DXY ${dxyStr}, US10Y ${yieldStr}`;
    driverColor = "bg-amber-400";
  } else {
    keyDriver = `Falling yields — DXY ${dxyStr}, US10Y ${yieldStr}`;
    driverColor = "bg-emerald-400";
  }

  // 3. Watch — next high-impact event from the reports API
  let watch: string;
  let watchColor: string;
  if (nextEvent) {
    if (hoursUntil < 1) {
      watch = `${nextEvent.name} — imminent`;
    } else if (hoursUntil < 24) {
      watch = `${nextEvent.name} — in ${Math.floor(hoursUntil)}h`;
    } else {
      watch = `${nextEvent.name} — in ${Math.floor(hoursUntil / 24)}d`;
    }
    watchColor = hoursUntil < 1 ? "bg-rose-500" : hoursUntil < 4 ? "bg-amber-400" : "bg-gray-400";
  } else {
    watch = "No high-impact events on the horizon";
    watchColor = "bg-gray-400";
  }

  // 4. Avoid — contextual trading advice based on the above
  let avoid: string;
  let avoidColor: string;
  if (vixLevel > 25 && hoursUntil < 2) {
    avoid = `Low-liquidity pairs / high leverage (VIX ${vixLevel.toFixed(1)}, event imminent)`;
    avoidColor = "bg-rose-500";
  } else if (vixLevel > 20) {
    avoid = `Low-liquidity crosses (VIX ${vixLevel.toFixed(1)})`;
    avoidColor = "bg-amber-400";
  } else if (Math.abs(dxyChange) > 0.5 && Math.abs(yieldChange) > 0.05) {
    avoid = `Counter-trend exposure (DXY ${dxyStr}, US10Y ${yieldStr})`;
    avoidColor = "bg-amber-400";
  } else if (dxyChange > 0.3) {
    avoid = `Short-dollar positions (DXY ${dxyStr})`;
    avoidColor = "bg-amber-400";
  } else if (yieldChange > 0.05) {
    avoid = `Rate-sensitive longs (US10Y ${yieldStr})`;
    avoidColor = "bg-amber-400";
  } else {
    avoid = `Over-leveraging in quiet conditions (VIX ${vixLevel.toFixed(1)})`;
    avoidColor = "bg-gray-400";
  }

  return {
    session: getCurrentSession(),
    timestamp: marketData.fetchedAt,
    riskTone,
    riskColor,
    keyDriver,
    driverColor,
    watch,
    watchColor,
    avoid,
    avoidColor,
  };
}

export const AISessionBrief = React.memo(function AISessionBrief({ className = "" }: { className?: string }) {
  const { data: marketData } = useMarketPrices();

  const { data: reportsData } = useQuery<ReportsResponse | null>({
    queryKey: ["/api/reports"],
    queryFn: async () => {
      const res = await fetch("/api/reports");
      if (!res.ok) return null;
      return res.json();
    },
    staleTime: 300_000,
    retry: 1,
  });

  const brief = useMemo(() => computeBrief(marketData, reportsData), [marketData, reportsData]);

  if (!brief) {
    return (
      <div className={`bg-purple-950/20 rounded-lg border border-white/10 p-2.5 backdrop-blur-[12px] ${className}`}>
        <div className="flex items-center justify-between mb-2">
          <div>
            <h2 className="text-xs font-semibold text-white/90 tracking-wider uppercase">Pre-Session Brief</h2>
            <div className="h-2.5 w-32 rounded bg-purple-900/40 animate-pulse mt-0.5" />
          </div>
          <div className="flex items-center gap-1.5">
            <Clock className="w-3 h-3 text-purple-400/60" />
            <span className="text-xs text-purple-300/50 tracking-tight">--</span>
          </div>
        </div>
        <div className="space-y-2.5">
          {[0, 1, 2, 3].map((i) => (
            <div key={i}>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-900/40 animate-pulse" />
                <span className="h-2.5 w-16 rounded bg-purple-900/40 animate-pulse" />
              </div>
              <div className="h-4 w-5/6 rounded bg-purple-900/40 animate-pulse mt-1" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-purple-950/20 rounded-lg border border-white/10 p-2.5 backdrop-blur-[12px] ${className}`}>
      <div className="flex items-center justify-between mb-2">
        <div>
          <h2 className="text-xs font-semibold text-white/90 tracking-wider uppercase">Pre-Session Brief</h2>
          <span className="text-[10px] text-purple-300/60 font-medium tracking-tight block">{brief.session}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Clock className="w-3 h-3 text-purple-400/60" />
          <span className="text-xs text-purple-300/50 tracking-tight">
            {brief.timestamp ? formatTimeAgo(brief.timestamp) : "--"}
          </span>
        </div>
      </div>

      <div className="space-y-2.5">
        <div className="flex items-center gap-2">
          <span className={`w-1.5 h-1.5 rounded-full ${brief.riskColor}`} />
          <span className="text-[10px] text-purple-400/70 uppercase tracking-wider font-bold">Risk Tone</span>
        </div>
        <p className="text-sm font-semibold text-white -mt-1">{brief.riskTone}</p>

        <div className="flex items-center gap-2">
          <span className={`w-1.5 h-1.5 rounded-full ${brief.driverColor}`} />
          <span className="text-[10px] text-purple-400/70 uppercase tracking-wider font-bold">Key Driver</span>
        </div>
        <p className="text-sm font-semibold text-white -mt-1">{brief.keyDriver}</p>

        <div className="flex items-center gap-2">
          <span className={`w-1.5 h-1.5 rounded-full ${brief.watchColor}`} />
          <span className="text-[10px] text-purple-400/70 uppercase tracking-wider font-bold">Watch</span>
        </div>
        <p className="text-sm font-semibold text-white -mt-1">{brief.watch}</p>

        <div className="flex items-center gap-2">
          <span className={`w-1.5 h-1.5 rounded-full ${brief.avoidColor}`} />
          <span className="text-[10px] text-purple-400/70 uppercase tracking-wider font-bold">Avoid</span>
        </div>
        <p className="text-sm font-semibold text-white -mt-1">{brief.avoid}</p>
      </div>
    </div>
  );
});
