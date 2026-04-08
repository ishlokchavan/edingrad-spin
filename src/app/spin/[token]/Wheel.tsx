'use client'
import { useEffect, useRef, forwardRef, useImperativeHandle } from 'react'

export interface WheelGift {
  id: string
  name: string
  emoji: string
  weight: number
  value_aed?: number | null
  color?: string
}

export interface WheelHandle {
  spinTo: (targetIndex: number, onDone: () => void) => void
}

const PALETTE = [
  '#C9A84C','#7A5C2E','#3DAA6A','#4A8FC4','#C44A3A',
  '#8B6FC4','#C47A3A','#4A9E8A','#A04AC4','#5C8AC4',
]

interface WheelProps {
  gifts: WheelGift[]
  size?: number
  spinning?: boolean
}

const Wheel = forwardRef<WheelHandle, WheelProps>(function Wheel({ gifts, size = 360, spinning = false }, ref) {
  const canvasRef  = useRef<HTMLCanvasElement>(null)
  const rotRef     = useRef(0)      // current rotation in degrees
  const animRef    = useRef<number>(0)

  useImperativeHandle(ref, () => ({
    spinTo(targetIndex: number, onDone: () => void) {
      if (!gifts.length) return
    const sliceAngle = 360 / gifts.length
    const targetAngle = targetIndex * sliceAngle + sliceAngle / 2
      // Spin 5–8 full rotations then land on target
      // Wheel is drawn from -90° (top), pointer is at top
      // We want targetAngle to end up at top (0° from top = 270° in standard)
      const landAt = (360 - targetAngle) % 360
      const startRot = rotRef.current % 360
      const extra = 360 * (5 + Math.floor(Math.random() * 3))
      const endRot = rotRef.current + extra + ((landAt - startRot + 360) % 360)

      const duration = 4000 + Math.random() * 1200
      const start = performance.now()
      const fromRot = rotRef.current

      function animate(now: number) {
        const elapsed = now - start
        const progress = Math.min(elapsed / duration, 1)
        // Ease out quart
        const ease = 1 - Math.pow(1 - progress, 4)
        rotRef.current = fromRot + (endRot - fromRot) * ease
        draw(rotRef.current)

        if (progress < 1) {
          animRef.current = requestAnimationFrame(animate)
        } else {
          rotRef.current = endRot
          onDone()
        }
      }
      cancelAnimationFrame(animRef.current)
      animRef.current = requestAnimationFrame(animate)
    }
  }))

  function draw(rotation: number) {
    const canvas = canvasRef.current
    if (!canvas || !gifts.length) return
    const ctx = canvas.getContext('2d')!
    const W = canvas.width, H = canvas.height
    const cx = W / 2, cy = H / 2, r = Math.min(cx, cy) - 6

    ctx.clearRect(0, 0, W, H)
    ctx.save()
    ctx.translate(cx, cy)
    ctx.rotate((rotation * Math.PI) / 180)
    ctx.translate(-cx, -cy)

    let startAngle = -Math.PI / 2 // start from top
    const slice = (2 * Math.PI) / gifts.length
    gifts.forEach((g, i) => {
      const color = g.color ?? PALETTE[i % PALETTE.length]

      // Slice
      ctx.beginPath()
      ctx.moveTo(cx, cy)
      ctx.arc(cx, cy, r, startAngle, startAngle + slice)
      ctx.closePath()
      ctx.fillStyle = color
      ctx.fill()

      // Subtle border
      ctx.strokeStyle = '#060608'
      ctx.lineWidth = 2
      ctx.stroke()

      // Emoji + value label on each slice
      ctx.save()
      ctx.translate(cx, cy)
      const centerAngle = startAngle + slice / 2
      ctx.rotate(centerAngle)
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillStyle = '#fff'
      ctx.shadowColor = 'rgba(0,0,0,0.45)'
      ctx.shadowBlur = 6

      const hasValue = g.value_aed != null && g.value_aed > 0
      const emojiSize = Math.min(hasValue ? 26 : 38, 240 / gifts.length)
      const emojiY = hasValue ? -10 : 0
      ctx.font = `${emojiSize}px serif`
      ctx.fillText(g.emoji, r * 0.58, emojiY)

      if (hasValue) {
        const valLabel = g.value_aed! >= 1000
          ? `AED ${(g.value_aed! / 1000).toFixed(g.value_aed! % 1000 === 0 ? 0 : 1)}K`
          : `AED ${g.value_aed}`
        const valSize = Math.min(11, 88 / gifts.length)
        const padX = 5, padY = 3
        ctx.font = `bold ${valSize}px sans-serif`

        const textW = ctx.measureText(valLabel).width
        const pillW = textW + padX * 2
        const pillH = valSize + padY * 2
        const pillR = pillH / 2
        const x = r * 0.58
        const pillTop = emojiY + emojiSize / 2 + 3

        // Dark pill background
        ctx.shadowBlur = 0
        ctx.fillStyle = 'rgba(0,0,0,0.55)'
        ctx.beginPath()
        ctx.roundRect(x - pillW / 2, pillTop, pillW, pillH, pillR)
        ctx.fill()

        // Gold text with glow
        ctx.fillStyle = '#C9A84C'
        ctx.shadowColor = 'rgba(201,168,76,0.9)'
        ctx.shadowBlur = 12
        ctx.fillText(valLabel, x, pillTop + pillH / 2)
      }
      ctx.restore()

      // Radial divider
      ctx.beginPath()
      ctx.strokeStyle = '#00000044'
      ctx.lineWidth = 3
      ctx.moveTo(cx, cy)
      ctx.lineTo(cx + r * Math.cos(startAngle), cy + r * Math.sin(startAngle))
      ctx.stroke()

      startAngle += slice
    })
    ctx.restore()

    // Outer ring
    ctx.beginPath()
    ctx.arc(cx, cy, r + 4, 0, 2 * Math.PI)
    ctx.strokeStyle = 'rgba(255,255,255,0.15)'
    ctx.lineWidth = 6
    ctx.stroke()

    // Center cap
    ctx.beginPath()
    ctx.arc(cx, cy, 18, 0, 2 * Math.PI)
    ctx.fillStyle = '#060608'
    ctx.fill()
    ctx.strokeStyle = '#C9A84C'
    ctx.lineWidth = 2
    ctx.stroke()

    // Center dot
    ctx.beginPath()
    ctx.arc(cx, cy, 7, 0, 2 * Math.PI)
    ctx.fillStyle = '#C9A84C'
    ctx.fill()
  }

  useEffect(() => {
    draw(rotRef.current)
  }, [gifts, size])

  // Idle glow pulse when spinning is true
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    canvas.style.filter = spinning ? 'drop-shadow(0 0 18px rgba(201,168,76,0.5))' : 'none'
  }, [spinning])

  return (
    <canvas
      ref={canvasRef}
      width={size}
      height={size}
      style={{ borderRadius: '50%', display: 'block', transition: 'filter 0.3s' }}
    />
  )
})

export default Wheel
