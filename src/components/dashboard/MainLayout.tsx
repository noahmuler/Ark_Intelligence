"use client";

import React, { useState, useEffect } from "react";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { ThemeProvider } from "@/contexts/ThemeContext";

interface MainLayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const [windowWidth, setWindowWidth] = useState(0);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };

    window.addEventListener('resize', handleResize);
    handleResize(); // Initial call
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Listen for sidebar state changes
  useEffect(() => {
    const handleSidebarChange = (event: CustomEvent) => {
      setIsSidebarOpen(event.detail.isOpen);
    };

    window.addEventListener('sidebar-state-changed', handleSidebarChange as EventListener);
    return () => window.removeEventListener('sidebar-state-changed', handleSidebarChange as EventListener);
  }, []);

  // Auto-open sidebar on desktop
  useEffect(() => {
    if (windowWidth >= 1024) {
      setIsSidebarOpen(true);
    }
  }, [windowWidth]);

  return (
    <ThemeProvider>
      <div className="min-h-screen bg-gradient-to-br from-purple-950 via-blue-950 to-black dark:from-purple-950 dark:via-blue-950 dark:to-black light:from-gray-50 light:via-white light:to-blue-50 transition-all duration-300 ease-in-out">
        {/* Ambient background effects */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl animate-pulse-slow"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '1s' }}></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '2s' }}></div>
        </div>
        
        {/* Sidebar */}
        <Sidebar />
        
        {/* Main Content Area */}
        <div className={`min-h-screen flex flex-col relative transition-all duration-300 ${
          windowWidth >= 1024 && isSidebarOpen ? "lg:ml-64" : ""
        }`}>
          {/* Header */}
          <Header />
          
          {/* Page Content */}
          <main className="flex-1 overflow-auto relative w-full">
            <div className="absolute inset-0 bg-gradient-to-t from-purple-950/30 via-transparent to-transparent pointer-events-none"></div>
            <div className="relative w-full max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16">
              {children}
            </div>
          </main>
        </div>
      </div>
    </ThemeProvider>
  );
}
