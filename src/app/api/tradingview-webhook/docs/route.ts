import { NextRequest, NextResponse } from 'next/server';

/**
 * TradingView Webhook Documentation API
 * 
 * Provides comprehensive documentation for TradingView webhook integration.
 * Includes setup instructions, examples, and troubleshooting.
 */

export async function GET() {
  return NextResponse.json({
    title: "TradingView Webhook Integration Guide",
    version: "1.0.0",
    description: "Complete guide for setting up TradingView webhook alerts with Ark Intelligence",
    
    setup_steps: [
      {
        step: 1,
        title: "Configure Webhook URL",
        description: "Set your webhook URL in TradingView alert settings",
        instructions: [
          "1. Open TradingView and go to any chart",
          "2. Click the 'Alerts' button (bell icon)",
          "3. Click 'Create Alert' or select existing alert",
          "4. Click the 'Webhook' tab",
          "5. Enter your webhook URL: https://your-domain.com/api/tradingview-webhook",
          "6. Configure message format as JSON"
        ]
      },
      {
        step: 2,
        title: "Configure Alert Conditions",
        description: "Set up conditions for triggering trading signals",
        instructions: [
          "1. Choose your technical indicator (RSI, MACD, etc.)",
          "2. Set trigger conditions (over/under, cross, etc.)",
          "3. Configure symbol and timeframe",
          "4. Set alert expiration (optional)"
        ]
      },
      {
        step: 3,
        title: "Set Message Payload",
        description: "Configure JSON payload for trading actions",
        example_payload: {
          symbol: "BTCUSD",
          action: "buy",
          price: 45000,
          quantity: 0.1,
          message: "RSI oversold - buy signal",
          timestamp: "2024-01-15T10:30:00Z"
        }
      },
      {
        step: 4,
        title: "Test Webhook Connection",
        description: "Verify webhook is working before using live",
        instructions: [
          "1. Create a test alert with simple conditions",
          "2. Trigger the alert manually if possible",
          "3. Check webhook logs for successful processing",
          "4. Verify trading actions execute correctly"
        ]
      }
    ],
    
    supported_actions: [
      {
        action: "buy",
        description: "Execute a buy order",
        required_fields: ["symbol"],
        optional_fields: ["price", "quantity", "message"]
      },
      {
        action: "sell",
        description: "Execute a sell order",
        required_fields: ["symbol"],
        optional_fields: ["price", "quantity", "message"]
      },
      {
        action: "close",
        description: "Close all positions for symbol",
        required_fields: ["symbol"],
        optional_fields: ["message"]
      }
    ],
    
    message_format: {
      content_type: "application/json",
      encoding: "UTF-8",
      example: {
        symbol: "string (required) - Trading symbol",
        action: "string (required) - buy, sell, or close",
        price: "number (optional) - Target price",
        quantity: "number (optional) - Order quantity",
        message: "string (optional) - Custom message",
        timestamp: "string (auto) - ISO timestamp",
        secret: "string (optional) - Webhook secret for validation"
      }
    },
    
    security_features: [
      {
        feature: "Webhook Secret Validation",
        description: "Optional secret key to verify webhook authenticity",
        setup: "Set TRADINGVIEW_WEBHOOK_SECRET in environment variables"
      },
      {
        feature: "Rate Limiting",
        description: "Protects against webhook abuse and spam",
        limits: "10 requests per minute per IP address"
      },
      {
        feature: "Payload Validation",
        description: "Validates incoming webhook data structure",
        validation: "Required fields and data type checking"
      }
    ],
    
    troubleshooting: [
      {
        issue: "Webhook not receiving signals",
        solutions: [
          "Check webhook URL is correct and accessible",
          "Verify TradingView alert is configured for webhook",
          "Check network firewall settings",
          "Review TradingView alert logs"
        ]
      },
      {
        issue: "Invalid payload errors",
        solutions: [
          "Ensure JSON format is valid",
          "Check all required fields are included",
          "Verify field data types match expected format",
          "Use TradingView's JSON message template"
        ]
      },
      {
        issue: "Rate limit exceeded",
        solutions: [
          "Wait before sending additional requests",
          "Check for automated alert loops",
          "Review alert frequency settings"
        ]
      }
    ],
    
    advanced_features: [
      {
        feature: "Custom Trading Logic",
        description: "Implement your own trading strategies",
        implementation: "Modify processTradingSignal function in webhook route"
      },
      {
        feature: "Multiple Broker Integration",
        description: "Connect to different trading platforms",
        implementation: "Replace placeholder functions with broker API calls"
      },
      {
        feature: "Signal Filtering",
        description: "Add custom validation for trading signals",
        implementation: "Add validation logic before order execution"
      }
    ],
    
    api_endpoints: {
      webhook: "/api/tradingview-webhook",
      method: "POST",
      status: "/api/tradingview-webhook",
      documentation: "/api/tradingview-webhook/docs"
    },
    
    environment_variables: {
      TRADINGVIEW_WEBHOOK_URL: "Your webhook endpoint URL",
      TRADINGVIEW_WEBHOOK_SECRET: "Optional secret for webhook validation"
    },
    
    integration_examples: {
      tradingview_setup: {
        title: "TradingView Alert Configuration",
        webhook_url: "https://your-domain.com/api/tradingview-webhook",
        alert_condition: "RSI(14) < 30",
        message_template: {
          symbol: "{{ticker}}",
          action: "buy",
          quantity: 0.1,
          message: "RSI oversold signal"
        }
      },
      broker_integration: {
        title: "Broker API Integration Example",
        code_example: `
// Example: Integration with Binance API
import Binance from 'binance-api-node';

async function executeBuyOrder(symbol: string, price?: number, quantity?: number) {
  const binance = new Binance();
  
  try {
    const order = await binance.order({
      symbol: symbol,
      side: 'BUY',
      type: price ? 'LIMIT' : 'MARKET',
      quantity: quantity || 0.001,
      price: price
    });
    
    console.log('Buy order placed:', order);
    return order;
  } catch (error) {
    console.error('Buy order failed:', error);
    throw error;
  }
}
        `
      }
    }
  });
}
