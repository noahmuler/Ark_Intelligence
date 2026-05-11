"use client";

/**
 * MainLayout Component
 * 
 * This component serves as the primary layout wrapper for the Ark Intelligence dashboard.
 * It manages the overall page structure including the sidebar, header, and main content area.
 * 
 * Key Responsibilities:
 * - Provides responsive layout structure
 * - Manages sidebar state and main content positioning
 * - Handles window resize events for responsive behavior
 * - Coordinates sidebar state synchronization across components
 * 
 * @component
 * @example
 * ```tsx
 * <MainLayout>
 *   <YourDashboardContent />
 * </MainLayout>
 * ```
 */

import React, { useState, useEffect } from "react";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { ThemeProvider } from "@/contexts/ThemeContext";

/**
 * Props interface for MainLayout component
 * 
 * @interface MainLayoutProps
 * @property {React.ReactNode} children - The child components to render within the layout
 */
interface MainLayoutProps {
  children: React.ReactNode;
}

/**
 * MainLayout Component Implementation
 * 
 * This functional component manages the overall dashboard layout with responsive design
 * and proper state management for sidebar visibility and content positioning.
 * 
 * State Management:
 * - windowWidth: Tracks current window width for responsive behavior
 * - isSidebarOpen: Tracks sidebar visibility state for content positioning
 * 
 * Event Handling:
 * - Window resize events for responsive layout adjustments
 * - Custom sidebar state change events for cross-component synchronization
 * 
 * @param {MainLayoutProps} props - Component props
 * @returns {JSX.Element} The rendered layout component
 */
export function MainLayout({ children }: MainLayoutProps) {
  // State to track current window width for responsive design decisions
  const [windowWidth, setWindowWidth] = useState(0);

  /**
   * Window Resize Event Handler
   * 
   * Sets up event listener for window resize events to track screen width changes.
   * This enables responsive behavior adjustments based on current screen size.
   * 
   * Effects:
   * - Updates windowWidth state on resize
   * - Cleans up event listener on component unmount
   * - Initial call to set correct width on mount
   */
  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };

    // Add resize event listener
    window.addEventListener('resize', handleResize);
    
    // Initial call to set current window width
    handleResize();
    
    // Cleanup: remove event listener on component unmount
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []); // Empty dependency array - effect runs only once on mount

  
  return (
    <ThemeProvider>
      {/* 
        Main Container
        
        Provides the full-screen background with gradient effects and theme support.
        Uses responsive design patterns with smooth transitions for theme changes.
        
        Styling:
        - Full viewport height (min-h-screen)
        - Gradient background with theme-aware colors
        - Smooth transitions for theme switching
      */}
      <div className="min-h-screen bg-gradient-to-br from-purple-950 via-blue-950 to-black dark:from-purple-950 dark:via-blue-950 dark:to-black light:from-gray-50 light:via-blue-50 light:to-blue-50 transition-all duration-300 ease-in-out" style={{display: 'flex', flexDirection: 'column'}}>
        {/* 
          Ambient Background Effects
          
          Creates animated background elements for visual depth and modern aesthetics.
          These are purely decorative and don't affect functionality.
          
          Effects:
          - Floating gradient orbs with blur effects
          - Pulsing animations with staggered delays
          - Fixed positioning for consistent background
          - Pointer-events-none to prevent interaction interference
        */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          {/* Top-right purple orb */}
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl animate-pulse-slow"></div>
          {/* Bottom-left blue orb */}
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '1s' }}></div>
          {/* Center purple orb */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '2s' }}></div>
        </div>
        
        {/* 
          Layout Container
          
          Contains sidebar and main content with proper flexbox layout.
          Uses flexbox to ensure proper positioning and spacing.
          
          Layout Strategy:
          - Sidebar: Fixed width, participates in flex layout
          - Main Content: Takes remaining space with flex-1
          - No overlap or positioning conflicts
        */}
        <div className="flex min-h-screen">
          {/* 
            Sidebar Component
            
            Renders navigation sidebar with responsive behavior.
            The sidebar manages its own visibility state and communicates
            with this component via custom events.
          */}
          <Sidebar />
          
          {/* 
            Main Content Area
            
            Contains header and main page content with responsive layout.
            Uses flex-1 to take remaining space in flex layout.
            
            Layout Logic:
            - Takes remaining space after sidebar with flex-1
            - Responsive behavior handled by sidebar component
            - Smooth transitions for layout changes
          */}
          <div className="flex-1 flex flex-col relative transition-all duration-300">
            {/* 
              Header Component
                
                Renders the top navigation bar with full width.
                The header handles its own responsive behavior and state management.
                
                Note: Header is positioned at top of main content area
                and margin is now properly conditional on sidebar visibility.
              */}
              <Header />
              
              {/* 
                Page Content Container
                
                Main content area with gradient overlay and responsive container.
                Provides consistent spacing and layout for all page content.
                
                Features:
                - Flexible layout (flex-1) to fill remaining space
                - Scrollable content area (overflow-auto)
                - Gradient overlay for visual depth
                - Responsive container with progressive padding
              */}
              <main className="flex-1 overflow-auto relative w-full" style={{position: 'relative', top: 0}}>
                {/* 
                  Content Gradient Overlay
                    
                    Subtle gradient overlay for visual depth and readability.
                    Positioned absolutely to not affect content flow.
                */}
                <div className="absolute inset-0 bg-gradient-to-t from-purple-950/30 via-transparent to-transparent pointer-events-none"></div>
                
                {/* 
                  Content Container
                    
                    Responsive container with progressive padding based on screen size.
                    Ensures consistent content spacing across all devices.
                    
                    Breakpoint Strategy:
                    - Default: px-4 (16px)
                    - Small (640px+): px-6 (24px)
                    - Large (1024px+): px-8 (32px)
                    - Extra Large (1280px+): px-12 (48px)
                    - 2X Large (1536px+): px-16 (64px)
                    - Max width: max-w-screen-2xl for optimal readability
                  */}
                  <div className="relative w-full max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16">
                    {/* Render child components within content container */}
                    {children}
                  </div>
                </main>
              </div>
            </div>
      </div>
    </ThemeProvider>
  );
}
