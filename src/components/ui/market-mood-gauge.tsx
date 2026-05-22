"use client"

import React from "react"
import { motion, useMotionValue, useSpring } from "framer-motion"

interface MarketMoodGaugeProps {
  value: number
  className?: string
}

export function MarketMoodGauge({ value, className = "" }: MarketMoodGaugeProps) {
  // Animate the needle position using exact formula: (score × 1.8) - 90 deg
  const rotation = useSpring(0, {
    damping: 50,
    stiffness: 120,
  })

  React.useEffect(() => {
    // Map value (0-100) to rotation (-90 to 90 degrees)
    const targetRotation = (value * 1.8) - 90
    rotation.set(targetRotation)
  }, [value, rotation])

  return (
    <div className={`relative w-full ${className}`}>
      <svg className="w-full h-full" viewBox="0 0 200 100">
        <defs>
          {/* Glow filter for high-contrast needle */}
          <filter id="needleGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Purple gradient track - muted to vibrant */}
          <linearGradient id="purpleTrackGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgba(147, 51, 234, 0.1)" />
            <stop offset="50%" stopColor="rgba(147, 51, 234, 0.15)" />
            <stop offset="100%" stopColor="rgba(147, 51, 234, 0.1)" />
          </linearGradient>

          {/* Vibrant neon purple gradient for active track */}
          <linearGradient id="purpleActiveGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgba(147, 51, 234, 0.6)" />
            <stop offset="50%" stopColor="rgba(168, 85, 247, 0.8)" />
            <stop offset="100%" stopColor="rgba(168, 85, 247, 0.6)" />
          </linearGradient>
        </defs>

        {/* Background track */}
        <path
          d="M30,100 A70,70 0 0,1 170,100"
          fill="none"
          stroke="url(#purpleTrackGradient)"
          strokeWidth="8"
          strokeLinecap="round"
        />

        {/* Active progress arc */}
        <motion.path
          d="M30,100 A70,70 0 0,1 170,100"
          fill="none"
          stroke="url(#purpleActiveGradient)"
          strokeWidth="8"
          strokeLinecap="round"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 1.2, ease: [0.25, 0.1, 0.25, 1] }}
        />

        {/* Needle - pivots from exact bottom-center (50% 100%) */}
        <motion.g
          style={{ 
            rotate: rotation,
            transformOrigin: "100px 100px"
          }}
          transition={{ type: "spring", damping: 50, stiffness: 120 }}
        >
          {/* High-contrast white needle with neon purple glow */}
          <line
            x1="100"
            y1="100"
            x2="100"
            y2="35"
            stroke="rgba(255, 255, 255, 0.95)"
            strokeWidth="3"
            strokeLinecap="round"
            filter="url(#needleGlow)"
          />
          {/* Center pivot dot */}
          <circle cx="100" cy="100" r="6" fill="rgba(255, 255, 255, 0.95)" filter="url(#needleGlow)" />
          <circle cx="100" cy="100" r="3" fill="rgba(168, 85, 247, 0.8)" />
        </motion.g>
      </svg>
    </div>
  )
}
