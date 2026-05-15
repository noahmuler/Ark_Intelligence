"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "@/contexts/ThemeContext";
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
import { fetchComprehensiveMarketData } from "@/services/dataServiceManager";
import { StockData } from "@/services/polygonStockData";
import { analyzeStock } from "@/services/geminiMarketAnalysis";
import { fetchMultipleCryptoData, CRYPTO_SYMBOL_MAP, getFallbackCryptoData } from "@/services/coinGeckoCryptoData";

type AssetCategory = "forex" | "crypto" | "stocks" | "metals";

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
  category: AssetCategory;
}

/**
 * Determine asset category based on symbol
 */
const getAssetCategory = (symbol: string): AssetCategory => {
  const cryptoSymbols = ['BTCUSD', 'ETHUSD', 'ADAUSD', 'SOLUSD', 'DOTUSD'];
  const stockSymbols = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'META', 'NVDA', 'TSLA', 'SPX', 'QQQ', 'DIA'];
  const metalsSymbols = ['XAUUSD', 'XAGUSD', 'XPTUSD', 'XPDUSD']; // Gold, Silver, Platinum, Palladium
  
  if (cryptoSymbols.includes(symbol)) return 'crypto';
  if (stockSymbols.includes(symbol)) return 'stocks';
  if (metalsSymbols.includes(symbol)) return 'metals';
  return 'forex'; // Default to forex for currency pairs, indices, etc.
};

/**
 * Transform StockData to Asset format
 */
const transformStockToAsset = (stock: StockData): Asset => {
  const sentiment = stock.changePercent > 1 ? "Bullish" : 
                   stock.changePercent < -1 ? "Bearish" : "Neutral";
  const confidence = Math.min(95, Math.max(50, Math.abs(stock.changePercent) * 10 + 50));
  
  return {
    symbol: stock.symbol,
    name: stock.name,
    price: stock.price,
    dayChange: stock.change,
    overallChange: stock.changePercent,
    sentiment,
    confidence: Math.round(confidence),
    aiAnalysis: `${stock.name} is currently trading at $${stock.price.toFixed(2)} with a ${stock.changePercent > 0 ? 'positive' : 'negative'} sentiment. Recent price action suggests ${sentiment.toLowerCase()} conditions with ${confidence}% confidence.`,
    volume: stock.volume > 1000000 ? `${(stock.volume / 1000000).toFixed(1)}M` : `${(stock.volume / 1000).toFixed(1)}K`,
    marketCap: stock.marketCap > 1000000000000 ? `${(stock.marketCap / 1000000000000).toFixed(1)}T` : 
               stock.marketCap > 1000000000 ? `${(stock.marketCap / 1000000000).toFixed(1)}B` :
               `${(stock.marketCap / 1000000).toFixed(1)}M`,
    dayHigh: stock.dayHigh || stock.price * 1.01,
    dayLow: stock.dayLow || stock.price * 0.99,
    weekHigh: stock.fiftyTwoWeekHigh || stock.price * 1.15,
    weekLow: stock.fiftyTwoWeekLow || stock.price * 0.85,
    technicalIndicators: {
      rsi: 50 + (stock.changePercent * 2),
      macd: stock.change * 10,
      bollinger: stock.price
    },
    category: getAssetCategory(stock.symbol)
  };
};

/**
 * Fetch real crypto prices from CoinGecko
 */
const fetchRealCryptoPrices = async (): Promise<{ [key: string]: any }> => {
  try {
    const cryptoSymbols = ['bitcoin', 'ethereum'];
    const cryptoData = await fetchMultipleCryptoData(cryptoSymbols);
    
    const cryptoPrices: { [key: string]: any } = {};
    cryptoData.forEach(crypto => {
      cryptoPrices[crypto.symbol] = {
        price: crypto.current_price,
        dayChange: crypto.price_change_percentage_24h * crypto.current_price / 100,
        overallChange: crypto.price_change_percentage_7d * crypto.current_price / 100,
        volume: crypto.total_volume.toString(),
        marketCap: crypto.market_cap.toString(),
        dayHigh: crypto.high_24h,
        dayLow: crypto.low_24h
      };
    });
    
    return cryptoPrices;
  } catch (error) {
    console.error('Error fetching crypto prices:', error);
    return {};
  }
};

