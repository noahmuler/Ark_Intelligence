import { action } from "./_generated/server";
import { v } from "convex/values";
import { fetchAlphaVantageEconomicCalendar } from "../src/services/alphaVantageEconomicCalendar";

/**
 * Fetch this week's economic calendar events
 */
export const fetchWeek = action({
  args: {},
  handler: async (ctx) => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const startOfWeek = new Date(today.getTime() - dayOfWeek * 24 * 60 * 60 * 1000);
    startOfWeek.setHours(0, 0, 0, 0);
    const endOfWeek = new Date(startOfWeek.getTime() + 7 * 24 * 60 * 60 * 1000);
    
    try {
      return await fetchAlphaVantageEconomicCalendar(startOfWeek, endOfWeek);
    } catch (error) {
      console.error("Failed to fetch week's economic calendar:", error);
      throw new Error("Failed to fetch week's economic calendar");
    }
  },
});
