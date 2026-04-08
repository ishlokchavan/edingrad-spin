export interface EmailPayload {
  to: string[]
  subject: string
  html: string
}

function getRecipients(): string[] {
  const raw = process.env.NOTIFY_TO_EMAILS || ''
  return raw
    .split(',')
    .map(v => v.trim())
    .filter(Boolean)
}

export function getNotificationRecipients(): string[] {
  return getRecipients()
}

export async function sendEmail(payload: EmailPayload): Promise<{ ok: boolean; skipped?: boolean; error?: string }> {
  const apiKey = process.env.RESEND_API_KEY
  const from = process.env.MAIL_FROM || 'Edingrad Spin <no-reply@updates.edingrad.com>'

  if (!apiKey) {
    return { ok: false, skipped: true, error: 'RESEND_API_KEY is not configured' }
  }

  if (!payload.to.length) {
    return { ok: false, skipped: true, error: 'No recipients configured in NOTIFY_TO_EMAILS' }
  }

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to: payload.to,
      subject: payload.subject,
      html: payload.html,
    }),
  })

  if (!res.ok) {
    const details = await res.text()
    return { ok: false, error: `Mailer request failed (${res.status}): ${details}` }
  }

  return { ok: true }
}
