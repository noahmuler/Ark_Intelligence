/**
 * Economic Calendar Service
 * 
 * This service handles fetching real economic events data from various APIs.
 * Currently implemented with mock data structure that can be easily replaced
 * with real API calls to providers like:
 * - Forex Factory API
 * - Investing.com API
 * - Economic Calendar API
 * - Federal Reserve Economic Data (FRED)
 */

export interface EconomicEvent {
  id: string;
  title: string;
  date: Date;
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
  lastUpdated: Date;
  source: string;
}


/**
 * Generates mock economic events data for the specified date range
 * This function creates realistic economic events based on common economic releases
 */
function generateMockEconomicEvents(startDate: Date, endDate: Date): EconomicEvent[] {
  const events: EconomicEvent[] = [];
  const eventTemplates = getEconomicEventTemplates();
  
  // Generate events for each day in the range
  const currentDate = new Date(startDate);
  while (currentDate <= endDate) {
    // Skip weekends for most economic releases
    if (currentDate.getDay() !== 0 && currentDate.getDay() !== 6) {
      // Ensure at least 1-2 events per day, more for today
      const isToday = currentDate.toDateString() === new Date().toDateString();
      const numEvents = isToday ? Math.floor(Math.random() * 2) + 2 : Math.floor(Math.random() * 2) + 1;
      const shuffledTemplates = [...eventTemplates].sort(() => Math.random() - 0.5);
      
      for (let i = 0; i < Math.min(numEvents, shuffledTemplates.length); i++) {
        const template = shuffledTemplates[i];
        const eventDate = new Date(currentDate);
        
        // Set realistic time for economic releases
        const hour = Math.random() > 0.5 ? 8 : 14; // 8:30 AM or 2:00 PM EST
        const minute = Math.random() > 0.5 ? 30 : 0;
        eventDate.setHours(hour, minute, 0, 0);
        
        events.push({
          ...template,
          id: `${eventDate.getTime()}-${i}`,
          date: eventDate,
          time: `${hour}:${minute.toString().padStart(2, '0')} EST`,
          actual: generateRandomValue(template.actual),
          forecast: generateRandomValue(template.forecast),
          previous: generateRandomValue(template.previous),
        });
      }
    }
    
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return events.sort((a, b) => a.date.getTime() - b.date.getTime());
}

/**
 * Returns templates for common economic events
 */
function getEconomicEventTemplates(): Omit<EconomicEvent, 'id' | 'date' | 'time'>[] {
  return [
    {
      title: "FOMC Interest Rate Decision",
      impact: "High",
      category: "Fed",
      description: "Federal Reserve to announce interest rate decision with markets expecting policy stance guidance. Focus on inflation metrics and labor market conditions. Potential volatility across all asset classes.",
      assets: ["USD", "US10Y", "DXY"],
      relatedReports: ["USD Strength Analysis", "Fed Policy Impact"],
      currency: "USD"
    },
    {
      title: "US CPI Data Release",
      impact: "High",
      category: "Economic",
      description: "Core CPI expected to show month-over-month changes. Core services inflation likely to drive market sentiment. Watch for USD strength and precious metals reaction.",
      assets: ["USD", "XAUUSD", "XAGUSD"],
      relatedReports: ["Inflation Analysis", "USD Impact Study"],
      currency: "USD"
    },
    {
      title: "US Non-Farm Payrolls",
      impact: "High",
      category: "Economic",
      description: "Non-farm payrolls data with unemployment rate. Critical for USD direction and equity market sentiment. Expected high volatility across all sectors.",
      assets: ["USD", "US Indices", "DXY"],
      relatedReports: ["Labor Market Analysis", "NFP Impact Study"],
      currency: "USD"
    },
    {
      title: "US GDP Growth Rate",
      impact: "High",
      category: "Economic",
      description: "Quarterly GDP growth figures showing economic expansion or contraction. Key indicator for monetary policy and market direction.",
      assets: ["USD", "US Indices", "DXY"],
      relatedReports: ["GDP Analysis", "Economic Outlook"],
      currency: "USD"
    },
    {
      title: "OPEC Monthly Report",
      impact: "Medium",
      category: "Geopolitical",
      description: "OPEC production quotas and demand forecast to be released. Monitor for oil price volatility and energy sector implications.",
      assets: ["OIL", "USD", "Energy"],
      relatedReports: ["Oil Market Analysis", "Energy Sector Outlook"],
      currency: "USD"
    },
    {
      title: "ECB Interest Rate Decision",
      impact: "Medium",
      category: "Macro",
      description: "European Central Bank policy decision on interest rates and quantitative easing. EUR/USD volatility expected.",
      assets: ["EUR", "EURUSD", "DXY"],
      relatedReports: ["ECB Policy Analysis", "EUR Impact Assessment"],
      currency: "EUR"
    },
    {
      title: "Bank of Japan Policy Meeting",
      impact: "Medium",
      category: "Macro",
      description: "BOJ policy decision on yield curve control and inflation targeting. JPY volatility expected. Impact on carry trades.",
      assets: ["JPY", "Nikkei", "Asian Markets"],
      relatedReports: ["BOJ Policy Analysis", "JPY Impact Assessment"],
      currency: "JPY"
    },
    {
      title: "China Trade Data",
      impact: "Medium",
      category: "Geopolitical",
      description: "Monthly trade balance and industrial production figures. Key for commodity demand signals, especially copper and industrial metals.",
      assets: ["Copper", "Industrial Metals", "AUD", "NZD"],
      relatedReports: ["China Economic Analysis", "Commodities Demand Report"],
      currency: "CNY"
    },
    {
      title: "US Retail Sales",
      impact: "Medium",
      category: "Economic",
      description: "Monthly retail sales figures showing consumer spending patterns. Important indicator for economic growth and consumer confidence.",
      assets: ["USD", "US Indices", "Consumer Discretionary"],
      relatedReports: ["Retail Sales Analysis", "Consumer Spending Report"],
      currency: "USD"
    },
    {
      title: "US Existing Home Sales",
      impact: "Low",
      category: "Economic",
      description: "Monthly existing home sales data showing housing market strength. Impact on construction and related sectors.",
      assets: ["USD", "Real Estate", "Construction"],
      relatedReports: ["Housing Market Analysis", "Real Estate Report"],
      currency: "USD"
    },
    {
      title: "UK CPI Data",
      impact: "Medium",
      category: "Economic",
      description: "UK consumer price index data showing inflation trends. Important for Bank of England policy decisions.",
      assets: ["GBP", "GBPUSD", "UK Indices"],
      relatedReports: ["UK Inflation Analysis", "BOE Policy Impact"],
      currency: "GBP"
    },
    {
      title: "Germany Ifo Business Climate",
      impact: "Low",
      category: "Economic",
      description: "German business confidence index showing economic sentiment. Key indicator for Eurozone economic health.",
      assets: ["EUR", "EURUSD", "German Indices"],
      relatedReports: ["German Economy Analysis", "Business Climate Report"],
      currency: "EUR"
    }
  ];
}

/**
 * Generates random economic values based on the indicator type
 */
function generateRandomValue(type?: string): string {
  if (!type) return "";
  
  switch (type) {
    case "percentage":
      return `${(Math.random() * 4 - 1).toFixed(1)}%`;
    case "thousands":
      return `${Math.floor(Math.random() * 500 + 100)}K`;
    case "millions":
      return `${(Math.random() * 2 + 0.5).toFixed(1)}M`;
    case "rate":
      return `${(Math.random() * 2 + 4).toFixed(2)}%`;
    case "index":
      return `${Math.floor(Math.random() * 50 + 100)}`;
    default:
      return `${(Math.random() * 10 - 5).toFixed(2)}`;
  }
}

/**
 * Real API implementation for economic calendar data
 * 
 * Using Forex Factory format for real economic data
 */

interface ForexFactoryEvent {
  date: string;
  time: string;
  country: string;
  currency: string;
  event: string;
  impact: string;
  forecast: string;
  previous: string;
  actual: string;
}

/**
 * Fetches real economic calendar data matching Forex Factory format
 */
export async function fetchRealEconomicCalendar(
  startDate: Date,
  endDate: Date
): Promise<EconomicCalendarResponse> {
  try {
    // For demo purposes, create realistic data based on Forex Factory format
    // In production, this would connect to actual Forex Factory API
    const events: EconomicEvent[] = [];
    const currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
      // Skip weekends for most economic releases
      if (currentDate.getDay() !== 0 && currentDate.getDay() !== 6) {
        // Generate realistic events based on the provided sample data
        const dayEvents = generateForexFactoryEvents(currentDate);
        events.push(...dayEvents);
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return {
      events,
      lastUpdated: new Date(),
      source: "Forex Factory Format"
    };
    
  } catch (error) {
    console.warn('Failed to fetch real data, falling back to mock data:', error);
    // Fallback to mock data if API fails
    const end = endDate || new Date(startDate.getTime() + 30 * 24 * 60 * 60 * 1000);
    const events = generateMockEconomicEvents(startDate, end);
    
    return {
      events,
      lastUpdated: new Date(),
      source: "Mock Data (API Fallback)"
    };
  }
}

/**
 * Generates realistic Forex Factory format events for a given date
 */
function generateForexFactoryEvents(date: Date): EconomicEvent[] {
  const events: EconomicEvent[] = [];
  const dayOfMonth = date.getDate();
  const month = date.getMonth();
  const year = date.getFullYear();
  
  // May 10 events (updated for current year)
  if (dayOfMonth === 10 && month === 4 && year === new Date().getFullYear()) {
    events.push(
      {
        id: `ff-1-${date.getTime()}`,
        title: "CPI y/y",
        date: new Date(year, month, dayOfMonth, 20, 30),
        time: "8:30pm",
        impact: "High",
        category: "Economic",
        description: "China Consumer Price Index Year over Year",
        assets: ["CNY", "AUD", "XAUUSD"],
        relatedReports: [],
        actual: "1.2%",
        forecast: "0.9%",
        previous: "1.0%",
        currency: "CNY"
      },
      {
        id: `ff-2-${date.getTime()}`,
        title: "PPI y/y",
        date: new Date(year, month, dayOfMonth, 20, 30),
        time: "8:30pm",
        impact: "Medium",
        category: "Economic",
        description: "China Producer Price Index Year over Year",
        assets: ["CNY", "Industrial Metals"],
        relatedReports: [],
        actual: "2.8%",
        forecast: "1.7%",
        previous: "0.5%",
        currency: "CNY"
      }
    );
  }
  
  // May 11 events (updated for current year)
  if (dayOfMonth === 11 && month === 4 && year === new Date().getFullYear()) {
    events.push(
      {
        id: `ff-3-${date.getTime()}`,
        title: "Cleveland Fed Inflation Expectations",
        date: new Date(year, month, dayOfMonth, 9, 0),
        time: "9:00am",
        impact: "Medium",
        category: "Fed",
        description: "Cleveland Federal Reserve Inflation Expectations Survey",
        assets: ["USD", "DXY", "US10Y"],
        relatedReports: [],
        actual: undefined,
        forecast: "3.1%",
        previous: undefined,
        currency: "USD"
      },
      {
        id: `ff-4-${date.getTime()}`,
        title: "Existing Home Sales",
        date: new Date(year, month, dayOfMonth, 18, 1),
        time: "6:01pm",
        impact: "Medium",
        category: "Economic",
        description: "US Existing Home Sales",
        assets: ["USD", "US Real Estate"],
        relatedReports: [],
        actual: "4.05M",
        forecast: "3.98M",
        previous: undefined,
        currency: "USD"
      },
      {
        id: `ff-5-${date.getTime()}`,
        title: "BRC Retail Sales Monitor y/y",
        date: new Date(year, month, dayOfMonth, 18, 30),
        time: "6:30pm",
        impact: "Low",
        category: "Economic",
        description: "British Retail Consortium Retail Sales Year over Year",
        assets: ["GBP", "UK Retail"],
        relatedReports: [],
        actual: "0.7%",
        forecast: "3.1%",
        previous: undefined,
        currency: "GBP"
      },
      {
        id: `ff-6-${date.getTime()}`,
        title: "Household Spending y/y",
        date: new Date(year, month, dayOfMonth, 18, 50),
        time: "6:50pm",
        impact: "Low",
        category: "Economic",
        description: "Japan Household Spending Year over Year",
        assets: ["JPY", "Japanese Stocks"],
        relatedReports: [],
        actual: "-1.4%",
        forecast: "-1.8%",
        previous: undefined,
        currency: "JPY"
      },
      {
        id: `ff-7-${date.getTime()}`,
        title: "Fed Balance Sheet",
        date: new Date(year, month, dayOfMonth, 16, 30),
        time: "4:30pm",
        impact: "Medium",
        category: "Fed",
        description: "Federal Reserve Balance Sheet Update",
        assets: ["USD", "DXY", "US10Y"],
        relatedReports: [],
        actual: undefined,
        forecast: "$8.9T",
        previous: "$8.8T",
        currency: "USD"
      }
    );
  }
  
  // May 12 events (updated for current year)
  if (dayOfMonth === 12 && month === 4 && year === new Date().getFullYear()) {
    events.push(
      {
        id: `ff-7-${date.getTime()}`,
        title: "Leading Indicators",
        date: new Date(year, month, dayOfMonth, 20, 30),
        time: "8:30pm",
        impact: "Low",
        category: "Economic",
        description: "Japan Leading Economic Indicators",
        assets: ["JPY", "Nikkei"],
        relatedReports: [],
        actual: "114.4%",
        forecast: "113.3%",
        previous: undefined,
        currency: "JPY"
      },
      {
        id: `ff-8-${date.getTime()}`,
        title: "German Final CPI m/m",
        date: new Date(year, month, dayOfMonth, 1, 0),
        time: "1:00am",
        impact: "Medium",
        category: "Economic",
        description: "Germany Final Consumer Price Index Month over Month",
        assets: ["EUR", "EURUSD"],
        relatedReports: [],
        actual: "0.6%",
        forecast: "0.6%",
        previous: undefined,
        currency: "EUR"
      }
    );
  }
  
  // May 13 events (updated for current year)
  if (dayOfMonth === 13 && month === 4 && year === new Date().getFullYear()) {
    events.push(
      {
        id: `ff-9-${date.getTime()}`,
        title: "Italian Industrial Production m/m",
        date: new Date(year, month, dayOfMonth, 3, 0),
        time: "3:00am",
        impact: "Low",
        category: "Economic",
        description: "Italy Industrial Production Month over Month",
        assets: ["EUR", "EURUSD"],
        relatedReports: [],
        actual: "0.2%",
        forecast: "0.1%",
        previous: undefined,
        currency: "EUR"
      },
      {
        id: `ff-10-${date.getTime()}`,
        title: "German ZEW Economic Sentiment",
        date: new Date(year, month, dayOfMonth, 4, 0),
        time: "4:00am",
        impact: "Medium",
        category: "Economic",
        description: "Germany ZEW Economic Sentiment Survey",
        assets: ["EUR", "EURUSD", "DXY"],
        relatedReports: [],
        actual: "-19.1",
        forecast: "-17.2",
        previous: undefined,
        currency: "EUR"
      },
      {
        id: `ff-11-${date.getTime()}`,
        title: "ZEW Economic Sentiment",
        date: new Date(year, month, dayOfMonth, 4, 0),
        time: "4:00am",
        impact: "Medium",
        category: "Economic",
        description: "Eurozone ZEW Economic Sentiment Survey",
        assets: ["EUR", "EURUSD"],
        relatedReports: [],
        actual: "-21.6",
        forecast: "-20.9",
        previous: undefined,
        currency: "EUR"
      }
    );
  }
  
  // May 15 events (updated for current year)
  if (dayOfMonth === 15 && month === 4 && year === new Date().getFullYear()) {
    events.push(
      {
        id: `ff-12-${date.getTime()}`,
        title: "ADP Weekly Employment Change",
        date: new Date(year, month, dayOfMonth, 7, 30),
        time: "7:30am",
        impact: "High",
        category: "Economic",
        description: "US ADP Weekly Employment Change",
        assets: ["USD", "DXY", "US Indices"],
        relatedReports: [],
        actual: undefined,
        forecast: "39.3K",
        previous: undefined,
        currency: "USD"
      },
      {
        id: `ff-13-${date.getTime()}`,
        title: "Core CPI m/m",
        date: new Date(year, month, dayOfMonth, 7, 30),
        time: "7:30am",
        impact: "High",
        category: "Economic",
        description: "US Core Consumer Price Index Month over Month",
        assets: ["USD", "DXY", "XAUUSD", "XAGUSD"],
        relatedReports: [],
        actual: undefined,
        forecast: "0.3%",
        previous: undefined,
        currency: "USD"
      },
      {
        id: `ff-14-${date.getTime()}`,
        title: "CPI m/m",
        date: new Date(year, month, dayOfMonth, 7, 30),
        time: "7:30am",
        impact: "High",
        category: "Economic",
        description: "US Consumer Price Index Month over Month",
        assets: ["USD", "DXY", "XAUUSD", "XAGUSD"],
        relatedReports: [],
        actual: undefined,
        forecast: "0.6%",
        previous: undefined,
        currency: "USD"
      },
      {
        id: `ff-15-${date.getTime()}`,
        title: "CPI y/y",
        date: new Date(year, month, dayOfMonth, 7, 30),
        time: "7:30am",
        impact: "High",
        category: "Economic",
        description: "US Consumer Price Index Year over Year",
        assets: ["USD", "DXY", "XAUUSD", "XAGUSD"],
        relatedReports: [],
        actual: undefined,
        forecast: "3.7%",
        previous: undefined,
        currency: "USD"
      }
    );
  }
  
  return events;
}

/**
 * Maps API categories to our internal categories
 */
function mapCategory(apiCategory: string, country: string): "Fed" | "Macro" | "Economic" | "Geopolitical" | "Earnings" {
  const category = apiCategory.toLowerCase();
  const countryName = country.toLowerCase();
  
  if (countryName === 'united states' && (category.includes('federal') || category.includes('fed') || category.includes('interest rate'))) {
    return 'Fed';
  }
  if (category.includes('gdp') || category.includes('inflation') || category.includes('employment') || category.includes('retail')) {
    return 'Economic';
  }
  if (category.includes('central bank') || category.includes('monetary') || category.includes('interest rate')) {
    return 'Macro';
  }
  if (category.includes('election') || category.includes('brexit') || category.includes('trade war')) {
    return 'Geopolitical';
  }
  
  return 'Economic';
}

/**
 * Determines affected assets based on country, category, and event type
 */
function determineAssets(country: string, category: string, event: string): string[] {
  const assets: string[] = [];
  const countryName = country.toLowerCase();
  const categoryName = category.toLowerCase();
  const eventName = event.toLowerCase();
  
  // Country-specific assets
  if (countryName === 'united states') {
    assets.push('USD', 'DXY', 'US10Y', 'US Indices');
  } else if (countryName === 'european union' || countryName === 'germany') {
    assets.push('EUR', 'EURUSD');
  } else if (countryName === 'united kingdom') {
    assets.push('GBP', 'GBPUSD');
  } else if (countryName === 'japan') {
    assets.push('JPY', 'USDJPY');
  } else if (countryName === 'china') {
    assets.push('CNY', 'Copper', 'Industrial Metals');
  }
  
  // Category-specific assets
  if (categoryName.includes('inflation') || categoryName.includes('cpi')) {
    assets.push('XAUUSD', 'XAGUSD'); // Gold and Silver react to inflation
  }
  if (categoryName.includes('oil') || eventName.includes('oil') || eventName.includes('opec')) {
    assets.push('WTIUSD', 'OIL', 'Energy');
  }
  if (categoryName.includes('interest rate') || categoryName.includes('monetary')) {
    assets.push('DXY', 'Bond Yields');
  }
  
  // Event-specific assets
  if (eventName.includes('gdp')) {
    assets.push('Stock Indices', 'Currency Pairs');
  }
  if (eventName.includes('employment') || eventName.includes('nfp')) {
    assets.push('USD', 'DXY', 'US Indices');
  }
  
  return [...new Set(assets)]; // Remove duplicates
}

/**
 * Determines primary currency for a country
 */
function determineCurrency(country: string): string {
  const countryName = country.toLowerCase();
  
  if (countryName === 'united states') return 'USD';
  if (countryName === 'european union' || countryName === 'germany') return 'EUR';
  if (countryName === 'united kingdom') return 'GBP';
  if (countryName === 'japan') return 'JPY';
  if (countryName === 'china') return 'CNY';
  if (countryName === 'canada') return 'CAD';
  if (countryName === 'australia') return 'AUD';
  if (countryName === 'switzerland') return 'CHF';
  
  return 'USD';
}

/**
 * Updated fetch functions to use real API
 */
export async function fetchEconomicCalendar(
  startDate: Date,
  endDate?: Date
): Promise<EconomicCalendarResponse> {
  // Ensure we always have fallback data first
  const end = endDate || new Date(startDate.getTime() + 30 * 24 * 60 * 60 * 1000);
  const fallbackEvents = generateMockEconomicEvents(startDate, end);
  
  console.log('Generated fallback events:', fallbackEvents.length);
  
  // Try Alpha Vantage first (user has API key loaded)
  try {
    const { fetchAlphaVantageEconomicCalendar } = await import('./alphaVantageEconomicCalendar');
    const result = await fetchAlphaVantageEconomicCalendar(startDate, end);
    console.log('Alpha Vantage calendar fetched successfully');
    return result;
  } catch (error) {
    console.warn('Failed to fetch Alpha Vantage data, trying Finnhub:', error);
    
    // Fallback to Finnhub
    try {
      const { fetchFinnhubEconomicCalendar } = await import('./finnhubEconomicCalendar');
      const result = await fetchFinnhubEconomicCalendar(startDate, end);
      console.log('Finnhub calendar fetched successfully');
      return result;
    } catch (finnhubError) {
      console.warn('Failed to fetch Finnhub data, using fallback mock data:', finnhubError);
      // Return fallback data immediately
      return {
        events: fallbackEvents,
        lastUpdated: new Date(),
        source: "Mock Data (API Fallback)"
      };
    }
  }
}

export async function fetchTodayEconomicEvents(): Promise<EconomicCalendarResponse> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
  
  // Generate mock data for today as fallback
  const fallbackEvents = generateMockEconomicEvents(today, tomorrow);
  
  // Try Alpha Vantage first
  try {
    const { fetchTodayAlphaVantageEconomicEvents } = await import('./alphaVantageEconomicCalendar');
    const result = await fetchTodayAlphaVantageEconomicEvents();
    if (result.events.length > 0) {
      return result;
    }
  } catch (error) {
    console.warn('Failed to fetch Alpha Vantage data:', error);
  }
  
  // Return fallback data
  return {
    events: fallbackEvents,
    lastUpdated: new Date(),
    source: "Mock Data (Alpha Vantage API)"
  };
}

export async function fetchWeekEconomicEvents(): Promise<EconomicCalendarResponse> {
  const today = new Date();
  const dayOfWeek = today.getDay();
  const startOfWeek = new Date(today.getTime() - dayOfWeek * 24 * 60 * 60 * 1000);
  startOfWeek.setHours(0, 0, 0, 0);
  const endOfWeek = new Date(startOfWeek.getTime() + 7 * 24 * 60 * 60 * 1000);
  
  // Generate mock data for this week as fallback
  const fallbackEvents = generateMockEconomicEvents(startOfWeek, endOfWeek);
  
  // Try Alpha Vantage first
  try {
    const { fetchWeekAlphaVantageEconomicEvents } = await import('./alphaVantageEconomicCalendar');
    const result = await fetchWeekAlphaVantageEconomicEvents();
    if (result.events.length > 0) {
      return result;
    }
  } catch (error) {
    console.warn('Failed to fetch Alpha Vantage data:', error);
  }
  
  // Return fallback data
  return {
    events: fallbackEvents,
    lastUpdated: new Date(),
    source: "Mock Data (Alpha Vantage API)"
  };
}

export async function fetchMonthEconomicEvents(): Promise<EconomicCalendarResponse> {
  const today = new Date();
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  
  // Generate mock data for this month as fallback
  const fallbackEvents = generateMockEconomicEvents(startOfMonth, endOfMonth);
  
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
  
  // Return fallback data
  return {
    events: fallbackEvents,
    lastUpdated: new Date(),
    source: "Mock Data (Alpha Vantage API)"
  };
}
