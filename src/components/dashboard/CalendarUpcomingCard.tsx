"use client";

import React, { useEffect, useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar as CalendarIcon, Clock, AlertTriangle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  impact: "High" | "Medium" | "Low";
  category: string;
  description: string;
}

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

  const { data, isLoading } = useQuery({
    queryKey: ["calendar-upcoming"],
    queryFn: async () => {
      const res = await fetch("/api/reports");
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
    refetchInterval: 300_000,
    staleTime: 60_000,
  });

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const upcoming = useMemo(() => {
    if (!data?.upcoming) return [];
    const now = new Date().getTime();
    const endOfWeek = now + 7 * 24 * 60 * 60 * 1000; // 7 days ahead
    const events: CalendarEvent[] = data.upcoming
      .filter((e: any) => e.impact === "high" || e.impact === "medium")
      .map((e: any) => ({
        id: e.id + e.releaseDate,
        title: e.name,
        date: e.releaseDate,
        impact: e.impact === "high" ? "High" : "Medium",
        category: e.category,
        description: e.scheduleDescription || "",
      }));
    return events
      .filter((e: CalendarEvent) => {
        const d = new Date(e.date).getTime();
        return d >= now && d <= endOfWeek;
      })
      .slice(0, 6);
  }, [data]);

  const formattedTime = currentTime.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });

  return (
    <Card
      className={`overflow-hidden min-h-[340px] rounded-xl border border-white/10 bg-purple-950/30 backdrop-blur-[12px] hover:border-purple-500/40 hover:shadow-lg hover:shadow-purple-500/10 transition-all duration-300 ease-in-out ${className}`}
    >
      <CardContent className="p-3 relative">
        <div className="flex items-start justify-between gap-2 mb-3">
          <div>
            <div className="text-xs font-semibold text-white/90 tracking-wider uppercase">Calendar</div>
            <div className="text-[10px] text-purple-400/60 mt-0.5">High & Medium Impact USD</div>
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
          {isLoading ? (
            <div className="text-purple-200/60 text-sm">Loading…</div>
          ) : upcoming.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-8 text-purple-400/50">
              <AlertTriangle className="h-6 w-6" />
              <span className="text-sm">No upcoming High/Medium events.</span>
            </div>
          ) : (
            upcoming.map((e) => (
              <div
                key={e.id}
                className="rounded-lg border border-white/5 bg-purple-950/20 p-3 hover:bg-purple-900/20 hover:border-purple-500/30 transition-all duration-300 ease-in-out"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-white/90 truncate tracking-tight">{e.title}</div>
                    <div className="text-xs text-purple-300/70 mt-1 tracking-tight" suppressHydrationWarning>
                      {new Date(e.date).toLocaleDateString("en-US", { month: "short", day: "2-digit" })}
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
