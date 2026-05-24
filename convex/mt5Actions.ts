"use node";

import { action } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";

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
}

// Fetch trade history from MT5 API
export const fetchTradeHistory = action({
  args: {
    userId: v.string(),
    serverName: v.string(),
    accountLogin: v.string(),
    investorPassword: v.string(),
  },
  handler: async (ctx, args) => {
    try {
      // Try MetaApi first
      let trades: Trade[] = [];
      let metaApiError: Error | null = null;

      try {
        trades = await fetchTradesFromMetaApi({
          server: args.serverName,
          login: args.accountLogin,
          password: args.investorPassword,
        });
      } catch (error) {
        metaApiError = error instanceof Error ? error : new Error(String(error));
        console.error("MetaApi failed, trying alternative approach:", metaApiError);
      }

      // If MetaApi failed, try alternative approach
      if (trades.length === 0 && metaApiError) {
        try {
          trades = await fetchTradesFromDirectAPI({
            server: args.serverName,
            login: args.accountLogin,
            password: args.investorPassword,
          });
        } catch (error) {
          console.error("Direct API also failed:", error);
          throw new Error(
            `Failed to fetch trades from both MetaApi and direct API. ` +
            `MetaApi error: ${metaApiError.message}. ` +
            `Please check your MT5 credentials and ensure your broker supports API access.`
          );
        }
      }

      if (!trades || trades.length === 0) {
        return { success: true, tradesCount: 0, trades: [], message: "No trades found in the specified time range" };
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
      console.error("Failed to fetch trade history from MT5:", error);
      throw new Error(`Failed to fetch trade history: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },
});

// Helper function to fetch trades from MetaApi
async function fetchTradesFromMetaApi(credentials: {
  server: string;
  login: string;
  password: string;
}): Promise<Trade[]> {
  const metaApiToken = process.env.METAAPI_TOKEN;

  if (!metaApiToken) {
    throw new Error("METAAPI_TOKEN environment variable is not set");
  }

  // Import MetaApi dynamically
  const MetaApi = require('metaapi.cloud-sdk').default;
  const metaApi = new MetaApi(metaApiToken);

  // Try to get existing account first
  const accounts = await metaApi.metatraderAccountApi.getAccounts();
  let account = accounts.find((a: any) => a.login === credentials.login);

  if (!account) {
    // Create new account
    account = await metaApi.metatraderAccountApi.createAccount({
      id: `mt5-${credentials.login}`,
      name: `MT5 Account ${credentials.login}`,
      type: 'cloud-g1',
      server: credentials.server,
      login: credentials.login,
      password: credentials.password,
      magic: 0,
      application: 'Ark Intelligence',
    });
  }

  // Wait for connection with timeout
  const TIMEOUT_MS = 30000; // 30 seconds
  await Promise.race([
    account.waitConnected(),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error('waitConnected timed out after 30s')), TIMEOUT_MS)
    ),
  ]);

  // Get account instance
  const accountInstance = await account.connect();

  // Fetch trade history
  const historyOrders = await accountInstance.getHistoryOrdersByTimeRange(
    new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    new Date()
  );

  // Convert to our trade format
  const trades: Trade[] = historyOrders
    .filter((order: any) => order.type === 'ORDER_TYPE_BUY' || order.type === 'ORDER_TYPE_SELL')
    .map((order: any) => ({
      ticket: order.id,
      symbol: order.symbol,
      type: order.type === 'ORDER_TYPE_BUY' ? 'BUY' : 'SELL',
      lots: order.volume,
      openPrice: order.price,
      closePrice: order.closePrice || order.currentPrice || order.price,
      openTime: order.time,
      closeTime: order.closeTime || order.doneTime || order.time,
      profit: order.profit || 0,
      commission: order.commission || 0,
      swap: order.swap || 0,
    }));

  return trades;
}

// Alternative approach: Direct HTTP API (if broker supports it)
async function fetchTradesFromDirectAPI(credentials: {
  server: string;
  login: string;
  password: string;
}): Promise<Trade[]> {
  // This is a placeholder for direct broker API integration
  // Many brokers provide REST APIs for accessing trade history
  // You would need to implement this based on your specific broker's API

  throw new Error(
    "Direct API integration not implemented. " +
    "Please implement fetchTradesFromDirectAPI based on your broker's API documentation. " +
    "Alternatively, use the free CSV import feature by exporting trades from MT5 terminal."
  );
}

// Free approach: CSV import from MT5 terminal (optimized for Exness)
export const importTradesFromCSV = action({
  args: {
    userId: v.string(),
    csvData: v.string(), // CSV content as string
  },
  handler: async (ctx, args) => {
    try {
      const lines = args.csvData.split('\n');
      const trades: Trade[] = [];
      let skippedLines = 0;

      // Detect CSV format by checking header
      const headerLine = lines[0].toLowerCase();
      const isExnessFormat = headerLine.includes('ticket') && headerLine.includes('opening_time_utc') && headerLine.includes('closing_time_utc');

      console.log("CSV Header:", lines[0]);
      console.log("Total lines:", lines.length);
      console.log("Format detected:", isExnessFormat ? "Exness" : "Generic");

      // Skip header row, process data rows
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) {
          skippedLines++;
          continue;
        }

        // Parse CSV line (handle both comma and semicolon delimiters)
        const delimiter = line.includes(';') ? ';' : ',';
        const columns = line.split(delimiter).map(col => col.trim());
        
        if (columns.length < 8) {
          console.log(`Line ${i}: Not enough columns (${columns.length})`);
          skippedLines++;
          continue;
        }

        let ticket, symbol, type, lots, openPrice, closePrice, openTime, closeTime, profit, commission, swap;

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
          const stopLoss = columns[9];
          const takeProfit = columns[10];
          commission = parseFloat(columns[11] || '0');
          swap = parseFloat(columns[12] || '0');
          profit = parseFloat(columns[13] || '0');
          const equity = columns[14];
          const marginLevel = columns[15];
          const closeReason = columns[16];

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
        let isDeposit = false;
        const typeLower = type.toLowerCase();
        if (typeLower.includes('buy')) {
          type = 'BUY';
        } else if (typeLower.includes('sell')) {
          type = 'SELL';
        } else if (typeLower.includes('deposit') || typeLower.includes('balance')) {
          type = 'DEPOSIT';
          isDeposit = true;
        } else if (typeLower.includes('withdrawal') || typeLower.includes('withdraw')) {
          type = 'WITHDRAWAL';
          isDeposit = true;
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
