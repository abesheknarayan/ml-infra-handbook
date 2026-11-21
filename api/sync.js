import { crawlAllSources } from './_crawler.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Use POST /api/sync' });
    return;
  }
  try {
    const feed = await crawlAllSources();
    res.setHeader('Cache-Control', 'no-store');
    res.status(200).json({ ok: true, feed });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
}
