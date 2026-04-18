import Link from 'next/link'

const C = {
  bg: '#060608',
  surface: '#0F0E13',
  border: 'rgba(255,255,255,0.07)',
  borderGold: 'rgba(201,168,76,0.2)',
  text: '#EDE8DC',
  text2: '#A09890',
  gold: '#C9A84C',
}

export default function NotFound() {
  return (
    <main style={{ background: C.bg, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 24px', fontFamily: "'DM Mono', monospace" }}>
      <div style={{ textAlign: 'center', maxWidth: 480 }}>

        {/* Wordmark */}
        <p style={{ margin: '0 0 40px', fontSize: 11, letterSpacing: '0.16em', color: C.gold, textTransform: 'uppercase' }}>
          Edingrad
        </p>

        {/* 404 */}
        <p style={{ margin: '0 0 8px', fontSize: 96, fontWeight: 700, color: C.surface, lineHeight: 1, fontFamily: "'Playfair Display', serif", letterSpacing: '-0.04em' }}>
          404
        </p>

        <h1 style={{ margin: '0 0 16px', fontSize: 22, fontWeight: 700, color: C.text, letterSpacing: '-0.01em', fontFamily: "'Playfair Display', serif" }}>
          Page Not Found
        </h1>

        <p style={{ margin: '0 0 40px', fontSize: 14, color: C.text2, lineHeight: 1.7 }}>
          The page you're looking for doesn't exist or has been moved. If you arrived here via a spin link, it may have expired.
        </p>

        <Link
          href="/"
          style={{
            display: 'inline-block',
            padding: '13px 32px',
            background: 'transparent',
            border: `1px solid ${C.borderGold}`,
            borderRadius: 4,
            color: C.gold,
            fontSize: 11,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            textDecoration: 'none',
            transition: 'background 0.2s, border-color 0.2s',
          }}
        >
          Back to Home
        </Link>

      </div>
    </main>
  )
}
