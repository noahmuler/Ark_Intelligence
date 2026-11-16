import { ConvexHttpClient } from "convex/browser";
import { NextResponse } from "next/server";
import { api } from "../../../../../convex/_generated/api";
import { encryptCredentials } from "../../../../../convex/exnessCrypto";
import { isLocalSameOrigin, isRecord, readJsonBody } from "../_helpers";

export const runtime = "nodejs";

const MAX_BODY_BYTES = 16 * 1024;
const MAX_ACCOUNT_ID = "18446744073709551615";

function isValidHost(value: unknown): value is string {
  if (typeof value !== "string") return false;
  try {
    const url = new URL(value);
    const hostname = url.hostname.toLowerCase();
    return (
      url.protocol === "https:" &&
      !url.username &&
      !url.password &&
      url.pathname === "/" &&
      !url.search &&
      !url.hash &&
      (hostname === "exness.com" ||
        hostname.endsWith(".exness.com") ||
        hostname === "exness-api.com" ||
        hostname.endsWith(".exness-api.com"))
    );
  } catch {
    return false;
  }
}

function isValidAccountId(value: unknown): value is string {
  if (typeof value !== "string" || !/^[1-9][0-9]{0,19}$/.test(value)) return false;
  return (
    value.length < MAX_ACCOUNT_ID.length ||
    (value.length === MAX_ACCOUNT_ID.length && value <= MAX_ACCOUNT_ID)
  );
}

export async function POST(request: Request) {
  if (!isLocalSameOrigin(request)) {
    return NextResponse.json({ error: "Local same-origin access only" }, { status: 403 });
  }

  const { value, error } = await readJsonBody(request, MAX_BODY_BYTES);
  if (error) return error;
  if (!isRecord(value)) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const apiKey = value.apiKey;
  const privateKey = value.privateKey;
  const accountId = value.accountId;
  const discoveryBaseUrl = value.discoveryBaseUrl;
  if (
    typeof apiKey !== "string" ||
    apiKey.trim().length < 8 ||
    apiKey.length > 512 ||
    typeof privateKey !== "string" ||
    privateKey.trim().length > 4096 ||
    !(/^[0-9a-fA-F]{128}$/.test(privateKey.trim()) ||
      privateKey.trim().startsWith("-----BEGIN PRIVATE KEY-----")) ||
    !isValidAccountId(accountId) ||
    !isValidHost(discoveryBaseUrl)
  ) {
    return NextResponse.json(
      {
        error:
          "Enter a valid API key, Ed25519 private key, account ID, and HTTPS DNS gateway hostname from Exness Key Management.",
      },
      { status: 400 },
    );
  }

  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!convexUrl) {
    return NextResponse.json({ error: "Convex is not configured" }, { status: 503 });
  }

  try {
    const encrypted = encryptCredentials({
      apiKey: apiKey.trim(),
      privateKey: privateKey.trim(),
      accountId,
      discoveryBaseUrl,
    });
    const client = new ConvexHttpClient(convexUrl);
    const result = await client.action(api.exnessActions.connectExness, encrypted);
    return NextResponse.json(result);
  } catch (error) {
    const rawMessage = error instanceof Error ? error.message : "Could not connect Exness API";
    const message =
      rawMessage.match(/Uncaught Error:\s*([^\r\n]+)/)?.[1] ??
      rawMessage.split("\n").find((line) => line.trim() && !line.includes("Request ID")) ??
      "Could not connect Exness API";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
