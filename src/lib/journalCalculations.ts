export interface Trade {
  id: string;
  symbol: string;
  direction: 'long' | 'short';
  entryPrice: number;
  exitPrice: number | null;        // null = open trade
  stopLoss: number;
  takeProfit: number;
  size: number;                    // lot size or units
  commission: number;              // in account currency
  openedAt: string;                // ISO date
  closedAt: string | null;
  notes?: string;
  tags?: string[];
}

export interface TradeMetrics {
  pnl: number;
  pnlPercent: number;
  riskReward: number;
  plannedR: number;
  actualR: number;
  isWin: boolean;
  netPnl: number;                  // after commission
}

// CORRECT P&L calculation
export function calcPnl(trade: Trade): TradeMetrics | null {
  if (trade.exitPrice === null) return null; // open trade — never include in closed stats

  const rawPnl = trade.direction === 'long'
    ? (trade.exitPrice - trade.entryPrice) * trade.size
    : (trade.entryPrice - trade.exitPrice) * trade.size; // short: profit when price falls

  const netPnl = rawPnl - trade.commission;

  const risk = Math.abs(trade.entryPrice - trade.stopLoss) * trade.size;
  const reward = Math.abs(trade.takeProfit - trade.entryPrice) * trade.size;
  const plannedR = risk > 0 ? reward / risk : 0;

  // Actual R-multiple: how many R units did we actually make/lose?
  const actualR = risk > 0 ? rawPnl / risk : 0;

  const pnlPercent = risk > 0 ? (rawPnl / risk) * 100 : 0;

  return {
    pnl: rawPnl,
    netPnl,
    pnlPercent,
    riskReward: plannedR,
    plannedR,
    actualR,
    isWin: netPnl > 0,
  };
}

export interface JournalStats {
  totalTrades: number;
  closedTrades: number;
  openTrades: number;
  winRate: number;           // wins / closedTrades (NOT total)
  avgWin: number;
  avgLoss: number;
  profitFactor: number;      // grossProfit / |grossLoss|
  expectancy: number;        // (winRate * avgWin) + ((1 - winRate) * avgLoss)
  totalNetPnl: number;
  maxDrawdown: number;       // max peak-to-trough on equity curve
  maxDrawdownPercent: number;
  longestWinStreak: number;
  longestLossStreak: number;
  avgRMultiple: number;
  sharpeRatio: number;       // simplified: mean(returns) / std(returns) * sqrt(252)
  equityCurve: { date: string; equity: number }[];
}

export function calcJournalStats(trades: Trade[], startingBalance: number): JournalStats {
  const closed = trades.filter(t => t.exitPrice !== null && t.closedAt !== null)
    .sort((a, b) => new Date(a.closedAt!).getTime() - new Date(b.closedAt!).getTime());

  const metrics = closed.map(t => calcPnl(t)!);

  const wins = metrics.filter(m => m.isWin);
  const losses = metrics.filter(m => !m.isWin);

  const grossProfit = wins.reduce((s, m) => s + m.netPnl, 0);
  const grossLoss = Math.abs(losses.reduce((s, m) => s + m.netPnl, 0));

  const winRate = closed.length > 0 ? wins.length / closed.length : 0;
  const avgWin = wins.length > 0 ? grossProfit / wins.length : 0;
  const avgLoss = losses.length > 0 ? -(grossLoss / losses.length) : 0;

  // Equity curve
  let equity = startingBalance;
  const equityCurve = closed.map((t, i) => {
    equity += metrics[i].netPnl;
    return { date: t.closedAt!, equity };
  });

  // Max drawdown on equity curve
  let peak = startingBalance;
  let maxDD = 0;
  let maxDDPct = 0;
  let runningEq = startingBalance;
  for (const m of metrics) {
    runningEq += m.netPnl;
    if (runningEq > peak) peak = runningEq;
    const dd = peak - runningEq;
    const ddPct = peak > 0 ? dd / peak : 0;
    if (dd > maxDD) { maxDD = dd; maxDDPct = ddPct; }
  }

  // Win/loss streaks
  let curStreak = 0, maxWinStreak = 0, maxLossStreak = 0;
  let lastWin: boolean | null = null;
  for (const m of metrics) {
    if (m.isWin === lastWin) {
      curStreak++;
    } else {
      curStreak = 1;
      lastWin = m.isWin;
    }
    if (m.isWin && curStreak > maxWinStreak) maxWinStreak = curStreak;
    if (!m.isWin && curStreak > maxLossStreak) maxLossStreak = curStreak;
  }

  // Simplified Sharpe (daily returns)
  const returns = metrics.map(m => m.netPnl / startingBalance);
  const meanReturn = returns.reduce((s, r) => s + r, 0) / (returns.length || 1);
  const variance = returns.reduce((s, r) => s + (r - meanReturn) ** 2, 0) / (returns.length || 1);
  const stdDev = Math.sqrt(variance);
  const sharpe = stdDev > 0 ? (meanReturn / stdDev) * Math.sqrt(252) : 0;

  return {
    totalTrades: trades.length,
    closedTrades: closed.length,
    openTrades: trades.filter(t => t.exitPrice === null).length,
    winRate,
    avgWin,
    avgLoss,
    profitFactor: grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? Infinity : 0,
    expectancy: (winRate * avgWin) + ((1 - winRate) * avgLoss),
    totalNetPnl: grossProfit - grossLoss,
    maxDrawdown: maxDD,
    maxDrawdownPercent: maxDDPct,
    longestWinStreak: maxWinStreak,
    longestLossStreak: maxLossStreak,
    avgRMultiple: metrics.length > 0
      ? metrics.reduce((s, m) => s + m.actualR, 0) / metrics.length
      : 0,
    sharpeRatio: sharpe,
    equityCurve,
  };
}

// Rolling metrics for different time periods
export interface RollingStats {
  period: '7d' | '30d' | 'all';
  stats: JournalStats;
}

export function calcRollingStats(trades: Trade[], startingBalance: number): RollingStats[] {
  const now = new Date();
  
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const trades7d = trades.filter(t => new Date(t.openedAt) >= sevenDaysAgo);
  const trades30d = trades.filter(t => new Date(t.openedAt) >= thirtyDaysAgo);

  return [
    {
      period: '7d',
      stats: calcJournalStats(trades7d, startingBalance),
    },
    {
      period: '30d',
      stats: calcJournalStats(trades30d, startingBalance),
    },
    {
      period: 'all',
      stats: calcJournalStats(trades, startingBalance),
    },
  ];
}
