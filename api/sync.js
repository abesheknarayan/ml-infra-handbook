import { crawlAllSources } from './_crawler.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Use POST /api/sync' });
    return;
  }
  const secret = process.env.ADMIN_SECRET;
  if (secret && req.headers['x-admin-secret'] !== secret) {
    res.status(403).json({ ok: false, error: 'Unauthorized' });
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
