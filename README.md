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
- Node.js 22.x (required for local Convex Node.js actions; Node.js 24.x is also supported)
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

### Free Local MT5 Investor-Account Sync

The Trading Journal can sync closed MT5 deals without MetaApi or another paid bridge. The MT5 terminal runs locally on the same Mac as the dashboard and keeps the investor password; the dashboard only receives read-only trade history over localhost.

1. In `.env.local`, configure `MT5_SYNC_TOKEN` with a private value of at least 32 characters. Use a different value for each machine. After starting the local Convex deployment, run `node scripts/configureLocalMt5Sync.mjs` to safely copy the key into that local backend.
2. Start the dashboard and open `http://localhost:3000/settings`. Download `ArkJournalSync.mq5` and copy the displayed local sync key.
3. In MT5, sign in with the investor password, open **File → Open Data Folder**, and place the EA in `MQL5/Experts`. Open it in MetaEditor and compile.
4. In MT5, allow `http://127.0.0.1:3000` under **Tools → Options → Expert Advisors → Allow WebRequest for listed URL**.
5. Attach **ArkJournalSync** to a chart. Set its endpoint and sync key from Settings, then enable Algo Trading. Keep MT5 and the local dashboard running.

The sync key authorizes updates to the local journal and should be treated like a password. Do not expose the Next.js server or share the key. Disconnecting in Settings does not stop the EA; remove it from the chart first.

The Expert Advisor source is [`public/mt5/ArkJournalSync.mq5`](./public/mt5/ArkJournalSync.mq5). It must be compiled with MetaEditor on the user's MT5 installation; this project does not include MetaEditor.

### Free Exness Trading API Sync (Recommended)

The Settings page also supports Exness's read-only Trading API. Unlike a bearer-token API, Exness requires an API key ID, an Ed25519 private signing key, the trading account ID, and the HTTPS DNS gateway URL shown in Key Management. Ark discovers the account Access Point and reads account/deal history; it does not place or modify trades. API history sync runs every minute and initially imports up to the latest 90 days, subject to the age and range limits returned by Exness.

1. In Exness Key Management, create a Trading API key scoped to the intended account with read-only permissions. Copy the API key ID, private key, account ID, and DNS widget gateway URL.
2. Generate a 32-byte encryption key, for example with `node -e 'console.log(require("node:crypto").randomBytes(32).toString("base64"))'`.
3. Set `EXNESS_CREDENTIALS_ENCRYPTION_KEY` to that value in `.env.local` and in the active Convex deployment (`npx convex env set EXNESS_CREDENTIALS_ENCRYPTION_KEY "<same value>"`). Keep it private and do not commit it. The API key and signing key are encrypted with this key before they are stored.
4. Restart the app, open Settings on this Mac, and enter the Exness credentials in the **Exness Africa API** card. Use the DNS widget gateway URL, not a copied Access Point host.

The connection form and sync endpoints only accept same-origin requests on localhost. The MT5 Desktop method remains available as a free alternative below the API card. Only one method is active for the journal at a time to avoid overlapping imports from the same account; connecting either method switches the selected source.

### Required APIs for Full Functionality

1. **Finnhub** (Prices, Forex, Crypto)
   - Register at: https://finnhub.io
   - Free tier: 60 calls/min
   - Provides: Forex, metals, and crypto quotes. Without this key, the dashboard uses available Yahoo Finance quotes and marks the price data as partial.

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
