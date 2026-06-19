import { NextResponse } from 'next/server';

// ─── FRED Configuration ───
const FRED_SERIES = [
  { id: 'CPIAUCSL',    name: 'CPI (YoY)',          category: 'Inflation',   impact: 'high' },
  { id: 'CPILFESL',    name: 'Core CPI',           category: 'Inflation',   impact: 'high' },
  { id: 'PCEPI',       name: 'PCE Price Index',    category: 'Inflation',   impact: 'high' },
  { id: 'PCEPILFE',    name: 'Core PCE',           category: 'Inflation',   impact: 'high' },
  { id: 'PAYEMS',      name: 'Non-Farm Payrolls',  category: 'Employment',  impact: 'high' },
  { id: 'UNRATE',      name: 'Unemployment Rate',  category: 'Employment',  impact: 'high' },
  { id: 'ICSA',        name: 'Initial Jobless Claims', category: 'Employment', impact: 'medium' },
  { id: 'GDP',         name: 'GDP (QoQ)',          category: 'Growth',      impact: 'high' },
  { id: 'RETAILSMNSA', name: 'Retail Sales',       category: 'Consumer',   impact: 'high' },
  { id: 'INDPRO',      name: 'Industrial Production', category: 'Production', impact: 'medium' },
  { id: 'HOUST',       name: 'Housing Starts',     category: 'Housing',    impact: 'medium' },
  { id: 'UMCSENT',     name: 'UMich Sentiment',    category: 'Sentiment',  impact: 'medium' },
  { id: 'DFF',         name: 'Fed Funds Rate',     category: 'Fed',        impact: 'high' },
  { id: 'DPCERA3Q086SBEA', name: 'PCE (QoQ)',    category: 'Inflation',  impact: 'high' },
];

const RELEASE_SCHEDULE: Record<string, { dayOfMonth: number; description: string }> = {
  CPIAUCSL: { dayOfMonth: 11, description: 'Released ~10th-12th of each month' },
  CPILFESL: { dayOfMonth: 11, description: 'Released with CPI' },
  PCEPI: { dayOfMonth: 28, description: 'Released ~last week of each month' },
  PCEPILFE: { dayOfMonth: 28, description: 'Released with PCE' },
  PAYEMS: { dayOfMonth: 5, description: 'First Friday of each month' },
  UNRATE: { dayOfMonth: 5, description: 'Released with NFP' },
  ICSA: { dayOfMonth: -1, description: 'Every Thursday' },
  GDP: { dayOfMonth: 28, description: 'Quarterly, ~4 weeks after quarter end' },
  RETAILSMNSA: { dayOfMonth: 15, description: 'Released ~15th-17th of each month' },
  INDPRO: { dayOfMonth: 16, description: 'Released ~mid month' },
  HOUST: { dayOfMonth: 17, description: 'Released ~17th-19th of each month' },
  UMCSENT: { dayOfMonth: 14, description: 'Released ~2nd Friday of month' },
  DFF: { dayOfMonth: -2, description: 'After each FOMC meeting' },
  DPCERA3Q086SBEA: { dayOfMonth: 28, description: 'Quarterly, released with GDP' },
};

const LOWER_IS_BETTER = new Set(['UNRATE', 'ICSA', 'CPIAUCSL', 'CPILFESL', 'PCEPI', 'PCEPILFE']);

type ReportDirection = 'beat' | 'miss' | 'inline' | null;

// ─── JBlanked Configuration ───
const JBLANKED_BASE = 'https://www.jblanked.com/news/api/mql5';

const JBLANKED_TO_FRED_MAP: Record<string, { id: string; category: string; unit: string }> = {
  'CPI':        { id: 'CPIAUCSL', category: 'Inflation',  unit: '%' },
  'Core CPI':   { id: 'CPILFESL', category: 'Inflation',  unit: '%' },
  'Non-Farm Payrolls': { id: 'PAYEMS',   category: 'Employment', unit: 'K' },
  'Unemployment Rate': { id: 'UNRATE',   category: 'Employment', unit: '%' },
  'Initial Jobless Claims': { id: 'ICSA',     category: 'Employment', unit: 'K' },
  'GDP':        { id: 'GDP',      category: 'Growth',     unit: '%' },
  'Retail Sales': { id: 'RETAILSMNSA', category: 'Consumer', unit: '%' },
  'Industrial Production': { id: 'INDPRO',   category: 'Production', unit: '%' },
  'Housing Starts': { id: 'HOUST',    category: 'Housing',    unit: 'M' },
  'Consumer Sentiment': { id: 'UMCSENT',  category: 'Sentiment',  unit: '' },
  'Fed Interest Rate': { id: 'DFF',      category: 'Fed',        unit: '%' },
  'PCE':        { id: 'PCEPI',    category: 'Inflation',  unit: '%' },
  'Core PCE':   { id: 'PCEPILFE', category: 'Inflation',  unit: '%' },
};

