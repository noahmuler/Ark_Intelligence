"use client";

import React, { useState, useEffect, useCallback } from "react";
import { MainLayout } from "@/components/dashboard/MainLayout";
import {
  Calendar,
  TrendingUp,
  TrendingDown,
  Minus,
  RefreshCw,
  AlertTriangle,
} from "lucide-react";

type BiasDirection = "Bullish" | "Bearish" | "Neutral";

interface AssetBias {
  asset: string;
  direction: BiasDirection;
  strength: "High" | "Medium" | "Low";
}

interface MacroEvent {
  id: string;
  date: string;
  time: string;
  eventName: string;
  currency: string;
  impact: string;
  forecast: string | null;
  actual: string | null;
  previous: string | null;
  deviation: string;
  assetBiases: AssetBias[];
  summary: string;
  keyTakeaways: string[];
}

const TARGET_ASSETS = ["XAU", "BTC", "OIL", "DXY", "NQ", "ES"] as const;

// ── Derive asset biases from event data without calling Claude API ────────────
// This logic runs client-side with no cost. Upgrade to Claude API call if desired.
function deriveAssetBiases(event: {
  eventName: string;
  currency: string;
  deviation: string;
  impact: string;
}): AssetBias[] {
  const name = event.eventName.toLowerCase();
  const currency = event.currency.toUpperCase();
  const devNum = parseFloat(event.deviation.replace(/[^0-9.\-]/g, "")) || 0;
  const isPositive = event.deviation.startsWith("+") || devNum > 0;
  const isNegative = event.deviation.startsWith("-") || devNum < 0;
  const isHigh = event.impact === "High";
  const isMed  = event.impact === "Medium";
  const strength = isHigh ? "High" : isMed ? "Medium" : "Low";

  // Rule-based heuristics per event type
  const isInflation  = /cpi|pce|ppi|inflation/.test(name);
  const isEmployment = /payroll|nfp|employment|jobs|unemployment/.test(name);
  const isGDP        = /gdp|growth/.test(name);
  const isFed        = /fomc|fed|powell|rate decision|interest rate/.test(name);
  const isPMI        = /pmi|manufacturing|services/.test(name);
  const isUSD        = currency === "USD";

  const biases: AssetBias[] = TARGET_ASSETS.map((asset) => {
    let direction: BiasDirection = "Neutral";

    if (isInflation && isUSD) {
      if (isPositive) {
        direction = asset === "XAU" || asset === "BTC" ? "Bullish"
                  : asset === "DXY" ? "Bearish"
                  : "Neutral";
      } else if (isNegative) {
        direction = asset === "DXY" ? "Bullish"
                  : asset === "XAU" ? "Bearish"
                  : "Neutral";
      }
    } else if (isEmployment && isUSD) {
      if (isPositive) {
        direction = asset === "DXY" || asset === "ES" || asset === "NQ" ? "Bullish"
                  : asset === "XAU" ? "Bearish"
                  : "Neutral";
      }
    } else if (isFed) {
      if (isPositive) { // hawkish surprise
        direction = asset === "DXY" ? "Bullish"
                  : asset === "XAU" || asset === "BTC" ? "Bearish"
                  : "Neutral";
      } else if (isNegative) { // dovish surprise
        direction = asset === "XAU" || asset === "BTC" || asset === "NQ" || asset === "ES" ? "Bullish"
                  : asset === "DXY" ? "Bearish"
                  : "Neutral";
      }
    } else if (isGDP && isUSD && isPositive) {
      direction = asset === "DXY" || asset === "ES" || asset === "NQ" || asset === "OIL" ? "Bullish"
                : asset === "XAU" ? "Bearish"
                : "Neutral";
    } else if (isPMI && isPositive) {
      direction = asset === "OIL" || asset === "ES" || asset === "NQ" ? "Bullish" : "Neutral";
    }

    return { asset, direction, strength: direction === "Neutral" ? "Low" : strength };
  });

  return biases;
}

