"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { MainLayout } from "@/components/dashboard/MainLayout";
import { 
  TrendingUp, 
  TrendingDown, 
  ArrowLeft,
  Brain,
  Activity,
  Clock,
  DollarSign,
  BarChart3,
  RefreshCw
} from "lucide-react";

interface AssetDetail {
  symbol: string;
  name: string;
  price: number;
  dayChange: number;
  overallChange: number;
  sentiment: "Bullish" | "Bearish" | "Neutral";
  confidence: number;
  aiAnalysis: string;
  technicalIndicators: {
    rsi: number;
    macd: number;
    bollinger: number;
  };
  marketData: {
    volume: string;
    marketCap: string;
    supply: string;
    circulating: string;
  };
  recentNews: Array<{
    id: string;
    timestamp: Date;
    title: string;
    impact: string;
  }>;
}

const mockAssetData: Record<string, AssetDetail> = {
  "XAUUSD": {
    symbol: "XAUUSD",
    name: "Gold / US Dollar",
    price: 2345.67,
    dayChange: -8.23,
    overallChange: -2.35,
    sentiment: "Bearish",
    confidence: 78,
    aiAnalysis: "Gold is experiencing short-term bearish pressure due to strong dollar and rising yields. However, long-term fundamentals remain supportive with central bank buying and geopolitical tensions providing a floor. Key support at $2,320, resistance at $2,380.",
    technicalIndicators: {
      rsi: 42.3,
      macd: -15.2,
      bollinger: 2367.8
    },
    marketData: {
      volume: "124.5K",
      marketCap: "14.2T",
      supply: "197,473 tonnes",
      circulating: "197,473 tonnes"
    },
    recentNews: [
      {
        id: "1",
        timestamp: new Date(Date.now() - 2 * 60 * 1000),
        title: "Fed signals higher rates for longer, gold pressured",
        impact: "High"
      },
      {
        id: "2", 
        timestamp: new Date(Date.now() - 5 * 60 * 1000),
        title: "China gold imports decline 15% YoY amid weaker demand",
        impact: "Medium"
      },
      {
        id: "3",
        timestamp: new Date(Date.now() - 8 * 60 * 1000),
        title: "Central banks continue gold accumulation strategy",
        impact: "Medium"
      }
    ]
  },
  "DXY": {
    symbol: "DXY",
    name: "US Dollar Index",
    price: 105.82,
    dayChange: 1.24,
    overallChange: 3.67,
    sentiment: "Bullish",
    confidence: 85,
    aiAnalysis: "Dollar strength continues as economic data outperforms expectations. Fed's hawkish stance supports current levels. Break above 106.50 could trigger further upside to 108.00 region.",
    technicalIndicators: {
      rsi: 68.7,
      macd: 2.4,
      bollinger: 104.2
    },
    marketData: {
      volume: "89.2K",
      marketCap: "N/A",
      supply: "N/A",
      circulating: "N/A"
    },
    recentNews: [
      {
        id: "1",
        timestamp: new Date(Date.now() - 1 * 60 * 1000),
        title: "Strong retail sales data boosts dollar sentiment",
        impact: "High"
      },
      {
        id: "2",
        timestamp: new Date(Date.now() - 3 * 60 * 1000),
        title: "Fed minutes show concerns about premature rate cuts",
        impact: "Medium"
      },
      {
        id: "3",
        timestamp: new Date(Date.now() - 6 * 60 * 1000),
        title: "Euro weakness contributes to dollar strength",
        impact: "Low"
      }
    ]
  },
  "EURUSD": {
    symbol: "EURUSD",
    name: "Euro / US Dollar",
    price: 1.0845,
    dayChange: -0.0042,
    overallChange: -1.23,
    sentiment: "Bearish",
    confidence: 72,
    aiAnalysis: "Euro faces headwinds from ECB dovish stance while Fed remains hawkish. Economic divergence favors dollar. Support at 1.0800 critical, resistance at 1.0900.",
    technicalIndicators: {
      rsi: 38.5,
      macd: -8.7,
      bollinger: 1.0892
    },
    marketData: {
      volume: "145.8K",
      marketCap: "N/A",
      supply: "N/A",
      circulating: "N/A"
    },
    recentNews: [
      {
        id: "1",
        timestamp: new Date(Date.now() - 1 * 60 * 1000),
        title: "ECB President hints at rate cuts in coming months",
        impact: "High"
      },
      {
        id: "2",
        timestamp: new Date(Date.now() - 4 * 60 * 1000),
        title: "German manufacturing PMI disappoints expectations",
        impact: "Medium"
      },
      {
        id: "3",
        timestamp: new Date(Date.now() - 7 * 60 * 1000),
        title: "Eurozone inflation shows signs of moderation",
        impact: "Low"
      }
    ]
  },
  "GBPUSD": {
    symbol: "GBPUSD",
    name: "British Pound / US Dollar",
    price: 1.2734,
    dayChange: 0.0018,
    overallChange: 0.56,
    sentiment: "Neutral",
    confidence: 65,
    aiAnalysis: "Pound stabilizes as Bank of England maintains cautious stance. Brexit uncertainty and economic challenges limit upside. Range trading likely between 1.2650-1.2800.",
    technicalIndicators: {
      rsi: 52.1,
      macd: 1.2,
      bollinger: 1.2768
    },
    marketData: {
      volume: "98.3K",
      marketCap: "N/A",
      supply: "N/A",
      circulating: "N/A"
    },
    recentNews: [
      {
        id: "1",
        timestamp: new Date(Date.now() - 2 * 60 * 1000),
        title: "BoE Governor signals data-dependent approach",
        impact: "Medium"
      },
      {
        id: "2",
        timestamp: new Date(Date.now() - 5 * 60 * 1000),
        title: "UK inflation falls to 3.2% in latest reading",
        impact: "High"
      }
    ]
  },
  "USDJPY": {
    symbol: "USDJPY",
    name: "US Dollar / Japanese Yen",
    price: 148.92,
    dayChange: 0.85,
    overallChange: 2.45,
    sentiment: "Bullish",
    confidence: 81,
    aiAnalysis: "Yen weakens as BOJ maintains ultra-loose policy while Fed stays hawkish. Intervention risk remains above 150.00. Technical momentum supports further upside.",
    technicalIndicators: {
      rsi: 71.3,
      macd: 3.8,
      bollinger: 147.5
    },
    marketData: {
      volume: "112.6K",
      marketCap: "N/A",
      supply: "N/A",
      circulating: "N/A"
    },
    recentNews: [
      {
        id: "1",
        timestamp: new Date(Date.now() - 1 * 60 * 1000),
        title: "BOJ Governor Kuroda reiterates commitment to easy policy",
        impact: "High"
      },
      {
        id: "2",
        timestamp: new Date(Date.now() - 3 * 60 * 1000),
        title: "Japan officials express concern about rapid yen weakness",
        impact: "Medium"
      },
      {
        id: "3",
        timestamp: new Date(Date.now() - 6 * 60 * 1000),
        title: "Japanese export data shows surprising strength",
        impact: "Low"
      }
    ]
  },
  "BTCUSD": {
    symbol: "BTCUSD",
    name: "Bitcoin / US Dollar",
    price: 42856.32,
    dayChange: 1250.45,
    overallChange: 8.92,
    sentiment: "Bullish",
    confidence: 88,
    aiAnalysis: "Bitcoin shows strong momentum as institutional adoption accelerates. ETF approval expectations drive buying. Key resistance at $45,000, support at $40,000 remains solid.",
    technicalIndicators: {
      rsi: 74.8,
      macd: 1250.3,
      bollinger: 41500.0
    },
    marketData: {
      volume: "2.8M",
      marketCap: "835.2B",
      supply: "19.5M",
      circulating: "19.5M"
    },
    recentNews: [
      {
        id: "1",
        timestamp: new Date(Date.now() - 1 * 60 * 1000),
        title: "BlackRock files spot Bitcoin ETF amendment",
        impact: "High"
      },
      {
        id: "2",
        timestamp: new Date(Date.now() - 4 * 60 * 1000),
        title: "MicroStrategy announces additional $500M Bitcoin purchase",
        impact: "Medium"
      },
      {
        id: "3",
        timestamp: new Date(Date.now() - 7 * 60 * 1000),
        title: "Bitcoin mining difficulty reaches all-time high",
        impact: "Low"
      }
    ]
  },
  "ETHUSD": {
    symbol: "ETHUSD",
    name: "Ethereum / US Dollar",
    price: 2284.56,
    dayChange: 85.23,
    overallChange: 5.67,
    sentiment: "Bullish",
    confidence: 76,
    aiAnalysis: "Ethereum benefits from network upgrades and DeFi growth. Shanghai upgrade success boosts confidence. Resistance at $2,400, support at $2,200.",
    technicalIndicators: {
      rsi: 65.4,
      macd: 85.6,
      bollinger: 2250.0
    },
    marketData: {
      volume: "1.2M",
      marketCap: "274.1B",
      supply: "120.2M",
      circulating: "120.2M"
    },
    recentNews: [
      {
        id: "1",
        timestamp: new Date(Date.now() - 2 * 60 * 1000),
        title: "Ethereum DApps see record TVL growth",
        impact: "Medium"
      },
      {
        id: "2",
        timestamp: new Date(Date.now() - 5 * 60 * 1000),
        title: "Layer 2 solutions reduce gas fees by 90%",
        impact: "High"
      }
    ]
  },
  "SPX": {
    symbol: "SPX",
    name: "S&P 500 Index",
    price: 4532.18,
    dayChange: 18.45,
    overallChange: 1.89,
    sentiment: "Bullish",
    confidence: 70,
    aiAnalysis: "S&P 500 shows resilience despite economic uncertainty. Tech sector leads gains. Key resistance at 4,600, support at 4,400.",
    technicalIndicators: {
      rsi: 58.3,
      macd: 18.7,
      bollinger: 4510.5
    },
    marketData: {
      volume: "3.2B",
      marketCap: "38.5T",
      supply: "N/A",
      circulating: "N/A"
    },
    recentNews: [
      {
        id: "1",
        timestamp: new Date(Date.now() - 1 * 60 * 1000),
        title: "Fed Chair Powell suggests rate cuts may be appropriate in 2024",
        impact: "High"
      },
      {
        id: "2",
        timestamp: new Date(Date.now() - 4 * 60 * 1000),
        title: "Big Tech earnings beat expectations across the board",
        impact: "Medium"
      }
    ]
  },
  "WTIUSD": {
    symbol: "WTIUSD",
    name: "Crude Oil WTI",
    price: 78.45,
    dayChange: -1.23,
    overallChange: -3.45,
    sentiment: "Bearish",
    confidence: 68,
    aiAnalysis: "Oil prices pressured by demand concerns and OPEC+ production decisions. Key support at $75, resistance at $82. Geopolitical risks remain elevated.",
    technicalIndicators: {
      rsi: 41.7,
      macd: -1.8,
      bollinger: 80.2
    },
    marketData: {
      volume: "567.8K",
      marketCap: "N/A",
      supply: "N/A",
      circulating: "N/A"
    },
    recentNews: [
      {
        id: "1",
        timestamp: new Date(Date.now() - 2 * 60 * 1000),
        title: "OPEC+ maintains current production levels",
        impact: "Medium"
      },
      {
        id: "2",
        timestamp: new Date(Date.now() - 5 * 60 * 1000),
        title: "US crude inventories rise unexpectedly",
        impact: "High"
      },
      {
        id: "3",
        timestamp: new Date(Date.now() - 8 * 60 * 1000),
        title: "China demand concerns weigh on oil prices",
        impact: "Low"
      }
    ]
  }
};

