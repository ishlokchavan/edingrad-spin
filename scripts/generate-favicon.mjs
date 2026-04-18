import sharp from 'sharp'
import { mkdirSync, writeFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const outDir = resolve(__dirname, '../public')
mkdirSync(outDir, { recursive: true })

const gold = '#C9A84C'
const bg = '#060608'

// Build an SVG at the given size — "E" monogram on dark square with gold
function makeSvg(size) {
  const fontSize = Math.round(size * 0.58)
  const r = Math.round(size * 0.18)
  return `
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" rx="${r}" fill="${bg}"/>
  <!-- Gold top accent bar -->
  <rect x="${Math.round(size * 0.12)}" y="${Math.round(size * 0.10)}" width="${Math.round(size * 0.76)}" height="${Math.round(size * 0.06)}" rx="${Math.round(size * 0.03)}" fill="${gold}"/>
  <!-- E letterform -->
  <text
    x="${size / 2}"
    y="${Math.round(size * 0.72)}"
    text-anchor="middle"
    font-family="Georgia, 'Times New Roman', serif"
    font-size="${fontSize}"
    font-weight="700"
    fill="${gold}"
  >E</text>
</svg>`
}

// Generate PNG at each size
const sizes = [16, 32, 48, 180, 192, 512]
for (const size of sizes) {
  const svg = makeSvg(size)
  await sharp(Buffer.from(svg)).png({ quality: 95 }).toFile(resolve(outDir, `favicon-${size}.png`))
  console.log(`✓  favicon-${size}.png`)
}

// 32×32 as the canonical favicon.png (used by browsers without ICO support)
await sharp(Buffer.from(makeSvg(32))).png({ quality: 95 }).toFile(resolve(outDir, 'favicon.png'))

// Apple touch icon (must be named exactly)
await sharp(Buffer.from(makeSvg(180))).png({ quality: 95 }).toFile(resolve(outDir, 'apple-touch-icon.png'))

// Write a clean SVG favicon for modern browsers
writeFileSync(resolve(outDir, 'favicon.svg'), makeSvg(32).trim())

console.log('\n✓  public/favicon.png')
console.log('✓  public/apple-touch-icon.png')
console.log('✓  public/favicon.svg')
console.log('\nDone. Add <link rel="icon" href="/favicon.svg"> for modern browsers.')