function generateSummary(event: {
  eventName: string;
  currency: string;
  forecast: string | null;
  actual: string | null;
  deviation: string;
  impact: string;
}): { summary: string; keyTakeaways: string[] } {
  const name = event.eventName;
  const hasActual = event.actual && event.actual !== "";
  const direction = event.deviation.startsWith("+") ? "above" : event.deviation.startsWith("-") ? "below" : "in line with";

  let summary = hasActual
    ? `${name} came in at ${event.actual}, ${direction} the ${event.forecast ?? "prior"} forecast${event.deviation ? " (deviation: " + event.deviation + ")" : ""}. This ${event.impact.toLowerCase()}-impact ${event.currency} release may influence ${event.currency} pairs and risk sentiment.`
    : `${name} is scheduled for release. Forecast: ${event.forecast ?? "N/A"}. Previous: N/A. Watch for deviation from consensus as a key driver.`;

  const takeaways: string[] = [];
  if (hasActual && event.deviation !== "0") {
    takeaways.push(`${name} ${direction} expectations by ${event.deviation}`);
  }
  if (event.impact === "High") {
    takeaways.push(`High-impact event — expect elevated volatility in ${event.currency} markets`);
  }
  takeaways.push(`Key pairs to watch: ${event.currency}/USD, ${event.currency}/JPY`);
  if (!hasActual) {
    takeaways.push(`Event pending — position sizing advised ahead of release`);
  }

  return { summary, keyTakeaways: takeaways };
}

// ── Fetch real events via the existing /api/calendar/events route ─────────────
async function fetchRecentEvents(): Promise<MacroEvent[]> {
  // Fetch last 5 weekdays of events (covers Mon–Fri of current week)
  const today = new Date();
  const sunday = new Date(today);
  sunday.setDate(today.getDate() - today.getDay());
  const saturday = new Date(sunday);
  saturday.setDate(sunday.getDate() + 6);
  const fmt = (d: Date) => d.toISOString().split("T")[0];

  const res = await fetch(`/api/calendar/events?from=${fmt(sunday)}&to=${fmt(saturday)}`);
  if (!res.ok) throw new Error("Failed to fetch events");
  const raw: Array<{
    id: string; title: string; currency: string; impact: string;
    dateUtc: string; actual: string | null; forecast: string | null; previous: string | null;
  }> = await res.json();

  // Filter to only events that have already happened (have actual data) + high/medium
  // AND include upcoming high-impact events for the week
  const now = Date.now();
  return raw
    .filter(ev => {
      const t = new Date(ev.dateUtc).getTime();
      // Include past events with actual data, or future high-impact events
      return (!isNaN(t) && (t < now || ev.impact === "HIGH" || ev.impact === "MEDIUM"));
    })
    .map((ev, i) => {
      const eventDate = new Date(ev.dateUtc);
      const dateStr = isNaN(eventDate.getTime()) ? ev.dateUtc : eventDate.toLocaleDateString("en-US", { year: "numeric", month: "2-digit", day: "2-digit" });
      const timeStr = isNaN(eventDate.getTime()) ? "" : eventDate.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", timeZoneName: "short" });

      // Compute deviation
      let deviation = "";
      if (ev.actual != null && ev.forecast != null) {
        const a = parseFloat(ev.actual.replace(/[^0-9.\-]/g, ""));
        const f = parseFloat(ev.forecast.replace(/[^0-9.\-]/g, ""));
        if (!isNaN(a) && !isNaN(f)) {
          const diff = a - f;
          deviation = (diff >= 0 ? "+" : "") + diff.toFixed(2).replace(/\.?0+$/, "");
          // Add % if values look like percentages
          if (ev.actual.includes("%")) deviation += "%";
        }
      }

      const biases = deriveAssetBiases({
        eventName: ev.title,
        currency: ev.currency,
        deviation,
        impact: ev.impact === "HIGH" ? "High" : ev.impact === "MEDIUM" ? "Medium" : "Low",
      });

      const { summary, keyTakeaways } = generateSummary({
        eventName: ev.title,
        currency: ev.currency,
        forecast: ev.forecast,
        actual: ev.actual,
        deviation,
        impact: ev.impact === "HIGH" ? "High" : ev.impact === "MEDIUM" ? "Medium" : "Low",
      });

      return {
        id: ev.id || String(i),
        date: dateStr,
        time: timeStr,
        eventName: ev.title,
        currency: ev.currency,
        impact: ev.impact === "HIGH" ? "High" : ev.impact === "MEDIUM" ? "Medium" : "Low",
        forecast: ev.forecast,
        actual: ev.actual,
        previous: ev.previous,
        deviation: deviation || "—",
        assetBiases: biases,
        summary,
        keyTakeaways,
      };
    })
    .slice(0, 20); // cap at 20 events for the feed
}

