"use client";

import React, { useState, useEffect } from "react";
import { MainLayout } from "@/components/dashboard/MainLayout";
import { 
  Calendar as CalendarIcon, 
  Clock, 
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Filter,
  ChevronRight,
  Plus,
  X
} from "lucide-react";

interface CalendarEvent {
  id: string;
  title: string;
  date: Date;
  time: string;
  impact: "High" | "Medium" | "Low";
  category: "Fed" | "Macro" | "Economic" | "Geopolitical" | "Earnings";
  description: string;
  assets: string[];
  relatedReports: string[];
}

const mockEvents: CalendarEvent[] = [
  {
    id: "1",
    title: "FOMC Interest Rate Decision",
    date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
    time: "14:00 EST",
    impact: "High",
    category: "Fed",
    description: "Federal Reserve to announce interest rate decision with markets expecting 25bps pause continuation. Focus on inflation metrics and labor market conditions. Potential volatility across all asset classes.",
    assets: ["USD", "US10Y", "DXY"],
    relatedReports: ["USD Strength Analysis", "Fed Policy Impact"]
  },
  {
    id: "2",
    title: "US CPI Data Release",
    date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
    time: "08:30 EST",
    impact: "High",
    category: "Economic",
    description: "Core CPI expected to show 0.3% month-over-month increase. Core services inflation likely to drive market sentiment. Watch for USD strength and precious metals reaction.",
    assets: ["USD", "XAUUSD", "XAGUSD"],
    relatedReports: ["Inflation Analysis", "USD Impact Study"]
  },
  {
    id: "3",
    title: "OPEC Monthly Report",
    date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
    time: "10:00 EST",
    impact: "Medium",
    category: "Geopolitical",
    description: "OPEC production quotas and demand forecast to be released. Monitor for oil price volatility and energy sector implications. Impact on inflation expectations.",
    assets: ["OIL", "USD", "Energy"],
    relatedReports: ["Oil Market Analysis", "Energy Sector Outlook"]
  },
  {
    id: "4",
    title: "EU ECB Meeting",
    date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    time: "07:45 EST",
    impact: "Medium",
    category: "Macro",
    description: "European Central Bank policy decision on interest rates and quantitative easing. EUR/USD volatility expected. Impact on global currency markets.",
    assets: ["EUR", "EURUSD", "DXY"],
    relatedReports: ["ECB Policy Analysis", "EUR Impact Assessment"]
  },
  {
    id: "5",
    title: "US NFP Report",
    date: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
    time: "08:30 EST",
    impact: "High",
    category: "Economic",
    description: "Non-farm payrolls data with unemployment rate. Critical for USD direction and equity market sentiment. Expected high volatility across all sectors.",
    assets: ["USD", "US Indices", "DXY"],
    relatedReports: ["Labor Market Analysis", "NFP Impact Study"]
  },
  {
    id: "6",
    title: "China Trade Data",
    date: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000),
    time: "02:00 EST",
    impact: "Medium",
    category: "Geopolitical",
    description: "Monthly trade balance and industrial production figures. Key for commodity demand signals, especially copper and industrial metals. AUD and NZD sensitivity.",
    assets: ["Copper", "Industrial Metals", "AUD", "NZD"],
    relatedReports: ["China Economic Analysis", "Commodities Demand Report"]
  },
  {
    id: "7",
    title: "Bank of Japan Meeting",
    date: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
    time: "03:00 EST",
    impact: "Medium",
    category: "Macro",
    description: "BOJ policy decision on yield curve control and inflation targeting. JPY volatility expected. Impact on carry trades and Asian markets.",
    assets: ["JPY", "Nikkei", "Asian Markets"],
    relatedReports: ["BOJ Policy Analysis", "JPY Impact Assessment"]
  }
];

