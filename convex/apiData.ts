"use node";

import { action } from "./_generated/server";
import { v } from "convex/values";

/**
 * Fetch prices from Yahoo Finance and store in database
 * NOTE: This action is currently disabled due to database access limitations in actions.
 * Use the marketData.ts actions instead for Yahoo Finance integration.
 */
export const fetchAndStorePrices = action({
  args: {},
  handler: async (ctx) => {
    // This action is disabled - use marketData.fetchLivePrice instead
    return { success: false, count: 0, results: [] };
  },
});
