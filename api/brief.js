// Vercel function: receives the brief from the site and forwards it to FormSubmit server-side,
// so browser ad blockers and CORS can't stop it and the inbox address never ships to the page.
const INBOX = process.env.BRIEF_INBOX || 'ahmad.saeed0897@gmail.com';
const FIELDS = ['name', 'email', 'contact', 'brand', 'need', 'stage', 'budget', 'notes', 'page'];

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ success: false, message: 'Method not allowed' });

  let body = req.body || {};
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch { body = {}; } }
  if (body._honey) return res.status(200).json({ success: true });

  const name = String(body.name || '').trim().slice(0, 200);
  const email = String(body.email || '').trim().slice(0, 200);
  if (!name) return res.status(400).json({ success: false, message: 'Please add your name.' });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ success: false, message: 'Please add a valid email.' });
  if (body.consent !== 'yes') return res.status(400).json({ success: false, message: 'Please tick the consent box.' });

  // FormSubmit uses the "email" field as reply-to, so replying in the inbox goes straight to the sender.
  const payload = { _subject: `New brief from ${name}`, _template: 'table', _captcha: 'false' };
  for (const k of FIELDS) payload[k] = String(body[k] || '').trim().slice(0, 4000);
  payload.contact = payload.contact || 'Not given';
  payload.consent = 'Agreed to be contacted about this brief';

  const site = `https://${req.headers['x-forwarded-host'] || req.headers.host}`;
  try {
    const r = await fetch(`https://formsubmit.co/ajax/${INBOX}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json', Origin: site, Referer: `${site}/contact/` },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(15000),
    });
    const data = await r.json().catch(() => ({}));
    const ok = r.ok && String(data.success) === 'true';
    if (!ok) console.error('FormSubmit rejected brief', r.status, data);
    return res.status(ok ? 200 : 502).json({ success: ok, message: data.message || (ok ? '' : 'The mail service did not accept the brief.') });
  } catch (e) {
    console.error('FormSubmit unreachable', e);
    return res.status(502).json({ success: false, message: 'We could not reach the mail service. Please try again in a minute.' });
  }
}
