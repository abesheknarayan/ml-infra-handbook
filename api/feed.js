import { crawlAllSources } from './_crawler.js';

export default async function handler(req, res) {
  try {
    const payload = await crawlAllSources();
    res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
    res.status(200).json(payload);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
