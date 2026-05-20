"use client";

import React, { useEffect, useMemo, useState } from "react";
import { utcToZonedTime } from "date-fns-tz";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type DotColor = "emerald" | "amber" | "rose" | "indigo";

type SessionKey =
  | "Sydney"
  | "Asia"
  | "London"
  | "NY AM"
  | "NY Lunch"
  | "NY PM"
  | "Market Close";

type SessionConfig = {
  key: SessionKey;
  label: string;
  openHour: number;
  openMinute: number;
  closeHour: number;
  closeMinute: number;
  dotColor: DotColor;
  isExplicit: boolean; // True for standard top-row sessions, False for conditional ones
};

const SESSION_CONFIGS: SessionConfig[] = [
  {
    key: "Sydney",
    label: "Sydney Session",
    openHour: 17,
    openMinute: 0,
    closeHour: 2,
    closeMinute: 0,
    dotColor: "amber",
    isExplicit: true,
  },
  {
    key: "Asia",
    label: "Asia Session",
    openHour: 20,
    openMinute: 0,
    closeHour: 0,
    closeMinute: 0,
    dotColor: "indigo",
    isExplicit: true,
  },
  {
    key: "London",
    label: "London Session",
    openHour: 3,
    openMinute: 0,
    closeHour: 12,
    closeMinute: 0,
    dotColor: "emerald",
    isExplicit: true,
  },
  {
    key: "NY AM",
    label: "NY AM Session",
    openHour: 8,
    openMinute: 0,
    closeHour: 12,
    closeMinute: 0,
    dotColor: "rose",
    isExplicit: true,
  },
  {
    key: "NY Lunch",
    label: "NY Lunch Pauses",
    openHour: 12,
    openMinute: 0,
    closeHour: 13,
    closeMinute: 30,
    dotColor: "amber",
    isExplicit: false,
  },
  {
    key: "NY PM",
    label: "NY PM Session",
    openHour: 13,
    openMinute: 30,
    closeHour: 16,
    closeMinute: 0,
    dotColor: "rose",
    isExplicit: true,
  },
];

// Helper to format countdown
function formatDuration(ms: number): string {
  const safeMs = Math.max(0, ms);
  const totalSecs = Math.floor(safeMs / 1000);
  const hours = Math.floor(totalSecs / 3600);
  const mins = Math.floor((totalSecs % 3600) / 60);
  const secs = totalSecs % 60;

  if (hours > 0) {
    return `${hours}h ${mins}m`;
  }
  if (mins > 0) {
    return `${mins}m ${secs}s`;
  }
  return `${secs}s`;
}

// Get session open/close boundaries in NY time
function getSessionTimes(nowNY: Date, openH: number, openM: number, closeH: number, closeM: number) {
  const openTime = new Date(nowNY);
  openTime.setHours(openH, openM, 0, 0);

  const closeTime = new Date(nowNY);
  closeTime.setHours(closeH, closeM, 0, 0);

  if (closeTime <= openTime) {
    if (nowNY.getHours() >= openH) {
      closeTime.setDate(closeTime.getDate() + 1);
    } else {
      openTime.setDate(openTime.getDate() - 1);
    }
  }

  return { openTime, closeTime };
}

