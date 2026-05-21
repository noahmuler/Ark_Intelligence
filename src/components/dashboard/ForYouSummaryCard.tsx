"use client";

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { AISessionBrief } from "@/components/dashboard/AISessionBrief";
import { CapitalFlowGraph } from "@/components/dashboard/CapitalFlowGraph";


const ForYouSummaryCard = React.memo(function ForYouSummaryCard({ className = "" }: { className?: string }) {
  return (
    <Card className={`overflow-hidden min-h-[200px] rounded-xl border border-white/10 bg-purple-950/30 backdrop-blur-[12px] hover:border-purple-500/40 hover:shadow-lg hover:shadow-purple-500/10 transition-all duration-300 ease-in-out ${className}`}>
      <CardContent className="p-3 relative">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div>
            <div className="text-xs font-semibold text-white/90 tracking-wider uppercase">Pre-Session Brief</div>
            <div className="text-[11px] text-purple-200/70 leading-tight mt-0.5">
              Institutional liquidity routing
            </div>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-1 h-1 rounded-full bg-purple-400/60" />
            <span className="text-xs text-purple-300/60 tracking-tight">Live</span>
          </div>
        </div>

        <div className="space-y-2">
          <AISessionBrief />

          <div className="mt-1">
            <CapitalFlowGraph />
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

export default ForYouSummaryCard;

