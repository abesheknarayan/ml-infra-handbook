import { crawlAllSources } from './_crawler.js';
import { isAuthorizedAdmin } from './_auth.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }
  if (!isAuthorizedAdmin(req, { allowCron: true })) {
    res.status(403).json({ error: 'Forbidden' });
    return;
  }
  try {
    const payload = await crawlAllSources();
    res.setHeader('Cache-Control', 'private, max-age=300');
    res.status(200).json(payload);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
