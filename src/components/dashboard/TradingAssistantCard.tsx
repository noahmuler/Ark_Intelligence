"use client";

import React, { useMemo, useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Brain, Send, Sparkles } from "lucide-react";

const COMMON_PROMPTS = [
  "What's the highest probability setup for today across EUR, GBP, JPY, USD?",
  "Give me a trade plan for XAUUSD: entry, stop, targets, and invalidation.",
  "BTC: should I trend-follow or fade? Provide levels + risk.",
  "WTI vs DXY: what's driving the spread right now?",
];

const TradingAssistantCard = React.memo(function TradingAssistantCard({ className = "" }: { className?: string }) {
  const [prompt, setPrompt] = useState("");
  const [messages, setMessages] = useState<Array<{ role: "user" | "assistant"; content: string }>>([]);
  const [isSending, setIsSending] = useState(false);

  const quickPrompts = useMemo(() => COMMON_PROMPTS, []);

  const runAssistant = useCallback(async (text: string) => {
    setIsSending(true);
    setMessages((m) => [...m, { role: "user", content: text }]);

    // Integration placeholder: if there is an existing assistant API in the repo, wire it here.
    // For now we produce a helpful deterministic response.
    await new Promise((r) => setTimeout(r, 800));

    const assistant =
      "Actionable plan (template):\n\n" +
      "1) Bias: identify which of USD strength / yields / risk appetite is dominating.\n" +
      "2) Levels: mark invalidation first, then define entry zones and two targets.\n" +
      "3) Execution: confirm session overlap liquidity; wait for clean rejection/break.\n" +
      "4) Risk: position sizing so stop distance matches your % risk.\n\n" +
      "If you want, tell me your timeframe (scalp/swing) and max % risk. Then I'll format it for your exact order type.";

    setMessages((m) => [...m, { role: "assistant", content: assistant }]);
    setPrompt("");
    setIsSending(false);
  }, []);

  const handleClear = useCallback(() => {
    setMessages([]);
    setPrompt("");
  }, []);

  const handleQuickFill = useCallback(() => {
    setPrompt(quickPrompts[0]);
  }, [quickPrompts]);

  const handleSend = useCallback(() => {
    const trimmed = prompt.trim();
    if (!trimmed) return;
    runAssistant(trimmed);
  }, [prompt, runAssistant]);

  return (
    <Card className={`overflow-hidden min-h-[380px] border-purple-900/60 bg-purple-950/40 backdrop-blur-xl hover:border-purple-500/60 hover:shadow-lg hover:shadow-purple-500/20 transition-all duration-300 ease-in-out ${className}`}>
      <div className="absolute inset-0 bg-gradient-to-br from-purple-600/5 via-transparent to-blue-600/5 -z-10" />
      <CardContent className="p-4 relative">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div>
            <div className="flex items-center gap-2">
              <Brain className="h-4 w-4 text-purple-300" />
              <div className="text-base font-bold text-white tracking-wide">Trading Assistant</div>
            </div>
            <div className="text-xs text-purple-200/70 tracking-wide">Ask about markets, trades, or analysis</div>
          </div>
          <Badge variant="outline" className="text-purple-200/80 border-purple-400/30 text-xs">Local helper</Badge>
        </div>

        <div className="rounded-xl border border-purple-900/60 bg-purple-950/40 p-3">
          <div className="flex items-center justify-between gap-3 mb-2">
            <div className="text-sm text-purple-200/90 font-medium tracking-wide">Prompt</div>
            <div className="flex items-center gap-2 text-xs text-purple-200/70 tracking-wide">
              <Sparkles className="h-3 w-3" />
              Quick-fill below
            </div>
          </div>

          <div className="mt-2">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={3}
              placeholder="Type your question…"
              className="w-full resize-none rounded-xl border border-purple-800/60 bg-purple-950/40 px-3 py-2 text-sm text-white placeholder:text-purple-200/40 focus:outline-none focus:ring-2 focus:ring-purple-500/40 tracking-wide"
            />
          </div>

          <div className="mt-3 flex items-center gap-3">
            <button
              className="flex-1 px-3 py-2 bg-purple-500/20 text-purple-300 text-sm rounded-lg hover:bg-purple-500/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed tracking-wide"
              onClick={handleQuickFill}
            >
              Quick Fill
            </button>
            <button
              className="flex-1 px-3 py-2 bg-purple-500/20 text-purple-300 text-sm rounded-lg hover:bg-purple-500/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed tracking-wide"
              onClick={handleSend}
              disabled={isSending || !prompt.trim()}
            >
              {isSending ? "Sending…" : "Send"}
            </button>
          </div>
        </div>

        {messages.length > 0 && (
          <div className="mt-4 space-y-2">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`rounded-xl p-3 ${
                  msg.role === "user"
                    ? "bg-purple-900/50 border border-purple-800/50"
                    : "bg-purple-950/50 border border-purple-800/50"
                }`}
              >
                <div className="text-xs font-semibold text-purple-300 mb-1 tracking-wide">{msg.role === "user" ? "You" : "AI"}</div>
                <div className="text-sm text-white/90 tracking-wide whitespace-pre-wrap">{msg.content}</div>
              </div>
            ))}
          </div>
        )}

        {messages.length > 0 && (
          <div className="mt-3">
            <button
              className="w-full px-3 py-2 bg-purple-800 text-purple-300 text-sm rounded-lg hover:bg-purple-700 transition-colors tracking-wide"
              onClick={handleClear}
            >
              Clear Chat
            </button>
          </div>
        )}
      </CardContent>
    </Card>
  );
});

export default TradingAssistantCard;
