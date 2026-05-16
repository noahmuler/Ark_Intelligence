"use client";

import React, { useState, useEffect, useRef } from "react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import TradingViewWidget from "./TradingViewWidget";

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

export function MarketChart({ symbol, name, className = "", disabledChart = false }: MarketChartProps) {
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [currentPrice, setCurrentPrice] = useState<number>(0);
  const [priceChange, setPriceChange] = useState<number>(0);
  const [priceChangePercent, setPriceChangePercent] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [timeframe, setTimeframe] = useState<string>('1h');
  const [useTradingView, setUseTradingView] = useState<boolean>(false);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | undefined>(undefined);

  // Fetch real chart data (using ticker endpoint; canvas series is derived from returned prices)
  useEffect(() => {
    const fetchChartData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Current quote
        const res = await fetch(`/api/market/ticker?symbols=${encodeURIComponent(symbol)}`);
        if (!res.ok) {
          throw new Error(`Ticker request failed: ${res.status}`);
        }
        const json = await res.json();
        const quote = json?.data?.[symbol];
        if (!quote || typeof quote.price !== 'number') {
          throw new Error('Invalid ticker response');
        }

        // Build a synthesized mini-history for the canvas display using quote.change when possible
        const now = new Date();
        const data: ChartDataPoint[] = [];

        const change = typeof quote.change === 'number' ? quote.change : 0;
        const oldestPrice = quote.price - change;
        
        // Adjust point count based on timeframe
        const timeframePoints: Record<string, number> = {
          '1m': 30,
          '5m': 60,
          '15m': 90,
          '1h': 120,
          '4h': 180
        };
        const points = timeframePoints[timeframe] || 60;
        
        // Adjust interval based on timeframe
        const timeframeInterval: Record<string, number> = {
          '1m': 60_000,      // 1 minute
          '5m': 5 * 60_000,  // 5 minutes
          '15m': 15 * 60_000, // 15 minutes
          '1h': 60 * 60_000,  // 1 hour
          '4h': 4 * 60 * 60_000 // 4 hours
        };
        const intervalMs = timeframeInterval[timeframe] || 60_000;
        
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
        setError('Failed to load chart data');
      } finally {
        setLoading(false);
      }
    };

    fetchChartData();
    const interval = setInterval(fetchChartData, 30000);
    return () => clearInterval(interval);
  }, [symbol, timeframe]);


  // Draw chart on canvas
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
      priceRange = 1; // Use fallback range to avoid division by zero
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

    // Cleanup function
    return () => {
      // Any cleanup needed for canvas drawing
    };
  }, [chartData, priceChange]);

  return (
    <div className={`relative bg-purple-950/90 backdrop-blur-xl rounded-2xl border border-purple-900/50 p-4 ${className}`}>
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
        
        <div className="text-right">
          <div className="text-white font-mono text-lg font-bold">
            ${currentPrice.toLocaleString('en-US', { 
              style: symbol.includes('USD') ? 'currency' : 'decimal',
              currency: symbol.includes('USD') ? 'USD' : undefined,
              minimumFractionDigits: symbol.includes('USD') ? 2 : 0 
            })}
          </div>
          <div className={`text-sm font-mono ${priceChange >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {priceChange >= 0 ? '+' : ''}{priceChange.toFixed(2)} ({priceChangePercent.toFixed(2)}%)
          </div>
        </div>
      </div>

      {/* Chart Canvas */}
      <div className="relative">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-purple-950/90 rounded-2xl">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-400"></div>
          </div>
        )}
        
        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-purple-950/90 rounded-2xl">
            <div className="text-rose-400 text-sm">{error}</div>
          </div>
        )}
        
        {disabledChart ? (
          <div className="w-full h-48 sm:h-64 rounded-2xl border border-purple-900/50 bg-purple-950/50 flex items-center justify-center text-purple-200">
            Chart unavailable for this view
          </div>
        ) : (
          <canvas
            ref={canvasRef}
            className={`w-full h-48 sm:h-64 ${loading || error ? 'opacity-50' : ''}`}
            style={{ display: 'block' }}
          />
        )}
      </div>

      {/* Time Frame Selector */}
      <div className="flex justify-center mt-4">
        <div className="flex bg-purple-800/50 rounded-lg p-1">
          {['1m', '5m', '15m', '1h', '4h'].map((tf) => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-200 ${
                timeframe === tf
                  ? 'bg-purple-600 text-white'
                  : 'text-purple-300 hover:text-white hover:bg-purple-700'
              }`}
            >
              {tf}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
