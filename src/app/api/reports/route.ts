import { NextResponse } from 'next/server';

// Key FRED series for major US economic reports
const FRED_SERIES = [
  { id: 'CPIAUCSL',    name: 'CPI (YoY)',          category: 'Inflation',   impact: 'high' },
  { id: 'CPILFESL',    name: 'Core CPI',            category: 'Inflation',   impact: 'high' },
  { id: 'PCEPI',       name: 'PCE Price Index',      category: 'Inflation',   impact: 'high' },
  { id: 'PCEPILFE',    name: 'Core PCE',             category: 'Inflation',   impact: 'high' },
  { id: 'PAYEMS',      name: 'Non-Farm Payrolls',    category: 'Employment',  impact: 'high' },
  { id: 'UNRATE',      name: 'Unemployment Rate',    category: 'Employment',  impact: 'high' },
  { id: 'ICSA',        name: 'Initial Jobless Claims', category: 'Employment', impact: 'medium' },
  { id: 'GDP',         name: 'GDP (QoQ)',            category: 'Growth',      impact: 'high' },
  { id: 'RETAILSMNSA', name: 'Retail Sales',         category: 'Consumer',   impact: 'high' },
  { id: 'INDPRO',      name: 'Industrial Production', category: 'Production', impact: 'medium' },
  { id: 'HOUST',       name: 'Housing Starts',       category: 'Housing',    impact: 'medium' },
  { id: 'UMCSENT',     name: 'UMich Sentiment',      category: 'Sentiment',  impact: 'medium' },
  { id: 'DFF',         name: 'Fed Funds Rate',       category: 'Fed',        impact: 'high' },
  { id: 'DPCERA3Q086SBEA', name: 'PCE (QoQ)',        category: 'Inflation',  impact: 'high' },
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

const LOWER_IS_BETTER = new Set([
  'UNRATE',
  'ICSA',
  'CPIAUCSL',
  'CPILFESL',
  'PCEPI',
  'PCEPILFE',
]);

type ReportDirection = 'beat' | 'miss' | 'inline' | null;

async function fetchFredSeries(seriesId: string, apiKey: string) {
  const url = `https://api.stlouisfed.org/fred/series/observations?series_id=${seriesId}&api_key=${apiKey}&file_type=json&limit=3&sort_order=desc`;
  const res = await fetch(url, { next: { revalidate: 3600 } });
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`FRED error for ${seriesId}: ${res.status} ${res.statusText} - ${errorText}`);
  }
  const data = await res.json();
  return data.observations || [];
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

function computeDirection(seriesId: string, actualValue: number | null, previousValue: number | null): ReportDirection {
  if (actualValue === null || previousValue === null) return null;
  if (Math.abs(actualValue - previousValue) < 0.001) return 'inline';

  const isLowerBetter = LOWER_IS_BETTER.has(seriesId);
  if (isLowerBetter) {
    return actualValue < previousValue ? 'beat' : 'miss';
  }
  return actualValue > previousValue ? 'beat' : 'miss';
}

export async function GET() {
  try {
    const apiKey = process.env.FRED_API_KEY;
    if (!apiKey || apiKey === '') {
      return NextResponse.json(
        { error: 'FRED_API_KEY is missing. Please add your FRED API key to .env.local. Get a free key at https://fred.stlouisfed.org/docs/api/api_key.html' },
        { status: 500 }
      );
    }

    const results = await Promise.allSettled(
      FRED_SERIES.map(async (series) => {
        const obs = await fetchFredSeries(series.id, apiKey);
        // obs[0] = most recent, obs[1] = previous, obs[2] = two periods ago
        const latest = obs[0];
        const previous = obs[1];

        const releaseDate = latest ? new Date(latest.date) : null;
        const actualValue = latest?.value !== '.' ? parseFloat(latest?.value) : null;
        const previousValue = previous?.value !== '.' ? parseFloat(previous?.value) : null;
        const direction = computeDirection(series.id, actualValue, previousValue);
        const nextRelease = releaseDate ? computeNextRelease(series.id, releaseDate) : null;

        return {
          ...series,
          releaseDate: latest?.date,
          actual: actualValue,
          previous: previousValue,
          isReleased: true,
          nextRelease,
          scheduleDescription: RELEASE_SCHEDULE[series.id]?.description ?? 'Estimated from latest observation',
          unit: deriveUnit(series.id),
          direction,
        };
      })
    );

    const reports = results
      .filter((r) => r.status === 'fulfilled')
      .map((r) => (r as PromiseFulfilledResult<object>).value);

    const released = reports
      .filter((r: any) => r.actual !== null)
      .sort((a: any, b: any) => new Date(b.releaseDate).getTime() - new Date(a.releaseDate).getTime());

    const upcoming = reports.map((r: any) => ({
      ...r,
      actual: null,
      isReleased: false,
      releaseDate: r.nextRelease,
      direction: null,
    })).sort((a: any, b: any) => new Date(a.releaseDate).getTime() - new Date(b.releaseDate).getTime());

    return NextResponse.json({ released, upcoming, fetchedAt: Date.now() });
  } catch (error) {
    console.error('Reports API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error occurred', details: String(error) },
      { status: 500 }
    );
  }
}

function deriveUnit(seriesId: string): string {
  if (['UNRATE', 'CPIAUCSL', 'CPILFESL', 'PCEPI', 'PCEPILFE', 'GDP', 'DFF'].includes(seriesId)) return '%';
  if (seriesId === 'PAYEMS') return 'K';
  if (seriesId === 'ICSA') return 'K';
  return '';
}
