"use client";

import React, { useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
// (Input component not currently used; textarea is used instead)

import { Badge } from "@/components/ui/badge";
import { Brain, Send, Sparkles } from "lucide-react";

const COMMON_PROMPTS = [
  "What’s the highest probability setup for today across EUR, GBP, JPY, USD?",
  "Give me a trade plan for XAUUSD: entry, stop, targets, and invalidation.",
  "BTC: should I trend-follow or fade? Provide levels + risk.",
  "WTI vs DXY: what’s driving the spread right now?",
];

export default function TradingAssistantCard({ className = "" }: { className?: string }) {
  const [prompt, setPrompt] = useState("");
  const [messages, setMessages] = useState<Array<{ role: "user" | "assistant"; content: string }>>([]);
  const [isSending, setIsSending] = useState(false);

  const quickPrompts = useMemo(() => COMMON_PROMPTS, []);

  const runAssistant = async (text: string) => {
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
      "If you want, tell me your timeframe (scalp/swing) and max % risk. Then I’ll format it for your exact order type.";

    setMessages((m) => [...m, { role: "assistant", content: assistant }]);
    setPrompt("");
    setIsSending(false);
  };

  return (
    <Card className={"overflow-hidden " + className}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-purple-300" />
              <div className="text-lg font-bold text-white">Trading Assistant</div>
            </div>
            <div className="text-xs text-purple-200/80">Ask about markets, trades, or analysis</div>
          </div>
          <Badge variant="outline" className="text-purple-200/80 border-purple-400/30">Local helper</Badge>
        </div>

        <div className="mt-4 rounded-2xl border border-purple-900/60 bg-purple-950/60 p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="text-sm text-purple-200/90 font-medium">Prompt</div>
            <div className="flex items-center gap-2 text-xs text-purple-200/70">
              <Sparkles className="h-4 w-4" />
              Quick-fill below
            </div>
          </div>

          <div className="mt-3">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={3}
              placeholder="Type your question…"
              className="w-full resize-none rounded-xl border border-purple-800/60 bg-purple-950/40 px-3 py-2 text-sm text-white placeholder:text-purple-200/40 focus:outline-none focus:ring-2 focus:ring-purple-500/40"
            />
          </div>

          <div className="mt-3 flex items-center gap-3">
            <Button
              disabled={isSending || prompt.trim().length === 0}
              onClick={() => runAssistant(prompt.trim())}
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              {isSending ? "Thinking…" : (
                <span className="inline-flex items-center gap-2">
                  Send <Send className="h-4 w-4" />
                </span>
              )}
            </Button>
            <Button
              variant="outline"
              disabled={isSending}
              onClick={() => {
                setMessages([]);
                setPrompt("");
              }}
              className="border-purple-400/30 text-purple-200 hover:bg-purple-900/40"
            >
              Clear
            </Button>
          </div>

          {messages.length > 0 && (
            <div className="mt-4 space-y-3">
              {messages.map((m, idx) => (
                <div key={idx} className={m.role === "user" ? "text-right" : "text-left"}>
                  <div
                    className={
                      m.role === "user"
                        ? "inline-block max-w-[95%] rounded-2xl bg-purple-600/20 border border-purple-500/30 px-3 py-2 text-sm text-white"
                        : "inline-block max-w-[95%] rounded-2xl bg-purple-950/40 border border-purple-800/60 px-3 py-2 text-sm text-purple-100"
                    }
                  >
                    <div className="text-xs text-purple-200/70 mb-1">{m.role === "user" ? "You" : "Assistant"}</div>
                    <pre className="whitespace-pre-wrap font-sans">{m.content}</pre>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-4">
          <div className="text-xs font-semibold text-purple-200/80 mb-2">Common prompts</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {quickPrompts.map((p) => (
              <button
                key={p}
                onClick={() => setPrompt(p)}
                className="text-left rounded-2xl border border-purple-900/60 bg-purple-950/40 px-3 py-2 text-sm text-purple-200/90 hover:bg-purple-900/60 transition"
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

