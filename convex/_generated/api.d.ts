/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as actions from "../actions.js";
import type * as apiData from "../apiData.js";
import type * as apiDataMutations from "../apiDataMutations.js";
import type * as asset_briefs from "../asset_briefs.js";
import type * as crons from "../crons.js";
import type * as currencyStrength from "../currencyStrength.js";
import type * as economicCalendar from "../economicCalendar.js";
import type * as marketData from "../marketData.js";
import type * as marketDataQueries from "../marketDataQueries.js";
import type * as mt5 from "../mt5.js";
import type * as mt5Actions from "../mt5Actions.js";
import type * as mt5Queries from "../mt5Queries.js";
import type * as prices from "../prices.js";
import type * as seed from "../seed.js";
import type * as today from "../today.js";
import type * as week from "../week.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  actions: typeof actions;
  apiData: typeof apiData;
  apiDataMutations: typeof apiDataMutations;
  asset_briefs: typeof asset_briefs;
  crons: typeof crons;
  currencyStrength: typeof currencyStrength;
  economicCalendar: typeof economicCalendar;
  marketData: typeof marketData;
  marketDataQueries: typeof marketDataQueries;
  mt5: typeof mt5;
  mt5Actions: typeof mt5Actions;
  mt5Queries: typeof mt5Queries;
  prices: typeof prices;
  seed: typeof seed;
  today: typeof today;
  week: typeof week;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