// Check market close state based on weekend & weekday rules
function getMarketCloseTimes(nowNY: Date) {
  const weekday = nowNY.getDay(); // 0=Sun, 1=Mon, ..., 6=Sat
  const hour = nowNY.getHours();
  const minute = nowNY.getMinutes();
  const totalMinutes = hour * 60 + minute;

  // Weekend: Friday 17:00 NY Time to Sunday 17:00 NY Time
  const isWeekendClose =
    (weekday === 5 && totalMinutes >= 17 * 60) ||
    weekday === 6 ||
    (weekday === 0 && totalMinutes < 17 * 60);

  // Weekday Daily Closure: Mon-Thu 17:00 to 18:00 NY Time
  const isWeekdayClose =
    weekday >= 1 &&
    weekday <= 4 &&
    totalMinutes >= 17 * 60 &&
    totalMinutes < 18 * 60;

  const isActive = isWeekendClose || isWeekdayClose;

  const targetDate = new Date(nowNY);

  if (isActive) {
    if (isWeekdayClose) {
      // Daily maintenance ends at 18:00
      targetDate.setHours(18, 0, 0, 0);
    } else {
      // Weekend close ends on Sunday at 17:00
      const daysToSunday = (7 - weekday) % 7;
      targetDate.setDate(targetDate.getDate() + daysToSunday);
      targetDate.setHours(17, 0, 0, 0);
    }
  } else {
    // When does the next closure start?
    if (weekday === 5) {
      // Friday before 17:00 -> starts today 17:00
      targetDate.setHours(17, 0, 0, 0);
    } else if (weekday === 0) {
      // Sunday after 17:00 -> starts Monday 17:00
      targetDate.setDate(targetDate.getDate() + 1);
      targetDate.setHours(17, 0, 0, 0);
    } else {
      // Monday - Thursday
      if (totalMinutes < 17 * 60) {
        targetDate.setHours(17, 0, 0, 0);
      } else {
        targetDate.setDate(targetDate.getDate() + 1);
        targetDate.setHours(17, 0, 0, 0);
      }
    }
  }

  return { isActive, targetDate };
}

