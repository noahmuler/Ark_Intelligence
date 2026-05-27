import { action } from "./_generated/server";
import { v } from "convex/values";
import { fetchEconomicCalendar as fetchAlpha } from "../src/services/alphaVantageEconomicCalendar";
import { fetchFinnhubEconomicCalendar } from "../src/services/finnhubEconomicCalendar";
import { fetchTwelveDataEconomicCalendar } from "../src/services/twelvedataEconomicCalendar";

/**
 * Unified fetch that tries Alpha Vantage → Finnhub → TwelveData.
 * Returns the same shape as the local service (EconomicCalendarResponse).
 */
export const fetchEconomicCalendar = action({
  args: {
    startDate: v.string(), // ISO date string
    endDate: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const start = new Date(args.startDate);
    const end = args.endDate ? new Date(args.endDate) : undefined;
    // Try Alpha Vantage
    try {
      // @ts-ignore – the imported function expects Date objects
      return await fetchAlpha(start, end);
    } catch (e) {
      console.warn("Alpha Vantage failed", e);
    }
    // Try Finnhub
    try {
      // @ts-ignore
      return await fetchFinnhubEconomicCalendar(start, end);
    } catch (e) {
      console.warn("Finnhub failed", e);
    }
    // Try TwelveData
    try {
      // @ts-ignore
      return await fetchTwelveDataEconomicCalendar(start, end!);
    } catch (e) {
      console.error("All providers failed", e);
      throw new Error("Unable to fetch real economic calendar data");
    }
  },
});
