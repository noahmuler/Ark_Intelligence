/**
 * TradingView Integration Service
 * 
 * This service provides integration methods for TradingView based on their actual API model.
 * TradingView does NOT offer direct public APIs for market data access.
 * Integration requires broker connections, webhook alerts, or third-party services.
 * 
 * Available Integration Methods:
 * 1. Broker Integration (for trading)
 * 2. Webhook Alerts (for automation)
 * 3. Third-Party Scrapers (for data)
 * 4. Developer Access (for advanced charts)
 */

export interface TradingViewAlertConfig {
  webhook_url: string;
  symbol?: string;
  action?: 'buy' | 'sell' | 'close';
  price?: number;
  quantity?: number;
  message?: string;
}

export interface TradingViewBrokerConfig {
  broker_name: string;
  username?: string;
  password?: string;
  account?: string;
}

export interface TradingViewChartConfig {
  symbol: string;
  interval: string;
  timeframe: string;
  theme: 'light' | 'dark';
  height?: number;
  width?: number;
  studies?: string[];
  custom_data?: any;
}

/**
 * TradingView Webhook Alert Integration
 * 
 * Creates webhook alerts for automated trading signals.
 * Sends trade signals to TradingView via webhook endpoints.
 * 
 * @param config - Alert configuration
 * @returns {string} Webhook setup instructions
 */
export function createTradingViewWebhookAlert(config: TradingViewAlertConfig): string {
  const { webhook_url, symbol, action = 'buy', price, quantity, message } = config;
  
  const alertPayload = {
    symbol,
    action,
    price,
    quantity,
    message,
    timestamp: new Date().toISOString()
  };

  return `
    <!-- TradingView Webhook Alert Setup -->
    <div class="tradingview-webhook-setup">
      <h4>TradingView Webhook Alert Configuration</h4>
      <p><strong>Webhook URL:</strong> ${webhook_url}</p>
      <p><strong>Symbol:</strong> ${symbol || 'Any'}</p>
      <p><strong>Action:</strong> ${action}</p>
      <p><strong>Price:</strong> ${price || 'Market'}</p>
      <p><strong>Quantity:</strong> ${quantity || 'Auto'}</p>
      
      <h5>Setup Instructions:</h5>
      <ol>
        <li>1. Go to TradingView chart and click "Alerts" button</li>
        <li>2. Click "Create Alert" or "Webhook" tab</li>
        <li>3. Paste this webhook URL: <code>${webhook_url}</code></li>
        <li>4. Configure your alert conditions</li>
        <li>5. Test the webhook connection</li>
      </ol>
    </div>
  `;
}

/**
 * TradingView Broker Integration
 * 
 * Connects TradingView to supported brokers for direct trading.
 * Lists supported brokers and connection methods.
 * 
 * @param config - Broker configuration
 * @returns {string} Broker setup instructions
 */
export function createTradingViewBrokerIntegration(config: TradingViewBrokerConfig): string {
  const { broker_name, username, account } = config;
  
  return `
    <!-- TradingView Broker Integration -->
    <div class="tradingview-broker-setup">
      <h4>TradingView Broker Connection</h4>
      <p><strong>Broker:</strong> ${broker_name}</p>
      <p><strong>Account:</strong> ${account || 'Your Trading Account'}</p>
      
      <h5>Supported Brokers:</h5>
      <ul>
        <li><strong>Bitget</strong> - Crypto & derivatives trading</li>
        <li><strong>Tradovate</strong> - Forex & CFDs trading</li>
        <li><strong>3Commas</strong> - Stock & ETF trading</li>
        <li><strong>Bybit</strong> - Crypto derivatives trading</li>
        <li><strong>FXCM</strong> - Forex trading</li>
        <li><strong>Interactive Brokers</strong> - Stock & options trading</li>
        <li><strong>OANDA</strong> - Forex trading</li>
      </ul>
      
      <h5>Connection Steps:</h5>
      <ol>
        <li>1. Open TradingView platform</li>
        <li>2. Click "Trading Panel" button</li>
        <li>3. Select "${broker_name}" from broker list</li>
        <li>4. Enter your credentials: ${username ? `Username: ${username}` : 'Your broker credentials'}</li>
        <li>5. Connect your trading account</li>
        <li>6. Start trading directly from TradingView charts</li>
      </ol>
    </div>
  `;
}

/**
 * Third-Party Data Integration
 * 
 * Integrates with services that provide TradingView API access.
 * Uses services like Apify to generate API tokens for data fetching.
 * 
 * @param service - Third-party service name
 * @param api_key - Service API key
 * @returns {string} Integration setup instructions
 */
