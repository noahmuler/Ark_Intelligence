"use client";

/**
 * Sidebar Component
 * 
 * This component renders the navigation sidebar for the Ark Intelligence dashboard.
 * It provides navigation between different sections and manages responsive behavior.
 * 
 * Key Responsibilities:
 * - Display navigation menu items with active state indication
 * - Handle responsive design for desktop and mobile
 * - Manage sidebar visibility state and toggle functionality
 * - Provide theme switching controls
 * - Coordinate with Header component via custom events
 * 
 * @component
 * @example
 * ```tsx
 * <Sidebar />
 * ```
 */

import React, { useState, useEffect } from "react";
import { 
  LayoutDashboard, 
  TrendingUp, 
  Coins, 
  Calendar,
  Settings,
  Activity,
  X,
  Globe
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

/**
 * Navigation configuration for the sidebar
 * 
 * Each navigation item contains:
 * - name: Display text for the navigation item
 * - href: Route path for navigation
 * - icon: Lucide React icon component
 * 
 * Navigation Structure:
 * - Dashboard: Main dashboard view
 * - Macro Desk: Macro economic analysis
 * - Economic Calendar: Economic events calendar
 * - Reports: Generated reports and analytics
 * - Settings: Application settings and preferences
 */
const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Macro Desk", href: "/macro", icon: TrendingUp },
  { name: "Economic Calendar", href: "/calendar", icon: Calendar },
  { name: "Reports", href: "/reports", icon: Activity },
  { name: "Settings", href: "/settings", icon: Settings },
];

/**
 * Sidebar Component Implementation
 * 
 * This functional component manages the navigation sidebar with responsive design
 * and proper state management for visibility and user interactions.
 * 
 * State Management:
 * - pathname: Current route for active navigation indication
 * - isMobileMenuOpen: Controls mobile menu visibility
 * - isSidebarOpen: Controls desktop sidebar visibility
 * - isDesktop: Detects desktop screen size for responsive behavior
 * 
 * Responsive Behavior:
 * - Desktop: Sidebar is always visible and can be toggled
 * - Mobile: Sidebar is hidden by default, accessed via hamburger menu
 * - Overlay: Shows on mobile when sidebar is open
 * 
 * @returns {JSX.Element} The rendered sidebar component
 */
