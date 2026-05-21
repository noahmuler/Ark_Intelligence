"use client";

import React, { useState } from "react";
import { MainLayout } from "@/components/dashboard/MainLayout";
import { 
  Calendar,
  TrendingUp,
  TrendingDown,
  Minus,
  ArrowUpRight,
  ArrowDownRight
} from "lucide-react";

type BiasDirection = "Bullish" | "Bearish" | "Neutral";

interface AssetBias {
  asset: string;
  direction: BiasDirection;
  strength: "High" | "Medium" | "Low";
}

interface MacroEvent {
  id: string;
  date: string;
  time: string;
  eventName: string;
  forecast: string;
  actual: string;
  deviation: string;
  assetBiases: AssetBias[];
  summary: string;
  keyTakeaways: string[];
}

const TARGET_ASSETS = ["XAU", "BTC", "OIL", "DXY", "NQ", "ES"] as const;

const mockMacroEvents: MacroEvent[] = [
  {
    id: "1",
    date: "2024-01-15",
    time: "08:30 EST",
    eventName: "Core CPI (MoM)",
    forecast: "0.3%",
    actual: "0.4%",
    deviation: "+0.1%",
    assetBiases: [
      { asset: "XAU", direction: "Bullish", strength: "High" },
      { asset: "BTC", direction: "Bullish", strength: "High" },
      { asset: "OIL", direction: "Neutral", strength: "Low" },
      { asset: "DXY", direction: "Bearish", strength: "High" },
      { asset: "NQ", direction: "Bullish", strength: "Medium" },
      { asset: "ES", direction: "Bullish", strength: "Medium" }
    ],
    summary: "Core CPI came in hotter than expected at 0.4% vs 0.3% forecast, indicating persistent inflationary pressure. This unexpected print suggests the Fed may maintain higher rates for longer, impacting rate-sensitive assets.",
    keyTakeaways: [
      "Inflation remains sticky above target levels",
      "Fed rate cut timeline likely pushed to Q2 2024",
      "Gold and Bitcoin benefit as inflation hedges",
      "USD weakness expected on delayed rate cuts",
      "Equities show resilience on growth expectations"
    ]
  },
  {
    id: "2",
    date: "2024-01-12",
    time: "10:00 EST",
    eventName: "Retail Sales (MoM)",
    forecast: "0.4%",
    actual: "0.7%",
    deviation: "+0.3%",
    assetBiases: [
      { asset: "XAU", direction: "Bearish", strength: "Medium" },
      { asset: "BTC", direction: "Neutral", strength: "Low" },
      { asset: "OIL", direction: "Bullish", strength: "Medium" },
      { asset: "DXY", direction: "Bullish", strength: "High" },
      { asset: "NQ", direction: "Bullish", strength: "High" },
      { asset: "ES", direction: "Bullish", strength: "High" }
    ],
    summary: "Retail sales significantly exceeded expectations with 0.7% growth vs 0.4% forecast. Strong consumer spending indicates robust economic momentum despite higher interest rates.",
    keyTakeaways: [
      "Consumer spending remains resilient",
      "Economic growth outlook improves",
      "USD strength on strong fundamentals",
      "Equities benefit from consumption growth",
      "Oil demand expectations increase"
    ]
  },
  {
    id: "3",
    date: "2024-01-11",
    time: "08:30 EST",
    eventName: "PPI (MoM)",
    forecast: "0.2%",
    actual: "0.1%",
    deviation: "-0.1%",
    assetBiases: [
      { asset: "XAU", direction: "Bearish", strength: "Low" },
      { asset: "BTC", direction: "Bearish", strength: "Low" },
      { asset: "OIL", direction: "Neutral", strength: "Low" },
      { asset: "DXY", direction: "Bullish", strength: "Medium" },
      { asset: "NQ", direction: "Neutral", strength: "Low" },
      { asset: "ES", direction: "Neutral", strength: "Low" }
    ],
    summary: "Producer Price Index came in below expectations at 0.1% vs 0.2% forecast. This suggests easing inflationary pressure at the wholesale level, potentially leading to lower consumer prices in coming months.",
    keyTakeaways: [
      "Wholesale inflation cooling faster than expected",
      "Supply chain improvements contributing to disinflation",
      "Potential for earlier Fed rate cuts",
      "USD strength on relative economic outperformance",
      "Limited impact on risk assets"
    ]
  },
  {
    id: "4",
    date: "2024-01-10",
    time: "14:00 EST",
    eventName: "FOMC Minutes",
    forecast: "Hawkish",
    actual: "Dovish",
    deviation: "Unexpectedly Dovish",
    assetBiases: [
      { asset: "XAU", direction: "Bullish", strength: "High" },
      { asset: "BTC", direction: "Bullish", strength: "High" },
      { asset: "OIL", direction: "Neutral", strength: "Low" },
      { asset: "DXY", direction: "Bearish", strength: "High" },
      { asset: "NQ", direction: "Bullish", strength: "High" },
      { asset: "ES", direction: "Bullish", strength: "High" }
    ],
    summary: "FOMC minutes revealed more dovish sentiment than anticipated, with several officials expressing openness to earlier rate cuts. The committee showed increased confidence in inflation progress while noting labor market resilience.",
    keyTakeaways: [
      "Fed pivot timing potentially accelerated to March 2024",
      "Inflation progress acknowledged by officials",
      "Labor market strength provides policy flexibility",
      "Significant USD weakness on policy expectations",
      "Risk assets rally on anticipated liquidity support"
    ]
  },
  {
    id: "5",
    date: "2024-01-08",
    time: "08:30 EST",
    eventName: "Non-Farm Payrolls",
    forecast: "180K",
    actual: "216K",
    deviation: "+36K",
    assetBiases: [
      { asset: "XAU", direction: "Bearish", strength: "Medium" },
      { asset: "BTC", direction: "Neutral", strength: "Low" },
      { asset: "OIL", direction: "Bullish", strength: "Medium" },
      { asset: "DXY", direction: "Bullish", strength: "High" },
      { asset: "NQ", direction: "Bullish", strength: "Medium" },
      { asset: "ES", direction: "Bullish", strength: "Medium" }
    ],
    summary: "Non-Farm Payrolls significantly beat expectations at 216K vs 180K forecast. Unemployment rate held steady at 3.7%. Strong labor market data suggests economic resilience despite higher interest rates.",
    keyTakeaways: [
      "Labor market remains exceptionally tight",
      "Wage pressure likely to persist",
      "Fed may maintain restrictive stance longer",
      "USD strength on economic outperformance",
      "Equities benefit from income growth expectations"
    ]
  }
];

