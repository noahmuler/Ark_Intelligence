async function testSources(): Promise<void> {
  const url = 'https://nfs.faireconomy.media/ff_calendar_thisweek.json';
  const userAgents = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15',
    'curl/7.64.1',
    ''
  ];

  for (const ua of userAgents) {
    console.log(`\nTesting UA: "${ua}"`);
    try {
      const headers: Record<string, string> = {};
      if (ua) headers['User-Agent'] = ua;
      const res = await fetch(url, { headers, cache: 'no-store' });
      console.log('Status:', res.status);
      if (res.ok) {
        const data: unknown[] = await res.json();
        console.log(`Success! Count: ${data.length}`);
        if (data.length > 0) {
          console.log('Sample event:', JSON.stringify(data[0], null, 2));
        }
        break;
      } else {
        const text = await res.text();
        console.log('Error payload:', text.slice(0, 200));
      }
    } catch (e) {
      console.error('Fetch error:', (e as Error).message);
    }
  }
}

testSources();
