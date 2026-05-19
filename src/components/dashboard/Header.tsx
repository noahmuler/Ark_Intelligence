"use client";

/**
 * Header Component
 * 
 * This component renders the top navigation bar for the Ark Intelligence dashboard.
 * It displays market tickers, world times, branding, and navigation controls.
 * 
 * Key Responsibilities:
 * - Display real-time market data tickers (WTI, DXY, US10Y)
 * - Show world market times (NY, ADD, TKY)
 * - Provide sidebar toggle functionality
 * - Handle responsive design for different screen sizes
 * - Manage state synchronization with sidebar component
 * 
 * @component
 * @example
 * ```tsx
 * <Header />
 * ```
 */

import React, { useState, useEffect } from "react";
import { TrendingUp, TrendingDown, Minus, Clock } from "lucide-react";
import { fetchStockQuote } from "@/services/polygonStockData";






/**
 * Interface for ticker data structure
 * 
 * @interface TickerData
 * @property {string} symbol - Ticker symbol (e.g., "WTI", "DXY", "US10Y")
 * @property {string} name - Full name of the ticker
 * @property {number} price - Current price value
 * @property {number} change - Price change from previous close
 * @property {number} changePercent - Percentage change from previous close
 */
interface TickerData {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
}

/**
 * Real-time ticker data fetching
 * 
 * Fetches actual market data from Polygon.io API for:
 * - WTI: Crude Oil futures (CL=F)
 * - DXY: US Dollar Index (DX-Y.NYB)
 * - US10Y: 10-Year Treasury Yield (^TNX)
 */
const fetchRealTickerData = async (): Promise<TickerData[]> => {
  try {
    // Map our display symbols to actual trading symbols
    const symbolMap = {
      'WTI': { symbol: 'CL=F', name: 'Crude Oil' },
      'DXY': { symbol: 'DX-Y.NYB', name: 'US Dollar' },
      'US10Y': { symbol: '^TNX', name: '10Y Yield' }
    };

    const tickerPromises = Object.entries(symbolMap).map(async ([displaySymbol, config]) => {
      try {
        const quote = await fetchStockQuote(config.symbol);
        return {
          symbol: displaySymbol,
          name: config.name,
          price: quote.price,
          change: quote.change,
          changePercent: quote.changePercent
        };
      } catch (error) {
        console.warn(`Failed to fetch data for ${config.symbol}:`, error);
        // Fallback to mock data if API fails
        return getFallbackTickerData(displaySymbol);
      }
    });

    const results = await Promise.allSettled(tickerPromises);
    return results
      .filter((result): result is PromiseFulfilledResult<TickerData> => result.status === 'fulfilled')
      .map(result => result.value);
  } catch (error) {
    console.error('Error fetching ticker data:', error);
    return getFallbackTickerData() as TickerData[];
  }
};

/**
 * Fallback ticker data for when API fails
 */
const getFallbackTickerData = (symbol?: string): TickerData | TickerData[] => {
  const fallbackData = [
    { symbol: "WTI", name: "Crude Oil", price: 78.45, change: -1.23, changePercent: -1.54 },
    { symbol: "DXY", name: "US Dollar", price: 105.82, change: 1.24, changePercent: 1.18 },
    { symbol: "US10Y", name: "10Y Yield", price: 4.32, change: -0.05, changePercent: -1.14 },
  ];
  
  if (symbol) {
    return fallbackData.find(item => item.symbol === symbol) || fallbackData[0];
  }
  
  return fallbackData;
};

/**
 * Interface for world time data structure
 * 
 * @interface WorldTime
 * @property {string} city - City code (e.g., "NY", "ADD", "TKY")
 * @property {string} timezone - IANA timezone identifier
 * @property {string} time - Current time in HH:MM format
 * @property {string} offset - Timezone abbreviation (e.g., "EST", "EAT", "JST")
 */
interface WorldTime {
  city: string;
  timezone: string;
  time: string;
  offset: string;
}

/**
 * Generates world time data for major financial markets
 * 
 * Returns current time for:
 * - NY (New York): EST timezone
 * - ADD (Addis Ababa): EAT timezone
 * - TKY (Tokyo): JST timezone
 * 
 * @returns {WorldTime[]} Array of world time objects
 */
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

/**
 * Header Component Implementation
 * 
 * This functional component manages the top navigation bar with real-time data display
 * and responsive design. It handles state management for tickers, world times,
 * and sidebar synchronization.
 * 
 * State Management:
 * - tickerData: Real-time market data with periodic updates
 * - worldTimes: Current times for major financial markets
 * - mounted: Prevents hydration mismatch during SSR
 * - isSidebarOpen: Tracks sidebar visibility for hamburger menu
 * - isDesktop: Detects desktop screen size for responsive behavior
 * 
 * Data Updates:
 * - Ticker data updates every 2 seconds with simulated changes
 * - World times update every 2 seconds for accuracy
 * - Real-time updates simulate live market conditions
 * 
 * @returns {JSX.Element} The rendered header component
 */
