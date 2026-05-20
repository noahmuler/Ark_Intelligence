"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

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
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % TRADER_QUOTES.length);
    }, 6000); // cycle quotes every 6 seconds for comfortable reading
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="rounded-2xl border border-purple-900/60 bg-purple-950/40 p-5 backdrop-blur-xl hover:border-purple-500/60 hover:shadow-lg hover:shadow-purple-500/20 transition-all duration-300 ease-in-out min-h-[110px] flex flex-col justify-center">
      <div className="text-2xl font-extrabold text-white tracking-wide">
        Greetings, Trader.
      </div>
      <div className="mt-2 min-h-[24px] relative overflow-hidden flex items-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
            className="text-purple-200/80 text-sm tracking-wide font-medium"
          >
            {TRADER_QUOTES[index]}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
