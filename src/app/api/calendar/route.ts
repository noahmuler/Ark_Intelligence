// API route for fetching economic calendar data via Convex actions
import { NextRequest, NextResponse } from 'next/server';
import { ConvexHttpClient } from 'convex/nextjs';
import { api } from '../../../../convex/_generated/api';

// Helper function to generate deterministic hash from string
const stringHash = (str: string): number => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
};

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const viewType = searchParams.get('viewType') || 'day';
    const date = searchParams.get('date');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const client = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
    let response: any;

    if (viewType === 'today') {
      response = await client.action(api.today.fetchToday, {});
    } else if (viewType === 'week') {
      response = await client.action(api.week.fetchWeek, {});
    } else if (viewType === 'day' && date) {
      const targetDate = new Date(date);
      if (isNaN(targetDate.getTime())) {
        return NextResponse.json({ error: 'Invalid date parameter', events: [], source: 'Error' }, { status: 400 });
      }
      const nextDay = new Date(targetDate.getTime() + 24 * 60 * 60 * 1000);
      response = await client.action(api.economicCalendar.fetchEconomicCalendar, {
        startDate: targetDate.toISOString(),
        endDate: nextDay.toISOString(),
      });
    } else if (startDate && endDate) {
      response = await client.action(api.economicCalendar.fetchEconomicCalendar, { startDate, endDate });
    } else {
      // Default to today
      response = await client.action(api.today.fetchToday, {});
    }

    // Transform events to match the UI requirements
    const transformedEvents = (response.events || []).map((event: any) => ({
      id: event.id,
      time: event.time,
      currency: event.currency || 'USD',
      impact: event.impact,
      title: event.title,
      confidence: `${(stringHash(event.id) % 31 + 60)}%`,
      date: new Date(event.date).toISOString(),
      actual: event.actual,
      forecast: event.forecast,
      previous: event.previous,
      description: event.description,
      category: event.category,
      assets: event.assets,
    }));

    return NextResponse.json({
      events: transformedEvents,
      source: response.source,
      lastUpdated: response.lastUpdated,
    });
  } catch (error) {
    console.error('Calendar API error:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to fetch calendar data',
        events: [],
        source: 'Error',
      },
      { status: 502 }
    );
  }
}
