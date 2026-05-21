import { query } from "./_generated/server";

// Public query expected by the frontend: api.asset_briefs.getAll
export const getAll = query(({ db }) => {
  return db
    .query("asset_briefs")
    .withIndex("by_symbol", (q) => q)
    .order("asc")
    .collect();

});

