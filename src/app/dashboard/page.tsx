"use client";

import React from "react";
import SessionIndicatorCard from "@/components/dashboard/SessionIndicatorCard";
import { DashboardMacroDesk } from "@/components/dashboard/DashboardMacroDesk";
import ForYouSummaryCard from "@/components/dashboard/ForYouSummaryCard";
import TickerTapeCard from "@/components/dashboard/TickerTapeCard";
import LatestFromTwitterCard from "@/components/dashboard/LatestFromTwitterCard";
import CurrencyStrengthCard from "@/components/dashboard/CurrencyStrengthCard";
import CalendarUpcomingCard from "@/components/dashboard/CalendarUpcomingCard";
import TradingAssistantCard from "@/components/dashboard/TradingAssistantCard";

export default function Dashboard() {
  return (
    <div className="container mx-auto px-4 py-6 min-h-screen space-y-4">
      {/* Greeting */}
      <div className="rounded-2xl border border-purple-900/60 bg-purple-950/40 p-4 backdrop-blur-xl hover:border-purple-500/60 hover:shadow-lg hover:shadow-purple-500/20 transition-all duration-300 ease-in-out min-h-[80px]">
        <div className="text-2xl font-extrabold text-white tracking-wide">
          Greetings, Trader.
        </div>
        <div className="mt-2 text-purple-200/80 text-sm tracking-wide">
          Today's edge is patience—wait for liquidity, then commit.
        </div>
      </div>

      {/* Card 1: Session indicator full width */}
      <SessionIndicatorCard />

      {/* Card 2 & 3 below card 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <div className="lg:col-span-3">
          <DashboardMacroDesk />
        </div>
        <div className="lg:col-span-2">
          <ForYouSummaryCard />
        </div>
      </div>

      {/* Card 4 full width ticker tape */}
      <TickerTapeCard />

      {/* Card 5 & 6 below card 4 side-by-side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <LatestFromTwitterCard />
        <CurrencyStrengthCard />
      </div>

      {/* Card 7 & 8 below card 5/6 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <CalendarUpcomingCard />
        <TradingAssistantCard />
      </div>
    </div>
  );
}
