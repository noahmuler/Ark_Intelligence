import fs from 'fs';

const logPath = 'c:\\Users\\noah9\\Documents\\Ark Labs\\Ark_Intelligence\\.next\\dev\\logs\\next-development.log';

function test(): void {
  if (!fs.existsSync(logPath)) {
    console.error('Log file does not exist');
    return;
  }

  const content = fs.readFileSync(logPath, 'utf8');
  const lines = content.split('\n');

  for (const line of lines) {
    if (line.includes('[calendar] source succeeded, raw preview:') && line.includes('OPEC-JMMC Meetings')) {
      const parsed = JSON.parse(line);
      console.log('Timestamp:', parsed.timestamp);
      const msg = parsed.message;
      const prefix = '[calendar] source succeeded, raw preview: ';
      if (msg.startsWith(prefix)) {
        const rawJsonString = msg.slice(prefix.length);
        let cleanJson = rawJsonString;
        if (cleanJson.startsWith('"') && cleanJson.endsWith('"')) {
          cleanJson = JSON.parse(cleanJson);
        }
        try {
          const data = JSON.parse(cleanJson);
          console.log(`Event count: ${data.length}`);
          console.log('First 10 events:');
          console.log(JSON.stringify(data.slice(0, 10), null, 2));
          console.log('\nEvents with non-empty actual:');
          const withActual = data.filter((e: any) => e.actual !== undefined && e.actual !== '');
          console.log(`Found ${withActual.length} events with actual values.`);
          console.log(JSON.stringify(withActual.slice(0, 5), null, 2));
        } catch (e) {
          console.log('Failed to parse cleanJson:', (e as Error).message);
          console.log('cleanJson start:', cleanJson.slice(0, 200));
        }
      }
      break;
    }
  }
}

test();
