import { useQuery } from '@tanstack/react-query';

export interface MarketPrice {
  name: string;
  symbol: string;
  price: number;
  open?: number;
  high?: number;
  low?: number;
  prevClose: number;
  change: number;
  changePercent: number;
  timestamp: number;
}

export interface MarketPricesResponse {
  prices: Record<string, MarketPrice>;
  fetchedAt: number;
  warnings: string[];
}

function isMarketPricesResponse(value: unknown): value is MarketPricesResponse {
  return (
    typeof value === 'object' &&
    value !== null &&
    'prices' in value &&
    typeof value.prices === 'object' &&
    value.prices !== null &&
    'fetchedAt' in value &&
    typeof value.fetchedAt === 'number' &&
    'warnings' in value &&
    Array.isArray(value.warnings)
  );
}

export function useMarketPrices() {
  return useQuery<MarketPricesResponse>({
    queryKey: ['market-prices'],
    queryFn: async () => {
      const res = await fetch('/api/market/prices');
      const data: unknown = await res.json();
      if (!res.ok) {
        const message =
          typeof data === 'object' &&
          data !== null &&
          'error' in data &&
          typeof data.error === 'string'
            ? data.error
            : 'Failed to fetch prices';
        throw new Error(message);
      }
      if (!isMarketPricesResponse(data)) {
        throw new Error('Market prices API returned an invalid response');
      }
      return data;
    },
    refetchInterval: 5_000,   // Poll every 5 seconds for near real-time
    staleTime: 3_000,
    retry: 2,
  });
}
