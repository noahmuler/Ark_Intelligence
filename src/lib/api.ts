import { 
  TickerData, 
  NewsItem, 
  SessionBrief, 
  EdgeFactorData, 
  ApiResponse 
} from "@/types";

const API_BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

// Market Data API
export async function fetchTickerData(symbols: string[]): Promise<ApiResponse<Record<string, TickerData>>> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/market/ticker?symbols=${symbols.join(",")}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        cache: "no-store", // Real-time data should not be cached
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching ticker data:", error);
    return { success: false, error: "Failed to fetch ticker data" };
  }
}

// News API
export async function fetchMacroNews(
  category?: string, 
  limit: number = 10
): Promise<ApiResponse<NewsItem[]>> {
  try {
    const params = new URLSearchParams({
      limit: limit.toString(),
    });

    if (category && category !== "All") {
      params.append("category", category);
    }

    const response = await fetch(
      `${API_BASE_URL}/api/news/macro?${params.toString()}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        cache: "no-store",
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching macro news:", error);
    return { success: false, error: "Failed to fetch news" };
  }
}

// AI Session Brief API
export async function generateSessionBrief(
  sessionTime: "london" | "newyork" = "newyork",
  assets: string[] = ["XAUUSD", "XAGUSD", "DXY", "US10Y"]
): Promise<ApiResponse<SessionBrief>> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/ai/session-brief`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        sessionTime,
        assets,
      }),
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error generating session brief:", error);
    return { success: false, error: "Failed to generate session brief" };
  }
}

// Edge Factor Calculation
export function calculateEdgeFactor(
  macroScore: number,
  technicalScore: number,
  sentimentScore: number
): EdgeFactorData {
  const weights = { macro: 0.33, technical: 0.33, sentiment: 0.34 };
  
  const overallScore = Math.round(
    macroScore * weights.macro + 
    technicalScore * weights.technical + 
    sentimentScore * weights.sentiment
  );

  return {
    overallScore,
    macroScore,
    technicalScore,
    sentimentScore,
    lastUpdated: new Date().toISOString(),
  };
}

// WebSocket connection for real-time data
export function createWebSocketConnection(onMessage: (data: any) => void): WebSocket {
  const wsUrl = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:3001";
  const ws = new WebSocket(wsUrl);

  ws.onopen = () => {
    console.log("WebSocket connected");
  };

  ws.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      onMessage(data);
    } catch (error) {
      console.error("Error parsing WebSocket message:", error);
    }
  };

  ws.onclose = () => {
    console.log("WebSocket disconnected");
  };

  ws.onerror = (error) => {
    console.error("WebSocket error:", error);
  };

  return ws;
}

// Utility function to format currency
export function formatCurrency(value: number, symbol: string = "$"): string {
  return `${symbol}${value.toFixed(2)}`;
}

// Utility function to format percentage
export function formatPercentage(value: number): string {
  const sign = value >= 0 ? "+" : "";
  return `${sign}${value.toFixed(2)}%`;
}

// Utility function to get color based on change
export function getChangeColor(change: number): string {
  if (change > 0) return "text-emerald-400";
  if (change < 0) return "text-rose-400";
  return "text-zinc-400";
}

// Utility function to get sentiment color
export function getSentimentColor(sentiment: string): string {
  switch (sentiment) {
    case "Bullish": return "text-emerald-400";
    case "Bearish": return "text-rose-400";
    default: return "text-zinc-400";
  }
}

// Utility function to get impact color
export function getImpactColor(impact: string): string {
  switch (impact) {
    case "High": return "bg-rose-500/20 text-rose-400";
    case "Medium": return "bg-amber-500/20 text-amber-400";
    case "Low": return "bg-emerald-500/20 text-emerald-400";
    default: return "bg-zinc-500/20 text-zinc-400";
  }
}
