import { EconomicCalendarResponse, EconomicEvent } from './economicCalendar';

/**
 * Fetch economic calendar data from Twelve Data API.
 * The API key is read from the environment variable NEXT_PUBLIC_TWELVEDATA_API_KEY (client) or TWELVEDATA_API_KEY (server).
 */
export async function fetchTwelveDataEconomicCalendar(startDate: Date, endDate: Date): Promise<EconomicCalendarResponse> {
  const apiKey = process.env.NEXT_PUBLIC_TWELVEDATA_API_KEY || process.env.TWELVEDATA_API_KEY;
  if (!apiKey) throw new Error('TWELVEDATA_API_KEY or NEXT_PUBLIC_TWELVEDATA_API_KEY must be set in environment');

  // Twelve Data provides a date range filter via start_date and end_date parameters (YYYY-MM-DD).
  const start = startDate.toISOString().split('T')[0];
  const end = endDate.toISOString().split('T')[0];
  const url = `https://api.twelvedata.com/economic_calendar?start_date=${start}&end_date=${end}&apikey=${apiKey}`;

  const resp = await fetch(url);
  if (!resp.ok) {
    const txt = await resp.text();
    throw new Error(`Twelve Data API error ${resp.status}: ${txt}`);
  }
  const data = await resp.json();
  // API returns { results: [...] } where each result is an event.
  const events: EconomicEvent[] = (data.results || []).map((e: any) => {
    const date = new Date(e.date + 'T' + (e.time || '00:00'));
    return {
      id: e.id?.toString() || `${date.getTime()}`,
      title: e.title || e.event || 'Unknown',
      date: date.toISOString(),
      time: e.time || '00:00',
      impact: e.impact || 'Medium',
      category: e.country ? e.country : 'Economic',
      description: e.description || '',
      assets: e.currency ? [e.currency] : [],
      relatedReports: [],
      actual: e.actual,
      forecast: e.forecast,
      previous: e.previous,
      currency: e.currency,
    } as EconomicEvent;
  });

  return {
    events,
    lastUpdated: new Date().toISOString(),
    source: 'Twelve Data API',
  };
}

/** Fetch today's events from Twelve Data */
export async function fetchTodayTwelveDataEconomicEvents(): Promise<EconomicCalendarResponse> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
  return fetchTwelveDataEconomicCalendar(today, tomorrow);
}

/** Fetch week events from Twelve Data */
export async function fetchWeekTwelveDataEconomicEvents(): Promise<EconomicCalendarResponse> {
  const now = new Date();
  const day = now.getDay();
  const start = new Date(now.getTime() - day * 24 * 60 * 60 * 1000);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start.getTime() + 7 * 24 * 60 * 60 * 1000);
  return fetchTwelveDataEconomicCalendar(start, end);
}
