"use client";

import React, { useState, useEffect } from "react";
import { MainLayout } from "@/components/dashboard/MainLayout";
import { 
  Calendar as CalendarIcon, 
  Clock, 
  AlertTriangle,
  TrendingUp,
  Filter,
  ChevronRight,
  ChevronDown,
  Loader2,
  Sparkles,
  X
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

// Timezone options
const TIMEZONES = [
  { label: "Europe/London", value: "Europe/London" },
  { label: "America/New_York", value: "America/New_York" },
  { label: "Asia/Tokyo", value: "Asia/Tokyo" },
  { label: "Australia/Sydney", value: "Australia/Sydney" },
];

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

// Map API event to UI event format
const mapApiEventToUiEvent = (apiEvent: ApiCalendarEvent, tz: string): CalendarEvent => {
  const date = new Date(apiEvent.dateUtc);
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
    currency: apiEvent.currency,
    impact: impact,
    time: (() => {
      const d = new Date(apiEvent.dateUtc);
      const { h, m } = localHM(d, tz);
      return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    })(),
    date: apiEvent.dateUtc,
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
  
  // Filter states
  const [selectedCurrencies, setSelectedCurrencies] = useState<string[]>(CURRENCIES);
  const [selectedImpacts, setSelectedImpacts] = useState<string[]>(["High", "Medium", "Low"]);
  const [timezone, setTimezone] = useState<string>(Intl.DateTimeFormat().resolvedOptions().timeZone);
  
  // Live time tracker
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  
  // Expanded AI analysis state
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());
  
  // Filter dropdown states
  const [currencyDropdownOpen, setCurrencyDropdownOpen] = useState(false);
  const [impactDropdownOpen, setImpactDropdownOpen] = useState(false);
  
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

  useEffect(() => {
    setMounted(true);
  }, []);

  // Live time update - uses user's local system time
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Use the new useCalendarEvents hook
  const customDateParam = viewType === 'custom' 
    ? `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}` 
    : undefined;
  const { data: apiEvents, isLoading, isError } = useCalendarEvents(
    // The hook only accepts 'today' | 'tomorrow' | 'week'; for 'custom' pass 'today'
    // but override with the customDate param so the hook uses that date
    (viewType === 'custom' ? 'today' : viewType) as 'today' | 'tomorrow' | 'week',
    customDateParam
  );

  // Map API events to UI events
  const events = (apiEvents || []).map(ev => mapApiEventToUiEvent(ev, timezone));
  const loading = isLoading;
  const dataSource = isError ? "Error" : isLoading ? "Loading" : "JBlanked API";

  // Set error state based on isError (in useEffect to avoid render-phase update)
  useEffect(() => {
    if (isError) {
      setError("Failed to load economic events");
    } else {
      setError(null);
    }
  }, [isError]);

  if (!mounted) return null;

  // Filter events based on selected currencies and impacts
  const filteredEvents = events.filter(event => {
    const currencyMatch = selectedCurrencies.length === 0 || selectedCurrencies.includes(event.currency || "USD");
    const impactMatch = selectedImpacts.length === 0 || selectedImpacts.includes(event.impact);
    return currencyMatch && impactMatch;
  });



  // Group events by time interval (for daily view)
  const getEventsForInterval = (interval: string) => {
    const [hour] = interval.split(':').map(Number);
    return filteredEvents.filter(event => {
      const eventDate = new Date(event.date);
      if (isNaN(eventDate.getTime())) return false;
      const { h: eventHour } = localHM(eventDate, timezone);
      return eventHour >= hour && eventHour < hour + 2;
    });
  };

  // Group events by day (for weekly view)
  const getEventsForDay = (dayDate: Date) => {
    const dayKey = localDateString(dayDate, timezone);
    return filteredEvents.filter(event => {
      const eventDate = new Date(event.date);
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
    setSelectedCurrencies(prev => 
      prev.includes(currency) 
        ? prev.filter(c => c !== currency)
        : [...prev, currency]
    );
  };

  const toggleImpact = (impact: string) => {
    setSelectedImpacts(prev => 
      prev.includes(impact) 
        ? prev.filter(i => i !== impact)
        : [...prev, impact]
    );
  };

  // Helper functions for styling
  const getImpactColor = (impact: string) => {
    switch (impact) {
      case "High": return "border-purple-500/50 hover:border-purple-400";
      case "Medium": return "border-purple-600/40 hover:border-purple-500/50";
      case "Low": return "border-purple-700/30 hover:border-purple-600/40";
      default: return "border-purple-600/40 hover:border-purple-500/50";
    }
  };

  const getImpactBadgeColor = (impact: string) => {
    switch (impact) {
      case "High": return "text-purple-300 border-purple-400/50";
      case "Medium": return "text-purple-400 border-purple-500/40";
      case "Low": return "text-purple-500 border-purple-600/30";
      default: return "text-purple-400 border-purple-500/40";
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
    let gmtOffset = 'GMT+00:00';
    if (timeZonePart) {
      // Parse the offset from the timeZoneName (e.g., "GMT+03:00" or "GMT-05:00")
      const match = timeZonePart.value.match(/GMT([+-]\d{2}):(\d{2})/);
      if (match) {
        gmtOffset = `GMT${match[1]}:${match[2]}`;
      }
    }

    return `${timeStr} ${gmtOffset}`;
  };
  
  // Calculate timeline position for current time within the daily view.
  // Uses absolute horizontal percentage offset relative to the full day grid container.
  const getTimelinePosition = () => {
    const { h, m } = localHM(currentTime, timezone);
    return ((h * 60 + m) / (24 * 60)) * 100;
  };

  // Calculate spotlight position for current time within the timeline.
  // For weekly view, align with the current day's column and add intra-day fraction.
  // NOTE: We intentionally do NOT key off `selectedDate` to avoid the "wrong day" drift in daily mode.
  const getSpotlightPosition = () => {
    const { h, m } = localHM(currentTime, timezone);
    const currentMinutes = h * 60 + m;

    if (viewType === 'week') {
      const weekDays = getWeekDays(selectedDate);
      const todayKey = localDateString(new Date(), timezone);
      const currentDayIndex = weekDays.findIndex(
        day => localDateString(day.date, timezone) === todayKey
      );
      if (currentDayIndex >= 0) {
        const columnStart = (currentDayIndex / weekDays.length) * 100;
        const intraDayOffset = (currentMinutes / 1440) * (100 / weekDays.length);
        return columnStart + intraDayOffset;
      }
      return 50;
    }

    return (currentMinutes / 1440) * 100;
  };


  return (
    <MainLayout>
          {/* Page Header */}
          <div className="py-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">Economic Calendar</h1>
                <p className="text-purple-300 text-sm sm:text-base">
                  Live macroeconomic events with AI-powered analysis
                </p>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="text-xs text-purple-400">Data Source</div>
                  <div className={`text-sm font-medium ${
                    dataSource.includes('Real') || dataSource.includes('API') || dataSource.includes('JBlanked') ? 'text-green-400' : 
                    dataSource.includes('Mock') ? 'text-amber-400' : 
                    dataSource.includes('Error') ? 'text-red-400' : 'text-purple-400'
                  }`}>
                    {dataSource}
                  </div>
                </div>
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
                  <div className="absolute top-full left-0 mt-2 bg-[#120E24]/95 backdrop-blur-md border border-purple-900/40 rounded-lg shadow-xl z-50 p-2 min-w-[200px]">
                    {CURRENCIES.map(currency => (
                      <label key={currency} className="flex items-center gap-2 px-2 py-1.5 hover:bg-purple-800/30 rounded cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedCurrencies.includes(currency)}
                          onChange={() => toggleCurrency(currency)}
                          className="w-4 h-4 rounded border-purple-500/50 bg-purple-900/50 text-purple-500 focus:ring-purple-500/50 focus:ring-offset-0"
                        />
                        <span className="text-sm text-purple-200">{currency}</span>
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
                  <div className="absolute top-full left-0 mt-2 bg-[#120E24]/95 backdrop-blur-md border border-purple-900/40 rounded-lg shadow-xl z-50 p-2 min-w-[200px]">
                    {["High", "Medium", "Low"].map(impact => (
                      <label key={impact} className="flex items-center gap-2 px-2 py-1.5 hover:bg-purple-800/30 rounded cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedImpacts.includes(impact)}
                          onChange={() => toggleImpact(impact)}
                          className="w-4 h-4 rounded border-purple-500/50 bg-purple-900/50 text-purple-500 focus:ring-purple-500/50 focus:ring-offset-0"
                        />
                        <span className="text-sm text-purple-200">{impact}</span>
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

          <div className="w-full relative min-h-[calc(100vh-200px)] mx-0 mb-0">
            {/* Spotlight Effect - Dynamic radial gradient following current-time marker */}
            <div 
              className="absolute inset-0 pointer-events-none z-0 transition-all duration-1000 ease-in-out"
              style={{
                background: `radial-gradient(circle at ${getSpotlightPosition()}% 50%, rgba(147, 51, 234, 0.15) 0%, transparent 60%)`
              }}
            />

            {/* Timeline Container - Unified Horizontal Scroll */}
            <div className="h-full w-full flex flex-row overflow-x-auto scrollbar-thin relative z-20 snap-x snap-mandatory" style={{ position: 'relative' }}>
              {viewType === 'week' ? (
                // Weekly View - Day Columns
                <>
                  {/* ── Current-time indicator for Week view ── */}
                  {(() => {
                    const pct = getSpotlightPosition(); // 0–100% across the week
                    return (
                      <div
                        key="time-indicator-week"
                        className="absolute top-0 bottom-0 pointer-events-none z-30"
                        style={{
                          left: `${pct}%`,
                          width: 0,
                        }}
                      >
                        {/* Vertical line */}
                        <div className="absolute top-6 bottom-0 w-px bg-purple-500/90 shadow-[0_0_6px_rgba(168,85,247,0.7)]" />
                        {/* Time bubble — above the line, overflows upward */}
                        <div className="absolute top-0 -translate-x-1/2 flex items-center gap-1.5 bg-purple-700/95 backdrop-blur text-white text-xs font-mono px-2.5 py-1 rounded-full shadow-lg whitespace-nowrap border border-purple-400/40 z-40">
                          <Clock className="h-3 w-3 text-purple-300" />
                          <span>{formatCurrentTime()}</span>
                        </div>
                      </div>
                    );
                  })()}
                  {getWeekDays(selectedDate).map((day, dayIndex) => {
                  const dayEvents = getEventsForDay(day.date);
                  
                  return (
                    <div key={day.label} className="flex-shrink-0 w-[280px] sm:w-[320px] lg:w-[360px] xl:w-[400px] 2xl:w-[440px] min-h-[450px] flex flex-col gap-2 px-2 border-r border-purple-950/20 snap-start">
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
                            className="group relative"
                          >
                            <div className="bg-[#120E24]/80 backdrop-blur-md border border-purple-900/40 rounded-lg p-3 shadow-lg hover:border-purple-500/60 transition-all duration-300">
                              {/* Card Header */}
                              <div className="flex items-center justify-between mb-2">
                                <div className="text-xs font-mono text-purple-300/80">
                                  {event.time}
                                </div>
                                <div className="flex items-center space-x-2">
                                  <span className="px-1.5 py-0.5 text-xs rounded font-bold text-purple-300 border border-purple-500/30">
                                    {event.currency || "USD"}
                                  </span>
                                  <span className={`px-1.5 py-0.5 text-xs rounded font-semibold border ${
                                    event.impact === "High" ? "text-purple-200 border-purple-400/50" :
                                    event.impact === "Medium" ? "text-purple-300 border-purple-500/40" :
                                    "text-purple-400 border-purple-600/30"
                                  }`}>
                                    {event.impact}
                                  </span>
                                </div>
                              </div>

                              {/* Card Title */}
                              <h3 className="text-sm font-bold text-white mb-2 leading-tight">
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
                        <div className="text-center py-8 text-purple-500/50 text-sm">
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
                  {viewType === 'today' && (() => {
                    const pct = getTimelinePosition(); // 0–100% of the full 24h width
                    return (
                      <div
                        key="time-indicator"
                        className="absolute top-0 bottom-0 pointer-events-none z-30"
                        style={{
                          left: `${pct}%`,
                          width: 0,
                        }}
                      >
                        {/* Vertical line */}
                        <div className="absolute top-6 bottom-0 w-px bg-purple-500/90 shadow-[0_0_6px_rgba(168,85,247,0.7)]" />
                        {/* Time bubble — above the line, overflows upward */}
                        <div className="absolute top-0 -translate-x-1/2 flex items-center gap-1.5 bg-purple-700/95 backdrop-blur text-white text-xs font-mono px-2.5 py-1 rounded-full shadow-lg whitespace-nowrap border border-purple-400/40 z-40">
                          <Clock className="h-3 w-3 text-purple-300" />
                          <span>{formatCurrentTime()}</span>
                        </div>
                      </div>
                    );
                  })()}
                  {TIME_INTERVALS.map((interval, intervalIndex) => {
                  const intervalEvents = getEventsForInterval(interval);
                  
                  return (
                    <div key={interval} className="flex-shrink-0 w-[280px] sm:w-[320px] lg:w-[360px] xl:w-[400px] 2xl:w-[440px] min-h-[450px] flex flex-col gap-2 px-2 border-r border-purple-950/20 snap-start">
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
                            className="group relative"
                          >
                            <div className="bg-[#120E24]/80 backdrop-blur-md border border-purple-900/40 rounded-lg p-3 shadow-lg hover:border-purple-500/60 transition-all duration-300">
                              {/* Card Header */}
                              <div className="flex items-center justify-between mb-2">
                                <div className="text-xs font-mono text-purple-300/80">
                                  {event.time}
                                </div>
                                <div className="flex items-center space-x-2">
                                  <span className="px-1.5 py-0.5 text-xs rounded font-bold text-purple-300 border border-purple-500/30">
                                    {event.currency || "USD"}
                                  </span>
                                  <span className={`px-1.5 py-0.5 text-xs rounded font-semibold border ${
                                    event.impact === "High" ? "text-purple-200 border-purple-400/50" :
                                    event.impact === "Medium" ? "text-purple-300 border-purple-500/40" :
                                    "text-purple-400 border-purple-600/30"
                                  }`}>
                                    {event.impact}
                                  </span>
                                </div>
                              </div>

                              {/* Card Title */}
                              <h3 className="text-sm font-bold text-white mb-2 leading-tight">
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
                        <div className="text-center py-8 text-purple-500/50 text-sm">
                          No events
                        </div>
                      )}
                    </div>
                  );
                })}
                </>
              )}
            </div>
          </div>
    </MainLayout>
  );
}
