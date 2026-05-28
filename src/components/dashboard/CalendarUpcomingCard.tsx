"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar as CalendarIcon, Clock } from "lucide-react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";

type CalendarEvent = {
  id: string;
  title: string;
  date: Date;
  time: string;
  impact: "High" | "Medium" | "Low";
  category: string;
  description: string;
};

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
  const [currentTime, setCurrentTime] = useState(new Date());
  
  // Fetch economic calendar events from Convex
  const economicEvents = useQuery(api.marketDataQueries.getEconomicCalendar, {});
  const loading = economicEvents === undefined;

  useEffect(() => {
    // Update current time every minute
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  // Transform Convex data to CalendarEvent format
  const events = useMemo(() => {
    if (!economicEvents || economicEvents.length === 0) return [];
    
    return economicEvents.map((event: any) => ({
      id: event.event + event.date,
      title: event.event,
      date: new Date(event.date),
      time: new Date(event.date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      impact: event.importance as "High" | "Medium" | "Low",
      category: "Economic",
      description: `Actual: ${event.actual || 'N/A'}, Forecast: ${event.forecast || 'N/A'}, Previous: ${event.previous || 'N/A'}`,
    }));
  }, [economicEvents]);

  // Memoize the upcoming events calculation
  const upcoming = useMemo(() => {
    const now = new Date().getTime();
    return events
      .slice()
      .sort((a: any, b: any) => a.date.getTime() - b.date.getTime())
      .filter((e: any) => e.date.getTime() >= now)
      .slice(0, 6);
  }, [events]);

  // Format current time
  const formattedTime = currentTime.toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: true 
  });

  return (
    <Card className={`overflow-hidden min-h-[340px] rounded-xl border border-white/10 bg-purple-950/30 backdrop-blur-[12px] hover:border-purple-500/40 hover:shadow-lg hover:shadow-purple-500/10 transition-all duration-300 ease-in-out ${className}`}>
      <CardContent className="p-3 relative">
        <div className="flex items-start justify-between gap-2 mb-3">
          <div>
            <div className="text-xs font-semibold text-white/90 tracking-wider uppercase">Calendar</div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 bg-purple-900/30 px-2 py-1 rounded-full border border-purple-500/20">
              <Clock className="w-3 h-3 text-purple-400/80" />
              <span className="text-xs text-purple-300/80 tracking-tight font-medium">{formattedTime}</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-1 h-1 rounded-full bg-purple-400/60" />
              <span className="text-xs text-purple-300/60 tracking-tight">Live</span>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          {loading ? (
            <div className="text-purple-200/60 text-sm">Loading…</div>
          ) : upcoming.length === 0 ? (
            <div className="text-purple-200/60 text-sm">No upcoming events found.</div>
          ) : (
            upcoming.map((e: any) => (
              <div key={e.id} className="rounded-lg border border-white/5 bg-purple-950/20 p-3 hover:bg-purple-900/20 hover:border-purple-500/30 transition-all duration-300 ease-in-out">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-white/90 truncate tracking-tight">{e.title}</div>
                    <div className="text-xs text-purple-300/70 mt-1 tracking-tight" suppressHydrationWarning>
                      {e.date.toLocaleDateString("en-US", { month: "short", day: "2-digit" })} • {e.time}
                    </div>
                    <div className="text-xs text-purple-300/60 mt-1 line-clamp-2 tracking-tight">{e.description}</div>
                  </div>
                  <div className="text-right">
                    <Badge className={impactBadge(e.impact)}>{e.impact}</Badge>
                    <div className="text-xs text-purple-300/60 mt-1 tracking-tight">{e.category}</div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
});

export default CalendarUpcomingCard;
