"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import SessionIndicatorCard from "@/components/dashboard/SessionIndicatorCard";
import { DashboardMacroDesk } from "@/components/dashboard/DashboardMacroDesk";

import ForYouSummaryCard from "@/components/dashboard/ForYouSummaryCard";
import TickerTapeCard from "@/components/dashboard/TickerTapeCard";
import LatestFromTwitterCard from "@/components/dashboard/LatestFromTwitterCard";
import CurrencyStrengthCard from "@/components/dashboard/CurrencyStrengthCard";
import CalendarUpcomingCard from "@/components/dashboard/CalendarUpcomingCard";
import TradingAssistantCard from "@/components/dashboard/TradingAssistantCard";

const quotes = [
  "Today's edge is patience—wait for liquidity, then commit.",
  "Keep risk small, let winners run.",
  "Focus on process, not outcomes.",
  "Rhythm beats randomness—trade when the market is ready.",
  "The market doesn't care about your opinion.",
  "Price action tells the truth; indicators tell a story.",
  "Discipline is the bridge between goals and accomplishment.",
  "In trading, as in life, timing is everything.",
];

export default function Dashboard() {
  const user = "Trader";
  const [currentQuoteIndex, setCurrentQuoteIndex] = useState(0);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      timeoutRef.current = setTimeout(() => {
        setCurrentQuoteIndex((prev) => (prev + 1) % quotes.length);
      }, 500);
    }, 5000);

    return () => {
      clearInterval(interval);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="container mx-auto px-4 py-8"
    >
      {/* Greeting */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="mb-6"
      >
        <div className="rounded-3xl border border-purple-900/60 bg-purple-950/60 p-6 backdrop-blur-xl hover:border-purple-700/80 transition-all duration-300 hover:shadow-2xl hover:shadow-purple-500/20">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-3xl font-extrabold text-white"
          >
            Greetings, {user}.
          </motion.div>
          <div className="mt-4 text-purple-200/80 text-lg h-auto md:h-8 overflow-hidden">
            <AnimatePresence mode="wait">
              <motion.p
                key={currentQuoteIndex}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5 }}
                className="text-lg"
              >
                {quotes[currentQuoteIndex]}
              </motion.p>
            </AnimatePresence>
          </div>
        </div>
      </motion.div>

      {/* 8 cards total */}
      <div className="space-y-6">
        {/* Card 1: Session indicator full width */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <SessionIndicatorCard />
        </motion.div>

        {/* Card 2 & 3 below card 1 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="grid grid-cols-1 lg:grid-cols-5 gap-6"
        >
          <div className="lg:col-span-3">
            <DashboardMacroDesk />
          </div>
          <div className="lg:col-span-2">
            <ForYouSummaryCard />
          </div>
        </motion.div>

        {/* Card 4 full width ticker tape */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          <TickerTapeCard />
        </motion.div>

        {/* Card 5 & 6 below card 4 side-by-side */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-6"
        >
          <LatestFromTwitterCard />
          <CurrencyStrengthCard />
        </motion.div>

        {/* Card 7 & 8 below card 5/6 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.7 }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-6"
        >
          <CalendarUpcomingCard />
          <TradingAssistantCard />
        </motion.div>
      </div>
    </motion.div>
  );
}

