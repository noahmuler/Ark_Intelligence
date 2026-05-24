"use client";

import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <button
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      className="relative inline-flex h-9 w-16 items-center rounded-full bg-gradient-to-r from-purple-600 to-purple-800 p-1 shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-105 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-background"
      aria-label="Toggle theme"
    >
      <div
        className={`inline-block h-7 w-7 transform rounded-full bg-white shadow-md transition-transform duration-300 ${
          theme === 'dark' ? 'translate-x-7' : 'translate-x-0'
        }`}
      >
        <div className="flex h-full w-full items-center justify-center">
          {theme === 'dark' ? (
            <Moon className="h-4 w-4 text-purple-600" />
          ) : (
            <Sun className="h-4 w-4 text-yellow-500" />
          )}
        </div>
      </div>
      
      {/* Subtle glow effect */}
      <div className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-400 to-purple-600 opacity-20 blur-sm" />
    </button>
  );
}
