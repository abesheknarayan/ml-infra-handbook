import { crawlAllSources } from './_crawler.js';
import { isAuthorizedAdmin } from './_auth.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Use POST /api/sync' });
    return;
  }
  if (!isAuthorizedAdmin(req)) {
    res.status(403).json({ ok: false, error: 'Forbidden' });
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
