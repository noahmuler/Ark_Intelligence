import React, { useEffect, useRef } from 'react';
import { createTradingViewWidget } from '@/services/tradingViewAPI';

interface TradingViewWidgetProps {
  symbol: string;
  interval?: string;
  theme?: 'light' | 'dark';
  height?: number;
  width?: string | number;
  studies?: string[];
  className?: string;
}

/**
 * TradingView Widget Component
 * 
 * Embeds TradingView charts and widgets into React components.
 * Provides real-time market data and technical analysis.
 * 
 * Features:
 * - Real-time price charts
 * - Technical indicators (RSI, MACD, Bollinger Bands)
 * - Multiple timeframes
 * - Responsive design
 * - Dark/light theme support
 */
export function TradingViewWidget({
  symbol,
  interval = '1',
  theme = 'light',
  height = 400,
  width = '100%',
  studies = ['RSI', 'MACD', 'BB'],
  className = ''
}: TradingViewWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Create unique container ID for this widget
    const containerId = `tradingview_widget_${symbol}_${Date.now()}`;
    containerRef.current.id = containerId;

    // Create TradingView widget script
    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = 'https://s3.tradingview.com/tv.js';
    script.async = true;

    // Create configuration script
    const configScript = document.createElement('script');
    configScript.type = 'text/javascript';
    configScript.text = `
      new TradingView.widget({
        "symbol": "${symbol}",
        "interval": "${interval}",
        "theme": "${theme}",
        "height": ${height},
        "width": ${typeof width === 'string' ? `"${width}"` : width},
        "studies": ${JSON.stringify(studies)},
        "locale": "en",
        "style": "1",
        "autosize": true,
        "timezone": "Etc/UTC",
        "toolbar_bg": "#f1f3f6",
        "enable_publishing": false,
        "allow_symbol_change": true,
        "save_image": false,
        "container_id": "${containerId}"
      });
    `;

    // Set container content
    containerRef.current.innerHTML = `
      <script>${script.outerHTML}</script>
      <script>${configScript.text}</script>
    `;

    // Cleanup function
    return () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
    };
  }, [symbol, interval, theme, height, width, studies]);

  return (
    <div 
      ref={containerRef}
      className={`tradingview-widget-wrapper ${className}`}
      style={{ height: `${height}px`, width: width }}
    />
  );
}

export default TradingViewWidget;