export function Sidebar() {
  // Get current pathname for active navigation state
  const pathname = usePathname();
  
  // State for mobile menu visibility (controlled by hamburger menu)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // State for desktop sidebar visibility (controlled by toggle button)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // State to detect desktop screen size for responsive behavior
  const [isDesktop, setIsDesktop] = useState(false);

  /**
   * Screen Size Detection
   * 
   * Monitors window resize events to detect desktop vs mobile screen changes.
   * This enables responsive behavior adjustments for sidebar visibility.
   * 
   * Breakpoint Logic:
   * - Desktop: window.innerWidth >= 1024px
   * - Mobile: window.innerWidth < 1024px
   * 
   * Effects:
   * - Updates isDesktop state on resize
   * - Triggers responsive behavior changes
   * - Cleans up event listener on component unmount
   */
  useEffect(() => {
    const checkScreenSize = () => {
      setIsDesktop(window.innerWidth >= 1024);
    };
    
    // Initial screen size check
    checkScreenSize();
    
    // Add resize event listener
    window.addEventListener('resize', checkScreenSize);
    
    // Cleanup: remove event listener on component unmount
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []); // Empty dependency array - effect runs only once on mount

  /**
   * Desktop Sidebar Auto-Open
   * 
   * Automatically opens sidebar when screen size is desktop (≥1024px).
   * This provides consistent desktop experience where sidebar is expected
   * to be visible by default.
   * 
   * Logic:
   * - Checks if current screen size meets desktop breakpoint
   * - Sets sidebar to open state on desktop screens
   * - Respects manual user toggle actions
   * 
   * Dependencies:
   * - isDesktop: Triggers effect when screen size changes
   */
  useEffect(() => {
    if (isDesktop) {
      setIsSidebarOpen(true);
    }
  }, [isDesktop]); // Dependency: re-run when isDesktop changes

  /**
   * Sidebar Toggle Event Handler
   * 
   * Listens for custom 'toggle-sidebar' events dispatched by Header component.
   * This enables cross-component communication for sidebar visibility control.
   * 
   * Event Structure:
   * - Event type: 'toggle-sidebar'
   * - No payload required (Sidebar handles toggle logic internally)
   * 
   * Toggle Logic:
   * - Desktop: Toggle sidebar visibility state
   * - Mobile: Toggle mobile menu visibility state
   * - Emits state change event for Header synchronization
   * 
   * Effects:
   * - Updates appropriate state based on screen size
   * - Dispatches state change event for cross-component sync
   * - Cleans up event listener on component unmount
   */
  useEffect(() => {
    const handleToggleSidebar = () => {
      if (isDesktop) {
        // On desktop, toggle sidebar state
        const newState = !isSidebarOpen;
        setIsSidebarOpen(newState);
        // Emit state change for Header to track
        window.dispatchEvent(new CustomEvent('sidebar-state-changed', { detail: { isOpen: newState } }));
      } else {
        // On mobile, toggle mobile menu
        const newState = !isMobileMenuOpen;
        setIsMobileMenuOpen(newState);
        // Emit state change for Header to track
        window.dispatchEvent(new CustomEvent('sidebar-state-changed', { detail: { isOpen: newState } }));
      }
    };

    // Add custom event listener for sidebar toggle requests
    window.addEventListener('toggle-sidebar', handleToggleSidebar);
    
    // Cleanup: remove event listener on component unmount
    return () => window.removeEventListener('toggle-sidebar', handleToggleSidebar);
  }, [isSidebarOpen, isMobileMenuOpen, isDesktop]); // Dependencies: re-run when states or screen size changes

  return (
    /**
     * Sidebar Component Container
     * 
     * Fragment wrapper containing sidebar and overlay elements.
     * Enables conditional rendering of overlay based on mobile menu state.
     */
    <>
      {/* 
        Sidebar Navigation Panel
        
        Main navigation container with responsive visibility:
        - Desktop: Always visible, can be toggled
        - Mobile: Hidden by default, slides in when open
        
        Visibility Logic:
        - Desktop: Uses lg:relative for static positioning
        - Mobile: Uses fixed positioning with translate-x transforms
        - Transitions: Smooth slide-in/out animations
      */}
      <div className={`
        fixed inset-y-0 left-0 z-40 w-64 flex-col
        transform transition-transform duration-300 ease-in-out
        ${isDesktop ? 
          (isSidebarOpen ? "translate-x-0 lg:relative" : "-translate-x-full lg:relative") : 
          (isMobileMenuOpen ? "translate-x-0" : "-translate-x-full")
        }
      `}>
        <div className="h-full bg-purple-950/95 backdrop-blur-xl border-r border-purple-800/70 shadow-2xl">
          {/* 
            Logo Section
            
            Contains application branding with animated gradient effects.
            Positioned at top of sidebar for brand recognition.
          */}
          <div className="flex h-16 items-center px-6 border-b border-purple-800/50">
            <div className="flex items-center space-x-3">
              {/* 
                Animated Logo Container
                
                Features gradient background with blur effect for modern appearance.
                Activity icon represents trading and market activity.
              */}
              <div className="relative">
                <div className="absolute -inset-1 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg blur opacity-25"></div>
                <div className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-r from-purple-600 to-blue-600 shadow-lg">
                  <Activity className="h-5 w-5 text-white" />
                </div>
              </div>
              {/* 
                Brand Name
                
                Uses gradient text effect for visual appeal.
                Represents Ark Intelligence brand identity.
              */}
              <span className="text-lg font-bold text-white bg-gradient-to-r from-purple-200 to-blue-200 bg-clip-text text-transparent">Ark Intelligence</span>
            </div>
          </div>

          {/* 
            Navigation Menu
            
            Main navigation items with active state indication.
            Maps through navigation configuration array.
          */}
          <nav className="flex-1 space-y-2 px-3 py-6">
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => {
                    // Close sidebar after navigation (different behavior for desktop/mobile)
                    if (isDesktop) {
                      setIsSidebarOpen(false);
                    } else {
                      setIsMobileMenuOpen(false);
                    }
                  }}
                  className={`
                    group relative flex items-center rounded-xl px-3 py-3 text-sm font-medium transition-all duration-200
                    ${isActive
                      ? "bg-gradient-to-r from-purple-800/50 to-blue-800/50 text-white shadow-lg border border-purple-700/50"
                      : "text-purple-300 hover:bg-purple-800/30 hover:text-white hover:shadow-md"
                    }
                  `}
                >
                  {/* 
                    Active State Background Effect
                    
                    Subtle gradient overlay for active navigation items.
                    Provides visual depth and modern appearance.
                  */}
                  {isActive && (
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-blue-600/20 rounded-xl blur-xl"></div>
                  )}
                  {/* 
                    Navigation Icon
                    
                    Changes color based on active/hover state.
                    Uses Lucide React icons for consistency.
                  */}
                  <item.icon
                    className={`relative mr-3 h-5 w-5 flex-shrink-0 transition-colors ${
                      isActive ? "text-purple-200" : "text-purple-400 group-hover:text-white"
                    }`}
                  />
                  {/* 
                    Navigation Label
                    
                    Display text for navigation item.
                    Positioned relative to appear above background effects.
                  */}
                  <span className="relative">{item.name}</span>
                  {/* 
                    Active State Indicator
                    
                    Pulsing dot indicator for currently active page.
                    Provides clear visual feedback for current location.
                  */}
                  {isActive && (
                    <div className="absolute right-2 w-2 h-2 bg-gradient-to-r from-purple-400 to-blue-400 rounded-full animate-pulse"></div>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* 
            Bottom Section
            
            Contains theme toggle and settings link.
            Positioned at bottom of sidebar for easy access.
          */}
          <div className="border-t border-purple-800/50 p-3 space-y-3">
            {/* 
              Theme Toggle Section
              
              Provides theme switching functionality.
              Allows users to toggle between light and dark modes.
            */}
            <div className="flex items-center justify-between px-3 py-2">
              <span className="text-purple-300 text-sm font-medium">Theme</span>
              <ThemeToggle />
            </div>
            {/* 
              Settings Link
              
              Navigation link to settings page.
              Uses same styling as navigation items for consistency.
              Closes sidebar after navigation (different behavior for desktop/mobile)
            */}
            <Link
              href="/settings"
              onClick={() => {
                // Close sidebar after navigation (different behavior for desktop/mobile)
                if (isDesktop) {
                  setIsSidebarOpen(false);
                } else {
                  setIsMobileMenuOpen(false);
                }
              }}
              className="group relative flex items-center rounded-xl px-3 py-3 text-sm font-medium text-purple-300 transition-all duration-200 hover:bg-purple-800/30 hover:text-white hover:shadow-md"
            >
              <Settings className="mr-3 h-5 w-5 flex-shrink-0" />
              <span>Settings</span>
            </Link>
          </div>
        </div>
      </div>

      {/* 
        Mobile Overlay
        
        Backdrop overlay that appears when mobile menu is open.
        Provides click-outside-to-close functionality.
        
        Visibility Logic:
        - Only shows on mobile (not desktop)
        - Only when mobile menu is open
        - Clicking overlay closes mobile menu
        
        Styling:
        - Fixed positioning to cover entire screen
        - Semi-transparent background with blur effect
        - High z-index to appear above content
      */}
      {isMobileMenuOpen && !isDesktop && (
        <div
          className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm"
          onClick={() => {
            // Close mobile menu when overlay is clicked
            setIsMobileMenuOpen(false);
          }}
        />
      )}
    </>
  );
}
