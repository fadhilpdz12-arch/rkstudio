// Keep-alive harian: Vercel Cron panggil fungsi ni sekali sehari supaya
// projek Supabase (plan percuma) tak di-pause kerana "tiada aktiviti".
// Ia hanya membaca slot terisi hari ini (tiada nama/telefon) — tiada data diubah.

const SB_URL = process.env.VITE_SUPABASE_URL || 'https://jszfyvquexewkqrcpbfn.supabase.co';
const SB_KEY = process.env.VITE_SUPABASE_KEY || 'sb_publishable_cco9Z4dGRbbRQBn4yO0KWA_lffHEYxZ';

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Robots-Tag', 'noindex');

  // Jika CRON_SECRET diset di Vercel, hanya Vercel Cron (yang hantar secret tu) boleh panggil.
  const secret = process.env.CRON_SECRET;
  if (secret && req.headers.authorization !== `Bearer ${secret}`) {
    res.status(401).json({ ok: false });
    return;
  }

  const today = new Date(Date.now() + 8 * 3600e3).toISOString().slice(0, 10); // tarikh Malaysia
  try {
    const r = await fetch(`${SB_URL}/rest/v1/rpc/get_busy`, {
      method: 'POST',
      headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ p_date: today }),
      signal: AbortSignal.timeout(10000),
    });
    res.status(r.ok ? 200 : 502).json({ ok: r.ok, status: r.status, at: new Date().toISOString() });
  } catch (e) {
    res.status(502).json({ ok: false, error: 'unreachable' });
  }
}
