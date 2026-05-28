import { NextRequest, NextResponse } from "next/server";
import { fetchAction } from "convex/nextjs";
import { api } from "@/convex/_generated/api";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const symbols = searchParams.get('symbols')?.split(',').map(s => s.trim()).filter(Boolean) || [];

  if (symbols.length === 0) {
    return NextResponse.json(
      { success: false, error: "Missing 'symbols' query param" },
      { status: 400 }
    );
  }

  try {
    // Fetch live prices using Convex action (Yahoo Finance)
    const prices = await fetchAction(api.marketData.fetchLivePrice, { symbols });

    const data = symbols.reduce<Record<string, any>>((acc, symbol) => {
      const priceData = prices.find((p: any) => p.symbol === symbol);
      if (!priceData) {
        acc[symbol] = { error: 'not_found', value: null };
        return acc;
      }

      acc[symbol] = {
        price: priceData.price,
        change: priceData.price * (priceData.changePercent / 100),
        changePercent: priceData.changePercent,
        volume: priceData.volume,
        dayHigh: priceData.high,
        dayLow: priceData.low,
        marketCap: priceData.marketCap,
        timestamp: new Date().toISOString(),
      };

      return acc;
    }, {});

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Error fetching ticker data:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch ticker data' },
      { status: 500 }
    );
  }
}

