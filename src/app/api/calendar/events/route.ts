import { NextResponse } from 'next/server';

function normalizeImpact(v: any): 'HIGH' | 'MEDIUM' | 'LOW' {
  const s = (v ?? '').toString().toUpperCase();
  if (!s) return 'LOW';
  if (s === 'HIGH' || s === 'RED' || s === '3') return 'HIGH';
  if (s === 'MEDIUM' || s === 'ORANGE' || s === '2') return 'MEDIUM';
  return 'LOW';
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const today = new Date().toISOString().split('T')[0];
  const from = searchParams.get('from') ?? today;
  const to = searchParams.get('to') ?? from;

  const apiKey = process.env.JBLANKED_API_KEY ?? '';

  // JBlanked Free Calendar API
  // Docs: https://www.jblanked.com/ (free tier available)
  const url = `https://www.jblanked.com/news/api/forex-factory/calendar/range/?from=${from}&to=${to}`;

  const res = await fetch(url, {
    headers: apiKey ? { Authorization: `Api-Key ${apiKey}` } : {},
    next: { revalidate: 300 },
  });

  // Normalize certain provider auth/rate-limit responses into an empty set
  if (res.status === 401 || res.status === 403 || res.status === 429) {
    return NextResponse.json([]);
  }

  if (!res.ok) {
    return NextResponse.json(
      { error: 'Calendar fetch failed', status: res.status },
      { status: 502 },
    );
  }

  const raw = await res.json();

  const items = Array.isArray(raw) ? raw : (raw?.results ?? raw?.data ?? []);

  // If provider returns an object or unexpected structure, do not hard-fail.
  const normalized = (Array.isArray(items) ? items : []).map((e: any, i: number) => {
    const dateUtc = e.date ?? e.dateUtc ?? e.datetime ?? e.time ?? null;
    return {
      id: e.id ?? e.eventId ?? `evt-${i}`,
      title: e.name ?? e.title ?? e.event ?? 'Unknown',
      currency: e.currency ?? e.currencyCode ?? '',
      country: e.country ?? e.countryCode ?? '',
      impact: normalizeImpact(e.impact ?? e.volatility),
      dateUtc: dateUtc ? new Date(dateUtc).toISOString() : new Date().toISOString(),
      actual: e.actual ?? null,
      forecast: e.forecast ?? e.consensus ?? null,
      previous: e.previous ?? null,
    };
  });

  return NextResponse.json(normalized);
}

