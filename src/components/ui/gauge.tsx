"use client"

import React, { useEffect, useState } from "react"
import { motion, useMotionValue, useSpring } from "framer-motion"

interface GaugeProps {
  value: number
  max?: number
  size?: number
  strokeWidth?: number
  showValue?: boolean
  showPercentage?: boolean
  label?: string
  className?: string
  color?: string
  sentiment?: "Bullish" | "Bearish" | "Neutral"
}

export function Gauge({
  value,
  max = 100,
  size = 128,
  strokeWidth = 8,
  showValue = true,
  showPercentage = true,
  label,
  className = "",
  color = "currentColor",
  sentiment,
}: GaugeProps) {
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius

  const getColorClass = (sentiment?: "Bullish" | "Bearish" | "Neutral") => {
    if (sentiment === "Bullish") return "text-emerald-400"
    if (sentiment === "Bearish") return "text-rose-400"
    return "text-amber-400"
  }

  const colorClass = color === "currentColor" ? getColorClass(sentiment) : color

  const [displayValue, setDisplayValue] = useState(0)
  const motionValue = useMotionValue(0)
  const springValue = useSpring(motionValue, {
    damping: 60,
    stiffness: 100,
  })

  useEffect(() => {
    motionValue.set(value)
  }, [value, motionValue])

  useEffect(() => {
    const unsubscribe = springValue.on("change", (latest) => {
      setDisplayValue(Math.round(latest))
    })
    return unsubscribe
  }, [springValue])

  const progress = useSpring(0, {
    damping: 60,
    stiffness: 100,
  })

  useEffect(() => {
    progress.set(value)
  }, [value, progress])

  const strokeDashoffset = useMotionValue(circumference)
  const strokeDasharray = `${circumference} ${circumference}`

  useEffect(() => {
    function updateStrokeDashoffset(latest: number) {
      const newOffset = circumference - (latest / max) * circumference
      strokeDashoffset.set(newOffset)
    }

    const unsubscribe = progress.on("change", updateStrokeDashoffset)

    return () => {
      unsubscribe()
    }
  }, [progress, circumference, strokeDashoffset, max])

  return (
    <div className={`relative inline-flex items-center justify-center ${className}`}>
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          className="text-purple-800"
        />
        {/* Progress circle */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={strokeDasharray}
          style={{
            strokeDashoffset,
          }}
          strokeLinecap="round"
          className={colorClass}
        />
      </svg>
      
      {/* Center content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {showValue && (
          <div className={`text-xl sm:text-2xl font-bold font-mono ${colorClass}`}>
            {displayValue}
            {showPercentage && "%"}
          </div>
        )}
        {label && (
          <div className="text-xs text-purple-400 mt-1">{label}</div>
        )}
      </div>
    </div>
  )
}
