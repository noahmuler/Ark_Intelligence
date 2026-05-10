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
import { TrendingUp, TrendingDown, Minus, Globe, Clock, Menu, X } from "lucide-react";
import Link from "next/link";

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
 * Mock ticker data for development and testing
 * In production, this would be replaced with real-time API data
 * 
 * Current mock data includes:
 * - WTI: Crude Oil futures
 * - DXY: US Dollar Index
 * - US10Y: 10-Year Treasury Yield
 */
const mockTickerData: TickerData[] = [
  { symbol: "WTI", name: "Crude Oil", price: 78.45, change: -1.23, changePercent: -1.54 },
  { symbol: "DXY", name: "US Dollar", price: 105.82, change: 1.24, changePercent: 1.18 },
  { symbol: "US10Y", name: "10Y Yield", price: 4.32, change: -0.05, changePercent: -1.14 },
];

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
  // State for real-time ticker data with mock initial values
  const [tickerData, setTickerData] = useState<TickerData[]>(mockTickerData);
  
  // State for world market times
  const [worldTimes, setWorldTimes] = useState<WorldTime[]>(getWorldTimes());
  
  // State to prevent hydration mismatch during server-side rendering
  const [mounted, setMounted] = useState(false);
  
  // State to track sidebar visibility for hamburger menu display
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // State to detect desktop screen size for responsive behavior
  const [isDesktop, setIsDesktop] = useState(false);

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
  useEffect(() => {
    setMounted(true);
    // Check initial screen size to determine desktop/mobile behavior
    setIsDesktop(window.innerWidth >= 1024);
  }, []);

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
  useEffect(() => {
    const handleSidebarChange = (event: CustomEvent) => {
      setIsSidebarOpen(event.detail.isOpen);
    };

    // Add custom event listener for sidebar state changes
    window.addEventListener('sidebar-state-changed', handleSidebarChange as EventListener);
    
    // Cleanup: remove event listener on component unmount
    return () => window.removeEventListener('sidebar-state-changed', handleSidebarChange as EventListener);
  }, []); // Empty dependency array - effect runs only once on mount

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
  useEffect(() => {
    const handleResize = () => {
      setIsDesktop(window.innerWidth >= 1024);
    };

    // Add resize event listener for screen size changes
    window.addEventListener('resize', handleResize);
    
    // Cleanup: remove event listener on component unmount
    return () => window.removeEventListener('resize', handleResize);
  }, []); // Empty dependency array - effect runs only once on mount

  // Sidebar toggle function
  const toggleSidebar = () => {
    const event = new CustomEvent('toggle-sidebar');
    window.dispatchEvent(event);
  };

  /**
   * Real-time Data Updates
   * 
   * Sets up periodic updates for ticker data and world times to simulate
   * real-time market conditions. In production, this would be replaced
   * with WebSocket connections for live data streaming.
   * 
   * Update Schedule:
   * - Ticker data: Every 2 seconds with simulated price movements
   * - World times: Every 2 seconds for accurate time display
   * 
   * Data Simulation:
   * - Ticker changes use random walk algorithm for realistic movements
   * - Price changes are small and incremental
   * - Percentage changes are calculated proportionally
   * 
   * Dependencies:
   * - mounted: Prevents updates during SSR
   * 
   * Effects:
   * - Updates tickerData state with simulated market movements
   * - Updates worldTimes state with current times
   * - Cleans up interval on component unmount
   */
  useEffect(() => {
    // Prevent updates during server-side rendering
    if (!mounted) return;
    
    // Set up interval for real-time data updates
    const interval = setInterval(() => {
      // Update ticker data with simulated market movements
      setTickerData(prev => 
        prev.map(item => ({
          ...item,
          // Simulate small price changes using random walk
          change: item.change + (Math.random() - 0.5) * 0.02,
          changePercent: item.changePercent + (Math.random() - 0.5) * 0.01,
        }))
      );
      
      // Update world times with current time
      setWorldTimes(getWorldTimes());
    }, 2000); // Update every 2 seconds

    // Cleanup: clear interval on component unmount
    return () => clearInterval(interval);
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
   * Change Value Formatting Utility
   * 
   * Formats price change values with proper sign notation.
   * Ensures consistent display of positive and negative changes.
   * 
   * @param {number} change - The change value to format
   * @returns {string} Formatted change string with sign
   * 
   * Formatting Rules:
   * - Positive values: Prefix with "+" sign
   * - Negative values: Prefix with "-" sign (automatic)
   * - Zero values: No sign prefix
   * 
   * @example
   * formatChange(1.23) // Returns "+1.23"
   * formatChange(-0.45) // Returns "-0.45"
   */
  const formatChange = (change: number) => {
    const sign = change >= 0 ? "+" : "";
    return `${sign}${change.toFixed(2)}`;
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
   * Hydration Mismatch Prevention
   * 
   * Returns null during server-side rendering to prevent hydration mismatches.
   * This ensures consistent rendering between server and client.
   * 
   * Why this is needed:
   * - Server renders with default state values
   * - Client may have different initial state (e.g., sidebar open)
   * - Returning null prevents flash of incorrect content
   * 
   * @returns {null | JSX.Element} Null during SSR, component after mount
   */
  if (!mounted) return null;

  /**
   * Development Debug Logging
   * 
   * Logs component state and screen information for debugging purposes.
   * Particularly useful for identifying responsive design issues.
   * 
   * Logged Information:
   * - Component mount status
   * - Current window width
   * - Screen type classification (max-size vs normal)
   * 
   * TODO: Remove or replace with proper logging system in production
   */
  console.log('Header mounted:', mounted, 'Window width:', window.innerWidth, 'Screen type:', window.innerWidth >= 1920 ? 'max-size' : 'normal');

  return (
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
    <div className="relative h-16 bg-purple-900/60 backdrop-blur-xl border-b border-purple-800/50 flex items-center shadow-2xl w-full">
      {/* 
        Ambient Glow Effect
        
        Subtle gradient overlay for visual depth and modern aesthetics.
        Creates a premium feel with light diffusion effect.
      */}
      <div className="absolute inset-0 bg-gradient-to-r from-purple-600/10 via-transparent to-blue-600/10"></div>
      
      {/* 
        Ark Intelligence Branding Section
        
        Contains logo, hamburger menu, and site title.
        Positioned on the left side of the header.
      */}
      <div className="relative px-4 border-r border-purple-800/50 flex items-center space-x-3 min-w-fit">
        {/* 
          Hamburger Menu Button
          
          Conditional rendering based on screen size and sidebar state:
          - Mobile: Always visible (isDesktop = false)
          - Desktop: Only visible when sidebar is closed (isSidebarOpen = false)
          
          Accessibility:
          - Proper ARIA label for screen readers
          - Keyboard accessible with focus states
        */}
        {(!isDesktop || !isSidebarOpen) && (
          <button
            onClick={toggleSidebar}
            className="p-2 rounded-lg hover:bg-purple-800/50 transition-colors group"
            aria-label="Toggle sidebar"
          >
            {/* 
              Hamburger Icon Container
              
              Styled button with gradient background and hover effects.
              Icon changes between Menu and X based on sidebar state.
            */}
            <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-600 rounded-lg flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow">
              {isSidebarOpen ? <X className="h-5 w-5 text-white" /> : <Menu className="h-5 w-5 text-white" />}
            </div>
          </button>
        )}
        
        {/* 
          Site Branding Link
          
          Links to homepage with hover effects.
          Contains main title and subtitle.
        */}
        <Link href="/" className="block hover:opacity-80 transition-opacity">
          <h1 className="text-white font-bold text-lg">Ark Intelligence</h1>
          <p className="text-purple-300 text-xs">Macro Trading Dashboard</p>
        </Link>
      </div>

      {/* 
        Market Tickers Section
        
        Displays real-time market data for various tickers.
        Includes price, change, and percentage change information.
      */}
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
