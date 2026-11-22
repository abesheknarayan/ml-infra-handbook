import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { crawlAllSources } from '../api/_crawler.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outPath = path.resolve(__dirname, '..', 'indexed_feed.json');

const payload = await crawlAllSources();
if (!payload.items || payload.items.length === 0) {
  console.log('No items returned; keeping existing indexed_feed.json');
  process.exit(0);
}

// Only rewrite if the top items actually changed so we avoid noisy commits
let prevUrls = '';
try {
  const existing = JSON.parse(fs.readFileSync(outPath, 'utf8'));
  prevUrls = (existing.items || []).map((x) => x.url).join('\n');
} catch {}

const nextUrls = payload.items.map((x) => x.url).join('\n');
if (prevUrls === nextUrls) {
  console.log(`No new articles (${payload.items.length} items unchanged).`);
  process.exit(0);
}

fs.writeFileSync(outPath, JSON.stringify(payload, null, 2) + '\n', 'utf8');
console.log(`Updated indexed_feed.json with ${payload.items.length} items.`);
