#property strict
#property version   "1.00"
#property description "Read-only local trade-history sync for Ark Intelligence"

input string SyncEndpoint = "http://127.0.0.1:3000/api/mt5/sync";
input string SyncToken = "";
input int SyncIntervalSeconds = 60;
input int TradesPerBatch = 100;

bool syncing = false;

string JsonEscape(string value)
{
   StringReplace(value, "\\", "\\\\");
   StringReplace(value, "\"", "\\\"");
   StringReplace(value, "\r", "\\r");
   StringReplace(value, "\n", "\\n");
   StringReplace(value, "\t", "\\t");
   return value;
}

string JsonNumber(double value)
{
   return DoubleToString(value, 8);
}

bool FindOpeningDeal(long positionId, ulong &openingDeal)
{
   int total = HistoryDealsTotal();
   for(int i = 0; i < total; i++)
   {
      ulong ticket = HistoryDealGetTicket(i);
      if(ticket == 0)
         continue;

      if(HistoryDealGetInteger(ticket, DEAL_POSITION_ID) != positionId)
         continue;

      long entry = HistoryDealGetInteger(ticket, DEAL_ENTRY);
      if(entry == DEAL_ENTRY_IN || entry == DEAL_ENTRY_INOUT)
      {
         openingDeal = ticket;
         return true;
      }
   }
   return false;
}

string SerializeDeal(ulong ticket)
{
   long dealType = HistoryDealGetInteger(ticket, DEAL_TYPE);
   long entry = HistoryDealGetInteger(ticket, DEAL_ENTRY);
   double profit = HistoryDealGetDouble(ticket, DEAL_PROFIT);
   double commission = HistoryDealGetDouble(ticket, DEAL_COMMISSION);
   double swap = HistoryDealGetDouble(ticket, DEAL_SWAP);
   double closePrice = HistoryDealGetDouble(ticket, DEAL_PRICE);
   double volume = HistoryDealGetDouble(ticket, DEAL_VOLUME);
   long closeTime = HistoryDealGetInteger(ticket, DEAL_TIME_MSC);
   string symbol = HistoryDealGetString(ticket, DEAL_SYMBOL);
   string type;
   string closeReason = "user";
   double openPrice = closePrice;
   double stopLoss = HistoryDealGetDouble(ticket, DEAL_SL);
   double takeProfit = HistoryDealGetDouble(ticket, DEAL_TP);
   long openTime = closeTime;
   bool isDeposit = false;

   if(dealType == DEAL_TYPE_BALANCE)
   {
      type = profit >= 0 ? "DEPOSIT" : "WITHDRAWAL";
      symbol = "BALANCE";
      isDeposit = true;
      volume = 0;
   }
   else
   {
      if(entry != DEAL_ENTRY_OUT && entry != DEAL_ENTRY_OUT_BY)
         return "";

      long positionId = HistoryDealGetInteger(ticket, DEAL_POSITION_ID);
      ulong openingDeal = 0;
      bool hasOpeningDeal = FindOpeningDeal(positionId, openingDeal);

      if(hasOpeningDeal)
      {
         long openingType = HistoryDealGetInteger(openingDeal, DEAL_TYPE);
         type = openingType == DEAL_TYPE_BUY ? "BUY" : "SELL";
         openPrice = HistoryDealGetDouble(openingDeal, DEAL_PRICE);
         openTime = HistoryDealGetInteger(openingDeal, DEAL_TIME_MSC);
         double openingStopLoss = HistoryDealGetDouble(openingDeal, DEAL_SL);
         double openingTakeProfit = HistoryDealGetDouble(openingDeal, DEAL_TP);
         if(stopLoss == 0)
            stopLoss = openingStopLoss;
         if(takeProfit == 0)
            takeProfit = openingTakeProfit;
      }
      else
      {
         type = dealType == DEAL_TYPE_SELL ? "BUY" : "SELL";
      }

      long reason = HistoryDealGetInteger(ticket, DEAL_REASON);
      if(reason == DEAL_REASON_SL)
         closeReason = "sl";
      else if(reason == DEAL_REASON_TP)
         closeReason = "tp";
   }

   return StringFormat(
      "{\"ticket\":%s,\"symbol\":\"%s\",\"type\":\"%s\",\"lots\":%s,"
      "\"openPrice\":%s,\"closePrice\":%s,\"openTime\":%s,\"closeTime\":%s,"
      "\"profit\":%s,\"commission\":%s,\"swap\":%s,\"isDeposit\":%s,"
      "\"stopLoss\":%s,\"takeProfit\":%s,\"closeReason\":\"%s\"}",
      LongToString((long)ticket),
      JsonEscape(symbol),
      type,
      JsonNumber(volume),
      JsonNumber(openPrice),
      JsonNumber(closePrice),
      LongToString(openTime),
      LongToString(closeTime),
      JsonNumber(profit),
      JsonNumber(commission),
      JsonNumber(swap),
      isDeposit ? "true" : "false",
      JsonNumber(stopLoss),
      JsonNumber(takeProfit),
      closeReason
   );
}

