import { v } from "convex/values";

export const terminalTradeValidator = v.object({
  ticket: v.number(),
  symbol: v.string(),
  type: v.union(
    v.literal("BUY"),
    v.literal("SELL"),
    v.literal("DEPOSIT"),
    v.literal("WITHDRAWAL"),
  ),
  lots: v.number(),
  openPrice: v.number(),
  closePrice: v.number(),
  openTime: v.number(),
  closeTime: v.number(),
  profit: v.number(),
  commission: v.number(),
  swap: v.number(),
  isDeposit: v.boolean(),
  stopLoss: v.number(),
  takeProfit: v.number(),
  closeReason: v.string(),
});
