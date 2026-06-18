import { NextRequest, NextResponse } from "next/server";

const CATEGORIES = {
  macro: 'federal reserve OR inflation OR GDP OR economic policy OR treasury',
  fed: '"Federal Reserve" OR "FOMC" OR "Jerome Powell" OR "interest rates"',
  geopolitical: 'geopolitical OR sanctions OR war OR OPEC OR trade war',
  markets: 'S&P 500 OR Nasdaq OR stock market OR equities OR bonds',
};

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get('category') || 'macro';
  const apiKey = process.env.NEWS_API_KEY;

  if (!apiKey) return NextResponse.json({ error: 'NEWS_API_KEY missing' }, { status: 500 });

  const query = CATEGORIES[category as keyof typeof CATEGORIES] || CATEGORIES.macro;

  const newsRes = await fetch(
    `https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}&language=en&sortBy=publishedAt&pageSize=20&apiKey=${apiKey}`,
    { next: { revalidate: 300 } } // 5-minute cache
  );

  const newsData = await newsRes.json();

  if (newsData.status !== 'ok') {
    return NextResponse.json({ error: newsData.message }, { status: 500 });
  }

  // Deduplicate by normalized title
  const seen = new Set<string>();
  const articles = newsData.articles
    .filter((a: any) => {
      const key = a.title?.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 50);
      if (seen.has(key)) return false;
      seen.add(key);
      return a.title && a.url && a.publishedAt;
    })
    .map((a: any) => ({
      title: a.title,
      description: a.description,
      url: a.url,
      source: a.source?.name,
      publishedAt: a.publishedAt,
      // Sentiment will be scored client-side or via a separate AI call — do NOT fabricate
      sentiment: null,
    }));

  return NextResponse.json({ articles, category, fetchedAt: Date.now() });
}
