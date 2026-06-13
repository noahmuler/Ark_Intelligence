import fs from 'fs';

const logPath = 'c:\\Users\\noah9\\Documents\\Ark Labs\\Ark_Intelligence\\.next\\dev\\logs\\next-development.log';

function test(): void {
  if (!fs.existsSync(logPath)) {
    console.error('Log file does not exist');
    return;
  }

  const content = fs.readFileSync(logPath, 'utf8');
  const lines = content.split('\n');
  const last50 = lines.slice(-50);
  console.log('--- Last 50 lines of Next.js log ---');
  last50.forEach(line => {
    if (line.trim()) {
      try {
        const parsed = JSON.parse(line);
        console.log(`[${parsed.source}] [${parsed.level}] ${parsed.message}`);
      } catch (e) {
        console.log(line);
      }
    }
  });
}

test();
