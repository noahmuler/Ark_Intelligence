// Market Data Types
export interface TickerData {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  timestamp: string;
}

export interface MarketData {
  [symbol: string]: TickerData;
}

// News and Sentiment Types
export interface NewsItem {
  id: string;
  timestamp: string;
  title: string;
  category: "Macro" | "Fed" | "Economic" | "Geopolitical" | "Earnings";
  impact: "High" | "Medium" | "Low";
  sentiment: "Bullish" | "Bearish" | "Neutral";
  assets: string[];
  source: string;
  url?: string;
}

// AI Session Brief Types
export interface SessionBrief {
  mainDriver: string;
  bias: "Bullish" | "Bearish" | "Neutral";
  analysis: string;
  keyLevels: {
    support: string[];
    resistance: string[];
  };
  tacticalBias: "Long" | "Short" | "Neutral";
  confidence: number;
  timestamp: string;
}

// Edge Factor Types
export interface EdgeFactorData {
  overallScore: number;
  macroScore: number;
  technicalScore: number;
  sentimentScore: number;
  lastUpdated: string;
}

// Market Regime Types
export type MarketRegime = "Trending" | "Ranging" | "High Volatility" | "Risk-Off";

export interface RegimeData {
  [timeframe: string]: MarketRegime;
}

// Technical Analysis Types
export interface TechnicalIndicator {
  name: string;
  value: number;
  signal: "Bullish" | "Bearish" | "Neutral";
  strength: number;
}

export interface ChartData {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}

// Economic Calendar Types
export interface EconomicEvent {
  id: string;
  timestamp: string;
  title: string;
  currency: string;
  impact: "High" | "Medium" | "Low";
  forecast?: string;
  previous?: string;
  actual?: string;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Component Props Types
export interface BaseComponentProps {
  className?: string;
  children?: React.ReactNode;
}

// WebSocket Types
export interface WebSocketMessage {
  type: string;
  payload: any;
  timestamp: string;
}

// Configuration Types
export interface AppConfig {
  apiEndpoints: {
    market: string;
    news: string;
    ai: string;
  };
  refreshIntervals: {
    ticker: number;
    news: number;
    aiBrief: number;
  };
  trackedAssets: string[];
}
