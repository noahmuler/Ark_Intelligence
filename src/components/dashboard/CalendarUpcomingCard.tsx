"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar as CalendarIcon } from "lucide-react";
import { fetchTodayEconomicEvents } from "@/services/economicCalendar";
import { type EconomicEvent } from "@/services/economicCalendar";

type CalendarEvent = EconomicEvent;

function impactBadge(impact: CalendarEvent["impact"]) {
  switch (impact) {
    case "High":
      return "bg-red-500/15 text-red-200 border-red-500/30";
    case "Medium":
      return "bg-amber-500/15 text-amber-200 border-amber-500/30";
    default:
      return "bg-purple-500/15 text-purple-200 border-purple-400/30";
  }
}

const CalendarUpcomingCard = React.memo(function CalendarUpcomingCard({ className = "" }: { className?: string }) {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      const initial = events.length === 0;
      if (initial) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }
      setError(null);
      try {
        const res = await fetchTodayEconomicEvents();
        if (cancelled) return;
        // On success, update events. If API returns empty array, treat as successful empty result.
        if (res && Array.isArray(res.events)) {
          setEvents(res.events);
        }
      } catch (err: any) {
        if (!cancelled) {
          setError(err?.message ? String(err.message) : 'Failed to load events');
          // Do not clobber existing events on failure; keep previous events visible
        }
      } finally {
        if (cancelled) return;
        if (initial) setLoading(false);
        else setRefreshing(false);
      }
    };

    load();
    const i = setInterval(load, 120000);
    return () => {
      cancelled = true;
      clearInterval(i);
    };
  }, [events.length]);

  // Memoize the upcoming events calculation
  const upcoming = useMemo(() => {
    const now = new Date("2024-01-01T00:00:00.000Z").getTime();
    return events
      .slice()
      .sort((a, b) => a.date.getTime() - b.date.getTime())
      .filter((e) => e.date.getTime() >= now)
      .slice(0, 6);
  }, [events]);

  return (
    <div className={className}>
      <Card className="overflow-hidden min-h-[340px]">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-600/5 via-transparent to-blue-600/5 -z-10" />
        <CardContent className="p-4 relative">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div>
              <div className="flex items-center gap-2">
                <CalendarIcon className="h-4 w-4 text-purple-300" />
                <div className="text-base font-bold text-white">Calendar</div>
              </div>
              <div className="text-xs text-purple-200/70">Recently upcoming events</div>
            </div>
            <Badge variant="outline" className="text-purple-200/80 border-purple-400/30 text-xs">Live</Badge>
          </div>

          <div className="space-y-2">
            {loading ? (
              <div className="text-purple-200/70 text-sm">Loading…</div>
            ) : upcoming.length === 0 ? (
              <div className="text-purple-200/70 text-sm">No upcoming events found.</div>
            ) : (
              upcoming.map((e) => (
                <div key={e.id} className="rounded-xl border border-purple-900/60 bg-purple-950/60 p-3 hover:bg-purple-900/40 transition-colors duration-200">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-white/95 truncate">{e.title}</div>
                      <div className="text-xs text-purple-200/70 mt-1" suppressHydrationWarning>
                        {e.date.toLocaleDateString("en-US", { month: "short", day: "2-digit" })} • {e.time}
                      </div>
                      <div className="text-xs text-purple-200/60 mt-1 line-clamp-2">{e.description}</div>
                    </div>
                    <div className="text-right">
                      <Badge className={impactBadge(e.impact)}>{e.impact}</Badge>
                      <div className="text-xs text-purple-200/60 mt-1">{e.category}</div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
});

export default CalendarUpcomingCard;
