"use client";

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AISessionBrief } from "@/components/dashboard/AISessionBrief";
import { MarketChart } from "@/components/dashboard/MarketChart";
import { TrendingUp, TrendingDown } from "lucide-react";

const ForYouSummaryCard = React.memo(function ForYouSummaryCard({ className = "" }: { className?: string }) {
  return (
    <Card className={`overflow-hidden min-h-[280px] rounded-xl border border-purple-900/60 bg-purple-950/40 backdrop-blur-md hover:border-purple-500/60 hover:shadow-lg hover:shadow-purple-500/20 transition-all duration-300 ease-in-out ${className}`}>
      <div className="absolute inset-0 bg-gradient-to-br from-purple-600/5 via-transparent to-blue-600/5 -z-10" />
      <CardContent className="p-3 relative">
        <div className="flex items-start justify-between gap-2 mb-3">
          <div>
            <div className="text-sm font-semibold text-white tracking-tight">For You</div>
            <div className="text-xs text-purple-200/60 tracking-tight">Pre-session briefing</div>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
            <Badge variant="outline" className="text-purple-200/70 border-purple-400/20 text-xs px-2 py-0.5">
              Live
            </Badge>
          </div>
        </div>

        <div className="space-y-3">
          <div className="border-b border-white/5 pb-3">
            <AISessionBrief />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="text-xs font-medium text-purple-100 tracking-tight">Flow</div>
              <div className="flex items-center gap-1.5">
                <div className="flex items-center gap-1">
                  <div className="w-1 h-1 rounded-full bg-emerald-400" />
                  <span className="text-xs text-emerald-300">Up</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-1 h-1 rounded-full bg-rose-400" />
                  <span className="text-xs text-rose-300">Down</span>
                </div>
              </div>
            </div>
            <MarketChart symbol="DXY" name="DXY" disabledChart={true} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

export default ForYouSummaryCard;