export default function Reports() {
  const [selectedEvent, setSelectedEvent] = useState<MacroEvent | null>(null);

  const getBiasColor = (direction: BiasDirection) => {
    switch (direction) {
      case "Bullish": return "text-emerald-400 bg-emerald-500/10 border-emerald-500/30";
      case "Bearish": return "text-rose-400 bg-rose-500/10 border-rose-500/30";
      case "Neutral": return "text-zinc-400 bg-zinc-500/10 border-zinc-500/30";
    }
  };

  const getBiasIcon = (direction: BiasDirection) => {
    switch (direction) {
      case "Bullish": return <TrendingUp className="h-3 w-3" />;
      case "Bearish": return <TrendingDown className="h-3 w-3" />;
      case "Neutral": return <Minus className="h-3 w-3" />;
    }
  };

  const getStrengthColor = (strength: string) => {
    switch (strength) {
      case "High": return "text-rose-400";
      case "Medium": return "text-amber-400";
      case "Low": return "text-emerald-400";
    }
  };

  const getDeviationColor = (deviation: string) => {
    if (deviation.includes("+")) return "text-emerald-400";
    if (deviation.includes("-")) return "text-rose-400";
    return "text-zinc-400";
  };

  return (
    <MainLayout>
      <div className="p-3 sm:p-4 lg:p-6 h-full">
        <div className="max-w-7xl mx-auto">
          {/* Page Header */}
          <div className="mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">Macroeconomic Reports</h1>
            <p className="text-purple-300 text-sm sm:text-base">
              Economic calendar with asset bias analysis for XAU, BTC, OIL, DXY, NQ, ES
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Event Feed / Timeline */}
            <div className="lg:col-span-1 space-y-3">
              <div className="flex items-center space-x-2 mb-4">
                <Calendar className="h-5 w-5 text-purple-400" />
                <h2 className="text-lg font-semibold text-white">Event Feed</h2>
              </div>
              
              {mockMacroEvents.map((event) => (
                <div
                  key={event.id}
                  onClick={() => setSelectedEvent(event)}
                  className={`backdrop-blur-md bg-purple-950/40 border border-purple-500/20 rounded-lg p-3 cursor-pointer transition-all duration-200 hover:border-purple-500/40 ${
                    selectedEvent?.id === event.id ? "border-purple-500/60 ring-1 ring-purple-500/30" : ""
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-purple-300">{event.date}</span>
                    <span className="text-xs text-purple-400">{event.time}</span>
                  </div>
                  <h3 className="text-sm font-semibold text-white mb-2">{event.eventName}</h3>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div>
                      <span className="text-purple-400 block">Forecast</span>
                      <span className="text-white">{event.forecast}</span>
                    </div>
                    <div>
                      <span className="text-purple-400 block">Actual</span>
                      <span className="text-white">{event.actual}</span>
                    </div>
                    <div>
                      <span className="text-purple-400 block">Deviation</span>
                      <span className={getDeviationColor(event.deviation)}>{event.deviation}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Bias Matrix and Summary */}
            <div className="lg:col-span-2 space-y-4">
              {selectedEvent ? (
                <>
                  {/* Bias Matrix */}
                  <div className="backdrop-blur-md bg-purple-950/40 border border-purple-500/20 rounded-lg p-4">
                    <h2 className="text-lg font-semibold text-white mb-4">Asset Bias Matrix</h2>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {selectedEvent.assetBiases.map((bias) => (
                        <div
                          key={bias.asset}
                          className={`backdrop-blur-sm border rounded-lg p-3 ${getBiasColor(bias.direction)}`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-bold text-sm">{bias.asset}</span>
                            {getBiasIcon(bias.direction)}
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-xs">{bias.direction}</span>
                            <span className={`text-xs font-medium ${getStrengthColor(bias.strength)}`}>
                              {bias.strength}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Report Summary */}
                  <div className="backdrop-blur-md bg-purple-950/40 border border-purple-500/20 rounded-lg p-4">
                    <h2 className="text-lg font-semibold text-white mb-3">Report Summary</h2>
                    <p className="text-purple-200 text-sm leading-relaxed mb-4">
                      {selectedEvent.summary}
                    </p>
                    
                    <h3 className="text-sm font-semibold text-purple-300 mb-2">Key Takeaways</h3>
                    <ul className="space-y-1">
                      {selectedEvent.keyTakeaways.map((takeaway, index) => (
                        <li key={index} className="flex items-start text-sm text-purple-200">
                          <span className="text-purple-400 mr-2 mt-0.5">•</span>
                          {takeaway}
                        </li>
                      ))}
                    </ul>
                  </div>
                </>
              ) : (
                <div className="backdrop-blur-md bg-purple-950/40 border border-purple-500/20 rounded-lg p-8 flex items-center justify-center h-full min-h-[400px]">
                  <div className="text-center">
                    <Calendar className="h-12 w-12 text-purple-400 mx-auto mb-4" />
                    <p className="text-purple-300 text-sm">
                      Select an economic event from the feed to view detailed bias analysis
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
