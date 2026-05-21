import { query } from "./_generated/server";

// Public query expected by the frontend: api.prices.getAll
export const getAll = query(({ db }) => {
  return db
    .query("prices")
    .withIndex("by_symbol", (q) => q)
    .order("asc")
    .collect();

});

