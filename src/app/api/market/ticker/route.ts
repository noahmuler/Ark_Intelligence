import { NextRequest, NextResponse } from "next/server";

// Mock data for development - replace with real API calls
const mockTickerData = {
  DXY: { price: 105.42, change: 0.15, changePercent: 0.14 },
  XAUUSD: { price: 2345.67, change: -8.23, changePercent: -0.35 },
  XAGUSD: { price: 28.45, change: 0.12, changePercent: 0.42 },
  US10Y: { price: 4.32, change: -0.05, changePercent: -1.14 },
};

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const symbols = searchParams.get("symbols")?.split(",") || [];

  try {
    // In production, replace with actual API calls to Finnhub/Polygon
    const data = symbols.reduce((acc, symbol) => {
      if (mockTickerData[symbol as keyof typeof mockTickerData]) {
        acc[symbol] = {
          ...mockTickerData[symbol as keyof typeof mockTickerData],
          timestamp: new Date().toISOString(),
        };
      }
      return acc;
    }, {} as Record<string, any>);

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Error fetching ticker data:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch ticker data" },
      { status: 500 }
    );
  }
}
