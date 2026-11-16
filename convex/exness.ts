import { internalMutation, internalQuery, mutation, query } from "./_generated/server";
import { v } from "convex/values";

const userId = "user-1";

const openDealValidator = v.object({
  dealId: v.string(),
  positionId: v.string(),
  symbol: v.string(),
  type: v.union(v.literal("BUY"), v.literal("SELL")),
  lots: v.number(),
  openPrice: v.number(),
  openTime: v.number(),
  stopLoss: v.optional(v.number()),
  takeProfit: v.optional(v.number()),
});

const tradeValidator = v.object({
  ticket: v.string(),
  positionId: v.optional(v.string()),
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
  isDeposit: v.optional(v.boolean()),
  stopLoss: v.optional(v.number()),
  takeProfit: v.optional(v.number()),
  closeReason: v.optional(v.string()),
});

export const getConnection = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const connection = await ctx.db
      .query("exness_connections")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .unique();

    if (!connection) return null;
    const activeConnection = await ctx.db
      .query("mt5_connections")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .unique();
    return {
      accountId: connection.accountId,
      ...(connection.accountCurrency
        ? { accountCurrency: connection.accountCurrency }
        : {}),
      lastSynced: connection.lastSynced,
      isConfigured: connection.isConnected,
      isConnected:
        connection.isConnected && activeConnection?.method === "exness-api",
    };
  },
});

export const getStoredConnection = internalQuery({
  args: {},
  handler: async (ctx) => {
    const connection = await ctx.db
      .query("exness_connections")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .unique();
    const activeConnection = await ctx.db
      .query("mt5_connections")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .unique();

    return connection?.isConnected && activeConnection?.method === "exness-api"
      ? connection
      : null;
  },
});

export const storeDeals = internalMutation({
  args: {
    openDeals: v.array(openDealValidator),
    trades: v.array(tradeValidator),
  },
  handler: async (ctx, args) => {
    for (const deal of args.openDeals) {
      const processedDeal = await ctx.db
        .query("exness_processed_deals")
        .withIndex("by_userId_dealId", (q) =>
          q.eq("userId", userId).eq("dealId", deal.dealId),
        )
        .unique();
      if (processedDeal) continue;

      await ctx.db.insert("exness_processed_deals", {
        userId,
        dealId: deal.dealId,
      });

      const existing = await ctx.db
        .query("exness_open_positions")
        .withIndex("by_userId_positionId", (q) =>
          q.eq("userId", userId).eq("positionId", deal.positionId),
        )
        .unique();

      if (existing) {
        await ctx.db.patch(existing._id, {
          ...deal,
          lots: existing.lots + deal.lots,
        });
      } else {
        await ctx.db.insert("exness_open_positions", { userId, ...deal });
      }
    }

    let insertedTrades = 0;
    for (const trade of args.trades) {
      const existingTrade = await ctx.db
        .query("mt5_trades")
        .withIndex("by_userId_ticket", (q) =>
          q.eq("userId", userId).eq("ticket", trade.ticket),
        )
        .unique();
      if (existingTrade) continue;

      const position = trade.positionId
        ? await ctx.db
            .query("exness_open_positions")
            .withIndex("by_userId_positionId", (q) =>
              q.eq("userId", userId).eq("positionId", trade.positionId!),
            )
            .unique()
        : null;

      const tradeFields = { ...trade };
      delete tradeFields.positionId;
      await ctx.db.insert("mt5_trades", {
        userId,
        ...tradeFields,
        openPrice: position?.openPrice ?? trade.openPrice,
        openTime: position?.openTime ?? trade.openTime,
        stopLoss: position?.stopLoss ?? trade.stopLoss,
        takeProfit: position?.takeProfit ?? trade.takeProfit,
        type: position?.type ?? trade.type,
      });
      insertedTrades++;

      if (trade.positionId && position) {
        const remainingLots = Math.max(0, position.lots - trade.lots);
        if (remainingLots === 0) {
          await ctx.db.delete(position._id);
        } else {
          await ctx.db.patch(position._id, { lots: remainingLots });
        }
      }
    }
    return { insertedTrades };
  },
});

export const saveConnection = internalMutation({
  args: {
    accountId: v.string(),
    encryptedCredentials: v.string(),
    iv: v.string(),
    authTag: v.string(),
    accessPoint: v.string(),
    accountCurrency: v.optional(v.string()),
    lastSynced: v.number(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("exness_connections")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .unique();
    const connection = {
      ...args,
      userId,
      isConnected: true,
    };

    if (existing) {
      await ctx.db.patch(existing._id, connection);
    } else {
      await ctx.db.insert("exness_connections", connection);
    }

    const mt5Connection = await ctx.db
      .query("mt5_connections")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .unique();
    const mt5Status = {
      serverName: "Exness API",
      accountLogin: args.accountId,
      isConnected: true,
      lastSynced: args.lastSynced,
      method: "exness-api" as const,
    };

    if (mt5Connection) {
      await ctx.db.patch(mt5Connection._id, mt5Status);
    } else {
      await ctx.db.insert("mt5_connections", { userId, ...mt5Status });
    }
  },
});

export const updateLastSynced = internalMutation({
  args: { lastSynced: v.number() },
  handler: async (ctx, args) => {
    const exnessConnection = await ctx.db
      .query("exness_connections")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .unique();
    if (exnessConnection) {
      await ctx.db.patch(exnessConnection._id, args);
    }

    const mt5Connection = await ctx.db
      .query("mt5_connections")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .unique();
    if (mt5Connection?.method === "exness-api") {
      await ctx.db.patch(mt5Connection._id, args);
    }
  },
});

export const disconnectExness = mutation({
  args: {},
  handler: async (ctx) => {
    const exnessConnection = await ctx.db
      .query("exness_connections")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .unique();
    if (exnessConnection) {
      await ctx.db.patch(exnessConnection._id, {
        encryptedCredentials: "",
        iv: "",
        authTag: "",
        isConnected: false,
      });
    }

    const mt5Connection = await ctx.db
      .query("mt5_connections")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .unique();
    if (mt5Connection?.method === "exness-api") {
      await ctx.db.patch(mt5Connection._id, { isConnected: false });
    }
    return { success: true };
  },
});
