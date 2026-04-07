'use client'
import { useEffect, useRef, forwardRef, useImperativeHandle } from 'react'

export interface WheelGift {
  id: string
  name: string
  emoji: string
  weight: number
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
      const total = gifts.reduce((s, g) => s + g.weight, 0)

      // Calculate angle for the center of targetIndex slice
      let acc = 0
      for (let i = 0; i < targetIndex; i++) acc += (gifts[i].weight / total) * 360
      const sliceAngle = (gifts[targetIndex].weight / total) * 360
      const targetAngle = acc + sliceAngle / 2

      // Spin 5–8 full rotations then land on target
      // Wheel is drawn from -90° (top), pointer is at top
      // We want targetAngle to end up at top (0° from top = 270° in standard)
      const landAt = (360 - targetAngle + 270) % 360
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
    const total = gifts.reduce((s, g) => s + g.weight, 0)

    ctx.clearRect(0, 0, W, H)
    ctx.save()
    ctx.translate(cx, cy)
    ctx.rotate((rotation * Math.PI) / 180)
    ctx.translate(-cx, -cy)

    let startAngle = -Math.PI / 2 // start from top
    gifts.forEach((g, i) => {
      const sweep = (g.weight / total) * 2 * Math.PI
      const color = g.color ?? PALETTE[i % PALETTE.length]

      // Slice
      ctx.beginPath()
      ctx.moveTo(cx, cy)
      ctx.arc(cx, cy, r, startAngle, startAngle + sweep)
      ctx.closePath()
      ctx.fillStyle = color
      ctx.fill()

      // Subtle border
      ctx.strokeStyle = '#060608'
      ctx.lineWidth = 2
      ctx.stroke()

      // Label
      ctx.save()
      ctx.translate(cx, cy)
      ctx.rotate(startAngle + sweep / 2)
      ctx.textAlign = 'right'

      // Emoji
      ctx.font = `${Math.min(20, 280 / gifts.length)}px serif`
      ctx.fillText(g.emoji, r - 12, 6)

      // Name
      ctx.font = `500 ${Math.min(11, 220 / gifts.length)}px 'DM Mono', monospace`
      ctx.fillStyle = '#fff'
      ctx.shadowColor = 'rgba(0,0,0,0.6)'
      ctx.shadowBlur = 3
      const maxChars = Math.floor(r * 0.45 / 6)
      const label = g.name.length > maxChars ? g.name.slice(0, maxChars - 1) + '…' : g.name
      ctx.fillText(label, r - 36, 6)

      ctx.restore()
      startAngle += sweep
    })
    ctx.restore()

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
