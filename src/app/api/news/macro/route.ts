import { NextRequest, NextResponse } from "next/server";

interface NewsItem {
  id: string;
  timestamp: string;
  title: string;
  category: "Macro" | "Fed" | "Economic" | "Geopolitical" | "Earnings";
  impact: "High" | "Medium" | "Low";
  sentiment: "Bullish" | "Bearish" | "Neutral";
  assets: string[];
  source: string;
}

const mockNewsData: NewsItem[] = [
  {
    id: "1",
    timestamp: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
    title: "Fed Speaker: Powell signals patience on rate cuts",
    category: "Fed",
    impact: "High",
    sentiment: "Bearish",
    assets: ["DXY", "XAUUSD", "XAGUSD"],
    source: "Reuters"
  },
  {
    id: "2",
    timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    title: "US Initial Jobless Claims: 215K vs 210K expected",
    category: "Economic",
    impact: "Medium",
    sentiment: "Bullish",
    assets: ["DXY"],
    source: "Bloomberg"
  },
  {
    id: "3",
    timestamp: new Date(Date.now() - 8 * 60 * 1000).toISOString(),
    title: "China Gold imports down 15% YoY in April",
    category: "Macro",
    impact: "High",
    sentiment: "Bearish",
    assets: ["XAUUSD", "XAGUSD"],
    source: "Financial Times"
  }
];

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category");
  const limit = parseInt(searchParams.get("limit") || "10");

  try {
    // In production, this would:
    // 1. Fetch from RSS feeds
    // 2. Process through AI for sentiment analysis
    // 3. Filter by relevance to tracked assets
    // 4. Score by impact level

    let filteredNews = mockNewsData;

    if (category && category !== "All") {
      filteredNews = mockNewsData.filter(item => item.category === category);
    }

    // Sort by timestamp (most recent first) and limit
    const sortedNews = filteredNews
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);

    return NextResponse.json({ 
      success: true, 
      data: sortedNews,
      total: filteredNews.length 
    });
  } catch (error) {
    console.error("Error fetching news:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch news" },
      { status: 500 }
    );
  }
}
