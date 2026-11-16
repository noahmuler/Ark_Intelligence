import { NextResponse } from "next/server";

export function isLocalSameOrigin(request: Request): boolean {
  const host = request.headers.get("host");
  if (!host) return false;

  let isLoopback = false;
  try {
    const hostname = new URL(`http://${host}`).hostname;
    isLoopback =
      hostname === "localhost" ||
      hostname === "127.0.0.1" ||
      hostname === "[::1]";
  } catch {
    return false;
  }
  if (!isLoopback) return false;

  const origin = request.headers.get("origin");
  if (!origin) return request.headers.get("sec-fetch-site") === "same-origin";
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

export async function readJsonBody(
  request: Request,
  maxBytes: number,
): Promise<{ value?: unknown; error?: NextResponse }> {
  if (Number(request.headers.get("content-length") ?? 0) > maxBytes) {
    return { error: NextResponse.json({ error: "Request body is too large" }, { status: 413 }) };
  }

  try {
    const text = await request.text();
    if (Buffer.byteLength(text, "utf8") > maxBytes) {
      return { error: NextResponse.json({ error: "Request body is too large" }, { status: 413 }) };
    }
    return { value: JSON.parse(text) as unknown };
  } catch {
    return { error: NextResponse.json({ error: "Request body must be valid JSON" }, { status: 400 }) };
  }
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