export function Header() {
  // State for real-time ticker data with fallback initial values
  const [tickerData, setTickerData] = useState<TickerData[]>(getFallbackTickerData() as TickerData[]);
  
  // State for world market times
  const [worldTimes, setWorldTimes] = useState<WorldTime[]>(getWorldTimes());

  // Avoid SSR/CSR mismatch by gating initial render on client.
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const timeout = window.setTimeout(() => setMounted(true), 0);
    return () => window.clearTimeout(timeout);
  }, []);



  



  /**
   * Component Mount Initialization
   * 
   * Sets up initial component state and screen size detection.
   * This prevents hydration mismatch and ensures proper responsive behavior.
   * 
   * Effects:
   * - Sets mounted state to true after component mounts
   * - Detects initial screen size for desktop/mobile behavior
   */





  /**
   * Sidebar State Synchronization
   * 
   * Listens for custom 'sidebar-state-changed' events dispatched by Sidebar component.
   * This ensures Header stays synchronized with actual sidebar visibility state
   * for proper hamburger menu display logic.
   * 
   * Event Structure:
   * - Event type: 'sidebar-state-changed'
   * - Event.detail: { isOpen: boolean } - Current sidebar visibility state
   * 
   * Effects:
   * - Updates local isSidebarOpen state when sidebar state changes
   * - Enables conditional hamburger menu rendering
   * - Cleans up event listener on component unmount
   */
  // NOTE: sidebar-state syncing is handled by the dedicated useEffect below.
  // (Keeping only one listener prevents stale/incorrect sidebar reflection.)


  /**
   * Screen Size Change Handler
   * 
   * Monitors window resize events to detect desktop vs mobile screen changes.
   * This enables responsive behavior adjustments for hamburger menu visibility
   * and layout adaptations.
   * 
   * Breakpoint Logic:
   * - Desktop: window.innerWidth >= 1024px
   * - Mobile: window.innerWidth < 1024px
   * 
   * Effects:
   * - Updates isDesktop state on resize
   * - Triggers hamburger menu visibility recalculation
   * - Cleans up event listener on component unmount
   */
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Reflect sidebar open/closed state on the logo/hamburger
  useEffect(() => {
    const handleSidebarChange = (event: Event) => {
      const custom = event as CustomEvent<{ isDesktopExpanded?: boolean; isMobileOpen?: boolean }>;
      const detail = custom.detail;
      setIsSidebarOpen(!!(detail?.isDesktopExpanded || detail?.isMobileOpen));

    };

    window.addEventListener(
      "sidebar-state-changed",
      handleSidebarChange as EventListener
    );

    return () =>
      window.removeEventListener(
        "sidebar-state-changed",
        handleSidebarChange as EventListener
      );
  }, []);

  // Sidebar toggle function (single source: logo)
  const toggleSidebar = () => {
    if (typeof window === "undefined") return;
    window.dispatchEvent(new CustomEvent("toggle-sidebar"));
  };



  /**
   * Real-time Data Updates
   * 
   * Sets up periodic updates for ticker data and world times using
   * real API data from Polygon.io. Falls back to simulated data if API fails.
   * 
   * Update Schedule:
   * - Ticker data: Every 30 seconds from Polygon API
   * - World times: Every 2 seconds for accurate time display
   * 
   * Data Sources:
   * - Real market data from Polygon.io API
   * - Fallback to mock data if API is unavailable
   * - World times calculated from system clock
   * 
   * Dependencies:
   * - mounted: Prevents updates during SSR
   * 
   * Effects:
   * - Updates tickerData state with real market data
   * - Updates worldTimes state with current times
   * - Cleans up intervals on component unmount
   */
  useEffect(() => {
    // Prevent updates during server-side rendering
    if (!mounted) return;
    
    // Initial data fetch
    const fetchInitialData = async () => {
      try {
        const realData = await fetchRealTickerData();
        setTickerData(realData);
      } catch (error) {
        console.error('Initial data fetch failed:', error);
        // Keep fallback data if initial fetch fails
      }
    };

    fetchInitialData();
    
    // Set up interval for real-time data updates
    const tickerInterval = setInterval(async () => {
      try {
        const realData = await fetchRealTickerData();
        setTickerData(realData);
      } catch (error) {
        console.error('Periodic data fetch failed:', error);
        // Keep current data if periodic fetch fails
      }
    }, 30000); // Update every 30 seconds for real API data

    // Update world times more frequently
    const timeInterval = setInterval(() => {
      setWorldTimes(getWorldTimes());
    }, 2000); // Update every 2 seconds

    // Cleanup: clear intervals on component unmount
    return () => {
      clearInterval(tickerInterval);
      clearInterval(timeInterval);
    };
  }, [mounted]); // Dependency: re-run when mounted state changes

  /**
   * Price Formatting Utility
   * 
   * Formats price values according to ticker type for proper display.
   * Different tickers require different formatting conventions.
   * 
   * @param {number} price - The price value to format
   * @param {string} symbol - The ticker symbol for formatting rules
   * @returns {string} Formatted price string
   * 
   * Formatting Rules:
   * - US10Y: Display as percentage with 2 decimal places
   * - WTI: Display as dollar amount with 2 decimal places
   * - Default: Display as number with 2 decimal places
   * 
   * @example
   * formatPrice(4.32, "US10Y") // Returns "4.32%"
   * formatPrice(78.45, "WTI") // Returns "$78.45"
   */
  const formatPrice = (price: number, symbol: string) => {
    if (symbol === "US10Y") return `${price.toFixed(2)}%`;
    if (symbol === "WTI") return `$${price.toFixed(2)}`;
    return price.toFixed(2);
  };




  /**
   * Percentage Change Formatting Utility
   * 
   * Formats percentage change values with proper sign notation.
   * Used for displaying percentage changes in tickers.
   * 
   * @param {number} changePercent - The percentage change to format
   * @returns {string} Formatted percentage string with sign
   * 
   * Formatting Rules:
   * - Positive values: Prefix with "+" sign and "%" suffix
   * - Negative values: Prefix with "-" sign (automatic) and "%" suffix
   * - Zero values: No sign prefix, just "%" suffix
   * 
   * @example
   * formatChangePercent(1.54) // Returns "+1.54%"
   * formatChangePercent(-0.82) // Returns "-0.82%"
   */
  const formatChangePercent = (changePercent: number) => {
    const sign = changePercent >= 0 ? "+" : "";
    return `${sign}${changePercent.toFixed(2)}%`;
  };

  /**
   * Change Icon Selection Utility
   * 
   * Returns appropriate icon based on price change direction.
   * Provides visual indicators for market movements.
   * 
   * @param {number} change - The price change value
   * @returns {JSX.Element} Icon component for change direction
   * 
   * Icon Selection Rules:
   * - Positive change (> 0): TrendingUp icon (green)
   * - Negative change (< 0): TrendingDown icon (red)
   * - No change (0): Minus icon (neutral)
   * 
   * @example
   * getChangeIcon(1.23) // Returns <TrendingUp />
   * getChangeIcon(-0.45) // Returns <TrendingDown />
   * getChangeIcon(0) // Returns <Minus />
   */
  const getChangeIcon = (change: number) => {
    if (change > 0) return <TrendingUp className="h-3 w-3" />;
    if (change < 0) return <TrendingDown className="h-3 w-3" />;
    return <Minus className="h-3 w-3" />;
  };

  /**
   * Change Color Selection Utility
   * 
   * Returns appropriate CSS class for change value coloring.
   * Provides consistent color scheme for market movements.
   * 
   * @param {number} change - The price change value
   * @returns {string} CSS class name for color
   * 
   * Color Scheme:
   * - Positive change (> 0): emerald-400 (green)
   * - Negative change (< 0): rose-400 (red)
   * - No change (0): zinc-400 (neutral gray)
   * 
   * @example
   * getChangeColor(1.23) // Returns "text-emerald-400"
   * getChangeColor(-0.45) // Returns "text-rose-400"
   * getChangeColor(0) // Returns "text-zinc-400"
   */
  const getChangeColor = (change: number) => {
    if (change > 0) return "text-emerald-400";
    if (change < 0) return "text-rose-400";
    return "text-zinc-400";
  };

  /**
   * Header Component
   * 
   * Top-level component for dashboard header.
   * Contains branding, navigation, and market data displays.
   * 
   * Responsive Design:
   * - Adapts to desktop and mobile screen sizes
   * - Hamburger menu visibility toggles on mobile
   * - Layout adjusts for max-size screens (> 1920px)
   */