bool SendBatch(string tradesJson)
{
   string body = StringFormat(
      "{\"serverName\":\"%s\",\"accountLogin\":\"%s\",\"trades\":[%s]}",
      JsonEscape(AccountInfoString(ACCOUNT_SERVER)),
      LongToString(AccountInfoInteger(ACCOUNT_LOGIN)),
      tradesJson
   );
   char data[];
   char response[];
   string responseHeaders;
   int copied = StringToCharArray(body, data, 0, WHOLE_ARRAY, CP_UTF8);
   if(copied <= 1)
   {
      Print("Ark Journal sync: failed to encode request.");
      return false;
   }
   ArrayResize(data, copied - 1);

   string headers = "Content-Type: application/json\r\nAuthorization: Bearer " + SyncToken + "\r\n";
   ResetLastError();
   int status = WebRequest("POST", SyncEndpoint, headers, 10000, data, response, responseHeaders);
   if(status < 0)
   {
      PrintFormat("Ark Journal sync: WebRequest failed (%d). Check the allowed URL and local dashboard.", GetLastError());
      return false;
   }
   if(status < 200 || status >= 300)
   {
      PrintFormat("Ark Journal sync: server returned HTTP %d.", status);
      return false;
   }
   return true;
}

void SyncHistory()
{
   if(syncing)
      return;
   if(StringLen(SyncToken) < 32)
   {
      Print("Ark Journal sync: set the local sync key in the EA inputs.");
      return;
   }

   syncing = true;
   string checkpointPrefix = "ArkJournalSync_" + LongToString(AccountInfoInteger(ACCOUNT_LOGIN));
   string checkpointTimeName = checkpointPrefix + "_time";
   string checkpointTicketName = checkpointPrefix + "_ticket";
   long checkpointTime = 0;
   ulong checkpointTicket = 0;
   if(GlobalVariableCheck(checkpointTimeName) && GlobalVariableCheck(checkpointTicketName))
   {
      checkpointTime = (long)GlobalVariableGet(checkpointTimeName);
      checkpointTicket = (ulong)GlobalVariableGet(checkpointTicketName);
   }

   if(!HistorySelect(0, TimeCurrent()))
   {
      PrintFormat("Ark Journal sync: could not read account history (%d).", GetLastError());
      syncing = false;
      return;
   }

   int total = HistoryDealsTotal();
   int batchLimit = (int)MathMax(1, MathMin(TradesPerBatch, 100));
   string batch = "";
   int batchCount = 0;
   int syncedCount = 0;
   bool allBatchesSucceeded = true;
   long newestHistoryTime = checkpointTime;
   ulong newestHistoryTicket = checkpointTicket;

   for(int i = 0; i < total; i++)
   {
      ulong ticket = HistoryDealGetTicket(i);
      if(ticket == 0)
         continue;

      long dealTime = HistoryDealGetInteger(ticket, DEAL_TIME_MSC);
      if(dealTime > newestHistoryTime ||
         (dealTime == newestHistoryTime && ticket > newestHistoryTicket))
      {
         newestHistoryTime = dealTime;
         newestHistoryTicket = ticket;
      }

      if(dealTime < checkpointTime ||
         (dealTime == checkpointTime && ticket <= checkpointTicket))
         continue;

      string trade = SerializeDeal(ticket);
      if(StringLen(trade) == 0)
         continue;

      if(batchCount > 0)
         batch += ",";
      batch += trade;
      batchCount++;
      syncedCount++;

      if(batchCount >= batchLimit)
      {
         if(!SendBatch(batch))
         {
            allBatchesSucceeded = false;
            break;
         }
         batch = "";
         batchCount = 0;
      }
   }

   if(allBatchesSucceeded && (batchCount > 0 || syncedCount == 0))
      allBatchesSucceeded = SendBatch(batch);

   if(allBatchesSucceeded)
   {
      if(!GlobalVariableSet(checkpointTimeName, (double)newestHistoryTime) ||
         !GlobalVariableSet(checkpointTicketName, (double)newestHistoryTicket))
         PrintFormat("Ark Journal sync: could not save the history checkpoint (%d).", GetLastError());
      PrintFormat("Ark Journal sync: sent %d history records.", syncedCount);
   }
   syncing = false;
}

int OnInit()
{
   if(StringLen(SyncToken) < 32)
      Print("Ark Journal sync: add the local sync key in the EA inputs before syncing.");

   EventSetTimer((int)MathMax(15, SyncIntervalSeconds));
   SyncHistory();
   return INIT_SUCCEEDED;
}

void OnDeinit(const int reason)
{
   EventKillTimer();
}

void OnTimer()
{
   SyncHistory();
}