/**
 * Fetch real assets from APIs
 */
const fetchRealAssets = async (): Promise<Asset[]> => {
  try {
    // Fetch both stock and crypto data
    const [marketResponse, cryptoPrices] = await Promise.all([
      fetchComprehensiveMarketData(),
      fetchRealCryptoPrices()
    ]);
    
    const stockData = marketResponse.data.stocks;
    
    // Transform stock data to assets
    const stockAssets = stockData.map(transformStockToAsset);
    
    // Get fallback assets to merge with real data
    const fallbackAssets = getFallbackAssets();
    
    // Merge real data with fallback for better coverage
    const mergedAssets = fallbackAssets.map(fallbackAsset => {
      // Check if we have real crypto data for this asset
      if (cryptoPrices[fallbackAsset.symbol]) {
        const cryptoData = cryptoPrices[fallbackAsset.symbol];
        return {
          ...fallbackAsset,
          price: cryptoData.price,
          dayChange: cryptoData.dayChange,
          overallChange: cryptoData.overallChange,
          volume: cryptoData.volume,
          marketCap: cryptoData.marketCap,
          dayHigh: cryptoData.dayHigh,
          dayLow: cryptoData.dayLow
        };
      }
      
      // Check if we have real stock data for this asset
      const stockAsset = stockAssets.find(sa => sa.symbol === fallbackAsset.symbol);
      if (stockAsset) {
        return stockAsset;
      }
      
      // Return fallback if no real data available
      return fallbackAsset;
    });
    
    // Get AI analysis for each asset
    const assetsWithAI = await Promise.all(
      mergedAssets.map(async (asset) => {
        try {
          const analysis = await analyzeStock(asset.symbol, {
            price: asset.price,
            change: asset.dayChange,
            changePercent: (asset.dayChange / asset.price) * 100,
            volume: parseInt(asset.volume.replace(/[^0-9]/g, '')) || 0
          });
          
          return {
            ...asset,
            aiAnalysis: analysis.analysis.summary,
            confidence: Math.round(analysis.analysis.riskLevel === 'Low' ? 85 : 
                                     analysis.analysis.riskLevel === 'High' ? 65 : 75),
            sentiment: (analysis.analysis.marketOutlook === 'Positive' ? 'Bullish' : 
                       analysis.analysis.marketOutlook === 'Negative' ? 'Bearish' : 'Neutral') as "Bullish" | "Bearish" | "Neutral"
          };
        } catch (error) {
          console.warn(`Failed to get AI analysis for ${asset.symbol}:`, error);
          return asset;
        }
      })
    );
    
    return assetsWithAI;
  } catch (error) {
    console.error('Error fetching real assets:', error);
    return [];
  }
};

/**
 * Fallback assets for when API fails
 */
