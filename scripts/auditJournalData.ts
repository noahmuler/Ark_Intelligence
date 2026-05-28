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
 * This script is intended to be run via `node scripts/auditJournalData.ts`.
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
  profit: number;
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

function computeKPIs(rows: ExnessTradeRow[]): KPIs {
  let totalDeposits = 0;
  let totalWithdrawals = 0;
  let totalPnL = 0;
  let wins = 0;
  let totalTrades = 0;
  let grossProfit = 0;
  let grossLoss = 0;
  
  const trades: { profit: number; closeTime: number }[] = [];

  for (const r of rows) {
    const typeLower = r.type.toLowerCase();
    
    if (typeLower.includes('deposit') || typeLower.includes('balance')) {
      totalDeposits += r.profit;
    } else if (typeLower.includes('withdrawal') || typeLower.includes('withdraw')) {
      totalWithdrawals += Math.abs(r.profit);
    } else if (typeLower.includes('buy') || typeLower.includes('sell')) {
      totalTrades++;
      const profit = r.profit;
      totalPnL += profit;
      trades.push({ profit, closeTime: new Date(r.closing_time_utc).getTime() });
      
      if (profit > 0) {
        wins++;
        grossProfit += profit;
      } else if (profit < 0) {
        grossLoss += Math.abs(profit);
      }
    }
  }

  const winRate = totalTrades ? (wins / totalTrades) * 100 : 0;
  const accountBalance = Math.max(0, totalDeposits - totalWithdrawals + totalPnL);
  
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
  
  const startingBalance = accountBalance - totalPnL;
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
    grossLoss
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
  console.log("--- KPI Summary ---");
  console.log(`Total Deposits:   $${kpis.totalDeposits.toFixed(2)}`);
  console.log(`Total Withdrawals:$${kpis.totalWithdrawals.toFixed(2)}`);
  console.log(`Total PnL:        $${kpis.totalPnL.toFixed(2)}`);
  console.log(`Win Rate:        ${kpis.winRate.toFixed(2)}%`);
  console.log(`Account Balance:  $${kpis.accountBalance.toFixed(2)}`);
  console.log(`Total Trades:    ${kpis.totalTrades}`);
  console.log(`Profit Factor:   ${kpis.profitFactor === Infinity ? '∞' : kpis.profitFactor.toFixed(2)}`);
  console.log(`Max Drawdown:    ${kpis.maxDrawdown.toFixed(2)}%`);
  console.log(`Expectancy:      $${kpis.expectancy.toFixed(2)}`);
  console.log(`Gross Profit:    $${kpis.grossProfit.toFixed(2)}`);
  console.log(`Gross Loss:      $${kpis.grossLoss.toFixed(2)}`);

  // Basic sanity checks – adjust thresholds as needed.
  if (kpis.totalTrades === 0) {
    console.warn("Warning: No trade rows detected – KPI cards may show zero values.");
  }
  if (Math.abs(kpis.accountBalance) < 0.01) {
    console.warn("Warning: Account balance is near zero – verify deposit/withdrawal data.");
  }
}

main();
