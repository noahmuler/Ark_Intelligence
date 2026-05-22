"use client"

import React from "react"
import { motion, useMotionValue, useSpring } from "framer-motion"

interface MarketMoodGaugeProps {
  value: number
  className?: string
}

export function MarketMoodGauge({ value, className = "" }: MarketMoodGaugeProps) {
  // Generate unique IDs for this component instance to prevent conflicts
  const uniqueId = React.useId()
  const needleGlowId = `needleGlow-${uniqueId}`
  const purpleTrackGradientId = `purpleTrackGradient-${uniqueId}`
  const purpleActiveGradientId = `purpleActiveGradient-${uniqueId}`

  // Calculate rotation: (value × 1.8) - 90 deg
  // 0 = -90deg (left), 50 = 0deg (center), 100 = +90deg (right)
  const rotation = (value * 1.8) - 90

  return (
    <div className={`relative w-full ${className}`}>
      <svg className="w-full h-full" viewBox="0 0 200 100">
        <defs>
          {/* Glow filter for high-contrast needle */}
          <filter id={needleGlowId} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Purple gradient track - muted to vibrant */}
          <linearGradient id={purpleTrackGradientId} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgba(147, 51, 234, 0.1)" />
            <stop offset="50%" stopColor="rgba(147, 51, 234, 0.15)" />
            <stop offset="100%" stopColor="rgba(147, 51, 234, 0.1)" />
          </linearGradient>

          {/* Vibrant neon purple gradient for active track */}
          <linearGradient id={purpleActiveGradientId} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgba(147, 51, 234, 0.6)" />
            <stop offset="50%" stopColor="rgba(168, 85, 247, 0.8)" />
            <stop offset="100%" stopColor="rgba(168, 85, 247, 0.6)" />
          </linearGradient>
        </defs>

        {/* Background track */}
        <path
          d="M30,100 A70,70 0 0,1 170,100"
          fill="none"
          stroke={`url(#${purpleTrackGradientId})`}
          strokeWidth="8"
          strokeLinecap="round"
        />

        {/* Active progress arc */}
        <motion.path
          d="M30,100 A70,70 0 0,1 170,100"
          fill="none"
          stroke={`url(#${purpleActiveGradientId})`}
          strokeWidth="8"
          strokeLinecap="round"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 1.2, ease: [0.25, 0.1, 0.25, 1] }}
        />

        {/* Needle - pivots from exact bottom-center (50% 100%) */}
        <g
          style={{ 
            transform: `rotate(${rotation}deg)`,
            transformOrigin: "100px 100px"
          }}
        >
          {/* High-contrast white needle with neon purple glow */}
          <line
            x1="100"
            y1="100"
            x2="100"
            y2="30"
            stroke="#ffffff"
            strokeWidth="4"
            strokeLinecap="round"
          />
          {/* Center pivot dot */}
          <circle cx="100" cy="100" r="8" fill="#ffffff" />
          <circle cx="100" cy="100" r="4" fill="#a855f7" />
        </g>
      </svg>
    </div>
  )
}