export default function AssetDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [assetData, setAssetData] = useState<AssetDetail | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    setMounted(true);
    const asset = params.asset as string;
    if (asset && mockAssetData[asset]) {
      setAssetData(mockAssetData[asset]);
    }
  }, [params.asset]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
    }, 1000);
  };

  const getChangeColor = (change: number) => {
    return change >= 0 ? 'text-emerald-400' : 'text-rose-400';
  };

  const getChangeIcon = (change: number) => {
    return change >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />;
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case "Bullish": return "bg-emerald-500/10 text-emerald-300 border-emerald-500/30";
      case "Bearish": return "bg-rose-500/10 text-rose-300 border-rose-500/30";
      default: return "bg-amber-500/10 text-amber-300 border-amber-500/30";
    }
  };

  if (!mounted || !assetData) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-purple-400">Loading asset data...</div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="p-4 sm:p-6 lg:p-8">
        {assetData && (
          <>
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => router.back()}
                  className="p-2 rounded-lg hover:bg-purple-800 transition-colors"
                >
                  <ArrowLeft className="h-5 w-5 text-purple-400" />
                </button>
                <h1 className="text-2xl font-bold text-white">{assetData.symbol} - {assetData.name}</h1>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleRefresh}
                  className={`p-2 rounded-lg hover:bg-purple-800 transition-colors ${
                    isRefreshing ? "animate-spin" : ""
                  }`}
                >
                  <RefreshCw className="h-5 w-5 text-purple-400" />
                </button>
                <Activity className="h-5 w-5 text-purple-400" />
              </div>
            </div>

            {/* Reorganized Macro View - Priority-Based Layout */}
            <div className="grid grid-cols-12 gap-4 mb-6">
              
              {/* Top Row: Price Chart, AI Overview, Edge Factor */}
              {/* Priority 1: Price Chart - Medium Card */}
              <div className="col-span-12 lg:col-span-4">
                <div className="bg-purple-950/90 backdrop-blur-xl rounded-2xl border border-purple-900/50 p-5 shadow-xl hover:shadow-2xl transition-all duration-300 h-full relative overflow-hidden">
                  <div className="absolute top-2 right-2 w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
                  <div className="flex items-center space-x-2 mb-3">
                    <BarChart3 className="h-5 w-5 text-purple-300" />
                    <h3 className="text-lg font-semibold text-purple-100">Price Chart</h3>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-purple-400">Current Price</span>
                      <span className="text-lg font-mono text-purple-100">${assetData.price.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-purple-400">Day Change</span>
                      <span className={`text-sm font-mono ${getChangeColor(assetData.dayChange)}`}>
                        {assetData.dayChange >= 0 ? '+' : ''}{assetData.dayChange.toFixed(2)}%
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-purple-400">Overall Change</span>
                      <span className={`text-sm font-mono ${getChangeColor(assetData.overallChange)}`}>
                        {assetData.overallChange >= 0 ? '+' : ''}{assetData.overallChange.toFixed(2)}%
                      </span>
                    </div>
                    {/* Compact chart visualization */}
                    <div className="mt-3 p-3 bg-purple-900/50 rounded-lg">
                      <div className="flex items-end justify-between h-20">
                        <div className="w-1 bg-purple-400" style={{height: '40%'}}></div>
                        <div className="w-1 bg-purple-400" style={{height: '60%'}}></div>
                        <div className="w-1 bg-purple-400" style={{height: '45%'}}></div>
                        <div className="w-1 bg-purple-400" style={{height: '80%'}}></div>
                        <div className="w-1 bg-purple-400" style={{height: '70%'}}></div>
                        <div className="w-1 bg-purple-400" style={{height: '90%'}}></div>
                        <div className="w-1 bg-emerald-400" style={{height: '100%'}}></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Priority 2: AI Overview - Large Card */}
              <div className="col-span-12 lg:col-span-4">
                <div className="bg-purple-950/90 backdrop-blur-xl rounded-2xl border border-purple-900/50 p-5 shadow-xl hover:shadow-2xl transition-all duration-300 h-full relative overflow-hidden">
                  <div className="absolute top-2 right-2 w-2 h-2 bg-amber-400 rounded-full animate-pulse"></div>
                  <div className="flex items-center space-x-2 mb-3">
                    <Brain className="h-5 w-5 text-purple-300" />
                    <h3 className="text-lg font-semibold text-purple-100">AI Overview</h3>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-purple-400">Sentiment</span>
                      <span className={`text-sm font-medium px-2 py-1 rounded ${
                        assetData.sentiment === 'Bullish' ? 'bg-emerald-500/20 text-emerald-400' :
                        assetData.sentiment === 'Bearish' ? 'bg-rose-500/20 text-rose-400' :
                        'bg-amber-500/20 text-amber-400'
                      }`}>
                        {assetData.sentiment}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-purple-400">Confidence</span>
                      <span className="text-lg font-mono text-purple-100">{assetData.confidence}%</span>
                    </div>
                    <div className="mt-3">
                      <p className="text-sm text-purple-200 leading-relaxed">{assetData.aiAnalysis}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Priority 3: Edge Factor - Large Card */}
              <div className="col-span-12 lg:col-span-4">
                <div className="bg-purple-950/90 backdrop-blur-xl rounded-2xl border border-purple-900/50 p-5 shadow-xl hover:shadow-2xl transition-all duration-300 h-full relative overflow-hidden">
                  <div className="absolute top-2 right-2 w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
                  <div className="flex items-center space-x-2 mb-3">
                    <Activity className="h-5 w-5 text-purple-300" />
                    <h3 className="text-lg font-semibold text-purple-100">Edge Factor</h3>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-purple-400">Volatility Edge</span>
                      <span className="text-sm font-mono text-purple-100">{assetData.technicalIndicators.rsi}%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-purple-400">Trend Strength</span>
                      <span className="text-sm font-mono text-purple-100">{assetData.technicalIndicators.macd}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-purple-400">Market Edge</span>
                      <span className="text-sm font-mono text-purple-100">${assetData.technicalIndicators.bollinger}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Second Row: Market Mood & Market Policy Group */}
              <div className="col-span-12 lg:col-span-6">
                <div className="bg-purple-950/90 backdrop-blur-xl rounded-2xl border border-purple-900/50 p-5 shadow-lg hover:shadow-xl transition-all duration-300 h-full">
                  <div className="flex items-center space-x-2 mb-4">
                    <Activity className="h-5 w-5 text-purple-300" />
                    <h3 className="text-lg font-semibold text-purple-100">Market Analysis</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Market Mood */}
                    <div>
                      <h4 className="text-base font-medium text-purple-200 mb-3">Market Mood</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-purple-400">Current Mood</span>
                          <span className={`text-xs font-medium px-2 py-1 rounded ${
                            assetData.sentiment === 'Bullish' ? 'bg-emerald-500/20 text-emerald-400' :
                            assetData.sentiment === 'Bearish' ? 'bg-rose-500/20 text-rose-400' :
                            'bg-amber-500/20 text-amber-400'
                          }`}>
                            {assetData.sentiment}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-purple-400">Momentum</span>
                          <span className="text-xs font-mono text-purple-200">{assetData.technicalIndicators.rsi > 50 ? 'Strong' : 'Weak'}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-purple-400">Volatility</span>
                          <span className="text-xs font-mono text-purple-200">{assetData.technicalIndicators.macd > 0 ? 'High' : 'Low'}</span>
                        </div>
                      </div>
                    </div>
                    {/* Market Policy */}
                    <div>
                      <h4 className="text-base font-medium text-purple-200 mb-3">Market Policy</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-purple-400">Trend Policy</span>
                          <span className="text-xs font-mono text-purple-200">{assetData.overallChange > 0 ? 'Bullish' : 'Bearish'}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-purple-400">Risk Level</span>
                          <span className={`text-xs font-medium px-2 py-1 rounded ${
                            assetData.confidence >= 70 ? 'bg-emerald-500/20 text-emerald-400' :
                            assetData.confidence >= 50 ? 'bg-amber-500/20 text-amber-400' :
                            'bg-rose-500/20 text-rose-400'
                          }`}>
                            {assetData.confidence >= 70 ? 'Low' : assetData.confidence >= 50 ? 'Medium' : 'High'}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-purple-400">Position Size</span>
                          <span className="text-xs font-mono text-purple-200">Recommended</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Third Row: Flow, Bearing, Pulse Group */}
              <div className="col-span-12 lg:col-span-6">
                <div className="bg-purple-950/90 backdrop-blur-xl rounded-2xl border border-purple-900/50 p-5 shadow-lg hover:shadow-xl transition-all duration-300 h-full">
                  <div className="flex items-center space-x-2 mb-4">
                    <Activity className="h-5 w-5 text-purple-300" />
                    <h3 className="text-lg font-semibold text-purple-100">Market Dynamics</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Flow */}
                    <div>
                      <h4 className="text-base font-medium text-purple-200 mb-3">Flow</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-purple-400">Money Flow</span>
                          <span className="text-xs font-mono text-purple-200">{assetData.dayChange > 0 ? 'Inflow' : 'Outflow'}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-purple-400">Volume Trend</span>
                          <span className="text-xs font-mono text-purple-200">{assetData.technicalIndicators.rsi > 50 ? 'Increasing' : 'Decreasing'}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-purple-400">Liquidity</span>
                          <span className="text-xs font-mono text-purple-200">{assetData.marketData.marketCap.includes('T') ? 'High' : 'Medium'}</span>
                        </div>
                      </div>
                    </div>
                    {/* Bearing */}
                    <div>
                      <h4 className="text-base font-medium text-purple-200 mb-3">Bearing</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-purple-400">Direction</span>
                          <span className={`text-xs font-medium px-1 py-0.5 rounded ${
                            assetData.overallChange > 0 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                          }`}>
                            {assetData.overallChange > 0 ? 'North' : 'South'}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-purple-400">Strength</span>
                          <span className="text-xs font-mono text-purple-200">{Math.abs(assetData.overallChange).toFixed(0)}°</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-purple-400">Support</span>
                          <span className="text-xs font-mono text-purple-200">${(assetData.price * 0.95).toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                    {/* Pulse */}
                    <div>
                      <h4 className="text-base font-medium text-purple-200 mb-3">Pulse</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-purple-400">Market Pulse</span>
                          <span className={`text-xs font-medium px-1 py-0.5 rounded ${
                            assetData.technicalIndicators.rsi > 70 ? 'bg-emerald-500/20 text-emerald-400' :
                            assetData.technicalIndicators.rsi > 30 ? 'bg-amber-500/20 text-amber-400' :
                            'bg-rose-500/20 text-rose-400'
                          }`}>
                            {assetData.technicalIndicators.rsi > 70 ? 'Strong' : assetData.technicalIndicators.rsi > 30 ? 'Moderate' : 'Weak'}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-purple-400">Activity Level</span>
                          <span className="text-xs font-mono text-purple-200">{assetData.dayChange > 0 ? 'High' : 'Low'}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-purple-400">Signal Strength</span>
                          <span className="text-xs font-mono text-purple-200">{assetData.confidence}%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* News Stories - Full Width Bottom */}
              <div className="col-span-12">
                <div className="bg-purple-950/90 backdrop-blur-xl rounded-2xl border border-purple-900/50 p-5 shadow-lg hover:shadow-xl transition-all duration-300">
                  <div className="flex items-center space-x-2 mb-4">
                    <Clock className="h-5 w-5 text-purple-300" />
                    <h3 className="text-lg font-semibold text-purple-100">News Stories</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {assetData.recentNews.map((news) => (
                      <div key={news.id} className="p-3 bg-purple-900/50 rounded-lg">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="text-sm font-medium text-purple-200">{news.title}</h4>
                          <span className={`text-xs px-2 py-1 rounded ${
                            news.impact === 'High' ? 'bg-rose-500/20 text-rose-400' :
                            news.impact === 'Medium' ? 'bg-amber-500/20 text-amber-400' :
                            'bg-emerald-500/20 text-emerald-400'
                          }`}>
                            {news.impact}
                          </span>
                        </div>
                        <div className="text-xs text-purple-400">
                          {new Date(news.timestamp).toLocaleTimeString()}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </MainLayout>
  );
}
