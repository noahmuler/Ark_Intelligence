import { ReportData } from "@/app/reports/page";

/**
 * Generate a 3-sentence analysis of an economic report.
 * Each sentence covers: (1) what the data shows, (2) what it implies for policy/markets,
 * (3) what it means for major assets.
 */
export function getReportAnalysis(report: ReportData): string {
  const { name, actual, previous, direction, unit, category } = report;
  const val = actual !== null ? actual.toFixed(2) : "N/A";
  const prev = previous !== null ? previous.toFixed(2) : "N/A";
  const delta = actual !== null && previous !== null ? (actual - previous).toFixed(2) : "N/A";
  const deltaSign = actual !== null && previous !== null ? (actual > previous ? "+" : "") : "";

  // Sentence 1: What the data shows
  let s1 = "";
  if (direction === "beat") {
    s1 = `${name} printed at ${val}${unit}, beating the prior ${prev}${unit} reading — a favorable shift for markets.`;
  } else if (direction === "miss") {
    s1 = `${name} came in at ${val}${unit}, missing the prior ${prev}${unit} figure — a less favorable outcome.`;
  } else if (direction === "inline") {
    s1 = `${name} held steady at ${val}${unit}, essentially unchanged from the prior ${prev}${unit} reading.`;
  } else {
    s1 = `${name} registered at ${val}${unit} versus the previous ${prev}${unit}.`;
  }

  // Sentence 2: Policy / macro implication
  let s2 = "";
  if (category === "Inflation") {
    if (direction === "beat") {
      s2 = "Cooling inflation raises the odds of Fed rate cuts, which tends to support risk assets and weaken the dollar.";
    } else if (direction === "miss") {
      s2 = "Hotter inflation reduces the Fed's room to ease, potentially lifting Treasury yields and pressuring equities.";
    } else {
      s2 = "Stable inflation keeps the Fed on hold, preserving the current rate outlook without major shocks.";
    }
  } else if (category === "Employment") {
    if (name.includes("Unemployment") || name.includes("Jobless")) {
      if (direction === "beat") {
        s2 = "A tighter labor market signals economic resilience, but may also reduce the urgency for Fed easing.";
      } else if (direction === "miss") {
        s2 = "Weakening employment data increases the likelihood of Fed support, which can benefit risk assets.";
      } else {
        s2 = "The labor market is holding steady, offering neither strong hawkish nor dovish signals for the Fed.";
      }
    } else {
      // NFP / Payrolls
      if (direction === "beat") {
        s2 = "Strong job growth supports consumer spending and corporate earnings, though it may also delay rate cuts.";
      } else if (direction === "miss") {
        s2 = "Soft payrolls suggest cooling labor demand, increasing the probability of earlier Fed easing.";
      } else {
        s2 = "Payrolls came in line with expectations, leaving the Fed's policy path largely unchanged.";
      }
    }
  } else if (category === "Growth") {
    if (direction === "beat") {
      s2 = "Faster GDP growth underpins corporate profits and equity valuations, but may also extend the Fed's higher-for-longer stance.";
    } else if (direction === "miss") {
      s2 = "Slower growth points to a cooling economy, which typically raises expectations for monetary easing.";
    } else {
      s2 = "GDP growth is tracking consensus, providing no major catalyst for a shift in Fed or market positioning.";
    }
  } else if (category === "Fed") {
    if (direction === "beat") {
      s2 = "Higher rates increase borrowing costs across the economy, weighing on leveraged assets and growth stocks.";
    } else if (direction === "miss") {
      s2 = "Lower or steady rates support asset prices by reducing discount rates and improving risk appetite.";
    } else {
      s2 = "The Fed held rates steady, keeping the policy backdrop unchanged for now.";
    }
  } else if (category === "Consumer") {
    if (direction === "beat") {
      s2 = "Strong consumer spending supports retail and services sectors, underpinning broader economic momentum.";
    } else if (direction === "miss") {
      s2 = "Weak retail sales signal softening demand, which may weigh on corporate revenue forecasts.";
    } else {
      s2 = "Consumer spending is flat, neither accelerating nor decelerating the growth outlook.";
    }
  } else if (category === "Housing") {
    if (direction === "beat") {
      s2 = "A pickup in housing activity supports construction, materials, and mortgage-related sectors.";
    } else if (direction === "miss") {
      s2 = "Slowing housing starts reflect tighter credit conditions and may drag on broader growth.";
    } else {
      s2 = "Housing activity is stable, offering neither a boost nor a drag to the economy.";
    }
  } else if (category === "Sentiment") {
    if (direction === "beat") {
      s2 = "Improved consumer confidence typically supports discretionary spending and equity risk appetite.";
    } else if (direction === "miss") {
      s2 = "Declining sentiment can foreshadow weaker spending, creating headwinds for growth-sensitive assets.";
    } else {
      s2 = "Sentiment is unchanged, leaving the consumer outlook neutral.";
    }
  } else if (category === "Production") {
    if (direction === "beat") {
      s2 = "Stronger industrial output signals manufacturing resilience and supports cyclical equity sectors.";
    } else if (direction === "miss") {
      s2 = "Weaker production data points to a slowdown in the goods-producing side of the economy.";
    } else {
      s2 = "Industrial production is steady, neither accelerating nor slowing the factory sector.";
    }
  } else {
    s2 = "The data offers incremental insight into the state of the economy without a clear directional catalyst.";
  }

  // Sentence 3: Asset impact summary
  let s3 = "";
  const impacts = getAssetImpacts(report);
  const bullish = Object.entries(impacts).filter(([, v]) => v === "bullish").map(([k]) => k);
  const bearish = Object.entries(impacts).filter(([, v]) => v === "bearish").map(([k]) => k);
  
  if (bullish.length > 0 && bearish.length > 0) {
    s3 = `Bullish for ${bullish.join(", ")}; bearish for ${bearish.join(", ")}.`;
  } else if (bullish.length > 0) {
    s3 = `Broadly bullish for ${bullish.join(", ")}.`;
  } else if (bearish.length > 0) {
    s3 = `Broadly bearish for ${bearish.join(", ")}.`;
  } else {
    s3 = "Market impact is likely neutral across the major asset classes.";
  }

  return `${s1} ${s2} ${s3}`;
}

