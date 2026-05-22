"use client"

import React from "react"
import { motion, useMotionValue, useSpring } from "framer-motion"

interface MarketMoodGaugeProps {
  value: number
  className?: string
}

export function MarketMoodGauge({ value, className = "" }: MarketMoodGaugeProps) {
  // Animate the needle position
  const rotation = useSpring(0, {
    damping: 50,
    stiffness: 120,
  })

  React.useEffect(() => {
    // Map value (0-100) to rotation (-90 to 90 degrees)
    const targetRotation = (value / 100) * 180 - 90
    rotation.set(targetRotation)
  }, [value, rotation])

  // Animate the displayed value
  const displayValue = useSpring(0, {
    damping: 50,
    stiffness: 120,
  })

  React.useEffect(() => {
    displayValue.set(value)
  }, [value, displayValue])

  const [currentValue, setCurrentValue] = React.useState(0)

  React.useEffect(() => {
    const unsubscribe = displayValue.on("change", (latest) => {
      setCurrentValue(Math.round(latest))
    })
    return unsubscribe
  }, [displayValue])

  return (
    <div className={`relative w-full ${className}`}>
      <svg className="w-full h-full" viewBox="0 0 200 120">
        <defs>
          {/* Glow filter for neon purple effect */}
          <filter id="purpleGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="4" result="coloredBlur" />
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
          filter="url(#purpleGlow)"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 1.2, ease: [0.25, 0.1, 0.25, 1] }}
        />

        {/* Tick marks */}
        <g opacity="0.3">
          <line x1="30" y1="100" x2="30" y2="90" stroke="rgba(168, 85, 247, 0.6)" strokeWidth="2" />
          <line x1="100" y1="30" x2="100" y2="40" stroke="rgba(168, 85, 247, 0.6)" strokeWidth="2" />
          <line x1="170" y1="100" x2="170" y2="90" stroke="rgba(168, 85, 247, 0.6)" strokeWidth="2" />
        </g>

        {/* Needle with glow */}
        <motion.g
          style={{ 
            rotate: rotation,
            transformOrigin: "100px 100px"
          }}
          transition={{ type: "spring", damping: 50, stiffness: 120 }}
        >
          <line
            x1="100"
            y1="100"
            x2="100"
            y2="35"
            stroke="rgba(168, 85, 247, 1)"
            strokeWidth="3"
            strokeLinecap="round"
            filter="url(#purpleGlow)"
          />
          <circle cx="100" cy="100" r="7" fill="rgba(168, 85, 247, 1)" filter="url(#purpleGlow)" />
          <circle cx="100" cy="100" r="3.5" fill="rgba(168, 85, 247, 0.4)" />
        </motion.g>

        {/* Central reading text - large, crisp, centered beneath needle pivot */}
        <text x="100" y="118" fontSize="24" fill="rgba(168, 85, 247, 1)" className="text-2xl font-bold font-mono" textAnchor="middle" fontWeight="bold">
          {currentValue}
        </text>
      </svg>
    </div>
  )
}
