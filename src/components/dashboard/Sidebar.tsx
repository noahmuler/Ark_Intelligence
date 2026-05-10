"use client";

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

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Macro Desk", href: "/macro", icon: TrendingUp },
  { name: "Economic Calendar", href: "/calendar", icon: Calendar },
  { name: "Reports", href: "/reports", icon: Activity },
  { name: "Settings", href: "/settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);

  // Detect desktop screen size
  useEffect(() => {
    const checkScreenSize = () => {
      setIsDesktop(window.innerWidth >= 1024);
    };
    
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // Auto-open sidebar on desktop
  useEffect(() => {
    if (isDesktop) {
      setIsSidebarOpen(true);
    }
  }, [isDesktop]);

  // Listen for toggle events from navbar
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

    window.addEventListener('toggle-sidebar', handleToggleSidebar);
    return () => window.removeEventListener('toggle-sidebar', handleToggleSidebar);
  }, [isSidebarOpen, isMobileMenuOpen, isDesktop]);

  return (
    <>
      
      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-40 w-64 flex-col
        transform transition-transform duration-300 ease-in-out
        ${isDesktop ? 
          (isSidebarOpen ? "translate-x-0 lg:relative" : "-translate-x-full lg:relative") : 
          (isMobileMenuOpen ? "translate-x-0" : "-translate-x-full")
        }
      `}>
        <div className="h-full bg-purple-950/95 backdrop-blur-xl border-r border-purple-800/70 shadow-2xl">
          {/* Logo Section */}
          <div className="flex h-16 items-center px-6 border-b border-purple-800/50">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <div className="absolute -inset-1 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg blur opacity-25"></div>
                <div className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-r from-purple-600 to-blue-600 shadow-lg">
                  <Activity className="h-5 w-5 text-white" />
                </div>
              </div>
              <span className="text-lg font-bold text-white bg-gradient-to-r from-purple-200 to-blue-200 bg-clip-text text-transparent">Ark Intelligence</span>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-2 px-3 py-6">
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => {
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
                  {isActive && (
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-blue-600/20 rounded-xl blur-xl"></div>
                  )}
                  <item.icon
                    className={`relative mr-3 h-5 w-5 flex-shrink-0 transition-colors ${
                      isActive ? "text-purple-200" : "text-purple-400 group-hover:text-white"
                    }`}
                  />
                  <span className="relative">{item.name}</span>
                  {isActive && (
                    <div className="absolute right-2 w-2 h-2 bg-gradient-to-r from-purple-400 to-blue-400 rounded-full animate-pulse"></div>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Bottom Section */}
          <div className="border-t border-purple-800/50 p-3 space-y-3">
            <div className="flex items-center justify-between px-3 py-2">
              <span className="text-purple-300 text-sm font-medium">Theme</span>
              <ThemeToggle />
            </div>
            <Link
              href="/settings"
              onClick={() => {
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

      {/* Mobile Overlay */}
      {isMobileMenuOpen && !isDesktop && (
        <div
          className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm"
          onClick={() => {
            setIsMobileMenuOpen(false);
          }}
        />
      )}
    </>
  );
}
