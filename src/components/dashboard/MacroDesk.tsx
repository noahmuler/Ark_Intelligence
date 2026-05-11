"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  Filter,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Eye,
  Brain,
  ArrowRight,
  DollarSign,
  BarChart3,
  Activity
} from "lucide-react";

interface Asset {
  symbol: string;
  name: string;
  price: number;
  dayChange: number;
  overallChange: number;
  sentiment: "Bullish" | "Bearish" | "Neutral";
  confidence: number;
  aiAnalysis: string;
  volume: string;
  marketCap: string;
  dayHigh: number;
  dayLow: number;
  weekHigh: number;
  weekLow: number;
  technicalIndicators?: {
    rsi: number;
    macd: number;
    bollinger: number;
  };
}

const mockAssets: Asset[] = [
  // Top 3 assets: XAU, XAG, BTC
  {
    symbol: "XAUUSD",
    name: "Gold / US Dollar",
    price: 2345.67,
    dayChange: -8.23,
    overallChange: -2.35,
    sentiment: "Bearish",
    confidence: 78,
    aiAnalysis: "Gold is experiencing short-term bearish pressure due to strong dollar and rising yields. However, long-term fundamentals remain supportive with central bank buying and geopolitical tensions providing a floor. Key support at $2,320, resistance at $2,380.",
    volume: "124.5K",
    marketCap: "14.2T",
    dayHigh: 2355.00,
    dayLow: 2340.50,
    weekHigh: 2380.00,
    weekLow: 2320.00,
    technicalIndicators: {
      rsi: 42.3,
      macd: -15.2,
      bollinger: 2367.8
    }
  },
  {
    symbol: "XAGUSD",
    name: "Silver / US Dollar",
    price: 28.45,
    dayChange: 0.12,
    overallChange: 1.58,
    sentiment: "Bullish",
    confidence: 65,
    aiAnalysis: "Silver shows resilience amid industrial demand recovery and investment interest. Technical indicators suggest upside potential with $29.50 as key resistance level. Support at $27.80.",
    volume: "89.7K",
    marketCap: "1.8T",
    dayHigh: 28.65,
    dayLow: 28.20,
    weekHigh: 29.10,
    weekLow: 27.80,
    technicalIndicators: {
      rsi: 58.7,
      macd: 0.8,
      bollinger: 28.2
    }
  },
  {
    symbol: "BTCUSD",
    name: "Bitcoin / US Dollar",
    price: 42856.32,
    dayChange: 1250.45,
    overallChange: 8.92,
    sentiment: "Bullish",
    confidence: 88,
    aiAnalysis: "Bitcoin shows strong momentum as institutional adoption accelerates. ETF approval expectations drive buying. Key resistance at $45,000, support at $40,000 remains solid.",
    volume: "2.8M",
    marketCap: "835.2B",
    dayHigh: 43500.00,
    dayLow: 41500.00,
    weekHigh: 45000.00,
    weekLow: 40000.00,
    technicalIndicators: {
      rsi: 74.8,
      macd: 1250.3,
      bollinger: 41500.0
    }
  },
  // Second row: OIL, DXY, US10Y
  {
    symbol: "WTIUSD",
    name: "Crude Oil WTI",
    price: 78.45,
    dayChange: -1.23,
    overallChange: -3.45,
    sentiment: "Bearish",
    confidence: 68,
    aiAnalysis: "Oil prices pressured by demand concerns and OPEC+ production decisions. Key support at $75, resistance at $82. Geopolitical risks remain elevated.",
    volume: "567.8K",
    marketCap: "N/A",
    dayHigh: 80.20,
    dayLow: 77.85,
    weekHigh: 82.30,
    weekLow: 75.00,
    technicalIndicators: {
      rsi: 41.7,
      macd: -1.8,
      bollinger: 80.2
    }
  },
  {
    symbol: "DXY",
    name: "US Dollar Index",
    price: 105.82,
    dayChange: 1.24,
    overallChange: 3.67,
    sentiment: "Bullish",
    confidence: 85,
    aiAnalysis: "Dollar strength continues as economic data outperforms expectations. Fed's hawkish stance supports current levels. Break above 106.50 could trigger further upside to 108.00 region.",
    volume: "89.2K",
    marketCap: "N/A",
    dayHigh: 105.80,
    dayLow: 104.95,
    weekHigh: 106.20,
    weekLow: 104.50,
    technicalIndicators: {
      rsi: 68.7,
      macd: 2.4,
      bollinger: 104.2
    }
  },
  {
    symbol: "US10Y",
    name: "US 10Y Treasury",
    price: 4.32,
    dayChange: -0.05,
    overallChange: -1.14,
    sentiment: "Bearish",
    confidence: 72,
    aiAnalysis: "Treasury yields face pressure from mixed economic signals. While inflation concerns persist, growth worries may cap upside. Range trading likely between 4.20-4.45%.",
    volume: "N/A",
    marketCap: "N/A",
    dayHigh: 4.35,
    dayLow: 4.28,
    weekHigh: 4.45,
    weekLow: 4.20,
    technicalIndicators: {
      rsi: 45.2,
      macd: -0.3,
      bollinger: 4.38
    }
  },
  // Remaining assets: FX then crypto
  {
    symbol: "EURUSD",
    name: "Euro / US Dollar",
    price: 1.0845,
    dayChange: -0.0042,
    overallChange: -1.23,
    sentiment: "Bearish",
    confidence: 72,
    aiAnalysis: "Euro faces headwinds from ECB dovish stance while Fed remains hawkish. Economic divergence favors dollar. Support at 1.0800 critical, resistance at 1.0900.",
    volume: "145.8K",
    marketCap: "N/A",
    dayHigh: 1.0892,
    dayLow: 1.0820,
    weekHigh: 1.0950,
    weekLow: 1.0750,
    technicalIndicators: {
      rsi: 38.5,
      macd: -8.7,
      bollinger: 1.0892
    }
  },
  {
    symbol: "GBPUSD",
    name: "British Pound / US Dollar",
    price: 1.2734,
    dayChange: 0.0018,
    overallChange: 0.56,
    sentiment: "Neutral",
    confidence: 65,
    aiAnalysis: "Pound stabilizes as Bank of England maintains cautious stance. Brexit uncertainty and economic challenges limit upside. Range trading likely between 1.2650-1.2800.",
    volume: "98.3K",
    marketCap: "N/A",
    dayHigh: 1.2768,
    dayLow: 1.2710,
    weekHigh: 1.2850,
    weekLow: 1.2650,
    technicalIndicators: {
      rsi: 52.1,
      macd: 1.2,
      bollinger: 1.2768
    }
  },
  {
    symbol: "USDJPY",
    name: "US Dollar / Japanese Yen",
    price: 148.92,
    dayChange: 0.85,
    overallChange: 2.45,
    sentiment: "Bullish",
    confidence: 81,
    aiAnalysis: "Yen weakens as BOJ maintains ultra-loose policy while Fed stays hawkish. Intervention risk remains above 150.00. Technical momentum supports further upside.",
    volume: "112.6K",
    marketCap: "N/A",
    dayHigh: 149.50,
    dayLow: 148.20,
    weekHigh: 150.50,
    weekLow: 147.50,
    technicalIndicators: {
      rsi: 71.3,
      macd: 3.8,
      bollinger: 147.5
    }
  },
  {
    symbol: "ETHUSD",
    name: "Ethereum / US Dollar",
    price: 2284.56,
    dayChange: 85.23,
    overallChange: 5.67,
    sentiment: "Bullish",
    confidence: 76,
    aiAnalysis: "Ethereum benefits from network upgrades and DeFi growth. Shanghai upgrade success boosts confidence. Resistance at $2,400, support at $2,200.",
    volume: "1.2M",
    marketCap: "274.1B",
    dayHigh: 2350.00,
    dayLow: 2200.00,
    weekHigh: 2400.00,
    weekLow: 2200.00,
    technicalIndicators: {
      rsi: 65.4,
      macd: 85.6,
      bollinger: 2250.0
    }
  },
  {
    symbol: "SPX",
    name: "S&P 500 Index",
    price: 4532.18,
    dayChange: 18.45,
    overallChange: 1.89,
    sentiment: "Bullish",
    confidence: 70,
    aiAnalysis: "S&P 500 shows resilience despite economic uncertainty. Tech sector leads gains. Key resistance at 4,600, support at 4,400.",
    volume: "3.2B",
    marketCap: "38.5T",
    dayHigh: 4550.00,
    dayLow: 4510.50,
    weekHigh: 4600.00,
    weekLow: 4400.00,
    technicalIndicators: {
      rsi: 58.3,
      macd: 18.7,
      bollinger: 4510.5
    }
  }
];

