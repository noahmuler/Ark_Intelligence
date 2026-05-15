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
 */

import React, { useEffect, useState } from "react";

import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { useTheme } from "@/contexts/ThemeContext";

interface MainLayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const { theme } = useTheme();
  const [, setWindowWidth] = useState(0);

  // Used only to offset layout for desktop sidebar rail.
  // (Keeps header/main aligned when sidebar expands/collapses.)
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
      setIsDesktop(window.innerWidth >= 1024);
    };

    window.addEventListener("resize", handleResize);
    handleResize();

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  useEffect(() => {
    const handleSidebarChanged = (event: Event) => {
      const custom = event as CustomEvent<{ isDesktopExpanded?: boolean }>;
      const detail = custom.detail;

      if (!detail) return;

      setIsSidebarExpanded(!!detail.isDesktopExpanded);


    };

    window.addEventListener("sidebar-state-changed", handleSidebarChanged as EventListener);

    return () =>
      window.removeEventListener(
        "sidebar-state-changed",
        handleSidebarChanged as EventListener
      );
  }, []);

  return (
      <div
        className={`min-h-screen transition-all duration-300 ease-in-out ${
          theme === 'dark' 
            ? 'bg-gradient-to-br from-purple-950 via-blue-950 to-black' 
            : 'bg-gradient-to-br from-gray-50 via-blue-50 to-blue-100'
        }`}
        style={{ display: "flex", flexDirection: "column" }}
      >
        <div className={`fixed inset-0 overflow-hidden pointer-events-none ${
          theme === 'dark' ? '' : 'opacity-30'
        }`}>
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl animate-pulse-slow" />
          <div
            className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl animate-pulse-slow"
            style={{ animationDelay: "1s" }}
          />
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl animate-pulse-slow"
            style={{ animationDelay: "2s" }}
          />
        </div>

        <div className="flex min-h-screen">
          <Sidebar />

          <div
            className={`flex-1 flex flex-col relative transition-all duration-300 ${
              isDesktop ? (isSidebarExpanded ? "lg:pl-64" : "lg:pl-20") : ""
            }`}
          >

            <Header />

            <main
              className={`flex-1 overflow-auto relative w-full ${
                theme === 'dark' ? '' : 'bg-white/80'
              }`}
              style={{ position: "relative", top: 0, willChange: "transform" }}
            >
              <div className={`absolute inset-0 bg-gradient-to-t from-purple-950/30 via-transparent to-transparent pointer-events-none ${
                theme === 'dark' ? '' : 'opacity-0'
              }`} />

              <div className="relative w-full max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16">
                {children}
              </div>
            </main>
          </div>
        </div>
      </div>
  );
}

