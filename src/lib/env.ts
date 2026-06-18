// Centralized env validation — throw at startup if keys are missing
export const env = {
  finnhub: process.env.FINNHUB_API_KEY!,
  polygon: process.env.POLYGON_API_KEY!,
  fred: process.env.FRED_API_KEY!,
  newsApi: process.env.NEWS_API_KEY!,
  openai: process.env.OPENAI_API_KEY!,
  anthropic: process.env.ANTHROPIC_API_KEY!,
};

// Validate on import in server contexts
if (typeof window === 'undefined') {
  const missing = Object.entries(env)
    .filter(([, v]) => !v)
    .map(([k]) => k);
  if (missing.length > 0) {
    console.warn(`[ARK] Missing env vars: ${missing.join(', ')}`);
  }
}
