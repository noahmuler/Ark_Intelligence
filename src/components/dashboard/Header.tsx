"use client";

import React, { useState, useEffect } from "react";
import { TrendingUp, TrendingDown, Minus, Globe, Clock, Menu, X } from "lucide-react";
import Link from "next/link";

interface TickerData {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
}

const mockTickerData: TickerData[] = [
  { symbol: "WTI", name: "Crude Oil", price: 78.45, change: -1.23, changePercent: -1.54 },
  { symbol: "DXY", name: "US Dollar", price: 105.82, change: 1.24, changePercent: 1.18 },
  { symbol: "US10Y", name: "10Y Yield", price: 4.32, change: -0.05, changePercent: -1.14 },
];

interface WorldTime {
  city: string;
  timezone: string;
  time: string;
  offset: string;
}

const getWorldTimes = (): WorldTime[] => {
  const now = new Date();
  return [
    {
      city: "NY",
      timezone: "America/New_York",
      time: now.toLocaleTimeString("en-US", { timeZone: "America/New_York", hour: "2-digit", minute: "2-digit", hour12: false }),
      offset: "EST"
    },
    {
      city: "ADD",
      timezone: "Africa/Addis_Ababa",
      time: now.toLocaleTimeString("en-US", { timeZone: "Africa/Addis_Ababa", hour: "2-digit", minute: "2-digit", hour12: false }),
      offset: "EAT"
    },
    {
      city: "TKY",
      timezone: "Asia/Tokyo",
      time: now.toLocaleTimeString("en-US", { timeZone: "Asia/Tokyo", hour: "2-digit", minute: "2-digit", hour12: false }),
      offset: "JST"
    }
  ];
};

export function Header() {
  const [tickerData, setTickerData] = useState<TickerData[]>(mockTickerData);
  const [worldTimes, setWorldTimes] = useState<WorldTime[]>(getWorldTimes());
  const [mounted, setMounted] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Check initial screen size
    setIsDesktop(window.innerWidth >= 1024);
  }, []);

  // Listen for sidebar state changes
  useEffect(() => {
    const handleSidebarChange = (event: CustomEvent) => {
      setIsSidebarOpen(event.detail.isOpen);
    };

    window.addEventListener('sidebar-state-changed', handleSidebarChange as EventListener);
    return () => window.removeEventListener('sidebar-state-changed', handleSidebarChange as EventListener);
  }, []);

  // Listen for screen size changes
  useEffect(() => {
    const handleResize = () => {
      setIsDesktop(window.innerWidth >= 1024);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Sidebar toggle function
  const toggleSidebar = () => {
    const event = new CustomEvent('toggle-sidebar');
    window.dispatchEvent(event);
  };

  useEffect(() => {
    if (!mounted) return;
    
    const interval = setInterval(() => {
      // Update ticker data
      setTickerData(prev => 
        prev.map(item => ({
          ...item,
          change: item.change + (Math.random() - 0.5) * 0.02,
          changePercent: item.changePercent + (Math.random() - 0.5) * 0.01,
        }))
      );
      // Update world times
      setWorldTimes(getWorldTimes());
    }, 2000);

    return () => clearInterval(interval);
  }, [mounted]);

  const formatPrice = (price: number, symbol: string) => {
    if (symbol === "US10Y") return `${price.toFixed(2)}%`;
    if (symbol === "WTI") return `$${price.toFixed(2)}`;
    return price.toFixed(2);
  };

  const formatChange = (change: number) => {
    const sign = change >= 0 ? "+" : "";
    return `${sign}${change.toFixed(2)}`;
  };

  const formatChangePercent = (changePercent: number) => {
    const sign = changePercent >= 0 ? "+" : "";
    return `${sign}${changePercent.toFixed(2)}%`;
  };

  const getChangeIcon = (change: number) => {
    if (change > 0) return <TrendingUp className="h-3 w-3" />;
    if (change < 0) return <TrendingDown className="h-3 w-3" />;
    return <Minus className="h-3 w-3" />;
  };

  const getChangeColor = (change: number) => {
    if (change > 0) return "text-emerald-400";
    if (change < 0) return "text-rose-400";
    return "text-zinc-400";
  };

  // Fix hydration mismatch by only rendering after mount
  if (!mounted) return null;

  // Debug logging for max size screen issues
  console.log('Header mounted:', mounted, 'Window width:', window.innerWidth, 'Screen type:', window.innerWidth >= 1920 ? 'max-size' : 'normal');

  return (
    <div className="relative h-16 bg-purple-900/60 backdrop-blur-xl border-b border-purple-800/50 flex items-center shadow-2xl w-full">
      {/* Ambient glow effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-purple-600/10 via-transparent to-blue-600/10"></div>
      
      {/* Ark Intelligence Branding */}
      <div className="relative px-4 border-r border-purple-800/50 flex items-center space-x-3 min-w-fit">
        {/* Only show hamburger on mobile or when sidebar is closed on desktop */}
        {(!isDesktop || !isSidebarOpen) && (
          <button
            onClick={toggleSidebar}
            className="p-2 rounded-lg hover:bg-purple-800/50 transition-colors group"
            aria-label="Toggle sidebar"
          >
            <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-600 rounded-lg flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow">
              {isSidebarOpen ? <X className="h-5 w-5 text-white" /> : <Menu className="h-5 w-5 text-white" />}
            </div>
          </button>
        )}
        <Link href="/" className="block hover:opacity-80 transition-opacity">
          <h1 className="text-white font-bold text-lg">Ark Intelligence</h1>
          <p className="text-purple-300 text-xs">Macro Trading Dashboard</p>
        </Link>
      </div>

      {/* Market Tickers - Oil, DXY, US10Y */}
      <div className="relative flex-1 flex items-center justify-center min-w-0 px-2 lg:px-4 xl:px-6">
        <div className="flex items-center space-x-2 lg:space-x-4 xl:space-x-6 overflow-x-auto">
          {tickerData.map((item) => (
            <div 
              key={item.symbol} 
              className="group relative flex items-center space-x-2 lg:space-x-3 px-2 lg:px-4 py-2 rounded-lg bg-purple-800/20 hover:bg-purple-800/40 transition-all duration-300 border border-purple-700/30 hover:border-purple-600/50 flex-shrink-0"
            >
              <div className="flex flex-col">
                <span className="text-purple-300 font-mono text-xs font-medium">{item.symbol}</span>
                <span className="text-white font-mono font-bold text-sm">
                  {formatPrice(item.price, item.symbol)}
                </span>
              </div>
              <div className={`flex items-center space-x-1 ${getChangeColor(item.change)}`}>
                {getChangeIcon(item.change)}
                <span className="font-mono text-xs">
                  {formatChangePercent(item.changePercent)}
                </span>
              </div>
              {/* Hover effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600/10 to-blue-600/10 rounded-lg blur opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </div>
          ))}
        </div>
      </div>

      {/* World Times */}
      <div className="relative px-2 lg:px-4 xl:px-6 border-l border-purple-800/50 flex items-center min-w-fit">
        <div className="flex items-center space-x-2 lg:space-x-4">
          <Clock className="h-4 w-4 text-purple-400" />
          <div className="flex items-center space-x-2 lg:space-x-3">
            {worldTimes.map((time) => (
              <div key={time.city} className="flex flex-col items-center">
                <span className="text-purple-300 text-xs font-medium">{time.city}</span>
                <span className="text-purple-200 font-mono text-sm font-bold">{time.time}</span>
                <span className="text-purple-400 text-xs">{time.offset}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
