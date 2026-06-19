"use client";

import React, { useMemo } from "react";
import SessionIndicatorCard from "@/components/dashboard/SessionIndicatorCard";
import { DashboardMacroDesk } from "@/components/dashboard/DashboardMacroDesk";
import ForYouSummaryCard from "@/components/dashboard/ForYouSummaryCard";
import TickerTapeCard from "@/components/dashboard/TickerTapeCard";
import LatestFromTwitterCard from "@/components/dashboard/LatestFromTwitterCard";
import CurrencyStrengthCard from "@/components/dashboard/CurrencyStrengthCard";
import CalendarUpcomingCard from "@/components/dashboard/CalendarUpcomingCard";
import TradingAssistantCard from "@/components/dashboard/TradingAssistantCard";
import GreetingCard from "@/components/dashboard/GreetingCard";
import { EdgeFactor } from "@/components/dashboard/EdgeFactor";
import { calculateEdgeFactorFromRealInputs } from "@/lib/api";
import { useMarketPrices } from "@/hooks/useMarketPrices";

export default function Dashboard() {
  const { data: marketPrices } = useMarketPrices();

  // Calculate edge factor scores from real market data
  const edgeFactorScores = useMemo(() => {
    if (!marketPrices) {
      return { overallScore: 0, macroScore: 0, technicalScore: 0, sentimentScore: 0 };
    }

    // Extract real market inputs from prices
    const dxyPrice = marketPrices.dxy?.price || 100;
    const vixPrice = marketPrices.vix?.price || 20;
    const goldPrice = marketPrices.gold?.price || 2000;

    // Calculate DXY trend (simplified - compare to previous)
    const dxyTrend: 'up' | 'down' | 'flat' = dxyPrice > 100 ? 'up' : dxyPrice < 100 ? 'down' : 'flat';

    // Calculate gold momentum (simplified percentage change)
    const goldMomentum = ((goldPrice - 2000) / 2000) * 100;

    // VIX level directly from price
    const vixLevel = vixPrice;

    // Yield curve slope (simplified - would need 10y-2y spread from real data)
    const yieldCurveSlope = 0.5; // Placeholder - would need real yield data

    // News sentiment (simplified - would need real sentiment analysis)
    const newsSentiment = 50; // Placeholder - would need real sentiment data

    // Breadth (simplified - would need advance/decline data)
    const breadth: 'expanding' | 'contracting' = 'expanding'; // Placeholder

    const result = calculateEdgeFactorFromRealInputs(
      dxyTrend,
      goldMomentum,
      vixLevel,
      yieldCurveSlope,
      newsSentiment,
      breadth
    );

    return {
      overallScore: result.overallScore,
      macroScore: result.macroScore,
      technicalScore: result.technicalScore,
      sentimentScore: result.sentimentScore,
    };
  }, [marketPrices]);

  return (
    <div className="container mx-auto px-4 py-6 min-h-screen space-y-4">
      {/* Greeting */}
      <GreetingCard />

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

      {/* Card 9: Edge Factor */}
      <EdgeFactor
        overallScore={edgeFactorScores.overallScore}
        macroScore={edgeFactorScores.macroScore}
        technicalScore={edgeFactorScores.technicalScore}
        sentimentScore={edgeFactorScores.sentimentScore}
      />

      {/* Card 7 & 8 below card 5/6 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <CalendarUpcomingCard />
        <TradingAssistantCard />
      </div>
    </div>
  );
}
