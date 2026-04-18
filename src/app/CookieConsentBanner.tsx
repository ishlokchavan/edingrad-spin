'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

const STORAGE_KEY = 'edingrad-cookie-consent'

const C = {
  surface: '#0F0E13',
  border: 'rgba(201,168,76,0.2)',
  text: '#EDE8DC',
  text2: '#A09890',
  gold: '#C9A84C',
}

export default function CookieConsentBanner() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (!saved) setVisible(true)
  }, [])

  function saveConsent(value: 'accepted' | 'rejected') {
    localStorage.setItem(STORAGE_KEY, value)
    localStorage.setItem(`${STORAGE_KEY}-at`, new Date().toISOString())
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div
      role="dialog"
      aria-live="polite"
      aria-label="Cookie consent"
      style={{
        position: 'fixed',
        left: 16,
        right: 16,
        bottom: 16,
        zIndex: 5000,
        background: C.surface,
        border: `1px solid ${C.border}`,
        borderRadius: 10,
        padding: 16,
        boxShadow: '0 12px 32px rgba(0,0,0,0.35)',
      }}
    >
      <div style={{ maxWidth: 900, margin: '0 auto', display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
        <p style={{ margin: 0, color: C.text2, fontSize: 13, lineHeight: 1.7, flex: '1 1 420px' }}>
          We use essential cookies and local storage to keep the site secure and functional. See our{' '}
          <Link href="/cookie-policy" style={{ color: C.gold, textDecoration: 'none' }}>
            Cookie Policy
          </Link>{' '}
          for details.
        </p>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => saveConsent('rejected')}
            style={{
              background: 'transparent',
              color: C.text,
              border: `1px solid ${C.border}`,
              padding: '10px 14px',
              cursor: 'pointer',
              fontSize: 12,
              letterSpacing: '0.08em',
              fontFamily: "'DM Mono', monospace",
            }}
          >
            REJECT OPTIONAL
          </button>
          <button
            type="button"
            onClick={() => saveConsent('accepted')}
            style={{
              background: C.gold,
              color: '#000',
              border: 'none',
              padding: '10px 14px',
              cursor: 'pointer',
              fontSize: 12,
              letterSpacing: '0.08em',
              fontWeight: 700,
              fontFamily: "'DM Mono', monospace",
            }}
          >
            ACCEPT
          </button>
        </div>
      </div>
    </div>
  )
}
