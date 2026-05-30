import { NextResponse } from 'next/server';

// Tries to extract an array from any API response shape
function extractArray(raw: unknown): unknown[] {
  if (Array.isArray(raw)) return raw;
  if (raw && typeof raw === 'object') {
    const obj = raw as Record<string, unknown>;
    for (const key of ['results', 'data', 'events', 'calendar', 'items']) {
      if (Array.isArray(obj[key])) return obj[key] as unknown[];
    }
    // Single object wrapped?
    if ('id' in obj || 'title' in obj || 'name' in obj) return [obj];
  }
  return [];
}

function normalizeImpact(v: unknown): 'HIGH' | 'MEDIUM' | 'LOW' {
  const s = String(v ?? '').toUpperCase();
  if (['HIGH', 'RED', '3', 'HOLIDAY'].includes(s)) return 'HIGH';
  if (['MEDIUM', 'ORANGE', 'MODERATE', '2'].includes(s)) return 'MEDIUM';
  return 'LOW';
}

// Always returns today's date in YYYY-MM-DD in UTC
function todayUTC(): string {
  return new Date().toISOString().split('T')[0];
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const from = searchParams.get('from') ?? todayUTC();
  const to   = searchParams.get('to')   ?? from;

  const apiKey = process.env.JBLANKED_API_KEY ?? '';
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (apiKey) headers['Authorization'] = `Api-Key ${apiKey}`;

  // Try JBlanked ForexFactory endpoint
  const url = `https://www.jblanked.com/news/api/forex-factory/calendar/range/?from=${from}&to=${to}`;

  let raw: unknown;
  try {
    const res = await fetch(url, { headers, next: { revalidate: 300 } });
    if (!res.ok) {
      console.error(`[calendar] JBlanked responded ${res.status}`);
      // Return empty array with status so the UI can show proper error
      return NextResponse.json([], { status: 200 });
    }
    raw = await res.json();
    // DEBUG: log first 400 chars of raw response to diagnose shape issues
    console.log('[calendar] raw response preview:', JSON.stringify(raw).slice(0, 400));
  } catch (err) {
    console.error('[calendar] fetch error', err);
    return NextResponse.json([], { status: 200 });
  }

  const items = extractArray(raw);

  if (items.length === 0) {
    console.warn('[calendar] API returned 0 events for', from, '→', to);
    console.warn('[calendar] raw type:', typeof raw, '| keys:', raw && typeof raw === 'object' ? Object.keys(raw as object).join(', ') : 'n/a');
  }

  const normalized = items.map((e: unknown, i: number) => {
    const ev = e as Record<string, unknown>;
    return {
      id:       String(ev.id ?? ev.eventId ?? `evt-${i}`),
      title:    String(ev.name ?? ev.title ?? ev.event ?? 'Unknown Event'),
      currency: String(ev.currency ?? ev.currencyCode ?? ''),
      country:  String(ev.country ?? ev.countryCode ?? ''),
      impact:   normalizeImpact(ev.impact ?? ev.volatility ?? ev.strength ?? 'LOW'),
      // Accept any date field name; prefer ISO UTC string
      dateUtc:  String(ev.date ?? ev.dateUtc ?? ev.datetime ?? ev.time ?? ev.scheduled ?? ''),
      actual:   ev.actual   != null ? String(ev.actual)   : null,
      forecast: ev.forecast != null ? String(ev.forecast) : (ev.consensus != null ? String(ev.consensus) : null),
      previous: ev.previous != null ? String(ev.previous) : null,
    };
  });

  return NextResponse.json(normalized);
}

