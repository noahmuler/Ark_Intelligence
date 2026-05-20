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
    <Card className={`overflow-hidden min-h-[380px] rounded-xl border border-white/10 bg-purple-950/30 backdrop-blur-[12px] hover:border-purple-500/40 hover:shadow-lg hover:shadow-purple-500/10 transition-all duration-300 ease-in-out ${className}`}>
      <CardContent className="p-3 relative">
        <div className="flex items-start justify-between gap-2 mb-3">
          <div>
            <div className="text-xs font-semibold text-white/90 tracking-wider uppercase">Trading Assistant</div>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-1 h-1 rounded-full bg-purple-400/60" />
            <span className="text-xs text-purple-300/60 tracking-tight">Local</span>
          </div>
        </div>

        <div className="rounded-lg border border-white/5 bg-purple-950/20 p-3">
          <div className="flex items-center justify-between gap-3 mb-2">
            <div className="text-xs text-purple-300/70 font-medium tracking-tight">Prompt</div>
            <div className="flex items-center gap-2 text-xs text-purple-300/60 tracking-tight">
              <Sparkles className="h-3 w-3" />
              Quick-fill
            </div>
          </div>

          <div className="mt-2">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={3}
              placeholder="Type your question…"
              className="w-full resize-none rounded-lg border border-white/10 bg-purple-950/30 px-3 py-2 text-sm text-white placeholder:text-purple-300/40 focus:outline-none focus:ring-2 focus:ring-purple-500/30 tracking-tight"
            />
          </div>

          <div className="mt-3 flex items-center gap-3">
            <button
              className="flex-1 px-3 py-2 bg-purple-500/15 text-purple-300/80 text-sm rounded-lg hover:bg-purple-500/25 transition-colors disabled:opacity-50 disabled:cursor-not-allowed tracking-tight"
              onClick={handleQuickFill}
            >
              Quick Fill
            </button>
            <button
              className="flex-1 px-3 py-2 bg-purple-500/15 text-purple-300/80 text-sm rounded-lg hover:bg-purple-500/25 transition-colors disabled:opacity-50 disabled:cursor-not-allowed tracking-tight"
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
                className={`rounded-lg p-3 ${
                  msg.role === "user"
                    ? "bg-purple-900/30 border border-white/5"
                    : "bg-purple-950/30 border border-white/5"
                }`}
              >
                <div className="text-xs font-semibold text-purple-300/80 mb-1 tracking-tight">{msg.role === "user" ? "You" : "AI"}</div>
                <div className="text-sm text-white/80 tracking-tight whitespace-pre-wrap">{msg.content}</div>
              </div>
            ))}
          </div>
        )}

        {messages.length > 0 && (
          <div className="mt-3">
            <button
              className="w-full px-3 py-2 bg-purple-800/30 text-purple-300/80 text-sm rounded-lg hover:bg-purple-700/40 transition-colors tracking-tight"
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
