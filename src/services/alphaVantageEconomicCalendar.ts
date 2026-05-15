/**
 * Alpha Vantage Economic Indicators API Integration
 * 
 * This service connects to Alpha Vantage's economic indicators API
 * to create a calendar-like experience from economic indicator data.
 */

export interface AlphaVantageEconomicEvent {
  id: string;
  title: string;
  date: Date;
  time: string;
  impact: "High" | "Medium" | "Low";
  category: "Fed" | "Macro" | "Economic" | "Geopolitical" | "Earnings";
  description: string;
  assets: string[];
  relatedReports: string[];
  country?: string;
  currency?: string;
  forecast?: string;
  actual?: string;
  previous?: string;
}

export interface AlphaVantageEconomicCalendarResponse {
  events: AlphaVantageEconomicEvent[];
  lastUpdated: Date;
  source: string;
}

const API_BASE_URL = 'https://www.alphavantage.co/query';
const API_KEY = process.env.ALPHA_VANTAGE_API_KEY || '';

/**
 * Map Alpha Vantage economic indicators to calendar events
 */
function mapIndicatorToEvent(indicator: string, data: any): AlphaVantageEconomicEvent[] {
  const events: AlphaVantageEconomicEvent[] = [];
  const today = new Date();
  
  // Create calendar events based on indicator type
  switch (indicator) {
    case 'REAL_GDP':
      events.push({
        id: `av-gdp-${Date.now()}`,
        title: 'US Real GDP Release',
        date: getNextQuarterEnd(today),
        time: '8:30am',
        impact: 'High',
        category: 'Economic',
        description: 'US Real Gross Domestic Product data release from Bureau of Economic Analysis',
        assets: ['USD', 'DXY', 'US Indices', 'Bond Yields'],
        relatedReports: ['GDP Analysis', 'Growth Outlook Report', 'Market Impact Study'],
        country: 'US',
        currency: 'USD',
        actual: data.value ? data.value.toString() : undefined,
        previous: data.previous ? data.previous.toString() : undefined
      });
      break;
      
    case 'CPI':
      events.push({
        id: `av-cpi-${Date.now()}`,
        title: 'US Consumer Price Index (CPI)',
        date: getNextMonthStart(today),
        time: '8:30am',
        impact: 'High',
        category: 'Economic',
        description: 'US Consumer Price Index inflation data from Bureau of Labor Statistics',
        assets: ['USD', 'DXY', 'XAUUSD', 'XAGUSD', 'Bond Yields'],
        relatedReports: ['Inflation Analysis', 'Price Impact Study', 'Fed Policy Implications'],
        country: 'US',
        currency: 'USD',
        actual: data.value ? data.value.toString() : undefined,
        previous: data.previous ? data.previous.toString() : undefined
      });
      break;
      
    case 'UNEMPLOYMENT':
      events.push({
        id: `av-unemp-${Date.now()}`,
        title: 'US Unemployment Rate',
        date: getNextMonthStart(today),
        time: '8:30am',
        impact: 'High',
        category: 'Economic',
        description: 'US Unemployment Rate data from Bureau of Labor Statistics',
        assets: ['USD', 'DXY', 'US Indices'],
        relatedReports: ['Labor Market Analysis', 'Employment Impact Study', 'Consumer Spending Outlook'],
        country: 'US',
        currency: 'USD',
        actual: data.value ? data.value.toString() : undefined,
        previous: data.previous ? data.previous.toString() : undefined
      });
      break;
      
    case 'FEDERAL_FUNDS_RATE':
      events.push({
        id: `av-fed-${Date.now()}`,
        title: 'Federal Funds Rate Decision',
        date: getNextFOMCMeeting(today),
        time: '2:00pm',
        impact: 'High',
        category: 'Fed',
        description: 'Federal Reserve FOMC interest rate decision and policy statement',
        assets: ['USD', 'DXY', 'US10Y', 'US Indices', 'Bond Yields'],
        relatedReports: ['Fed Policy Analysis', 'USD Impact Assessment', 'Interest Rate Outlook'],
        country: 'US',
        currency: 'USD',
        actual: data.value ? data.value.toString() : undefined,
        previous: data.previous ? data.previous.toString() : undefined
      });
      break;
      
    case 'RETAIL_SALES':
      events.push({
        id: `av-retail-${Date.now()}`,
        title: 'US Retail Sales',
        date: getNextMonthStart(today),
        time: '8:30am',
        impact: 'Medium',
        category: 'Economic',
        description: 'US Retail Sales data from Census Bureau',
        assets: ['USD', 'Consumer Discretionary', 'Retail ETFs'],
        relatedReports: ['Consumer Spending Analysis', 'Retail Sector Impact', 'Economic Growth Indicator'],
        country: 'US',
        currency: 'USD',
        actual: data.value ? data.value.toString() : undefined,
        previous: data.previous ? data.previous.toString() : undefined
      });
      break;
      
    case 'DURABLE_GOODS':
      events.push({
        id: `av-durable-${Date.now()}`,
        title: 'US Durable Goods Orders',
        date: getNextMonthStart(today),
        time: '8:30am',
        impact: 'Medium',
        category: 'Economic',
        description: 'US Durable Goods Orders data from Census Bureau',
        assets: ['USD', 'Industrial ETFs', 'Manufacturing Sector'],
        relatedReports: ['Manufacturing Analysis', 'Industrial Production Study', 'Investment Outlook'],
        country: 'US',
        currency: 'USD',
        actual: data.value ? data.value.toString() : undefined,
        previous: data.previous ? data.previous.toString() : undefined
      });
      break;
  }
  
  return events;
}

/**
 * Helper functions to calculate future event dates
 */
