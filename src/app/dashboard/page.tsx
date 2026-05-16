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
  const user = "Trader";

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Greeting */}
      <div className="mb-6">
        <div className="rounded-3xl border border-purple-900/60 bg-purple-950/60 p-6">
          <div className="text-3xl font-extrabold text-white">
            Greetings {user}. 
          </div>
          <div className="mt-2 text-purple-200/80">
            Today’s edge is patience—wait for liquidity, then commit.
          </div>
          <ul className="mt-4 space-y-1 text-sm text-purple-200/80">
            <li>• Keep risk small, let winners run.</li>
            <li>• Focus on process, not outcomes.</li>
            <li>• Rhythm beats randomness—trade when the market is ready.</li>
          </ul>
        </div>
      </div>

      {/* 8 cards total */}
      <div className="space-y-6">
        {/* Card 1: Session indicator full width */}
        <SessionIndicatorCard />

        {/* Card 2 & 3 below card 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <LatestFromTwitterCard />
          <CurrencyStrengthCard />
        </div>

        {/* Card 7 & 8 below card 5/6 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <CalendarUpcomingCard />
          <TradingAssistantCard />
        </div>
      </div>
    </div>
  );
}