const getFallbackAssets = (): Asset[] => [
  {
    symbol: "XAUUSD",
    name: "Gold / US Dollar",
    price: 2748.32,
    dayChange: 15.23,
    overallChange: 2.15,
    sentiment: "Bullish",
    confidence: 78,
    aiAnalysis: "Gold shows strength amid geopolitical tensions and inflation concerns. Central bank buying continues to support prices. Technical indicators suggest further upside potential. Key support at $2,700, resistance at $2,800.",
    volume: "124.5K",
    marketCap: "14.2T",
    dayHigh: 2765.00,
    dayLow: 2730.50,
    weekHigh: 2800.00,
    weekLow: 2700.00,
    technicalIndicators: {
      rsi: 62.3,
      macd: 15.2,
      bollinger: 2767.8
    },
    category: "metals"
  },
  {
    symbol: "XAGUSD",
    name: "Silver / US Dollar",
    price: 31.52,
    dayChange: 0.85,
    overallChange: 2.34,
    sentiment: "Bullish",
    confidence: 65,
    aiAnalysis: "Silver shows strength amid industrial demand recovery and investment interest. Technical indicators suggest upside potential with $32.50 as key resistance level. Support at $31.00.",
    volume: "89.7K",
    marketCap: "1.8T",
    dayHigh: 31.85,
    dayLow: 31.20,
    weekHigh: 32.50,
    weekLow: 31.00,
    technicalIndicators: {
      rsi: 61.2,
      macd: 1.2,
      bollinger: 31.5
    },
    category: "metals"
  },
  {
    symbol: "BTCUSD",
    name: "Bitcoin / US Dollar",
    price: 67845.32,
    dayChange: 2341.57,
    overallChange: 12.45,
    sentiment: "Bullish",
    confidence: 88,
    aiAnalysis: "Bitcoin shows strong momentum as institutional adoption accelerates and ETF inflows continue. Recent price action suggests continuation of uptrend. Key resistance at $70,000, support at $65,000 remains solid.",
    volume: "2.8M",
    marketCap: "1.31T",
    dayHigh: 68500.00,
    dayLow: 66500.00,
    weekHigh: 70000.00,
    weekLow: 65000.00,
    technicalIndicators: {
      rsi: 74.8,
      macd: 1250.3,
      bollinger: 66500.0
    },
    category: "crypto"
  },
  {
    symbol: "WTIUSD",
    name: "Crude Oil WTI",
    price: 82.35,
    dayChange: 1.67,
    overallChange: 2.85,
    sentiment: "Bullish",
    confidence: 68,
    aiAnalysis: "Oil prices gain support from supply concerns and OPEC+ production decisions. Geopolitical tensions in key producing regions provide upside. Key support at $80, resistance at $85.",
    volume: "567.8K",
    marketCap: "N/A",
    dayHigh: 83.20,
    dayLow: 81.85,
    weekHigh: 85.30,
    weekLow: 80.00,
    technicalIndicators: {
      rsi: 58.3,
      macd: 1.5,
      bollinger: 81.2
    },
    category: "forex"
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
    },
    category: "forex"
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
    },
    category: "forex"
  },
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
    },
    category: "forex"
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
    },
    category: "forex"
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
    },
    category: "forex"
  },
  {
    symbol: "ETHUSD",
    name: "Ethereum / US Dollar",
    price: 3524.78,
    dayChange: 124.67,
    overallChange: 8.34,
    sentiment: "Bullish",
    confidence: 76,
    aiAnalysis: "Ethereum benefits from network upgrades and DeFi growth along with broader crypto market rally. Recent technical improvements boost confidence. Resistance at $3,600, support at $3,400.",
    volume: "1.2M",
    marketCap: "423.5B",
    dayHigh: 3580.00,
    dayLow: 3450.00,
    weekHigh: 3600.00,
    weekLow: 3400.00,
    technicalIndicators: {
      rsi: 65.4,
      macd: 85.6,
      bollinger: 3450.0
    },
    category: "crypto"
  },
  {
    symbol: "XPTUSD",
    name: "Platinum / US Dollar",
    price: 945.80,
    dayChange: 5.20,
    overallChange: 0.55,
    sentiment: "Bullish",
    confidence: 62,
    aiAnalysis: "Platinum shows strength amid industrial demand recovery from automotive sector. Key resistance at $980, support at $920.",
    volume: "45.2K",
    marketCap: "285.6B",
    dayHigh: 950.20,
    dayLow: 940.50,
    weekHigh: 965.00,
    weekLow: 920.00,
    technicalIndicators: {
      rsi: 56.3,
      macd: 2.1,
      bollinger: 938.5
    },
    category: "metals"
  },
  {
    symbol: "XPDUSD",
    name: "Palladium / US Dollar",
    price: 1234.50,
    dayChange: -8.75,
    overallChange: -0.70,
    sentiment: "Bearish",
    confidence: 58,
    aiAnalysis: "Palladium faces pressure from substitution to platinum in automotive catalysts. Key resistance at $1,280, support at $1,200.",
    volume: "32.8K",
    marketCap: "67.2B",
    dayHigh: 1243.20,
    dayLow: 1230.80,
    weekHigh: 1280.00,
    weekLow: 1200.00,
    technicalIndicators: {
      rsi: 41.2,
      macd: -3.4,
      bollinger: 1238.5
    },
    category: "metals"
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
    },
    category: "stocks"
  },
  {
    symbol: "AAPL",
    name: "Apple Inc.",
    price: 178.45,
    dayChange: 2.34,
    overallChange: 1.33,
    sentiment: "Bullish",
    confidence: 72,
    aiAnalysis: "Apple shows strength with iPhone sales and services growth. Key resistance at $185, support at $170.",
    volume: "45.2M",
    marketCap: "2.8T",
    dayHigh: 180.20,
    dayLow: 176.80,
    weekHigh: 185.00,
    weekLow: 170.00,
    technicalIndicators: {
      rsi: 62.1,
      macd: 2.8,
      bollinger: 175.5
    },
    category: "stocks"
  },
  {
    symbol: "MSFT",
    name: "Microsoft Corporation",
    price: 378.22,
    dayChange: 3.12,
    overallChange: 0.83,
    sentiment: "Bullish",
    confidence: 68,
    aiAnalysis: "Microsoft benefits from AI and cloud growth. Azure expansion drives revenue. Key resistance at $385, support at $370.",
    volume: "32.1M",
    marketCap: "2.8T",
    dayHigh: 380.50,
    dayLow: 375.80,
    weekHigh: 385.00,
    weekLow: 370.00,
    technicalIndicators: {
      rsi: 58.7,
      macd: 3.5,
      bollinger: 376.2
    },
    category: "stocks"
  },
  {
    symbol: "GOOGL",
    name: "Alphabet Inc.",
    price: 142.56,
    dayChange: -1.45,
    overallChange: -1.01,
    sentiment: "Bearish",
    confidence: 65,
    aiAnalysis: "Google faces regulatory pressure but AI investments show promise. Key resistance at $148, support at $138.",
    volume: "28.9M",
    marketCap: "1.8T",
    dayHigh: 144.20,
    dayLow: 141.80,
    weekHigh: 148.00,
    weekLow: 138.00,
    technicalIndicators: {
      rsi: 42.3,
      macd: -1.8,
      bollinger: 143.5
    },
    category: "stocks"
  }
];

