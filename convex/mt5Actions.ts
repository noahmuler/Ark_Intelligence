"use node";

import { timingSafeEqual } from "node:crypto";
import { action } from "./_generated/server";
import { v } from "convex/values";
import { api, internal } from "./_generated/api";
import { terminalTradeValidator } from "./mt5Validators";

interface Trade {
  ticket: number;
  symbol: string;
  type: string;
  lots: number;
  openPrice: number;
  closePrice: number;
  openTime: number;
  closeTime: number;
  profit: number;
  commission: number;
  swap: number;
  isDeposit?: boolean;
  stopLoss?: number;
  takeProfit?: number;
  closeReason?: string;
}

export const syncTradesFromTerminal = action({
  args: {
    syncToken: v.string(),
    serverName: v.string(),
    accountLogin: v.string(),
    trades: v.array(terminalTradeValidator),
  },
  handler: async (
    ctx,
    args,
  ): Promise<{ success: boolean; tradesCount: number; lastSynced: number }> => {
    const expectedToken = process.env.MT5_SYNC_TOKEN;
    const expected = Buffer.from(expectedToken ?? "");
    const provided = Buffer.from(args.syncToken);

    if (
      !expectedToken ||
      expected.length < 32 ||
      expected.length !== provided.length ||
      !timingSafeEqual(expected, provided)
    ) {
      throw new Error("Unauthorized MT5 sync request");
    }

    const result: { success: boolean; tradesCount: number; lastSynced: number } =
      await ctx.runMutation(internal.mt5.syncTradesFromTerminal, {
        serverName: args.serverName,
        accountLogin: args.accountLogin,
        trades: args.trades,
      });
    return result;
  },
});

