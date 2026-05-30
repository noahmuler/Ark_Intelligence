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

function toDateParam(d: Date) {
  return d.toISOString().split('T')[0];
}

export function useCalendarEvents(
  view: 'today' | 'tomorrow' | 'week',
  customDate?: string,
) {
  const now = new Date();

  let from: string;
  let to: string;

  // If customDate is provided, always use it (overrides view)
  if (customDate) {
    from = to = customDate;
  } else if (view === 'today') {
    from = to = toDateParam(now);
  } else if (view === 'tomorrow') {
    const tomorrow = new Date(now);
    tomorrow.setDate(now.getDate() + 1);
    from = to = toDateParam(tomorrow);
  } else if (view === 'week') {
    // Sunday → Saturday of current week
    const sunday = new Date(now);
    sunday.setDate(now.getDate() - now.getDay());
    const saturday = new Date(sunday);
    saturday.setDate(saturday.getDate() + 6);
    from = toDateParam(sunday);
    to = toDateParam(saturday);
  } else {
    from = to = toDateParam(now);
  }

  return useQuery<CalendarEvent[]>({
    queryKey: ['calendarEvents', view, from, to],
    queryFn: () => fetchEvents(from, to),
    staleTime: 5 * 60 * 1000,
    refetchInterval: 5 * 60 * 1000,
    retry: 2,
    retryDelay: 1000,
  });
}


