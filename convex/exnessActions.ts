"use node";

import {
  createHash,
  createPrivateKey,
  createPublicKey,
  sign,
} from "node:crypto";
import { action } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";
import {
  decryptCredentials,
  type EncryptedCredentials,
  type ExnessCredentials,
} from "./exnessCrypto";

const DAY_MS = 24 * 60 * 60 * 1000;
const MAX_INITIAL_HISTORY_DAYS = 90;
const MAX_RANGE_REQUESTS = 100;
const MAX_PAGES_PER_RANGE = 50;
const PAGE_SIZE = 200;
const BATCH_SIZE = 100;

type OpenDeal = {
  dealId: string;
  positionId: string;
  symbol: string;
  type: "BUY" | "SELL";
  lots: number;
  openPrice: number;
  openTime: number;
  stopLoss?: number;
  takeProfit?: number;
};

type ImportedTrade = {
  ticket: string;
  positionId?: string;
  symbol: string;
  type: "BUY" | "SELL" | "DEPOSIT" | "WITHDRAWAL";
  lots: number;
  openPrice: number;
  closePrice: number;
  openTime: number;
  closeTime: number;
  profit: number;
  commission: number;
  swap: number;
  isDeposit?: boolean;
  stopLoss?: number;
  takeProfit?: number;
  closeReason?: string;
};

type DealResult = {
  openDeals: OpenDeal[];
  trades: ImportedTrade[];
};

type ExnessRecord = Record<string, unknown>;

function isRecord(value: unknown): value is ExnessRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function text(value: unknown): string | undefined {
  return typeof value === "string" || typeof value === "number"
    ? String(value)
    : undefined;
}

