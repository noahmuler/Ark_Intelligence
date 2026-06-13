const API_KEY = 'MVZ1OVB0HGON9EZL';
const alphavantageUrl = `https://www.alphavantage.co/query?function=FEDERAL_FUNDS_RATE&apikey=${API_KEY}`;

async function testAlphaVantage(): Promise<void> {
  try {
    const res = await fetch(alphavantageUrl);
    const data = await res.json();
    console.log('Keys:', Object.keys(data));
    console.log('Name:', data.name);
    console.log('Interval:', data.interval);
    console.log('Unit:', data.unit);
    if (data.data) {
      console.log('Data length:', data.data.length);
      console.log('First 3 data items:', data.data.slice(0, 3));
    } else {
      console.log('Full data:', data);
    }
  } catch (e) {
    console.error(e);
  }
}

testAlphaVantage();
