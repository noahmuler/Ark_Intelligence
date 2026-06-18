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

async function fetchFredSeries(seriesId: string, apiKey: string) {
  const url = `https://api.stlouisfed.org/fred/series/observations?series_id=${seriesId}&api_key=${apiKey}&file_type=json&limit=3&sort_order=desc`;
  const res = await fetch(url, { next: { revalidate: 3600 } });
  if (!res.ok) throw new Error(`FRED error for ${seriesId}`);
  const data = await res.json();
  return data.observations || [];
}

export async function GET() {
  const apiKey = process.env.FRED_API_KEY;
  if (!apiKey || apiKey === '') {
    return NextResponse.json(
      { error: 'FRED_API_KEY is missing. Please add your FRED API key to .env.local. Get a free key at https://fred.stlouisfed.org/docs/api/api_key.html' },
      { status: 500 }
    );
  }

  const now = new Date();

  const results = await Promise.allSettled(
    FRED_SERIES.map(async (series) => {
      const obs = await fetchFredSeries(series.id, apiKey);
      // obs[0] = most recent, obs[1] = previous, obs[2] = two periods ago
      const latest = obs[0];
      const previous = obs[1];

      const releaseDate = latest ? new Date(latest.date) : null;
      const isReleased = releaseDate ? releaseDate <= now : false;
      const actualValue = latest?.value !== '.' ? parseFloat(latest?.value) : null;
      const previousValue = previous?.value !== '.' ? parseFloat(previous?.value) : null;

      return {
        ...series,
        releaseDate: latest?.date,
        actual: isReleased ? actualValue : null,
        previous: previousValue,
        isReleased,
        // Estimate next release: roughly 1 month after latest
        nextRelease: releaseDate
          ? new Date(releaseDate.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
          : null,
        unit: deriveUnit(series.id),
        direction: actualValue && previousValue
          ? actualValue > previousValue ? 'beat' : actualValue < previousValue ? 'miss' : 'inline'
          : null,
      };
    })
  );

  const reports = results
    .filter((r) => r.status === 'fulfilled')
    .map((r) => (r as PromiseFulfilledResult<object>).value);

  // Sort: released (most recent first), then upcoming
  const released = reports
    .filter((r: any) => r.isReleased)
    .sort((a: any, b: any) => new Date(b.releaseDate).getTime() - new Date(a.releaseDate).getTime());

  const upcoming = reports
    .filter((r: any) => !r.isReleased)
    .sort((a: any, b: any) => new Date(a.nextRelease).getTime() - new Date(b.nextRelease).getTime());

  return NextResponse.json({ released, upcoming, fetchedAt: Date.now() });
}

function deriveUnit(seriesId: string): string {
  if (['UNRATE', 'CPIAUCSL', 'CPILFESL', 'PCEPI', 'PCEPILFE', 'GDP', 'DFF'].includes(seriesId)) return '%';
  if (seriesId === 'PAYEMS') return 'K';
  if (seriesId === 'ICSA') return 'K';
  return '';
}
