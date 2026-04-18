import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Privacy Policy | Edingrad',
  description: 'Privacy Policy for Edingrad Real Estate spin and rewards program.',
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

export default function PrivacyPolicyPage() {
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
            Privacy Policy
          </h1>
          <p style={{ color: C.text2, marginTop: 0, marginBottom: 24, fontSize: 13 }}>
            Last updated: April 18, 2026
          </p>

          <PolicySection title="1. Who We Are">
            This Privacy Policy explains how Edingrad Real Estate LLC and its affiliated program operators collect,
            use, and protect your personal data when you use this website and register for our spin and rewards
            program.
          </PolicySection>

          <PolicySection title="2. Information We Collect">
            We may collect your full name, email address, phone number, company or brokerage details, optional
            message notes, deal references tied to your sessions, and records of rewards or spins associated with
            your account.
          </PolicySection>

          <PolicySection title="3. Why We Use Your Information">
            We use your information to onboard you, create and manage spin sessions, communicate updates,
            process commissions and rewards, maintain compliance records, improve service quality, and prevent
            misuse or fraud.
          </PolicySection>

          <PolicySection title="4. Legal Basis and Consent">
            By submitting your information through this website, you consent to processing for legitimate
            business purposes related to brokerage collaboration, campaign operations, and support. Where
            required, we rely on contractual necessity and compliance obligations.
          </PolicySection>

          <PolicySection title="5. Sharing of Data">
            We do not sell your personal data. We may share data with trusted service providers (for example,
            hosting, database, and communication providers) and regulators or authorities when legally required.
          </PolicySection>

          <PolicySection title="6. Data Retention">
            We retain personal data only as long as needed for program operations, legal obligations, financial
            records, dispute handling, and audit requirements.
          </PolicySection>

          <PolicySection title="7. Your Rights">
            Subject to applicable law, you may request access, correction, or deletion of personal data, and you
            may object to certain processing. To make a request, contact us using the details below.
          </PolicySection>

          <PolicySection title="8. Security">
            We implement commercially reasonable technical and organizational safeguards to protect your data.
            No system is fully immune to risk, so we continuously review and improve controls.
          </PolicySection>

          <PolicySection title="9. Cross-Border Processing">
            Some service providers may process data outside your country. When this occurs, we take reasonable
            steps to ensure data is protected in line with applicable legal standards.
          </PolicySection>

          <PolicySection title="10. Cookies and Similar Technologies">
            We may use basic cookies or local storage to support website functionality, performance, and
            session continuity. You can manage browser settings to control cookie behavior.
          </PolicySection>

          <PolicySection title="11. Contact">
            For privacy questions or requests, contact us at support@edingrad.ae.
          </PolicySection>

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
            This policy is provided for transparency and general informational purposes and does not constitute
            legal advice.
          </div>
        </section>
      </div>
    </main>
  )
}

function PolicySection({ title, children }: { title: string; children: React.ReactNode }) {
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
