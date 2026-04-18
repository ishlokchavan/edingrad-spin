import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Security | Edingrad',
  description: 'Security practices for Edingrad website and rewards program.',
}

const C = {
  bg: '#060608',
  surface: '#0F0E13',
  border: 'rgba(255,255,255,0.07)',
  borderGold: 'rgba(201,168,76,0.2)',
  text: '#EDE8DC',
  text2: '#A09890',
  gold: '#C9A84C',
}

export default function SecurityPage() {
  return (
    <main style={{ minHeight: '100vh', background: C.bg, color: C.text, padding: '48px 20px' }}>
      <div style={{ maxWidth: 920, margin: '0 auto' }}>
        <div style={{ marginBottom: 28 }}>
          <Link href="/" style={{ color: C.gold, textDecoration: 'none', fontSize: 12, letterSpacing: '0.08em' }}>
            {'<-'} BACK TO HOME
          </Link>
        </div>

        <section style={{ background: C.surface, border: `1px solid ${C.borderGold}`, borderRadius: 12, padding: '36px 28px' }}>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(34px, 6vw, 46px)', margin: '0 0 8px', fontWeight: 900 }}>
            Security Practices
          </h1>
          <p style={{ color: C.text2, marginTop: 0, marginBottom: 24, fontSize: 13 }}>Last updated: April 18, 2026</p>

          <SecurityItem title="Transport Security">
            All production traffic should be served over HTTPS with strict transport security enabled.
          </SecurityItem>
          <SecurityItem title="Application Hardening">
            We apply modern browser security headers including clickjacking protections, MIME-type hardening,
            and restrictive referrer handling.
          </SecurityItem>
          <SecurityItem title="Input Handling">
            API payloads are validated and sanitized to reduce injection risks in downstream systems.
          </SecurityItem>
          <SecurityItem title="Access and Secrets">
            Sensitive credentials are managed through environment variables and are not exposed to client-side bundles.
          </SecurityItem>
          <SecurityItem title="Monitoring and Review">
            We review security posture regularly and may update controls without prior notice to respond to risks.
          </SecurityItem>
          <SecurityItem title="Report a Concern">
            If you discover a security issue, contact support@edingrad.ae with reproduction details.
          </SecurityItem>
        </section>
      </div>
    </main>
  )
}

function SecurityItem({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: 18 }}>
      <h2 style={{ color: C.gold, fontSize: 14, letterSpacing: '0.06em', textTransform: 'uppercase', margin: '0 0 8px' }}>{title}</h2>
      <p style={{ color: C.text2, margin: 0, lineHeight: 1.85, fontSize: 14 }}>{children}</p>
    </section>
  )
}