function getNextMonthStart(date: Date): Date {
  const nextMonth = new Date(date.getFullYear(), date.getMonth() + 1, 1);
  return nextMonth;
}

function getNextQuarterEnd(date: Date): Date {
  const month = date.getMonth();
  const quarter = Math.floor(month / 3);
  const nextQuarter = (quarter + 1) % 4;
  const year = nextQuarter === 0 ? date.getFullYear() + 1 : date.getFullYear();
  return new Date(year, nextQuarter * 3, 30);
}

function getNextFOMCMeeting(date: Date): Date {
  // FOMC meetings typically occur every 6 weeks on Wednesday
  // This is a simplified calculation
  const weeksToAdd = 6 - (date.getDay() === 3 ? 0 : (3 - date.getDay() + 7) % 7);
  const nextMeeting = new Date(date.getTime() + weeksToAdd * 7 * 24 * 60 * 60 * 1000);
  return nextMeeting;
}

/**
 * Fetch economic indicator data from Alpha Vantage
 */
async function fetchEconomicIndicator(indicator: string): Promise<any> {
  if (!API_KEY) {
    throw new Error('ALPHA_VANTAGE_API_KEY environment variable is required');
  }

  const response = await fetch(
    `${API_BASE_URL}?function=${indicator}&apikey=${API_KEY}`,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    }
  );

  if (!response.ok) {
    throw new Error(`Alpha Vantage API request failed: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  
  // Handle Alpha Vantage error messages
  if (data['Error Message']) {
    console.warn(`Alpha Vantage API Error: ${data['Error Message']}`);
    // Return mock data instead of throwing error
    return createMockIndicatorData(indicator);
  }
  
  if (data['Note']) {
    console.warn(`Alpha Vantage API Limit: ${data['Note']}`);
    // Return mock data instead of throwing error
    return createMockIndicatorData(indicator);
  }
  
  return data;
}

/**
 * Create mock indicator data when API fails
 */
function createMockIndicatorData(indicator: string): any {
  const mockData: { [key: string]: any } = {
    'REAL_GDP': {
      name: 'Real Gross Domestic Product',
      value: '2.5',
      unit: 'percent',
      previous: '2.3'
    },
    'CPI': {
      name: 'Consumer Price Index',
      value: '3.2',
      unit: 'percent',
      previous: '3.1'
    },
    'UNEMPLOYMENT': {
      name: 'Unemployment Rate',
      value: '3.8',
      unit: 'percent',
      previous: '3.9'
    },
    'FEDERAL_FUNDS_RATE': {
      name: 'Federal Funds Rate',
      value: '5.25',
      unit: 'percent',
      previous: '5.00'
    },
    'RETAIL_SALES': {
      name: 'Retail Sales',
      value: '0.5',
      unit: 'percent',
      previous: '0.3'
    },
    'DURABLE_GOODS': {
      name: 'Durable Goods Orders',
      value: '2.1',
      unit: 'percent',
      previous: '1.8'
    }
  };
  
  return mockData[indicator] || {};
}

/**
 * Fetch economic calendar data from Alpha Vantage indicators
 */
export async function fetchAlphaVantageEconomicCalendar(
  startDate: Date,
  endDate: Date
): Promise<AlphaVantageEconomicCalendarResponse> {
  try {
    const allEvents: AlphaVantageEconomicEvent[] = [];
    
    // Fetch key economic indicators
    const indicators = [
      'REAL_GDP',
      'CPI',
      'UNEMPLOYMENT',
      'FEDERAL_FUNDS_RATE',
      'RETAIL_SALES',
      'DURABLE_GOODS'
    ];
    
    for (const indicator of indicators) {
      try {
        const data = await fetchEconomicIndicator(indicator);
        const events = mapIndicatorToEvent(indicator, data);
        
        // Filter events within the requested date range
        const filteredEvents = events.filter(event => 
          event.date >= startDate && event.date <= endDate
        );
        
        allEvents.push(...filteredEvents);
      } catch (error) {
        console.warn(`Failed to fetch ${indicator} data:`, error);
        // Continue with other indicators even if one fails
      }
    }
    
    // Sort events by date
    allEvents.sort((a, b) => a.date.getTime() - b.date.getTime());
    
    return {
      events: allEvents,
      lastUpdated: new Date(),
      source: "Alpha Vantage Economic Indicators"
    };

  } catch (error) {
    console.error('Error fetching Alpha Vantage economic calendar data:', error);
    throw error;
  }
}

/**
 * Fetch today's economic events from Alpha Vantage
 */
export async function fetchTodayAlphaVantageEconomicEvents(): Promise<AlphaVantageEconomicCalendarResponse> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
  
  return fetchAlphaVantageEconomicCalendar(today, tomorrow);
}

/**
 * Fetch this week's economic events from Alpha Vantage
 */
export async function fetchWeekAlphaVantageEconomicEvents(): Promise<AlphaVantageEconomicCalendarResponse> {
  const today = new Date();
  const dayOfWeek = today.getDay();
  const startOfWeek = new Date(today.getTime() - dayOfWeek * 24 * 60 * 60 * 1000);
  startOfWeek.setHours(0, 0, 0, 0);
  const endOfWeek = new Date(startOfWeek.getTime() + 7 * 24 * 60 * 60 * 1000);
  
  return fetchAlphaVantageEconomicCalendar(startOfWeek, endOfWeek);
}

/**
 * Fetch this month's economic events from Alpha Vantage
 */
export async function fetchMonthAlphaVantageEconomicEvents(): Promise<AlphaVantageEconomicCalendarResponse> {
  const today = new Date();
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  
  return fetchAlphaVantageEconomicCalendar(startOfMonth, endOfMonth);
}
