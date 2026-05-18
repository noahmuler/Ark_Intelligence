"use client";

import React, { useState, useEffect, useCallback } from "react";
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

// Time intervals for horizontal timeline (daily view)
const TIME_INTERVALS = ["07:00", "09:00", "11:00", "13:00", "15:00", "17:00", "19:00", "21:00"];

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

export default function Calendar() {
  const [mounted, setMounted] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date(2026, 4, 13)); // Wed, May 13th
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dataSource, setDataSource] = useState<string>("Loading...");
  
  // View type state: 'today', 'tomorrow', 'week', 'custom'
  const [viewType, setViewType] = useState<'today' | 'tomorrow' | 'week' | 'custom'>('week');
  
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

  const loadEvents = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    setError(null);
    
    try {
      // Use mock data for This Week view as specified in gemini_prompt.md
      if (viewType === 'week') {
        const mockEvents: CalendarEvent[] = [
          {
            id: 'mock-1',
            time: '14:00',
            currency: 'USD',
            impact: 'High',
            title: 'FOMC Interest Rate Decision',
            confidence: '68%',
            date: new Date(2026, 4, 11).toISOString(), // Mon, 5/11
          },
          {
            id: 'mock-2',
            time: '8:30',
            currency: 'USD',
            impact: 'Medium',
            title: 'OPEC Monthly Report',
            confidence: '81%',
            date: new Date(2026, 4, 12).toISOString(), // Tue, 5/12
          },
          {
            id: 'mock-3',
            time: '8:30',
            currency: 'USD',
            impact: 'Medium',
            title: 'US Retail Sales',
            confidence: '61%',
            date: new Date(2026, 4, 12).toISOString(), // Tue, 5/12
          },
          {
            id: 'mock-4',
            time: '14:00',
            currency: 'JPY',
            impact: 'Medium',
            title: 'Bank of Japan Policy Meeting',
            confidence: '71%',
            date: new Date(2026, 4, 13).toISOString(), // Wed, 5/13
          },
        ];
        setEvents(mockEvents);
        setDataSource('Mock Data (Alpha Vantage API)');
        setLoading(false);
        return;
      }
      
      let url = '/api/calendar?';
      
      if (viewType === 'today') {
        url += 'viewType=today';
      } else if (viewType === 'tomorrow') {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        url += `viewType=day&date=${tomorrow.toISOString().split('T')[0]}`;
      } else if (viewType === 'custom') {
        url += `viewType=day&date=${selectedDate.toISOString().split('T')[0]}`;
      }
      
      const response = await fetch(url, { signal });
      
      if (!response.ok) {
        throw new Error('Failed to fetch calendar data');
      }
      
      const data = await response.json();
      setEvents(data.events || []);
      setDataSource(data.source || 'API');
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return;
      
      setError("Failed to load economic events");
      setDataSource("Error");
      console.error("Error loading economic events:", err);
      setEvents([]);
    } finally {
      if (!signal?.aborted) {
        setLoading(false);
      }
    }
  }, [viewType, selectedDate]);

  useEffect(() => {
    if (!mounted) return;
    
    const controller = new AbortController();
    loadEvents(controller.signal);
    
    return () => controller.abort();
  }, [mounted, viewType, selectedDate, loadEvents]);

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
      const eventHour = parseInt(
        eventDate.toLocaleString('en-US', { 
          timeZone: timezone, 
          hour: 'numeric', 
          hour12: false 
        })
      );
      return eventHour >= hour && eventHour < hour + 2;
    });
  };

  // Group events by day (for weekly view)
  const getEventsForDay = (dayDate: Date) => {
    return filteredEvents.filter(event => {
      const eventDate = new Date(event.date);
      return eventDate.toDateString() === dayDate.toDateString();
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

  // Format current time with user's local system timezone
  const formatCurrentTime = () => {
    return currentTime.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit',
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
    });
  };
  
  // Calculate spotlight position based on view type
  const getSpotlightPosition = () => {
    if (viewType === 'week') {
      const weekDays = getWeekDays(selectedDate);
      const currentDayIndex = weekDays.findIndex(day => 
        day.date.toDateString() === new Date().toDateString()
      );
      if (currentDayIndex >= 0) {
        return ((currentDayIndex + 0.5) / weekDays.length) * 100;
      }
      return 50;
    } else {
      const visibleStartHour = 7;
      const visibleEndHour = 21;
      const visibleDurationMinutes = (visibleEndHour - visibleStartHour) * 60;
      const currentMinutes = currentTime.getHours() * 60 + currentTime.getMinutes();
      const visibleStartMinutes = visibleStartHour * 60;
      const minutesSinceVisibleStart = currentMinutes - visibleStartMinutes;
      const fraction = Math.max(0, Math.min(1, minutesSinceVisibleStart / visibleDurationMinutes));
      return fraction * 100;
    }
  };

  return (
    <MainLayout>
      <div className="h-full bg-[#0B0813] flex flex-col -mx-4 sm:-mx-6 lg:-mx-8 xl:-mx-12 2xl:-mx-16">
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
                    dataSource.includes('Real') || dataSource.includes('API') ? 'text-green-400' : 
                    dataSource.includes('Mock') ? 'text-amber-400' : 
                    dataSource.includes('Error') ? 'text-red-400' : 'text-purple-400'
                  }`}>
                    {dataSource}
                  </div>
                </div>
                <button
                  onClick={() => loadEvents()}
                  disabled={loading}
                  className="group relative flex items-center text-purple-300 hover:text-white text-sm transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg blur opacity-0 group-hover:opacity-30 transition-opacity duration-300"></div>
                  <div className="relative flex items-center px-3 py-2 rounded-lg bg-purple-900/80 hover:bg-purple-800/80 transition-colors">
                    {loading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        Refresh
                      </>
                    )}
                  </div>
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
                value={selectedDate.toISOString().split('T')[0]}
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
            <div className="h-full w-full flex flex-row overflow-x-auto scrollbar-thin relative z-20">
              {/* Live Current-Time Tracker - Now inside scrollable container */}
              <div className="absolute top-0 bottom-0 left-0 pointer-events-none z-30">
                <div 
                  className="absolute top-0 bottom-0 w-0.5 bg-purple-400/80 shadow-[0_0_12px_rgba(168,85,247,0.8)]"
                  style={{
                    left: `${(() => {
                      if (viewType === 'week') {
                        // For weekly view, position fixedly over the current day's column (actual current day)
                        const weekDays = getWeekDays(selectedDate);
                        const currentDayIndex = weekDays.findIndex(day => 
                          day.date.toDateString() === new Date().toDateString()
                        );
                        if (currentDayIndex >= 0) {
                          return ((currentDayIndex + 0.5) / weekDays.length) * 100;
                        }
                        return 50; // Default to middle if today not in view
                      } else {
                        // For daily view (Today/Tomorrow), position based on current hour with fluid movement
                        const visibleStartHour = 7; // 07:00
                        const visibleEndHour = 21; // 21:00
                        const visibleDurationMinutes = (visibleEndHour - visibleStartHour) * 60;
                        const currentMinutes = currentTime.getHours() * 60 + currentTime.getMinutes();
                        const visibleStartMinutes = visibleStartHour * 60;
                        const minutesSinceVisibleStart = currentMinutes - visibleStartMinutes;
                        const fraction = Math.max(0, Math.min(1, minutesSinceVisibleStart / visibleDurationMinutes));
                        return fraction * 100;
                      }
                    })()}%`
                  }}
                >
                  <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 flex items-center gap-2 bg-purple-600/90 backdrop-blur text-white text-xs font-mono px-3 py-1.5 rounded-full shadow-lg whitespace-nowrap border border-purple-400/30">
                    <Clock className="h-3 w-3" />
                    <span>{formatCurrentTime()}</span>
                  </div>
                </div>
              </div>

              {viewType === 'week' ? (
                // Weekly View - Day Columns
                getWeekDays(selectedDate).map((day, dayIndex) => {
                  const dayEvents = getEventsForDay(day.date);
                  
                  return (
                    <div key={day.label} className="flex-shrink-0 w-[280px] sm:w-[320px] lg:w-[360px] xl:w-[400px] 2xl:w-[440px] min-h-[450px] flex flex-col gap-2 px-2 border-r border-purple-950/20">
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
                })
              ) : (
                // Daily View - Hour Columns
                TIME_INTERVALS.map((interval, intervalIndex) => {
                  const intervalEvents = getEventsForInterval(interval);
                  
                  return (
                    <div key={interval} className="flex-shrink-0 w-[280px] sm:w-[320px] lg:w-[360px] xl:w-[400px] 2xl:w-[440px] min-h-[450px] flex flex-col gap-2 px-2 border-r border-purple-950/20">
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
                })
              )}
            </div>
          </div>
      </div>
    </MainLayout>
  );
}
