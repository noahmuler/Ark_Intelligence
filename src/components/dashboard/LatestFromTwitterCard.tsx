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
    <div className={className}>
      <Card className="overflow-hidden min-h-[340px]">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-600/5 via-transparent to-blue-600/5 -z-10" />
        <CardContent className="p-4 relative">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div>
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-purple-300" />
                <div className="text-base font-bold text-white">Latest from X / Twitter</div>
              </div>
              <div className="text-xs text-purple-200/70">Market-relevant posts</div>
            </div>
            <Badge variant="outline" className="text-purple-200/80 border-purple-400/30 text-xs">Auto</Badge>
          </div>

          <div className="space-y-2">
            {posts.length === 0 ? (
              <div className="flex items-center justify-center py-6 text-purple-200/70">No posts available.</div>
            ) : (
              posts.map((p) => (
                <div key={p.id} className="rounded-xl border border-purple-900/60 bg-purple-950/60 p-3 hover:bg-purple-900/40 transition-colors duration-200">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-xs text-purple-200/70 font-mono">{p.author}</div>
                      <div className="mt-1 text-sm text-white/95 leading-relaxed">{p.text}</div>
                    </div>
                    <div className="text-right">
                      <div className="inline-flex">
                        <Badge className={badgeFor(p.topic)}>{p.topic}</Badge>
                      </div>
                      <div className="mt-1 text-xs text-purple-200/60">{p.time}</div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
});

export default LatestFromTwitterCard;
