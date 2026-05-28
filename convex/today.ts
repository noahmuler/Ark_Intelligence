import { action } from "./_generated/server";
import { v } from "convex/values";
import { fetchAlphaVantageEconomicCalendar } from "../src/services/alphaVantageEconomicCalendar";

/**
 * Fetch today's economic calendar events
 */
export const fetchToday = action({
  args: {},
  handler: async (ctx) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
    
    try {
      return await fetchAlphaVantageEconomicCalendar(today, tomorrow);
    } catch (error) {
      console.error("Failed to fetch today's economic calendar:", error);
      throw new Error("Failed to fetch today's economic calendar");
    }
  },
});
