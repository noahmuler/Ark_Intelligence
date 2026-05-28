"use client";

import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import TradingViewWidget from "./TradingViewWidget";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";

interface ChartDataPoint {
  time: string;
  price: number;
  volume?: number;
}

interface MarketChartProps {
  symbol: string;
  name: string;
  className?: string;
  disabledChart?: boolean;
}

export const MarketChart = React.memo(function MarketChart({ symbol, name, className = "", disabledChart = false }: MarketChartProps) {
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [currentPrice, setCurrentPrice] = useState<number>(symbol === "DXY" ? 105.82 : 2748.32);
  const [priceChange, setPriceChange] = useState<number>(symbol === "DXY" ? 0.42 : 0.85);
  const [priceChangePercent, setPriceChangePercent] = useState<number>(symbol === "DXY" ? 0.4 : 0.03);
  const [timeframe, setTimeframe] = useState<string>('1h');
  
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Fetch market price from Convex
  const marketPrice = useQuery(api.marketDataQueries.getMarketPrice, { symbol });

  // Memoize timeframe configuration to prevent recreating objects
  const timeframeConfig = useMemo(() => ({
    points: {
      '1m': 30,
      '5m': 60,
      '15m': 90,
      '1h': 120,
      '4h': 180
    } as Record<string, number>,
    intervals: {
      '1m': 60_000,
      '5m': 5 * 60_000,
      '15m': 15 * 60_000,
      '1h': 60 * 60_000,
      '4h': 4 * 60 * 60_000
    } as Record<string, number>
  }), []);

  // Fetch real chart data
  useEffect(() => {
    const fetchChartData = async () => {
      try {
        // Use Convex market price if available, otherwise fall back to API
        let quote: any;
        
        if (marketPrice) {
          quote = {
            price: marketPrice.price,
            change: marketPrice.price * (marketPrice.changePercent / 100),
            changePercent: marketPrice.changePercent,
            volume: marketPrice.volume,
          };
        } else {
          // Fallback to API
          const res = await fetch(`/api/market/ticker?symbols=${encodeURIComponent(symbol)}`);
          if (!res.ok) {
            throw new Error(`Ticker request failed: ${res.status}`);
          }
          const json = await res.json();
          quote = json?.data?.[symbol];
          if (!quote || typeof quote.price !== 'number') {
            throw new Error('Invalid ticker response');
          }
        }

        // Build a synthesized mini-history for the canvas display using quote.change when possible
        const now = new Date();
        const data: ChartDataPoint[] = [];

        const change = typeof quote.change === 'number' ? quote.change : 0;
        const oldestPrice = quote.price - change;

        const points = timeframeConfig.points[timeframe] || 60;
        const intervalMs = timeframeConfig.intervals[timeframe] || 60_000;

        for (let i = points - 1; i >= 0; i--) {
          const t = i / (points - 1);
          const price = oldestPrice + (quote.price - oldestPrice) * t;
          const time = new Date(now.getTime() - i * intervalMs);
          data.push({
            time: time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
            price: Number(price.toFixed(2)),
            volume: typeof quote.volume === 'number' ? quote.volume : undefined,
          });
        }

        setChartData(data);
        setCurrentPrice(quote.price);

        if (data.length > 1) {
          const oldestPrice = data[0].price;
          const change = quote.price - oldestPrice;
          const changePercent = oldestPrice !== 0 ? (change / oldestPrice) * 100 : 0;
          setPriceChange(change);
          setPriceChangePercent(changePercent);
        }
      } catch (err) {
        console.error('Failed to fetch chart data:', err);
      }
    };

    fetchChartData();
    const interval = setInterval(fetchChartData, 30000);
    return () => clearInterval(interval);
  }, [symbol, timeframe, timeframeConfig, marketPrice]);

  // Optimized canvas drawing effect with proper cleanup
  useEffect(() => {
    if (!canvasRef.current || chartData.length === 0) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    
    // Set canvas size
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    // Clear canvas using logical dimensions
    ctx.clearRect(0, 0, rect.width, rect.height);

    if (chartData.length < 2) return;

    // Calculate chart dimensions using logical pixels
    const padding = 40;
    const chartWidth = rect.width - padding * 2;
    const chartHeight = rect.height - padding * 2;

    // Find min and max prices
    const prices = chartData.map(d => d.price);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    let priceRange = maxPrice - minPrice;
    
    // Protect against division by zero when all prices are equal
    if (priceRange === 0 || Math.abs(priceRange) < 0.0001) {
      priceRange = 1;
    }

    // Draw grid lines
    ctx.strokeStyle = 'rgba(147, 51, 234, 0.1)';
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 5]);
    
    // Horizontal grid lines
    for (let i = 0; i <= 5; i++) {
      const y = padding + (chartHeight / 5) * i;
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(rect.width - padding, y);
      ctx.stroke();
      
      // Price labels
      const price = maxPrice - (priceRange / 5) * i;
      ctx.fillStyle = 'rgba(147, 51, 234, 0.5)';
      ctx.font = '10px sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(`$${price.toFixed(2)}`, padding - 5, y + 3);
    }
    
    // Vertical grid lines
    for (let i = 0; i <= 4; i++) {
      const x = padding + (chartWidth / 4) * i;
      ctx.beginPath();
      ctx.moveTo(x, padding);
      ctx.lineTo(x, rect.height - padding);
      ctx.stroke();
    }

    ctx.setLineDash([]);

    // Draw price line
    ctx.strokeStyle = priceChange >= 0 ? '#10b981' : '#ef4444';
    ctx.lineWidth = 2;
    ctx.beginPath();

    chartData.forEach((point, index) => {
      const x = padding + (chartWidth / (chartData.length - 1)) * index;
      const y = padding + ((maxPrice - point.price) / priceRange) * chartHeight;
      
      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    
    ctx.stroke();

    // Draw gradient fill under the line
    const gradient = ctx.createLinearGradient(0, padding, 0, rect.height - padding);
    if (priceChange >= 0) {
      gradient.addColorStop(0, 'rgba(16, 185, 129, 0.1)');
      gradient.addColorStop(1, 'rgba(16, 185, 129, 0.02)');
    } else {
      gradient.addColorStop(0, 'rgba(239, 68, 68, 0.1)');
      gradient.addColorStop(1, 'rgba(239, 68, 68, 0.02)');
    }
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    
    chartData.forEach((point, index) => {
      const x = padding + (chartWidth / (chartData.length - 1)) * index;
      const y = padding + ((maxPrice - point.price) / priceRange) * chartHeight;
      
      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    
    ctx.lineTo(padding + chartWidth, rect.height - padding);
    ctx.lineTo(padding, rect.height - padding);
    ctx.closePath();

    ctx.fill();

    return () => {
      // Canvas cleanup is handled by the browser
    };
  }, [chartData, priceChange]);

  // Memoize timeframe options to prevent recreation
  const timeframeOptions = useMemo(() => [
    { value: '1m', label: '1m' },
    { value: '5m', label: '5m' },
    { value: '15m', label: '15m' },
    { value: '1h', label: '1h' },
    { value: '4h', label: '4h' },
  ], []);

  const handleTimeframeChange = useCallback((newTimeframe: string) => {
    setTimeframe(newTimeframe);
  }, []);

  return (
    <div className={`relative bg-purple-950/90 backdrop-blur-xl rounded-2xl border border-purple-900/50 p-4 min-h-[300px] ${className}`}>
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center space-x-3">
          <h2 className="text-lg sm:text-xl font-bold text-white bg-gradient-to-r from-emerald-200 to-blue-200 bg-clip-text text-transparent">
            {symbol}
          </h2>
          <div className="flex items-center space-x-2">
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500 to-green-500 rounded-full blur opacity-0 group-hover:opacity-30 transition-opacity duration-300"></div>
              <span className="relative px-3 py-1.5 bg-emerald-500/10 text-emerald-300 text-xs font-bold rounded-full border border-emerald-500/20">
                {priceChange >= 0 ? 'BULLISH' : 'BEARISH'}
              </span>
            </div>
          </div>
        </div>
        
        {/* Timeframe selector */}
        <div className="flex items-center space-x-1 bg-purple-900/30 rounded-lg p-1">
          {timeframeOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => handleTimeframeChange(option.value)}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                timeframe === option.value
                  ? 'bg-purple-600 text-white'
                  : 'text-purple-300 hover:bg-purple-800'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Price info */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <div className="text-xl sm:text-2xl font-bold text-white tracking-wide">
            ${currentPrice.toFixed(2)}
          </div>
          <div className={`flex items-center space-x-2 ${priceChange >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {priceChange >= 0 ? (
              <TrendingUp className="h-3 w-3" />
            ) : (
              <TrendingDown className="h-3 w-3" />
            )}
            <span className="font-semibold text-sm tracking-wide">
              {priceChange >= 0 ? '+' : ''}{priceChange.toFixed(2)} ({priceChangePercent >= 0 ? '+' : ''}{priceChangePercent.toFixed(2)}%)
            </span>
          </div>
        </div>
        <div className="text-right text-xs text-purple-300 tracking-wide">
          <div suppressHydrationWarning>Last updated: {new Date().toLocaleTimeString()}</div>
        </div>
      </div>

      {/* Chart */}
      <div className="relative bg-purple-950/50 rounded-lg border border-purple-800/30 p-3 min-h-[180px] hover:border-purple-500/60 transition-all duration-300 ease-in-out">
        <canvas
          ref={canvasRef}
          className="w-full h-full"
          style={{ display: 'block' }}
        />
      </div>

      {/* TradingView widget (when not disabled) */}
      {!disabledChart && (
        <div className="mt-4">
          <TradingViewWidget symbol={symbol} />
        </div>
      )}
    </div>
  );
});
