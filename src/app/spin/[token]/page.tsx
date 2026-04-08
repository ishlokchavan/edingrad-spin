'use client'
import { useEffect, useState, use, useRef } from 'react'
import { getDb, fmt, weightedPick, sleep } from '@/lib/db'
import dynamic from 'next/dynamic'
import type { WheelHandle, WheelGift } from './Wheel'

// Canvas wheel is client-only
const Wheel = dynamic(() => import('./Wheel'), { ssr: false })

// ─── Tokens ──────────────────────────────────────────────────────────────────
const C = {
  bg: '#060608', surface: '#0F0E13', surface2: '#161520',
  border: 'rgba(255,255,255,0.07)', borderGold: 'rgba(201,168,76,0.2)',
  text: '#EDE8DC', text2: '#A09890', text3: '#5A5450',
  gold: '#C9A84C', goldDim: '#5A4A20',
  green: '#3DAA6A', red: '#C44A3A',
}

// ─── Types ───────────────────────────────────────────────────────────────────
interface Session {
  id: string
  token: string
  spins_total: number
  spins_used: number
  is_complete: boolean
  agent_id: string
  deal_id: string
  slab_id?: string
}

interface Agent { id: string; full_name: string }
interface Gift { id: string; name: string; emoji: string; weight: number; value_aed: number | null; description: string | null }
interface SpinResult { spin_number: number; gift_name: string; gift_emoji: string; gift_value_aed: number | null }

type PageState = 'loading' | 'invalid' | 'expired' | 'complete' | 'ready' | 'spinning' | 'done'

