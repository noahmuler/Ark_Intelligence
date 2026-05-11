"use client";

/**
 * Sidebar Component
 *
 * Collapsible sidebar with:
 * - Desktop: icon-only rail when collapsed (starts collapsed on launch)
 * - Mobile: overlay menu when toggled via Header
 */

import React, { useEffect, useState } from "react";
import {
  LayoutDashboard,
  TrendingUp,
  Calendar,
  Settings,
  Activity,
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

const buildSidebarEventDetail = (isSidebarExpanded: boolean, isMobileOpen: boolean) => ({
  isDesktopExpanded: isSidebarExpanded,
  isMobileOpen,
  isAnyOpen: isSidebarExpanded || isMobileOpen,
});

const dispatchSidebarStateChanged = (isSidebarExpanded: boolean, isMobileOpen: boolean) => {
  window.dispatchEvent(
    new CustomEvent("sidebar-state-changed", {
      detail: buildSidebarEventDetail(isSidebarExpanded, isMobileOpen),
    })
  );
};

export function Sidebar() {
  const pathname = usePathname();

  // Desktop rail state (starts collapsed)
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);

  // Mobile overlay state
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Listen for toggle events from Header (logo)
  useEffect(() => {
    const handleToggleSidebar = () => {
      if (window.innerWidth >= 1024) {
        setIsSidebarExpanded((prev) => !prev);
      } else {
        setIsMobileOpen((prev) => !prev);
      }
    };

    window.addEventListener("toggle-sidebar", handleToggleSidebar);
    return () => window.removeEventListener("toggle-sidebar", handleToggleSidebar);
  }, []);

  // Notify layout/header whenever sidebar state changes.
  // Provide separate flags so MainLayout can offset based on *desktop rail* only.
  useEffect(() => {
    dispatchSidebarStateChanged(isSidebarExpanded, isMobileOpen);
  }, [isSidebarExpanded, isMobileOpen]);



  return (
    <>
      {/* Desktop rail */}
      <aside
        className={
          "hidden lg:flex flex-col flex-shrink-0 fixed inset-y-0 left-0 z-40 will-change-[width] transition-[width] duration-300 ease-in-out " +
          (isSidebarExpanded ? "w-64" : "w-20")
        }
      >
        <div className="h-full bg-purple-950/95 backdrop-blur-xl border-r border-purple-800/70 shadow-2xl">
          <div className="flex h-16 items-center px-3 border-b border-purple-800/50">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <div className="absolute -inset-1 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg blur opacity-25" />
                <div className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-r from-purple-600 to-blue-600 shadow-lg">
                  <Activity className="h-5 w-5 text-white" />
                </div>
              </div>

              {isSidebarExpanded && (
                <span className="text-lg font-bold text-white bg-gradient-to-r from-purple-200 to-blue-200 bg-clip-text text-transparent">
                  Ark Intelligence
                </span>
              )}
            </div>
          </div>

          <nav className="flex-1 space-y-2 px-2 py-6">
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => {
                    // Desktop: keep rail state
                    dispatchSidebarStateChanged(isSidebarExpanded, false);
                  }}
                  className={`group relative flex items-center rounded-xl px-3 py-3 text-sm font-medium transition-all duration-200
                    ${
                      isActive
                        ? "bg-gradient-to-r from-purple-800/50 to-blue-800/50 text-white shadow-lg border border-purple-700/50"
                        : "text-purple-300 hover:bg-purple-800/30 hover:text-white hover:shadow-md"
                    }`}
                >
                  {isActive && (
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-blue-600/20 rounded-xl blur-xl" />
                  )}

                  <Icon
                    className={`relative h-5 w-5 flex-shrink-0 transition-colors
                      ${
                        isActive
                          ? "text-purple-200"
                          : "text-purple-400 group-hover:text-white"
                      }`}
                  />

                  {isSidebarExpanded && (
                    <span className="relative ml-1">{item.name}</span>
                  )}

                  {isActive && (
                    <div className="absolute right-2 w-2 h-2 bg-gradient-to-r from-purple-400 to-blue-400 rounded-full animate-pulse" />
                  )}
                </Link>
              );
            })}
          </nav>

          <div className="border-t border-purple-800/50 p-3 space-y-3">
            <div className="flex items-center justify-between px-3 py-2">
              {isSidebarExpanded ? (
                <span className="text-purple-300 text-sm font-medium">Theme</span>
              ) : (
                <span className="sr-only">Theme</span>
              )}
              <ThemeToggle />
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile overlay + sheet */}
      <div
        className="lg:hidden"
        style={{ display: isMobileOpen ? "block" : "none" }}
      >
        <div
          className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm"
          onClick={() => setIsMobileOpen(false)}
        />

        <div className="fixed inset-y-0 left-0 z-40 w-64">
          <div className="h-full bg-purple-950/95 backdrop-blur-xl border-r border-purple-800/70 shadow-2xl">
            <div className="flex h-16 items-center px-6 border-b border-purple-800/50">
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <div className="absolute -inset-1 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg blur opacity-25" />
                  <div className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-r from-purple-600 to-blue-600 shadow-lg">
                    <Activity className="h-5 w-5 text-white" />
                  </div>
                </div>

                <span className="text-lg font-bold text-white bg-gradient-to-r from-purple-200 to-blue-200 bg-clip-text text-transparent">
                  Ark Intelligence
                </span>
              </div>
            </div>

            <nav className="flex-1 space-y-2 px-3 py-6">
              {navigation.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;

                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setIsMobileOpen(false)}
                    className={`group relative flex items-center rounded-xl px-3 py-3 text-sm font-medium transition-all duration-200
                      ${
                        isActive
                          ? "bg-gradient-to-r from-purple-800/50 to-blue-800/50 text-white shadow-lg border border-purple-700/50"
                          : "text-purple-300 hover:bg-purple-800/30 hover:text-white hover:shadow-md"
                      }`}
                  >
                    {isActive && (
                      <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-blue-600/20 rounded-xl blur-xl" />
                    )}
                    <Icon
                      className={`relative mr-3 h-5 w-5 flex-shrink-0 transition-colors
                        ${
                          isActive
                            ? "text-purple-200"
                            : "text-purple-400 group-hover:text-white"
                        }`}
                    />
                    <span className="relative">{item.name}</span>
                    {isActive && (
                      <div className="absolute right-2 w-2 h-2 bg-gradient-to-r from-purple-400 to-blue-400 rounded-full animate-pulse" />
                    )}
                  </Link>
                );
              })}
            </nav>

            <div className="border-t border-purple-800/50 p-3 space-y-3">
              <div className="flex items-center justify-between px-3 py-2">
                <span className="text-purple-300 text-sm font-medium">Theme</span>
                <ThemeToggle />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

