const from = '2026-05-28';
const to = '2026-06-13';
const jblankedUrl = `https://www.jblanked.com/news/api/forex-factory/calendar/range/?from=${from}&to=${to}`;

async function testJBlanked(): Promise<void> {
  try {
    const res = await fetch(jblankedUrl, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    console.log('Status:', res.status);
    const text = await res.text();
    console.log('Response (first 1000 chars):');
    console.log(text.slice(0, 1000));
  } catch (err) {
    console.error('Fetch error:', err);
  }
}

testJBlanked();