// ─── FRED Helpers ───
async function fetchFredSeries(seriesId: string, apiKey: string) {
  const url = `https://api.stlouisfed.org/fred/series/observations?series_id=${seriesId}&api_key=${apiKey}&file_type=json&limit=3&sort_order=desc`;
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`FRED error for ${seriesId}: ${res.status} ${res.statusText} - ${errorText}`);
  }
  const data = await res.json();
  return data.observations || [];
}

function parseValue(value: any): number | null {
  if (value === null || value === undefined || value === '.' || value === '' || value === 'NaN') return null;
  const parsed = parseFloat(String(value));
  return isNaN(parsed) ? null : parsed;
}

function computeNextRelease(seriesId: string, latestDate: Date): string {
  const schedule = RELEASE_SCHEDULE[seriesId];
  if (!schedule) {
    return new Date(latestDate.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  }
  if (schedule.dayOfMonth === -1) {
    const now = new Date();
    const daysUntilThursday = (4 - now.getDay() + 7) % 7 || 7;
    return new Date(now.getTime() + daysUntilThursday * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  }
  const next = new Date(latestDate);
  next.setMonth(next.getMonth() + 1);
  if (schedule.dayOfMonth === -2) {
    next.setDate(1);
  } else {
    next.setDate(schedule.dayOfMonth);
  }
  return next.toISOString().split('T')[0];
}

function computeDirection(seriesId: string, actual: number | null, previous: number | null): ReportDirection {
  if (actual === null || previous === null) return null;
  if (Math.abs(actual - previous) < 0.001) return 'inline';
  const isLowerBetter = LOWER_IS_BETTER.has(seriesId);
  if (isLowerBetter) return actual < previous ? 'beat' : 'miss';
  return actual > previous ? 'beat' : 'miss';
}

// ─── JBlanked Fallback ───
async function fetchJBlankedCalendar(apiKey: string): Promise<any[]> {
  const now = new Date();
  const from = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000); // 90 days back
  const to = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);   // 30 days ahead
  const fromStr = from.toISOString().split('T')[0];
  const toStr = to.toISOString().split('T')[0];

  const url = `${JBLANKED_BASE}/calendar/range/?from=${fromStr}&to=${toStr}&currency=USD&impact=High`;
  const res = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Api-Key ${apiKey}`,
    },
    cache: 'no-store',
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`JBlanked error: ${res.status} - ${text.slice(0, 200)}`);
  }
  return await res.json();
}

function mapJBlankedToReports(jbEvents: any[]): any[] {
  const reports: any[] = [];
  const seen = new Set<string>();

  for (const event of jbEvents) {
    const name = event.Name || event.name || '';
    const mapKey = Object.keys(JBLANKED_TO_FRED_MAP).find(k => name.toLowerCase().includes(k.toLowerCase()));
    if (!mapKey) continue;
    const mapping = JBLANKED_TO_FRED_MAP[mapKey];
    if (seen.has(mapping.id)) continue;
    seen.add(mapping.id);

    const actual = parseValue(event.Actual ?? event.actual);
    const previous = parseValue(event.Previous ?? event.previous);
    const dateStr = event.Date ?? event.date ?? '';
    const dateMatch = dateStr.match(/(\d{4})\.(\d{2})\.(\d{2})/);
    const releaseDate = dateMatch ? `${dateMatch[1]}-${dateMatch[2]}-${dateMatch[3]}` : dateStr.split(' ')[0] || null;

    reports.push({
      id: mapping.id,
      name: mapKey,
      category: mapping.category,
      impact: (event.Impact ?? event.impact ?? 'medium').toLowerCase(),
      releaseDate,
      actual,
      previous,
      isReleased: actual !== null,
      nextRelease: releaseDate,
      scheduleDescription: RELEASE_SCHEDULE[mapping.id]?.description ?? 'From JBlanked calendar',
      unit: mapping.unit,
      direction: computeDirection(mapping.id, actual, previous),
      source: 'JBlanked',
    });
  }

  return reports;
}

// ─── Main Handler ───
export async function GET() {
  const fredKey = process.env.FRED_API_KEY;
  const jbKey = process.env.JBLANKED_API_KEY;
  const fredEmpty = !fredKey || fredKey.trim() === '';
  const jbEmpty = !jbKey || jbKey.trim() === '';

  console.log(`[reports] FRED key present: ${!fredEmpty}, JBlanked key present: ${!jbEmpty}`);

  let errors: string[] = [];
  let reports: any[] = [];
  let source = '';

  // Try FRED first
  if (!fredEmpty) {
    try {
      console.log('[reports] Attempting FRED fetch...');
      const results = await Promise.allSettled(
        FRED_SERIES.map(async (series) => {
          try {
            const obs = await fetchFredSeries(series.id, fredKey);
            const latest = obs[0];
            const previous = obs[1];
            const releaseDate = latest ? new Date(latest.date) : null;
            const actual = parseValue(latest?.value);
            const prev = parseValue(previous?.value);
            return {
              ...series,
              releaseDate: latest?.date ?? null,
              actual,
              previous: prev,
              isReleased: true,
              nextRelease: releaseDate ? computeNextRelease(series.id, releaseDate) : null,
              scheduleDescription: RELEASE_SCHEDULE[series.id]?.description ?? 'Estimated',
              unit: deriveUnit(series.id),
              direction: computeDirection(series.id, actual, prev),
              source: 'FRED',
            };
          } catch (e) {
            console.warn(`[reports] FRED series ${series.id} failed:`, e);
            return { ...series, releaseDate: null, actual: null, previous: null, isReleased: false, nextRelease: null, scheduleDescription: 'Unknown', unit: deriveUnit(series.id), direction: null, source: 'FRED' };
          }
        })
      );
      reports = results.filter((r) => r.status === 'fulfilled').map((r) => (r as PromiseFulfilledResult<any>).value);
      const successful = reports.filter((r: any) => r.actual !== null && !isNaN(r.actual));
      if (successful.length >= 3) {
        source = 'FRED';
        console.log(`[reports] FRED succeeded: ${successful.length} / ${FRED_SERIES.length} series`);
      } else {
        errors.push(`FRED returned only ${successful.length} valid series`);
      }
    } catch (e) {
      errors.push(`FRED failed: ${e instanceof Error ? e.message : String(e)}`);
    }
  } else {
    errors.push('FRED_API_KEY missing or empty');
  }

  // Fallback to JBlanked
  if (source !== 'FRED' && !jbEmpty) {
    try {
      console.log('[reports] Falling back to JBlanked...');
      const jbEvents = await fetchJBlankedCalendar(jbKey);
      reports = mapJBlankedToReports(jbEvents);
      if (reports.length > 0) {
        source = 'JBlanked';
        console.log(`[reports] JBlanked succeeded: ${reports.length} events`);
      } else {
        errors.push('JBlanked returned no matching events');
      }
    } catch (e) {
      errors.push(`JBlanked failed: ${e instanceof Error ? e.message : String(e)}`);
    }
  } else if (source !== 'FRED') {
    errors.push('JBLANKED_API_KEY missing or empty');
  }

  // If both failed, return error with diagnostics
  if (source === '') {
    console.error('[reports] All sources failed:', errors);
    return NextResponse.json(
      {
        error: 'All data sources failed. Add FRED_API_KEY or JBLANKED_API_KEY to .env.local and restart the dev server.',
        details: errors.join(' | '),
        help: 'Get a free FRED key at https://fred.stlouisfed.org/docs/api/api_key.html or a free JBlanked key at https://www.jblanked.com/profile/',
        released: [],
        upcoming: [],
      },
      { status: 500 }
    );
  }

  const released = reports
    .filter((r: any) => r.actual !== null && !isNaN(r.actual))
    .sort((a: any, b: any) => {
      if (!a.releaseDate) return 1;
      if (!b.releaseDate) return -1;
      return new Date(b.releaseDate).getTime() - new Date(a.releaseDate).getTime();
    });

  const upcoming = reports
    .filter((r: any) => r.nextRelease && (!r.actual || isNaN(r.actual)))
    .map((r: any) => ({ ...r, actual: null, isReleased: false, releaseDate: r.nextRelease, direction: null }))
    .sort((a: any, b: any) => new Date(a.releaseDate).getTime() - new Date(b.releaseDate).getTime());

  return NextResponse.json({
    released,
    upcoming,
    fetchedAt: Date.now(),
    source,
    warnings: errors.length > 0 ? errors : undefined,
  });
}

function deriveUnit(seriesId: string): string {
  if (['UNRATE', 'CPIAUCSL', 'CPILFESL', 'PCEPI', 'PCEPILFE', 'GDP', 'DFF'].includes(seriesId)) return '%';
  if (seriesId === 'PAYEMS' || seriesId === 'ICSA') return 'K';
  return '';
}
