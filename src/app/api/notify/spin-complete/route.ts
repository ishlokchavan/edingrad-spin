import { NextResponse } from 'next/server'
import { getNotificationRecipients, sendEmail } from '@/lib/mailer'
import { checkRateLimit, getClientIp } from '@/lib/rateLimit'

// 20 spin completions per IP per 10 minutes (generous for legitimate use)
const RATE_LIMIT = { limit: 20, windowMs: 10 * 60 * 1000 }

interface SpinResultItem {
  spin_number: number
  gift_name: string
  gift_emoji: string
  gift_value_aed: number | null
}

interface SpinCompleteBody {
  token?: string
  agentName?: string
  agentEmail?: string
  dealReference?: string
  dealId?: string
  results?: SpinResultItem[]
}

function cleanText(value: unknown, max = 200) {
  if (typeof value !== 'string') return ''
  return value.trim().slice(0, max)
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

const formatCurrency = (value: number | null | undefined) =>
  new Intl.NumberFormat('en-AE', { style: 'currency', currency: 'AED', maximumFractionDigits: 0 }).format(value ?? 0)

// ─── Email builders ───────────────────────────────────────────────────────────

function buildAdminHtml(opts: {
  agentName: string
  agentEmail: string
  dealRefText: string
  token: string
  spinUrl: string
  totalValue: number
  results: SpinResultItem[]
}) {
  const { agentName, agentEmail, dealRefText, token, spinUrl, totalValue, results } = opts

  const rows = results
    .map(r => {
      const spinNumber = Number.isFinite(r.spin_number) ? r.spin_number : 0
      const giftName = escapeHtml(cleanText(r.gift_name, 120))
      const giftEmoji = escapeHtml(cleanText(r.gift_emoji, 12))
      const isHighValue = (r.gift_value_aed ?? 0) >= 100_000
      return `
        <tr>
          <td style="padding:12px 16px;border-bottom:1px solid #2a2a2a;color:#a0a0a0;font-size:13px">${spinNumber}</td>
          <td style="padding:12px 16px;border-bottom:1px solid #2a2a2a;color:#e8e8e8;font-size:14px">${giftEmoji}&nbsp;&nbsp;${giftName}</td>
          <td style="padding:12px 16px;border-bottom:1px solid #2a2a2a;font-size:13px;font-weight:600;color:${isHighValue ? '#c9a84c' : '#e8e8e8'}">${formatCurrency(r.gift_value_aed)}</td>
        </tr>`
    })
    .join('')

  const metaRow = (label: string, value: string, isLink = false) => `
    <tr>
      <td style="padding:9px 16px;border-bottom:1px solid #1e1e1e;color:#888;font-size:12px;white-space:nowrap;width:140px">${label}</td>
      <td style="padding:9px 16px;border-bottom:1px solid #1e1e1e;color:#d0d0d0;font-size:13px">${isLink ? `<a href="${escapeHtml(value)}" style="color:#c9a84c;text-decoration:none">${escapeHtml(value)}</a>` : escapeHtml(value)}</td>
    </tr>`

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0d0d0d;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0d0d0d;padding:40px 0">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%">

        <!-- Header -->
        <tr><td style="background:#141414;border-top:3px solid #c9a84c;border-radius:8px 8px 0 0;padding:28px 32px">
          <p style="margin:0;font-size:11px;letter-spacing:0.12em;color:#c9a84c;text-transform:uppercase">Edingrad</p>
          <h1 style="margin:8px 0 0;font-size:22px;font-weight:700;color:#ffffff;letter-spacing:-0.01em">Spin Session Completed</h1>
          <p style="margin:6px 0 0;font-size:13px;color:#888">${new Date().toUTCString()}</p>
        </td></tr>

        <!-- Prize Value Banner -->
        <tr><td style="background:#1a1600;border-left:1px solid #2a2200;border-right:1px solid #2a2200;padding:20px 32px">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td>
                <p style="margin:0;font-size:11px;letter-spacing:0.1em;text-transform:uppercase;color:#8a7030">Total Prize Value</p>
                <p style="margin:4px 0 0;font-size:28px;font-weight:700;color:#c9a84c;letter-spacing:-0.02em">${formatCurrency(totalValue)}</p>
              </td>
              <td align="right">
                <p style="margin:0;font-size:11px;letter-spacing:0.1em;text-transform:uppercase;color:#8a7030">Spins</p>
                <p style="margin:4px 0 0;font-size:28px;font-weight:700;color:#c9a84c">${results.length}</p>
              </td>
            </tr>
          </table>
        </td></tr>

        <!-- Session Details -->
        <tr><td style="background:#141414;border-left:1px solid #222;border-right:1px solid #222;padding:4px 0">
          <table width="100%" cellpadding="0" cellspacing="0">
            ${metaRow('Agent', agentName)}
            ${metaRow('Agent Email', agentEmail || '—')}
            ${metaRow('Deal Reference', dealRefText)}
            ${metaRow('Token', token)}
            ${metaRow('Spin Link', spinUrl, true)}
          </table>
        </td></tr>

        <!-- Results Table -->
        <tr><td style="background:#141414;border-left:1px solid #222;border-right:1px solid #222;padding:0">
          <table width="100%" cellpadding="0" cellspacing="0">
            <thead>
              <tr style="background:#1a1a1a">
                <th style="padding:10px 16px;text-align:left;font-size:11px;letter-spacing:0.08em;color:#888;text-transform:uppercase;font-weight:600">Spin</th>
                <th style="padding:10px 16px;text-align:left;font-size:11px;letter-spacing:0.08em;color:#888;text-transform:uppercase;font-weight:600">Gift</th>
                <th style="padding:10px 16px;text-align:left;font-size:11px;letter-spacing:0.08em;color:#888;text-transform:uppercase;font-weight:600">Value</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
        </td></tr>

        <!-- Footer -->
        <tr><td style="background:#0f0f0f;border:1px solid #1e1e1e;border-radius:0 0 8px 8px;padding:20px 32px;text-align:center">
          <p style="margin:0;font-size:11px;color:#444;letter-spacing:0.06em">EDINGRAD &middot; INTERNAL NOTIFICATION &middot; DO NOT REPLY</p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`
}

function buildAgentHtml(opts: {
  agentName: string
  dealRefText: string
  totalValue: number
  results: SpinResultItem[]
  appUrl: string
}) {
  const { agentName, dealRefText, totalValue, results, appUrl } = opts
  const firstName = escapeHtml(agentName.split(' ')[0] || agentName)

  const prizeRows = results
    .map(r => {
      const giftName = escapeHtml(cleanText(r.gift_name, 120))
      const giftEmoji = escapeHtml(cleanText(r.gift_emoji, 12))
      const hasValue = (r.gift_value_aed ?? 0) > 0
      return `
        <tr>
          <td style="padding:14px 20px;border-bottom:1px solid #2a2a2a">
            <span style="font-size:20px">${giftEmoji}</span>
          </td>
          <td style="padding:14px 20px;border-bottom:1px solid #2a2a2a;color:#e8e8e8;font-size:15px;font-weight:500">${giftName}</td>
          <td style="padding:14px 20px;border-bottom:1px solid #2a2a2a;text-align:right;font-size:13px;font-weight:700;color:${hasValue ? '#c9a84c' : '#555'}">${hasValue ? formatCurrency(r.gift_value_aed) : '—'}</td>
        </tr>`
    })
    .join('')

  const websiteLink = appUrl ? `<a href="${escapeHtml(appUrl)}" style="color:#c9a84c;text-decoration:none">${escapeHtml(appUrl)}</a>` : ''

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0d0d0d;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0d0d0d;padding:40px 0">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%">

        <!-- Header -->
        <tr><td style="background:#141414;border-top:3px solid #c9a84c;border-radius:8px 8px 0 0;padding:36px 32px 28px">
          <p style="margin:0;font-size:11px;letter-spacing:0.12em;color:#c9a84c;text-transform:uppercase">Edingrad</p>
          <h1 style="margin:10px 0 0;font-size:26px;font-weight:700;color:#ffffff;letter-spacing:-0.01em">Congratulations, ${firstName}.</h1>
          <p style="margin:10px 0 0;font-size:15px;color:#888;line-height:1.6">Your spin session for deal <strong style="color:#c0c0c0">${escapeHtml(dealRefText)}</strong> has been completed. Here's a summary of the rewards you've earned.</p>
        </td></tr>

        <!-- Total Value Card -->
        <tr><td style="background:linear-gradient(135deg,#1a1500,#201a00);border-left:1px solid #2a2200;border-right:1px solid #2a2200;padding:24px 32px;text-align:center">
          <p style="margin:0;font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:#8a7030">Total Value Earned</p>
          <p style="margin:8px 0 0;font-size:36px;font-weight:700;color:#c9a84c;letter-spacing:-0.02em">${formatCurrency(totalValue)}</p>
        </td></tr>

        <!-- Prize Table -->
        <tr><td style="background:#141414;border-left:1px solid #222;border-right:1px solid #222;padding:0">
          <table width="100%" cellpadding="0" cellspacing="0">
            <thead>
              <tr style="background:#1a1a1a">
                <th style="padding:10px 20px;text-align:left;font-size:11px;letter-spacing:0.08em;color:#666;text-transform:uppercase;font-weight:600" colspan="2">Your Rewards</th>
                <th style="padding:10px 20px;text-align:right;font-size:11px;letter-spacing:0.08em;color:#666;text-transform:uppercase;font-weight:600">Value</th>
              </tr>
            </thead>
            <tbody>${prizeRows}</tbody>
          </table>
        </td></tr>

        <!-- Next Steps -->
        <tr><td style="background:#111;border-left:1px solid #222;border-right:1px solid #222;padding:24px 32px">
          <p style="margin:0 0 12px;font-size:11px;letter-spacing:0.1em;text-transform:uppercase;color:#666">What Happens Next</p>
          <p style="margin:0;font-size:14px;color:#a0a0a0;line-height:1.7">Our team will be in touch shortly to arrange the fulfilment of your rewards. If you have any questions in the meantime, please don't hesitate to reach out — we're here to help.</p>
        </td></tr>

        <!-- Footer -->
        <tr><td style="background:#0f0f0f;border:1px solid #1e1e1e;border-radius:0 0 8px 8px;padding:24px 32px;text-align:center">
          <p style="margin:0 0 4px;font-size:13px;color:#c9a84c;letter-spacing:0.06em;font-weight:600">EDINGRAD</p>
          <p style="margin:0;font-size:12px;color:#444">${websiteLink}</p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`
}

// ─── Route handler ────────────────────────────────────────────────────────────

export async function POST(req: Request) {
  const ip = getClientIp(req)
  const rl = checkRateLimit(`spin:${ip}`, RATE_LIMIT)
  if (!rl.allowed) {
    return NextResponse.json({ ok: false, error: 'Too many requests. Please try again later.' }, { status: 429 })
  }

  try {
    const body = (await req.json()) as SpinCompleteBody
    const token = cleanText(body.token, 80)
    const agentName = cleanText(body.agentName, 160)
    const agentEmail = cleanText(body.agentEmail, 160)
    const dealReference = cleanText(body.dealReference, 120)
    const dealId = cleanText(body.dealId, 120)
    const results = Array.isArray(body.results) ? body.results.slice(0, 20) : []

    if (!token || !agentName || !results.length) {
      return NextResponse.json({ ok: false, error: 'token, agentName and results are required' }, { status: 400 })
    }

    const totalValue = results.reduce((sum, item) => sum + (item.gift_value_aed ?? 0), 0)
    const requestOrigin = new URL(req.url).origin
    const appUrl = (process.env.NEXT_PUBLIC_APP_URL || requestOrigin).replace(/\/$/, '')
    const spinUrl = `${appUrl}/spin/${encodeURIComponent(token)}`
    const dealRefText = dealReference || dealId || '-'

    // ── Admin notification ────────────────────────────────────────────────────
    const adminResult = await sendEmail({
      to: getNotificationRecipients(),
      subject: `Spin Completed — ${agentName} · ${dealRefText}`,
      html: buildAdminHtml({ agentName, agentEmail, dealRefText, token, spinUrl, totalValue, results }),
    })

    // ── Agent congratulations email ───────────────────────────────────────────
    let agentResult: { ok: boolean; skipped?: boolean; error?: string } = { ok: false, skipped: true, error: 'No valid agent email' }
    if (agentEmail && isValidEmail(agentEmail)) {
      agentResult = await sendEmail({
        to: [agentEmail],
        subject: `Your Edingrad Rewards — ${dealRefText}`,
        html: buildAgentHtml({ agentName, dealRefText, totalValue, results, appUrl }),
      })
    }

    if (!adminResult.ok && !adminResult.skipped) {
      return NextResponse.json({ ok: false, error: adminResult.error }, { status: 500 })
    }

    return NextResponse.json({
      ok: true,
      skipped: adminResult.skipped ?? false,
      agentEmailSent: agentResult.ok,
      agentEmailInfo: agentResult.error ?? null,
    })
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error.message || 'Failed to process notification' }, { status: 500 })
  }
}
