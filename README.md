# Ark Intelligence

Professional AI-driven trading intelligence dashboard for macro and technical analysis.

## Overview

Ark Intelligence is a data-dense, AI-first platform that transforms raw market data into actionable intelligence through three layers:

1. **Data Ingestion & Synthesis** - Macro feeds, technical engines, and sentiment analysis
2. **Dashboard Modules** - AI Session Briefing, Pulse Meter, Edge Factor, and specialized desks
3. **Institutional UI/UX** - Dark theme, high information density, real-time alerts

## Features

### Core Components
- **AI Session Brief**: Automated market narrative generation
- **Live Macro Feed**: Real-time news with AI sentiment scoring
- **Edge Factor**: Dynamic confidence scoring (0-100%)
- **Market Regime Detection**: Multi-timeframe analysis
- **Live Ticker**: Real-time price updates for DXY, XAUUSD, XAGUSD, US10Y

### Technical Architecture
- **Frontend**: Next.js 16 with App Router, TypeScript, Tailwind CSS
- **State Management**: TanStack Query for real-time data
- **Charts**: Lightweight Charts (TradingView) integration ready
- **Backend**: Next.js API routes with AI processing capabilities
- **Real-time**: WebSocket support for live data streaming

## Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
cp .env.local.example .env.local
```

3. Add your API keys to `.env.local`:
```env
FINNHUB_API_KEY=your_finnhub_api_key
OPENAI_API_KEY=your_openai_api_key
# ... other API keys
```

4. Start the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   │   ├── ai/           # AI processing endpoints
│   │   ├── market/       # Market data endpoints
│   │   └── news/         # News feed endpoints
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx          # Dashboard page
├── components/
│   ├── dashboard/         # Dashboard components
│   │   ├── MainLayout.tsx
│   │   ├── Sidebar.tsx
│   │   ├── Header.tsx
│   │   ├── AISessionBrief.tsx
│   │   ├── MacroDesk.tsx
│   │   └── EdgeFactor.tsx
│   ├── charts/           # Chart components
│   └── ui/               # Reusable UI components
├── lib/
│   └── api.ts           # API utilities and helpers
├── types/
│   └── index.ts         # TypeScript type definitions
└── hooks/               # Custom React hooks
```

## Key Components

### AISessionBrief
- Generates automated market analysis using AI
- Identifies main market drivers and bias
- Provides key support/resistance levels
- Updates based on session (London/NY)

### MacroDesk
- Real-time news feed with AI sentiment analysis
- Category filtering (Macro, Fed, Economic, etc.)
- Impact scoring and asset relevance filtering
- Automatic refresh every 30 seconds

### EdgeFactor
- Radial gauge visualization for overall confidence
- Three-factor breakdown: Macro (33%), Technical (33%), Sentiment (33%)
- Signal strength indicator
- Real-time score updates

## Environment Variables

```env
# Financial Data APIs
FINNHUB_API_KEY=your_finnhub_api_key
POLYGON_API_KEY=your_polygon_api_key
ALPHA_VANTAGE_API_KEY=your_alpha_vantage_api_key
TWELVEDATA_API_KEY=your_twelvedata_api_key
COIN_GECKO_API_KEY=your_coin_gecko_api_key

# Economic Calendar & Macro Reports
FRED_API_KEY=your_fred_api_key
TRADING_ECONOMICS_API_KEY=your_trading_economics_api_key
RAPIDAPI_KEY=your_rapidapi_api_key
JBLANKED_API_KEY=your_jblanked_api_key

# News APIs
NEWS_API_KEY=your_news_api_key
RSS_FEED_URL=https://feeds.finance.yahoo.com/rss/2.0/headline

# AI/ML APIs
OPENAI_API_KEY=your_openai_api_key
ANTHROPIC_API_KEY=your_anthropic_api_key
NEXT_PUBLIC_GEMINI_API_KEY=your_gemini_api_key

# Application Settings
NODE_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_WS_URL=ws://localhost:3001

# Convex Deployment
CONVEX_DEPLOYMENT=your_convex_deployment
NEXT_PUBLIC_CONVEX_URL=your_convex_url
NEXT_PUBLIC_CONVEX_SITE_URL=your_convex_site_url
```

## API Setup Instructions

### Required APIs for Full Functionality

1. **Finnhub** (Prices, Forex, Crypto)
   - Register at: https://finnhub.io
   - Free tier: 60 calls/min
   - Required for: Real-time asset prices (DXY, XAUUSD, XAGUSD, etc.)

2. **FRED** (Economic Data)
   - Register at: https://fred.stlouisfed.org/docs/api/api_key.html
   - Completely free
   - Required for: Economic reports (CPI, GDP, Employment, etc.)

3. **NewsAPI** (News Feed)
   - Register at: https://newsapi.org
   - Free tier: 100 requests/day (dev only)
   - Required for: Macro news feed with deduplication

4. **OpenAI** (AI Session Brief)
   - Register at: https://platform.openai.com
   - Required for: AI-generated market briefs with real context
   - Optional: Falls back to mock data if not provided

### Optional APIs

- **Polygon.io** (Stocks, Options) - Free tier available
- **Alpha Vantage** (Alternative data source)
- **Trading Economics** (Additional economic data)
- **CoinGecko** (Crypto data)

## Development

### Adding New Features

1. Create components in appropriate directories
2. Add TypeScript types in `src/types/index.ts`
3. Update API routes in `src/app/api/`
4. Test with mock data first, then integrate real APIs

### Styling Guidelines

- Use Tailwind CSS classes
- Follow zinc color palette theme
- Maintain high information density
- Use JetBrains Mono for all numerical data
- Ensure responsive design

## Production Deployment

### Build
```bash
npm run build
```

### Environment Setup
- Set all required environment variables
- Configure WebSocket endpoints
- Set up monitoring and logging
- Configure rate limiting for APIs
