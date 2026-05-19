import React, { useEffect, useRef } from 'react';

// TradingView is loaded from https://s3.tradingview.com/tv.js
declare global {
  interface Window {
    TradingView?: {
      widget: (config: unknown) => void;
    };
  }
}




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
    const container = containerRef.current;
    if (!container) return;

    // Track whether component is still mounted
    let mounted = true;

    // Create unique container ID for this widget
    const containerId = `tradingview_widget_${symbol}_static`;
    container.id = containerId;

    // Create TradingView widget script (must be an actual script node so it executes)
    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = 'https://s3.tradingview.com/tv.js';
    script.async = true;

    script.onload = () => {
      // Guard against stale callbacks after unmount or prop changes
      if (!mounted) return;
      
      // Verify container still exists in DOM
      const currentContainer = document.getElementById(containerId);
      if (!currentContainer) return;

      // Create configuration script (as a real script node so TradingView.widget runs)
      const configScript = document.createElement('script');
      configScript.type = 'text/javascript';
      configScript.text = `
        new window.TradingView.widget({

          "symbol": ${JSON.stringify(symbol)},
          "interval": ${JSON.stringify(interval)},
          "theme": ${JSON.stringify(theme)},
          "height": ${height},
          "width": ${typeof width === 'string' ? JSON.stringify(width) : width},
          "studies": ${JSON.stringify(studies)},
          "locale": "en",
          "style": "1",
          "autosize": true,
          "timezone": "Etc/UTC",
          "toolbar_bg": "#f1f3f6",
          "enable_publishing": false,
          "allow_symbol_change": true,
          "save_image": false,
          "container_id": ${JSON.stringify(containerId)}
        });
      `;

      currentContainer.appendChild(configScript);
    };

    // Clear container and append scripts
    container.innerHTML = '';
    container.appendChild(script);

    // Cleanup function
    return () => {
      mounted = false;
      script.onload = null;
      if (container) {
        container.innerHTML = '';
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
