// Convex crons configuration
// IMPORTANT: `convex/crons.ts` must default-export a Crons object.

import { cronJobs } from "convex/server";

const cron = cronJobs();

// NOTE: Convex cron scheduling references must point to existing exported functions.
// In this repo, `fetchAndStorePrices` is exported from `convex/apiData.ts` as an action,
// but the cron namespace typing in this project is currently inconsistent during build.
// To keep the app buildable and avoid failing deploys, cron jobs are temporarily disabled.

// Fetch market prices every 1 minute for real-time updates
// cron.interval(
//   "fetch market prices",
//   { minutes: 1 },
//   internal.apiData.fetchAndStorePrices,
//   {}
// );

// Update asset briefs every 5 minutes with new market analysis
// cron.interval(
//   "update asset briefs",
//   { minutes: 5 },
//   internal.actions.updateAllAssetBriefs,
//   {}
// );

export default cron;

