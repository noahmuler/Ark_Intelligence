export const fmt = {
  price: (n: number, decimals = 2) => n?.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals }) ?? '—',
  percent: (n: number) => `${n >= 0 ? '+' : ''}${n?.toFixed(2)}%`,
  pnl: (n: number) => `${n >= 0 ? '+' : ''}$${Math.abs(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
  compact: (n: number) => n >= 1e6 ? `${(n/1e6).toFixed(1)}M` : n >= 1e3 ? `${(n/1e3).toFixed(1)}K` : n?.toFixed(0),
  date: (s: string) => new Date(s).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
  time: (ts: number) => new Date(ts * 1000).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
};
