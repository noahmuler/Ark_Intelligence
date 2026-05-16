"use client";

import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
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
  const [now, setNow] = useState(() => new Date("2024-01-01T00:00:00Z")); // Static initial time for consistent SSR
  const [mounted, setMounted] = useState(false);
  
  // Update to real time only after client mount to prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
    setNow(new Date());
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

  const renderRow = (s: SessionDef, compact: boolean = false) => {
    const openStr = formatTime(s.openHour, s.openMinute);
    const closeStr = formatTime(s.closeHour, s.closeMinute);
    const sessionOpen = isOpen(now, s);

    // "Adjusted real-time": we show countdown to next boundary.
    // If open, countdown to close; else countdown to open.
    let countdown = "";
    try {
      const ms = msUntilNextBoundary(now, s);
      const safe = Math.max(0, ms);
      const totalSeconds = Math.floor(safe / 1000);
      const hh = Math.floor(totalSeconds / 3600);
      const mm = Math.floor((totalSeconds % 3600) / 60);
      const ss = totalSeconds % 60;
      if (hh > 0) countdown = `${hh}h ${mm}m`;
      else if (mm > 0) countdown = `${mm}m ${ss}s`;
      else countdown = `${ss}s`;
    } catch {
      countdown = "--";
    }

    const iconSize = compact ? "h-4 w-4" : "h-5 w-5";
    const dotSize = compact ? "h-8 w-8" : "h-10 w-10";
    const fontSize = compact ? "text-sm" : "font-semibold";
    const subFontSize = compact ? "text-[10px]" : "text-xs";

    return (
      <motion.div
        key={s.key}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        whileHover={{ scale: 1.02, backgroundColor: "rgba(139, 92, 246, 0.1)" }}
        transition={{ duration: 0.2 }}
        className="flex items-center justify-between gap-2 rounded-lg p-2 cursor-pointer"
      >
        <div className="flex items-center gap-2">
          <motion.div
            className={`${dotSize} rounded-full flex items-center justify-center ${getDotClasses(
              s.dotColor,
              sessionOpen
            )} transition-colors flex-shrink-0`}
            animate={sessionOpen ? { scale: [1, 1.1, 1] } : { scale: 1 }}
            transition={{ duration: 2, repeat: sessionOpen ? Infinity : 0 }}
          >
            {sessionOpen ? (
              <CheckCircle2 className={`${iconSize} text-emerald-300`} />
            ) : (
              <Clock className={`${iconSize} text-gray-300`} />
            )}
          </motion.div>
          <div className="min-w-0">
            <div className={`${fontSize} text-white truncate`}>{s.key}</div>
            <div className={`${subFontSize} text-purple-200/80`}>{openStr}-{closeStr}</div>
          </div>
        </div>

        <div className="text-right flex-shrink-0">
          <Badge
            variant={sessionOpen ? "default" : "secondary"}
            className={`${sessionOpen ? "bg-purple-600 text-white" : "bg-purple-900/40 text-purple-200"} text-[10px] px-1.5 py-0.5`}
          >
            {sessionOpen ? "OPEN" : "OFF"}
          </Badge>
          <div className={`mt-1 ${subFontSize} text-purple-300/90 font-mono`}>
            {countdown}
          </div>
        </div>
      </motion.div>
    );
  };

  const activeBanner = active.open
    ? { label: "Live", cls: "bg-emerald-500/20 text-emerald-200 border-emerald-400/20" }
    : { label: "Next", cls: "bg-purple-500/20 text-purple-200 border-purple-400/20" };

  const timeZoneOptions = { timeZone: "America/New_York", hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false } as const;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className={"relative overflow-hidden " + className}>
        <motion.div
          className="absolute inset-0 bg-gradient-to-br from-purple-600/5 via-transparent to-blue-600/5"
          animate={{
            backgroundPosition: ["0% 0%", "100% 100%", "0% 0%"],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "linear",
          }}
          style={{ backgroundSize: "200% 200%" }}
        />
        <CardContent className="p-6 relative">
          <div className="flex flex-col items-center text-center gap-4">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5, type: "spring" }}
              className="w-full"
            >
              <div className="flex items-center justify-center gap-3">
                <motion.div
                  className="relative"
                  whileHover={{ scale: 1.1 }}
                  transition={{ duration: 0.2 }}
                >
                  <motion.div
                    className={`h-16 w-16 rounded-full border-2 ${
                      active.open ? "border-emerald-400/70" : "border-purple-400/50"
                    } ${active.open ? "bg-emerald-400/10" : "bg-purple-400/10"} flex items-center justify-center`}
                    animate={active.open ? {
                      boxShadow: ["0 0 0 0 rgba(52, 211, 153, 0.4)", "0 0 0 10px rgba(52, 211, 153, 0)"],
                    } : {}}
                    transition={{ duration: 2, repeat: active.open ? Infinity : 0 }}
                  >
                    {active.open ? (
                      <motion.div
                        className="h-10 w-10 rounded-full bg-emerald-400/20 flex items-center justify-center"
                        animate={{ scale: [1, 1.1, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      >
                        <CheckCircle2 className="h-5 w-5 text-emerald-200" />
                      </motion.div>
                    ) : (
                      <XCircle className="h-6 w-6 text-purple-200/90" />
                    )}
                  </motion.div>
                </motion.div>

                <div className="text-left">
                  <div className="flex items-center gap-2">
                    <motion.span
                      className="text-2xl font-bold text-white"
                      initial={{ x: -20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ duration: 0.3, delay: 0.1 }}
                    >
                      {active.session.key}
                    </motion.span>
                    <motion.span
                      className={`text-xs px-2 py-1 rounded-lg border ${activeBanner.cls}`}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ duration: 0.3, delay: 0.2 }}
                    >
                      {activeBanner.label}
                    </motion.span>
                  </div>
                  <div className="flex items-center gap-4 mt-1">
                    <div className="text-xs text-purple-200/80">
                      Real-time opens/closes in <span className="font-mono">America/New_York</span>.
                    </div>
                    {mounted ? (
                      <motion.div
                        className="text-sm font-mono text-purple-200"
                        animate={{ opacity: [0.7, 1, 0.7] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      >
                        {now.toLocaleTimeString("en-US", timeZoneOptions)}
                      </motion.div>
                    ) : (
                      <div className="text-sm font-mono text-purple-200/50">Loading...</div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div
              className="w-full pt-2"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                {/* Explicit sessions only */}
                {SESSIONS
                  .filter((s) => s.isExplicit)
                  .map((s, index) => (
                    <motion.div
                      key={s.key}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: 0.4 + index * 0.05 }}
                    >
                      {renderRow(s, true)}
                    </motion.div>
                  ))}
              </div>
            </motion.div>

          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

