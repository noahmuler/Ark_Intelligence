"use client";

import { MainLayout } from "@/components/dashboard/MainLayout";
import { AISessionBrief } from "@/components/dashboard/AISessionBrief";
import { MacroDesk } from "@/components/dashboard/MacroDesk";
import { EdgeFactor } from "@/components/dashboard/EdgeFactor";
import { MarketChart } from "@/components/dashboard/MarketChart";
import { useState, useEffect } from "react";
import { fetchStockQuote } from "@/services/polygonStockData";


export default function Home() {
  const [goldSilverRatio, setGoldSilverRatio] = useState(82.45);
  const [ratioChange, setRatioChange] = useState(0);
  const [marketRegime, setMarketRegime] = useState([
    { time: '15m', status: 'Trending', color: 'emerald' },
    { time: '1h', status: 'Trending', color: 'emerald' },
    { time: '4h', status: 'Ranging', color: 'amber' }
  ]);
  const [mounted, setMounted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    
    // Fetch real gold/silver ratio
    const fetchRatio = async () => {
      try {
        setError(null);
        const [goldQuote, silverQuote] = await Promise.all([
          fetchStockQuote('XAUUSD'),
          fetchStockQuote('XAGUSD')
        ]);
        
        // Validate prices before calculation
        if (!Number.isFinite(goldQuote.price) || !Number.isFinite(silverQuote.price) || silverQuote.price === 0) {
          throw new Error('Invalid price data received');
        }
        
        const ratio = goldQuote.price / silverQuote.price;
        setGoldSilverRatio(ratio);
        
        // Calculate percentage change (simplified - would use historical data in production)
        const changePercent = ((ratio - 82.45) / 82.45) * 100;
        setRatioChange(changePercent);
      } catch (error) {
        console.error('Failed to fetch gold/silver ratio:', error);
        setError('Failed to fetch market data');
        // Keep fallback values
      }
    };

    fetchRatio();
    const interval = setInterval(fetchRatio, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [mounted]);

  // Show loading state while mounting
  if (!mounted) {
    return (
      <MainLayout>
        <div className="p-3 sm:p-4 lg:p-6 h-full">
          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6 h-full">
            <div className="lg:col-span-1 space-y-4 lg:space-y-6">
              <div className="animate-pulse">
                <div className="h-32 bg-purple-800 rounded-lg mb-4"></div>
                <div className="h-64 bg-purple-800 rounded-lg"></div>
              </div>
            </div>
            <div className="lg:col-span-1 space-y-4 lg:space-y-6">
              <div className="animate-pulse">
                <div className="h-96 bg-purple-800 rounded-lg"></div>
              </div>
            </div>
            <div className="lg:col-span-1 space-y-4 lg:space-y-6">
              <div className="animate-pulse">
                <div className="h-48 bg-purple-800 rounded-lg mb-4"></div>
                <div className="h-48 bg-purple-800 rounded-lg"></div>
              </div>
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="p-3 sm:p-4 lg:p-6 h-full">
        {/* Three-Column Grid Layout */}
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6 h-full">
          
          {/* Column 1: The Narrative */}
          <div className="lg:col-span-1 space-y-4 lg:space-y-6">
            <AISessionBrief />
            <MacroDesk className="flex-1" />
          </div>

          {/* Column 2: The Execution */}
          <div className="lg:col-span-1 space-y-4 lg:space-y-6">
            {/* Central Charting Area */}
            <div className="group relative">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-600 to-blue-600 rounded-2xl blur opacity-25 group-hover:opacity-40 transition duration-300"></div>
              <div className="relative bg-purple-950/90 backdrop-blur-xl rounded-2xl border border-purple-900/50 p-4 sm:p-6 shadow-2xl flex-1">
                <MarketChart 
                  symbol="SPX" 
                  name="S&P 500 Index"
                  className="flex-1"
                />
              </div>
            </div>
          </div>

          {/* Column 3: The Edge */}
          <div className="lg:col-span-1 space-y-4 lg:space-y-6">
            <EdgeFactor 
              overallScore={72}
              macroScore={85}
              technicalScore={68}
              sentimentScore={63}
            />

            {/* Market Regime */}
            <div className="group relative">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-amber-600 to-orange-600 rounded-2xl blur opacity-25 group-hover:opacity-40 transition duration-300"></div>
              <div className="relative bg-purple-950/90 backdrop-blur-xl rounded-2xl border border-purple-900/50 p-4 sm:p-6 shadow-2xl">
                <h2 className="text-lg sm:text-xl font-bold text-white bg-gradient-to-r from-amber-200 to-orange-200 bg-clip-text text-transparent mb-4">Market Regime</h2>
                <div className="grid grid-cols-3 gap-3">
                  {marketRegime.map((item) => (
                    <div key={item.time} className="text-center group">
                      <div className="text-xs text-purple-400 mb-2 font-medium">{item.time}</div>
                      <div className={`
                        relative px-3 py-2 text-xs font-bold rounded-lg transition-all duration-200 hover:scale-105
                        ${item.color === 'emerald' 
                          ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20' 
                          : 'bg-amber-500/10 text-amber-300 border border-amber-500/20'
                        }
                      `}>
                        <div
                          className={
                            item.color === 'emerald'
                              ? 'absolute inset-0 bg-gradient-to-r from-emerald-600/20 to-emerald-500/20 rounded-lg blur opacity-0 group-hover:opacity-100 transition-opacity duration-300'
                              : 'absolute inset-0 bg-gradient-to-r from-amber-600/20 to-amber-500/20 rounded-lg blur opacity-0 group-hover:opacity-100 transition-opacity duration-300'
                          }
                        ></div>
                        <span className="relative">{item.status}</span>
                      </div>

                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* XAU/XAG Ratio */}
            <div className="group relative">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl blur opacity-25 group-hover:opacity-40 transition duration-300"></div>
              <div className="relative bg-purple-950/90 backdrop-blur-xl rounded-2xl border border-purple-900/50 p-4 sm:p-6 shadow-2xl">
                <h2 className="text-lg sm:text-xl font-bold text-white bg-gradient-to-r from-blue-200 to-purple-200 bg-clip-text text-transparent mb-4">XAU/XAG Ratio</h2>
                <div className="text-center">
                  {error ? (
                    <div className="text-red-400 p-4">
                      <div className="text-sm font-medium mb-2">Error loading data</div>
                      <div className="text-xs opacity-75">{error}</div>
                    </div>
                  ) : (
                    <>
                      <div className="relative inline-block">
                        <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl blur opacity-30"></div>
                        <div className="relative text-2xl sm:text-3xl font-bold text-white font-mono bg-gradient-to-r from-blue-200 to-purple-200 bg-clip-text text-transparent">{goldSilverRatio.toFixed(2)}</div>
                      </div>
                      <div className="text-xs text-purple-400 mb-3 mt-2 font-medium">Current Ratio</div>
                      <div className="relative inline-flex items-center px-3 py-1.5 bg-amber-500/10 text-amber-300 text-xs font-bold rounded-full border border-amber-500/20">
                        <div className="absolute -inset-1 bg-gradient-to-r from-amber-600/20 to-orange-600/20 rounded-full blur"></div>
                        <span className="relative">{ratioChange >= 0 ? '+' : ''}{ratioChange.toFixed(1)}% from 5-day mean</span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