// Free approach: CSV import from MT5 terminal (optimized for Exness)
export const importTradesFromCSV = action({
  args: {
    userId: v.string(),
    csvData: v.string(), // CSV content as string
  },
  handler: async (ctx, args) => {
    try {
      // Helper: parse a numeric CSV column, defaulting to 0 for empty/NaN values
      const safeNum = (val: string | undefined, fallback = 0): number => {
        if (!val || val.trim() === '') return fallback;
        const n = parseFloat(val.trim());
        return isNaN(n) ? fallback : n;
      };

      const lines = args.csvData.split('\n');
      const trades: Trade[] = [];
      let skippedLines = 0;

      // Detect CSV format and delimiter from header
      const headerLine = lines[0].toLowerCase();
      const isExnessFormat = headerLine.includes('ticket') && headerLine.includes('opening_time_utc') && headerLine.includes('closing_time_utc');
      // Determine delimiter once from header — Exness uses commas
      const delimiter = headerLine.includes(';') ? ';' : ',';

      console.log("CSV Header:", lines[0]);
      console.log("Total lines:", lines.length);
      console.log("Delimiter:", delimiter);
      console.log("Format detected:", isExnessFormat ? "Exness" : "Generic");

      // Skip header row, process data rows
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) {
          skippedLines++;
          continue;
        }

        // Parse CSV line using the delimiter detected from header
        const columns = line.split(delimiter).map(col => col.trim());
        
        if (columns.length < 8) {
          console.log(`Line ${i}: Not enough columns (${columns.length})`);
          skippedLines++;
          continue;
        }

        let ticket, symbol, type, lots, openPrice, closePrice, openTime, closeTime, profit, commission, swap, stopLoss, takeProfit, closeReason;

        if (isExnessFormat) {
          // Exness MT5 CSV format: ticket,opening_time_utc,closing_time_utc,type,lots,original_position_size,symbol,opening_price,closing_price,stop_loss,take_profit,commission,swap,profit,equity,margin_level,close_reason
          ticket = parseInt(columns[0]);
          const openingTime = columns[1];
          const closingTime = columns[2];
          type = columns[3];
          lots = parseFloat(columns[4]);
          const originalPositionSize = columns[5];
          symbol = columns[6];
          openPrice = parseFloat(columns[7]);
          closePrice = parseFloat(columns[8]);
          const stopLossVal = safeNum(columns[9]);
          const takeProfitVal = safeNum(columns[10]);
          commission = safeNum(columns[11]);
          swap = safeNum(columns[12]);
          profit = safeNum(columns[13]);
          const equity = columns[14];
          const marginLevel = columns[15];
          
          stopLoss = isNaN(stopLossVal) || stopLossVal === 0 ? undefined : stopLossVal;
          takeProfit = isNaN(takeProfitVal) || takeProfitVal === 0 ? undefined : takeProfitVal;
          closeReason = columns[16] ? columns[16].trim() : undefined;

          // Parse ISO date strings
          openTime = new Date(openingTime).getTime();
          closeTime = new Date(closingTime).getTime();
        } else {
          // Generic MT5 format - try to detect column positions
          // Look for numeric ticket in first column
          ticket = parseInt(columns[0]);
          symbol = columns[1];
          type = columns[2];
          lots = parseFloat(columns[3]);
          openPrice = parseFloat(columns[4]);
          closePrice = parseFloat(columns[5]);
          openTime = new Date(columns[6]).getTime();
          closeTime = new Date(columns[7]).getTime();
          profit = parseFloat(columns[8] || '0');
          commission = parseFloat(columns[9] || '0');
          swap = parseFloat(columns[10] || '0');
          stopLoss = undefined;
          takeProfit = undefined;
          closeReason = undefined;
        }

        // Validate required fields
        if (isNaN(ticket) || isNaN(lots) || isNaN(openPrice)) {
          console.log(`Line ${i}: Invalid data - ticket: ${ticket}, lots: ${lots}, openPrice: ${openPrice}`);
          skippedLines++;
          continue;
        }

        // Validate dates
        if (isNaN(openTime) || isNaN(closeTime)) {
          console.log(`Line ${i}: Invalid dates - openTime: ${openTime}, closeTime: ${closeTime}`);
          skippedLines++;
          continue;
        }

        // Normalize trade type and identify deposits/withdrawals
        // Note: isDeposit = true ONLY for deposits (positive profit)
        // Withdrawals have isDeposit = undefined (falsy) and negative profit
        let isDeposit = false;
        const typeLower = type.toLowerCase();
        if (typeLower.includes('buy')) {
          type = 'BUY';
        } else if (typeLower.includes('sell')) {
          type = 'SELL';
        } else if (typeLower.includes('deposit') || typeLower.includes('balance')) {
          type = 'DEPOSIT';
          isDeposit = true; // Only deposits have isDeposit = true
        } else if (typeLower.includes('withdrawal') || typeLower.includes('withdraw')) {
          type = 'WITHDRAWAL';
          isDeposit = false; // Withdrawals have isDeposit = false, profit < 0 to indicate withdrawal
        }

        trades.push({
          ticket,
          symbol,
          type,
          lots,
          openPrice,
          closePrice,
          openTime,
          closeTime,
          profit,
          commission,
          swap,
          isDeposit,
          stopLoss,
          takeProfit,
          closeReason,
        });
      }

      console.log(`Processed ${trades.length} trades, skipped ${skippedLines} lines`);

      if (trades.length === 0) {
        return { 
          success: true, 
          tradesCount: 0, 
          trades: [], 
          message: `No valid trades found in CSV. Processed ${lines.length} lines, skipped ${skippedLines}. Please check your CSV format.` 
        };
      }

      // Store trades in database via mutation
      for (const trade of trades) {
        await ctx.runMutation(api.mt5.storeTrade, {
          userId: args.userId,
          ...trade,
        });
      }

      return { success: true, tradesCount: trades.length, trades };
    } catch (error) {
      console.error("Failed to import trades from CSV:", error);
      throw new Error(`Failed to import trades from CSV: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },
});
