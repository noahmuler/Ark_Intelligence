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
}

export function MarketChart({ symbol, name, className = "" }: MarketChartProps) {
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

  // Generate mock chart data based on symbol
  const generateMockData = (basePrice: number, symbol: string): ChartDataPoint[] => {
    const now = new Date();
    const data: ChartDataPoint[] = [];
    
    for (let i = 59; i >= 0; i--) {
      const time = new Date(now.getTime() - i * 60000); // 1-minute intervals
      const randomChange = (Math.random() - 0.5) * basePrice * 0.002; // Small random changes
      const price = basePrice + randomChange + Math.sin(i * 0.1) * basePrice * 0.001; // Trend
      const volume = Math.floor(Math.random() * 1000000) + 500000;
      
      data.push({
        time: time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        price: parseFloat(price.toFixed(2)),
        volume
      });
    }
    
    return data;
  };

  // Fetch real price data
  useEffect(() => {
    const fetchPriceData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // For demo purposes, use realistic mock data
        // In production, this would fetch from real API
        const mockPrices: { [key: string]: number } = {
          'XAUUSD': 2752.18,
          'XAGUSD': 31.28,
          'BTCUSD': 67845.32,
          'ETHUSD': 3542.19,
          'SPX': 4528.76,
          'AAPL': 179.82,
          'MSFT': 379.45,
          'GOOGL': 143.21,
          'WTIUSD': 81.92,
          'DXY': 105.73,
          'EURUSD': 1.0842,
          'GBPUSD': 1.2741,
          'USDJPY': 149.18
        };
        
        const basePrice = mockPrices[symbol] || 1000;
        const data = generateMockData(basePrice, symbol);
        
        setChartData(data);
        setCurrentPrice(basePrice);
        
        // Calculate price change from oldest data point
        if (data.length > 1) {
          const oldestPrice = data[0].price;
          const change = basePrice - oldestPrice;
          const changePercent = (change / oldestPrice) * 100;
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

    fetchPriceData();
    
    // Update every 30 seconds
    const interval = setInterval(fetchPriceData, 30000);
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
      ctx.lineTo(canvas.width - padding, y);
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
      ctx.lineTo(x, canvas.height - padding);
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
    const gradient = ctx.createLinearGradient(0, padding, 0, canvas.height - padding);
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
    
    ctx.lineTo(padding + chartWidth, canvas.height - padding);
    ctx.lineTo(padding, padding);
    ctx.closePath();
    
    // Cleanup function
    return () => {
      // Any cleanup needed for canvas drawing
    };
  }, [chartData]);

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
        
        <canvas
          ref={canvasRef}
          className={`w-full h-48 sm:h-64 ${loading || error ? 'opacity-50' : ''}`}
          style={{ display: 'block' }}
        />
        
        {/* TradingView Widget */}
        <TradingViewWidget
          symbol={symbol}
          interval={timeframe}
          theme="light"
          height={300}
          width="100%"
          studies={['RSI', 'MACD', 'BB']}
          className="w-full"
        />
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
