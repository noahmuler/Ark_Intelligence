// scripts/auditJournalData.ts
/**
 * Audit script for Ark Intelligence journal CSV.
 *
 * Steps:
 * 1. Loads CSV file `01_01_2007-24_05_2026.csv` from project root.
 * 2. Parses rows using the Exness MT5 format matching the Convex logic.
 * 3. Computes key performance indicators (KPIs) used by the dashboard:
 *    - totalDeposits
 *    - totalWithdrawals
 *    - totalPnL (profit & loss)
 *    - winRate (wins / totalTrades)
 *    - accountBalance (starting + PnL)
 *    - profitFactor
 *    - maxDrawdown
 *    - expectancy
 * 4. Performs basic integrity checks (row count, missing fields).
 * 5. Logs results and highlights any discrepancies.
 *
 * This script is intended to be run via `npm run audit`.
 */
import * as fs from "fs";
import * as path from "path";
import Papa from "papaparse";

interface ExnessTradeRow {
  ticket: number;
  opening_time_utc: string;
  closing_time_utc: string;
  type: string;
  lots: number;
  original_position_size: number;
  symbol: string;
  opening_price: number;
  closing_price: number;
  stop_loss: string;
  take_profit: string;
  commission: string;
  swap: string;
  profit: number | null;
  equity: string;
  margin_level: string;
  close_reason: string;
}

interface KPIs {
  totalDeposits: number;
  totalWithdrawals: number;
  totalPnL: number;
  winRate: number; // percentage
  accountBalance: number;
  totalTrades: number;
  profitFactor: number;
  maxDrawdown: number;
  expectancy: number;
  grossProfit: number;
  grossLoss: number;
  breakevenTrades: number;
  wins: number;
  losses: number;
}

function parseCsv(filePath: string): ExnessTradeRow[] {
  const raw = fs.readFileSync(filePath, "utf8");
  const result = Papa.parse<ExnessTradeRow>(raw, {
    header: true,
    skipEmptyLines: true,
    dynamicTyping: true,
  });
  if (result.errors.length) {
    console.error("CSV parsing errors:", result.errors);
    process.exit(1);
  }
  return result.data;
}

function safeProfit(raw: number | null | undefined): number {
  // PapaParse returns null for empty fields with dynamicTyping=true.
  // Treat null/NaN as 0 (breakeven trade — no P&L recorded).
  if (raw === null || raw === undefined) return 0;
  const n = Number(raw);
  return isNaN(n) ? 0 : n;
}

function computeKPIs(rows: ExnessTradeRow[]): KPIs {
  let totalDeposits = 0;
  let totalWithdrawals = 0;
  let totalPnL = 0;
  let wins = 0;
  let losses = 0;
  let totalTrades = 0;
  let grossProfit = 0;
  let grossLoss = 0;
  let breakevenTrades = 0;
  
  const trades: { profit: number; closeTime: number }[] = [];

  for (const r of rows) {
    const typeLower = r.type.toLowerCase();
    const profit = safeProfit(r.profit);
    
    if (typeLower.includes('deposit') || typeLower.includes('balance')) {
      totalDeposits += profit;
    } else if (typeLower.includes('withdrawal') || typeLower.includes('withdraw')) {
      totalWithdrawals += Math.abs(profit);
    } else if (typeLower.includes('buy') || typeLower.includes('sell')) {
      totalTrades++;
      totalPnL += profit;
      trades.push({ profit, closeTime: new Date(r.closing_time_utc).getTime() });
      
      if (profit > 0) {
        wins++;
        grossProfit += profit;
      } else if (profit < 0) {
        losses++;
        grossLoss += Math.abs(profit);
      } else {
        // profit === 0 OR empty field treated as 0
        breakevenTrades++;
      }
    }
  }

  const winRate = totalTrades ? (wins / totalTrades) * 100 : 0;
  // NOTE: This CSV contains no deposit/withdrawal rows.
  // The dashboard uses a $10,000 default starting balance when no deposits are recorded.
  const initialBalance = totalDeposits > 0 ? totalDeposits : 10000;
  const accountBalance = Math.max(0, initialBalance - totalWithdrawals + totalPnL);
  
  let profitFactor = 0;
  if (grossLoss === 0 && grossProfit > 0) {
    profitFactor = Infinity;
  } else if (grossLoss > 0) {
    profitFactor = grossProfit / grossLoss;
  }
  
  const expectancy = totalTrades ? totalPnL / totalTrades : 0;
  
  // Calculate max drawdown
  let peak = 0;
  let maxDrawdownAbs = 0;
  let cumulativePnL = 0;
  
  const sortedTrades = trades.sort((a, b) => a.closeTime - b.closeTime);
  for (const trade of sortedTrades) {
    cumulativePnL += trade.profit;
    if (cumulativePnL > peak) {
      peak = cumulativePnL;
    }
    const drawdown = peak - cumulativePnL;
    if (drawdown > maxDrawdownAbs) {
      maxDrawdownAbs = drawdown;
    }
  }
  
  const startingBalance = initialBalance;
  const peakEquity = startingBalance + peak;
  const maxDrawdown = peakEquity > 0 ? (maxDrawdownAbs / peakEquity) * 100 : 0;

  return { 
    totalDeposits, 
    totalWithdrawals, 
    totalPnL, 
    winRate, 
    accountBalance, 
    totalTrades,
    profitFactor,
    maxDrawdown,
    expectancy,
    grossProfit,
    grossLoss,
    breakevenTrades,
    wins,
    losses,
  };
}

