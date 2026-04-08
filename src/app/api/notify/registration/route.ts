import { NextResponse } from 'next/server'
import { getNotificationRecipients, sendEmail } from '@/lib/mailer'

interface RegistrationBody {
  fullName?: string
  email?: string
  phone?: string
  agency?: string
  message?: string
  token?: string
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as RegistrationBody

    if (!body.fullName || !body.email) {
      return NextResponse.json({ ok: false, error: 'fullName and email are required' }, { status: 400 })
    }

    const spinUrl = body.token ? `${process.env.NEXT_PUBLIC_APP_URL || ''}/spin/${body.token}` : 'N/A'

    const html = `
      <div style="font-family:Arial,sans-serif;line-height:1.5;color:#111">
        <h2>New Registration</h2>
        <p>A new spin registration was submitted.</p>
        <ul>
          <li><strong>Name:</strong> ${body.fullName}</li>
          <li><strong>Email:</strong> ${body.email}</li>
          <li><strong>Phone:</strong> ${body.phone || '-'}</li>
          <li><strong>Agency:</strong> ${body.agency || '-'}</li>
          <li><strong>Message:</strong> ${body.message || '-'}</li>
        </ul>
      </div>
    `

    const result = await sendEmail({
      to: getNotificationRecipients(),
      subject: `New Registration: ${body.fullName}`,
      html,
    })

    if (!result.ok && !result.skipped) {
      return NextResponse.json({ ok: false, error: result.error }, { status: 500 })
    }

    return NextResponse.json({ ok: true, skipped: result.skipped ?? false, info: result.error ?? null })
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error.message || 'Failed to process notification' }, { status: 500 })
  }
}
