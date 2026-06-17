import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  host:       process.env.SMTP_HOST ?? '10.10.20.102',
  port:       parseInt(process.env.SMTP_PORT ?? '6000', 10),
  secure:     false,   // no TLS/SSL
  ignoreTLS:  true,    // no STARTTLS either
  auth:       undefined,
})

interface ContactMailOptions {
  fromName:    string
  fromEmail:   string
  subject:     string
  body:        string
  ip?:         string
}

export async function sendContactMail(opts: ContactMailOptions): Promise<void> {
  const to      = process.env.CONTACT_TO_EMAIL
  const from    = process.env.SMTP_FROM ?? 'portfolio@localhost'

  if (!to) {
    console.warn('[mailer] CONTACT_TO_EMAIL not set — skipping email')
    return
  }

  await transporter.sendMail({
    from:    `"Portfolio Contact" <${from}>`,
    to,
    replyTo: `"${opts.fromName}" <${opts.fromEmail}>`,
    subject: `[Contact] ${opts.subject}`,
    text:    buildText(opts),
    html:    buildHtml(opts),
  })
}

function buildText({ fromName, fromEmail, subject, body, ip }: ContactMailOptions) {
  return [
    `From:    ${fromName} <${fromEmail}>`,
    `Subject: ${subject}`,
    ip ? `IP:      ${ip}` : '',
    '',
    body,
  ].filter((l) => l !== undefined).join('\n')
}

function buildHtml({ fromName, fromEmail, subject, body, ip }: ContactMailOptions) {
  const escaped = (s: string) =>
    s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br>')

  return `
<!DOCTYPE html>
<html>
<body style="font-family:sans-serif;max-width:600px;margin:auto;padding:24px;color:#1a1a1a">
  <h2 style="color:#6366f1;border-bottom:2px solid #e5e7eb;padding-bottom:8px">New Contact Message</h2>
  <table style="width:100%;border-collapse:collapse;margin-bottom:16px">
    <tr><td style="padding:6px 0;color:#6b7280;width:80px">From</td>
        <td style="padding:6px 0"><strong>${escaped(fromName)}</strong> &lt;${escaped(fromEmail)}&gt;</td></tr>
    <tr><td style="padding:6px 0;color:#6b7280">Subject</td>
        <td style="padding:6px 0">${escaped(subject)}</td></tr>
    ${ip ? `<tr><td style="padding:6px 0;color:#6b7280">IP</td><td style="padding:6px 0;font-size:12px;color:#9ca3af">${escaped(ip)}</td></tr>` : ''}
  </table>
  <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:16px;line-height:1.6">
    ${escaped(body)}
  </div>
  <p style="font-size:11px;color:#9ca3af;margin-top:16px">Sent via portfolio contact form</p>
</body>
</html>`
}