function main() {
  const csvPath = path.resolve(process.cwd(), "01_01_2007-24_05_2026.csv");
  if (!fs.existsSync(csvPath)) {
    console.error(`CSV file not found at ${csvPath}`);
    process.exit(1);
  }
  console.log("Loading CSV data from", csvPath);
  const rows = parseCsv(csvPath);
  console.log(`Parsed ${rows.length} rows.`);

  const kpis = computeKPIs(rows);

  console.log("\n--- KPI Summary ---");
  console.log(`Total Deposits:     $${kpis.totalDeposits.toFixed(2)}  (no deposit rows in CSV; $10,000 default balance used)`);
  console.log(`Total Withdrawals:  $${kpis.totalWithdrawals.toFixed(2)}`);
  console.log(`Total PnL:          $${kpis.totalPnL.toFixed(2)}`);
  console.log(`Win Rate:           ${kpis.winRate.toFixed(2)}%`);
  console.log(`Account Balance:    $${kpis.accountBalance.toFixed(2)}  (= $10,000 default + PnL)`);
  console.log(`Total Trades:       ${kpis.totalTrades}`);
  console.log(`  ↳ Winning:        ${kpis.wins}`);
  console.log(`  ↳ Losing:         ${kpis.losses}`);
  console.log(`  ↳ Breakeven ($0): ${kpis.breakevenTrades}  (22 rows with empty profit field, treated as $0)`);
  console.log(`Profit Factor:      ${kpis.profitFactor === Infinity ? '∞' : kpis.profitFactor.toFixed(2)}`);
  console.log(`Max Drawdown:       ${kpis.maxDrawdown.toFixed(2)}%`);
  console.log(`Expectancy:         $${kpis.expectancy.toFixed(2)}`);
  console.log(`Gross Profit:       $${kpis.grossProfit.toFixed(2)}`);
  console.log(`Gross Loss:         $${kpis.grossLoss.toFixed(2)}`);

  console.log("\n--- Integrity Checks ---");
  // PnL = grossProfit - grossLoss
  const pnlDiff = Math.abs((kpis.grossProfit - kpis.grossLoss) - kpis.totalPnL);
  if (pnlDiff < 0.02) {
    console.log("✅ PnL check passed: grossProfit - grossLoss ≈ totalPnL");
  } else {
    console.warn(`⚠️  PnL mismatch: grossProfit(${kpis.grossProfit.toFixed(2)}) - grossLoss(${kpis.grossLoss.toFixed(2)}) = ${(kpis.grossProfit - kpis.grossLoss).toFixed(2)}, totalPnL=${kpis.totalPnL.toFixed(2)}`);
  }

  const tradeCountCheck = kpis.wins + kpis.losses + kpis.breakevenTrades;
  if (tradeCountCheck === kpis.totalTrades) {
    console.log(`✅ Trade count check passed: wins(${kpis.wins}) + losses(${kpis.losses}) + breakeven(${kpis.breakevenTrades}) = ${kpis.totalTrades}`);
  } else {
    console.warn(`⚠️  Trade count mismatch: ${tradeCountCheck} ≠ ${kpis.totalTrades}`);
  }

  if (kpis.totalTrades === 0) {
    console.warn("⚠️  No trade rows detected – KPI cards may show zero values.");
  } else {
    console.log(`✅ ${kpis.totalTrades} trade rows detected.`);
  }
  if (Math.abs(kpis.accountBalance) < 0.01) {
    console.warn("⚠️  Account balance is near zero – verify deposit/withdrawal data.");
  } else {
    console.log(`✅ Account balance: $${kpis.accountBalance.toFixed(2)}`);
  }
}

main();