export default function Reports() {
  const [events, setEvents] = useState<MacroEvent[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<MacroEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchRecentEvents();
      setEvents(data);
      setLastUpdated(new Date());
      if (data.length > 0 && !selectedEvent) {
        setSelectedEvent(data[0]);
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []); // eslint-disable-line

  useEffect(() => { load(); }, [load]);

  const getBiasColor = (direction: BiasDirection) => {
    switch (direction) {
      case "Bullish": return "text-emerald-400 bg-emerald-500/10 border-emerald-500/30";
      case "Bearish": return "text-rose-400 bg-rose-500/10 border-rose-500/30";
      case "Neutral": return "text-purple-400 bg-purple-500/10 border-purple-500/20";
    }
  };

  const getBiasIcon = (direction: BiasDirection) => {
    switch (direction) {
      case "Bullish": return <TrendingUp className="h-3 w-3" />;
      case "Bearish": return <TrendingDown className="h-3 w-3" />;
      case "Neutral": return <Minus className="h-3 w-3" />;
    }
  };

  const getStrengthColor = (strength: string) => {
    switch (strength) {
      case "High": return "text-rose-400";
      case "Medium": return "text-amber-400";
      case "Low": return "text-emerald-400";
      default: return "text-purple-400";
    }
  };

  const getDeviationColor = (deviation: string) => {
    if (deviation.startsWith("+")) return "text-emerald-400";
    if (deviation.startsWith("-")) return "text-rose-400";
    return "text-purple-400";
  };

  const getImpactDot = (impact: string) => {
    switch (impact) {
      case "High": return "bg-rose-500";
      case "Medium": return "bg-amber-500";
      default: return "bg-purple-600";
    }
  };

  return (
    <MainLayout>
      <div className="p-3 sm:p-4 lg:p-6 h-full">
        <div className="max-w-7xl mx-auto">
          {/* Page Header */}
          <div className="mb-6 flex items-start justify-between flex-wrap gap-3">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">Macroeconomic Reports</h1>
              <p className="text-purple-300 text-sm sm:text-base">
                Economic calendar with asset bias analysis for XAU, BTC, OIL, DXY, NQ, ES
              </p>
            </div>
            {/* Live badge + refresh */}
            <div className="flex items-center gap-2 px-3 py-2 bg-purple-950/60 border border-purple-800/40 rounded-lg">
              <span className="relative flex h-2 w-2">
                {loading ? (
                  <span className="animate-spin h-2 w-2 rounded-full border border-purple-400 border-t-transparent" />
                ) : error ? (
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
                ) : (
                  <>
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-60" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
                  </>
                )}
              </span>
              <div className="text-right">
                <div className={`text-xs font-semibold leading-tight ${error ? 'text-red-400' : loading ? 'text-purple-400' : 'text-green-400'}`}>
                  {error ? 'Error' : loading ? 'Loading…' : 'ForexFactory'}
                </div>
                {lastUpdated && !loading && (
                  <div className="text-[10px] text-purple-500 leading-tight">
                    {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                )}
              </div>
              <button
                onClick={load}
                title="Refresh"
                className="ml-1 p-1 rounded text-purple-400 hover:text-purple-200 hover:bg-purple-800/40 transition-colors"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center gap-2 text-red-400 text-sm">
              <AlertTriangle className="h-4 w-4 flex-shrink-0" />
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Event Feed */}
            <div className="lg:col-span-1 space-y-3">
              <div className="flex items-center space-x-2 mb-4">
                <Calendar className="h-5 w-5 text-purple-400" />
                <h2 className="text-lg font-semibold text-white">Event Feed</h2>
                <span className="text-xs text-purple-500">This week</span>
              </div>

              {loading && (
                <div className="space-y-3">
                  {[1,2,3].map(i => (
                    <div key={i} className="h-24 bg-purple-950/40 border border-purple-800/20 rounded-lg animate-pulse" />
                  ))}
                </div>
              )}

              {!loading && events.length === 0 && !error && (
                <div className="text-center py-8 text-purple-500 text-sm">
                  No events found for this week.
                </div>
              )}

              {!loading && events.map((event) => (
                <div
                  key={event.id}
                  onClick={() => setSelectedEvent(event)}
                  className={`backdrop-blur-md bg-purple-950/40 border rounded-lg p-3 cursor-pointer transition-all duration-200 hover:border-purple-500/40 ${
                    selectedEvent?.id === event.id
                      ? "border-purple-500/60 ring-1 ring-purple-500/30"
                      : "border-purple-500/20"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-purple-400">{event.date}</span>
                    <div className="flex items-center gap-1.5">
                      <span className={`inline-block w-1.5 h-1.5 rounded-full ${getImpactDot(event.impact)}`} />
                      <span className="text-xs text-purple-500">{event.impact}</span>
                    </div>
                  </div>
                  <h3 className="text-sm font-semibold text-white mb-1 leading-tight">{event.eventName}</h3>
                  <div className="flex items-center gap-1 mb-2">
                    <span className="text-[10px] font-bold px-1 py-0.5 rounded bg-purple-900/50 text-purple-300 border border-purple-700/30">
                      {event.currency}
                    </span>
                    {event.time && <span className="text-[10px] text-purple-500">{event.time}</span>}
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div>
                      <span className="text-purple-400 block">Forecast</span>
                      <span className="text-white">{event.forecast ?? "—"}</span>
                    </div>
                    <div>
                      <span className="text-purple-400 block">Actual</span>
                      <span className="text-white">{event.actual ?? "—"}</span>
                    </div>
                    <div>
                      <span className="text-purple-400 block">Deviation</span>
                      <span className={getDeviationColor(event.deviation)}>{event.deviation}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Bias Matrix and Summary */}
            <div className="lg:col-span-2 space-y-4">
              {selectedEvent ? (
                <>
                  <div className="backdrop-blur-md bg-purple-950/40 border border-purple-500/20 rounded-lg p-4">
                    <h2 className="text-lg font-semibold text-white mb-1">Asset Bias Matrix</h2>
                    <p className="text-xs text-purple-500 mb-4">{selectedEvent.eventName} · {selectedEvent.currency} · {selectedEvent.impact} Impact</p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {selectedEvent.assetBiases.map((bias) => (
                        <div
                          key={bias.asset}
                          className={`backdrop-blur-sm border rounded-lg p-3 ${getBiasColor(bias.direction)}`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-bold text-sm">{bias.asset}</span>
                            {getBiasIcon(bias.direction)}
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-xs">{bias.direction}</span>
                            <span className={`text-xs font-medium ${getStrengthColor(bias.strength)}`}>
                              {bias.strength}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="backdrop-blur-md bg-purple-950/40 border border-purple-500/20 rounded-lg p-4">
                    <h2 className="text-lg font-semibold text-white mb-3">Report Summary</h2>
                    <p className="text-purple-200 text-sm leading-relaxed mb-4">{selectedEvent.summary}</p>
                    <h3 className="text-sm font-semibold text-purple-300 mb-2">Key Takeaways</h3>
                    <ul className="space-y-1">
                      {selectedEvent.keyTakeaways.map((t, i) => (
                        <li key={i} className="flex items-start text-sm text-purple-200">
                          <span className="text-purple-400 mr-2 mt-0.5">•</span>
                          {t}
                        </li>
                      ))}
                    </ul>
                  </div>
                </>
              ) : (
                <div className="backdrop-blur-md bg-purple-950/40 border border-purple-500/20 rounded-lg p-8 flex items-center justify-center h-full min-h-[400px]">
                  <div className="text-center">
                    <Calendar className="h-12 w-12 text-purple-400 mx-auto mb-4" />
                    <p className="text-purple-300 text-sm">
                      Select an economic event from the feed to view detailed bias analysis
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