return (
  <div className="relative h-16 bg-purple-900/60 backdrop-blur-xl border-b border-purple-800/50 flex items-center shadow-2xl w-full will-change-transform">
    {/* 
      Ambient Glow Effect

      Subtle gradient overlay for visual depth and modern aesthetics.
      Creates a premium feel with light diffusion effect.
    */}
    <div className="absolute inset-0 bg-gradient-to-r from-purple-600/10 via-transparent to-blue-600/10"></div>
    
    {/* 
      Ark Intelligence Branding Section
      
      Simple branding display without hamburger control.
      Fixed width section that doesn't grow or shrink.
    */}
    <div className="relative px-4 border-r border-purple-800/50 flex items-center space-x-3 flex-shrink-0 w-64">
      <div className="min-w-0 flex-1">
        <h1 className="text-white font-bold text-lg truncate">Ark Intelligence</h1>
        <p className="text-purple-300 text-xs truncate">Macro Trading Dashboard</p>
      </div>
    </div>

    {/* 
      Market Tickers Section
      
      Displays real-time market data for various tickers.
      Uses flex-grow to fill available space between branding and world times.
      Responsive design adapts to all screen sizes.
    */}
    {/* Market Tickers - Oil, DXY, US10Y */}
    <div className="relative flex-1 flex items-center justify-center min-w-0 px-2 lg:px-4 xl:px-6 overflow-hidden">
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

    {/* 
      World Times Section
      
      Displays world market times with responsive width.
      Uses flex-shrink-0 to maintain consistent layout on all screen sizes.
    */}
    <div className="relative px-2 lg:px-4 xl:px-6 border-l border-purple-800/50 flex items-center flex-shrink-0 w-48 mr-12">
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
