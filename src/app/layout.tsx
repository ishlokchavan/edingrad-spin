import type { Metadata } from 'next'
import './globals.css'
import { Toaster } from 'sonner'
import CookieConsentBanner from './CookieConsentBanner'
import WhatsAppFloatingButton from './WhatsAppFloatingButton'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '') || 'https://edingrad.com'

export const metadata: Metadata = {
  title: 'Edingrad · Reward Your Top Agents',
  description: 'A luxury reward programme for Dubai\'s top-performing real estate agents. Register to access exclusive gifts and prizes.',
  metadataBase: new URL(APP_URL),
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon-32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-16.png', sizes: '16x16', type: 'image/png' },
    ],
    apple: { url: '/apple-touch-icon.png', sizes: '180x180' },
    other: [
      { rel: 'icon', url: '/favicon-192.png', sizes: '192x192' },
      { rel: 'icon', url: '/favicon-512.png', sizes: '512x512' },
    ],
  },
  openGraph: {
    type: 'website',
    url: APP_URL,
    siteName: 'Edingrad',
    title: 'Edingrad · Reward Your Top Agents',
    description: 'A luxury reward programme for Dubai\'s top-performing real estate agents. Register to access exclusive gifts and prizes.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Edingrad — Luxury Rewards for Top Agents',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Edingrad · Reward Your Top Agents',
    description: 'A luxury reward programme for Dubai\'s top-performing real estate agents.',
    images: ['/og-image.png'],
  },
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
        <WhatsAppFloatingButton />
        <CookieConsentBanner />
        <Toaster position="top-center" toastOptions={{
          style: { background: '#0F0E13', border: '1px solid rgba(255,255,255,0.07)', color: '#EDE8DC', fontFamily: "'DM Mono', monospace", fontSize: '13px' }
        }} />
      </body>
    </html>
  )
}
