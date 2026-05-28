/**
 * Economic Calendar Service
 * 
 * This service handles fetching real economic events data from various APIs.
 * Only real data is returned - no mock or fallback data.
 */

export interface EconomicEvent {
  id: string;
  title: string;
  date: string; // ISO string instead of Date
  time: string;
  impact: "High" | "Medium" | "Low";
  category: "Fed" | "Macro" | "Economic" | "Geopolitical" | "Earnings";
  description: string;
  assets: string[];
  relatedReports: string[];
  actual?: string;
  forecast?: string;
  previous?: string;
  currency?: string;
}

export interface EconomicCalendarResponse {
  events: EconomicEvent[];
  lastUpdated: string; // ISO string instead of Date
  source: string;
}

/**
 * Fetch economic calendar data from real APIs only
 * Tries Alpha Vantage -> Finnhub -> Twelve Data in order
 */
export async function fetchEconomicCalendar(
  startDate: Date,
  endDate?: Date
): Promise<EconomicCalendarResponse> {
  const end = endDate || new Date(startDate.getTime() + 30 * 24 * 60 * 60 * 1000);
  
  // Try Alpha Vantage first
  try {
    const { fetchAlphaVantageEconomicCalendar } = await import('./alphaVantageEconomicCalendar');
    const result = await fetchAlphaVantageEconomicCalendar(startDate, end);
    console.log('Alpha Vantage calendar fetched successfully');
    return result;
  } catch (error) {
    console.warn('Failed to fetch Alpha Vantage data, trying Finnhub:', error);
    // Try Finnhub
    try {
      const { fetchFinnhubEconomicCalendar } = await import('./finnhubEconomicCalendar');
      const result = await fetchFinnhubEconomicCalendar(startDate, end);
      console.log('Finnhub calendar fetched successfully');
      return result;
    } catch (finnhubError) {
      console.warn('Finnhub failed, trying Twelve Data:', finnhubError);
      // Try Twelve Data
      try {
        const { fetchTwelveDataEconomicCalendar } = await import('./twelvedataEconomicCalendar');
        const result = await fetchTwelveDataEconomicCalendar(startDate, end);
        console.log('Twelve Data calendar fetched successfully');
        return result;
      } catch (twelveError) {
        console.error('Failed to fetch real economic data from all providers.', twelveError);
        throw new Error('Unable to fetch real economic calendar data from any provider.');
      }
    }
  }
}

/**
 * Fetch today's economic events from real APIs only
 */
export async function fetchTodayEconomicEvents(): Promise<EconomicCalendarResponse> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);

  // Try Alpha Vantage first
  try {
    const { fetchTodayAlphaVantageEconomicEvents } = await import('./alphaVantageEconomicCalendar');
    const result = await fetchTodayAlphaVantageEconomicEvents();
    if (result.events && result.events.length > 0) {
      return result;
    }
    console.warn('Alpha Vantage returned no events for today, trying Finnhub.');
  } catch (error) {
    console.warn('Failed to fetch Alpha Vantage today data:', error);
  }

  // Try Finnhub
  try {
    const { fetchTodayFinnhubEconomicEvents } = await import('./finnhubEconomicCalendar');
    const result = await fetchTodayFinnhubEconomicEvents();
    if (result.events && result.events.length > 0) {
      return result;
    }
    console.warn('Finnhub returned no events for today.');
  } catch (finnhubError) {
    console.warn('Finnhub failed, trying Twelve Data:', finnhubError);
    try {
      const { fetchTodayTwelveDataEconomicEvents } = await import('./twelvedataEconomicCalendar');
      const result = await fetchTodayTwelveDataEconomicEvents();
      if (result.events && result.events.length > 0) {
        return result;
      }
      console.warn('Twelve Data returned no events for today.');
    } catch (twelveError) {
      console.error('Failed to fetch today economic data from all providers.', twelveError);
    }
    throw new Error('Unable to fetch real today economic data from any provider.');
  }

  throw new Error('No real today economic events available from any provider.');
}

/**
 * Fetch week economic events from real APIs only
 */
export async function fetchWeekEconomicEvents(): Promise<EconomicCalendarResponse> {
  const today = new Date();
  const dayOfWeek = today.getDay();
  const startOfWeek = new Date(today.getTime() - dayOfWeek * 24 * 60 * 60 * 1000);
  startOfWeek.setHours(0, 0, 0, 0);
  const endOfWeek = new Date(startOfWeek.getTime() + 7 * 24 * 60 * 60 * 1000);

  // Try Alpha Vantage first
  try {
    const { fetchWeekAlphaVantageEconomicEvents } = await import('./alphaVantageEconomicCalendar');
    const result = await fetchWeekAlphaVantageEconomicEvents();
    if (result.events && result.events.length > 0) {
      return result;
    }
    console.warn('Alpha Vantage returned no events for week, trying Finnhub.');
  } catch (error) {
    console.warn('Failed to fetch Alpha Vantage week data:', error);
  }

  // Try Finnhub
  try {
    const { fetchWeekFinnhubEconomicEvents } = await import('./finnhubEconomicCalendar');
    const result = await fetchWeekFinnhubEconomicEvents();
    if (result.events && result.events.length > 0) {
      return result;
    }
    console.warn('Finnhub returned no events for week.');
  } catch (finnhubError) {
    console.warn('Finnhub failed, trying Twelve Data:', finnhubError);
    try {
      const { fetchWeekTwelveDataEconomicEvents } = await import('./twelvedataEconomicCalendar');
      const result = await fetchWeekTwelveDataEconomicEvents();
      if (result.events && result.events.length > 0) {
        return result;
      }
      console.warn('Twelve Data returned no events for week.');
    } catch (twelveError) {
      console.error('Failed to fetch week economic data from all providers.', twelveError);
    }
    throw new Error('Unable to fetch real week economic data from any provider.');
  }

  throw new Error('No real week economic events available from any provider.');
}

/**
 * Fetch month economic events from real APIs only
 */
export async function fetchMonthEconomicEvents(): Promise<EconomicCalendarResponse> {
  const today = new Date();
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  
  // Try Alpha Vantage first
  try {
    const { fetchMonthAlphaVantageEconomicEvents } = await import('./alphaVantageEconomicCalendar');
    const result = await fetchMonthAlphaVantageEconomicEvents();
    if (result.events.length > 0) {
      return result;
    }
  } catch (error) {
    console.warn('Failed to fetch Alpha Vantage data:', error);
  }
  
  throw new Error('Unable to fetch real month economic data from Alpha Vantage API.');
}
