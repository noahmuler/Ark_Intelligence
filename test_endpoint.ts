async function testEndpoint(): Promise<void> {
  const url = 'http://localhost:3000/api/calendar/events?from=2026-05-28&to=2026-06-13';
  try {
    const res = await fetch(url);
    console.log('Status:', res.status);
    const data = await res.json();
    console.log(`Returned events count: ${data.length}`);
    if (data.length > 0) {
      console.log('Sample event:', JSON.stringify(data[0], null, 2));
      console.log('First 5 events:');
      data.slice(0, 5).forEach((e: any, idx: number) => {
        console.log(`${idx + 1}. Title: ${e.title}, Actual: ${e.actual}, Forecast: ${e.forecast}, DateUtc: ${e.dateUtc}`);
      });
    } else {
      console.log('No events returned.');
    }
  } catch (err) {
    console.error('Fetch error:', err);
  }
}

testEndpoint();
