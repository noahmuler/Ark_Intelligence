'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { fetchComprehensiveMarketData, checkAPIHealth, getAvailableDataSources } from '@/services/dataServiceManager';
import { UnifiedMarketData, APIHealthStatus } from '@/services/dataServiceManager';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TrendingUp, TrendingDown, Activity, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';

export default function Dashboard() {
  const [marketData, setMarketData] = useState<UnifiedMarketData | null>(null);
  const [apiHealth, setApiHealth] = useState<APIHealthStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Fetch comprehensive market data
  const fetchMarketData = useCallback(async () => {
    try {
      setError(null);
      setLoading(true);
      const response = await fetchComprehensiveMarketData();
      setMarketData(response.data);
      setApiHealth(response.health);
      setLastRefresh(new Date());
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to fetch market data');
      console.error('Failed to fetch market data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Check API health
  const checkHealth = useCallback(async () => {
    try {
      const health = await checkAPIHealth();
      setApiHealth(health);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to check API health');
      console.error('Failed to check API health:', error);
    }
  }, []);

  // Initial data fetch
  useEffect(() => {
    fetchMarketData();
    checkHealth();
  }, [fetchMarketData, checkHealth]);

  // Auto-refresh setup
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      fetchMarketData();
      checkHealth();
    }, 30000);
    
    return () => clearInterval(interval);
  }, [autoRefresh, fetchMarketData, checkHealth]);

  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(value);
  };

  // Format percentage
  const formatPercentage = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
  };

  // Get health status icon
  const getHealthIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'degraded':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'down':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  // Get trend icon
  const getTrendIcon = (change: number) => {
    return change >= 0 ? 
      <TrendingUp className="h-4 w-4 text-green-500" /> : 
      <TrendingDown className="h-4 w-4 text-red-500" />;
  };

  if (loading && !marketData) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <span className="ml-4 text-lg">Loading market data...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Ark Intelligence Dashboard</h1>
          <p className="text-gray-600">
            Real-time market data and analysis
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <Badge variant={autoRefresh ? "default" : "secondary"}>
            Auto-refresh: {autoRefresh ? 'ON' : 'OFF'}
          </Badge>
          <Button
            onClick={() => setAutoRefresh(!autoRefresh)}
            variant="outline"
            size="sm"
          >
            {autoRefresh ? 'Disable' : 'Enable'} Auto-refresh
          </Button>
          <Button onClick={fetchMarketData} variant="outline" size="sm">
            Refresh Now
          </Button>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center justify-between">
          <div className="flex items-center">
            <AlertTriangle className="h-5 w-5 text-red-500 mr-3" />
            <span className="text-red-700">{error}</span>
          </div>
          <Button
            onClick={() => setError(null)}
            variant="ghost"
            size="sm"
            className="text-red-600 hover:text-red-700"
          >
            Dismiss
          </Button>
        </div>
      )}

      {/* API Health Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {apiHealth.map((health, index) => (
          <Card key={index}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold">{health.service}</h3>
                  <p className="text-sm text-gray-600">
                    {health.status.charAt(0).toUpperCase() + health.status.slice(1)}
                  </p>
                  {health.responseTime && (
                    <p className="text-xs text-gray-500">
                      {health.responseTime}ms
                    </p>
                  )}
                </div>
                {getHealthIcon(health.status)}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Market Indices */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {marketData?.indices.map((index, idx) => (
          <Card key={idx}>
            <CardHeader>
              <CardTitle className="text-lg">{index.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="text-2xl font-bold">
                  {formatCurrency(index.value)}
                </div>
                <div className="flex items-center space-x-2">
                  {getTrendIcon(index.change)}
                  <span className={`text-lg font-semibold ${
                    index.change >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {formatCurrency(Math.abs(index.change))}
                  </span>
                  <span className={`text-sm ${
                    index.changePercent >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    ({formatPercentage(index.changePercent)})
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Stock Movers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Top Gainers */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="h-5 w-5 mr-2 text-green-500" />
              Top Gainers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {(marketData?.stocks ?? [])
                .filter(stock => stock.changePercent > 0)
                .sort((a, b) => b.changePercent - a.changePercent)
                .slice(0, 5)
                .map((stock, idx) => (
                  <div key={idx} className="flex justify-between items-center">
                    <div>
                      <span className="font-medium">{stock.symbol}</span>
                      <span className="text-sm text-gray-600 ml-2">{stock.name}</span>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-green-600">
                        {formatPercentage(stock.changePercent)}
                      </div>
                      <div className="text-sm text-gray-600">
                        {formatCurrency(stock.price)}
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>

        {/* Top Losers */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingDown className="h-5 w-5 mr-2 text-red-500" />
              Top Losers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {(marketData?.stocks ?? [])
                .filter(stock => stock.changePercent < 0)
                .sort((a, b) => a.changePercent - b.changePercent)
                .slice(0, 5)
                .map((stock, idx) => (
                  <div key={idx} className="flex justify-between items-center">
                    <div>
                      <span className="font-medium">{stock.symbol}</span>
                      <span className="text-sm text-gray-600 ml-2">{stock.name}</span>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-red-600">
                        {formatPercentage(stock.changePercent)}
                      </div>
                      <div className="text-sm text-gray-600">
                        {formatCurrency(stock.price)}
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* AI Market Analysis */}
      {marketData?.aiAnalysis && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>AI Market Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Market Summary</h4>
                <p className="text-gray-700">{marketData.aiAnalysis.analysis.summary}</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <h5 className="font-medium text-sm text-gray-600 mb-1">Market Outlook</h5>
                  <Badge variant={
                    marketData.aiAnalysis.analysis.marketOutlook === 'Positive' ? 'default' :
                    marketData.aiAnalysis.analysis.marketOutlook === 'Negative' ? 'destructive' : 'secondary'
                  }>
                    {marketData.aiAnalysis.analysis.marketOutlook}
                  </Badge>
                </div>
                
                <div>
                  <h5 className="font-medium text-sm text-gray-600 mb-1">Risk Level</h5>
                  <Badge variant={
                    marketData.aiAnalysis.analysis.riskLevel === 'Low' ? 'default' :
                    marketData.aiAnalysis.analysis.riskLevel === 'High' ? 'destructive' : 'secondary'
                  }>
                    {marketData.aiAnalysis.analysis.riskLevel}
                  </Badge>
                </div>
                
                <div>
                  <h5 className="font-medium text-sm text-gray-600 mb-1">Data Sources</h5>
                  <div className="flex flex-wrap gap-1">
                    {marketData.sources.map((source, idx) => (
                      <Badge key={idx} variant="outline" className="text-xs">
                        {source}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
              
              {marketData.aiAnalysis.analysis.keyInsights.length > 0 && (
                <div>
                  <h5 className="font-medium text-sm text-gray-600 mb-2">Key Insights</h5>
                  <div className="space-y-2">
                    {marketData.aiAnalysis.analysis.keyInsights.map((insight, idx) => (
                      <div key={idx} className="border-l-4 border-blue-500 pl-3">
                        <div className="font-medium">{insight.title}</div>
                        <div className="text-sm text-gray-700">{insight.description}</div>
                        <div className="flex items-center space-x-2 mt-1">
                          <Badge variant="outline" className="text-xs">
                            {insight.category}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {insight.sentiment}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Economic Calendar Preview */}
      {marketData?.economicCalendar && marketData.economicCalendar.events.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Economic Events</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {marketData.economicCalendar.events.slice(0, 5).map((event, idx) => (
                <div key={idx} className="flex justify-between items-center border-b pb-2">
                  <div>
                    <div className="font-medium">{event.title}</div>
                    <div className="text-sm text-gray-600">
                      {(typeof event.date === 'string' ? new Date(event.date) : event.date).toLocaleDateString()} at {event.time}
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant={
                      event.impact === 'High' ? 'destructive' :
                      event.impact === 'Medium' ? 'default' : 'secondary'
                    }>
                      {event.impact} Impact
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Footer */}
      <div className="mt-8 text-center text-sm text-gray-600">
        <p>
          Last updated: {lastRefresh.toLocaleString()} | 
          Data sources: {marketData?.sources.join(', ') || 'Loading...'}
        </p>
      </div>
    </div>
  );
}