export default function SessionIndicatorCard({ className = "" }: { className?: string }) {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setNow(new Date());
    }, 0);
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, []);

  const nowNY = useMemo(() => {
    if (!now) return null;
    return utcToZonedTime(now, "America/New_York");
  }, [now]);

  const marketStatus = useMemo(() => {
    if (!nowNY) return { isClosed: false, isWeekend: false, countdown: "" };
    const { isActive, targetDate } = getMarketCloseTimes(nowNY);
    const msLeft = targetDate.getTime() - nowNY.getTime();
    return {
      isClosed: isActive,
      countdown: formatDuration(msLeft),
    };
  }, [nowNY]);

  const sessionsData = useMemo(() => {
    if (!nowNY) return [];

    const weekday = nowNY.getDay();
    const hour = nowNY.getHours();
    const minute = nowNY.getMinutes();
    const totalMinutes = hour * 60 + minute;

    // Standard weekend close (Fri 17:00 to Sun 17:00)
    const isWeekend =
      (weekday === 5 && totalMinutes >= 17 * 60) ||
      weekday === 6 ||
      (weekday === 0 && totalMinutes < 17 * 60);

    return SESSION_CONFIGS.map((cfg) => {
      const { openTime, closeTime } = getSessionTimes(
        nowNY,
        cfg.openHour,
        cfg.openMinute,
        cfg.closeHour,
        cfg.closeMinute
      );

      // Check if session is active
      let active = false;
      if (!isWeekend) {
        if (cfg.openHour > cfg.closeHour) {
          // Cross-midnight session (e.g., Sydney 17:00 - 02:00)
          active = totalMinutes >= cfg.openHour * 60 || totalMinutes < cfg.closeHour * 60;
        } else {
          active = totalMinutes >= cfg.openHour * 60 && totalMinutes < cfg.closeHour * 60;
        }
      }

      // Calculate countdown ms
      let countdownMs = 0;
      if (active) {
        countdownMs = closeTime.getTime() - nowNY.getTime();
      } else {
        if (nowNY < openTime) {
          countdownMs = openTime.getTime() - nowNY.getTime();
        } else {
          countdownMs = openTime.getTime() + 24 * 3600 * 1000 - nowNY.getTime();
        }
      }

      return {
        ...cfg,
        isActive: active,
        countdownText: active
          ? `Ends in ${formatDuration(countdownMs)}`
          : `Opens in ${formatDuration(countdownMs)}`,
      };
    });
  }, [nowNY]);

  // Combine standard sessions and active implicit sessions
  const visibleSessions = useMemo(() => {
    if (!nowNY) return [];

    const list = sessionsData.filter((s) => s.isExplicit || s.isActive);

    // If Market Close is active, add it to the list
    const { isActive, targetDate } = getMarketCloseTimes(nowNY);
    if (isActive) {
      const msLeft = targetDate.getTime() - nowNY.getTime();
      list.push({
        key: "Market Close",
        label: "Market Closed",
        openHour: 17,
        openMinute: 0,
        closeHour: 18,
        closeMinute: 0,
        dotColor: "emerald",
        isExplicit: false,
        isActive: true,
        countdownText: `Opens in ${formatDuration(msLeft)}`,
      });
    }

    return list;
  }, [sessionsData, nowNY]);

  if (!now || !nowNY) {
    return (
      <Card className="rounded-xl border border-white/10 bg-purple-950/30 backdrop-blur-[12px] p-5 text-center min-h-[160px] flex items-center justify-center">
        <span className="text-purple-300/60 text-sm">Syncing with New York clock...</span>
      </Card>
    );
  }

  // Get dot styling classes based on active state and color theme
  const getDotClass = (color: DotColor, active: boolean) => {
    const baseClass = "w-2.5 h-2.5 rounded-full transition-all duration-300";
    if (!active) {
      return `${baseClass} bg-purple-900/40 opacity-40 border border-purple-500/20`;
    }

    // Active glows using a pulse helper
    switch (color) {
      case "emerald":
        return `${baseClass} bg-emerald-400 border border-emerald-300 pulse-dot text-emerald-400`;
      case "amber":
        return `${baseClass} bg-amber-400 border border-amber-300 pulse-dot text-amber-400`;
      case "rose":
        return `${baseClass} bg-rose-400 border border-rose-300 pulse-dot text-rose-400`;
      case "indigo":
        return `${baseClass} bg-indigo-400 border border-indigo-300 pulse-dot text-indigo-400`;
    }
  };

  const nyTimeStr = nowNY.toLocaleTimeString("en-US", {
    timeZone: "America/New_York",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });

  return (
    <Card className={`relative overflow-hidden rounded-xl border border-white/10 bg-purple-950/30 backdrop-blur-[12px] hover:border-purple-500/40 hover:shadow-lg hover:shadow-purple-500/10 transition-all duration-300 ease-in-out ${className}`}>
      {/* Global CSS for pulsing dots */}
      <style>{`
        @keyframes dot-pulse {
          0%, 100% {
            transform: scale(1);
            filter: drop-shadow(0 0 2px currentColor);
            opacity: 0.85;
          }
          50% {
            transform: scale(1.2);
            filter: drop-shadow(0 0 8px currentColor);
            opacity: 1;
          }
        }
        .pulse-dot {
          animation: dot-pulse 2s infinite ease-in-out;
        }
      `}</style>

      <CardContent className="p-4">
        {/* Header Block */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-purple-900/30 pb-3 mb-4">
          <div>
            <div className="text-xs font-bold text-purple-300/70 tracking-widest uppercase">
              Ark Market Desk
            </div>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-lg font-extrabold text-white tracking-wide">
                Trading Sessions
              </span>
              <Badge
                variant="outline"
                className={`text-[10px] uppercase font-bold tracking-wider ${
                  marketStatus.isClosed
                    ? "bg-rose-500/10 text-rose-300 border-rose-500/20"
                    : "bg-emerald-500/10 text-emerald-300 border-emerald-500/20"
                }`}
              >
                {marketStatus.isClosed ? "Market Closed" : "Market Active"}
              </Badge>
            </div>
          </div>

          <div className="text-left sm:text-right flex flex-col sm:items-end">
            <span className="text-xs text-purple-300/60 font-medium">New York Time (EST/EDT)</span>
            <span className="text-2xl font-black text-white font-mono tracking-wider mt-0.5">
              {nyTimeStr}
            </span>
          </div>
        </div>

        {/* Sessions Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3">
          {visibleSessions.map((s) => (
            <div
              key={s.key}
              className={`rounded-xl border p-3 flex flex-col justify-between transition-all duration-300 min-h-[90px] ${
                s.isActive
                  ? "bg-purple-900/20 border-purple-500/40 shadow-md shadow-purple-500/5"
                  : "bg-purple-950/10 border-white/5 opacity-60 hover:opacity-85"
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-white truncate tracking-wide">
                  {s.key}
                </span>
                <div className={getDotClass(s.dotColor, s.isActive)} />
              </div>

              <div className="mt-3">
                <span className="block text-[10px] text-purple-300/50 font-medium leading-none">
                  {s.label}
                </span>
                <span
                  className={`block text-xs font-mono font-bold mt-1.5 ${
                    s.isActive ? "text-purple-200" : "text-purple-300/60"
                  }`}
                >
                  {s.countdownText}
                </span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