export default function SpinPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params)
  const [state, setState]         = useState<PageState>('loading')
  const [session, setSession]     = useState<Session | null>(null)
  const [agent, setAgent]         = useState<Agent | null>(null)
  const [gifts, setGifts]         = useState<Gift[]>([])
  const [results, setResults]     = useState<SpinResult[]>([])
  const [currentSpin, setCurrent] = useState(0)   // which spin we're on (1-based)
  const [latestResult, setLatest] = useState<SpinResult | null>(null)
  const [wheelGifts, setWheelGifts] = useState<WheelGift[]>([])
  const wheelRef = useRef<WheelHandle>(null)
  const db = getDb()

  useEffect(() => { load() }, [token])

  async function load() {
    const { data: sess, error } = await db.from('raffle_sessions')
      .select('*')
      .eq('token', token)
      .single()

    if (error || !sess) { setState('invalid'); return }

    const s = sess as Session

    // Check completion status
    if (s.is_complete) { setState('complete'); setSession(s); }
    else setState('ready')

    setSession(s)

    // Load agent
    const { data: ag } = await db.from('agents').select('id,full_name').eq('id', s.agent_id).single()
    setAgent(ag as Agent)

    // Load existing results
    const { data: existingResults } = await db.from('spin_results')
      .select('*').eq('session_id', s.id).order('spin_number')
    if (existingResults?.length) setResults(existingResults as SpinResult[])

    // Load gifts for this deal's slab
    const { data: deal } = await db.from('deals').select('slab_id').eq('id', s.deal_id).single()
    if (deal?.slab_id) {
      const { data: cats } = await db.from('gift_categories').select('id').eq('slab_id', deal.slab_id).eq('is_active', true)
      if (cats?.length) {
        const catIds = cats.map((c: any) => c.id)
        const { data: giftData } = await db.from('gifts')
          .select('id,name,emoji,weight,value_aed,description')
          .in('category_id', catIds)
          .eq('is_active', true)
        if (giftData?.length) {
          setGifts(giftData as Gift[])
          setWheelGifts((giftData as Gift[]).map(g => ({ id: g.id, name: g.name, emoji: g.emoji, weight: g.weight })))
        }
      }
    }
  }

  // ── SPIN ONCE ────────────────────────────────────────────────────────────
  async function spinOnce() {
    if (!session || !gifts.length || !wheelRef.current) return
    setState('spinning')

    const spinNum = session.spins_used + results.length + 1
    setCurrent(spinNum)

    // Pick winner by weight
    const winner = weightedPick(gifts)
    const winnerIdx = gifts.findIndex(g => g.id === winner.id)

    // Animate wheel
    await new Promise<void>(resolve => {
      wheelRef.current!.spinTo(winnerIdx, resolve)
    })

    // Save result
    const result: SpinResult = {
      spin_number: spinNum,
      gift_name: winner.name,
      gift_emoji: winner.emoji,
      gift_value_aed: winner.value_aed,
    }

    await db.from('spin_results').insert({
      session_id: session.id,
      spin_number: spinNum,
      gift_id: winner.id,
      gift_name: winner.name,
      gift_emoji: winner.emoji,
      gift_value_aed: winner.value_aed,
    })

    setLatest(result)
    setResults(prev => [...prev, result])

    // Check if all spins are done
    const newSpinsUsed = session.spins_used + results.length + 1
    const isComplete = newSpinsUsed >= session.spins_total

    // Update session
    await db.from('raffle_sessions').update({
      spins_used: newSpinsUsed,
      is_complete: isComplete,
    }).eq('id', session.id)

    // Dramatic pause before showing next spin option or completion
    await sleep(1500)

    if (isComplete) {
      setState('done')
    } else {
      setState('ready')
    }
  }

  const spinsLeft  = session ? session.spins_total - session.spins_used - results.length : 0
  const totalValue = results.reduce((s, r) => s + (r.gift_value_aed ?? 0), 0)

  // ── LOADING ──
  if (state === 'loading') {
    return <Center><Spinner /></Center>
  }

  // ── INVALID ──
  if (state === 'invalid') {
    return (
      <Center>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🔗</div>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 26, fontWeight: 900, marginBottom: 10 }}>Invalid Link</h1>
          <p style={{ fontSize: 12, color: C.text3, lineHeight: 1.8 }}>This spin link is invalid.<br />Contact Edingrad for a valid link.</p>
        </div>
      </Center>
    )
  }

  // ── EXPIRED ──
  if (state === 'expired') {
    return (
      <Center>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>⏳</div>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 26, fontWeight: 900, marginBottom: 10 }}>Link Expired</h1>
          <p style={{ fontSize: 12, color: C.text3, lineHeight: 1.8 }}>This spin link has expired.<br />Contact Edingrad to get a new one.</p>
        </div>
      </Center>
    )
  }

  // ── ALREADY COMPLETE ──
  if (state === 'complete' && results.length === 0) {
    return (
      <Center>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 26, fontWeight: 900, marginBottom: 10 }}>Already Spun!</h1>
          <p style={{ fontSize: 12, color: C.text3, lineHeight: 1.8 }}>You&apos;ve already used all your spins on this link.</p>
        </div>
      </Center>
    )
  }

  // ── DONE ──
  if (state === 'done') {
    return (
      <div style={{ minHeight: '100vh', background: `radial-gradient(ellipse 70% 50% at 50% 20%, rgba(61,170,106,0.1) 0%, transparent 60%)`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
        <div style={{ textAlign: 'center', maxWidth: 520, width: '100%' }}>
          {/* Confetti title */}
          <div style={{ fontSize: 52, marginBottom: 12, animation: 'bounce 0.6s ease infinite alternate' }}>🎉</div>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(28px,6vw,48px)', fontWeight: 900, marginBottom: 8 }}>
            Congratulations, {agent?.full_name.split(' ')[0]}!
          </h1>
          <p style={{ fontSize: 13, color: C.text2, marginBottom: 32, lineHeight: 1.8 }}>
            You spun {results.length} time{results.length !== 1 ? 's' : ''} and won the following prizes:
          </p>

          {/* Results */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2, marginBottom: 28 }}>
            {results.map((r, i) => (
              <div key={i} style={{ background: C.surface, border: `1px solid ${C.borderGold}`,
                padding: '18px 20px', display: 'flex', alignItems: 'center', gap: 14,
                animation: `slideIn 0.4s ${i * 0.1}s ease both` }}>
                <span style={{ fontSize: 36 }}>{r.gift_emoji}</span>
                <div style={{ flex: 1, textAlign: 'left' }}>
                  <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 18, fontWeight: 700 }}>{r.gift_name}</div>
                  {r.gift_value_aed && <div style={{ fontSize: 11, color: C.green, marginTop: 2 }}>{fmt(r.gift_value_aed)}</div>}
                </div>
                <div style={{ fontSize: 9, color: C.text3, letterSpacing: '0.2em' }}>SPIN {r.spin_number}</div>
              </div>
            ))}
          </div>

          {totalValue > 0 && (
            <div style={{ background: 'rgba(61,170,106,0.06)', border: '1px solid rgba(61,170,106,0.2)',
              padding: '16px 20px', marginBottom: 24, textAlign: 'center' }}>
              <div style={{ fontSize: 9, letterSpacing: '0.25em', color: C.green, textTransform: 'uppercase', marginBottom: 6 }}>Total Prize Value</div>
              <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 32, fontWeight: 900, color: C.green }}>{fmt(totalValue)}</div>
            </div>
          )}

          <p style={{ fontSize: 11, color: C.text3, lineHeight: 1.8 }}>
            The Edingrad team will contact you within <strong style={{ color: C.gold }}>48 hours</strong> to arrange prize delivery.
          </p>
        </div>

        <style>{`
          @keyframes bounce { from { transform: scale(1); } to { transform: scale(1.15); } }
          @keyframes slideIn { from { opacity: 0; transform: translateX(-12px); } to { opacity: 1; transform: translateX(0); } }
        `}</style>
      </div>
    )
  }

  // ── READY / SPINNING ──────────────────────────────────────────────────────
  const isSpinning = state === 'spinning'

  return (
    <div className="spin-root" style={{ minHeight: '100vh', background: C.bg, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '32px 20px 60px' }}>

      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: 28 }}>
        <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 11, color: C.gold,
          letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 8 }}>
          Edingrad Real Estate
        </div>
        <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(28px,5vw,44px)', fontWeight: 900, lineHeight: 1.1, marginBottom: 6 }}>
          Spin The Wheel
        </h1>
        {agent && (
          <p style={{ fontSize: 12, color: C.text2 }}>
            Welcome, <strong style={{ color: C.text }}>{agent.full_name}</strong>
          </p>
        )}
      </div>

      {/* Spin counter */}
      <div className="spin-counter" style={{ display: 'flex', gap: 2, marginBottom: 24 }}>
        {Array.from({ length: session?.spins_total ?? 0 }).map((_, i) => {
          const spinNum = i + 1
          const isDone  = results.some(r => r.spin_number === spinNum)
          const isActive = isSpinning && currentSpin === spinNum
          return (
            <div key={i} style={{ width: 36, height: 36, border: `2px solid ${isDone ? C.green : isActive ? C.gold : C.border}`,
              background: isDone ? 'rgba(61,170,106,0.1)' : isActive ? 'rgba(201,168,76,0.1)' : C.surface,
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13,
              transition: 'all 0.3s', borderRadius: 2 }}>
              {isDone ? '✓' : isActive ? '🎡' : spinNum}
            </div>
          )
        })}
      </div>

      {/* Wheel container */}
      <div className="wheel-frame" style={{ position: 'relative', marginBottom: 28 }}>
        {/* Pointer */}
        <div style={{ position: 'absolute', top: -14, left: '50%', transform: 'translateX(-50%)',
          width: 0, height: 0, zIndex: 10,
          borderLeft: '12px solid transparent',
          borderRight: '12px solid transparent',
          borderTop: '28px solid #C9A84C',
          filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))' }} />

        {gifts.length > 0
          ? <Wheel ref={wheelRef} gifts={wheelGifts} size={Math.min(360, typeof window !== 'undefined' ? window.innerWidth - 40 : 360)} spinning={isSpinning} />
          : (
            <div style={{ width: 300, height: 300, borderRadius: '50%', background: C.surface,
              border: `2px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: C.text3, fontSize: 11, letterSpacing: '0.15em' }}>
              LOADING GIFTS…
            </div>
          )
        }
      </div>

      {/* Latest result during spinning */}
      {isSpinning && latestResult && (
        <div style={{ background: C.surface, border: `1px solid ${C.borderGold}`,
          padding: '16px 24px', textAlign: 'center', marginBottom: 16, animation: 'fadeIn 0.3s ease',
          display: 'flex', alignItems: 'center', gap: 12, minWidth: 260 }}>
          <span style={{ fontSize: 32 }}>{latestResult.gift_emoji}</span>
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontSize: 9, letterSpacing: '0.2em', color: C.gold, marginBottom: 3 }}>SPIN {latestResult.spin_number} RESULT</div>
            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 18, fontWeight: 700 }}>{latestResult.gift_name}</div>
            {latestResult.gift_value_aed && <div style={{ fontSize: 11, color: C.green }}>{fmt(latestResult.gift_value_aed)}</div>}
          </div>
        </div>
      )}

      {/* Status / CTA */}
      {!isSpinning && state === 'ready' && (
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 11, color: C.text2, marginBottom: 16 }}>
            <span style={{ display: 'block', marginBottom: 6 }}>Remaining Spins: <strong style={{ color: C.gold, fontSize: 14 }}>{spinsLeft}</strong></span>
            <span style={{ fontSize: 10, color: C.text3 }}>Click to spin your next ticket!</span>
          </div>
          <button onClick={spinOnce} disabled={!gifts.length || spinsLeft === 0}
            style={{ background: (gifts.length && spinsLeft > 0) ? C.gold : C.surface,
              color: (gifts.length && spinsLeft > 0) ? C.bg : C.text3,
              border: 'none', padding: '16px 48px', fontSize: 13,
              letterSpacing: '0.2em', textTransform: 'uppercase',
              cursor: (gifts.length && spinsLeft > 0) ? 'pointer' : 'not-allowed',
              fontFamily: "'DM Mono', monospace",
              boxShadow: (gifts.length && spinsLeft > 0) ? '0 0 32px rgba(201,168,76,0.3)' : 'none',
              transition: 'all 0.2s',
              fontWeight: 700,
            }}
            onMouseEnter={(e) => {
              if (gifts.length && spinsLeft > 0) {
                e.currentTarget.style.transform = 'scale(1.05)'
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)'
            }}>
            🎡 SPIN TICKET {session ? session.spins_used + results.length + 1 : 1} →
          </button>
          <p style={{ fontSize: 10, color: C.text3, marginTop: 12 }}>Click for each ticket. You have {spinsLeft} left!</p>
        </div>
      )}

      {isSpinning && (
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 12, color: C.gold, letterSpacing: '0.15em',
            animation: 'pulse 1.2s ease infinite' }}>
            SPINNING {currentSpin} OF {session?.spins_total}…
          </div>
        </div>
      )}

      {/* Slab label */}
      {gifts.length > 0 && (
        <div style={{ marginTop: 20, fontSize: 9, color: C.text3, letterSpacing: '0.2em', textAlign: 'center' }}>
          {gifts.length} PRIZES IN POOL
        </div>
      )}

      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
        @keyframes pulse  { 0%,100% { opacity: 0.6; } 50% { opacity: 1; } }
      `}</style>
    </div>
  )
}

function Center({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      {children}
    </div>
  )
}

function Spinner() {
  return <div style={{ color: '#5A5450', fontSize: 11, letterSpacing: '0.25em' }}>LOADING…</div>
}
