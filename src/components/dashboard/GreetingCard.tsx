"use client";

import React from "react";
import { Typewriter } from "@/components/ui/typewriter";

const TRADER_QUOTES = [
  "Today's edge is patience—wait for liquidity, then commit.",
  "Patience is also a form of action. Wait for your setup.",
  "The market is a device for transferring money from the impatient to the patient.",
  "Plan the trade, trade the plan. Capital preservation is your primary job.",
  "Cut your losses short and let your winners run.",
  "Risk comes from not knowing what you're doing. Know your edge.",
  "Trade what the market gives you, not what you want it to give.",
  "In trading, the best setups are simple. The execution is what requires discipline."
];

export default function GreetingCard() {
  return (
    <div className="rounded-2xl border border-purple-900/60 bg-purple-950/40 p-5 backdrop-blur-xl hover:border-purple-500/60 hover:shadow-lg hover:shadow-purple-500/20 transition-all duration-300 ease-in-out min-h-[110px] flex flex-col justify-center">
      <div className="text-2xl font-extrabold text-white tracking-wide">
        Greetings, Trader.
      </div>
      <div className="mt-2 min-h-[24px] flex items-center">
        <Typewriter
          words={TRADER_QUOTES}
          speed={50}
          delayBetweenWords={3000}
          cursor={true}
          cursorChar="|"
          className="text-purple-200/80 text-sm tracking-wide font-medium"
        />
      </div>
    </div>
  );
}
