import { ConvexHttpClient } from "convex/browser";
import { NextResponse } from "next/server";
import { api } from "../../../../../convex/_generated/api";
import { isLocalSameOrigin } from "../_helpers";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!isLocalSameOrigin(request)) {
    return NextResponse.json({ error: "Local same-origin access only" }, { status: 403 });
  }

  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!convexUrl) {
    return NextResponse.json({ error: "Convex is not configured" }, { status: 503 });
  }

  try {
    const client = new ConvexHttpClient(convexUrl);
    const result = await client.mutation(api.exness.disconnectExness, {});
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not disconnect Exness API";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