export type AssetImpact = "bullish" | "bearish" | "neutral";

export function getAssetImpacts(report: ReportData): Record<string, AssetImpact> {
  const { id, direction, category } = report;
  const result: Record<string, AssetImpact> = {
    XAU: "neutral",
    XAG: "neutral",
    BTC: "neutral",
    NQ: "neutral",
    SPY: "neutral",
  };

  if (direction === null) return result;

  const isBeat = direction === "beat";
  const isMiss = direction === "miss";

  // Inflation reports (lower is better for markets = beat is bullish)
  if (category === "Inflation") {
    if (isBeat) {
      result.XAU = "bullish";
      result.XAG = "bullish";
      result.BTC = "bullish";
      result.NQ = "bullish";
      result.SPY = "bullish";
    } else if (isMiss) {
      result.XAU = "bearish";
      result.XAG = "bearish";
      result.BTC = "bearish";
      result.NQ = "bearish";
      result.SPY = "bearish";
    }
  }
  // Employment: NFP / Payrolls (higher is better for economy but might delay rate cuts)
  else if (id === "PAYEMS") {
    if (isBeat) {
      result.XAU = "bearish"; // higher NFP = less rate cut urgency = bad for gold
      result.XAG = "bearish";
      result.BTC = "bearish";
      result.NQ = "bullish"; // strong jobs = strong economy
      result.SPY = "bullish";
    } else if (isMiss) {
      result.XAU = "bullish"; // weak jobs = more rate cuts = good for gold
      result.XAG = "bullish";
      result.BTC = "bullish";
      result.NQ = "bearish"; // weak jobs = weak economy
      result.SPY = "bearish";
    }
  }
  // Unemployment / Jobless Claims (lower is better)
  else if (id === "UNRATE" || id === "ICSA") {
    if (isBeat) {
      result.XAU = "bearish"; // lower unemployment = less rate cuts
      result.XAG = "bearish";
      result.BTC = "bearish";
      result.NQ = "bullish"; // strong labor = strong economy
      result.SPY = "bullish";
    } else if (isMiss) {
      result.XAU = "bullish"; // higher unemployment = more rate cuts
      result.XAG = "bullish";
      result.BTC = "bullish";
      result.NQ = "bearish";
      result.SPY = "bearish";
    }
  }
  // GDP (higher is better)
  else if (id === "GDP") {
    if (isBeat) {
      result.XAU = "bearish"; // strong growth = less safe-haven demand
      result.XAG = "bearish";
      result.BTC = "bullish"; // strong growth = risk-on
      result.NQ = "bullish";
      result.SPY = "bullish";
    } else if (isMiss) {
      result.XAU = "bullish"; // weak growth = safe-haven demand
      result.XAG = "bullish";
      result.BTC = "bearish";
      result.NQ = "bearish";
      result.SPY = "bearish";
    }
  }
  // Fed Funds Rate (higher = bearish for all, lower = bullish)
  else if (id === "DFF") {
    if (isBeat) { // higher rates
      result.XAU = "bearish";
      result.XAG = "bearish";
      result.BTC = "bearish";
      result.NQ = "bearish";
      result.SPY = "bearish";
    } else if (isMiss) { // lower rates
      result.XAU = "bullish";
      result.XAG = "bullish";
      result.BTC = "bullish";
      result.NQ = "bullish";
      result.SPY = "bullish";
    }
  }
  // Consumer (Retail Sales)
  else if (category === "Consumer") {
    if (isBeat) {
      result.XAU = "bearish";
      result.XAG = "bearish";
      result.BTC = "bullish";
      result.NQ = "bullish";
      result.SPY = "bullish";
    } else if (isMiss) {
      result.XAU = "bullish";
      result.XAG = "bullish";
      result.BTC = "bearish";
      result.NQ = "bearish";
      result.SPY = "bearish";
    }
  }
  // Housing
  else if (category === "Housing") {
    if (isBeat) {
      result.XAU = "bearish";
      result.XAG = "bearish";
      result.BTC = "bullish";
      result.NQ = "bullish";
      result.SPY = "bullish";
    } else if (isMiss) {
      result.XAU = "bullish";
      result.XAG = "bullish";
      result.BTC = "bearish";
      result.NQ = "bearish";
      result.SPY = "bearish";
    }
  }
  // Sentiment
  else if (category === "Sentiment") {
    if (isBeat) {
      result.XAU = "bearish";
      result.XAG = "bearish";
      result.BTC = "bullish";
      result.NQ = "bullish";
      result.SPY = "bullish";
    } else if (isMiss) {
      result.XAU = "bullish";
      result.XAG = "bullish";
      result.BTC = "bearish";
      result.NQ = "bearish";
      result.SPY = "bearish";
    }
  }
  // Production
  else if (category === "Production") {
    if (isBeat) {
      result.XAU = "bearish";
      result.XAG = "bearish";
      result.BTC = "bullish";
      result.NQ = "bullish";
      result.SPY = "bullish";
    } else if (isMiss) {
      result.XAU = "bullish";
      result.XAG = "bullish";
      result.BTC = "bearish";
      result.NQ = "bearish";
      result.SPY = "bearish";
    }
  }

  return result;
}
