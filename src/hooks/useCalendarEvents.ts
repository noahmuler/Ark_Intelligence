import { useQuery } from '@tanstack/react-query';

export interface CalendarEvent {
  id: string;
  title: string;
  currency: string;
  country: string;
  impact: 'HIGH' | 'MEDIUM' | 'LOW';
  dateUtc: string;
  actual: string | null;
  forecast: string | null;
  previous: string | null;
}

async function fetchEvents(from: string, to: string): Promise<CalendarEvent[]> {
  const res = await fetch(`/api/calendar/events?from=${from}&to=${to}`);
  if (!res.ok) throw new Error('Failed to fetch calendar events');
  return res.json();
}

// ALWAYS use local timezone date string, never UTC
// This prevents the "wrong day" bug for UTC+ users at midnight
function toLocalDateParam(d: Date): string {
  // en-CA locale gives YYYY-MM-DD format naturally
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(d);
}

// Get Sunday of the week containing the given date (local timezone)
function getWeekStart(d: Date): Date {
  const localDateStr = toLocalDateParam(d); // YYYY-MM-DD local
  const [y, mo, da] = localDateStr.split('-').map(Number);
  const localDate = new Date(y, mo - 1, da); // midnight LOCAL
  const dayOfWeek = localDate.getDay(); // 0=Sun
  const sunday = new Date(localDate);
  sunday.setDate(localDate.getDate() - dayOfWeek);
  return sunday;
}

export function useCalendarEvents(
  view: 'today' | 'tomorrow' | 'week',
  customDate?: string,
) {
  const now = new Date();
  const todayLocal = toLocalDateParam(now);

  let from: string;
  let to: string;

  if (customDate) {
    // Custom: query a ±1 day buffer so timezone edge cases don't miss events
    from = to = customDate;
  } else if (view === 'today' || view === 'tomorrow') {
    // CRITICAL FIX: Always query the FULL current week from the API.
    // Single-day JBlanked queries return [] — multi-day works correctly.
    // The page's getEventsForInterval already filters by the correct local date.
    const sunday = getWeekStart(now);
    const saturday = new Date(sunday);
    saturday.setDate(sunday.getDate() + 6);
    from = toLocalDateParam(sunday);
    to = toLocalDateParam(saturday);
  } else {
    // 'week': Sun → Sat of current week
    const sunday = getWeekStart(now);
    const saturday = new Date(sunday);
    saturday.setDate(sunday.getDate() + 6);
    from = toLocalDateParam(sunday);
    to = toLocalDateParam(saturday);
  }

  return useQuery<CalendarEvent[]>({
    queryKey: ['calendarEvents', view, from, to, todayLocal],
    queryFn: () => fetchEvents(from, to),
    staleTime: 5 * 60 * 1000,
    refetchInterval: 5 * 60 * 1000,
    retry: 2,
    retryDelay: 1000,
  });
}


