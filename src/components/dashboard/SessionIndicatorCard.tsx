"use client";

import React, { useEffect, useMemo, useState } from "react";
import { utcToZonedTime, zonedTimeToUtc } from 'date-fns-tz';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Clock, XCircle } from "lucide-react";

type DotColor = "emerald" | "amber" | "rose";

type SessionKey =
  | "Sydney"
  | "Asia"
  | "London"
  | "NY AM"
  | "NY Lunch"
  | "NY PM"
  | "Market Close";

type SessionDef = {
  key: SessionKey;
  isExplicit: boolean;
  // Times are anchored to America/New_York local time exactly as in Sessions.txt.
  openHour: number;
  openMinute: number;
  closeHour: number;
  closeMinute: number;
  dotColor: DotColor;

  // If true, the session is only visible when market is open (i.e. NOT during maintenance).
  // (Used for temporary implicit row visibility rules.)
  hideDuringMarketClose?: boolean;
};

const SESSIONS: SessionDef[] = [
  // Explicit (must be in 2nd row)
  {
    key: "Sydney",
    isExplicit: true,
    openHour: 17,
    openMinute: 0,
    closeHour: 2,
    closeMinute: 0,
    dotColor: "amber",
  },
  {
    key: "Asia",
    isExplicit: true,
    openHour: 20,
    openMinute: 0,
    closeHour: 0,
    closeMinute: 0,
    dotColor: "amber",
  },
  {
    key: "London",
    isExplicit: true,
    openHour: 3,
    openMinute: 0,
    closeHour: 12,
    closeMinute: 0,
    dotColor: "emerald",
  },
  {
    key: "NY AM",
    isExplicit: true,
    openHour: 8,
    openMinute: 0,
    closeHour: 12,
    closeMinute: 0,
    dotColor: "rose",
  },
  {
    key: "NY PM",
    isExplicit: true,
    openHour: 13,
    openMinute: 30,
    closeHour: 16,
    closeMinute: 0,
    dotColor: "rose",
  },

  // Implicit (temporarily visible in 1st row)
  {
    key: "NY Lunch",
    isExplicit: false,
    openHour: 12,
    openMinute: 0,
    closeHour: 13,
    closeMinute: 30,
    dotColor: "rose",
  },
  {
    key: "Market Close",
    isExplicit: false,
    openHour: 17,
    openMinute: 0,
    closeHour: 18,
    closeMinute: 0,
    dotColor: "emerald",
  },
];



function pad2(n: number) {
  return n.toString().padStart(2, "0");
}

function formatTime(h: number, m: number) {
  return `${pad2(h)}:${pad2(m)}`;
}

function getNowInEasternParts(now: Date) {
  // We use Intl to derive Eastern time parts without extra deps.
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const parts = dtf.formatToParts(now);
  const partMap: Record<string, string> = {};
  for (const p of parts) {
    if (p.type !== "literal") partMap[p.type] = p.value;
  }
  return {
    year: Number(partMap.year),
    month: Number(partMap.month),
    day: Number(partMap.day),
    hour: Number(partMap.hour),
    minute: Number(partMap.minute),
  };
}

function buildSessionTimesForDate(now: Date, session: SessionDef) {
  // Convert current time to America/New_York zoned time
  const nowEastern = utcToZonedTime(now, 'America/New_York');

  // Start of Eastern day for 'now'
  const startOfDayEastern = new Date(nowEastern);
  startOfDayEastern.setHours(0, 0, 0, 0);

  // Build open/close in Eastern local time
  const openEastern = new Date(startOfDayEastern);
  openEastern.setHours(session.openHour, session.openMinute, 0, 0);

  const closeEastern = new Date(startOfDayEastern);
  closeEastern.setHours(session.closeHour, session.closeMinute, 0, 0);

  // If close is logically next-day relative to open, add one day
  if (closeEastern <= openEastern) {
    closeEastern.setDate(closeEastern.getDate() + 1);
  }

  // Convert Eastern times back to UTC for comparisons
  const openUtc = zonedTimeToUtc(openEastern, 'America/New_York');
  const closeUtc = zonedTimeToUtc(closeEastern, 'America/New_York');

  const parts = getNowInEasternParts(now);
  return { open: openUtc, close: closeUtc, nowParts: parts };
}

function isMarketMaintenanceOpen(now: Date) {
  // Sessions.txt: Weekday Daily Closures (Mon–Thu) 5:00 PM – 6:00 PM NY time
  // These are functionally “closed for active trading” windows.
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const parts = dtf.formatToParts(now);
  const partMap: Record<string, string> = {};
  for (const p of parts) {
    if (p.type !== "literal") partMap[p.type] = p.value;
  }
  const weekday = partMap.weekday; // e.g. Mon, Tue, Wed, Thu

  const hour = Number(partMap.hour);
  const minute = Number(partMap.minute);
  const totalMinutes = hour * 60 + minute;

  const isMonThu = weekday === "Mon" || weekday === "Tue" || weekday === "Wed" || weekday === "Thu";
  if (!isMonThu) return false;

  // 17:00 - 18:00
  return totalMinutes >= 17 * 60 && totalMinutes < 18 * 60;
}

function isOpen(now: Date, session: SessionDef) {
  const { open, close } = buildSessionTimesForDate(now, session);
  const baseOpen = now >= open && now < close;

  // If marked to hide during market close, force OFF during maintenance window.
  if (session.hideDuringMarketClose) {
    if (isMarketMaintenanceOpen(now)) return false;
  }

  return baseOpen;
}


