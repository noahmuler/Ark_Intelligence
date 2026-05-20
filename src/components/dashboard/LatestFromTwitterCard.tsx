"use client";

import React, { useEffect, useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity } from "lucide-react";

type Post = {
  id: string;
  author: string;
  text: string;
  time: string;
  topic: "Macro" | "Crypto" | "FX" | "Commodities";
};

const FALLBACK: Post[] = [
  { id: "1", author: "@ArkMacro", text: "Volatility is the tax you pay for momentum. Manage sizing, not feelings.", time: "2m ago", topic: "Macro" },
  { id: "2", author: "@DeskQuant", text: "DXY strength tends to cap gold rallies—watch opens/closes for confirmation.", time: "8m ago", topic: "Commodities" },
  { id: "3", author: "@FXPulse", text: "FX flows are shifting. EUR & GBP relative strength is narrowing—keep risk tight.", time: "18m ago", topic: "FX" },
  { id: "4", author: "@BTCflow", text: "Liquidity headlines matter. If BTC holds bid into session overlap, trend continuation is likely.", time: "28m ago", topic: "Crypto" },
];

const LatestFromTwitterCard = React.memo(function LatestFromTwitterCard({ className = "" }: { className?: string }) {
  const [posts, setPosts] = useState<Post[]>(FALLBACK);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setRefreshing(true);

      try {
        // If you have a real twitter/news proxy endpoint, swap it in here.
        // For now we use a mock but keep the structure ready for integration.
        await new Promise((r) => setTimeout(r, 500));
        if (!cancelled) setPosts(FALLBACK);
      } catch {
        // Keep existing posts on failure; no clobber
      } finally {
        if (!cancelled) {
          setRefreshing(false);
        }
      }
    };

    load();
    const i = setInterval(load, 180000);
    return () => {
      cancelled = true;
      clearInterval(i);
    };
  }, [posts.length]);

  const badgeFor = useCallback((topic: Post["topic"]) => {
    const map: Record<Post["topic"], string> = {
      Macro: "bg-purple-500/20 text-purple-200 border-purple-400/30",
      Crypto: "bg-emerald-500/15 text-emerald-200 border-emerald-400/25",
      FX: "bg-blue-500/15 text-blue-200 border-blue-400/25",
      Commodities: "bg-amber-500/15 text-amber-200 border-amber-400/25",
    };
    return map[topic];
  }, []);

  return (
    <Card className={`overflow-hidden min-h-[340px] rounded-xl border border-white/10 bg-purple-950/30 backdrop-blur-[12px] hover:border-purple-500/40 hover:shadow-lg hover:shadow-purple-500/10 transition-all duration-300 ease-in-out ${className}`}>
      <CardContent className="p-3 relative">
        <div className="flex items-start justify-between gap-2 mb-3">
          <div>
            <div className="text-xs font-semibold text-white/90 tracking-wider uppercase">X / Twitter</div>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-1 h-1 rounded-full bg-purple-400/60" />
            <span className="text-xs text-purple-300/60 tracking-tight">Auto</span>
          </div>
        </div>

        <div className="space-y-2">
          {posts.length === 0 ? (
            <div className="flex items-center justify-center py-6 text-purple-200/60">No posts available.</div>
          ) : (
            posts.map((p) => (
              <div key={p.id} className="rounded-lg border border-white/5 bg-purple-950/20 p-3 hover:bg-purple-900/20 hover:border-purple-500/30 transition-all duration-300 ease-in-out">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-xs text-purple-300/70 font-mono tracking-tight">{p.author}</div>
                    <div className="mt-1 text-sm text-white/80 leading-snug tracking-tight">{p.text}</div>
                  </div>
                  <div className="text-right">
                    <div className="inline-flex">
                      <Badge className={badgeFor(p.topic)}>{p.topic}</Badge>
                    </div>
                    <div className="mt-1 text-xs text-purple-300/60 tracking-tight">{p.time}</div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
});

export default LatestFromTwitterCard;
