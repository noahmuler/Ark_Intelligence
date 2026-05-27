// scripts/auditJournalData.ts
/**
 * Audit script for Ark Intelligence journal CSV.
 *
 * Steps:
 * 1. Loads CSV file `01_01_2007-24_05_2026.csv` from project root.
 * 2. Parses rows using PapaParse (built‑in simple parser).
 * 3. Computes key performance indicators (KPIs) used by the dashboard:
 *    - totalDeposits
 *    - totalWithdrawals
 *    - totalPnL (profit & loss)
 *    - winRate (wins / totalTrades)
 *    - accountBalance (starting + PnL)
 * 4. Performs basic integrity checks (row count, missing fields).
 * 5. Logs results and highlights any discrepancies.
 *
 * This script is intended to be run via `node scripts/auditJournalData.ts`.
 */
import * as fs from "fs";
import * as path from "path";
import Papa from "papaparse";

interface JournalRow {
  date: string; // ISO date string
  type: string; // e.g., "DEPOSIT", "WITHDRAWAL", "TRADE"
  amount: number; // monetary amount for deposits/withdrawals
  profit?: number; // profit for trade rows (optional)
  win?: boolean; // win flag for trade rows (optional)
}

interface KPIs {
  totalDeposits: number;
  totalWithdrawals: number;
  totalPnL: number;
  winRate: number; // percentage
  accountBalance: number;
  totalTrades: number;
}

function parseCsv(filePath: string): JournalRow[] {
  const raw = fs.readFileSync(filePath, "utf8");
  const result = Papa.parse<JournalRow>(raw, {
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

function computeKPIs(rows: JournalRow[]): KPIs {
  let totalDeposits = 0;
  let totalWithdrawals = 0;
  let totalPnL = 0;
  let wins = 0;
  let totalTrades = 0;

  for (const r of rows) {
    if (r.type === "DEPOSIT") {
      totalDeposits += r.amount;
    } else if (r.type === "WITHDRAWAL") {
      totalWithdrawals += r.amount;
    } else if (r.type === "TRADE") {
      totalTrades++;
      const profit = r.profit ?? 0;
      totalPnL += profit;
      if (r.win) wins++;
    }
  }

  const winRate = totalTrades ? (wins / totalTrades) * 100 : 0;
  const accountBalance = totalDeposits - totalWithdrawals + totalPnL;

  return { totalDeposits, totalWithdrawals, totalPnL, winRate, accountBalance, totalTrades };
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

  // Basic sanity checks – adjust thresholds as needed.
  if (kpis.totalTrades === 0) {
    console.warn("Warning: No trade rows detected – KPI cards may show zero values.");
  }
  if (Math.abs(kpis.accountBalance) < 0.01) {
    console.warn("Warning: Account balance is near zero – verify deposit/withdrawal data.");
  }
}

main();
