import { query } from "./_generated/server";

// The repo's CurrencyStrengthCard expects api.currencyStrength.getHistory.
// There is no schema table for currencyStrength in gemini_prompt's Convex spec,
// so return null (frontend will fall back to seeded demo history).
export const getHistory = query(async ({ db }) => {
  return null;
});

