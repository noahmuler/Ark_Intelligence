import { NextRequest, NextResponse } from 'next/server';
import { createTradingViewWebhookAlert } from '@/services/tradingViewAPI';

/**
 * TradingView Webhook API Route
 * 
 * Handles incoming TradingView webhook alerts for automated trading signals.
 * Processes buy/sell signals and executes trading actions.
 * 
 * Features:
 * - Secure webhook validation
 * - Signal processing and validation
 * - Trading action execution
 * - Error handling and logging
 * - Rate limiting protection
 */

interface TradingViewWebhookPayload {
  symbol: string;
  action: 'buy' | 'sell' | 'close';
  price?: number;
  quantity?: number;
  timestamp: string;
  message?: string;
  secret?: string;
}

/**
 * Validate TradingView webhook payload
 * 
 * Ensures webhook requests are legitimate and properly formatted.
 * 
 * @param payload - Incoming webhook data
 * @returns {boolean} True if payload is valid
 */
function validateWebhookPayload(payload: any): payload is TradingViewWebhookPayload {
  return (
    payload &&
    typeof payload.symbol === 'string' &&
    ['buy', 'sell', 'close'].includes(payload.action) &&
    typeof payload.timestamp === 'string'
  );
}

/**
 * Process trading signal from TradingView
 * 
 * Executes trading actions based on webhook signals.
 * 
 * @param payload - Validated webhook payload
 * @returns {Promise<void>}
 */
async function processTradingSignal(payload: TradingViewWebhookPayload): Promise<void> {
  const { symbol, action, price, quantity, message } = payload;
  
  try {
    console.log(`Processing TradingView signal: ${action} ${symbol} at ${price || 'market'}`);
    
    // Here you would integrate with your trading broker or exchange
    // Example implementations:
    
    switch (action) {
      case 'buy':
        await executeBuyOrder(symbol, price, quantity);
        break;
      case 'sell':
        await executeSellOrder(symbol, price, quantity);
        break;
      case 'close':
        await executeCloseOrder(symbol);
        break;
    }
    
    // Log successful signal processing
    console.log(`Successfully processed ${action} signal for ${symbol}`);
    
  } catch (error) {
    console.error(`Failed to process trading signal:`, error);
    throw error;
  }
}

/**
 * Execute buy order (placeholder implementation)
 * 
 * Replace with your actual broker API integration.
 */
async function executeBuyOrder(symbol: string, price?: number, quantity?: number): Promise<void> {
  console.log(`Executing BUY order: ${symbol} at ${price || 'market'} quantity: ${quantity || 'default'}`);
  
  // TODO: Integrate with your broker's API
  // Example:
  // await brokerApi.placeOrder({
  //   symbol,
  //   side: 'buy',
  //   type: price ? 'limit' : 'market',
  //   price: price || undefined,
  //   quantity: quantity || calculateDefaultQuantity(symbol)
  // });
}

/**
 * Execute sell order (placeholder implementation)
 * 
 * Replace with your actual broker API integration.
 */
async function executeSellOrder(symbol: string, price?: number, quantity?: number): Promise<void> {
  console.log(`Executing SELL order: ${symbol} at ${price || 'market'} quantity: ${quantity || 'default'}`);
  
  // TODO: Integrate with your broker's API
  // Example:
  // await brokerApi.placeOrder({
  //   symbol,
  //   side: 'sell',
  //   type: price ? 'limit' : 'market',
  //   price: price || undefined,
  //   quantity: quantity || calculateDefaultQuantity(symbol)
  // });
}

/**
 * Execute close order (placeholder implementation)
 * 
 * Replace with your actual broker API integration.
 */
async function executeCloseOrder(symbol: string): Promise<void> {
  console.log(`Executing CLOSE order: ${symbol}`);
  
  // TODO: Integrate with your broker's API
  // Example:
  // await brokerApi.closePosition(symbol);
}

/**
 * Rate limiting middleware
 * 
 * Prevents webhook abuse and spam.
 */
// Track recent webhook requests per IP to enforce rate limits.
// Using a sliding window of the last 60 seconds with a max of 10 requests.
const webhookRequests = new Map<string, number[]>();

// Global cleanup task for removing stale entries from the rate limit map
// Runs every minute to remove IPs with no recent activity (TTL: 5 minutes)
const RATE_LIMIT_TTL_MS = 5 * 60 * 1000; // 5 minutes
const RATE_LIMIT_CLEANUP_INTERVAL_MS = 60 * 1000; // 1 minute

let cleanupIntervalId: NodeJS.Timeout | null = null;

