"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { MainLayout } from "@/components/dashboard/MainLayout";
import { fetchStockQuote } from "@/services/polygonStockData";
import { Gauge } from "@/components/ui/gauge";
import { MarketMoodGauge } from "@/components/ui/market-mood-gauge";
import { 
  TrendingUp, 
  TrendingDown, 
  ArrowLeft,
  Brain,
  Activity,
  Clock,
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
  },
  "XAGUSD": {
    symbol: "XAGUSD",
    name: "Silver / US Dollar",
    price: 31.52,
    dayChange: 0.85,
    overallChange: 2.34,
    sentiment: "Bullish",
    confidence: 65,
    aiAnalysis: "Silver shows strength amid industrial demand recovery and investment interest. Technical indicators suggest upside potential with $32.50 as key resistance level. Support at $31.00.",
    technicalIndicators: {
      rsi: 61.2,
      macd: 1.2,
      bollinger: 31.5
    },
    marketData: {
      volume: "89.7K",
      marketCap: "1.8T",
      supply: "1.74M tonnes",
      circulating: "1.74M tonnes"
    },
    recentNews: [
      {
        id: "1",
        timestamp: new Date(Date.now() - 2 * 60 * 1000),
        title: "Silver industrial demand surges in solar panel production",
        impact: "High"
      },
      {
        id: "2",
        timestamp: new Date(Date.now() - 5 * 60 * 1000),
        title: "ETF inflows for silver reach monthly high",
        impact: "Medium"
      },
      {
        id: "3",
        timestamp: new Date(Date.now() - 8 * 60 * 1000),
        title: "Mining output declines in major silver-producing regions",
        impact: "Low"
      }
    ]
  },
  "US10Y": {
    symbol: "US10Y",
    name: "US 10Y Treasury",
    price: 4.32,
    dayChange: -0.05,
    overallChange: -1.14,
    sentiment: "Bearish",
    confidence: 72,
    aiAnalysis: "Treasury yields face pressure from mixed economic signals. While inflation concerns persist, growth worries may cap upside. Range trading likely between 4.20-4.45%.",
    technicalIndicators: {
      rsi: 45.2,
      macd: -0.3,
      bollinger: 4.38
    },
    marketData: {
      volume: "N/A",
      marketCap: "N/A",
      supply: "N/A",
      circulating: "N/A"
    },
    recentNews: [
      {
        id: "1",
        timestamp: new Date(Date.now() - 2 * 60 * 1000),
        title: "Fed officials signal patience on rate cuts despite cooling inflation",
        impact: "High"
      },
      {
        id: "2",
        timestamp: new Date(Date.now() - 5 * 60 * 1000),
        title: "Treasury auction sees strong demand despite yield volatility",
        impact: "Medium"
      },
      {
        id: "3",
        timestamp: new Date(Date.now() - 8 * 60 * 1000),
        title: "Global bond markets show signs of stabilization",
        impact: "Low"
      }
    ]
  },
  "XPTUSD": {
    symbol: "XPTUSD",
    name: "Platinum / US Dollar",
    price: 945.80,
    dayChange: 5.20,
    overallChange: 0.55,
    sentiment: "Bullish",
    confidence: 62,
    aiAnalysis: "Platinum shows strength amid industrial demand recovery from automotive sector. Key resistance at $980, support at $920.",
    technicalIndicators: {
      rsi: 56.3,
      macd: 2.1,
      bollinger: 938.5
    },
    marketData: {
      volume: "45.2K",
      marketCap: "285.6B",
      supply: "69M tonnes",
      circulating: "69M tonnes"
    },
    recentNews: [
      {
        id: "1",
        timestamp: new Date(Date.now() - 2 * 60 * 1000),
        title: "Automotive catalyst demand drives platinum prices higher",
        impact: "High"
      },
      {
        id: "2",
        timestamp: new Date(Date.now() - 5 * 60 * 1000),
        title: "South African mining production shows unexpected decline",
        impact: "Medium"
      },
      {
        id: "3",
        timestamp: new Date(Date.now() - 8 * 60 * 1000),
        title: "Platinum ETF holdings increase for third consecutive week",
        impact: "Low"
      }
    ]
  },
  "XPDUSD": {
    symbol: "XPDUSD",
    name: "Palladium / US Dollar",
    price: 1234.50,
    dayChange: -8.75,
    overallChange: -0.70,
    sentiment: "Bearish",
    confidence: 58,
    aiAnalysis: "Palladium faces pressure from substitution to platinum in automotive catalysts. Key resistance at $1,280, support at $1,200.",
    technicalIndicators: {
      rsi: 41.2,
      macd: -3.4,
      bollinger: 1238.5
    },
    marketData: {
      volume: "32.8K",
      marketCap: "67.2B",
      supply: "2.1M tonnes",
      circulating: "2.1M tonnes"
    },
    recentNews: [
      {
        id: "1",
        timestamp: new Date(Date.now() - 2 * 60 * 1000),
        title: "Auto manufacturers shift toward platinum in catalytic converters",
        impact: "High"
      },
      {
        id: "2",
        timestamp: new Date(Date.now() - 5 * 60 * 1000),
        title: "Russian palladium exports increase amid sanctions workaround",
        impact: "Medium"
      },
      {
        id: "3",
        timestamp: new Date(Date.now() - 8 * 60 * 1000),
        title: "Palladium industrial demand shows signs of weakening",
        impact: "Low"
      }
    ]
  },
  "AAPL": {
    symbol: "AAPL",
    name: "Apple Inc.",
    price: 178.45,
    dayChange: 2.34,
    overallChange: 1.33,
    sentiment: "Bullish",
    confidence: 72,
    aiAnalysis: "Apple shows strength with iPhone sales and services growth. Key resistance at $185, support at $170.",
    technicalIndicators: {
      rsi: 62.1,
      macd: 2.8,
      bollinger: 175.5
    },
    marketData: {
      volume: "45.2M",
      marketCap: "2.8T",
      supply: "15.6B",
      circulating: "15.6B"
    },
    recentNews: [
      {
        id: "1",
        timestamp: new Date(Date.now() - 2 * 60 * 1000),
        title: "Apple announces new AI features for iOS ecosystem",
        impact: "High"
      },
      {
        id: "2",
        timestamp: new Date(Date.now() - 5 * 60 * 1000),
        title: "iPhone 15 pre-orders exceed analyst expectations",
        impact: "Medium"
      },
      {
        id: "3",
        timestamp: new Date(Date.now() - 8 * 60 * 1000),
        title: "Apple Services revenue reaches new quarterly record",
        impact: "Low"
      }
    ]
  },
  "MSFT": {
    symbol: "MSFT",
    name: "Microsoft Corporation",
    price: 378.22,
    dayChange: 3.12,
    overallChange: 0.83,
    sentiment: "Bullish",
    confidence: 68,
    aiAnalysis: "Microsoft benefits from AI and cloud growth. Azure expansion drives revenue. Key resistance at $385, support at $370.",
    technicalIndicators: {
      rsi: 58.7,
      macd: 3.5,
      bollinger: 376.2
    },
    marketData: {
      volume: "32.1M",
      marketCap: "2.8T",
      supply: "7.5B",
      circulating: "7.5B"
    },
    recentNews: [
      {
        id: "1",
        timestamp: new Date(Date.now() - 2 * 60 * 1000),
        title: "Microsoft Azure AI adoption accelerates among enterprise clients",
        impact: "High"
      },
      {
        id: "2",
        timestamp: new Date(Date.now() - 5 * 60 * 1000),
        title: "Copilot integration expands across Office 365 suite",
        impact: "Medium"
      },
      {
        id: "3",
        timestamp: new Date(Date.now() - 8 * 60 * 1000),
        title: "Microsoft gaming division shows strong quarterly growth",
        impact: "Low"
      }
    ]
  },
  "GOOGL": {
    symbol: "GOOGL",
    name: "Alphabet Inc.",
    price: 142.56,
    dayChange: -1.45,
    overallChange: -1.01,
    sentiment: "Bearish",
    confidence: 65,
    aiAnalysis: "Google faces regulatory pressure but AI investments show promise. Key resistance at $148, support at $138.",
    technicalIndicators: {
      rsi: 42.3,
      macd: -1.8,
      bollinger: 143.5
    },
    marketData: {
      volume: "28.9M",
      marketCap: "1.8T",
      supply: "12.5B",
      circulating: "12.5B"
    },
    recentNews: [
      {
        id: "1",
        timestamp: new Date(Date.now() - 2 * 60 * 1000),
        title: "EU antitrust regulators prepare new investigation into Google's ad tech",
        impact: "High"
      },
      {
        id: "2",
        timestamp: new Date(Date.now() - 5 * 60 * 1000),
        title: "Google Cloud revenue growth slows amid increased competition",
        impact: "Medium"
      },
      {
        id: "3",
        timestamp: new Date(Date.now() - 8 * 60 * 1000),
        title: "Gemini AI model shows improved performance in benchmarks",
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
  const [timeframe, setTimeframe] = useState<'1D' | '5D' | '1M'>('1D');

  // Keep a stable ref at the top-level (Rules of Hooks)
  const assetRef = useRef<string | null>(null);

  useEffect(() => {
    setMounted(true);

    const asset = params.asset as string;
    assetRef.current = asset;

    let cancelled = false;

    const fetchAssetData = async (symbol: string) => {
      const fallback = mockAssetData[symbol];
      if (!fallback) {
        router.push('/dashboard');
        return;
      }

      // Always show fallback immediately
      if (!cancelled) setAssetData(fallback);

      try {
        const quote = await fetchStockQuote(symbol);
        if (cancelled) return;

        setAssetData(prev =>
          prev
            ? {
                ...prev,
                price: quote.price,
                dayChange: quote.change,
                overallChange: quote.changePercent,
                marketData: {
                  ...prev.marketData,
                  volume: quote.volume.toLocaleString(),
                },
              }
            : null
        );
      } catch (error) {
        console.error('Failed to fetch real-time data:', error);
        // Keep fallback if API fails
      }
    };

    const symbol = assetRef.current;
    if (symbol) {
      fetchAssetData(symbol);
      const interval = setInterval(() => fetchAssetData(assetRef.current || symbol), 30000);

      return () => {
        cancelled = true;
        clearInterval(interval);
      };
    }

    return undefined;
  }, [params.asset, router]);


  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
    }, 1000);
  };

  const sparklinePath = useMemo(() => {
    // Deterministic sparkline so render is pure (no Math.random)
    const seed = assetData?.symbol?.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0) ?? 0;
    const points: string[] = [];

    for (let i = 0; i <= 100; i += 20) {
      // Simple pseudo-random based on seed + i (deterministic)
      const v = Math.sin(seed + i) * 0.5 + 0.5; // 0..1
      const y = 15 + (v - 0.5) * 10;
      points.push(`${i},${y.toFixed(2)}`);
    }

    return `M${points.join(' L')}`;
  }, [assetData?.symbol]);


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
      <div className="p-3 sm:p-4 lg:p-5">
        {assetData && (
          <>
            {/* Header with Edge Factor Card Docked */}
            <div className="flex items-center justify-between mb-3">
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

            {/* Edge Factor Card - Docked in Header */}
            <div className="mb-3 bg-purple-950/90 backdrop-blur-xl rounded-xl border border-purple-900/50 p-3 shadow-xl">
              <div className="flex items-center gap-4">
                {/* Dashboard Indicator Badge - Interactive Gauge */}
                <div className="flex-shrink-0">
                  <Gauge
                    value={assetData.confidence}
                    size={56}
                    strokeWidth={6}
                    showValue={true}
                    showPercentage={false}
                    label=""
                    sentiment={assetData.sentiment}
                  />
                </div>
                {/* Qualitative State Text */}
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-sm font-semibold px-2 py-0.5 rounded ${
                      assetData.sentiment === 'Bullish' ? 'bg-emerald-500/20 text-emerald-400' :
                      assetData.sentiment === 'Bearish' ? 'bg-rose-500/20 text-rose-400' :
                      'bg-amber-500/20 text-amber-400'
                    }`}>
                      {assetData.sentiment} / {assetData.confidence >= 70 ? 'High Clarity' : assetData.confidence >= 50 ? 'Medium Clarity' : 'Low Clarity'}
                    </span>
                  </div>
                  <p className="text-xs text-purple-300 leading-tight">
                    Technical and macro confluence indicates {assetData.sentiment.toLowerCase()} conditions with {assetData.confidence}% confidence level.
                  </p>
                </div>
              </div>
            </div>

            {/* Multi-Column Dashboard Grid Layout */}
            <div className="grid grid-cols-12 gap-2">
              
              {/* Left Column: Price Chart & News Stories */}
              <div className="col-span-12 lg:col-span-4 space-y-2">
                {/* Price Chart Module */}
                <div className="bg-purple-950/90 backdrop-blur-xl rounded-xl border border-purple-900/50 p-3 shadow-xl">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <BarChart3 className="h-5 w-5 text-purple-300" />
                      <h3 className="text-lg font-semibold text-purple-100">Price Chart</h3>
                    </div>
                    {/* Timeframe Toggles */}
                    <div className="flex gap-1">
                      <button
                        onClick={() => setTimeframe('1D')}
                        aria-pressed={timeframe === '1D'}
                        className={`px-2 py-1 text-xs rounded border transition-colors ${
                          timeframe === '1D'
                            ? 'bg-purple-700/50 text-purple-200 border-purple-500/30'
                            : 'bg-purple-900/30 text-purple-400 border-purple-700/30 hover:border-purple-500/50'
                        }`}
                      >
                        1D
                      </button>
                      <button
                        onClick={() => setTimeframe('5D')}
                        aria-pressed={timeframe === '5D'}
                        className={`px-2 py-1 text-xs rounded border transition-colors ${
                          timeframe === '5D'
                            ? 'bg-purple-700/50 text-purple-200 border-purple-500/30'
                            : 'bg-purple-900/30 text-purple-400 border-purple-700/30 hover:border-purple-500/50'
                        }`}
                      >
                        5D
                      </button>
                      <button
                        onClick={() => setTimeframe('1M')}
                        aria-pressed={timeframe === '1M'}
                        className={`px-2 py-1 text-xs rounded border transition-colors ${
                          timeframe === '1M'
                            ? 'bg-purple-700/50 text-purple-200 border-purple-500/30'
                            : 'bg-purple-900/30 text-purple-400 border-purple-700/30 hover:border-purple-500/50'
                        }`}
                      >
                        1M
                      </button>
                    </div>
                  </div>
                  {/* Price Readouts */}
                  <div className="flex items-baseline gap-2 mb-2">
                    <span className="text-xl font-mono text-white">${assetData.price.toFixed(2)}</span>
                    <span className={`text-sm font-mono ${getChangeColor(assetData.dayChange)}`}>
                      {assetData.dayChange >= 0 ? '+' : ''}{assetData.dayChange.toFixed(2)}%
                    </span>
                  </div>
                  {/* Responsive Line/Area Chart */}
                  <div className="relative h-28 bg-purple-900/30 rounded-lg overflow-hidden">
                    <svg className="w-full h-full" viewBox="0 0 100 40" preserveAspectRatio="none">
                      <defs>
                        <linearGradient id="chartGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                          <stop offset="0%" stopColor="rgba(168, 85, 247, 0.4)" />
                          <stop offset="100%" stopColor="rgba(168, 85, 247, 0.0)" />
                        </linearGradient>
                      </defs>
                      <path
                        d="M0,30 Q10,25 20,28 T40,20 T60,15 T80,18 T100,10 L100,40 L0,40 Z"
                        fill="url(#chartGradient)"
                      />
                      <path
                        d="M0,30 Q10,25 20,28 T40,20 T60,15 T80,18 T100,10"
                        fill="none"
                        stroke="rgba(168, 85, 247, 0.8)"
                        strokeWidth="0.5"
                      />
                    </svg>
                  </div>
                </div>

                {/* News Stories Module */}
                <div className="bg-purple-950/90 backdrop-blur-xl rounded-xl border border-purple-900/50 p-3 shadow-xl">
                  <div className="flex items-center space-x-2 mb-3">
                    <Clock className="h-5 w-5 text-purple-300" />
                    <h3 className="text-lg font-semibold text-purple-100">News Stories</h3>
                  </div>
                  <div className="space-y-1.5 max-h-80 overflow-y-auto">
                    {assetData.recentNews.map((news) => (
                      <div key={news.id} className="p-1.5 bg-purple-900/30 rounded-lg hover:bg-purple-900/50 transition-colors">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="text-xs font-medium text-purple-200 flex-1 leading-tight">{news.title}</h4>
                          <span className={`text-xs px-1.5 py-0.5 rounded flex-shrink-0 ${
                            news.impact === 'High' ? 'bg-rose-500/20 text-rose-400' :
                            news.impact === 'Medium' ? 'bg-amber-500/20 text-amber-400' :
                            'bg-emerald-500/20 text-emerald-400'
                          }`}>
                            {news.impact}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-1 text-xs text-purple-400">
                          <span>Bloomberg</span>
                          <span>•</span>
                          <span>{new Date(news.timestamp).toLocaleTimeString()}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Main Body: AI Overview, Market Mood, Market Policy */}
              <div className="col-span-12 lg:col-span-8 space-y-2">
                {/* AI Overview Card */}
                <div className="bg-purple-950/90 backdrop-blur-xl rounded-xl border border-purple-900/50 p-3 shadow-xl">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <Brain className="h-5 w-5 text-purple-300" />
                      <h3 className="text-lg font-semibold text-purple-100">AI Overview</h3>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded ${
                        assetData.sentiment === 'Bullish' ? 'bg-emerald-500/20 text-emerald-400' :
                        assetData.sentiment === 'Bearish' ? 'bg-rose-500/20 text-rose-400' :
                        'bg-amber-500/20 text-amber-400'
                      }`}>
                        {assetData.sentiment}
                      </span>
                      <span className="text-xs font-mono text-purple-300">{assetData.confidence}%</span>
                    </div>
                  </div>
                  <p className="text-xs text-purple-200 leading-tight">{assetData.aiAnalysis}</p>
                </div>

                {/* Market Mood & Market Policy Grid - 6-column symmetrical layout */}
                <div className="grid grid-cols-6 gap-2">
                  {/* Market Mood - Split two-column layout */}
                  <div className="col-span-6 md:col-span-3 bg-purple-950/90 backdrop-blur-xl rounded-xl border border-purple-900/50 p-3 shadow-xl">
                    <div className="flex items-center space-x-2 mb-3">
                      <Activity className="h-5 w-5 text-purple-300" />
                      <h3 className="text-lg font-semibold text-purple-100">Market Mood</h3>
                    </div>
                    <div className="flex gap-4">
                      {/* Left Column: Gauge Workspace */}
                      <div className="w-2/5 flex-shrink-0">
                        <div className="relative h-24">
                          <MarketMoodGauge value={assetData.technicalIndicators.rsi} />
                        </div>
                      </div>
                      {/* Right Column: Context Grid */}
                      <div className="w-3/5 flex flex-col justify-center space-y-2">
                        <div className="text-xs font-semibold text-purple-300 mb-1">Market State</div>
                        <div className={`text-sm font-bold ${
                          assetData.technicalIndicators.rsi >= 60 ? 'text-emerald-400' :
                          assetData.technicalIndicators.rsi <= 40 ? 'text-rose-500' :
                          'text-amber-400'
                        }`}>
                          {assetData.technicalIndicators.rsi >= 60 ? 'Risk On' :
                           assetData.technicalIndicators.rsi <= 40 ? 'Risk Off' :
                           'Balanced'}
                        </div>
                        <div className="grid grid-cols-2 gap-2 mt-2">
                          <div className="bg-purple-900/30 rounded p-1.5">
                            <div className="text-[10px] text-purple-400">Momentum</div>
                            <div className="text-xs font-mono text-purple-200">{assetData.technicalIndicators.rsi > 50 ? 'Strong' : 'Weak'}</div>
                          </div>
                          <div className="bg-purple-900/30 rounded p-1.5">
                            <div className="text-[10px] text-purple-400">Volatility</div>
                            <div className="text-xs font-mono text-purple-200">{assetData.technicalIndicators.macd > 0 ? 'High' : 'Low'}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Market Policy - Watermark Text - Spans 3 columns */}
                  <div className="col-span-6 md:col-span-3 bg-purple-950/90 backdrop-blur-xl rounded-xl border border-purple-900/50 p-3 shadow-xl relative overflow-hidden">
                    {/* Watermark */}
                    <div className={`absolute inset-0 flex items-center justify-center pointer-events-none ${
                      assetData.overallChange > 0 ? 'text-emerald-500/5' : 'text-rose-500/5'
                    }`}>
                      <span className="text-4xl font-black uppercase tracking-wider">
                        {assetData.overallChange > 0 ? 'DOVISH' : 'HAWKISH'}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2 mb-3 relative z-10">
                      <Activity className="h-5 w-5 text-purple-300" />
                      <h3 className="text-lg font-semibold text-purple-100">Market Policy</h3>
                    </div>
                    <p className="text-xs text-purple-200 leading-tight mb-2 relative z-10">
                      {assetData.overallChange > 0 
                        ? 'Central bank policies remain supportive of growth with accommodative stance expected to continue.'
                        : 'Monetary tightening cycle continues with hawkish signals from major central banks.'}
                    </p>
                    {/* Toggle Menu Drawer */}
                    <div className="p-1.5 bg-purple-900/30 rounded-lg relative z-10">
                      <div className="flex justify-between text-xs text-purple-300">
                        <span>Trend Policy:</span>
                        <span className="font-mono">{assetData.overallChange > 0 ? 'Bullish' : 'Bearish'}</span>
                      </div>
                    </div>
                  </div>
                </div>
                {/* Bottom Metric Trio: Flow, Bearing, Pulse - 6-column symmetrical layout */}
              <div className="col-span-8 grid grid-cols-6 gap-2">
                {/* Flow Panel - Spans 2 columns */}
                <div className="col-span-6 md:col-span-2 bg-purple-950/90 backdrop-blur-xl rounded-xl border border-purple-900/50 p-3 shadow-xl">
                  <h3 className="text-lg font-semibold text-purple-100 mb-3">Flow</h3>
                  <div className="mb-2">
                    <div className="flex justify-between text-xs text-purple-400 mb-1.5">
                      <span>Thin</span>
                      <span>Healthy</span>
                      <span>Crowded</span>
                    </div>
                    <div className="relative h-2 bg-purple-900/50 rounded-full overflow-hidden">
                      <div 
                        className="absolute h-full bg-gradient-to-r from-purple-600 to-purple-400 rounded-full transition-all duration-500"
                        style={{ width: `${assetData.technicalIndicators.rsi}%` }}
                      />
                      <div 
                        className="absolute top-1/2 -translate-y-1/2 w-2.5 h-2.5 bg-purple-400 rounded-full shadow-[0_0_8px_rgba(168,85,247,0.8)] transition-all duration-500"
                        style={{ left: `${assetData.technicalIndicators.rsi}%`, transform: 'translateX(-50%) translateY(-50%)' }}
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5 text-xs text-purple-300">
                    <div className="flex justify-between">
                      <span>Money Flow:</span>
                      <span className="font-mono">{assetData.dayChange > 0 ? 'Inflow' : 'Outflow'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Volume Trend:</span>
                      <span className="font-mono">{assetData.technicalIndicators.rsi > 50 ? 'Increasing' : 'Decreasing'}</span>
                    </div>
                  </div>
                </div>

                {/* Bearing Panel - Spans 2 columns */}
                <div className="col-span-6 md:col-span-2 bg-purple-950/90 backdrop-blur-xl rounded-xl border border-purple-900/50 p-3 shadow-xl">
                  <h3 className="text-lg font-semibold text-purple-100 mb-3">Bearing</h3>
                  <div className="mb-2">
                    <span className={`text-sm font-semibold ${
                      assetData.overallChange > 0 ? 'text-emerald-400' : 'text-rose-400'
                    }`}>
                      {assetData.overallChange > 2 ? 'BULLISH UP' : assetData.overallChange < -2 ? 'BEARISH DOWN' : 'CHOPPY'}
                    </span>
                  </div>
                  {/* Mini Sparkline Chart */}
                  <div className="relative h-8 mb-2">
                    <svg className="w-full h-full" viewBox="0 0 100 30" preserveAspectRatio="none">
                      <path
                        d={sparklinePath}
                        fill="none"
                        stroke={assetData.overallChange > 0 ? 'rgba(34, 197, 94, 0.8)' : 'rgba(239, 68, 68, 0.8)'}
                        strokeWidth="1"
                      />
                    </svg>
                  </div>
                  <div className="space-y-1.5 text-xs text-purple-300">
                    <div className="flex justify-between">
                      <span>Direction:</span>
                      <span className="font-mono">{assetData.overallChange > 0 ? 'North' : 'South'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Strength:</span>
                      <span className="font-mono">{Math.abs(assetData.overallChange).toFixed(0)}°</span>
                    </div>
                  </div>
                </div>

                {/* Pulse Panel - Spans 2 columns */}
                <div className="col-span-6 md:col-span-2 bg-purple-950/90 backdrop-blur-xl rounded-xl border border-purple-900/50 p-3 shadow-xl">
                  <h3 className="text-lg font-semibold text-purple-100 mb-3">Pulse</h3>
                  <div className="mb-2">
                    <div className="flex justify-between text-xs text-purple-400 mb-1.5">
                      <span>Quiet</span>
                      <span>Tradable</span>
                      <span>Wild</span>
                    </div>
                    <div className="relative h-2 bg-purple-900/50 rounded-full overflow-hidden">
                      <div 
                        className="absolute h-full bg-gradient-to-r from-purple-600 to-purple-400 rounded-full transition-all duration-500"
                        style={{ width: `${assetData.confidence}%` }}
                      />
                      <div 
                        className="absolute top-1/2 -translate-y-1/2 w-2.5 h-2.5 bg-purple-400 rounded-full shadow-[0_0_8px_rgba(168,85,247,0.8)] transition-all duration-500"
                        style={{ left: `${assetData.confidence}%`, transform: 'translateX(-50%) translateY(-50%)' }}
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5 text-xs text-purple-300">
                    <div className="flex justify-between">
                      <span>Market Pulse:</span>
                      <span className={`font-mono ${
                        assetData.technicalIndicators.rsi > 70 ? 'text-emerald-400' :
                        assetData.technicalIndicators.rsi > 30 ? 'text-amber-400' :
                        'text-rose-400'
                      }`}>
                        {assetData.technicalIndicators.rsi > 70 ? 'Strong' : assetData.technicalIndicators.rsi > 30 ? 'Moderate' : 'Weak'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Signal Strength:</span>
                      <span className="font-mono">{assetData.confidence}%</span>
                    </div>
                  </div>
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
