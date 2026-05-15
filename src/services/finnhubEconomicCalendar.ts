/**
 * Finnhub Economic Calendar API Integration
 * 
 * This service connects to Finnhub's economic calendar API
 * to fetch real economic events data.
 */

export interface FinnhubEconomicEvent {
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

export interface FinnhubEconomicCalendarResponse {
  events: FinnhubEconomicEvent[];
  lastUpdated: Date;
  source: string;
}

const API_BASE_URL = 'https://finnhub.io/api/v1';
const API_KEY = process.env.FINNHUB_API_KEY || '';

/**
 * Map Finnhub impact levels to our internal impact levels
 */
function mapImpact(apiImpact?: string): "High" | "Medium" | "Low" {
  if (!apiImpact) return "Low";
  
  const impact = apiImpact.toLowerCase();
  if (impact.includes('high') || impact === 'high') return "High";
  if (impact.includes('medium') || impact === 'medium') return "Medium";
  return "Low";
}

/**
 * Map Finnhub categories to our internal categories
 */
function mapCategory(title: string, country?: string): "Fed" | "Macro" | "Economic" | "Geopolitical" | "Earnings" {
  const titleLower = title.toLowerCase();
  const countryLower = country?.toLowerCase() || '';
  
  // Fed-related events
  if (countryLower === 'us' && 
      (titleLower.includes('federal') || titleLower.includes('fed') || titleLower.includes('fomc') || 
       titleLower.includes('interest rate') && titleLower.includes('decision'))) {
    return 'Fed';
  }
  
  // Central bank events (non-US)
  if (titleLower.includes('central bank') || titleLower.includes('monetary') || 
      titleLower.includes('interest rate') || titleLower.includes('ecb') || 
      titleLower.includes('boj') || titleLower.includes('bank of')) {
    return 'Macro';
  }
  
  // Geopolitical events
  if (titleLower.includes('election') || titleLower.includes('brexit') || 
      titleLower.includes('trade war') || titleLower.includes('geopolitical') ||
      titleLower.includes('opec') || titleLower.includes('summit')) {
    return 'Geopolitical';
  }
  
  // Earnings
  if (titleLower.includes('earnings') || titleLower.includes('profit') || 
      titleLower.includes('revenue') || titleLower.includes('quarterly results')) {
    return 'Earnings';
  }
  
  // Default to Economic
  return 'Economic';
}

/**
 * Determine affected assets based on country, category, and event type
 */
function determineAssets(country?: string, category?: string, title?: string): string[] {
  const assets: string[] = [];
  const countryLower = country?.toLowerCase() || '';
  const categoryLower = category?.toLowerCase() || '';
  const titleLower = title?.toLowerCase() || '';
  
  // Country-specific assets
  if (countryLower === 'us' || countryLower === 'united states') {
    assets.push('USD', 'DXY', 'US10Y', 'US Indices');
  } else if (countryLower === 'eu' || countryLower === 'european union' || countryLower === 'germany' || countryLower === 'eurozone') {
    assets.push('EUR', 'EURUSD');
  } else if (countryLower === 'gb' || countryLower === 'united kingdom') {
    assets.push('GBP', 'GBPUSD');
  } else if (countryLower === 'jp' || countryLower === 'japan') {
    assets.push('JPY', 'USDJPY');
  } else if (countryLower === 'cn' || countryLower === 'china') {
    assets.push('CNY', 'Copper', 'Industrial Metals');
  } else if (countryLower === 'ca' || countryLower === 'canada') {
    assets.push('CAD', 'Oil');
  } else if (countryLower === 'au' || countryLower === 'australia') {
    assets.push('AUD', 'Iron Ore');
  } else if (countryLower === 'ch' || countryLower === 'switzerland') {
    assets.push('CHF');
  }
  
  // Category-specific assets
  if (categoryLower.includes('inflation') || titleLower.includes('cpi') || titleLower.includes('ppi')) {
    assets.push('XAUUSD', 'XAGUSD'); // Gold and Silver react to inflation
  }
  if (titleLower.includes('oil') || titleLower.includes('opec') || titleLower.includes('energy')) {
    assets.push('WTIUSD', 'OIL', 'Energy');
  }
  if (categoryLower.includes('interest rate') || titleLower.includes('monetary')) {
    assets.push('DXY', 'Bond Yields');
  }
  
  // Event-specific assets
  if (titleLower.includes('gdp')) {
    assets.push('Stock Indices', 'Currency Pairs');
  }
  if (titleLower.includes('employment') || titleLower.includes('nfp') || titleLower.includes('jobs')) {
    assets.push('USD', 'DXY', 'US Indices');
  }
  
  return [...new Set(assets)]; // Remove duplicates
}

/**
 * Generate related reports based on category and event type
 */
function generateRelatedReports(category?: string, title?: string): string[] {
  const reports: string[] = [];
  const titleLower = title?.toLowerCase() || '';
  
  // Base reports by category
  switch (category) {
    case 'Fed':
      reports.push('Fed Policy Analysis', 'USD Impact Assessment');
      break;
    case 'Macro':
      reports.push('Central Bank Analysis', 'Currency Impact Study');
      break;
    case 'Economic':
      reports.push('Economic Indicator Analysis', 'Market Impact Report');
      break;
    case 'Geopolitical':
      reports.push('Geopolitical Risk Assessment', 'Market Sentiment Analysis');
      break;
    case 'Earnings':
      reports.push('Earnings Analysis', 'Sector Impact Report');
      break;
  }
  
  // Specific event-based reports
  if (titleLower.includes('inflation') || titleLower.includes('cpi')) {
    reports.push('Inflation Analysis', 'Price Impact Study');
  }
  if (titleLower.includes('gdp')) {
    reports.push('GDP Analysis', 'Growth Outlook Report');
  }
  if (titleLower.includes('employment') || titleLower.includes('nfp') || titleLower.includes('jobs')) {
    reports.push('Labor Market Analysis', 'Employment Impact Study');
  }
  if (titleLower.includes('interest rate')) {
    reports.push('Interest Rate Analysis', 'Monetary Policy Impact');
  }
  if (titleLower.includes('oil') || titleLower.includes('energy')) {
    reports.push('Energy Market Analysis', 'Oil Price Impact');
  }
  
  return [...new Set(reports)]; // Remove duplicates
}

/**
 * Determines primary currency for a country
 */
function determineCurrency(country?: string): string {
  if (!country) return 'USD';
  
  const countryLower = country.toLowerCase();
  
  if (countryLower === 'us' || countryLower === 'united states') return 'USD';
  if (countryLower === 'eu' || countryLower === 'european union' || countryLower === 'germany' || countryLower === 'eurozone') return 'EUR';
  if (countryLower === 'gb' || countryLower === 'united kingdom') return 'GBP';
  if (countryLower === 'jp' || countryLower === 'japan') return 'JPY';
  if (countryLower === 'cn' || countryLower === 'china') return 'CNY';
  if (countryLower === 'ca' || countryLower === 'canada') return 'CAD';
  if (countryLower === 'au' || countryLower === 'australia') return 'AUD';
  if (countryLower === 'ch' || countryLower === 'switzerland') return 'CHF';
  if (countryLower === 'nz' || countryLower === 'new zealand') return 'NZD';
  
  return 'USD';
}

/**
 * Fetch economic calendar data from Finnhub API
 */
export async function fetchFinnhubEconomicCalendar(
  startDate: Date,
  endDate: Date
): Promise<FinnhubEconomicCalendarResponse> {
  if (!API_KEY) {
    throw new Error('FINNHUB_API_KEY environment variable is required. Please set your Finnhub API key in .env.local');
  }

  try {
    // Format dates for the API (YYYY-MM-DD)
    const start = startDate.toISOString().split('T')[0];
    const end = endDate.toISOString().split('T')[0];

    const response = await fetch(
      `${API_BASE_URL}/economic-calendar?from=${start}&to=${end}&token=${API_KEY}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      }
    );

    if (!response.ok) {
      throw new Error(`Finnhub API request failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    // Transform Finnhub data to our format
    const events: FinnhubEconomicEvent[] = (data.economicCalendar || []).map((event: any) => {
      const title = event.name || event.event || 'Economic Event';
      const country = event.country || 'Unknown';
      const category = mapCategory(title, country);
      const assets = determineAssets(country, category, title);
      
      return {
        id: event.id || `${event.time}-${title}`,
        title,
        date: new Date(event.time * 1000), // Finnhub uses Unix timestamp
        time: new Date(event.time * 1000).toLocaleTimeString('en-US', { 
          hour: 'numeric', 
          minute: '2-digit',
          hour12: true 
        }),
        impact: mapImpact(event.impact),
        category,
        description: `${title} - ${country}`,
        assets,
        relatedReports: generateRelatedReports(category, title),
        country,
        currency: determineCurrency(country),
        forecast: event.estimate ? event.estimate.toString() : undefined,
        actual: event.actual ? event.actual.toString() : undefined,
        previous: event.prevEstimate ? event.prevEstimate.toString() : undefined
      };
    });

    return {
      events,
      lastUpdated: new Date(),
      source: "Finnhub Economic Calendar"
    };

  } catch (error) {
    console.error('Error fetching Finnhub economic calendar data:', error);
    throw error;
  }
}

/**
 * Fetch today's economic events from Finnhub
 */
export async function fetchTodayFinnhubEconomicEvents(): Promise<FinnhubEconomicCalendarResponse> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
  
  return fetchFinnhubEconomicCalendar(today, tomorrow);
}

/**
 * Fetch this week's economic events from Finnhub
 */
export async function fetchWeekFinnhubEconomicEvents(): Promise<FinnhubEconomicCalendarResponse> {
  const today = new Date();
  const dayOfWeek = today.getDay();
  const startOfWeek = new Date(today.getTime() - dayOfWeek * 24 * 60 * 60 * 1000);
  startOfWeek.setHours(0, 0, 0, 0);
  const endOfWeek = new Date(startOfWeek.getTime() + 7 * 24 * 60 * 60 * 1000);
  
  return fetchFinnhubEconomicCalendar(startOfWeek, endOfWeek);
}

/**
 * Fetch this month's economic events from Finnhub
 */
export async function fetchMonthFinnhubEconomicEvents(): Promise<FinnhubEconomicCalendarResponse> {
  const today = new Date();
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  
  return fetchFinnhubEconomicCalendar(startOfMonth, endOfMonth);
}
