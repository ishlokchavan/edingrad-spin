import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Terms of Use | Edingrad',
  description: 'Terms of Use for Edingrad Real Estate spin and rewards program.',
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

export default function TermsPage() {
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
          <h1
            style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: 'clamp(34px, 6vw, 46px)',
              margin: '0 0 8px',
              fontWeight: 900,
              lineHeight: 1.1,
            }}
          >
            Terms of Use
          </h1>
          <p style={{ color: C.text2, marginTop: 0, marginBottom: 24, fontSize: 13 }}>
            Last updated: April 18, 2026
          </p>

          <TermsSection title="1. Acceptance of Terms">
            By accessing this website and using the Edingrad spin and rewards program, you agree to these Terms
            of Use and all applicable laws and regulations.
          </TermsSection>

          <TermsSection title="2. Program Nature">
            This program is intended for independent, deal-originating real estate professionals. Participation does
            not create an employment relationship and does not guarantee leads, fixed salary, or minimum earnings.
          </TermsSection>

          <TermsSection title="3. Eligibility and Verification">
            We may require onboarding checks, identity verification, and deal documentation before recognizing
            participation, awarding spins, or releasing commissions and benefits.
          </TermsSection>

          <TermsSection title="4. Commission and Reward Mechanics">
            Commission percentages, eligibility, spin allocation rules, and reward availability may depend on
            deal status, slab qualification, and internal validation. Rewards are subject to stock, campaign terms,
            and operational constraints.
          </TermsSection>

          <TermsSection title="5. Fair Use and Integrity">
            Any attempt to manipulate submissions, sessions, referrals, deals, or reward systems may result in
            suspension, disqualification, or permanent removal from the program.
          </TermsSection>

          <TermsSection title="6. Platform Availability">
            We strive for reliability but do not guarantee uninterrupted service. Features may be updated,
            suspended, or changed without prior notice when required for maintenance, compliance, or security.
          </TermsSection>

          <TermsSection title="7. Intellectual Property">
            All branding, visuals, copy, platform logic, and related materials are owned by Edingrad or relevant
            licensors and may not be reused without prior written permission.
          </TermsSection>

          <TermsSection title="8. Limitation of Liability">
            To the maximum extent allowed by law, Edingrad is not liable for indirect, incidental, or consequential
            loss arising from use of this site or program participation.
          </TermsSection>

          <TermsSection title="9. Governing Law">
            These terms are governed by the laws and regulations applicable in the Emirate of Dubai and the
            United Arab Emirates, unless otherwise required by mandatory law.
          </TermsSection>

          <TermsSection title="10. Contact">
            Questions regarding these terms can be sent to support@edingrad.ae.
          </TermsSection>

          <div
            style={{
              marginTop: 26,
              paddingTop: 16,
              borderTop: `1px solid ${C.border}`,
              color: C.text3,
              fontSize: 12,
              lineHeight: 1.7,
            }}
          >
            These terms are a general framework and may be supplemented by formal onboarding documents,
            campaign-specific notices, and signed agreements.
          </div>
        </section>
      </div>
    </main>
  )
}

function TermsSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: 20 }}>
      <h2
        style={{
          color: C.gold,
          fontSize: 14,
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          margin: '0 0 8px',
        }}
      >
        {title}
      </h2>
      <p style={{ color: C.text2, margin: 0, lineHeight: 1.9, fontSize: 14 }}>{children}</p>
    </section>
  )
}