export default function Calendar() {
  const [mounted, setMounted] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [view, setView] = useState<"month" | "week" | "day">("week");
  const [filter, setFilter] = useState<string>("All");

  useEffect(() => {
    setMounted(true);
  }, []);

  // Fix hydration mismatch
  if (!mounted) return null;

  const filteredEvents = filter === "All" 
    ? mockEvents 
    : mockEvents.filter(event => event.category === filter);

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case "High": return "bg-rose-500/20 text-rose-400 border-rose-400";
      case "Medium": return "bg-amber-500/20 text-amber-400 border-amber-400";
      case "Low": return "bg-emerald-500/20 text-emerald-400 border-emerald-400";
      default: return "bg-purple-500/20 text-purple-400 border-purple-400";
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "Fed": return "text-purple-400 border-purple-400";
      case "Macro": return "text-blue-400 border-blue-400";
      case "Economic": return "text-emerald-400 border-emerald-400";
      case "Geopolitical": return "text-rose-400 border-rose-400";
      case "Earnings": return "text-purple-400 border-purple-400";
      default: return "text-zinc-400 border-zinc-400";
    }
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    return lastDay.getDate();
  };

  const generateCalendarDays = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }

    const remainingDays = 42 - daysInMonth - startingDayOfWeek;
    for (let i = 0; i < remainingDays; i++) {
      days.push(null);
    }

    return days;
  };

  const generateWeekDays = (date: Date): Date[] => {
    const startOfWeek = new Date(date);
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day;
    startOfWeek.setDate(diff);

    const weekDays: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const currentDay = new Date(startOfWeek);
      currentDay.setDate(startOfWeek.getDate() + i);
      weekDays.push(currentDay);
    }

    return weekDays;
  };

  const getEventsForDay = (day: number) => {
    if (!selectedDate || !day) return [];
    return filteredEvents.filter(event => {
      const eventDate = new Date(event.date);
      return eventDate.getDate() === day &&
             eventDate.getMonth() === selectedDate.getMonth() &&
             eventDate.getFullYear() === selectedDate.getFullYear();
    });
  };

  return (
    <MainLayout>
      <div className="p-3 sm:p-4 lg:p-6 h-full">
        <div className="max-w-7xl mx-auto">
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">Calendar</h1>
            <p className="text-purple-300 text-sm sm:text-base">
              Interactive economic calendar with high-impact events and market-moving data
            </p>
          </div>

          {/* Calendar Controls */}
          <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setView("month")}
                className={`px-3 py-2 text-sm rounded-lg transition-colors ${
                  view === "month"
                    ? "bg-purple-600 text-white"
                    : "bg-purple-800 text-purple-300 hover:bg-purple-700 hover:text-white"
                }`}
              >
                Month
              </button>
              <button
                onClick={() => setView("week")}
                className={`px-3 py-2 text-sm rounded-lg transition-colors ${
                  view === "week"
                    ? "bg-purple-600 text-white"
                    : "bg-purple-900/80 text-purple-300 hover:bg-purple-800/80 hover:text-white"
                }`}
              >
                Week
              </button>
              <button
                onClick={() => setView("day")}
                className={`px-3 py-2 text-sm rounded-lg transition-colors ${
                  view === "day"
                    ? "bg-purple-600 text-white"
                    : "bg-purple-900/80 text-purple-300 hover:bg-purple-800/80 hover:text-white"
                }`}
              >
                Day
              </button>
            </div>

            <div className="flex items-center space-x-4">
              <CalendarIcon className="h-5 w-5 text-purple-400 mr-2" />
              <input
                type="date"
                value={selectedDate ? selectedDate.toISOString().split('T')[0] : ''}
                onChange={(e) => {
                  const value = e.target.value;
                  setSelectedDate(value ? new Date(value) : null);
                }}
                className="bg-purple-900/80 text-white text-sm rounded-lg px-3 py-2 border border-purple-800/80 focus:border-purple-700/80 focus:ring-2 focus:ring-purple-700/80"
              />
            </div>

            <div className="flex items-center space-x-2">
              <Filter className="h-5 w-5 text-purple-400 mr-2" />
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="bg-purple-900/80 text-white text-sm rounded-lg px-3 py-2 border border-purple-800/80 focus:border-purple-700/80 focus:ring-2 focus:ring-purple-700/80"
              >
                <option value="All">All Events</option>
                <option value="Fed">Fed</option>
                <option value="Macro">Macro</option>
                <option value="Economic">Economic</option>
                <option value="Geopolitical">Geopolitical</option>
                <option value="Earnings">Earnings</option>
              </select>
            </div>
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Calendar */}
            <div className="lg:col-span-2">
              <div className="group relative">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl blur opacity-25 group-hover:opacity-40 transition duration-300"></div>
                <div className="relative bg-purple-900/90 backdrop-blur-xl rounded-2xl border border-purple-800/80 p-6 shadow-2xl">
                  <div className="flex items-center justify-between mb-6">
                    <button
                      onClick={() => {
                        if (!selectedDate) return;
                        const newDate = new Date(selectedDate);
                        newDate.setMonth(newDate.getMonth() - 1);
                        setSelectedDate(newDate);
                      }}
                      className="group relative flex items-center text-purple-300 hover:text-white text-sm transition-all duration-200 hover:scale-105"
                    >
                      <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg blur opacity-0 group-hover:opacity-30 transition-opacity duration-300"></div>
                      <div className="relative flex items-center px-3 py-2 rounded-lg bg-purple-900/80 hover:bg-purple-800/80 transition-colors">
                        <ChevronRight className="h-4 w-4 rotate-180 mr-2" />
                        Previous Month
                      </div>
                    </button>
                    <h2 className="text-xl font-bold text-white bg-gradient-to-r from-purple-200 to-blue-200 bg-clip-text text-transparent">
                      {selectedDate ? selectedDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : 'Select a date'}
                    </h2>
                    <button
                      onClick={() => {
                        if (!selectedDate) return;
                        const newDate = new Date(selectedDate);
                        newDate.setMonth(newDate.getMonth() + 1);
                        setSelectedDate(newDate);
                      }}
                      className="group relative flex items-center text-purple-300 hover:text-white text-sm transition-all duration-200 hover:scale-105"
                    >
                      <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg blur opacity-0 group-hover:opacity-30 transition-opacity duration-300"></div>
                      <div className="relative flex items-center px-3 py-2 rounded-lg bg-purple-900/80 hover:bg-purple-800/80 transition-colors">
                        Next Month
                        <ChevronRight className="h-4 w-4 ml-2" />
                      </div>
                    </button>
                  </div>

                  {/* Weekly Calendar View */}
                  {view === "week" ? (
                    <div className="space-y-4">
                      {/* Week Header */}
                      <div className="grid grid-cols-7 gap-2 text-center mb-2">
                        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day, index) => (
                          <div key={day} className="text-xs text-purple-400 font-semibold py-2 bg-purple-900/80 rounded-lg backdrop-blur-sm">
                            {day}
                          </div>
                        ))}
                      </div>

                      {/* Week Days */}
                      <div className="grid grid-cols-1 gap-3">
                        {generateWeekDays(selectedDate || new Date()).map((day: Date, index: number) => {
                          const events = getEventsForDay(day.getDate());
                          const isToday = day.toDateString() === new Date().toDateString();
                          const dayName = day.toLocaleDateString('en-US', { weekday: 'short' });
                          const dayDate = day.getDate();
                          const monthName = day.toLocaleDateString('en-US', { month: 'short' });

                          return (
                            <div
                              key={index}
                              className={`
                                group relative bg-purple-950/90 backdrop-blur-xl rounded-2xl border border-purple-900/50 p-4
                                ${isToday ? 'ring-2 ring-purple-500/50 shadow-2xl' : 'shadow-lg'}
                                hover:shadow-2xl hover:scale-[1.02] transition-all duration-300
                              `}
                            >
                              {/* Ambient glow effect for today */}
                              {isToday && (
                                <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-600/20 to-blue-600/20 rounded-2xl blur-xl animate-pulse-slow"></div>
                              )}

                              {/* Day Header */}
                              <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center space-x-3">
                                  <div className="relative">
                                    <div className={`text-lg font-bold ${isToday ? 'text-white' : 'text-purple-300'}`}>
                                      {dayDate}
                                    </div>
                                    {isToday && (
                                      <div className="absolute -top-1 -right-1 w-2 h-2 bg-gradient-to-r from-purple-400 to-blue-400 rounded-full animate-pulse"></div>
                                    )}
                                  </div>
                                  <div className="text-sm text-purple-400">
                                    {dayName} • {monthName}
                                  </div>
                                </div>
                                {events.length > 0 && (
                                  <div className="flex items-center space-x-1">
                                    {events.slice(0, 3).map((event, idx) => (
                                      <div
                                        key={idx}
                                        className={`w-2 h-2 rounded-full ${event.impact === 'High' ? 'bg-rose-500' : event.impact === 'Medium' ? 'bg-amber-500' : 'bg-emerald-500'} shadow-sm`}
                                      />
                                    ))}
                                  </div>
                                )}
                              </div>

                              {/* Events List */}
                              <div className="space-y-2">
                                {events.slice(0, 3).map((event: any, idx: number) => (
                                  <div
                                    key={idx}
                                    className="group/item relative bg-purple-900/50 rounded-lg p-3 border border-purple-800/50 hover:bg-purple-800/50 transition-all duration-200 cursor-pointer"
                                  >
                                    <div className="flex items-start justify-between">
                                      <div className="flex-1">
                                        <div className="flex items-center space-x-2 mb-1">
                                          <span className="text-xs text-purple-400 font-mono">{event.time}</span>
                                          <div className={`px-2 py-0.5 text-xs rounded-full font-medium ${
                                            event.impact === 'High' ? 'bg-rose-500/10 text-rose-300' :
                                            event.impact === 'Medium' ? 'bg-amber-500/10 text-amber-300' :
                                            'bg-emerald-500/10 text-emerald-300'
                                          }`}>
                                            {event.impact}
                                          </div>
                                        </div>
                                        <h4 className="text-sm font-medium text-white mb-1 group-hover/item:text-purple-200 transition-colors">
                                          {event.title}
                                        </h4>
                                        <p className="text-xs text-purple-400 line-clamp-2">
                                          {event.description}
                                        </p>
                                      </div>
                                      <div className={`px-2 py-1 text-xs rounded-lg border font-medium ${
                                        event.category === 'Fed' ? 'text-purple-300 border-purple-500/30' :
                                        event.category === 'Macro' ? 'text-blue-300 border-blue-500/30' :
                                        event.category === 'Economic' ? 'text-emerald-300 border-emerald-500/30' :
                                        event.category === 'Geopolitical' ? 'text-rose-300 border-rose-500/30' :
                                        'text-purple-300 border-purple-500/30'
                                      }`}>
                                        {event.category}
                                      </div>
                                    </div>
                                  </div>
                                ))}
                                {events.length > 3 && (
                                  <div className="text-center py-2">
                                    <span className="text-xs text-purple-400 bg-purple-900/50 px-3 py-1 rounded-lg">
                                      +{events.length - 3} more events
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    /* Monthly view fallback */
                    <div className="grid grid-cols-7 gap-2 text-center">
                      {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day, index) => (
                        <div key={day} className="text-xs text-purple-400 font-semibold py-3 bg-purple-900/80 rounded-lg backdrop-blur-sm">
                          {day}
                        </div>
                      ))}

                      {generateCalendarDays(selectedDate || new Date()).map((day, index) => {
                        const events = day ? getEventsForDay(day) : [];
                        const isToday = selectedDate && day === new Date().getDate() &&
                                       new Date().getMonth() === selectedDate.getMonth() &&
                                       new Date().getFullYear() === selectedDate.getFullYear();

                        return (
                          <div
                            key={index}
                            className={`
                              relative p-3 border border-purple-800/80 rounded-xl
                              ${!day ? 'text-purple-500/50' : 'text-purple-300'}
                              ${isToday ? 'bg-gradient-to-r from-purple-800/80 to-blue-800/80 ring-2 ring-purple-500/80 shadow-lg' : 'bg-purple-900/80 hover:bg-purple-800/80'}
                              hover:shadow-lg hover:scale-105 transition-all duration-200 cursor-pointer
                              ${day ? 'hover:border-purple-700/80' : ''}
                            `}
                          >
                            {day && (
                              <>
                                <div className="relative z-10 font-medium text-sm">{day}</div>
                                {events.length > 0 && (
                                  <div className="absolute top-2 right-2 flex space-x-1">
                                    {events.slice(0, 2).map((_, index) => (
                                      <div
                                        key={index}
                                        className={`w-2 h-2 rounded-full ${getImpactColor(events[0].impact)} shadow-sm`}
                                      />
                                    ))}
                                    {events.length > 2 && (
                                      <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white text-xs px-1.5 py-0.5 rounded-full shadow-sm">
                                        +{events.length - 2}
                                      </div>
                                    )}
                                  </div>
                                )}
                                {isToday && (
                                  <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-blue-600/20 rounded-xl blur-xl"></div>
                                )}
                              </>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Events List */}
            <div className="lg:col-span-1">
              <div className="group relative">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl blur opacity-25 group-hover:opacity-40 transition duration-300"></div>
                <div className="relative bg-purple-950/90 backdrop-blur-xl rounded-2xl border border-purple-900/80 p-6 shadow-2xl">
                  <div className="flex items-center mb-6">
                    <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 mr-3">
                      <AlertTriangle className="h-5 w-5 text-white" />
                    </div>
                    <h2 className="text-xl font-semibold text-white">Upcoming Events</h2>
                  </div>

                  <div className="space-y-4 max-h-96 overflow-y-auto custom-scrollbar">
                    {filteredEvents.map((event) => (
                      <div
                        key={event.id}
                        className="group relative border-l-2 border-purple-700/80 pl-4 py-4 hover:bg-purple-900/80 transition-all duration-200 rounded-r-lg hover:shadow-lg"
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-purple-600/10 to-transparent rounded-r-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        <div className="relative">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center space-x-3">
                              <div className={`px-3 py-1.5 text-xs rounded-full font-semibold shadow-sm ${
                                event.impact === 'High' ? 'bg-rose-500/10 text-rose-300 border border-rose-500/20' :
                                event.impact === 'Medium' ? 'bg-amber-500/10 text-amber-300 border border-amber-500/20' :
                                'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20'
                              }`}>
                                {event.impact}
                              </div>
                              <div className={`px-3 py-1.5 text-xs rounded-full border font-semibold ${
                                event.category === 'Fed' ? 'text-purple-300 border-purple-500/30' :
                                event.category === 'Macro' ? 'text-blue-300 border-blue-500/30' :
                                event.category === 'Economic' ? 'text-emerald-300 border-emerald-500/30' :
                                event.category === 'Geopolitical' ? 'text-rose-300 border-rose-500/30' :
                                'text-purple-300 border-purple-500/30'
                              }`}>
                                {event.category}
                              </div>
                              <div className="text-purple-400 text-xs font-medium bg-purple-800/50 px-2 py-1 rounded">
                                {event.time}
                              </div>
                            </div>
                            <div className="text-purple-300 text-xs font-mono bg-purple-800/50 px-2 py-1 rounded">
                              {event.date ? event.date.toLocaleDateString('en-US', { 
                                month: '2-digit', 
                                day: '2-digit', 
                                year: 'numeric' 
                              }) : ''}
                            </div>
                          </div>

                          <h3 className="text-lg font-bold text-white mb-3 group-hover:text-purple-200 transition-colors">
                            {event.title}
                          </h3>

                          <p className="text-purple-300 text-sm mb-4 leading-relaxed">
                            {event.description}
                          </p>

                          <div className="mb-4">
                            <h4 className="text-sm font-semibold text-purple-300 mb-2">Assets</h4>
                            <div className="flex flex-wrap gap-2">
                              {event.assets.map((asset) => (
                                <span
                                  key={asset}
                                  className="px-3 py-1 bg-purple-800/50 text-purple-300 text-xs rounded-lg font-medium hover:bg-purple-700/50 transition-colors"
                                >
                                  {asset}
                                </span>
                              ))}
                            </div>
                          </div>

                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <TrendingUp className="h-4 w-4 text-emerald-400" />
                              <span className="text-purple-300 text-sm font-medium">High Impact Expected</span>
                            </div>
                            <button className="group relative flex items-center text-purple-300 hover:text-white text-sm font-medium transition-all duration-200 hover:scale-105">
                              <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg blur opacity-0 group-hover:opacity-30 transition-opacity duration-300"></div>
                              <div className="relative flex items-center px-3 py-1.5 rounded-lg bg-purple-800/50 hover:bg-purple-700/50 transition-colors">
                                <Plus className="h-4 w-4 mr-2" />
                                View Analysis
                              </div>
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
