// Vercel function: receives a brief from the site and emails it to the team over Gmail SMTP.
// Required env vars (Vercel > Settings > Environment Variables):
//   SMTP_USER  the Gmail address that sends the email
//   SMTP_PASS  a Google App Password for that account (not the normal password)
// Optional:
//   BRIEF_TO   comma-separated recipients (defaults below)
import nodemailer from 'nodemailer';

const TO = process.env.BRIEF_TO || 'ali.raza2422@gmail.com, ahmad.saeed0897@gmail.com';
const FIELDS = [
  ['name', 'Name'],
  ['email', 'Email'],
  ['contact', 'WhatsApp'],
  ['brand', 'Brand or website'],
  ['need', 'Needs help with'],
  ['stage', 'Where they are'],
  ['budget', 'Monthly ad budget'],
  ['notes', 'Notes'],
  ['page', 'Sent from'],
];

const esc = (s) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ success: false, message: 'Method not allowed' });

  let body = req.body || {};
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch { body = {}; } }
  if (body._honey) return res.status(200).json({ success: true });

  const data = {};
  for (const [k] of FIELDS) data[k] = String(body[k] || '').trim().slice(0, 4000);
  if (!data.name) return res.status(400).json({ success: false, message: 'Please add your name.' });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) return res.status(400).json({ success: false, message: 'Please add a valid email.' });
  if (body.consent !== 'yes') return res.status(400).json({ success: false, message: 'Please tick the consent box.' });

  const { SMTP_USER, SMTP_PASS } = process.env;
  if (!SMTP_USER || !SMTP_PASS) {
    console.error('Brief not sent: SMTP_USER / SMTP_PASS env vars are missing');
    return res.status(500).json({ success: false, message: 'The form is not set up yet. Please try again later.' });
  }

  const rows = FIELDS.filter(([k]) => data[k]);
  const text = rows.map(([k, label]) => `${label}: ${data[k]}`).join('\n') + '\n\nConsent: agreed to be contacted about this brief.';
  const html = `<h2 style="font-family:Arial,sans-serif;margin:0 0 12px">New brief from ${esc(data.name)}</h2>
<table cellpadding="8" style="border-collapse:collapse;font-family:Arial,sans-serif;font-size:14px">
${rows.map(([k, label]) => `<tr><td style="border:1px solid #ddd;background:#f5f5f5;font-weight:bold;vertical-align:top">${label}</td><td style="border:1px solid #ddd;white-space:pre-wrap">${esc(data[k])}</td></tr>`).join('\n')}
<tr><td style="border:1px solid #ddd;background:#f5f5f5;font-weight:bold">Consent</td><td style="border:1px solid #ddd">Agreed to be contacted about this brief</td></tr>
</table>
<p style="font-family:Arial,sans-serif;font-size:13px;color:#666">Reply to this email to answer ${esc(data.name)} directly.</p>`;

  try {
    const transport = nodemailer.createTransport({ service: 'gmail', auth: { user: SMTP_USER, pass: SMTP_PASS } });
    await transport.sendMail({
      from: { name: 'The Growth Lab website', address: SMTP_USER },
      to: TO,
      replyTo: { name: data.name, address: data.email },
      subject: `New brief from ${data.name}${data.brand ? ` (${data.brand})` : ''}`,
      text,
      html,
    });
    return res.status(200).json({ success: true });
  } catch (e) {
    console.error('Brief not sent: SMTP error', e);
    return res.status(502).json({ success: false, message: 'We could not send your brief right now. Please try again in a moment.' });
  }
}
