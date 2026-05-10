import { NextRequest, NextResponse } from "next/server";

interface SessionBriefRequest {
  sessionTime: "london" | "newyork";
  assets: string[];
  timeframe?: string;
}

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

export async function POST(request: NextRequest) {
  try {
    const body: SessionBriefRequest = await request.json();
    
    // In production, this would call OpenAI/Claude API with:
    // 1. Recent news headlines
    // 2. Current market data
    // 3. Technical indicators
    // 4. Economic calendar events
    
    // For now, return mock data with some variation based on session
    const sessionVariation = body.sessionTime === "london" 
      ? "European session driving" 
      : "US session focus";
    
    const briefData = {
      ...mockSessionBrief,
      analysis: `${sessionVariation}: ${mockSessionBrief.analysis}`,
      timestamp: new Date().toISOString(),
    };

    return NextResponse.json({ success: true, data: briefData });
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
    data: mockSessionBrief 
  });
}
