import { NextResponse } from 'next/server'
import { getNotificationRecipients, sendEmail } from '@/lib/mailer'
import { checkRateLimit, getClientIp } from '@/lib/rateLimit'

// 5 submissions per IP per 15 minutes
const RATE_LIMIT = { limit: 5, windowMs: 15 * 60 * 1000 }

interface RegistrationBody {
  fullName?: string
  email?: string
  phone?: string
  agency?: string
  message?: string
}

const MAX_FIELD = 500

function cleanText(value: unknown, max = MAX_FIELD) {
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

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export async function POST(req: Request) {
  const ip = getClientIp(req)
  const rl = checkRateLimit(`reg:${ip}`, RATE_LIMIT)
  if (!rl.allowed) {
    return NextResponse.json({ ok: false, error: 'Too many requests. Please try again later.' }, { status: 429 })
  }

  try {
    const body = (await req.json()) as RegistrationBody
    const fullName = cleanText(body.fullName, 120)
    const email = cleanText(body.email, 160)
    const phone = cleanText(body.phone, 60)
    const agency = cleanText(body.agency, 160)
    const message = cleanText(body.message, 1000)

    if (!fullName || !email) {
      return NextResponse.json({ ok: false, error: 'fullName and email are required' }, { status: 400 })
    }
    if (!isValidEmail(email)) {
      return NextResponse.json({ ok: false, error: 'Invalid email format' }, { status: 400 })
    }

    const submittedAt = new Date().toISOString()
    const appUrl = (process.env.NEXT_PUBLIC_APP_URL || '').replace(/\/$/, '')

    const html = `
      <div style="margin:0;background:#f6f7f9;padding:24px;font-family:Arial,sans-serif;color:#0f172a;line-height:1.6;">
        <div style="max-width:640px;margin:0 auto;background:#ffffff;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;">
          <div style="background:#0f172a;padding:18px 22px;">
            <h2 style="margin:0;color:#ffffff;font-size:20px;">New Agent Registration</h2>
          </div>

          <div style="padding:20px 22px;">
            <p style="margin:0 0 14px 0;color:#334155;">
              A new agent has submitted a registration request from the landing page.
            </p>

            <table style="width:100%;border-collapse:collapse;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;">
              <tbody>
                <tr>
                  <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;background:#f8fafc;width:36%;font-weight:700;">Full Name</td>
                  <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;">${escapeHtml(fullName)}</td>
                </tr>
                <tr>
                  <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;background:#f8fafc;font-weight:700;">Email</td>
                  <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;">${escapeHtml(email)}</td>
                </tr>
                <tr>
                  <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;background:#f8fafc;font-weight:700;">Phone</td>
                  <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;">${escapeHtml(phone || '-')}</td>
                </tr>
                <tr>
                  <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;background:#f8fafc;font-weight:700;">Agency</td>
                  <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;">${escapeHtml(agency || '-')}</td>
                </tr>
                <tr>
                  <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;background:#f8fafc;font-weight:700;">Message</td>
                  <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;">${escapeHtml(message || '-')}</td>
                </tr>
                <tr>
                  <td style="padding:10px 12px;background:#f8fafc;font-weight:700;">Submitted (UTC)</td>
                  <td style="padding:10px 12px;">${escapeHtml(submittedAt)}</td>
                </tr>
              </tbody>
            </table>

            <p style="margin:14px 0 0 0;color:#64748b;font-size:12px;">This is an automated notification from Edingrad Registration.</p>
          </div>
        </div>
      </div>
    `

    const welcomeHtml = `
      <div style="margin:0;background:#f6f7f9;padding:24px;font-family:Arial,sans-serif;color:#0f172a;line-height:1.6;">
        <div style="max-width:640px;margin:0 auto;background:#ffffff;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;">
          <div style="background:#0f172a;padding:18px 22px;">
            <h2 style="margin:0;color:#ffffff;font-size:20px;">Welcome to Edingrad</h2>
          </div>

          <div style="padding:20px 22px;">
            <p style="margin:0 0 12px 0;color:#334155;">Hi ${escapeHtml(fullName)},</p>
            <p style="margin:0 0 12px 0;color:#334155;">
              Thank you for registering your interest. Your details have been received successfully.
            </p>
            <p style="margin:0 0 12px 0;color:#334155;">
              Our team will review your application and contact you shortly with next steps.
            </p>
            <p style="margin:0 0 12px 0;color:#334155;">
              If you need immediate assistance, reply to this email or contact us at support@edingrad.ae.
            </p>
            ${appUrl ? `<p style="margin:0;color:#64748b;font-size:12px;">Website: <a href="${escapeHtml(appUrl)}" style="color:#0f172a;">${escapeHtml(appUrl)}</a></p>` : ''}
          </div>
        </div>
      </div>
    `

    const adminResult = await sendEmail({
      to: getNotificationRecipients(),
      subject: `New Agent Registration: ${fullName}`,
      html,
    })

    if (!adminResult.ok && !adminResult.skipped) {
      return NextResponse.json({ ok: false, error: adminResult.error }, { status: 500 })
    }

    const welcomeResult = await sendEmail({
      to: [email],
      subject: 'Welcome to Edingrad - Registration Received',
      html: welcomeHtml,
    })

    return NextResponse.json({
      ok: true,
      skipped: adminResult.skipped ?? false,
      info: adminResult.error ?? null,
      welcomeSent: welcomeResult.ok,
      welcomeInfo: welcomeResult.error ?? null,
    })
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error.message || 'Failed to process notification' }, { status: 500 })
  }
}
