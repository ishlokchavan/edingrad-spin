import { NextResponse } from 'next/server'
import { getNotificationRecipients, sendEmail } from '@/lib/mailer'

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
  results?: SpinResultItem[]
}

const formatCurrency = (value: number | null | undefined) =>
  new Intl.NumberFormat('en-AE', { style: 'currency', currency: 'AED', maximumFractionDigits: 0 }).format(value ?? 0)

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as SpinCompleteBody

    if (!body.token || !body.agentName || !body.results?.length) {
      return NextResponse.json({ ok: false, error: 'token, agentName and results are required' }, { status: 400 })
    }

    const totalValue = body.results.reduce((sum, item) => sum + (item.gift_value_aed ?? 0), 0)
    const spinUrl = `${process.env.NEXT_PUBLIC_APP_URL || ''}/spin/${body.token}`

    const rows = body.results
      .map(r => `<tr><td>${r.spin_number}</td><td>${r.gift_emoji} ${r.gift_name}</td><td>${formatCurrency(r.gift_value_aed)}</td></tr>`)
      .join('')

    const html = `
      <div style="font-family:Arial,sans-serif;line-height:1.5;color:#111">
        <h2>Spin Completed</h2>
        <p>The spin flow has completed for a token session.</p>
        <ul>
          <li><strong>Agent:</strong> ${body.agentName}</li>
          <li><strong>Agent Email:</strong> ${body.agentEmail || '-'}</li>
          <li><strong>Deal Reference:</strong> ${body.dealReference || '-'}</li>
          <li><strong>Token:</strong> ${body.token}</li>
          <li><strong>Spin Link:</strong> ${spinUrl}</li>
          <li><strong>Total Prize Value:</strong> ${formatCurrency(totalValue)}</li>
        </ul>
        <table style="border-collapse:collapse;width:100%;margin-top:12px">
          <thead>
            <tr>
              <th style="border:1px solid #ddd;padding:8px;text-align:left">Spin</th>
              <th style="border:1px solid #ddd;padding:8px;text-align:left">Gift</th>
              <th style="border:1px solid #ddd;padding:8px;text-align:left">Value</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    `

    const result = await sendEmail({
      to: getNotificationRecipients(),
      subject: `Spin Completed: ${body.agentName}`,
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
