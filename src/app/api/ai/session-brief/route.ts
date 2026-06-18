import { NextRequest, NextResponse } from "next/server";

interface SessionBriefRequest {
  sessionTime: "london" | "newyork";
  assets: string[];
  timeframe?: string;
}

// Fetch real market data for context
async function fetchMarketContext() {
  try {
    const [pricesRes, newsRes] = await Promise.all([
      fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/market/prices`),
      fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/news/macro?category=macro&limit=5`),
    ]);

    const prices = pricesRes.ok ? await pricesRes.json() : {};
    const newsData = newsRes.ok ? await newsRes.json() : { articles: [] };

    return { prices, headlines: newsData.articles || [] };
  } catch (error) {
    console.error('Error fetching market context:', error);
    return { prices: {}, headlines: [] };
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: SessionBriefRequest = await request.json();
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      // Return mock data if OpenAI key is not available
      const mockSessionBrief = {
        mainDriver: "Yield-Driven USD Strength",
        bias: "Neutral",
        analysis: "US 10Y yields climbing to 4.32% are supporting USD strength. Gold and Silver showing resilience but facing headwinds from higher rates. Watch for DXY breakout above 105.50 for confirmation.",
        keyLevels: {
          support: ["$2,320.00", "$2,305.50", "$2,290.00"],
          resistance: ["$2,355.00", "$2,370.00", "$2,385.00"]
        },
        tacticalBias: "Neutral",
        confidence: 72,
        timestamp: new Date().toISOString(),
      };

      return NextResponse.json({ success: true, data: mockSessionBrief });
    }

    // Fetch real market context
    const { prices, headlines } = await fetchMarketContext();

    // Build the prompt dynamically with real data
    const systemPrompt = `You are ARK Intelligence, an institutional-grade macro analyst.
Today is ${new Date().toUTCString()}.
Current market data:
- DXY: ${prices.DXY?.price ?? 'N/A'} (${prices.DXY?.changePercent?.toFixed(2) ?? 'N/A'}% today)
- Gold (XAUUSD): ${prices.XAUUSD?.price ?? 'N/A'}
- Silver (XAGUSD): ${prices.XAGUSD?.price ?? 'N/A'}
- US 10Y Yield: ${prices.US10Y?.price ?? 'N/A'}%
- VIX: ${prices.VIX?.price ?? 'N/A'}

Recent headlines: ${headlines.slice(0, 5).map((h: any) => h.title).join(' | ')}

Write a concise (150-200 word) institutional market brief covering:
1. The dominant macro theme today
2. Key asset to watch and why
3. Risk bias (bullish/bearish/neutral) with one-line justification
4. One key level to watch

Write in the style of a Bloomberg Intelligence note. Be precise, not vague.

Return JSON with this structure:
{
  "mainDriver": "string",
  "bias": "bullish" | "bearish" | "neutral",
  "analysis": "string (150-200 words)",
  "keyLevels": {
    "support": ["string", "string"],
    "resistance": ["string", "string"]
  },
  "tacticalBias": "bullish" | "bearish" | "neutral",
  "confidence": number (0-100)
}`;

    const openaiRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: 'Generate the market brief.' },
        ],
        temperature: 0.7,
        response_format: { type: 'json_object' },
      }),
    });

    if (!openaiRes.ok) {
      throw new Error('OpenAI API error');
    }

    const openaiData = await openaiRes.json();
    const briefData = JSON.parse(openaiData.choices[0].message.content);

    return NextResponse.json({ success: true, data: { ...briefData, timestamp: new Date().toISOString() } });
  } catch (error) {
    console.error("Error generating AI session brief:", error);
    return NextResponse.json(
      { success: false, error: "Failed to generate session brief" },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ 
    success: true, 
    data: {
      mainDriver: "Yield-Driven USD Strength",
      bias: "Neutral",
      analysis: "US 10Y yields climbing to 4.32% are supporting USD strength. Gold and Silver showing resilience but facing headwinds from higher rates. Watch for DXY breakout above 105.50 for confirmation.",
      keyLevels: {
        support: ["$2,320.00", "$2,305.50", "$2,290.00"],
        resistance: ["$2,355.00", "$2,370.00", "$2,385.00"]
      },
      tacticalBias: "Neutral",
      confidence: 72,
      timestamp: new Date().toISOString(),
    }
  });
}
