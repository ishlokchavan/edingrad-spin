import type { Metadata } from 'next'
import { Toaster } from 'sonner'

export const metadata: Metadata = {
  title: 'Edingrad · Spin The Wheel',
  description: 'Spin your prize wheel',
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,900;1,400&family=DM+Mono:wght@300;400;500&display=swap" rel="stylesheet" />
      </head>
      <body style={{ margin: 0, background: '#060608', color: '#EDE8DC', fontFamily: "'DM Mono', monospace", minHeight: '100vh' }}>
        {children}
        <Toaster position="top-center" toastOptions={{
          style: { background: '#0F0E13', border: '1px solid rgba(255,255,255,0.07)', color: '#EDE8DC', fontFamily: "'DM Mono', monospace", fontSize: '13px' }
        }} />
      </body>
    </html>
  )
}
