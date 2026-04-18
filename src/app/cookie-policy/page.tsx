import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Cookie Policy | Edingrad',
  description: 'Cookie Policy for Edingrad Real Estate website and rewards program.',
}

const C = {
  bg: '#060608',
  surface: '#0F0E13',
  border: 'rgba(255,255,255,0.07)',
  borderGold: 'rgba(201,168,76,0.2)',
  text: '#EDE8DC',
  text2: '#A09890',
  text3: '#5A5450',
  gold: '#C9A84C',
}

export default function CookiePolicyPage() {
  return (
    <main style={{ minHeight: '100vh', background: C.bg, color: C.text, padding: '48px 20px' }}>
      <div style={{ maxWidth: 920, margin: '0 auto' }}>
        <div style={{ marginBottom: 28 }}>
          <Link href="/" style={{ color: C.gold, textDecoration: 'none', fontSize: 12, letterSpacing: '0.08em' }}>
            {'<-'} BACK TO HOME
          </Link>
        </div>

        <section
          style={{
            background: C.surface,
            border: `1px solid ${C.borderGold}`,
            borderRadius: 12,
            padding: '36px 28px',
            boxSizing: 'border-box',
          }}
        >
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(34px, 6vw, 46px)', margin: '0 0 8px', fontWeight: 900 }}>
            Cookie Policy
          </h1>
          <p style={{ color: C.text2, marginTop: 0, marginBottom: 24, fontSize: 13 }}>Last updated: April 18, 2026</p>

          <PolicyItem title="1. What We Use">
            We use essential cookies and local storage for session continuity, security protections, and basic site functionality.
          </PolicyItem>

          <PolicyItem title="2. Why We Use Them">
            These technologies help maintain reliable page behavior, prevent abuse, and remember consent preferences.
          </PolicyItem>

          <PolicyItem title="3. Optional Tracking">
            We currently do not rely on third-party advertising cookies for behavioral targeting. If optional analytics are introduced,
            consent controls will be updated accordingly.
          </PolicyItem>

          <PolicyItem title="4. Managing Cookies">
            You can manage cookies through browser settings. Disabling essential cookies may affect website performance and core flows.
          </PolicyItem>

          <PolicyItem title="5. Contact">
            Questions about this Cookie Policy can be sent to support@edingrad.ae.
          </PolicyItem>

          <div style={{ marginTop: 24, paddingTop: 16, borderTop: `1px solid ${C.border}`, color: C.text3, fontSize: 12 }}>
            This policy should be read together with our Privacy Policy and Terms of Use.
          </div>
        </section>
      </div>
    </main>
  )
}

function PolicyItem({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: 18 }}>
      <h2 style={{ color: C.gold, fontSize: 14, letterSpacing: '0.06em', textTransform: 'uppercase', margin: '0 0 8px' }}>{title}</h2>
      <p style={{ color: C.text2, margin: 0, lineHeight: 1.85, fontSize: 14 }}>{children}</p>
    </section>
  )
}
