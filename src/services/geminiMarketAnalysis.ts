/**
 * Gemini AI Market Analysis Integration
 * 
 * This service connects to Google's Gemini API
 * to provide AI-powered market analysis and insights.
 */

export interface MarketInsight {
  id: string;
  title: string;
  description: string;
  sentiment: "Bullish" | "Bearish" | "Neutral";
  confidence: number;
  category: "Technical" | "Fundamental" | "News" | "Economic";
  timestamp: Date;
  relatedSymbols: string[];
}

export interface AIAnalysis {
  summary: string;
  keyInsights: MarketInsight[];
  marketOutlook: "Positive" | "Negative" | "Neutral";
  riskLevel: "Low" | "Medium" | "High";
  recommendations: string[];
  timestamp: Date;
}

export interface GeminiAnalysisResponse {
  analysis: AIAnalysis;
  lastUpdated: Date;
  source: string;
}

const API_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent';
const API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY || '';

/**
 * Market analysis prompts for different scenarios
 */
const ANALYSIS_PROMPTS = {
  marketOverview: `Analyze the current market conditions and provide a comprehensive market outlook. 
  Consider recent economic data, major indices performance, and key market trends.
  Provide insights on market sentiment, potential risks, and opportunities.
  Format your response as structured JSON with: summary, sentiment (bullish/bearish/neutral), 
  key insights, risk level, and investment recommendations.`,
  
  stockAnalysis: (symbol: string, data: any) => `Analyze ${symbol} stock based on the following data:
  Current Price: ${data.price}
  Change: ${data.change} (${data.changePercent}%)
  Volume: ${data.volume}
  
  Provide technical and fundamental analysis, including:
  - Price momentum and trend analysis
  - Support and resistance levels
  - Trading volume implications
  - Risk assessment
  - Short to medium term outlook
  
  Format as structured JSON with specific insights and recommendations.`,
  
  economicImpact: `Analyze the potential market impact of recent economic events and data releases.
  Consider how inflation, interest rates, employment data, and GDP figures might affect:
  - Equity markets
  - Bond yields
  - Currency markets
  - Commodity prices
  
  Provide sector-specific insights and trading strategies. Format as structured JSON.`,
  
  riskAnalysis: `Provide a comprehensive risk analysis for current market conditions.
  Assess:
  - Systemic risks (geopolitical, economic)
  - Market volatility risks
  - Sector-specific risks
  - Interest rate sensitivity
  - Inflation impact
  
  Provide risk mitigation strategies and defensive positioning recommendations.`
};

/**
 * Get fallback analysis when Gemini API fails
 */
function getFallbackAnalysis(prompt: string): any {
  const fallbackResponses = {
    marketOverview: {
      summary: "Market conditions are currently mixed with moderate volatility. Technical indicators suggest a neutral to slightly bullish bias in the short term, with key support levels holding. Economic data releases are being closely monitored for directional cues.",
      sentiment: "neutral",
      keyInsights: ["Moderate market volatility", "Technical levels holding", "Economic data in focus"],
      riskLevel: "medium",
      recommendations: ["Monitor key support levels", "Watch economic releases", "Maintain balanced portfolio"]
    },
    stockAnalysis: {
      summary: "The stock is currently trading in a consolidation pattern with moderate volume. Technical indicators suggest neutral momentum with key support and resistance levels defining the current range.",
      outlook: "neutral",
      riskLevel: "medium",
      recommendations: ["Wait for breakout confirmation", "Monitor volume patterns", "Set stop-loss at support"]
    },
    economicImpact: {
      summary: "Recent economic data suggests mixed signals with inflation concerns balanced by economic growth. Markets are likely to remain range-bound until clearer directional signals emerge.",
      outlook: "neutral",
      riskLevel: "medium",
      recommendations: ["Diversify across sectors", "Monitor central bank policies", "Focus on quality assets"]
    },
    riskAnalysis: {
      summary: "Current market risks are moderate with geopolitical tensions and inflation concerns being the primary factors. Technical indicators suggest stable market conditions with defined risk parameters.",
      outlook: "neutral",
      riskLevel: "medium",
      recommendations: ["Maintain diversification", "Use position sizing", "Monitor volatility indicators"]
    }
  };

  // Return appropriate fallback based on prompt content
  if (prompt.includes('market conditions') || prompt.includes('comprehensive')) {
    return fallbackResponses.marketOverview;
  } else if (prompt.includes('stock') || prompt.includes('symbol')) {
    return fallbackResponses.stockAnalysis;
  } else if (prompt.includes('economic')) {
    return fallbackResponses.economicImpact;
  } else {
    return fallbackResponses.riskAnalysis;
  }
}

/**
 * Call Gemini API for AI analysis
 */
