"use node";

import { action } from "./_generated/server";
import { v } from "convex/values";
import YahooFinance from "yahoo-finance2";

interface QuoteResult {
  regularMarketPrice?: number;
  regularMarketChangePercent?: number;
  regularMarketDayHigh?: number;
  regularMarketDayLow?: number;
  regularMarketVolume?: number;
  marketCap?: number;
}

interface HistoricalResult {
  date: Date;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  adjClose: number;
}

interface CalendarEvent {
  description?: string;
  title?: string;
  country?: string;
  date?: string;
  importance?: string;
  actual?: string;
  forecast?: string;
  previous?: string;
}

/**
 * Fetch live prices for multiple symbols from Yahoo Finance
 */
export const fetchLivePrice = action({
  args: {
    symbols: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const results: Array<{
      symbol: string;
      price: number;
      changePercent: number;
      type: "stock" | "crypto";
      high?: number;
      low?: number;
      volume?: number;
      marketCap?: number;
    }> = [];

    const yahoo = new YahooFinance({ suppressNotices: ['yahooSurvey'] });

    for (const symbol of args.symbols) {
      try {
        const quote = await yahoo.quote(symbol) as QuoteResult;
        
        // Check if quote is valid
        if (!quote) {
          console.warn(`No quote data returned for ${symbol}`);
          continue;
        }
        
        // Determine asset type based on symbol
        const type: "stock" | "crypto" = symbol.includes("-USD") || symbol.includes("-") ? "crypto" : "stock";
        
        results.push({
          symbol,
          price: quote.regularMarketPrice || 0,
          changePercent: (quote.regularMarketChangePercent || 0),
          type,
          high: quote.regularMarketDayHigh,
          low: quote.regularMarketDayLow,
          volume: quote.regularMarketVolume,
          marketCap: quote.marketCap,
        });
      } catch (error) {
        console.error(`Failed to fetch quote for ${symbol}:`, error);
        // Continue with other symbols even if one fails
      }
    }

    return results;
  },
});

/**
 * Fetch historical data for a symbol from Yahoo Finance
 */
export const fetchHistoricalData = action({
  args: {
    symbol: v.string(),
    period1: v.string(), // Start date in YYYY-MM-DD format
    period2: v.string(), // End date in YYYY-MM-DD format
    interval: v.optional(v.union(
      v.literal("1d"),
      v.literal("1wk"),
      v.literal("1mo")
    )),
  },
  handler: async (ctx, args) => {
    try {
      const yahoo = new YahooFinance();
      const result = await yahoo.historical(args.symbol, {
        period1: args.period1,
        period2: args.period2,
        interval: args.interval || "1d",
      }) as HistoricalResult[];

      return result.map((item) => ({
        date: item.date,
        open: item.open,
        high: item.high,
        low: item.low,
        close: item.close,
        volume: item.volume,
        adjClose: item.adjClose,
      }));
    } catch (error) {
      console.error(`Failed to fetch historical data for ${args.symbol}:`, error);
      throw new Error(`Failed to fetch historical data for ${args.symbol}`);
    }
  },
});

/**
 * Fetch economic calendar events from Yahoo Finance
 * Uses quoteSummary with calendarEvents module
 */
export const fetchEconomicCalendar = action({
  args: {},
  handler: async (ctx) => {
    try {
      // Yahoo Finance doesn't have a dedicated economic calendar API
      // We'll use SPY as a proxy to get calendar events
      const yahoo = new YahooFinance({ suppressNotices: ['yahooSurvey'] });
      const result = await yahoo.quoteSummary("SPY", {
        modules: ["calendarEvents"],
      }) as any;

      const events: CalendarEvent[] = result.calendarEvents?.events || [];
      
      return events.map((event) => ({
        event: event.description || event.title || "Unknown Event",
        country: event.country || "US",
        date: event.date || new Date().toISOString().split("T")[0],
        importance: event.importance || "medium",
        actual: event.actual || null,
        forecast: event.forecast || null,
        previous: event.previous || null,
      }));
    } catch (error) {
      console.error("Failed to fetch economic calendar:", error);
      // Return empty array on failure
      return [];
    }
  },
});
