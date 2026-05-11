import { MainLayout } from "@/components/dashboard/MainLayout";
import { AISessionBrief } from "@/components/dashboard/AISessionBrief";
import { MacroDesk } from "@/components/dashboard/MacroDesk";
import { EdgeFactor } from "@/components/dashboard/EdgeFactor";


export default function Home() {
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
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-2">
                  <h2 className="text-lg sm:text-xl font-bold text-white bg-gradient-to-r from-emerald-200 to-blue-200 bg-clip-text text-transparent">XAUUSD</h2>
                  <div className="flex items-center space-x-2">
                    <div className="relative group">
                      <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500 to-green-500 rounded-full blur opacity-0 group-hover:opacity-30 transition-opacity duration-300"></div>
                      <span className="relative px-3 py-1.5 bg-emerald-500/10 text-emerald-300 text-xs font-bold rounded-full border border-emerald-500/20">
                        [BULLISH TRENDING]
                      </span>
                    </div>
                  </div>
                </div>
                
                {/* Chart Placeholder */}
                <div className="relative bg-purple-950/90 backdrop-blur-xl rounded-xl h-48 sm:h-64 flex items-center justify-center border border-purple-900/50 overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-emerald-600/10 to-blue-600/10 animate-pulse-slow"></div>
                  <div className="relative text-center">
                    <div className="text-purple-400 text-sm mb-2 font-medium">Lightweight Charts</div>
                    <div className="text-purple-500 text-xs">Real-time price action</div>
                  </div>
                </div>

                {/* Chart Controls */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mt-4 gap-3">
                  <div className="flex flex-wrap gap-2">
                    {['1m', '5m', '15m', '1h', '4h'].map((timeframe) => (
                      <button
                        key={timeframe}
                        className={`
                          relative px-3 py-1.5 text-xs font-medium rounded-lg transition-all duration-200 hover:scale-105
                          ${timeframe === '15m' 
                            ? 'bg-gradient-to-r from-emerald-500 to-green-500 text-white shadow-lg' 
                            : 'bg-purple-800/50 text-purple-300 hover:bg-purple-700/50 border border-purple-700/50'
                          }
                        `}
                      >
                        {timeframe === '15m' && (
                          <div className="absolute inset-0 bg-gradient-to-r from-emerald-600/30 to-green-600/30 rounded-lg blur"></div>
                        )}
                        <span className="relative">{timeframe}</span>
                      </button>
                    ))}
                  </div>
                  <div className="text-right bg-purple-800/30 px-3 py-2 rounded-lg border border-purple-700/50">
                    <div className="text-white font-mono text-sm font-bold">$2,345.67</div>
                    <div className="text-rose-400 font-mono text-xs">-8.23 (-0.35%)</div>
                  </div>
                </div>
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
                  {[
                    { time: '15m', status: 'Trending', color: 'emerald' },
                    { time: '1h', status: 'Trending', color: 'emerald' },
                    { time: '4h', status: 'Ranging', color: 'amber' }
                  ].map((item) => (
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
                  <div className="relative inline-block">
                    <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl blur opacity-30"></div>
                    <div className="relative text-2xl sm:text-3xl font-bold text-white font-mono bg-gradient-to-r from-blue-200 to-purple-200 bg-clip-text text-transparent">82.45</div>
                  </div>
                  <div className="text-xs text-purple-400 mb-3 mt-2 font-medium">Current Ratio</div>
                  <div className="relative inline-flex items-center px-3 py-1.5 bg-amber-500/10 text-amber-300 text-xs font-bold rounded-full border border-amber-500/20">
                    <div className="absolute -inset-1 bg-gradient-to-r from-amber-600/20 to-orange-600/20 rounded-full blur"></div>
                    <span className="relative">+2.3% from 5-day mean</span>
                  </div>

                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
