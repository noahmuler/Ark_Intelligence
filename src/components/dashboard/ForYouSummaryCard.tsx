"use client";

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AISessionBrief } from "@/components/dashboard/AISessionBrief";
import { MarketChart } from "@/components/dashboard/MarketChart";
import { TrendingUp, TrendingDown } from "lucide-react";

const ForYouSummaryCard = React.memo(function ForYouSummaryCard({ className = "" }: { className?: string }) {
  return (
    <div className={className}>
      <Card className="overflow-hidden min-h-[280px]">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-600/5 via-transparent to-blue-600/5 -z-10" />
        <CardContent className="p-4 relative">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div>
              <div className="text-base font-bold text-white">For You</div>
              <div className="text-xs text-purple-200/70">Pre-session briefing + flow</div>
            </div>
            <Badge variant="outline" className="text-purple-200/80 border-purple-400/30 text-xs">
              Prep
            </Badge>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            <AISessionBrief />

            <div className="rounded-xl border border-purple-900/60 bg-purple-950/60 p-3 cursor-pointer hover:bg-purple-900/40 transition-colors duration-200">
              <div className="flex items-center justify-between mb-2">
                <div className="text-xs font-semibold text-purple-100">Flow (major assets)</div>
                <div className="flex items-center gap-2 text-xs text-purple-200/70">
                  <span className="inline-flex items-center gap-1">
                    <TrendingUp className="h-3 w-3 text-emerald-300" /> Up
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <TrendingDown className="h-3 w-3 text-rose-300" /> Down
                  </span>
                </div>
              </div>

              <MarketChart symbol="DXY" name="DXY" disabledChart={true} />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
});

export default ForYouSummaryCard;