function msUntilNextBoundary(now: Date, session: SessionDef) {
  const { open, close } = buildSessionTimesForDate(now, session);
  const target = isOpen(now, session) ? close : open;
  return target.getTime() - now.getTime();
}

function getDotClasses(color: SessionDef["dotColor"], isSessionOpen: boolean) {
  if (!isSessionOpen) {
    return "bg-gray-500/40 border border-gray-400/30";
  }
  switch (color) {
    case "emerald":
      return "bg-emerald-400/20 border-emerald-400/60";
    case "amber":
      return "bg-amber-300/20 border-amber-300/60";
    case "rose":
      return "bg-rose-400/20 border-rose-400/60";
  }
}

export default function SessionIndicatorCard({ className = "" }: { className?: string }) {
  const [now, setNow] = useState(() => new Date());
  // Delay initial time render to reduce SSR/CSR hydration mismatches.
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);


  const openState = useMemo(() => {
    return SESSIONS.map((s) => ({
      key: s.key,
      open: isOpen(now, s),
      session: s,
    }));
  }, [now]);

  const active = openState.find((x) => x.open) ?? openState[0];

  const renderRow = (s: SessionDef) => {
    const openStr = formatTime(s.openHour, s.openMinute);
    const closeStr = formatTime(s.closeHour, s.closeMinute);
    const sessionOpen = isOpen(now, s);

    // “Adjusted real-time”: we show countdown to next boundary.
    // If open, countdown to close; else countdown to open.
    let countdown = "";
    try {
      const ms = msUntilNextBoundary(now, s);
      const safe = Math.max(0, ms);
      const totalSeconds = Math.floor(safe / 1000);
      const hh = Math.floor(totalSeconds / 3600);
      const mm = Math.floor((totalSeconds % 3600) / 60);
      const ss = totalSeconds % 60;
      if (hh > 0) countdown = `${hh}h ${mm}m ${ss}s`;
      else if (mm > 0) countdown = `${mm}m ${ss}s`;
      else countdown = `${ss}s`;
    } catch {
      countdown = "--";
    }

    return (
      <div key={s.key} className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <div
            className={`h-10 w-10 rounded-full flex items-center justify-center ${getDotClasses(
              s.dotColor,
              sessionOpen
            )} transition-colors`}
          >
            {sessionOpen ? (
              <CheckCircle2 className="h-5 w-5 text-emerald-300" />
            ) : (
              <Clock className="h-5 w-5 text-gray-300" />
            )}
          </div>
          <div>
            <div className="font-semibold text-white">{s.key} Session</div>
            <div className="text-xs text-purple-200/80">Opens {openStr} • Closes {closeStr}</div>
          </div>
        </div>

        <div className="text-right">
          <Badge
            variant={sessionOpen ? "default" : "secondary"}
            className={sessionOpen ? "bg-purple-600 text-white" : "bg-purple-900/40 text-purple-200"}
          >
            {sessionOpen ? "OPEN" : "OFF"}
          </Badge>
          <div className="mt-2 text-xs text-purple-300/90 font-mono">
            Next {sessionOpen ? "close" : "open"}: {countdown}
          </div>
        </div>
      </div>
    );
  };

  const activeBanner = active.open
    ? { label: "Live", cls: "bg-emerald-500/20 text-emerald-200 border-emerald-400/20" }
    : { label: "Next", cls: "bg-purple-500/20 text-purple-200 border-purple-400/20" };

  return (
    <Card className={"relative overflow-hidden " + className}>
      <CardContent className="p-6">
        <div className="flex flex-col items-center text-center gap-4">
          <div className="w-full">
            <div className="flex items-center justify-center gap-3">
              <div className="relative">
                <div
                  className={`h-16 w-16 rounded-full border-2 ${
                    active.open ? "border-emerald-400/70" : "border-purple-400/50"
                  } ${active.open ? "bg-emerald-400/10" : "bg-purple-400/10"} flex items-center justify-center`}
                >
                  {active.open ? (
                    <div className="h-10 w-10 rounded-full bg-emerald-400/20 flex items-center justify-center animate-pulse">
                      <CheckCircle2 className="h-5 w-5 text-emerald-200" />
                    </div>
                  ) : (
                    <XCircle className="h-6 w-6 text-purple-200/90" />
                  )}
                </div>
              </div>

              <div className="text-left">
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold text-white">
                    {active.session.key}
                  </span>
                  <span className={`text-xs px-2 py-1 rounded-lg border ${activeBanner.cls}`}>{activeBanner.label}</span>
                </div>
                <div className="text-xs text-purple-200/80 mt-1">
                  Real-time opens/closes in <span className="font-mono">America/New_York</span>.
                </div>
              </div>
            </div>
          </div>

          <div className="w-full pt-2">
            <div className="grid grid-cols-1 gap-4">
              {/* Row 1: Implicit sessions temporarily visible */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {SESSIONS.filter((s) => !s.isExplicit).map(renderRow)}
              </div>

              {/* Row 2: Explicit sessions */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {SESSIONS.filter((s) => s.isExplicit).map(renderRow)}
              </div>
            </div>
          </div>

        </div>
      </CardContent>
    </Card>
  );
}

