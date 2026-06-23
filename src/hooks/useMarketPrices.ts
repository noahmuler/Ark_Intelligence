import { useQuery } from '@tanstack/react-query';

export function useMarketPrices() {
  return useQuery({
    queryKey: ['market-prices'],
    queryFn: async () => {
      const res = await fetch('/api/market/prices');
      if (!res.ok) throw new Error('Failed to fetch prices');
      return res.json();
    },
    refetchInterval: 5_000,   // Poll every 5 seconds for near real-time
    staleTime: 3_000,
    retry: 2,
  });
}