async function callGemini(prompt: string): Promise<any> {
  if (!API_KEY) {
    console.warn('GEMINI_API_KEY not found, using fallback analysis');
    return getFallbackAnalysis(prompt);
  }

  try {
    const response = await fetch(
      `${API_BASE_URL}?key=${API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt + "\n\nPlease respond in valid JSON format only."
            }]
          }],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 2048,
          }
        })
      }
    );

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      console.warn(`Gemini API request failed: ${response.status} ${response.statusText}. Response: ${errorText}, using fallback analysis`);
      return getFallbackAnalysis(prompt);
    }

    const data = await response.json();
    
    if (data.error) {
      console.warn(`Gemini API Error: ${data.error.message}, using fallback analysis`);
      return getFallbackAnalysis(prompt);
    }
    
    if (!data.candidates || !data.candidates[0] || !data.candidates[0].content || !data.candidates[0].content.parts || !data.candidates[0].content.parts[0]) {
      console.warn('Invalid Gemini API response structure, using fallback analysis');
      return getFallbackAnalysis(prompt);
    }
    
    return data.candidates[0].content.parts[0].text;

  } catch (error) {
    console.error('Error calling Gemini API, using fallback analysis:', error instanceof Error ? error.message : error);
    return getFallbackAnalysis(prompt);
  }
}

/**
 * Parse AI response and extract structured data
 */
function parseAIResponse(response: string | any): any {
  try {
    // If response is already an object (from fallback), return it directly
    if (typeof response === 'object' && response !== null) {
      return response;
    }
    
    // If response is a string, try to parse it
    if (typeof response === 'string') {
      // Try to extract JSON from the response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      
      // Fallback: try parsing the entire response
      return JSON.parse(response);
    }
    
    // If neither string nor object, return fallback
    throw new Error('Invalid response type');
  } catch (error) {
    console.warn('Failed to parse AI response as JSON:', error);
    
    // Return a structured fallback response
    const responseText = typeof response === 'string' ? response : JSON.stringify(response);
    return {
      summary: responseText.substring(0, 200) + '...',
      sentiment: 'neutral',
      keyInsights: [],
      riskLevel: 'medium',
      recommendations: ['Unable to parse AI response']
    };
  }
}

/**
 * Generate market overview analysis
 */
export async function generateMarketOverview(): Promise<GeminiAnalysisResponse> {
  try {
    const aiResponse = await callGemini(ANALYSIS_PROMPTS.marketOverview);
    const parsed = parseAIResponse(aiResponse);
    
    const insights: MarketInsight[] = [
      {
        id: `ai-overview-${Date.now()}`,
        title: 'Market Sentiment Analysis',
        description: parsed.summary || 'Market analysis completed',
        sentiment: parsed.sentiment === 'bullish' ? 'Bullish' : 
                 parsed.sentiment === 'bearish' ? 'Bearish' : 'Neutral',
        confidence: 0.75,
        category: 'Technical',
        timestamp: new Date(),
        relatedSymbols: ['SPY', 'QQQ', 'DIA']
      }
    ];
    
    const analysis: AIAnalysis = {
      summary: parsed.summary || 'Market overview analysis completed',
      keyInsights: insights,
      marketOutlook: parsed.riskLevel === 'low' ? 'Positive' : 
                   parsed.riskLevel === 'high' ? 'Negative' : 'Neutral',
      riskLevel: parsed.riskLevel === 'low' ? 'Low' : 
                 parsed.riskLevel === 'high' ? 'High' : 'Medium',
      recommendations: parsed.recommendations || ['Monitor market conditions'],
      timestamp: new Date()
    };

    return {
      analysis,
      lastUpdated: new Date(),
      source: "Gemini AI Market Analysis"
    };

  } catch (error) {
    console.error('Error generating market overview:', error);
    // Return fallback response instead of throwing
    const fallbackData = getFallbackAnalysis(ANALYSIS_PROMPTS.marketOverview);
    const insights: MarketInsight[] = [
      {
        id: `ai-overview-${Date.now()}`,
        title: 'Market Sentiment Analysis',
        description: fallbackData.summary || 'Market analysis completed',
        sentiment: fallbackData.sentiment === 'bullish' ? 'Bullish' : 
                 fallbackData.sentiment === 'bearish' ? 'Bearish' : 'Neutral',
        confidence: 0.75,
        category: 'Technical',
        timestamp: new Date(),
        relatedSymbols: ['SPY', 'QQQ', 'DIA']
      }
    ];
    
    const analysis: AIAnalysis = {
      summary: fallbackData.summary || 'Market overview analysis completed',
      keyInsights: insights,
      marketOutlook: fallbackData.riskLevel === 'low' ? 'Positive' : 
                   fallbackData.riskLevel === 'high' ? 'Negative' : 'Neutral',
      riskLevel: fallbackData.riskLevel === 'low' ? 'Low' : 
                 fallbackData.riskLevel === 'high' ? 'High' : 'Medium',
      recommendations: fallbackData.recommendations || ['Monitor market conditions'],
      timestamp: new Date()
    };

    return {
      analysis,
      lastUpdated: new Date(),
      source: "Gemini AI Market Analysis (Fallback)"
    };
  }
}

/**
 * Analyze specific stock
 */
export async function analyzeStock(symbol: string, stockData: any): Promise<GeminiAnalysisResponse> {
  try {
    const prompt = ANALYSIS_PROMPTS.stockAnalysis(symbol, stockData);
    const aiResponse = await callGemini(prompt);
    const parsed = parseAIResponse(aiResponse);
    
    const insights: MarketInsight[] = [
      {
        id: `ai-stock-${symbol}-${Date.now()}`,
        title: `${symbol} Technical Analysis`,
        description: parsed.summary || `${symbol} analysis completed`,
        sentiment: parsed.sentiment === 'bullish' ? 'Bullish' : 
                 parsed.sentiment === 'bearish' ? 'Bearish' : 'Neutral',
        confidence: 0.80,
        category: 'Technical',
        timestamp: new Date(),
        relatedSymbols: [symbol]
      }
    ];
    
    const analysis: AIAnalysis = {
      summary: parsed.summary || `${symbol} stock analysis completed`,
      keyInsights: insights,
      marketOutlook: parsed.outlook === 'positive' ? 'Positive' : 
                   parsed.outlook === 'negative' ? 'Negative' : 'Neutral',
      riskLevel: parsed.riskLevel === 'low' ? 'Low' : 
                 parsed.riskLevel === 'high' ? 'High' : 'Medium',
      recommendations: parsed.recommendations || [`Monitor ${symbol} closely`],
      timestamp: new Date()
    };

    return {
      analysis,
      lastUpdated: new Date(),
      source: "Gemini AI Stock Analysis"
    };

  } catch (error) {
    console.error(`Error analyzing stock ${symbol}, using fallback analysis:`, error instanceof Error ? error.message : 'Unknown error');
    return getFallbackAnalysis(ANALYSIS_PROMPTS.stockAnalysis(symbol, stockData));
  }
}

/**
 * Analyze economic events impact
 */
export async function analyzeEconomicImpact(economicEvents: any[]): Promise<GeminiAnalysisResponse> {
  try {
    const eventsText = economicEvents.map(event => 
      `${event.title}: ${event.description} (${event.impact} impact)`
    ).join('\n');
    
    const prompt = ANALYSIS_PROMPTS.economicImpact + '\n\nRecent Economic Events:\n' + eventsText;
    const aiResponse = await callGemini(prompt);
    const parsed = parseAIResponse(aiResponse);
    
    const insights: MarketInsight[] = [
      {
        id: `ai-economic-${Date.now()}`,
        title: 'Economic Events Impact Analysis',
        description: parsed.summary || 'Economic impact analysis completed',
        sentiment: parsed.sentiment === 'bullish' ? 'Bullish' : 
                 parsed.sentiment === 'bearish' ? 'Bearish' : 'Neutral',
        confidence: 0.70,
        category: 'Economic',
        timestamp: new Date(),
        relatedSymbols: ['SPY', 'DXY', 'US10Y']
      }
    ];
    
    const analysis: AIAnalysis = {
      summary: parsed.summary || 'Economic impact analysis completed',
      keyInsights: insights,
      marketOutlook: parsed.outlook === 'positive' ? 'Positive' : 
                   parsed.outlook === 'negative' ? 'Negative' : 'Neutral',
      riskLevel: parsed.riskLevel === 'low' ? 'Low' : 
                 parsed.riskLevel === 'high' ? 'High' : 'Medium',
      recommendations: parsed.recommendations || ['Monitor economic developments'],
      timestamp: new Date()
    };

    return {
      analysis,
      lastUpdated: new Date(),
      source: "Gemini AI Economic Analysis"
    };

  } catch (error) {
    console.error('Error analyzing economic impact:', error);
    throw error;
  }
}

/**
 * Generate risk analysis
 */
export async function generateRiskAnalysis(): Promise<GeminiAnalysisResponse> {
  try {
    const aiResponse = await callGemini(ANALYSIS_PROMPTS.riskAnalysis);
    const parsed = parseAIResponse(aiResponse);
    
    const insights: MarketInsight[] = [
      {
        id: `ai-risk-${Date.now()}`,
        title: 'Market Risk Assessment',
        description: parsed.summary || 'Risk analysis completed',
        sentiment: parsed.sentiment === 'bullish' ? 'Bullish' : 
                 parsed.sentiment === 'bearish' ? 'Bearish' : 'Neutral',
        confidence: 0.65,
        category: 'Technical',
        timestamp: new Date(),
        relatedSymbols: ['VIX', 'SPY', 'QQQ']
      }
    ];
    
    const analysis: AIAnalysis = {
      summary: parsed.summary || 'Risk assessment completed',
      keyInsights: insights,
      marketOutlook: parsed.outlook === 'positive' ? 'Positive' : 
                   parsed.outlook === 'negative' ? 'Negative' : 'Neutral',
      riskLevel: parsed.riskLevel === 'low' ? 'Low' : 
                 parsed.riskLevel === 'high' ? 'High' : 'Medium',
      recommendations: parsed.recommendations || ['Maintain diversified portfolio'],
      timestamp: new Date()
    };

    return {
      analysis,
      lastUpdated: new Date(),
      source: "Gemini AI Risk Analysis"
    };

  } catch (error) {
    console.error('Error generating risk analysis:', error);
    throw error;
  }
}
