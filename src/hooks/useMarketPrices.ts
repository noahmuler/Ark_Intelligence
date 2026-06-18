import { useQuery } from '@tanstack/react-query';

export function useMarketPrices() {
  return useQuery({
    queryKey: ['market-prices'],
    queryFn: async () => {
      const res = await fetch('/api/market/prices');
      if (!res.ok) throw new Error('Failed to fetch prices');
      return res.json();
    },
    refetchInterval: 15_000,   // Poll every 15 seconds
    staleTime: 10_000,
    retry: 2,
  });
}
