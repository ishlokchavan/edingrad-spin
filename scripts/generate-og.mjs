import sharp from 'sharp'
import { mkdirSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const outDir = resolve(__dirname, '../public')
mkdirSync(outDir, { recursive: true })

// 1200 × 630 — standard OG image size
const W = 1200
const H = 630

const gold = '#C9A84C'
const bg = '#060608'
const surface = '#0F0E13'
const text = '#EDE8DC'
const text2 = '#6A6460'
const borderGold = 'rgba(201,168,76,0.25)'

// All rendering is pure SVG — no font embedding needed; email/social clients
// render system serif/mono fallbacks which still look clean at OG scale.
const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <linearGradient id="bgGrad" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#060608"/>
      <stop offset="100%" stop-color="#0c0b10"/>
    </linearGradient>
    <linearGradient id="goldLine" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#C9A84C" stop-opacity="0"/>
      <stop offset="20%" stop-color="#C9A84C" stop-opacity="1"/>
      <stop offset="80%" stop-color="#C9A84C" stop-opacity="1"/>
      <stop offset="100%" stop-color="#C9A84C" stop-opacity="0"/>
    </linearGradient>
    <radialGradient id="glow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#C9A84C" stop-opacity="0.07"/>
      <stop offset="100%" stop-color="#C9A84C" stop-opacity="0"/>
    </radialGradient>
  </defs>

  <!-- Background -->
  <rect width="${W}" height="${H}" fill="url(#bgGrad)"/>

  <!-- Subtle center glow -->
  <ellipse cx="${W / 2}" cy="${H / 2}" rx="520" ry="280" fill="url(#glow)"/>

  <!-- Outer border frame -->
  <rect x="32" y="32" width="${W - 64}" height="${H - 64}" rx="6" fill="none" stroke="#1e1c24" stroke-width="1"/>

  <!-- Inner content frame -->
  <rect x="64" y="64" width="${W - 128}" height="${H - 128}" rx="4" fill="#0F0E13" fill-opacity="0.6" stroke="${borderGold}" stroke-width="1"/>

  <!-- Top gold accent line -->
  <rect x="64" y="64" width="${W - 128}" height="3" rx="1.5" fill="url(#goldLine)"/>

  <!-- Corner ornament dots -->
  <circle cx="76" cy="76" r="3" fill="${gold}" fill-opacity="0.5"/>
  <circle cx="${W - 76}" cy="76" r="3" fill="${gold}" fill-opacity="0.5"/>
  <circle cx="76" cy="${H - 76}" r="3" fill="${gold}" fill-opacity="0.5"/>
  <circle cx="${W - 76}" cy="${H - 76}" r="3" fill="${gold}" fill-opacity="0.5"/>

  <!-- Wordmark: EDINGRAD -->
  <text
    x="${W / 2}" y="230"
    text-anchor="middle"
    font-family="Georgia, 'Times New Roman', serif"
    font-size="88"
    font-weight="700"
    letter-spacing="-2"
    fill="${text}"
  >EDINGRAD</text>

  <!-- Gold divider line -->
  <rect x="${W / 2 - 48}" y="258" width="96" height="1" fill="${gold}" fill-opacity="0.6"/>

  <!-- Tagline -->
  <text
    x="${W / 2}" y="310"
    text-anchor="middle"
    font-family="'Courier New', Courier, monospace"
    font-size="16"
    letter-spacing="5"
    fill="${gold}"
  >LUXURY REWARDS PROGRAMME</text>

  <!-- Descriptor line 1 -->
  <text
    x="${W / 2}" y="390"
    text-anchor="middle"
    font-family="Georgia, 'Times New Roman', serif"
    font-size="30"
    font-weight="400"
    letter-spacing="0.5"
    fill="${text}"
    fill-opacity="0.9"
  >Exclusive gifts for Dubai&apos;s</text>

  <!-- Descriptor line 2 — gold highlight -->
  <text
    x="${W / 2}" y="436"
    text-anchor="middle"
    font-family="Georgia, 'Times New Roman', serif"
    font-size="30"
    font-weight="700"
    letter-spacing="0.5"
    fill="${gold}"
  >top-performing real estate agents.</text>

  <!-- Bottom label -->
  <text
    x="${W / 2}" y="540"
    text-anchor="middle"
    font-family="'Courier New', Courier, monospace"
    font-size="13"
    letter-spacing="4"
    fill="${text2}"
  >REGISTER TODAY · EDINGRAD.COM</text>

</svg>
`

await sharp(Buffer.from(svg))
  .png({ quality: 95 })
  .toFile(resolve(outDir, 'og-image.png'))

console.log('✓  public/og-image.png generated (1200×630)')