function finiteNumber(value: unknown): number | undefined {
  if (typeof value !== "string" && typeof value !== "number") return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function requiredNumber(value: unknown, field: string): number {
  const parsed = finiteNumber(value);
  if (parsed === undefined) throw new Error(`Exness deal is missing a valid ${field}`);
  return parsed;
}

function timestamp(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value < 100_000_000_000 ? value * 1000 : value;
  }
  if (typeof value === "string") {
    const asNumber = Number(value);
    if (Number.isFinite(asNumber)) {
      return asNumber < 100_000_000_000 ? asNumber * 1000 : asNumber;
    }
    const parsed = Date.parse(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
}

function requiredTimestamp(value: unknown): number {
  const parsed = timestamp(value);
  if (parsed === undefined) throw new Error("Exness deal is missing a valid event_time");
  return parsed;
}

function firstValue(record: ExnessRecord, fields: string[]): unknown {
  for (const field of fields) {
    if (record[field] !== undefined && record[field] !== null) return record[field];
  }
  return undefined;
}

function baseUrl(value: string): string {
  const url = new URL(value);
  const hostname = url.hostname.toLowerCase();
  if (
    url.protocol !== "https:" ||
    url.username ||
    url.password ||
    url.pathname !== "/" ||
    url.search ||
    url.hash ||
    !(hostname === "exness.com" ||
      hostname.endsWith(".exness.com") ||
      hostname === "exness-api.com" ||
      hostname.endsWith(".exness-api.com"))
  ) {
    throw new Error("Exness API hosts must be HTTPS Exness domains copied from Key Management");
  }
  return url.origin;
}

function loadSigningKey(textValue: string) {
  const input = textValue.trim();
  let key;

  if (input.startsWith("-----BEGIN PRIVATE KEY-----")) {
    key = createPrivateKey(input);
  } else {
    if (!/^[0-9a-fA-F]{128}$/.test(input)) {
      throw new Error("The Exness private key must be 128 hex characters or unencrypted PKCS#8 PEM");
    }
    const raw = Buffer.from(input, "hex");
    key = createPrivateKey({
      key: Buffer.concat([
        Buffer.from("302e020100300506032b657004220420", "hex"),
        raw.subarray(0, 32),
      ]),
      format: "der",
      type: "pkcs8",
    });

    const publicKey = createPublicKey(key).export({ format: "jwk" });
    if (!Buffer.from(publicKey.x ?? "", "base64url").equals(raw.subarray(32))) {
      throw new Error("The Exness private key public half does not match its seed");
    }
  }

  if (key.asymmetricKeyType !== "ed25519") {
    throw new Error("The Exness private key must use Ed25519");
  }
  return key;
}

function signGetRequest(
  apiKey: string,
  privateKey: ReturnType<typeof loadSigningKey>,
  path: string,
): HeadersInit {
  const timestamp = Date.now();
  const bodyHash = createHash("sha256").update("").digest("base64url");
  const payload = Buffer.from(
    JSON.stringify({
      api_key: apiKey,
      idempotency_key: "",
      timestamp,
      sign_version: 1,
      method: "GET",
      path,
      body_hash: bodyHash,
    }),
    "utf8",
  );

  return {
    "EXN-API-KEY": apiKey,
    "EXN-IDEMPOTENCY-KEY": "",
    "EXN-TIMESTAMP": String(timestamp),
    "EXN-SIGN-VERSION": "1",
    "EXN-DATA": payload.toString("base64url"),
    "EXN-SIGN": sign(null, payload, privateKey).toString("base64url"),
    "User-Agent": "ArkIntelligence/0.1.0",
    Accept: "application/json",
  };
}

async function getJson<T>(
  host: string,
  path: string,
  apiKey: string,
  privateKey: ReturnType<typeof loadSigningKey>,
): Promise<T> {
  const response = await fetch(`${host}${path}`, {
    method: "GET",
    headers: signGetRequest(apiKey, privateKey, path),
    cache: "no-store",
    redirect: "manual",
    signal: AbortSignal.timeout(20_000),
  });

  const body = await response.text();
  const contentType = response.headers.get("content-type") ?? "unknown content type";
  let parsed: unknown;
  try {
    parsed = body ? JSON.parse(body) : {};
  } catch {
    if (!response.ok) {
      const plainText =
        !contentType.toLowerCase().includes("json") && !body.includes("<")
          ? body.trim().replace(/\s+/g, " ").slice(0, 160)
          : undefined;
      throw new Error(
        `Exness API request failed (HTTP ${response.status}, ${contentType})${plainText ? `: ${plainText}` : ""}`,
      );
    }
    throw new Error(
      `Exness API returned an unreadable response (HTTP ${response.status}, ${contentType})`,
    );
  }

  if (!response.ok) {
    const message = isRecord(parsed)
      ? text(
          firstValue(parsed, [
            "error_message",
            "description",
            "message",
            "error",
          ]),
        )
        : undefined;
    const code = isRecord(parsed) ? text(parsed.code) : undefined;
    const detail = message ?? "request denied";
    throw new Error(
      `Exness API request failed (HTTP ${response.status}, ${contentType}${code ? `, code ${code}` : ""}): ${detail}`,
    );
  }
  return parsed as T;
}

async function discoverAccessPoint(
  credentials: ExnessCredentials,
  privateKey: ReturnType<typeof loadSigningKey>,
): Promise<string> {
  const gateway = baseUrl(credentials.discoveryBaseUrl);
  const path = `/v1/trading/access-point?account_id=${encodeURIComponent(credentials.accountId)}`;
  const result = await getJson<unknown>(gateway, path, credentials.apiKey, privateKey);
  if (!isRecord(result) || typeof result.access_point !== "string") {
    throw new Error("Exness access-point discovery did not return an access_point");
  }
  return baseUrl(result.access_point);
}

function limitsForHistory(response: unknown): { ageDays: number; rangeDays: number } {
  if (!isRecord(response) || !isRecord(response.limits) || !isRecord(response.limits.rest)) {
    throw new Error("Exness did not return REST limits required for deal-history sync");
  }
  const methods = response.limits.rest.methods;
  if (!Array.isArray(methods)) {
    throw new Error("Exness did not return operation limits for deal-history sync");
  }
  const method = methods.find(
    (item) =>
      isRecord(item) &&
      (item.api_operation_id === "getDealsHistory" ||
        (typeof item.path === "string" &&
          item.path.includes("/history/accounts/") &&
          item.path.endsWith("/deals"))),
  );
  if (!isRecord(method) || !isRecord(method.limits)) {
    throw new Error("Exness did not provide history age and range limits for this API key");
  }
  const ageDays = finiteNumber(method.limits.history_age_days);
  const rangeDays = finiteNumber(method.limits.history_range_days);
  if (!ageDays || ageDays <= 0 || !rangeDays || rangeDays <= 0) {
    throw new Error("Exness returned invalid history age or range limits");
  }
  return { ageDays, rangeDays };
}

function dealsFromResponse(response: unknown): { deals: ExnessRecord[]; nextCursor?: string } {
  if (Array.isArray(response)) {
    if (response.some((item) => !isRecord(item))) {
      throw new Error("Exness returned a malformed deal record");
    }
    return { deals: response };
  }
  if (!isRecord(response)) throw new Error("Exness deal-history response has an invalid shape");

  const rawDeals = firstValue(response, ["deals", "items", "data"]);
  if (!Array.isArray(rawDeals)) {
    throw new Error("Exness deal-history response did not contain a deals array");
  }
  const deals: ExnessRecord[] = [];
  for (const value of rawDeals) {
    if (!isRecord(value)) throw new Error("Exness returned a malformed deal record");
    deals.push(isRecord(value.deal) ? value.deal : value);
  }
  const nextCursor = text(firstValue(response, ["next_cursor", "nextCursor"]));
  return { deals, nextCursor };
}

function directionOf(deal: ExnessRecord): "BUY" | "SELL" | undefined {
  const directions = [
    deal.side,
    deal.direction,
    deal.position_side,
    deal.position_type,
    deal.order_type,
    deal.trade_type,
  ]
    .map(text)
    .filter((value): value is string => value !== undefined)
    .map((value) => value.toLowerCase());
  if (directions.some((value) => value.includes("buy") || value === "long")) {
    return "BUY";
  }
  if (directions.some((value) => value.includes("sell") || value === "short")) {
    return "SELL";
  }
  return undefined;
}

function positionIdOf(deal: ExnessRecord, accountId: string): string | undefined {
  const positionId = text(firstValue(deal, ["position_id", "positionId"]));
  return positionId ? `${accountId}:${positionId}` : undefined;
}

function eventTypeOf(deal: ExnessRecord): string {
  const values = ["deal_type", "entry_type", "operation", "action", "type"]
    .map((field) => text(deal[field])?.toLowerCase())
    .filter((value): value is string => value !== undefined);
  return (
    values.find((value) =>
      ["open", "close", "balance", "deposit", "withdraw"].some((kind) =>
        value.includes(kind),
      ),
    ) ??
    values[0] ??
    ""
  );
}

function mapDeal(deal: ExnessRecord, accountId: string): {
  openDeal?: OpenDeal;
  trade?: ImportedTrade;
} {
  const eventType = eventTypeOf(deal);
  const rawId = text(firstValue(deal, ["deal_id", "id", "ticket"]));
  if (!rawId) throw new Error("Exness returned a deal without a deal ID");
  const id = `${accountId}:${rawId}`;
  const eventTime = requiredTimestamp(
    firstValue(deal, ["event_time", "time", "timestamp"]),
  );
  const symbol =
    text(firstValue(deal, ["instrument", "symbol"])) ?? "UNKNOWN";
  const positionId = positionIdOf(deal, accountId);
  const side = directionOf(deal);

  if (eventType === "open" || eventType.includes("open")) {
    if (!positionId || !side) {
      throw new Error(`Exness open deal ${id} is missing its position ID or buy/sell direction`);
    }
    if (symbol === "UNKNOWN") throw new Error(`Exness open deal ${id} is missing its instrument`);
    return {
      openDeal: {
        dealId: id,
        positionId,
        symbol,
        type: side,
        lots: requiredNumber(firstValue(deal, ["volume", "lots"]), "volume"),
        openPrice: requiredNumber(firstValue(deal, ["price", "open_price"]), "price"),
        openTime: eventTime,
        ...(finiteNumber(firstValue(deal, ["stop_loss", "stopLoss"])) !== undefined
          ? { stopLoss: finiteNumber(firstValue(deal, ["stop_loss", "stopLoss"])) }
          : {}),
        ...(finiteNumber(firstValue(deal, ["take_profit", "takeProfit"])) !== undefined
          ? { takeProfit: finiteNumber(firstValue(deal, ["take_profit", "takeProfit"])) }
          : {}),
      },
    };
  }

  if (
    eventType.includes("balance") ||
    eventType.includes("deposit") ||
    eventType.includes("withdraw")
  ) {
    const amount = requiredNumber(
      firstValue(deal, ["profit", "amount", "balance"]),
      "balance amount",
    );
    const isDeposit = amount >= 0;
    return {
      trade: {
        ticket: `exness:${id}`,
        symbol: "BALANCE",
        type: isDeposit ? "DEPOSIT" : "WITHDRAWAL",
        lots: 0,
        openPrice: 0,
        closePrice: 0,
        openTime: eventTime,
        closeTime: eventTime,
        profit: amount,
        commission: finiteNumber(deal.commission) ?? 0,
        swap: finiteNumber(deal.swap) ?? 0,
        isDeposit,
      },
    };
  }

  if (eventType === "close" || eventType.includes("close")) {
    if (!side) throw new Error(`Exness close deal ${id} is missing its buy/sell direction`);
    if (symbol === "UNKNOWN") throw new Error(`Exness close deal ${id} is missing its instrument`);
    const closePrice = requiredNumber(firstValue(deal, ["price", "close_price"]), "price");
    return {
      trade: {
        ticket: `exness:${id}`,
        ...(positionId ? { positionId } : {}),
        symbol,
        type: side,
        lots: requiredNumber(firstValue(deal, ["volume", "lots"]), "volume"),
        openPrice: finiteNumber(deal.open_price) ?? closePrice,
        closePrice,
        openTime: timestamp(firstValue(deal, ["open_time", "position_open_time"])) ?? eventTime,
        closeTime: eventTime,
        profit: requiredNumber(deal.profit, "profit"),
        commission: finiteNumber(deal.commission) ?? 0,
        swap: finiteNumber(deal.swap) ?? 0,
        ...(finiteNumber(firstValue(deal, ["stop_loss", "stopLoss"])) !== undefined
          ? { stopLoss: finiteNumber(firstValue(deal, ["stop_loss", "stopLoss"])) }
          : {}),
        ...(finiteNumber(firstValue(deal, ["take_profit", "takeProfit"])) !== undefined
          ? { takeProfit: finiteNumber(firstValue(deal, ["take_profit", "takeProfit"])) }
          : {}),
        closeReason: text(firstValue(deal, ["close_reason", "reason"])) ?? "",
      },
    };
  }

  return {};
}

async function fetchDeals(
  credentials: ExnessCredentials,
  privateKey: ReturnType<typeof loadSigningKey>,
  accessPoint: string,
  lastSynced?: number,
): Promise<DealResult> {
  const limitsPath = `/v1/configuration/accounts/${encodeURIComponent(credentials.accountId)}/limits`;
  const limitsResponse = await getJson<unknown>(
    accessPoint,
    limitsPath,
    credentials.apiKey,
    privateKey,
  );
  const { ageDays, rangeDays } = limitsForHistory(limitsResponse);
  const now = Date.now();
  const earliest = now - ageDays * DAY_MS;
  const requestedStart = lastSynced
    ? Math.max(lastSynced - 5 * 60_000, earliest)
    : now - Math.min(ageDays, MAX_INITIAL_HISTORY_DAYS) * DAY_MS;
  const rangeSize = rangeDays * DAY_MS;
  const rangeCount = Math.ceil((now - requestedStart) / rangeSize);
  if (rangeCount > MAX_RANGE_REQUESTS) {
    throw new Error("Exness history limits require too many requests for one sync; narrow the account history in Exness");
  }

  const result: DealResult = { openDeals: [], trades: [] };
  let start = requestedStart;
  while (start < now) {
    const end = Math.min(now, start + rangeSize);
    let cursor: string | undefined;
    let pageCount = 0;
    do {
      const query = cursor
        ? `?cursor=${encodeURIComponent(cursor)}&limit=${PAGE_SIZE}`
        : `?from=${Math.trunc(start)}&to=${Math.trunc(end)}&limit=${PAGE_SIZE}`;
      const path = `/v1/history/accounts/${encodeURIComponent(credentials.accountId)}/deals${query}`;
      const response = await getJson<unknown>(
        accessPoint,
        path,
        credentials.apiKey,
        privateKey,
      );
      const page = dealsFromResponse(response);
      for (const deal of page.deals) {
        const mapped = mapDeal(deal, credentials.accountId);
        if (mapped.openDeal) result.openDeals.push(mapped.openDeal);
        if (mapped.trade) result.trades.push(mapped.trade);
      }

      cursor = page.nextCursor;
      pageCount++;
      if (cursor && pageCount >= MAX_PAGES_PER_RANGE) {
        throw new Error("Exness returned more than 10,000 deals in one history range; reduce the history range and retry");
      }
    } while (cursor);
    start = end;
  }

  return result;
}

async function getAccount(
  credentials: ExnessCredentials,
  privateKey: ReturnType<typeof loadSigningKey>,
  accessPoint: string,
): Promise<string | undefined> {
  const path = `/v1/configuration/accounts/${encodeURIComponent(credentials.accountId)}/account`;
  const result = await getJson<unknown>(accessPoint, path, credentials.apiKey, privateKey);
  if (!isRecord(result)) return undefined;
  return text(result.currency);
}

async function syncWithCredentials(
  ctx: {
    runMutation: (mutation: typeof internal.exness.storeDeals, args: {
      openDeals: OpenDeal[];
      trades: ImportedTrade[];
    }) => Promise<{ insertedTrades: number }>;
  },
  credentials: ExnessCredentials,
  accessPoint: string | undefined,
  lastSynced: number | undefined,
) {
  const privateKey = loadSigningKey(credentials.privateKey);
  const resolvedAccessPoint =
    accessPoint ?? (await discoverAccessPoint(credentials, privateKey));
  const [accountCurrency, deals] = await Promise.all([
    getAccount(credentials, privateKey, resolvedAccessPoint),
    fetchDeals(credentials, privateKey, resolvedAccessPoint, lastSynced),
  ]);

  let insertedTrades = 0;
  const total = Math.max(deals.openDeals.length, deals.trades.length);
  for (let offset = 0; offset < total; offset += BATCH_SIZE) {
    const result = await ctx.runMutation(internal.exness.storeDeals, {
      openDeals: deals.openDeals.slice(offset, offset + BATCH_SIZE),
      trades: deals.trades.slice(offset, offset + BATCH_SIZE),
    });
    insertedTrades += result.insertedTrades;
  }

  return {
    accessPoint: resolvedAccessPoint,
    accountCurrency,
    insertedTrades,
    lastSynced: Date.now(),
    accountId: credentials.accountId,
  };
}

export const connectExness = action({
  args: {
    encryptedCredentials: v.string(),
    iv: v.string(),
    authTag: v.string(),
  },
  handler: async (ctx, args) => {
    const encrypted: EncryptedCredentials = args;
    const credentials = decryptCredentials(encrypted);
    const result = await syncWithCredentials(ctx, credentials, undefined, undefined);
    await ctx.runMutation(internal.exness.saveConnection, {
      ...args,
      accountId: result.accountId,
      accessPoint: result.accessPoint,
      ...(result.accountCurrency
        ? { accountCurrency: result.accountCurrency }
        : {}),
      lastSynced: result.lastSynced,
    });

    return {
      success: true,
      accountId: result.accountId,
      ...(result.accountCurrency
        ? { accountCurrency: result.accountCurrency }
        : {}),
      tradesCount: result.insertedTrades,
      lastSynced: result.lastSynced,
    };
  },
});

export const syncExnessTrades = action({
  args: {},
  handler: async (ctx) => {
    const stored = await ctx.runQuery(internal.exness.getStoredConnection, {});
    if (!stored?.isConnected || !stored.encryptedCredentials) {
      return {
        success: false,
        tradesCount: 0,
        lastSynced: 0,
        message: "Exness API is not the active journal connection. Connect it again to switch from MT5.",
      };
    }

    const encrypted: EncryptedCredentials = {
      encryptedCredentials: stored.encryptedCredentials,
      iv: stored.iv,
      authTag: stored.authTag,
    };
    const credentials = decryptCredentials(encrypted);
    const result = await syncWithCredentials(
      ctx,
      credentials,
      stored.accessPoint,
      stored.lastSynced,
    );
    await ctx.runMutation(internal.exness.updateLastSynced, {
      lastSynced: result.lastSynced,
    });

    return {
      success: true,
      tradesCount: result.insertedTrades,
      lastSynced: result.lastSynced,
    };
  },
});
