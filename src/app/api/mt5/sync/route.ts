import { timingSafeEqual } from "node:crypto";
import { ConvexHttpClient } from "convex/browser";
import { NextResponse } from "next/server";
import { api } from "../../../../../convex/_generated/api";

export const runtime = "nodejs";

const MAX_BODY_BYTES = 256 * 1024;
const MAX_TRADES_PER_BATCH = 100;
const TRADE_TYPES = new Set(["BUY", "SELL", "DEPOSIT", "WITHDRAWAL"]);

type TerminalTrade = {
  ticket: number;
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
  isDeposit: boolean;
  stopLoss: number;
  takeProfit: number;
  closeReason: string;
};

function isLoopbackHost(request: Request): boolean {
  const host = request.headers.get("host");
  if (!host) return false;

  try {
    const hostname = new URL(`http://${host}`).hostname;
    return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "[::1]";
  } catch {
    return false;
  }
}

function isSameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return request.headers.get("sec-fetch-site") === "same-origin";

  try {
    return new URL(origin).host === request.headers.get("host");
  } catch {
    return false;
  }
}

function hasValidToken(request: Request, expectedToken: string): boolean {
  const providedToken = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!providedToken) return false;

  const expected = Buffer.from(expectedToken);
  const provided = Buffer.from(providedToken);
  return expected.length === provided.length && timingSafeEqual(expected, provided);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function parseTrades(value: unknown): TerminalTrade[] | null {
  if (!Array.isArray(value) || value.length > MAX_TRADES_PER_BATCH) return null;

  const trades: TerminalTrade[] = [];
  for (const item of value) {
    if (!isRecord(item)) return null;
    if (
      !Number.isSafeInteger(item.ticket) ||
      (item.ticket as number) <= 0 ||
      typeof item.symbol !== "string" ||
      item.symbol.length > 32 ||
      typeof item.type !== "string" ||
      !TRADE_TYPES.has(item.type) ||
      typeof item.isDeposit !== "boolean" ||
      typeof item.closeReason !== "string" ||
      item.closeReason.length > 32
    ) {
      return null;
    }

    const numberFields = [
      "lots",
      "openPrice",
      "closePrice",
      "openTime",
      "closeTime",
      "profit",
      "commission",
      "swap",
      "stopLoss",
      "takeProfit",
    ] as const;
    if (numberFields.some((field) => !isFiniteNumber(item[field]))) return null;

    trades.push({
      ticket: item.ticket as number,
      symbol: item.symbol,
      type: item.type as TerminalTrade["type"],
      lots: item.lots as number,
      openPrice: item.openPrice as number,
      closePrice: item.closePrice as number,
      openTime: item.openTime as number,
      closeTime: item.closeTime as number,
      profit: item.profit as number,
      commission: item.commission as number,
      swap: item.swap as number,
      isDeposit: item.isDeposit,
      stopLoss: item.stopLoss as number,
      takeProfit: item.takeProfit as number,
      closeReason: item.closeReason,
    });
  }

  return trades;
}

export async function GET(request: Request) {
  if (!isLoopbackHost(request) || !isSameOrigin(request)) {
    return NextResponse.json({ error: "Local access only" }, { status: 403 });
  }

  const token = process.env.MT5_SYNC_TOKEN;
  if (!token || token.length < 32) {
    return NextResponse.json(
      { error: "Local MT5 sync is not configured. Restart the app after setting MT5_SYNC_TOKEN." },
      { status: 503 },
    );
  }

  const requestUrl = new URL(request.url);
  const port = requestUrl.port || (requestUrl.protocol === "https:" ? "443" : "80");
  return NextResponse.json({
    endpoint: `http://127.0.0.1:${port}/api/mt5/sync`,
    token,
  });
}

export async function POST(request: Request) {
  if (!isLoopbackHost(request)) {
    return NextResponse.json({ error: "Local access only" }, { status: 403 });
  }
  if (request.headers.has("origin") && !isSameOrigin(request)) {
    return NextResponse.json({ error: "Cross-origin requests are not allowed" }, { status: 403 });
  }

  const token = process.env.MT5_SYNC_TOKEN;
  if (!token || token.length < 32) {
    return NextResponse.json({ error: "Local MT5 sync is not configured" }, { status: 503 });
  }
  if (!hasValidToken(request, token)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > MAX_BODY_BYTES) {
    return NextResponse.json({ error: "Request body is too large" }, { status: 413 });
  }

  let payload: unknown;
  try {
    const body = await request.text();
    if (Buffer.byteLength(body, "utf8") > MAX_BODY_BYTES) {
      return NextResponse.json({ error: "Request body is too large" }, { status: 413 });
    }
    payload = JSON.parse(body);
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON" }, { status: 400 });
  }

  if (!isRecord(payload)) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { serverName, accountLogin } = payload;
  const trades = parseTrades(payload.trades);
  if (
    typeof serverName !== "string" ||
    serverName.length === 0 ||
    serverName.length > 128 ||
    typeof accountLogin !== "string" ||
    !/^\d{1,20}$/.test(accountLogin) ||
    trades === null
  ) {
    return NextResponse.json({ error: "Invalid account details or trade batch" }, { status: 400 });
  }

  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!convexUrl) {
    return NextResponse.json({ error: "Convex is not configured" }, { status: 503 });
  }

  try {
    const client = new ConvexHttpClient(convexUrl);
    const result = await client.action(api.mt5Actions.syncTradesFromTerminal, {
      syncToken: token,
      serverName,
      accountLogin,
      trades,
    });
    return NextResponse.json(result);
  } catch (error) {
    console.error("[mt5-sync] Failed to save terminal sync batch:", error);
    return NextResponse.json({ error: "Failed to save MT5 history" }, { status: 502 });
  }
}