export function createThirdPartyDataIntegration(service: string, api_key: string): string {
  return `
    <!-- Third-Party TradingView Data Integration -->
    <div class="tradingview-third-party-setup">
      <h4>TradingView Data Integration via ${service}</h4>
      <p><strong>Service:</strong> ${service}</p>
      <p><strong>API Key:</strong> ${api_key}</p>
      
      <h5>Available Services:</h5>
      <ul>
        <li><strong>Apify</strong> - Generate TradingView API tokens for data access</li>
        <li><strong>Scraping.pro</strong> - Real-time data scraping services</li>
        <li><strong>Finage</strong> - Financial data aggregation</li>
        <li><strong>IEX Cloud</strong> - Market data services</li>
      </ul>
      
      <h5>Integration Steps:</h5>
      <ol>
        <li>1. Sign up for ${service} service</li>
        <li>2. Generate TradingView API token using your API key</li>
        <li>3. Use token in TradingView Pine Script or custom indicators</li>
        <li>4. Access real-time market data via TradingView widgets</li>
      </ol>
    </div>
  `;
}

/**
 * TradingView Widget API Integration
 * 
 * Creates TradingView widgets for real-time market data display.
 * Uses TradingView's advanced charting capabilities.
 * 
 * @param config - Widget configuration options
 * @returns {string} HTML embed code for TradingView widget
 */
export function createTradingViewWidget(config: TradingViewChartConfig): string {
  const { symbol, interval = '1', theme = 'light', height = 500, width = '100%', studies = ['RSI', 'MACD', 'BB'] } = config;
  
  const widgetConfig = {
    symbol,
    interval,
    theme,
    height,
    width,
    studies,
    locale: 'en',
    style: '1',
    autosize: true,
    timezone: 'Etc/UTC',
    toolbar_bg: '#f1f3f6',
    enable_publishing: false,
    allow_symbol_change: true,
    save_image: false
  };

  return `
    <!-- TradingView Widget -->
    <div class="tradingview-widget-container">
      <script type="text/javascript" src="https://s3.tradingview.com/tv.js"></script>
      <script type="text/javascript">
        new TradingView.widget({
          ${JSON.stringify(widgetConfig)}
        });
      </script>
    </div>
  `;
}

/**
 * TradingView Chart Widget (Advanced)
 * 
 * Creates TradingView charts with custom data and indicators.
 * Requires TradingView developer access for advanced features.
 * 
 * @param config - Chart configuration
 * @returns {string} Advanced chart embed code
 */
export function createTradingViewAdvancedChart(config: TradingViewChartConfig): string {
  const { symbol, interval = 'D', timeframe = '1D', theme = 'light', height = 600, width = 800, studies, custom_data } = config;
  
  const chartConfig = {
    symbol,
    interval,
    timeframe,
    theme,
    height,
    width,
    studies: studies || ['SMA', 'EMA', 'RSI', 'MACD'],
    custom_data: custom_data,
    locale: 'en'
  };

  return `
    <!-- TradingView Advanced Chart -->
    <div class="tradingview-advanced-chart">
      <script type="text/javascript" src="https://s3.tradingview.com/tv.js"></script>
      <script type="text/javascript">
        new TradingView.widget({
          ${JSON.stringify(chartConfig)}
        });
      </script>
    </div>
  `;
}

/**
 * Pine Script Integration
 * 
 * Creates custom Pine Script indicators for TradingView.
 * Requires TradingView developer access and Pine Script knowledge.
 * 
 * @param script_name - Name of the Pine Script
 * @param script_code - Pine Script code
 * @returns {string} Pine Script setup instructions
 */
export function createPineScriptIntegration(script_name: string, script_code: string): string {
  return `
    <!-- TradingView Pine Script Integration -->
    <div class="tradingview-pine-script">
      <h4>Pine Script: ${script_name}</h4>
      <pre><code>${script_code}</code></pre>
      
      <h5>Installation Steps:</h5>
      <ol>
        <li>1. Open TradingView Pine Editor</li>
        <li>2. Click "New" and paste the script above</li>
        <li>3. Click "Add to Chart" to apply to any chart</li>
        <li>4. Save script to your TradingView account</li>
        <li>5. Use script in any TradingView chart</li>
      </ol>
    </div>
  `;
}

/**
 * TradingView Integration Status Check
 * 
 * Checks if any TradingView integration methods are available.
 * Provides guidance on which integration approach to use.
 * 
 * @returns {string} Integration recommendations
 */
export function getTradingViewIntegrationRecommendation(): string {
  const hasBrokerAccess = process.env.TRADINGVIEW_BROKER_ACCOUNT;
  const hasWebhookSetup = process.env.TRADINGVIEW_WEBHOOK_URL;
  const hasThirdPartyToken = process.env.TRADINGVIEW_THIRD_PARTY_TOKEN;
  
  if (hasBrokerAccess) {
    return 'Broker Integration Available - You can connect TradingView directly to your broker for live trading.';
  }
  
  if (hasWebhookSetup) {
    return 'Webhook Alerts Available - You can set up automated trading signals via webhooks.';
  }
  
  if (hasThirdPartyToken) {
    return 'Third-Party Data Access Available - You can use services like Apify for data integration.';
  }
  
  return 'Basic TradingView Access - You can create charts and indicators, but for advanced features you will need broker integration or third-party services.';
}
