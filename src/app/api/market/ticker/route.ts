import { NextRequest, NextResponse } from "next/server";

import { fetchMultipleStockQuotes, fetchStockQuote } from '@/services/polygonStockData';

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
    // Fetch real quotes (Polygon) for the requested symbols.
    // If Polygon env key is missing/invalid, polygonStockData will throw (or fallback).
    const quotes = await fetchMultipleStockQuotes(symbols);

    const data = symbols.reduce<Record<string, any>>((acc, symbol) => {
      const quote = quotes.find((q) => q.symbol === symbol);
      if (!quote) {
        // Explicitly include a not-found marker so clients get an entry per symbol
        acc[symbol] = { error: 'not_found', value: null };
        return acc;
      }

      // Normalize timestamp safely (quote.timestamp may be string/number/Date)
      const ts = new Date(quote.timestamp as any);
      const timestampIso = isNaN(ts.getTime()) ? null : ts.toISOString();

      acc[symbol] = {
        price: quote.price,
        change: quote.change,
        changePercent: quote.changePercent,
        volume: quote.volume,
        dayHigh: quote.dayHigh,
        dayLow: quote.dayLow,
        timestamp: timestampIso,
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