export function MacroDesk({ className = "" }: { className?: string }) {
  const router = useRouter();
  const [assets, setAssets] = useState<Asset[]>(mockAssets);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());
  const [expandingCard, setExpandingCard] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [resizeTimeout, setResizeTimeout] = useState<NodeJS.Timeout | null>(null);



  useEffect(() => {
    setMounted(true);
    
    // Handle window resize with debounce
    const handleResize = () => {
      if (resizeTimeout) {
        clearTimeout(resizeTimeout);
      }
      
      const timeout = setTimeout(() => {
        // Only close expanded cards if going to/from max width to prevent jumbled layout
        const width = typeof window !== 'undefined' ? window.innerWidth : 0;
        if (width >= 1920) { // Max screen size threshold
          setExpandedCards(new Set());
          setIsModalOpen(false);
          setExpandingCard(null);
        }
      }, 150);
      
      setResizeTimeout(timeout);
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      if (resizeTimeout) {
        clearTimeout(resizeTimeout);
      }
    };
  }, [resizeTimeout]);

  useEffect(() => {
    if (!mounted) return;
    
    // Simulate periodic price updates
    const interval = setInterval(() => {
      setAssets(prev => 
        prev.map(asset => ({
          ...asset,
          price: asset.price + (Math.random() - 0.5) * 0.5,
          dayChange: asset.dayChange + (Math.random() - 0.5) * 0.1
        }))
      );
    }, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, [mounted]);


  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment) {
      case "Bullish": return <TrendingUp className="h-3 w-3" />;
      case "Bearish": return <TrendingDown className="h-3 w-3" />;
      default: return <Minus className="h-3 w-3" />;
    }
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case "Bullish": return "text-emerald-400";
      case "Bearish": return "text-rose-400";
      default: return "text-zinc-400";
    }
  };


  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
    }, 1000);
  };

  const toggleCardExpansion = (cardId: string) => {
    setExpandingCard(cardId);
    setExpandedCards(prev => {
      // If clicking the same card, close it. Otherwise, open the new card and close others
      if (prev.has(cardId)) {
        setTimeout(() => {
          setExpandingCard(null);
          setIsModalOpen(false);
        }, 300); // Clear expanding state after animation
        return new Set(); // Close all cards
      } else {
        setIsModalOpen(true);
        setTimeout(() => setExpandingCard(null), 600); // Clear expanding state after animation
        return new Set([cardId]); // Only expand this card
      }
    });
  };

  const closeExpandedCard = () => {
    setExpandedCards(new Set());
    setIsModalOpen(false);
    setExpandingCard(null);
  };

  // Handle escape key and click outside
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isModalOpen) {
        closeExpandedCard();
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (isModalOpen) {
        const target = e.target as HTMLElement;
        const expandedCardElement = target.closest('[data-expanded-card]');
        const backButtonElement = target.closest('button');
        
        // Only close if clicking outside the expanded card and not on the back button
        if (expandedCardElement === null && !backButtonElement) {
          closeExpandedCard();
        }
      }
    };

    if (isModalOpen) {
      document.addEventListener('keydown', handleEscape);
      document.addEventListener('click', handleClickOutside);
      document.body.style.overflow = 'hidden'; // Prevent background scroll
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.removeEventListener('click', handleClickOutside);
      document.body.style.overflow = 'unset';
    };
  }, [isModalOpen]);

  const getChangeColor = (change: number) => {
    return change >= 0 ? 'text-emerald-400' : 'text-rose-400';
  };

  const getChangeIcon = (change: number) => {
    return change >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />;
  };

  // Fix hydration mismatch by only rendering after mount
  if (!mounted) return null;

  const expandedCard = Array.from(expandedCards)[0];
  const expandedAsset = expandedCard ? assets.find(a => a.symbol === expandedCard) : null;

  return (
    <div className={className} suppressHydrationWarning>
      {/* Page Header */}
      <div className="mb-12 mt-8">
        <div className="flex items-center justify-between relative">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center max-w-4xl my-6">
              <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4 mt-4">Macro Desk</h2>
              <p className="text-base text-purple-300 mt-2">
                Real-time macro intelligence feed with AI-powered analysis and sentiment tracking
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2 ml-auto">
            <button
              onClick={handleRefresh}
              className={`p-2 rounded-lg hover:bg-purple-800 transition-colors ${
                isRefreshing ? "animate-spin" : ""
              }`}
              aria-label="Refresh data"
            >
              <RefreshCw className="h-4 w-4 text-purple-400" />
            </button>
            <button
              className="p-2 rounded-lg hover:bg-purple-800 transition-colors"
              aria-label="Filter assets"
            >
              <Filter className="h-4 w-4 text-purple-400" />
            </button>
          </div>
        </div>
      </div>

      {/* Asset Cards Grid */}
      <div className={`max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6 transition-all duration-300 ease-out ${
        isModalOpen ? 'scale-95 opacity-60 blur-sm' : 'scale-100 opacity-100'
      }`}>
        {assets.map((asset) => {
          const isExpanded = expandedCards.has(asset.symbol);
          const isExpanding = expandingCard === asset.symbol;
          
          // Hide expanded cards from the grid
          if (isExpanded) return null;
          
          return (
            <div 
              key={asset.symbol} 
              className={`group relative bg-purple-950/90 backdrop-blur-xl rounded-2xl border border-purple-900/50 p-4 transition-all duration-300 ease-out hover:shadow-xl hover:scale-[1.02] ${
                isExpanding ? 'scale-110 shadow-xl z-40' : 'shadow-lg'
              }`}
            >
              {/* Enhanced ambient glow effect */}
              <div className={`absolute -inset-0.5 bg-gradient-to-r from-purple-600/20 to-blue-600/20 rounded-2xl blur transition-all duration-700 ${
                isExpanded ? 'opacity-100 scale-150' : isExpanding ? 'opacity-80 scale-130' : 'opacity-0 group-hover:opacity-60'
              }`}></div>
              
              {/* Dramatic focus ring for expanded card */}
              {(isExpanded || isExpanding) && (
                <>
                  <div className="absolute -inset-2 bg-gradient-to-r from-purple-400 via-blue-400 to-purple-400 rounded-2xl opacity-40 blur-xl animate-pulse shadow-2xl"
                    style={{
                      animation: 'pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                    }}
                  ></div>
                  <div className="absolute -inset-3 bg-gradient-to-r from-blue-400/20 to-purple-400/20 rounded-3xl opacity-30 blur-2xl animate-pulse"
                    style={{
                      animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite reverse',
                    }}
                  ></div>
                  <div className="absolute -inset-4 bg-gradient-to-r from-purple-300/10 to-blue-300/10 rounded-full opacity-20 blur-3xl animate-pulse"
                    style={{
                      animation: 'pulse 2.5s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                    }}
                  ></div>
                </>
              )}
              
              {/* Additional hover overlay */}
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600/10 to-blue-600/10 rounded-2xl blur-xl opacity-0 group-hover:opacity-30 transition-opacity duration-300"></div>
              
              {/* Asset Header with Price and Sentiment */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 bg-purple-800 rounded-lg flex items-center justify-center">
                      <span className="text-white font-bold text-xs">{asset.symbol.slice(0, 2)}</span>
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-white">{asset.symbol}</h3>
                      <p className="text-xs text-purple-400">{asset.name}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <DollarSign className="h-4 w-4 text-purple-400" />
                    <span className="text-lg font-bold text-white font-mono">
                      {asset.price.toFixed(2)}
                    </span>
                  </div>
                </div>
                
                {/* Top Right Info: Sentiment and Percent Changes */}
                <div className="flex flex-col items-end space-y-2">
                  {/* Sentiment indicator */}
                  <div className={`flex items-center space-x-1 px-2 py-1 rounded-lg border ${
                    asset.sentiment === 'Bullish' ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30' :
                    asset.sentiment === 'Bearish' ? 'bg-rose-500/10 text-rose-300 border-rose-500/30' :
                    'bg-amber-500/10 text-amber-300 border-amber-500/30'
                  }`}>
                    {getSentimentIcon(asset.sentiment)}
                    <span className="text-xs font-medium">{asset.sentiment}</span>
                  </div>
                  
                  {/* Percent Changes */}
                  <div className="flex flex-col items-end space-y-1">
                    <div className="flex items-center space-x-1">
                      <span className="text-xs text-purple-400">Day:</span>
                      <div className={`flex items-center space-x-1 ${getChangeColor(asset.dayChange)}`}>
                        {getChangeIcon(asset.dayChange)}
                        <span className="text-xs font-mono font-semibold">
                          {asset.dayChange >= 0 ? '+' : ''}{asset.dayChange.toFixed(2)}%
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-1">
                      <span className="text-xs text-purple-400">Overall:</span>
                      <div className={`flex items-center space-x-1 ${getChangeColor(asset.overallChange)}`}>
                        {getChangeIcon(asset.overallChange)}
                        <span className="text-xs font-mono font-semibold">
                          {asset.overallChange >= 0 ? '+' : ''}{asset.overallChange.toFixed(2)}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Confidence Bar */}
              <div className="mb-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-purple-400">AI Confidence</span>
                  <span className="text-xs font-mono text-purple-300">{asset.confidence}%</span>
                </div>
                <div className="w-full bg-purple-900/50 rounded-full h-2 overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-500 ${
                      asset.sentiment === 'Bullish'
                        ? asset.confidence >= 90 ? 'bg-emerald-700' :
                          asset.confidence >= 80 ? 'bg-emerald-600' :
                          asset.confidence >= 70 ? 'bg-emerald-500' :
                          asset.confidence >= 60 ? 'bg-emerald-400' :
                          asset.confidence >= 50 ? 'bg-emerald-300' :
                          'bg-emerald-200'
                        : asset.sentiment === 'Bearish'
                        ? asset.confidence >= 90 ? 'bg-rose-700' :
                          asset.confidence >= 80 ? 'bg-rose-600' :
                          asset.confidence >= 70 ? 'bg-rose-500' :
                          asset.confidence >= 60 ? 'bg-rose-400' :
                          asset.confidence >= 50 ? 'bg-rose-300' :
                          'bg-rose-200'
                        : asset.sentiment === 'Neutral'
                        ? asset.confidence >= 90 ? 'bg-amber-700' :
                          asset.confidence >= 80 ? 'bg-amber-600' :
                          asset.confidence >= 70 ? 'bg-amber-500' :
                          asset.confidence >= 60 ? 'bg-amber-400' :
                          asset.confidence >= 50 ? 'bg-amber-300' :
                          'bg-amber-200'
                        : 'bg-gray-500'
                    }`}
                    style={{ width: `${asset.confidence}%` }}
                  ></div>
                </div>
              </div>

              {/* Key Metrics */}
              <div className="grid grid-cols-2 gap-2 mb-3">
                <div className="bg-purple-900/50 rounded p-2">
                  <div className="text-xs text-purple-400 mb-1">Volume</div>
                  <div className="text-xs font-mono text-white">{asset.volume}</div>
                </div>
                <div className="bg-purple-900/50 rounded p-2">
                  <div className="text-xs text-purple-400 mb-1">Market Cap</div>
                  <div className="text-xs font-mono text-white">{asset.marketCap}</div>
                </div>
              </div>

              {/* AI Analysis Section */}
              <div className={`bg-purple-900/50 rounded-lg p-3 border border-purple-800/50 mb-3 transition-all duration-700 ${
                isExpanded ? 'border-purple-600/50 shadow-inner bg-purple-900/70' : isExpanding ? 'border-purple-700/30' : ''
              }`}>
                <div className="flex items-center gap-2 mb-2">
                  <Brain className={`h-4 w-4 transition-all duration-700 ${
                    isExpanded ? 'text-purple-200 scale-110' : isExpanding ? 'text-purple-300' : 'text-purple-400'
                  }`} />
                  <span className={`text-xs font-medium transition-all duration-700 ${
                    isExpanded ? 'text-purple-100 scale-105' : isExpanding ? 'text-purple-200' : 'text-purple-300'
                  }`}>AI Analysis</span>
                </div>
                <p className={`text-xs text-purple-200 leading-relaxed transition-all duration-700 ease-out ${
                  isExpanded 
                    ? 'max-h-none opacity-100 text-sm' 
                    : isExpanding
                    ? 'max-h-48 opacity-95'
                    : 'max-h-12 overflow-hidden opacity-90'
                }`}>
                  {asset.aiAnalysis}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <button
                  onClick={() => toggleCardExpansion(asset.symbol)}
                  className={`group/btn relative flex items-center px-3 py-1.5 text-xs rounded-lg transition-all duration-300 transform-gpu ${
                    isExpanded 
                      ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg scale-105' 
                      : 'bg-purple-800/50 text-purple-300 hover:bg-purple-700/50 hover:scale-105'
                  }`}
                  aria-label={`Quick overview for ${asset.name} (${asset.symbol})`}
                  aria-expanded={isExpanded}
                >
                  <span className="relative z-10 flex items-center">
                    <ChevronDown className={`h-3 w-3 mr-1 transition-transform duration-300 ${
                      isExpanded ? 'rotate-180' : 'rotate-0'
                    }`} />
                    <span>{isExpanded ? 'Collapse' : 'Quick Overview'}</span>
                  </span>
                  {/* Hover effect for button */}
                  <div className={`absolute inset-0 bg-gradient-to-r from-purple-600/20 to-blue-600/20 rounded-lg blur transition-opacity duration-300 ${
                    isExpanded ? 'opacity-50' : 'opacity-0 group-hover/btn:opacity-100'
                  }`}></div>
                </button>
                <button
                  onClick={() => router.push(`/macro/${asset.symbol}`)}
                  className="group/btn relative flex items-center px-3 py-1.5 text-xs rounded-lg bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:from-purple-700 hover:to-blue-700 transition-all duration-200 hover:scale-105 shadow-lg"
                >
                  <span className="relative z-10 flex items-center">
                    <Eye className="h-3 w-3 mr-1" />
                    <span>Deep Dive</span>
                    <ArrowRight className="h-3 w-3 ml-1" />
                  </span>
                  {/* Enhanced hover effect for primary button */}
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-600/30 to-blue-600/30 rounded-lg blur opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300"></div>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal Overlay for Expanded Card */}
      {isModalOpen && expandedAsset && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={handleClickOutside}
          data-expanded-card="true"
        >
          <div
            className="relative bg-purple-950/95 backdrop-blur-2xl rounded-3xl border border-purple-800/70 shadow-2xl w-full max-w-4xl mx-auto transform transition-all duration-500"
            style={{
              transform: 'perspective(1000px) rotateX(0deg) scale(1)',
              transformStyle: 'preserve-3d',
              animation: 'slideIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)'
            }}
          >
            {/* Subtle ambient glow effect */}
            <div className="absolute -inset-1 bg-gradient-to-r from-purple-600/15 to-blue-600/15 rounded-3xl blur-xl opacity-60"></div>
            
            {/* Subtle focus ring */}
            <div className="absolute -inset-2 bg-gradient-to-r from-purple-400/20 via-blue-400/20 to-purple-400/20 rounded-3xl opacity-30 blur-2xl animate-pulse"
              style={{
                animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
              }}
            ></div>

            
            {/* Gracefully scrollable content */}
            <div className="relative z-10 p-6 sm:p-8 overflow-y-auto max-h-[90vh] scroll-smooth hover:scroll-auto">
              {/* Asset Header */}
              <div className="flex items-start justify-between mb-6">
                <div className="flex-1">
                  <div className="text-left mb-4">
                    <h2 id="expanded-card-title" className="text-2xl sm:text-3xl font-bold text-purple-200 mb-2">
                      {expandedAsset.symbol}
                    </h2>
                    <p className="text-purple-400 text-lg">{expandedAsset.name}</p>
                    <div className="flex items-center space-x-2 mt-2">
                      <DollarSign className="h-6 w-6 text-purple-500" />
                      <span className="text-2xl font-bold text-purple-200">${expandedAsset.price.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  {/* Sentiment and changes */}
                  <div className="flex flex-col items-end space-y-2">
                    <div className={`flex items-center space-x-1 px-3 py-1 rounded-lg border ${
                      expandedAsset.sentiment === 'Bullish' ? 'bg-emerald-500/10 text-emerald-400/70 border-emerald-500/30' :
                      expandedAsset.sentiment === 'Bearish' ? 'bg-rose-500/10 text-rose-400/70 border-rose-500/30' :
                      'bg-amber-500/10 text-amber-400/70 border-amber-500/30'
                    }`}>
                      {getSentimentIcon(expandedAsset.sentiment)}
                      <span className="text-sm font-medium">{expandedAsset.sentiment}</span>
                    </div>
                    <div className="flex flex-col items-end space-y-1">
                      <div className="flex items-center space-x-1">
                        <span className="text-sm text-purple-500">Day:</span>
                        <div className={`flex items-center space-x-1 ${getChangeColor(expandedAsset.dayChange)}`}>
                          {getChangeIcon(expandedAsset.dayChange)}
                          <span className="text-sm font-mono font-semibold">
                            {expandedAsset.dayChange >= 0 ? '+' : ''}{expandedAsset.dayChange.toFixed(1)}%
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-1">
                        <span className="text-sm text-purple-500">Overall:</span>
                        <div className={`flex items-center space-x-1 ${getChangeColor(expandedAsset.overallChange)}`}>
                          {getChangeIcon(expandedAsset.overallChange)}
                          <span className="text-sm font-mono font-semibold">
                            {expandedAsset.overallChange >= 0 ? '+' : ''}{expandedAsset.overallChange.toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Confidence Bar */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-purple-400">AI Confidence</span>
                  <span className="text-sm font-mono text-purple-300">{expandedAsset.confidence}%</span>
                </div>
                <div className="w-full bg-purple-900/50 rounded-full h-3 overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-700 ${
                      expandedAsset.sentiment === 'Bullish' 
                        ? expandedAsset.confidence >= 90 ? 'bg-emerald-800' :
                          expandedAsset.confidence >= 80 ? 'bg-emerald-700' :
                          expandedAsset.confidence >= 70 ? 'bg-emerald-600' :
                          expandedAsset.confidence >= 60 ? 'bg-emerald-500' :
                          expandedAsset.confidence >= 50 ? 'bg-emerald-400' :
                          'bg-emerald-300'
                        : expandedAsset.sentiment === 'Bearish'
                        ? expandedAsset.confidence >= 90 ? 'bg-rose-800' :
                          expandedAsset.confidence >= 80 ? 'bg-rose-700' :
                          expandedAsset.confidence >= 70 ? 'bg-rose-600' :
                          expandedAsset.confidence >= 60 ? 'bg-rose-500' :
                          expandedAsset.confidence >= 50 ? 'bg-rose-400' :
                          'bg-rose-300'
                        : expandedAsset.sentiment === 'Neutral'
                        ? expandedAsset.confidence >= 90 ? 'bg-amber-800' :
                          expandedAsset.confidence >= 80 ? 'bg-amber-700' :
                          expandedAsset.confidence >= 70 ? 'bg-amber-600' :
                          expandedAsset.confidence >= 60 ? 'bg-amber-500' :
                          expandedAsset.confidence >= 50 ? 'bg-amber-400' :
                          'bg-amber-300'
                        : 'bg-gray-600'
                    }`}
                    style={{ width: `${expandedAsset.confidence}%` }}
                  ></div>
                </div>
              </div>

              {/* Key Metrics */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-purple-900/40 rounded-lg p-4 border border-purple-800/30 hover:bg-purple-900/50 transition-colors cursor-pointer group">
                  <div className="text-sm text-purple-500 mb-1 group-hover:text-purple-400 transition-colors">Volume</div>
                  <div className="text-lg font-mono text-purple-200 group-hover:text-purple-100 transition-colors">{expandedAsset.volume}</div>
                </div>
                <div className="bg-purple-900/40 rounded-lg p-4 border border-purple-800/30 hover:bg-purple-900/50 transition-colors cursor-pointer group">
                  <div className="text-sm text-purple-500 mb-1 group-hover:text-purple-400 transition-colors">Market Cap</div>
                  <div className="text-lg font-mono text-purple-200 group-hover:text-purple-100 transition-colors">{expandedAsset.marketCap}</div>
                </div>
              </div>

              {/* AI Analysis Section */}
              <div className="bg-purple-900/40 rounded-lg p-4 border border-purple-800/30 mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <Brain className="h-5 w-5 text-purple-400" />
                  <span className="text-sm font-medium text-purple-300">AI Analysis</span>
                </div>
                <p id="expanded-card-description" className="text-sm text-purple-200 leading-relaxed mb-4">
                  {expandedAsset.aiAnalysis}
                </p>
                
                {/* Key Bullet Points */}
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold text-purple-400 uppercase tracking-wider">Key Insights</h4>
                  <ul className="space-y-2">
                    {expandedAsset.sentiment === 'Bullish' && (
                      <>
                        <li className="flex items-start gap-2 text-xs text-purple-300">
                          <span className="text-emerald-400 mt-1">•</span>
                          <span>Strong upward momentum with positive market sentiment</span>
                        </li>
                        <li className="flex items-start gap-2 text-xs text-purple-300">
                          <span className="text-emerald-400 mt-1">•</span>
                          <span>Technical indicators suggest continued growth potential</span>
                        </li>
                        <li className="flex items-start gap-2 text-xs text-purple-300">
                          <span className="text-emerald-400 mt-1">•</span>
                          <span>Volume analysis confirms buying pressure</span>
                        </li>
                      </>
                    )}
                    {expandedAsset.sentiment === 'Bearish' && (
                      <>
                        <li className="flex items-start gap-2 text-xs text-purple-300">
                          <span className="text-rose-400 mt-1">•</span>
                          <span>Declining trend with negative market sentiment</span>
                        </li>
                        <li className="flex items-start gap-2 text-xs text-purple-300">
                          <span className="text-rose-400 mt-1">•</span>
                          <span>Support levels being tested for potential breakdown</span>
                        </li>
                        <li className="flex items-start gap-2 text-xs text-purple-300">
                          <span className="text-rose-400 mt-1">•</span>
                          <span>Risk management strategies recommended</span>
                        </li>
                      </>
                    )}
                    {expandedAsset.sentiment === 'Neutral' && (
                      <>
                        <li className="flex items-start gap-2 text-xs text-purple-300">
                          <span className="text-amber-400 mt-1">•</span>
                          <span>Market in consolidation phase with mixed signals</span>
                        </li>
                        <li className="flex items-start gap-2 text-xs text-purple-300">
                          <span className="text-amber-400 mt-1">•</span>
                          <span>Waiting for catalyst to determine direction</span>
                        </li>
                        <li className="flex items-start gap-2 text-xs text-purple-300">
                          <span className="text-amber-400 mt-1">•</span>
                          <span>Range-bound trading conditions expected</span>
                        </li>
                      </>
                    )}
                  </ul>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => router.push(`/macro/${expandedAsset.symbol}`)}
                  className="flex items-center px-4 py-2 text-sm rounded-lg bg-gradient-to-r from-purple-600/70 to-blue-600/70 text-purple-100 hover:from-purple-600/80 hover:to-blue-600/80 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  <Eye className="h-4 w-4 mr-1" />
                  <span>Deep Dive</span>
                  <ArrowRight className="h-4 w-4 ml-1" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add custom styles */}
      <style jsx>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: perspective(1000px) rotateX(10deg) translateY(50px) scale(0.9);
          }
          to {
            opacity: 1;
            transform: perspective(1000px) rotateX(0deg) translateY(0px) scale(1);
          }
        }
      `}</style>
    </div>
  );
}
