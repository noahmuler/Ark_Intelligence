// Convex crons configuration
// IMPORTANT: `convex/crons.ts` must default-export a Crons object.

import { cronJobs } from "convex/server";

const cron = cronJobs();

// Temporarily export an empty cron configuration so Convex can build.
// We'll re-add cron interval registrations once we align with this repo's cron scheduling API expectations.
export default cron;


