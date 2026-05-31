import { NextResponse } from 'next/server';

// ─── Shape normalizer ─────────────────────────────────────────────────────────
function extractArray(raw: unknown): unknown[] {
  if (Array.isArray(raw)) return raw;
  if (raw && typeof raw === 'object') {
    const obj = raw as Record<string, unknown>;
    for (const key of ['results', 'data', 'events', 'calendar', 'items']) {
      if (Array.isArray(obj[key])) return obj[key] as unknown[];
    }
    if ('id' in obj || 'title' in obj || 'name' in obj) return [obj];
  }
  return [];
}

function normalizeImpact(v: unknown): 'HIGH' | 'MEDIUM' | 'LOW' {
  const s = String(v ?? '').toUpperCase();
  if (['HIGH', 'RED', '3', 'H'].includes(s)) return 'HIGH';
  if (['MEDIUM', 'ORANGE', 'MODERATE', '2', 'M'].includes(s)) return 'MEDIUM';
  return 'LOW';
}

function todayUTC(): string {
  return new Date().toISOString().split('T')[0];
}

// ─── Source 1: JBlanked (requires free API key at jblanked.com) ───────────────
async function fetchJBlanked(from: string, to: string, apiKey: string) {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (apiKey) headers['Authorization'] = `Api-Key ${apiKey}`;
  const url = `https://www.jblanked.com/news/api/forex-factory/calendar/range/?from=${from}&to=${to}`;
  const res = await fetch(url, { headers, next: { revalidate: 300 } });
  if (!res.ok) throw new Error(`JBlanked ${res.status}`);
  return await res.json();
}

// ─── Source 2: ForexFactory public JSON (no key, rate-limited) ───────────────
// ForexFactory publishes a weekly JSON feed at a stable CDN URL.
// It covers the current week only; we filter by date range after fetching.
async function fetchForexFactory(from: string, to: string) {
  // ForexFactory JSON — this week's calendar, publicly available
  const url = 'https://nfs.faireconomy.media/ff_calendar_thisweek.json';
  const res = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0' },
    next: { revalidate: 3600 },
  });
  if (!res.ok) throw new Error(`ForexFactory ${res.status}`);
  const data = await res.json();
  // Filter to requested date range
  const fromMs = new Date(from + 'T00:00:00Z').getTime();
  const toMs   = new Date(to   + 'T23:59:59Z').getTime();
  return (Array.isArray(data) ? data : []).filter((ev: Record<string, unknown>) => {
    const d = new Date(String(ev.date ?? '')).getTime();
    return d >= fromMs && d <= toMs;
  });
}

// ─── Normalizer: converts any source shape → our CalendarEvent shape ──────────
function normalize(items: unknown[]): unknown[] {
  return items.map((e: unknown, i: number) => {
    const ev = e as Record<string, unknown>;
    return {
      id:       String(ev.id ?? ev.eventId ?? `evt-${i}`),
      title:    String(ev.name ?? ev.title ?? ev.event ?? ev.event_name ?? 'Unknown Event'),
      currency: String(ev.currency ?? ev.currencyCode ?? ev.country ?? ''),
      country:  String(ev.country ?? ev.countryCode ?? ''),
      impact:   normalizeImpact(ev.impact ?? ev.volatility ?? ev.strength ?? ev.importance ?? 'LOW'),
      dateUtc:  String(ev.date ?? ev.dateUtc ?? ev.datetime ?? ev.time ?? ev.scheduled ?? ''),
      actual:   ev.actual   != null ? String(ev.actual)   : null,
      forecast: ev.forecast != null ? String(ev.forecast) : (ev.consensus  != null ? String(ev.consensus)  : null),
      previous: ev.previous != null ? String(ev.previous) : (ev.revised    != null ? String(ev.revised)    : null),
    };
  });
}

// ─── Route handler ────────────────────────────────────────────────────────────
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const from = searchParams.get('from') ?? todayUTC();
  const to   = searchParams.get('to')   ?? from;

  const apiKey = process.env.JBLANKED_API_KEY ?? '';

  // Try sources in order
  const sources = [
    ...(apiKey ? [() => fetchJBlanked(from, to, apiKey)] : []),
    () => fetchForexFactory(from, to),
  ];

  for (const source of sources) {
    try {
      const raw = await source();
      console.log('[calendar] source succeeded, raw preview:', JSON.stringify(raw).slice(0, 300));
      const items = extractArray(raw);
      if (items.length > 0) {
        return NextResponse.json(normalize(items));
      }
      console.warn('[calendar] source returned 0 items, trying next...');
    } catch (err) {
      console.warn('[calendar] source failed:', (err as Error).message, '— trying next');
    }
  }

  // All sources failed or returned empty
  console.error('[calendar] all sources failed for', from, '→', to);
  // Return empty — do NOT return mock data
  return NextResponse.json([]);
}

