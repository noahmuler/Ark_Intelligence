/**
 * Real Economic Calendar API Integration
 * 
 * This service connects to the Economic Calendar API from RapidAPI
 * to fetch real economic events data.
 */

export interface RealEconomicEvent {
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
  volatility?: number;
}

export interface RealEconomicCalendarResponse {
  events: RealEconomicEvent[];
  lastUpdated: Date;
  source: string;
}

const API_BASE_URL = 'https://economic-calendar-api.p.rapidapi.com';
const API_KEY = process.env.RAPIDAPI_KEY || ''; // User will need to provide this

/**
 * Map API impact levels to our internal impact levels
 */
function mapImpact(apiImpact?: string): "High" | "Medium" | "Low" {
  if (!apiImpact) return "Low";
  
  const impact = apiImpact.toLowerCase();
  if (impact.includes('high') || impact.includes('red')) return "High";
  if (impact.includes('medium') || impact.includes('orange') || impact.includes('yellow')) return "Medium";
  return "Low";
}

/**
 * Map API categories to our internal categories
 */
function mapCategory(title: string, country: string): "Fed" | "Macro" | "Economic" | "Geopolitical" | "Earnings" {
  const titleLower = title.toLowerCase();
  const countryLower = country.toLowerCase();
  
  // Fed-related events
  if (countryLower === 'united states' && 
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
function determineAssets(country: string, category: string, title: string): string[] {
  const assets: string[] = [];
  const countryLower = country.toLowerCase();
  const categoryLower = category.toLowerCase();
  const titleLower = title.toLowerCase();
  
  // Country-specific assets
  if (countryLower === 'united states') {
    assets.push('USD', 'DXY', 'US10Y', 'US Indices');
  } else if (countryLower === 'european union' || countryLower === 'germany' || countryLower === 'eurozone') {
    assets.push('EUR', 'EURUSD');
  } else if (countryLower === 'united kingdom') {
    assets.push('GBP', 'GBPUSD');
  } else if (countryLower === 'japan') {
    assets.push('JPY', 'USDJPY');
  } else if (countryLower === 'china') {
    assets.push('CNY', 'Copper', 'Industrial Metals');
  } else if (countryLower === 'canada') {
    assets.push('CAD', 'Oil');
  } else if (countryLower === 'australia') {
    assets.push('AUD', 'Iron Ore');
  } else if (countryLower === 'switzerland') {
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
 * Fetch real economic calendar data from RapidAPI
 */
export async function fetchRealEconomicCalendar(
  startDate: Date,
  endDate: Date
): Promise<RealEconomicCalendarResponse> {
  if (!API_KEY) {
    throw new Error('RAPIDAPI_KEY environment variable is required. Please get your free API key from RapidAPI.');
  }

  try {
    // Format dates for the API (YYYY-MM-DD)
    const start = startDate.toISOString().split('T')[0];
    const end = endDate.toISOString().split('T')[0];

    const response = await fetch(`${API_BASE_URL}/calendar?from=${start}&to=${end}`, {
      method: 'GET',
      headers: {
        'X-RapidAPI-Key': API_KEY,
        'X-RapidAPI-Host': 'economic-calendar-api.p.rapidapi.com'
      }
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    // Transform API data to our format
    const events: RealEconomicEvent[] = data.map((event: any) => {
      const title = event.title || event.event || 'Economic Event';
      const country = event.country || 'Unknown';
      const category = mapCategory(title, country);
      const assets = determineAssets(country, category, title);
      
      return {
        id: event.id || `${event.date}-${title}`,
        title,
        date: new Date(event.date),
        time: event.time || 'TBD',
        impact: mapImpact(event.impact || event.volatility),
        category,
        description: event.description || `${title} - ${country}`,
        assets,
        relatedReports: generateRelatedReports(category, title),
        country,
        currency: event.currency || determineCurrency(country),
        forecast: event.forecast,
        actual: event.actual,
        previous: event.previous,
        volatility: event.volatility
      };
    });

    return {
      events,
      lastUpdated: new Date(),
      source: "RapidAPI Economic Calendar"
    };

  } catch (error) {
    console.error('Error fetching real economic calendar data:', error);
    throw error;
  }
}

/**
 * Generate related reports based on category and event type
 */
function generateRelatedReports(category: string, title: string): string[] {
  const reports: string[] = [];
  const titleLower = title.toLowerCase();
  
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
function determineCurrency(country: string): string {
  const countryName = country.toLowerCase();
  
  if (countryName === 'united states') return 'USD';
  if (countryName === 'european union' || countryName === 'germany' || countryName === 'eurozone') return 'EUR';
  if (countryName === 'united kingdom') return 'GBP';
  if (countryName === 'japan') return 'JPY';
  if (countryName === 'china') return 'CNY';
  if (countryName === 'canada') return 'CAD';
  if (countryName === 'australia') return 'AUD';
  if (countryName === 'switzerland') return 'CHF';
  if (countryName === 'new zealand') return 'NZD';
  
  return 'USD';
}

/**
 * Fetch today's economic events
 */
export async function fetchTodayRealEconomicEvents(): Promise<RealEconomicCalendarResponse> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
  
  return fetchRealEconomicCalendar(today, tomorrow);
}

/**
 * Fetch this week's economic events
 */
export async function fetchWeekRealEconomicEvents(): Promise<RealEconomicCalendarResponse> {
  const today = new Date();
  const dayOfWeek = today.getDay();
  const startOfWeek = new Date(today.getTime() - dayOfWeek * 24 * 60 * 60 * 1000);
  startOfWeek.setHours(0, 0, 0, 0);
  const endOfWeek = new Date(startOfWeek.getTime() + 7 * 24 * 60 * 60 * 1000);
  
  return fetchRealEconomicCalendar(startOfWeek, endOfWeek);
}

/**
 * Fetch this month's economic events
 */
export async function fetchMonthRealEconomicEvents(): Promise<RealEconomicCalendarResponse> {
  const today = new Date();
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  
  return fetchRealEconomicCalendar(startOfMonth, endOfMonth);
}
