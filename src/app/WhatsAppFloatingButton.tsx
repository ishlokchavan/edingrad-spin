'use client'

const C = {
  whatsapp: '#25D366',
  whatsappDark: '#1fb85a',
  whatsappBorder: 'rgba(255,255,255,0.24)',
  text: '#ffffff',
}

function toWhatsAppDigits(input: string) {
  return input.replace(/\D/g, '')
}

export default function WhatsAppFloatingButton() {
  const raw = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || ''
  const digits = toWhatsAppDigits(raw)

  if (!digits) return null

  const text = encodeURIComponent('Hi Edingrad team, I have a question about the agent program.')
  const href = `https://wa.me/${digits}?text=${text}`

  return (
    <>
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat on WhatsApp"
        title="Chat on WhatsApp"
        className="wa-float"
        style={{
          position: 'fixed',
          right: 18,
          bottom: 90,
          zIndex: 4500,
          display: 'inline-flex',
          alignItems: 'center',
          gap: 10,
          textDecoration: 'none',
          background: C.whatsapp,
          color: C.text,
          borderRadius: 999,
          padding: '12px 16px',
          boxShadow: '0 10px 24px rgba(0,0,0,0.35)',
          border: `1px solid ${C.whatsappBorder}`,
          fontFamily: "'DM Mono', monospace",
          fontSize: 12,
          letterSpacing: '0.04em',
          transition: 'transform 0.2s ease, background 0.2s ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-2px)'
          e.currentTarget.style.background = C.whatsappDark
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)'
          e.currentTarget.style.background = C.whatsapp
        }}
      >
        <span aria-hidden="true" style={{ lineHeight: 0, display: 'inline-flex' }}>
          <svg width="20" height="20" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="16" cy="16" r="16" fill="white" fillOpacity="0.2" />
            <path
              d="M16 5.33c-5.89 0-10.67 4.65-10.67 10.39 0 1.83.5 3.62 1.45 5.19L5 27l6.29-1.64a10.85 10.85 0 0 0 4.71 1.08c5.9 0 10.67-4.65 10.67-10.4 0-5.73-4.77-10.38-10.67-10.38Zm0 19.03c-1.46 0-2.88-.38-4.12-1.1l-.29-.17-3.73.98 1-3.59-.2-.29a8.22 8.22 0 0 1-1.26-4.46c0-4.6 3.84-8.34 8.6-8.34 4.74 0 8.6 3.74 8.6 8.34 0 4.61-3.86 8.35-8.6 8.35Zm4.72-6.24c-.26-.13-1.56-.76-1.8-.84-.24-.09-.42-.13-.6.13-.17.25-.68.84-.82 1.01-.16.17-.3.2-.56.07-.26-.12-1.08-.39-2.06-1.24-.76-.66-1.28-1.47-1.44-1.72-.16-.25-.02-.39.12-.51.12-.12.26-.3.4-.45.13-.15.17-.25.26-.42.08-.17.04-.32-.02-.45-.07-.13-.6-1.44-.82-1.97-.22-.53-.43-.45-.6-.46h-.52c-.17 0-.45.06-.68.31-.23.26-.9.88-.9 2.14s.93 2.48 1.06 2.65c.13.17 1.84 2.9 4.57 3.95 2.73 1.04 2.73.69 3.22.65.49-.04 1.56-.62 1.78-1.22.22-.6.22-1.12.16-1.22-.06-.1-.24-.16-.5-.28Z"
              fill="white"
            />
          </svg>
        </span>
        <span className="wa-label">WHATSAPP US</span>
      </a>

      <style>{`
        @keyframes wa-slide-in {
          from {
            opacity: 0;
            transform: translateY(18px) scale(0.9);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        .wa-float {
          animation: wa-slide-in 0.45s cubic-bezier(0.22, 1, 0.36, 1) 1.2s both;
        }
        @media (max-width: 640px) {
          .wa-float {
            right: 14px !important;
            bottom: 84px !important;
            width: 52px !important;
            height: 52px !important;
            padding: 0 !important;
            border-radius: 999px !important;
            justify-content: center;
          }
          .wa-label {
            display: none;
          }
        }
      `}</style>
    </>
  )
}
