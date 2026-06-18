interface EdgeInputs {
  dxyTrend: 'up' | 'down' | 'flat';       // from real DXY price vs 20-period MA
  goldMomentum: number;                    // % change over 5 days
  vixLevel: number;                        // VIX (fetch from Finnhub: ^VIX or CBOE:VIX)
  yieldCurveSlope: number;                 // US10Y - US2Y spread
  newssentiment: number;                   // avg of last 10 headlines, -1 to 1
  breadth: 'expanding' | 'contracting';   // derived from market internals
}

export function calcEdgeFactor(inputs: EdgeInputs): {
  macro: number;
  technical: number;
  sentiment: number;
  total: number;
  regime: string;
} {
  // Macro score (0-100)
  // - DXY down + gold up = risk-off macro = lower macro score for equities
  // - VIX > 25 = high fear = penalize
  // - Yield curve inverted (negative slope) = recession risk = penalize
  const macroPenalty = (inputs.vixLevel > 25 ? 20 : inputs.vixLevel > 20 ? 10 : 0)
    + (inputs.yieldCurveSlope < 0 ? 15 : 0)
    + (inputs.dxyTrend === 'up' ? 10 : 0);
  const macro = Math.max(0, Math.min(100, 70 - macroPenalty));

  // Technical score (0-100)
  const technical = Math.max(0, Math.min(100,
    50
    + (inputs.goldMomentum > 0 ? Math.min(inputs.goldMomentum * 5, 30) : Math.max(inputs.goldMomentum * 5, -30))
    + (inputs.breadth === 'expanding' ? 20 : -10)
  ));

  // Sentiment score (0-100): map -1..1 to 0..100
  const sentiment = Math.round((inputs.newssentiment + 1) / 2 * 100);

  const total = Math.round((macro + technical + sentiment) / 3);

  const regime = total > 65 ? 'Risk-On' : total > 45 ? 'Neutral' : 'Risk-Off';

  return { macro, technical, sentiment, total, regime };
}
