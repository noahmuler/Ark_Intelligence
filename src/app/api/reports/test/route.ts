import { NextResponse } from 'next/server';

export async function GET() {
  const fredKey = process.env.FRED_API_KEY;
  const jbKey = process.env.JBLANKED_API_KEY;

  const fredPresent = !!fredKey && fredKey.trim() !== '';
  const jbPresent = !!jbKey && jbKey.trim() !== '';

  if (!fredPresent && !jbPresent) {
    return NextResponse.json({
      status: 'error',
      message: 'No API keys configured.',
      help: 'Add FRED_API_KEY or JBLANKED_API_KEY to .env.local and restart the dev server.',
    }, { status: 500 });
  }

  // Test FRED if available
  if (fredPresent) {
    try {
      const url = `https://api.stlouisfed.org/fred/series/observations?series_id=UNRATE&api_key=${fredKey}&file_type=json&limit=1&sort_order=desc`;
      const res = await fetch(url, { cache: 'no-store' });
      const data = await res.json();
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return NextResponse.json({
        status: 'ok',
        source: 'FRED',
        fredTest: { series: 'UNRATE', latestDate: data.observations?.[0]?.date, latestValue: data.observations?.[0]?.value },
      });
    } catch {
      // Fall through to JBlanked test
    }
  }

  // Test JBlanked if available
  if (jbPresent) {
    try {
      const now = new Date();
      const from = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const url = `https://www.jblanked.com/news/api/mql5/calendar/range/?from=${from.toISOString().split('T')[0]}&to=${now.toISOString().split('T')[0]}&currency=USD&impact=High`;
      const res = await fetch(url, {
        headers: { 'Authorization': `Api-Key ${jbKey}` },
        cache: 'no-store',
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return NextResponse.json({ status: 'ok', source: 'JBlanked' });
    } catch {
      // Fall through
    }
  }

  return NextResponse.json({ status: 'error', message: 'Both FRED and JBlanked tests failed.' }, { status: 500 });
}