export function MacroDesk({ className = "" }: { className?: string }) {
  const router = useRouter();
  const { theme } = useTheme();
  const [assets, setAssets] = useState<Asset[]>(getFallbackAssets());
  const [selectedCategory, setSelectedCategory] = useState<AssetCategory | 'all'>('all');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());
  const [expandingCard, setExpandingCard] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  // resizeTimeout is intentionally not used (avoid extra renders while animating)
  const [resizeTimeout] = useState<NodeJS.Timeout | null>(null);
  const [modalPhase, setModalPhase] = useState<'closed' | 'opening' | 'open' | 'closing'>('closed');

  // Filter assets by selected category
  const filteredAssets = selectedCategory === 'all' 
    ? assets 
    : assets.filter(asset => asset.category === selectedCategory);

  // Get asset counts for each category
  const getCategoryCount = (category: AssetCategory | 'all') => {
    if (category === 'all') return assets.length;
    return assets.filter(asset => asset.category === category).length;
  };



  // Track timeouts so resize/close/open can't desync the expansion UI.
  const expansionTimersRef = useRef<{ clearExpand?: NodeJS.Timeout; closeModal?: NodeJS.Timeout }>({});


  useEffect(() => {
    setMounted(true);
    
    // Handle window resize: do not start/stop animations mid-transition.
    const handleResize = () => {
      // Intentionally no-op (keep handler for future expansion).
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);


  useEffect(() => {
    if (!mounted) return;
    
    // Ensure we have fallback data immediately
    const fallbackAssets = getFallbackAssets();
    setAssets(fallbackAssets);
    console.log('Loaded fallback assets:', fallbackAssets.length);
    
    // Initial data fetch
    const fetchInitialData = async () => {
      try {
        console.log('Attempting to fetch real assets...');
        const realAssets = await fetchRealAssets();
        console.log('Successfully fetched real assets:', realAssets.length);
        setAssets(realAssets);
      } catch (error) {
        console.error('Initial asset data fetch failed:', error);
        // Fallback data is already set
      }
    };

    // Delay initial fetch to allow component to render first
    const timeoutId = setTimeout(fetchInitialData, 1000);
    
    // Set up interval for real-time data updates
    const interval = setInterval(async () => {
      try {
        console.log('Fetching periodic asset data...');
        const realAssets = await fetchRealAssets();
        setAssets(realAssets);
      } catch (error) {
        console.error('Periodic asset data fetch failed:', error);
        // Keep current data if periodic fetch fails
      }
    }, 60000); // Update every 60 seconds for real API data

    return () => {
      clearTimeout(timeoutId);
      clearInterval(interval);
    };
  }, [mounted]);


  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment) {
      case "Bullish": return <TrendingUp className="h-3 w-3" />;
      case "Bearish": return <TrendingDown className="h-3 w-3" />;
      default: return <Minus className="h-3 w-3" />;
    }
  };

  const headerTextClasses =
    "text-white dark:text-white";
  const headerSubTextClasses = "text-purple-300 dark:text-purple-300";


  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case "Bullish": return "text-emerald-400";
      case "Bearish": return "text-rose-400";
      default: return "text-zinc-400";
    }
  };


  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      const realAssets = await fetchRealAssets();
      setAssets(realAssets);
    } catch (error) {
      console.error('Refresh failed:', error);
      // Keep current data if refresh fails
    } finally {
      setIsRefreshing(false);
    }
  };

  const toggleCardExpansion = (cardId: string) => {
    // Prevent re-entrancy during open/close animations.
    if (modalPhase === 'opening' || modalPhase === 'closing') return;

    const isAlreadyExpanded = expandedCards.has(cardId);

    setExpandingCard(cardId);

    if (isAlreadyExpanded) {
      // Close
      setModalPhase('closing');
      setExpandedCards(new Set());

      window.setTimeout(() => {
        setIsModalOpen(false);
        setExpandingCard(null);
        setModalPhase('closed');
      }, 300);
    } else {
      // Open
      setExpandedCards(new Set([cardId]));
      setIsModalOpen(true);
      setModalPhase('opening');

      window.setTimeout(() => {
        setExpandingCard(null);
        setModalPhase('open');
      }, 550);
    }
  };


  const closeExpandedCard = () => {
    if (modalPhase === 'closing' || modalPhase === 'closed') return;
    setModalPhase('closing');
    setExpandedCards(new Set());

    window.setTimeout(() => {
      setIsModalOpen(false);
      setExpandingCard(null);
      setModalPhase('closed');
    }, 300);
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

  // Show loading state while mounting
  if (!mounted) {
    return (
      <div className={className}>
        <div className="animate-pulse">
          <div className="h-8 bg-purple-800 rounded w-1/3 mb-4"></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-48 bg-purple-800 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const expandedCard = Array.from(expandedCards)[0];
  const expandedAsset = expandedCard ? assets.find(a => a.symbol === expandedCard) : null;

  return (
    <div className={className} suppressHydrationWarning>
      {/* Page Header */}
      <div className="mb-12 mt-8">
        <div className="relative flex items-center justify-between">
          {/* Dark-mode aware header glow */}
          <div className="absolute inset-0 -z-10 pointer-events-none">
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[220px] bg-gradient-to-r from-purple-500/10 via-blue-500/10 to-transparent blur-3xl opacity-80" />
          </div>

          <div className="w-full text-center">
            <h2 className={`text-2xl sm:text-3xl font-bold mb-4 mt-4 ${headerTextClasses}`}>Macro Desk</h2>
            <p className={`text-base ${headerSubTextClasses} mt-2`}>
              Real-time macro intelligence feed with AI-powered analysis and sentiment tracking
            </p>


          </div>

          <div className="flex items-center space-x-2">
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

      {/* Category Tabs */}
      <div className="mb-6">
        <div className="flex flex-wrap gap-2 p-1 bg-purple-900/30 rounded-xl backdrop-blur-sm border border-purple-800/50">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 ${
              selectedCategory === 'all'
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
                : 'text-purple-300 hover:text-white hover:bg-purple-800/50'
            }`}
          >
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4" />
              <span>All</span>
              <span className="bg-purple-700/50 px-2 py-0.5 rounded-full text-xs">
                {getCategoryCount('all')}
              </span>
            </div>
          </button>
          
          <button
            onClick={() => setSelectedCategory('forex')}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 ${
              selectedCategory === 'forex'
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
                : 'text-purple-300 hover:text-white hover:bg-purple-800/50'
            }`}
          >
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              <span>Forex</span>
              <span className="bg-purple-700/50 px-2 py-0.5 rounded-full text-xs">
                {getCategoryCount('forex')}
              </span>
            </div>
          </button>
          
          <button
            onClick={() => setSelectedCategory('crypto')}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 ${
              selectedCategory === 'crypto'
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
                : 'text-purple-300 hover:text-white hover:bg-purple-800/50'
            }`}
          >
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              <span>Crypto</span>
              <span className="bg-purple-700/50 px-2 py-0.5 rounded-full text-xs">
                {getCategoryCount('crypto')}
              </span>
            </div>
          </button>
          
          <button
            onClick={() => setSelectedCategory('metals')}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 ${
              selectedCategory === 'metals'
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
                : 'text-purple-300 hover:text-white hover:bg-purple-800/50'
            }`}
          >
            <div className="flex items-center gap-2">
              <Brain className="w-4 h-4" />
              <span>Metals</span>
              <span className="bg-purple-700/50 px-2 py-0.5 rounded-full text-xs">
                {getCategoryCount('metals')}
              </span>
            </div>
          </button>
          
          <button
            onClick={() => setSelectedCategory('stocks')}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 ${
              selectedCategory === 'stocks'
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
                : 'text-purple-300 hover:text-white hover:bg-purple-800/50'
            }`}
          >
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              <span>Stocks</span>
              <span className="bg-purple-700/50 px-2 py-0.5 rounded-full text-xs">
                {getCategoryCount('stocks')}
              </span>
            </div>
          </button>
        </div>
      </div>

      {/* Asset Cards Grid */}
  <div className={`w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-3 gap-4 lg:gap-6 transition-transform duration-300 ease-out ${
        isModalOpen ? 'opacity-80' : 'opacity-100'
      }`}>
        {filteredAssets.map((asset) => {
          const isExpanded = expandedCards.has(asset.symbol);
          const isExpanding = expandingCard === asset.symbol;
          
          // Hide expanded cards from the grid
          if (isExpanded) return null;
          
          return (
            <div 
              key={asset.symbol} 
          className={`group relative backdrop-blur-xl rounded-2xl border p-4 transition-[transform,box-shadow] duration-300 ease-out hover:shadow-xl hover:transform-gpu hover:scale-[1.01] ${
                isExpanding ? 'scale-105 shadow-xl z-40' : 'shadow-lg'
              } ${
                theme === 'dark' 
                  ? 'bg-purple-950/90 border-purple-900/50' 
                  : 'bg-white/90 border-gray-200/50'
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
                      <div className={`text-sm font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>{asset.symbol}</div>
                      <p className={`text-xs ${theme === 'dark' ? 'text-purple-400' : 'text-gray-600'}`}>{asset.name}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <DollarSign className="h-4 w-4 text-purple-400" />
                    <span className={`text-lg font-bold font-mono ${
                      theme === 'dark' ? 'text-white' : 'text-gray-800'
                    }`}>
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
          onClick={(e) => {
            // Clicking the overlay background closes the modal.
            // (We also have an event listener for clicks while the modal is open.)
            const target = e.target as HTMLElement;
            const expandedCardElement = target.closest('[data-expanded-card="true"]');
            if (!expandedCardElement) {
              closeExpandedCard();
            }
          }}
          data-expanded-card="true"
        >
          <div
            className="relative bg-purple-950/95 backdrop-blur-2xl rounded-3xl border border-purple-800/70 shadow-2xl w-full max-w-4xl mx-auto transform transition-[transform,opacity] duration-300 ease-out"
            style={{
              transform: 'translateY(0px) scale(1)',
              transformStyle: 'preserve-3d',
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