const startCleanupInterval = () => {
  if (cleanupIntervalId) return;
  
  cleanupIntervalId = setInterval(() => {
    const now = Date.now();
    for (const [ip, timestamps] of webhookRequests.entries()) {
      if (timestamps.length === 0) {
        webhookRequests.delete(ip);
      } else {
        const lastTimestamp = timestamps[timestamps.length - 1];
        if (now - lastTimestamp > RATE_LIMIT_TTL_MS) {
          webhookRequests.delete(ip);
        }
      }
    }
  }, RATE_LIMIT_CLEANUP_INTERVAL_MS);
};

// Cleanup handler for graceful shutdown
const cleanupOnShutdown = () => {
  if (cleanupIntervalId) {
    clearInterval(cleanupIntervalId);
    cleanupIntervalId = null;
  }
};

// Register shutdown handlers once
let shutdownHandlersRegistered = false;
const registerShutdownHandlers = () => {
  if (shutdownHandlersRegistered) return;
  shutdownHandlersRegistered = true;
  
  process.on('SIGINT', cleanupOnShutdown);
  process.on('SIGTERM', cleanupOnShutdown);
  process.on('exit', cleanupOnShutdown);
};

// Start cleanup on first request
let cleanupStarted = false;

function checkRateLimit(ip: string): boolean {
  // Initialize cleanup on first call
  if (!cleanupStarted) {
    cleanupStarted = true;
    startCleanupInterval();
    registerShutdownHandlers();
  }

  const now = Date.now();
  const windowMs = 60_000;
  const maxRequests = 10;

  const timestamps = webhookRequests.get(ip) ?? [];

  // Prune timestamps older than 60 seconds.
  const pruned = timestamps.filter(ts => now - ts < windowMs);

  // If empty after pruning, avoid leaking Map entries.
  if (pruned.length === 0) {
    webhookRequests.delete(ip);
  }

  // Allow only if fewer than maxRequests remain in the window.
  if (pruned.length >= maxRequests) {
    // Persist pruned timestamps for accuracy.
    if (pruned.length > 0) webhookRequests.set(ip, pruned);
    return false;
  }

  const next = [...pruned, now];
  webhookRequests.set(ip, next);
  return true;
}


/**
 * Main webhook handler
 * 
 * Processes incoming TradingView webhook alerts.
 */
export async function POST(request: NextRequest) {
  try {
    // Get client IP for rate limiting with trusted proxy validation
    const trustedProxies = (process.env.TRUSTED_PROXIES || '')
      .split(',')
      .map(p => p.trim())
      .filter(Boolean);

    const getClientIP = (headers: any): string => {
      const xForwardedFor = headers.get('x-forwarded-for');
      const xRealIp = headers.get('x-real-ip');
      
      // If TRUSTED_PROXIES is not configured, fall back to safe defaults
      if (trustedProxies.length === 0) {
        return xRealIp || xForwardedFor?.split(',').pop()?.trim() || 'unknown';
      }

      // If x-forwarded-for exists, parse and use rightmost untrusted IP
      if (xForwardedFor) {
        const ips = xForwardedFor.split(',').map((s: string) => s.trim()).filter(Boolean);
        // Return the rightmost IP that's not in trusted proxies, or the rightmost one if all are trusted
        for (let i = ips.length - 1; i >= 0; i--) {
          if (!trustedProxies.includes(ips[i])) {
            return ips[i];
          }
        }
        return ips[ips.length - 1] || 'unknown';
      }

      // Fall back to x-real-ip or unknown
      return xRealIp || 'unknown';
    };

    const ip = getClientIP(request.headers);


    
    // Check rate limiting
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429 }
      );
    }
    
    // Parse webhook payload
    const payload = await request.json();
    
    // Validate webhook secret if configured
    const webhookSecret = process.env.TRADINGVIEW_WEBHOOK_SECRET;
    if (webhookSecret && payload.secret !== webhookSecret) {
      return NextResponse.json(
        { error: 'Invalid webhook secret' },
        { status: 401 }
      );
    }
    
    // Validate payload structure
    if (!validateWebhookPayload(payload)) {
      return NextResponse.json(
        { error: 'Invalid webhook payload' },
        { status: 400 }
      );
    }
    
    // Process trading signal
    await processTradingSignal(payload);
    
    // Return success response
    return NextResponse.json({
      success: true,
      message: 'Trading signal processed successfully',
      processed_at: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('TradingView webhook error:', error);
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * GET method for webhook status
 * 
 * Returns webhook configuration and status information.
 */
export async function GET() {
  return NextResponse.json({
    webhook_url: process.env.TRADINGVIEW_WEBHOOK_URL,
    status: 'active',
    supported_actions: ['buy', 'sell', 'close'],
    documentation: '/api/tradingview-webhook/docs',
    setup_instructions: {
      step1: 'Create alert in TradingView',
      step2: 'Configure webhook URL',
      step3: 'Set alert conditions',
      step4: 'Test webhook connection'
    }
  });
}
