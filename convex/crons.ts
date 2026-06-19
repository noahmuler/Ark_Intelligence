// Convex crons configuration
// IMPORTANT: `convex/crons.ts` must default-export a Crons object.

import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";
import { api } from "./_generated/api";

const cron = cronJobs();

// Fetch market prices every 1 minute for real-time updates
cron.interval(
  "fetch market prices",
  { minutes: 1 },
  internal.apiData.fetchAndStorePrices,
  {}
);

// Update asset briefs every 5 minutes with new market analysis
cron.interval(
  "update asset briefs",
  { minutes: 5 },
  api.actions.updateAllAssetBriefs,
  {}
);

export default cron;

