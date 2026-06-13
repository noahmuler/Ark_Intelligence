import fs from 'fs';
import path from 'path';

const logPath = 'c:\\Users\\noah9\\Documents\\Ark Labs\\Ark_Intelligence\\.next\\dev\\logs\\next-development.log';

function test(): void {
  if (!fs.existsSync(logPath)) {
    console.error('Log file does not exist');
    return;
  }

  const content = fs.readFileSync(logPath, 'utf8');
  const lines = content.split('\n');
  console.log(`Read ${lines.length} lines from log`);

  const matches: string[] = [];
  for (const line of lines) {
    if (line.includes('[calendar] source succeeded, raw preview:')) {
      matches.push(line);
    }
  }

  console.log(`Found ${matches.length} matches`);
  matches.forEach((m, idx) => {
    console.log(`\nMatch ${idx + 1}:`);
    const json = JSON.parse(m);
    console.log('Timestamp:', json.timestamp);
    console.log('Message:', json.message);
  });
}

test();
