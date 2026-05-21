Master Backend Specification: Convex End-to-End Real-Time Data PipelineObjective: Implement a production-grade, end-to-end serverless backend using Convex (https://www.convex.dev/) to handle live data architecture for Ark Intelligence. Replace all frontend mock data arrays across the Dashboard, Macro Desk, and Report pages with reactive Convex database streams while safeguarding our signature dark-purple glassmorphic layout.References:Target Git Repository: https://github.com/noahmuler/Ark_IntelligenceTarget Layout Aesthetic: https://hybridtrader.ai/1. Convex Database Architecture (convex/schema.ts)Define a clean, optimized schema to store our real-time states. Establish three primary collections:TypeScriptimport { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  prices: defineTable({
    symbol: v.string(),     // XAU, BTC, OIL, DXY, NQ, ES
    price: v.number(),
    change24h: v.number(),
    high: v.number(),
    low: v.number(),
    history: v.array(v.number()), // For mini sparkline charts
    updatedAt: v.number(),
  }).index("by_symbol", ["symbol"]),

  economic_reports: defineTable({
    title: v.string(),      // e.g., "Core CPI MoM"
    country: v.string(),    // e.g., "USD"
    actual: v.union(v.string(), v.null()),
    forecast: v.union(v.string(), v.null()),
    previous: v.union(v.string(), v.null()),
    impact: v.string(),      // "high", "medium", "low"
    biases: v.object({       // Directional bias for the 6 target assets
      XAU: v.string(),       // "Bullish" | "Bearish" | "Neutral"
      BTC: v.string(),
      OIL: v.string(),
      DXY: v.string(),
      NQ: v.string(),
      ES: v.string(),
    }),
    timestamp: v.number(),
  }).index("by_timestamp", ["timestamp"]),

  asset_briefs: defineTable({
    symbol: v.string(),
    brief: v.string(),       // STRICT 3-sentence summary analysis
    updatedAt: v.number(),
  }).index("by_symbol", ["symbol"]),
});
2. Background Ingestion System (convex/actions.ts & convex/crons.ts)Background Fetches: Create Convex actions that trigger safe Node.js fetch requests to Twelve Data (for live quotes/historical asset vectors) and Finnhub (for macro reports/economic calendars).Data Sanitization & Bias Generation: When a macro report is pulled, write an internal evaluation function that maps the report outcome to asset directional biases (e.g., if US CPI comes in hotter than forecast $\rightarrow$ DXY Bullish, NQ/ES Bearish, Gold/XAU Bearish). Store these calculated states cleanly in the economic_reports table.Cron Configuration: Wire up convex/crons.ts to execute asset price actions every 2 minutes and economic report actions every 30 minutes. This avoids running out of your free API tiers while keeping dashboard charts fresh.3. Frontend Reactive Data Binding & CleanupReplace every instance of local static arrays or mock states across your pages with native Convex reactive hooks (useQuery).Dashboard Page (page.tsx): * Bind the Infinite Asset Tape Billboard and the Macro Desk Grid (fixed at exactly 6 assets: XAU, BTC, OIL, DXY, NQ, ES) directly to live data from the prices collection.Populate the Pre-Session Briefing Card dynamically using the latest analytical text data stored in the asset_briefs table. Enforce the strict 3-sentence limitation within the query return.Reports Page (page.tsx):Confirm that all leftover trade metrics (Win Rate, PnL, Trade Journal entries) are entirely scrubbed from the file.Feed the primary chronological feed using economic_reports data. The Bias Matrix for the 6 major assets must map its glowing green/red tag highlights entirely to the live biases state stored in the backend table.4. Code Quality GuardrailsNo Layout Shifts: Keep your layout containers statically dimensioned. Use a matching purple glassmorphic skeleton loader while Convex establishes its initial WebSocket sync (data === undefined).Zero Redundant Blocks: Prune all old test variables, dummy text nodes, and duplicated mapping arrays out of the component code files entirely.Windsurf Verification Pass:Confirm npx convex dev spins up flawlessly with zero schema typescript compiler warnings.Verify that mock asset state blocks across your dashboard are replaced with reactive data streams from the Convex schema.Check that changing a data value directly in the Convex dashboard backend dashboard instantly updates the application interface without a page refresh.Go.