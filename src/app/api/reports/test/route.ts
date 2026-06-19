import { NextResponse } from 'next/server';

export async function GET() {
  const apiKey = process.env.FRED_API_KEY;
  const keyPresent = !!apiKey;
  const keyLength = apiKey ? apiKey.length : 0;
  const keyEmptyAfterTrim = !apiKey || apiKey.trim() === '';

  const diagnostics = {
    keyPresent,
    keyLength,
    keyEmptyAfterTrim,
    keyPrefix: keyPresent ? `${apiKey!.substring(0, 4)}...` : 'NONE',
    nodeEnv: process.env.NODE_ENV,
  };

  if (keyEmptyAfterTrim) {
    return NextResponse.json(
      {
        status: 'error',
        message: 'FRED_API_KEY is missing or empty',
        diagnostics,
        help: 'Add FRED_API_KEY=your_key to .env.local and restart the dev server.',
      },
      { status: 500 }
    );
  }

  // Test the key with a single FRED series
  try {
    const url = `https://api.stlouisfed.org/fred/series/observations?series_id=UNRATE&api_key=${apiKey}&file_type=json&limit=1&sort_order=desc`;
    const res = await fetch(url, { cache: 'no-store' });
    const resText = await res.text();
    
    if (!res.ok) {
      return NextResponse.json(
        {
          status: 'error',
          message: `FRED API test failed with HTTP ${res.status}`,
          diagnostics,
          fredResponse: resText.slice(0, 500),
        },
        { status: 500 }
      );
    }

    let fredData;
    try {
      fredData = JSON.parse(resText);
    } catch {
      return NextResponse.json(
        {
          status: 'error',
          message: 'FRED API returned invalid JSON',
          diagnostics,
          fredResponse: resText.slice(0, 500),
        },
        { status: 500 }
      );
    }

    const obs = fredData.observations || [];
    const latest = obs[0];

    return NextResponse.json({
      status: 'ok',
      message: 'FRED API key is working',
      diagnostics,
      fredTest: {
        series: 'UNRATE',
        observationsCount: obs.length,
        latestDate: latest?.date || null,
        latestValue: latest?.value || null,
      },
    });
  } catch (err) {
    return NextResponse.json(
      {
        status: 'error',
        message: 'Network error while testing FRED API',
        diagnostics,
        error: err instanceof Error ? err.message : String(err),
      },
      { status: 500 }
    );
  }
}
