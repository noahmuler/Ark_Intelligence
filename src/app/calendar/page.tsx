"use client";

import React, { useState, useEffect, useRef } from "react";
import { MainLayout } from "@/components/dashboard/MainLayout";
import {
  Clock,
  AlertTriangle,
  ChevronDown,
  Sparkles
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useCalendarEvents, CalendarEvent as ApiCalendarEvent } from "@/hooks/useCalendarEvents";

// ─── Timezone-aware time helper ────────────────────────────────────────────
// ALWAYS use this instead of Date.getHours() / Date.getMinutes()
// Returns { h: number, m: number } in the given IANA timezone
function localHM(date: Date, tz: string): { h: number; m: number } {
  const fmt = new Intl.DateTimeFormat('en-GB', {
    timeZone: tz,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  const parts = fmt.formatToParts(date);
  const h = parseInt(parts.find(p => p.type === 'hour')!.value, 10);
  const m = parseInt(parts.find(p => p.type === 'minute')!.value, 10);
  return { h: isNaN(h) ? 0 : h, m: isNaN(m) ? 0 : m };
}

// Returns YYYY-MM-DD in a given timezone (not UTC)
function localDateString(date: Date, tz: string): string {
  return new Intl.DateTimeFormat('en-CA', {  // en-CA gives YYYY-MM-DD format
    timeZone: tz,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

// Hour markers for the 24h horizontal timeline view (00:00 → 23:00 in 2-hour steps)
const TIME_INTERVALS = ["00:00","02:00","04:00","06:00","08:00","10:00","12:00","14:00","16:00","18:00","20:00","22:00"];


// Helper function to get day columns for weekly view
const getWeekDays = (startDate: Date) => {
  const days = [];
  const current = new Date(startDate);
  const dayOfWeek = current.getDay();
  const startOfWeek = new Date(current);
  startOfWeek.setDate(current.getDate() - dayOfWeek);
  
  for (let i = 0; i < 7; i++) {
    const day = new Date(startOfWeek);
    day.setDate(startOfWeek.getDate() + i);
    days.push({
      date: day,
      label: day.toLocaleDateString('en-US', { weekday: 'short', month: 'numeric', day: 'numeric' })
    });
  }
  return days;
};

// Currency options for filtering
const CURRENCIES = ["EUR", "USD", "GBP", "JPY", "AUD", "CAD", "CHF", "CNY"];

interface CalendarEvent {
  id: string;
  time: string;
  currency: string;
  impact: string;
  title: string;
  confidence: string;
  date: string;
  actual?: string;
  forecast?: string;
  previous?: string;
  description?: string;
  category?: string;
  assets?: string[];
}

const parseApiDate = (dateStr: string): Date => {
  if (/^\d+$/.test(dateStr)) {
    return new Date(parseInt(dateStr, 10));
  }
  return new Date(dateStr);
};

const normalizeCurrency = (currency: string | null | undefined): string => {
  return (currency || "USD").trim().toUpperCase();
};

// Map API event to UI event format
const mapApiEventToUiEvent = (apiEvent: ApiCalendarEvent, tz: string): CalendarEvent => {
  // Handle different date formats from API
  // ForexFactory returns timestamp in milliseconds, JBlanked returns ISO string
  const dateStr = apiEvent.dateUtc;

  // Try parsing as timestamp (milliseconds)
  const date = parseApiDate(dateStr);

  // Check if date is valid
  if (isNaN(date.getTime())) {
    console.warn('[calendar] Invalid date for event:', apiEvent.title, dateStr);
  }

  // Convert impact from uppercase to title case for UI consistency
  const impactMap: Record<string, string> = {
    'HIGH': 'High',
    'MEDIUM': 'Medium',
    'LOW': 'Low',
  };
  const impact = impactMap[apiEvent.impact] || apiEvent.impact;

  return {
    id: apiEvent.id,
    title: apiEvent.title,
    currency: normalizeCurrency(apiEvent.currency),
    impact: impact,
    time: (() => {
      const d = parseApiDate(dateStr);
      if (isNaN(d.getTime())) {
        console.warn('[calendar] Invalid date for time parsing:', apiEvent.title, dateStr);
        return '00:00'; // Fallback time for invalid dates
      }
      const { h, m } = localHM(d, tz);
      return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    })(),
    date: dateStr,
    actual: apiEvent.actual ?? undefined,
    forecast: apiEvent.forecast ?? undefined,
    previous: apiEvent.previous ?? undefined,
    confidence: "62%",
    category: "Economic",
  };
};

export default function CalendarPage() {
  const [mounted, setMounted] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [error, setError] = useState<string | null>(null);
  
  // View type state: 'today', 'tomorrow', 'week', 'custom'
  // Default to weekly view on weekends since ForexFactory has no weekend releases
  const isWeekend = [0, 6].includes(new Date().getDay());
  const [viewType, setViewType] = useState<'today' | 'tomorrow' | 'week' | 'custom'>(
    isWeekend ? 'week' : 'today'
  );
  
  // Filter states - persisted to localStorage
  const [selectedCurrencies, setSelectedCurrencies] = useState<string[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('calendar-currencies');
      return saved ? JSON.parse(saved) : CURRENCIES;
    }
    return CURRENCIES;
  });
  const [selectedImpacts, setSelectedImpacts] = useState<string[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('calendar-impacts');
      return saved ? JSON.parse(saved) : ["High", "Medium", "Low"];
    }
    return ["High", "Medium", "Low"];
  });
  const [timezone] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('calendar-timezone');
      return saved || Intl.DateTimeFormat().resolvedOptions().timeZone;
    }
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  });

  // Save timezone to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('calendar-timezone', timezone);
  }, [timezone]);

  // Live time tracker
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  
  // Expanded AI analysis state
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());
  
  // Filter dropdown states
  const [currencyDropdownOpen, setCurrencyDropdownOpen] = useState(false);
  const [impactDropdownOpen, setImpactDropdownOpen] = useState(false);

  // Ref for auto-scrolling the timeline to current time
  const timelineRef = useRef<HTMLDivElement>(null);

  // Pixel position of the time indicator — recomputed whenever time, view, or container size changes
  // This MUST be in pixels, not %, because left:% inside overflow-x-auto uses clientWidth not scrollWidth
  const [indicatorDailyPx, setIndicatorDailyPx] = useState(0);
  const [indicatorWeekPx, setIndicatorWeekPx] = useState(0);
  const [gradientBackground, setGradientBackground] = useState('none');

  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  
  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (currencyDropdownOpen && !target.closest('.currency-dropdown')) {
        setCurrencyDropdownOpen(false);
      }
      if (impactDropdownOpen && !target.closest('.impact-dropdown')) {
        setImpactDropdownOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [currencyDropdownOpen, impactDropdownOpen]);

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    setMounted(true);
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  // Live time update - uses user's local system time
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Auto-scroll timeline to current time when view switches to daily mode
  useEffect(() => {
    const el = timelineRef.current;
    if (!el) return;

    const id = setTimeout(() => {
      if (viewType === 'tomorrow') {
        // Tomorrow: scroll to start (00:00)
        el.scrollLeft = 0;
        return;
      }

      if (viewType === 'week') {
        const now = new Date();
        const todayKey = localDateString(now, timezone);
        const weekDays = getWeekDays(now);
        const todayIndex = weekDays.findIndex(
          d => localDateString(d.date, timezone) === todayKey
        );
        if (todayIndex >= 0) {
          const colWidth = el.scrollWidth / 7;
          // Show Sun + today's column: scroll to (todayIndex-1) columns from left
          const scrollTarget = Math.max(0, (todayIndex - 1) * colWidth);
          el.scrollLeft = Math.min(scrollTarget, el.scrollWidth - el.clientWidth);
        }
        return;
      }

      if (viewType === 'today') {
        // Use indicatorDailyPx if already computed, otherwise compute inline
        const { h, m } = localHM(new Date(), timezone);
        const px = ((h * 60 + m) / (24 * 60)) * el.scrollWidth;
        const scrollTarget = px - el.clientWidth / 2;
        el.scrollLeft = Math.max(0, Math.min(scrollTarget, el.scrollWidth - el.clientWidth));
        return;
      }
    }, 500);
    return () => clearTimeout(id);
  }, [viewType, mounted, timezone]);

  // Keep indicator pixel positions synced with time + container size
  // This runs every second (driven by currentTime) and also on resize
  useEffect(() => {
    const compute = () => {
      const el = timelineRef.current;
      if (!el) return;
      const sw = el.scrollWidth;
      if (sw === 0) return;

      // Daily: pct of full 24h day
      const { h: dh, m: dm } = localHM(currentTime, timezone);
      const dailyPct = ((dh * 60 + dm) / (24 * 60));
      setIndicatorDailyPx(dailyPct * sw);

      // Week: pct of 7-column layout
      const weekDays = getWeekDays(new Date());
      const todayKey = localDateString(new Date(), timezone);
      const todayIdx = weekDays.findIndex(d => localDateString(d.date, timezone) === todayKey);
      if (todayIdx >= 0) {
        const { h: wh, m: wm } = localHM(currentTime, timezone);
        const colFraction = (wh * 60 + wm) / (24 * 60);
        // Each column = sw/7 wide; today's column starts at todayIdx * (sw/7)
        const weekPct = (todayIdx + colFraction) / 7;
        setIndicatorWeekPx(weekPct * sw);
      }
    };

    compute();

    // Also recompute on container resize (columns may relayout)
    const el = timelineRef.current;
    if (!el) return;
    const ro = new ResizeObserver(compute);
    ro.observe(el);
    return () => ro.disconnect();
  // currentTime changes every second → this runs every second automatically
  }, [currentTime, timezone, viewType]);

  // Use the new useCalendarEvents hook
  const customDateParam = viewType === 'custom'
    ? `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`
    : undefined;
  const { data: apiEvents, isLoading, isError, refetch, dataUpdatedAt } = useCalendarEvents(
    // The hook only accepts 'today' | 'tomorrow' | 'week'; for 'custom' pass 'today'
    // but override with the customDate param so the hook uses that date
    (viewType === 'custom' ? 'today' : viewType) as 'today' | 'tomorrow' | 'week',
    customDateParam
  );

  // Map API events to UI events
  const events = (apiEvents || []).map(ev => mapApiEventToUiEvent(ev, timezone));
  const loading = isLoading;
  const dataSource = isError ? 'Error' : isLoading ? 'Loading…' : 'ForexFactory';

  // Track when data was last successfully fetched
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (dataUpdatedAt && !isLoading && !isError) {
      setLastUpdated(new Date(dataUpdatedAt));
    }
  }, [dataUpdatedAt, isLoading, isError]);
  /* eslint-enable react-hooks/set-state-in-effect */

  // Set error state based on isError (in useEffect to avoid render-phase update)
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (isError) {
      setError("Failed to load economic events");
    } else {
      setError(null);
    }
  }, [isError]);
  /* eslint-enable react-hooks/set-state-in-effect */

  // Compute gradient background based on timeline ref and indicator position
  useEffect(() => {
    const el = timelineRef.current;
    if (!el || el.scrollWidth === 0) {
      setGradientBackground('none');
      return;
    }
    const px = viewType === 'week' ? indicatorWeekPx : indicatorDailyPx;
    const gradPct = (px / el.scrollWidth) * 100;
    setGradientBackground(`radial-gradient(circle at ${gradPct}% 50%, rgba(147, 51, 234, 0.15) 0%, transparent 60%)`);
  }, [viewType, indicatorWeekPx, indicatorDailyPx]);

  if (!mounted) return null;

  // Filter events based on selected currencies and impacts
  const filteredEvents = events.filter(event => {
    // Filter out events with empty or invalid dates
    if (!event.date || event.date.trim() === '') {
      return false;
    }
    const currencyMatch = selectedCurrencies.length === 0 || selectedCurrencies.includes(normalizeCurrency(event.currency));
    const impactMatch = selectedImpacts.length === 0 || selectedImpacts.includes(event.impact);
    return currencyMatch && impactMatch;
  });

  // Helper to parse date string (handles both timestamp and ISO formats)
  const parseEventDate = parseApiDate;

  // Group events by time interval (for daily view)
  const getEventsForInterval = (interval: string, targetDate?: Date) => {
    const [hour] = interval.split(':').map(Number);
    // Use targetDate if provided (for Tomorrow view), otherwise use today
    const dateToFilter = targetDate || new Date();
    // Use local timezone date string for consistency with hour filtering
    const targetDateKey = localDateString(dateToFilter, timezone);
    return filteredEvents.filter(event => {
      const eventDate = parseEventDate(event.date);
      if (isNaN(eventDate.getTime())) {
        console.warn('[calendar] Invalid date for interval filtering:', event.date);
        return false;
      }
      // Filter by date first - use local timezone for consistency
      const eventDateKey = localDateString(eventDate, timezone);
      if (eventDateKey !== targetDateKey) {
        return false;
      }
      // Then filter by hour using the user's timezone
      const { h: eventHour } = localHM(eventDate, timezone);
      const matches = eventHour >= hour && eventHour < hour + 2;
      return matches;
    });
  };

  // ─── Weekend / empty state for daily view ────────────────────────────────────
  // Get "today" and "tomorrow" in local timezone to avoid UTC midnight issues
  const getTodayLocal = () => {
    const now = new Date();
    // Create a date object representing midnight in the user's timezone
    const localStr = localDateString(now, timezone); // YYYY-MM-DD
    const [y, mo, da] = localStr.split('-').map(Number);
    return new Date(y, mo - 1, da);
  };
  const targetDate = viewType === 'tomorrow' ? (() => {
    const t = getTodayLocal();
    t.setDate(t.getDate() + 1);
    return t;
  })() : getTodayLocal();
  const isWeekendDay = [0, 6].includes(targetDate.getDay());

  const totalDailyEvents = TIME_INTERVALS.reduce(
    (sum, interval) => sum + getEventsForInterval(interval, targetDate).length, 0
  );
  const showWeekendEmptyState = (viewType === 'today' || viewType === 'tomorrow') && totalDailyEvents === 0 && !loading;

  // Group events by day (for weekly view)
  const getEventsForDay = (dayDate: Date) => {
    const dayKey = localDateString(dayDate, timezone);
    return filteredEvents.filter(event => {
      const eventDate = parseEventDate(event.date);
      if (isNaN(eventDate.getTime())) return false;
      return localDateString(eventDate, timezone) === dayKey;
    });
  };

  const toggleCardExpansion = (cardId: string) => {
    setExpandedCards(prev => {
      const newSet = new Set(prev);
      if (newSet.has(cardId)) {
        newSet.delete(cardId);
      } else {
        newSet.add(cardId);
      }
      return newSet;
    });
  };

  const toggleCurrency = (currency: string) => {
    setSelectedCurrencies(prev => {
      const next = prev.includes(currency)
        ? prev.filter(c => c !== currency)
        : [...prev, currency];
      localStorage.setItem('calendar-currencies', JSON.stringify(next));
      return next;
    });
  };

  const toggleImpact = (impact: string) => {
    setSelectedImpacts(prev => {
      const next = prev.includes(impact)
        ? prev.filter(i => i !== impact)
        : [...prev, impact];
      localStorage.setItem('calendar-impacts', JSON.stringify(next));
      return next;
    });
  };

  // Helper functions for styling
  const getImpactColor = (impact: string) => {
    switch (impact) {
      case "High":   return "border-red-500/40 hover:border-red-400/70";
      case "Medium": return "border-amber-500/30 hover:border-amber-400/60";
      case "Low":    return "border-purple-700/30 hover:border-purple-600/40";
      default:       return "border-purple-600/40 hover:border-purple-500/50";
    }
  };

  const getImpactBadgeColor = (impact: string) => {
    switch (impact) {
      case "High":   return "text-red-300 bg-red-500/15 border-red-500/50";
      case "Medium": return "text-amber-300 bg-amber-500/15 border-amber-500/50";
      case "Low":    return "text-purple-300 bg-purple-500/10 border-purple-600/30";
      default:       return "text-purple-300 bg-purple-500/10 border-purple-600/30";
    }
  };

  const generateAIAnalysis = (event: CalendarEvent) => {
    // Generate AI analysis based on event data
    const analysis = [];
    
    if (event.actual && event.forecast) {
      const actualNum = parseFloat(event.actual.replace(/[^0-9.-]/g, ''));
      const forecastNum = parseFloat(event.forecast.replace(/[^0-9.-]/g, ''));
      const diff = actualNum - forecastNum;
      const direction = diff > 0 ? "above" : diff < 0 ? "below" : "in line with";
      analysis.push(`The actual reading came ${direction} the forecast of ${event.forecast}.`);
    }
    
    if (event.impact === "High") {
      analysis.push(`Given the high impact rating, this event is likely to cause significant volatility in ${event.currency} markets.`);
    }
    
    if (event.category === "Fed" || event.category === "Macro") {
      analysis.push(`Central bank decisions typically influence currency valuations and bond yields across global markets.`);
    }
    
    if (analysis.length === 0) {
      analysis.push(`This ${event.category || 'economic'} event may influence ${event.currency} depending on the actual vs forecast deviation.`);
    }
    
    return analysis.join(" ");
  };

  // Format current time with user's local system timezone and GMT offset
  const formatCurrentTime = () => {
    const now = new Date();
    // Show time in the selected timezone, not browser OS timezone
    const { h, m } = localHM(now, timezone);
    const s = parseInt(
      new Intl.DateTimeFormat('en-GB', { timeZone: timezone, second: '2-digit', hour12: false })
        .formatToParts(now)
        .find(p => p.type === 'second')!.value,
      10
    );
    const timeStr = `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;

    // Compute the offset for this timezone using Intl.DateTimeFormat
    // This is more reliable than the previous approach
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      timeZoneName: 'longOffset',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });
    const parts = formatter.formatToParts(now);
    const timeZonePart = parts.find(p => p.type === 'timeZoneName');
    let gmtOffset = 'GMT+0';
    if (timeZonePart) {
      // Parse offset hours and minutes; display as GMT+3 not GMT+03:00
      const match = timeZonePart.value.match(/GMT([+-])(\d{2}):(\d{2})/);
      if (match) {
        const sign = match[1];
        const hours = parseInt(match[2], 10);   // strip leading zero: "03" → 3
        const mins  = parseInt(match[3], 10);
        gmtOffset = mins > 0
          ? `GMT${sign}${hours}:${String(mins).padStart(2, '0')}`  // e.g. GMT+5:30
          : `GMT${sign}${hours}`;                                    // e.g. GMT+3
      }
    }

    return `${timeStr} ${gmtOffset}`;
  };

  return (
    <MainLayout>
      <div className="flex flex-col min-h-screen">
          {/* Page Header */}
          <div className="py-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">Economic Calendar</h1>
                <p className="text-purple-300 text-sm sm:text-base">
                  Live macroeconomic events with AI-powered analysis
                </p>
              </div>
              {/* ── Live data source badge ── */}
              <div className="flex items-center gap-3 px-4 py-2.5 bg-gradient-to-r from-purple-950/80 to-purple-900/60 border border-purple-700/50 rounded-xl shadow-lg backdrop-blur-md">
                {/* Status dot with glow effect */}
                <div className="relative flex h-3 w-3 flex-shrink-0">
                  {isLoading ? (
                    <div className="relative inline-flex h-3 w-3">
                      <div className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></div>
                      <div className="relative inline-flex rounded-full h-3 w-3 bg-purple-500 border border-purple-400"></div>
                    </div>
                  ) : isError ? (
                    <div className="relative inline-flex h-3 w-3">
                      <div className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></div>
                      <div className="relative inline-flex rounded-full h-3 w-3 bg-red-500 border border-red-400 shadow-[0_0_8px_rgba(239,68,68,0.6)]"></div>
                    </div>
                  ) : (
                    <div className="relative inline-flex h-3 w-3">
                      <div className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></div>
                      <div className="relative inline-flex rounded-full h-3 w-3 bg-green-500 border border-green-400 shadow-[0_0_8px_rgba(34,197,94,0.6)]"></div>
                    </div>
                  )}
                </div>
                {/* Label */}
                <div className="text-right">
                  <div className={`text-xs font-bold leading-tight tracking-wide ${
                    isError ? 'text-red-400' : isLoading ? 'text-purple-300' : 'text-green-400'
                  }`}>
                    {dataSource}
                  </div>
                  {lastUpdated && !isLoading && (
                    <div className="text-[9px] text-purple-400/80 leading-tight font-medium">
                      Updated {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  )}
                </div>
                {/* Refresh button with enhanced styling */}
                <button
                  onClick={() => refetch()}
                  title="Refresh calendar data"
                  className={`ml-2 p-2 rounded-lg bg-purple-800/40 text-purple-300 hover:text-white hover:bg-purple-700/60 transition-all duration-200 border border-purple-600/30 hover:border-purple-500/50 hover:shadow-[0_0_12px_rgba(168,85,247,0.4)] ${isLoading ? 'animate-spin' : ''}`}
                  disabled={isLoading}
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {/* Top Filtering Utility Belt */}
          <div className="mb-4 flex flex-wrap items-center gap-4 py-2">
            {/* Date Selectors - Today, Tomorrow, This Week */}
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => setViewType('today')}
                className={`px-3 py-1.5 text-sm rounded transition-colors ${
                  viewType === 'today'
                    ? 'text-white bg-purple-700/50 border border-purple-500/50'
                    : 'text-purple-300 hover:text-white hover:bg-purple-800/50'
                }`}
              >
                Today
              </button>
              <button
                type="button"
                onClick={() => setViewType('tomorrow')}
                className={`px-3 py-1.5 text-sm rounded transition-colors ${
                  viewType === 'tomorrow'
                    ? 'text-white bg-purple-700/50 border border-purple-500/50'
                    : 'text-purple-300 hover:text-white hover:bg-purple-800/50'
                }`}
              >
                Tomorrow
              </button>
              <button
                type="button"
                onClick={() => setViewType('week')}
                className={`px-3 py-1.5 text-sm rounded transition-colors ${
                  viewType === 'week'
                    ? 'text-white bg-purple-700/50 border border-purple-500/50'
                    : 'text-purple-300 hover:text-white hover:bg-purple-800/50'
                }`}
              >
                This Week
              </button>
              <label className="sr-only" htmlFor="calendar-custom-date">Custom date</label>
              <input
                id="calendar-custom-date"
                type="date"
                value={`${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`}
                onChange={(e) => {
                  const [year, month, day] = e.target.value.split('-').map(Number);
                  setSelectedDate(new Date(year, month - 1, day));
                  setViewType('custom');
                }}
                className={`bg-purple-900/30 text-white text-sm rounded px-2 py-1.5 border transition-colors ${
                  viewType === 'custom'
                    ? 'border-purple-500/50 focus:ring-1 focus:ring-purple-500/30'
                    : 'border-purple-700/30 focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/30'
                }`}
              />
            </div>

            {/* Right side controls */}
            <div className="flex items-center gap-4 ml-auto">
              {/* Currency Dropdown */}
              <div className="relative currency-dropdown">
                <button
                  type="button"
                  onClick={() => setCurrencyDropdownOpen(!currencyDropdownOpen)}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm rounded bg-purple-900/30 text-purple-300 border border-purple-700/30 hover:border-purple-500/50 transition-colors"
                >
                  <span>Currency</span>
                  <ChevronDown className={`h-3 w-3 transition-transform ${currencyDropdownOpen ? 'rotate-180' : ''}`} />
                </button>
                {currencyDropdownOpen && (
                  <div className="absolute top-full left-0 mt-2 bg-purple-900/95 backdrop-blur-md border border-purple-900/40 rounded-lg shadow-xl z-50 p-2 min-w-[200px]">
                    {CURRENCIES.map(currency => (
                      <label key={currency} className="flex items-center gap-2 px-2 py-1.5 hover:bg-purple-800/30 rounded cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedCurrencies.includes(currency)}
                          onChange={() => toggleCurrency(currency)}
                          className="w-4 h-4 rounded border-purple-500/50 bg-purple-900/50 text-purple-500 focus:ring-purple-500/50 focus:ring-offset-0"
                        />
                        <span className="text-sm text-purple-300">{currency}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              {/* Impact Dropdown */}
              <div className="relative impact-dropdown">
                <button
                  type="button"
                  onClick={() => setImpactDropdownOpen(!impactDropdownOpen)}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm rounded bg-purple-900/30 text-purple-300 border border-purple-700/30 hover:border-purple-500/50 transition-colors"
                >
                  <span>Impact</span>
                  <ChevronDown className={`h-3 w-3 transition-transform ${impactDropdownOpen ? 'rotate-180' : ''}`} />
                </button>
                {impactDropdownOpen && (
                  <div className="absolute top-full left-0 mt-2 bg-purple-900/95 backdrop-blur-md border border-purple-900/40 rounded-lg shadow-xl z-50 p-2 min-w-[200px]">
                    {["High", "Medium", "Low"].map(impact => (
                      <label key={impact} className="flex items-center gap-2 px-2 py-1.5 hover:bg-purple-800/30 rounded cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedImpacts.includes(impact)}
                          onChange={() => toggleImpact(impact)}
                          className="w-4 h-4 rounded border-purple-500/50 bg-purple-900/50 text-purple-500 focus:ring-purple-500/50 focus:ring-offset-0"
                        />
                        <span className="text-sm text-purple-300">{impact}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              {/* Timezone Static Badge */}
              <div className="flex items-center gap-2 px-3 py-1.5 bg-purple-900/40 border border-purple-500/30 rounded-full">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-500"></span>
                </span>
                <span className="text-xs text-purple-300 font-medium">
                  Timezone: {Intl.DateTimeFormat().resolvedOptions().timeZone}
                </span>
              </div>
            </div>

          </div>

          {/* Error Display */}
          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
              <div className="flex items-center gap-2 text-red-400">
                <AlertTriangle className="h-5 w-5" />
                <span>{error}</span>
              </div>
            </div>
          )}


          {/* Horizontal Timeline Canvas */}

          <div className="relative min-h-[calc(100vh-220px)] mb-0 -mx-4 sm:-mx-6 lg:-mx-8 xl:-mx-12 2xl:-mx-16">
            {/* Spotlight Effect - Dynamic radial gradient following current-time marker */}
            <div
              className="absolute inset-0 pointer-events-none z-0 transition-all duration-1000 ease-in-out"
              style={{ background: gradientBackground }}
            />

            {/* Timeline Container - Unified Horizontal Scroll */}
            <div className="h-full w-full flex flex-row overflow-x-auto scrollbar-thin relative snap-x snap-mandatory" style={{ position: 'relative' }} ref={timelineRef}>
              {viewType === 'week' ? (
                // Weekly View - Day Columns
                <>
                  {/* ── Current-time indicator for Week view ── */}
                  {/* Only show if today falls within the displayed week */}
                  {(() => {
                    const weekDays = getWeekDays(new Date());
                    const todayKey = localDateString(new Date(), timezone);
                    const todayInWeek = weekDays.some(
                      d => localDateString(d.date, timezone) === todayKey
                    );
                    if (!todayInWeek || indicatorWeekPx === 0) return null;

                    return (
                      <div
                        key="time-indicator-week"
                        className="absolute bottom-0 pointer-events-none"
                        style={{ left: `${indicatorWeekPx}px`, top: '24px', width: 0, zIndex: 2 }}
                      >
                        {/* Vertical line — rendered behind cards but with strong glow */}
                        <div
                          className="absolute bottom-0"
                          style={{
                            top: '48px',
                            width: '3px',
                            left: '-1.5px', // center on the anchor point
                            zIndex: 1,
                            background: 'linear-gradient(to bottom, rgba(192,132,252,1) 0%, rgba(168,85,247,0.85) 50%, rgba(139,92,246,0.3) 85%, transparent 100%)',
                            boxShadow: '0 0 12px 4px rgba(168,85,247,0.6), 0 0 24px 8px rgba(109,40,217,0.3)',
                            borderRadius: '2px',
                          }}
                        />
                        {/* Wide glow halo behind the line for maximum visibility */}
                        <div
                          className="absolute bottom-0"
                          style={{
                            top: '48px',
                            width: '20px',
                            left: '-10px',
                            zIndex: 0,
                            background: 'linear-gradient(to bottom, rgba(139,92,246,0.25) 0%, rgba(139,92,246,0.1) 60%, transparent 100%)',
                            pointerEvents: 'none',
                          }}
                        />
                        {/* Time bubble — sits above the column label row */}
                        <div
                          className="absolute -translate-x-1/2 flex items-center gap-2 text-white text-xs font-mono px-3 py-1.5 rounded-full whitespace-nowrap"
                          style={{
                            top: '-20px',
                            zIndex: 50,
                            background: 'linear-gradient(135deg, rgba(109,40,217,1) 0%, rgba(88,28,135,1) 100%)',
                            border: '1.5px solid rgba(216,180,254,0.7)',
                            boxShadow: '0 0 0 4px rgba(109,40,217,0.3), 0 0 20px 6px rgba(109,40,217,0.6)',
                            backdropFilter: 'blur(12px)',
                          }}
                        >
                          <Clock className="h-3.5 w-3.5 text-purple-200" />
                          <span className="font-semibold tracking-wide">{formatCurrentTime()}</span>
                        </div>
                      </div>
                    );
                  })()}
                  {getWeekDays(new Date()).map((day, dayIndex) => {
                  const dayEvents = getEventsForDay(day.date);
                  
                  return (
                    <div key={day.label} className="flex-shrink-0 w-[280px] sm:w-[320px] lg:w-[360px] xl:w-[400px] 2xl:w-[440px] min-h-[520px] flex flex-col gap-4 px-2 pt-2 border-r border-purple-950/20 snap-start">
                      {/* Day Label at Top */}
                      <div className="text-xs text-purple-400/60 font-medium">
                        {day.label}
                      </div>

                      {/* Event Cards */}
                      {dayEvents.length > 0 ? (
                        dayEvents.map((event, eventIndex) => (
                          <motion.div
                            key={event.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: dayIndex * 0.05 + eventIndex * 0.03 }}
                            className="group relative z-[3]"
                          >
                            <div className={`group relative bg-purple-950/80 backdrop-blur-md border rounded-lg p-3 shadow-lg transition-all duration-300 ${getImpactColor(event.impact)}`}>
                              {/* Glowing effect */}
                              <div className="absolute inset-0 bg-gradient-to-r from-purple-500/0 via-purple-500/10 to-purple-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl" />
                              <div className="absolute inset-0 bg-gradient-to-b from-purple-500/0 via-purple-500/5 to-purple-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                              {/* Card Header */}
                              <div className="flex items-center justify-between mb-2">
                                <div className="text-xs font-mono text-purple-300/80">
                                  {event.time}
                                </div>
                                <div className="flex items-center space-x-2">
                                  <span className="px-1.5 py-0.5 text-xs rounded font-bold text-purple-300 border border-purple-500/30">
                                    {event.currency || "USD"}
                                  </span>
                                  <span className={`px-1.5 py-0.5 text-xs rounded font-semibold border ${getImpactBadgeColor(event.impact)}`}>
                                    {event.impact}
                                  </span>
                                </div>
                              </div>

                              {/* Card Title */}
                              <h3 className="text-sm font-bold text-purple-100 mb-2 leading-tight">
                                {event.title}
                              </h3>

                              {/* AI Analysis Dropdown */}
                              <div className="mb-2">
                                <button
                                  onClick={() => toggleCardExpansion(event.id)}
                                  className="flex items-center space-x-1.5 text-xs text-purple-300/80 hover:text-purple-200 transition-colors"
                                >
                                  <Sparkles className="h-3 w-3" />
                                  <span className="font-medium">✨ AI ANALYSIS</span>
                                  <ChevronDown 
                                    className={`h-3 w-3 transition-transform ${expandedCards.has(event.id) ? 'rotate-180' : ''}`} 
                                  />
                                </button>
                                <AnimatePresence>
                                  {expandedCards.has(event.id) && (
                                    <motion.div
                                      initial={{ height: 0, opacity: 0 }}
                                      animate={{ height: 'auto', opacity: 1 }}
                                      exit={{ height: 0, opacity: 0 }}
                                      transition={{ duration: 0.3 }}
                                      className="overflow-hidden"
                                    >
                                      <div className="mt-2 p-2 bg-purple-900/40 rounded border border-purple-700/20">
                                        <p className="text-xs text-purple-200/80 leading-relaxed">
                                          {generateAIAnalysis(event)}
                                        </p>
                                      </div>
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </div>

                              {/* Confidence Rating Footer */}
                              <div className="flex items-center pt-2 border-t border-purple-700/20">
                                <span className="text-xs text-purple-400/80 font-medium">
                                  Confidence: {event.confidence || "62%"}
                                </span>
                              </div>
                            </div>
                          </motion.div>
                        ))
                      ) : (
                        <div className="text-center py-8 text-purple-400/50 text-sm">
                          No events
                        </div>
                      )}
                    </div>
                  );
                })}
                </>
              ) : (
                // Daily View - Hour Columns
                <>
                  {/* ── Current-time indicator ── lives inside the flex row so it scrolls with content */}
                  {/* Only show on Today tab, not Tomorrow or Custom */}
                  {viewType === 'today' && indicatorDailyPx > 0 && (() => {
                    return (
                      <div
                        key="time-indicator"
                        className="absolute top-0 bottom-0 pointer-events-none"
                        style={{ left: `${indicatorDailyPx}px`, width: 0, zIndex: 2 }}
                      >
                        {/* Vertical line — behind cards, high glow for visibility */}
                        <div
                          className="absolute bottom-0"
                          style={{
                            top: '44px',
                            width: '3px',
                            left: '-1.5px',
                            zIndex: 1,
                            background: 'linear-gradient(to bottom, rgba(192,132,252,1) 0%, rgba(168,85,247,0.85) 50%, rgba(139,92,246,0.3) 85%, transparent 100%)',
                            boxShadow: '0 0 12px 4px rgba(168,85,247,0.6), 0 0 24px 8px rgba(109,40,217,0.3)',
                            borderRadius: '2px',
                          }}
                        />
                        {/* Glow halo */}
                        <div
                          className="absolute bottom-0"
                          style={{
                            top: '44px',
                            width: '24px',
                            left: '-12px',
                            zIndex: 0,
                            background: 'linear-gradient(to bottom, rgba(139,92,246,0.2) 0%, rgba(139,92,246,0.08) 60%, transparent 100%)',
                            pointerEvents: 'none',
                          }}
                        />
                        {/* Time bubble — zIndex:50 → ABOVE everything */}
                        <div
                          className="absolute top-[6px] -translate-x-1/2 flex items-center gap-1.5 text-white text-xs font-mono px-3 py-1.5 rounded-full whitespace-nowrap"
                          style={{
                            zIndex: 50,
                            background: 'linear-gradient(135deg, rgba(109,40,217,0.98) 0%, rgba(88,28,135,0.98) 100%)',
                            border: '1px solid rgba(192,132,252,0.5)',
                            boxShadow: '0 0 0 3px rgba(109,40,217,0.25), 0 4px 16px rgba(109,40,217,0.5)',
                            backdropFilter: 'blur(8px)',
                          }}
                        >
                          <Clock className="h-3 w-3 text-purple-300" />
                          <span>{formatCurrentTime()}</span>
                        </div>
                      </div>
                    );
                  })()}
                  {TIME_INTERVALS.map((interval, intervalIndex) => {
                  const intervalEvents = getEventsForInterval(interval, targetDate);
                  
                  return (
                    <div key={interval} className="flex-shrink-0 w-[280px] sm:w-[320px] lg:w-[360px] xl:w-[400px] 2xl:w-[440px] min-h-[520px] flex flex-col gap-4 px-2 pt-2 border-r border-purple-950/20 snap-start">
                      {/* Hour Label at Top */}
                      <div className="text-xs text-purple-400/60 font-medium">
                        {interval}
                      </div>

                      {/* Event Cards */}
                      {intervalEvents.length > 0 ? (
                        intervalEvents.map((event, eventIndex) => (
                          <motion.div
                            key={event.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: intervalIndex * 0.05 + eventIndex * 0.03 }}
                            className="group relative z-[3]"
                          >
                            <div className={`group relative bg-purple-950/80 backdrop-blur-md border rounded-lg p-3 shadow-lg transition-all duration-300 ${getImpactColor(event.impact)}`}>
                              {/* Glowing effect */}
                              <div className="absolute inset-0 bg-gradient-to-r from-purple-500/0 via-purple-500/10 to-purple-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl" />
                              <div className="absolute inset-0 bg-gradient-to-b from-purple-500/0 via-purple-500/5 to-purple-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                              {/* Card Header */}
                              <div className="flex items-center justify-between mb-2">
                                <div className="text-xs font-mono text-purple-300/80">
                                  {event.time}
                                </div>
                                <div className="flex items-center space-x-2">
                                  <span className="px-1.5 py-0.5 text-xs rounded font-bold text-purple-300 border border-purple-500/30">
                                    {event.currency || "USD"}
                                  </span>
                                  <span className={`px-1.5 py-0.5 text-xs rounded font-semibold border ${getImpactBadgeColor(event.impact)}`}>
                                    {event.impact}
                                  </span>
                                </div>
                              </div>

                              {/* Card Title */}
                              <h3 className="text-sm font-bold text-purple-100 mb-2 leading-tight">
                                {event.title}
                              </h3>

                              {/* AI Analysis Dropdown */}
                              <div className="mb-2">
                                <button
                                  onClick={() => toggleCardExpansion(event.id)}
                                  className="flex items-center space-x-1.5 text-xs text-purple-300/80 hover:text-purple-200 transition-colors"
                                >
                                  <Sparkles className="h-3 w-3" />
                                  <span className="font-medium">✨ AI ANALYSIS</span>
                                  <ChevronDown 
                                    className={`h-3 w-3 transition-transform ${expandedCards.has(event.id) ? 'rotate-180' : ''}`} 
                                  />
                                </button>
                                <AnimatePresence>
                                  {expandedCards.has(event.id) && (
                                    <motion.div
                                      initial={{ height: 0, opacity: 0 }}
                                      animate={{ height: 'auto', opacity: 1 }}
                                      exit={{ height: 0, opacity: 0 }}
                                      transition={{ duration: 0.3 }}
                                      className="overflow-hidden"
                                    >
                                      <div className="mt-2 p-2 bg-purple-900/40 rounded border border-purple-700/20">
                                        <p className="text-xs text-purple-200/80 leading-relaxed">
                                          {generateAIAnalysis(event)}
                                        </p>
                                      </div>
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </div>

                              {/* Confidence Rating Footer */}
                              <div className="flex items-center pt-2 border-t border-purple-700/20">
                                <span className="text-xs text-purple-400/80 font-medium">
                                  Confidence: {event.confidence || "62%"}
                                </span>
                              </div>
                            </div>
                          </motion.div>
                        ))
                      ) : (
                        <div className="text-center py-8 text-purple-400/50 text-sm">
                          No events
                        </div>
                      )}
                    </div>
                  );
                })}
                {/* ── Weekend / empty state overlay ── */}
                {showWeekendEmptyState && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-10">
                    <div className="pointer-events-auto flex flex-col items-center gap-3 px-6 py-5 rounded-2xl bg-purple-950/80 border border-purple-800/40 backdrop-blur-md shadow-xl max-w-sm text-center">
                      <div className="text-3xl">📅</div>
                      <p className="text-purple-100 font-semibold text-sm">
                        {viewType === 'tomorrow'
                          ? 'No events scheduled for tomorrow'
                          : isWeekendDay
                          ? 'No events today — markets are closed on weekends'
                          : 'No events scheduled for today'}
                      </p>
                      <p className="text-purple-300 text-xs leading-relaxed">
                        {viewType === 'tomorrow'
                          ? 'No economic releases are scheduled for tomorrow. Check This Week for the full picture.'
                          : isWeekendDay
                          ? 'Economic data releases resume Monday. Check This Week for upcoming events.'
                          : 'No economic releases are scheduled. Check back later or view This Week.'}
                      </p>
                      <button
                        onClick={() => setViewType('week')}
                        className="pointer-events-auto mt-1 px-4 py-1.5 rounded-full bg-purple-600 hover:bg-purple-500 text-purple-100 text-xs font-semibold transition-colors"
                      >
                        View This Week →
                      </button>
                    </div>
                  </div>
                )}
                </>
              )}
            </div>
          </div>
      </div>
    </MainLayout>
  );
}
