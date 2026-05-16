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
  Globe,
  X
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  fetchEconomicCalendar, 
  fetchTodayEconomicEvents, 
  fetchWeekEconomicEvents, 
  fetchMonthEconomicEvents,
  type EconomicEvent 
} from "@/services/economicCalendar";

// Time intervals for horizontal timeline
const TIME_INTERVALS = ["07:00", "09:00", "11:00", "13:00", "15:00", "17:00", "19:00", "21:00"];

// Currency options for filtering
const CURRENCIES = ["EUR", "USD", "GBP", "JPY", "AUD", "CAD", "CHF", "CNY"];

// Timezone options
const TIMEZONES = [
  { label: "Europe/London", value: "Europe/London" },
  { label: "America/New_York", value: "America/New_York" },
  { label: "Asia/Tokyo", value: "Asia/Tokyo" },
  { label: "Australia/Sydney", value: "Australia/Sydney" },
];

export default function Calendar() {
  const [mounted, setMounted] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [events, setEvents] = useState<EconomicEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dataSource, setDataSource] = useState<string>("Loading...");
  
  // Filter states
  const [selectedCurrencies, setSelectedCurrencies] = useState<string[]>(CURRENCIES);
  const [selectedImpacts, setSelectedImpacts] = useState<string[]>(["High", "Medium", "Low"]);
  const [timezone, setTimezone] = useState<string>("Europe/London");
  
  // Live time tracker
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  
  // Expanded AI analysis state
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());

  useEffect(() => {
    setMounted(true);
  }, []);

  // Live time update
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Static mock data array for layout verification (Prompt 4)
  const sampleEvents = [
    { id: 1, time: "07:00 AM", currency: "GBP", impact: "Low", title: "Nationwide Housing Prices s.a (MoM)", confidence: "62%", date: new Date().toISOString() },
    { id: 2, time: "07:00 AM", currency: "GBP", impact: "Low", title: "Nationwide Housing Prices n.s.a (YoY)", confidence: "72%", date: new Date().toISOString() },
    { id: 3, time: "09:30 AM", currency: "GBP", impact: "Low", title: "M4 Money Supply (YoY)", confidence: "62%", date: new Date().toISOString() },
    { id: 4, time: "11:00 AM", currency: "GBP", impact: "Medium", title: "BoE's Pill speech", confidence: "62%", date: new Date().toISOString() },
    { id: 5, time: "13:00 PM", currency: "USD", impact: "High", title: "ISM Manufacturing Prices Paid", confidence: "66%", date: new Date().toISOString() }
  ];

  const loadEvents = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    setError(null);
    
    try {
      // Use static mock data for layout verification (Prompt 4)
      setEvents(sampleEvents as any);
      setDataSource("Mock Data (Layout Verification)");
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return;
      
      setError("Failed to load economic events");
      setDataSource("Error");
      console.error("Error loading economic events:", err);
    } finally {
      if (!signal?.aborted) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    if (!mounted) return;
    
    const controller = new AbortController();
    loadEvents(controller.signal);
    
    return () => controller.abort();
  }, [mounted, loadEvents]);

  if (!mounted) return null;

  // Filter events based on selected currencies, impacts, and date
  const filteredEvents = events.filter(event => {
    const currencyMatch = selectedCurrencies.length === 0 || selectedCurrencies.includes(event.currency || "USD");
    const impactMatch = selectedImpacts.length === 0 || selectedImpacts.includes(event.impact);
    const dateMatch = event.date ? new Date(event.date).toDateString() === selectedDate.toDateString() : true;
    return currencyMatch && impactMatch && dateMatch;
  });

  // Group events by time interval
  const getEventsForInterval = (interval: string) => {
    const [hour] = interval.split(':').map(Number);
    return filteredEvents.filter(event => {
      const eventHour = new Date(event.date).getHours();
      return eventHour >= hour && eventHour < hour + 2;
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

  const getConfidenceScore = (event: EconomicEvent) => {
    // Generate a confidence score based on impact and data availability
    const baseScore = event.impact === "High" ? 85 : event.impact === "Medium" ? 70 : 55;
    const hasActual = event.actual !== undefined && event.actual !== "";
    const hasForecast = event.forecast !== undefined && event.forecast !== "";
    const adjustment = (hasActual ? 10 : 0) + (hasForecast ? 5 : 0);
    return Math.min(baseScore + adjustment, 95);
  };

  const generateAIAnalysis = (event: EconomicEvent) => {
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
      analysis.push(`Given the high impact rating, this event is likely to cause significant volatility in ${event.assets.join(", ")}.`);
    }
    
    if (event.category === "Fed" || event.category === "Macro") {
      analysis.push(`Central bank decisions typically influence currency valuations and bond yields across global markets.`);
    }
    
    if (analysis.length === 0) {
      analysis.push(`This ${event.category} event may influence ${event.assets.slice(0, 2).join(" and ")} depending on the actual vs forecast deviation.`);
    }
    
    return analysis.join(" ");
  };

  // Format current time with timezone
  const formatCurrentTime = () => {
    return currentTime.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit',
      timeZone: timezone 
    });
  };

  return (
    <MainLayout>
      <div className="p-3 sm:p-4 lg:p-6 h-full bg-[#0B0813]">
        <div className="max-w-full mx-auto">
          {/* Page Header */}
          <div className="mb-6">
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
            {/* Date Selectors */}
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => setSelectedDate(new Date())}
                className="px-3 py-1.5 text-sm text-purple-300 hover:text-white hover:bg-purple-800/50 rounded transition-colors"
              >
                Today
              </button>
              <button
                type="button"
                onClick={() => {
                  const tomorrow = new Date();
                  tomorrow.setDate(tomorrow.getDate() + 1);
                  setSelectedDate(tomorrow);
                }}
                className="px-3 py-1.5 text-sm text-purple-300 hover:text-white hover:bg-purple-800/50 rounded transition-colors"
              >
                Tomorrow
              </button>
              <label className="sr-only" htmlFor="calendar-custom-date">Custom date</label>
              <input
                id="calendar-custom-date"
                type="date"
                value={selectedDate.toISOString().split('T')[0]}
                onChange={(e) => setSelectedDate(new Date(e.target.value))}
                className="bg-purple-900/30 text-white text-sm rounded px-2 py-1.5 border border-purple-700/30 focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/30"
              />

            </div>

            {/* Currency Toggles */}
            <div className="flex items-center space-x-2">
              <span className="text-xs text-purple-500">Currency</span>
              {CURRENCIES.map(currency => (
                <button
                  key={currency}
                  onClick={() => toggleCurrency(currency)}
                  className={`px-2 py-1 text-xs rounded transition-all ${
                    selectedCurrencies.includes(currency)
                      ? 'text-purple-200 border border-purple-400 shadow-[0_0_8px_rgba(168,85,247,0.4)]'
                      : 'text-purple-500 hover:text-purple-400'
                  }`}
                >
                  {currency}
                </button>
              ))}
            </div>

            {/* Impact Selectors */}
            <div className="flex items-center space-x-2">
              <span className="text-xs text-purple-500">Impact</span>
              {["High", "Medium", "Low"].map(impact => (
                <button
                  key={impact}
                  onClick={() => toggleImpact(impact)}
                  className={`px-2 py-1 text-xs rounded transition-all ${
                    selectedImpacts.includes(impact)
                      ? 'text-purple-200 border border-purple-400 shadow-[0_0_8px_rgba(168,85,247,0.4)]'
                      : 'text-purple-500 hover:text-purple-400'
                  }`}
                >
                  {impact}
                </button>
              ))}
            </div>

            {/* Timezone Dropper */}
              <div className="flex items-center space-x-2 ml-auto">
                <Globe className="h-3.5 w-3.5 text-purple-500" />
                <label className="sr-only" htmlFor="calendar-timezone">Timezone</label>
                <select
                  id="calendar-timezone"
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  className="bg-purple-900/30 text-white text-xs rounded px-2 py-1.5 border border-purple-700/30 focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/30"
                >
                  {TIMEZONES.map(tz => (
                    <option key={tz.value} value={tz.value}>{tz.label}</option>
                  ))}
                </select>
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
          <div className="w-full relative min-h-[calc(100vh-280px)]">
            {/* Live Current-Time Tracker */}
            <div className="absolute top-0 left-0 right-0 h-full pointer-events-none z-10">
              <div 
                className="absolute top-0 bottom-0 w-px bg-purple-400/60"
                style={{
                  left: `${(() => {
                    const visibleStartHour = 7; // 07:00
                    const visibleEndHour = 21; // 21:00
                    const visibleDurationMinutes = (visibleEndHour - visibleStartHour) * 60;
                    const currentMinutes = currentTime.getHours() * 60 + currentTime.getMinutes();
                    const visibleStartMinutes = visibleStartHour * 60;
                    const minutesSinceVisibleStart = currentMinutes - visibleStartMinutes;
                    const fraction = Math.max(0, Math.min(1, minutesSinceVisibleStart / visibleDurationMinutes));
                    return fraction * 100;
                  })()}%`
                }}
              >
                <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 bg-purple-600/90 backdrop-blur text-white text-xs font-mono px-2 py-1 rounded-full shadow-lg whitespace-nowrap border border-purple-400/30">
                  {formatCurrentTime()}
                </div>
              </div>
            </div>

            {/* Timeline Container - Unified Horizontal Scroll */}
            <div className="h-full w-full flex flex-row overflow-x-auto scrollbar-thin">

              {TIME_INTERVALS.map((interval, intervalIndex) => {
                const intervalEvents = getEventsForInterval(interval);
                
                return (
                  <div key={interval} className="flex-shrink-0 w-[340px] min-h-[550px] flex flex-col gap-4 px-4 border-r border-purple-950/20">
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
                          <div className="bg-[#120E24]/80 backdrop-blur-md border border-purple-900/40 rounded-xl p-4 shadow-lg hover:border-purple-500/60 transition-all duration-300 hover:scale-[1.02]">
                            {/* Card Header */}
                            <div className="flex items-center justify-between mb-2">
                              <div className="text-xs font-mono text-purple-300/80">
                                {(event as any).time || event.time}
                              </div>
                              <div className="flex items-center space-x-2">
                                <span className="px-1.5 py-0.5 text-xs rounded font-bold text-purple-300 border border-purple-500/30">
                                  {(event as any).asset || event.currency || "USD"}
                                </span>
                                <span className={`px-1.5 py-0.5 text-xs rounded font-semibold border ${
                                  (event as any).impact === "HIGH" ? "text-purple-200 border-purple-400/50" :
                                  (event as any).impact === "MEDIUM" ? "text-purple-300 border-purple-500/40" :
                                  "text-purple-400 border-purple-600/30"
                                }`}>
                                  {(event as any).impact || event.impact}
                                </span>
                              </div>
                            </div>

                            {/* Card Title */}
                            <h3 className="text-sm font-bold text-white mb-2 leading-tight">
                              {(event as any).title || event.title}
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
                                        Historical analysis suggests this event typically causes moderate market volatility. Consensus forecasts indicate potential deviation from prior readings.
                                      </p>
                                    </div>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>

                            {/* Confidence Rating Footer */}
                            <div className="flex items-center pt-2 border-t border-purple-700/20">
                              <span className="text-xs text-purple-400/80 font-medium">
                                Confidence: {(event as any).confidence || "62%"}
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
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
