import crypto from 'node:crypto';

function safeEqual(a, b) {
  if (!a || !b || a.length !== b.length) return false;
  return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
}

export function isAuthorizedAdmin(req, { allowCron = false } = {}) {
  const adminSecret = process.env.ADMIN_SECRET;
  const cronSecret = process.env.CRON_SECRET;

  // Check Vercel Cron Authorization header when permitted
  if (allowCron && cronSecret) {
    const auth = req.headers.authorization || '';
    if (safeEqual(auth, `Bearer ${cronSecret}`)) return true;
  }

  // Require ADMIN_SECRET to be configured in Vercel environment variables (fail-closed)
  if (!adminSecret) return false;

  const provided = req.headers['x-admin-secret'] || '';
  return safeEqual(String(provided), adminSecret);
}
