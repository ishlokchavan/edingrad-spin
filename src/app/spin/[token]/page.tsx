'use client'
import { useEffect, useState, use, useRef } from 'react'
import { getDb, fmt, sleep } from '@/lib/db'
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
interface SpinConfig { spin_number: number; gift_id: string; can_win: boolean }
interface Session {
  id: string
  token: string
  spins_total: number
  spins_used: number
  is_complete: boolean
  agent_id: string
  deal_id: string
  slab_id?: string
  spin_configurations: SpinConfig[]
}

interface Agent { id: string; full_name: string }
interface Deal { id: string; reference_id: string; slab_id: string }
interface Gift { id: string; name: string; emoji: string; weight: number; value_aed: number | null; description: string | null }
interface SpinResult { spin_number: number; gift_name: string; gift_emoji: string; gift_value_aed: number | null }

type PageState = 'loading' | 'invalid' | 'expired' | 'complete' | 'ready' | 'spinning' | 'done'

export default function SpinPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params)
  const [state, setState] = useState<PageState>('loading')
  const [session, setSession] = useState<Session | null>(null)
  const [agent, setAgent] = useState<Agent | null>(null)
  const [deal, setDeal] = useState<Deal | null>(null)
  const [gifts, setGifts] = useState<Gift[]>([])
  const [results, setResults] = useState<SpinResult[]>([])
  const [currentSpin, setCurrent] = useState(0)   // which spin we're on (1-based)
  const [latestResult, setLatest] = useState<SpinResult | null>(null)
  const [wheelGifts, setWheelGifts] = useState<WheelGift[]>([])
  const [allocationMap, setAllocationMap] = useState<Record<number, SpinConfig>>({})
  const [showPrizes, setShowPrizes] = useState(false)
  const wheelRef = useRef<WheelHandle>(null)
  const db = getDb()

  function buildWheelGifts(source: Gift[]) {
    return source.map(g => ({ id: g.id, name: g.name, emoji: g.emoji, weight: g.weight, value_aed: g.value_aed }))
  }

  useEffect(() => { load() }, [token])

  async function load() {
    const { data: sess, error } = await db.from('raffle_sessions')
      .select('*')
      .eq('token', token)
      .single()

    if (error || !sess) { setState('invalid'); return }

    const s = sess as Session

    if (s.is_complete) { setState('complete'); setSession(s); }
    else setState('ready')
    setSession(s)

    // Load agent & deal in parallel
    const [{ data: ag }, { data: dealData }] = await Promise.all([
      db.from('agents').select('id,full_name').eq('id', s.agent_id).single(),
      db.from('deals').select('id,reference_id,slab_id').eq('id', s.deal_id).single(),
    ])
    setAgent(ag as Agent)
    setDeal(dealData as Deal)

    // Build allocation map from the session's spin_configurations
    const spinConfigs: SpinConfig[] = s.spin_configurations ?? []
    const map: Record<number, SpinConfig> = {}
    spinConfigs.forEach(cfg => { map[cfg.spin_number] = cfg })
    setAllocationMap(map)

    // Load existing results
    const { data: existingResults } = await db.from('spin_results')
      .select('*').eq('session_id', s.id).order('spin_number')
    if (existingResults?.length) setResults(existingResults as SpinResult[])

    // Load all gifts from the deal's slab (full wheel display)
    if (dealData?.slab_id) {
      const { data: giftData, error: giftErr } = await db.from('gifts')
        .select('id,name,emoji,weight,value_aed,description')
        .eq('slab_id', dealData.slab_id)
        .eq('is_active', true)

      // Backward-compatible fallback for legacy schema (categories -> gifts).
      if (giftErr) {
        const { data: cats } = await db.from('gift_categories').select('id').eq('slab_id', dealData.slab_id).eq('is_active', true)
        if (cats?.length) {
          const catIds = cats.map((c: any) => c.id)
          const { data: legacyGiftData } = await db.from('gifts')
            .select('id,name,emoji,weight,value_aed,description')
            .in('category_id', catIds)
            .eq('is_active', true)
          if (legacyGiftData?.length) {
            setGifts(legacyGiftData as Gift[])
            setWheelGifts(buildWheelGifts(legacyGiftData as Gift[]))
          }
        }
      } else if (giftData?.length) {
        setGifts(giftData as Gift[])
        setWheelGifts(buildWheelGifts(giftData as Gift[]))
      }
    }
  }

  // ── SPIN ONCE ────────────────────────────────────────────────────────────
  async function spinOnce() {
    if (!session || !gifts.length || !wheelRef.current) return
    setState('spinning')

    const spinNum = session.spins_used + results.length + 1
    setCurrent(spinNum)

    // Determine winner from admin config
    const spinConfig = allocationMap[spinNum]
    const canWin = spinConfig?.can_win && spinConfig?.gift_id
    const winner = canWin ? gifts.find(g => g.id === spinConfig.gift_id) : null
    const winnerIdx = winner ? wheelGifts.findIndex(g => g.id === winner.id) : Math.floor(Math.random() * wheelGifts.length)

    // Animate wheel
    await new Promise<void>(resolve => {
      wheelRef.current!.spinTo(winnerIdx === -1 ? Math.floor(Math.random() * wheelGifts.length) : winnerIdx, resolve)
    })

    // Save result
    const result: SpinResult = {
      spin_number: spinNum,
      gift_name: winner?.name ?? 'Better Luck Next Time',
      gift_emoji: winner?.emoji ?? '🎁',
      gift_value_aed: winner?.value_aed ?? null,
    }

    await db.from('spin_results').insert({
      session_id: session.id,
      spin_number: spinNum,
      gift_id: winner?.id ?? null,
      gift_name: result.gift_name,
      gift_emoji: result.gift_emoji,
      gift_value_aed: result.gift_value_aed,
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

    setSession(prev => prev ? { ...prev, is_complete: isComplete } : prev)

    // Dramatic pause before showing next spin option or completion
    await sleep(1500)

    if (isComplete) {
      setState('done')
    } else {
      setState('ready')
    }
  }

  const spinsLeft = session ? session.spins_total - session.spins_used - results.length : 0
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
  if (state === 'complete') {
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

          {/* Reference ID */}
          {deal && (
            <div style={{
              background: C.surface2, border: `1px solid ${C.borderGold}`,
              padding: '12px 16px', marginBottom: 24, textAlign: 'center'
            }}>
              <div style={{ fontSize: 10, letterSpacing: '0.2em', color: C.gold, textTransform: 'uppercase', marginBottom: 4 }}>Reference ID</div>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 16, fontWeight: 700, color: C.text }}>{deal.reference_id}</div>
            </div>
          )}

          {/* Results */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2, marginBottom: 28 }}>
            {results.map((r, i) => (
              <div key={i} style={{
                background: C.surface, border: `1px solid ${C.borderGold}`,
                padding: '18px 20px', display: 'flex', alignItems: 'center', gap: 14,
                animation: `slideIn 0.4s ${i * 0.1}s ease both`
              }}>
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
            <div style={{
              background: 'rgba(61,170,106,0.06)', border: '1px solid rgba(61,170,106,0.2)',
              padding: '16px 20px', marginBottom: 24, textAlign: 'center'
            }}>
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

          {/* Reference ID */}
          {deal && (
            <div style={{
              background: C.surface2, border: `1px solid ${C.borderGold}`,
              padding: '12px 16px', marginBottom: 24, textAlign: 'center'
            }}>
              <div style={{ fontSize: 10, letterSpacing: '0.2em', color: C.gold, textTransform: 'uppercase', marginBottom: 4 }}>Reference ID</div>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 16, fontWeight: 700, color: C.text }}>{deal.reference_id}</div>
            </div>
          )}

          {/* Results */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2, marginBottom: 28 }}>
            {results.map((r, i) => (
              <div key={i} style={{
                background: C.surface, border: `1px solid ${C.borderGold}`,
                padding: '18px 20px', display: 'flex', alignItems: 'center', gap: 14,
                animation: `slideIn 0.4s ${i * 0.1}s ease both`
              }}>
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
            <div style={{
              background: 'rgba(61,170,106,0.06)', border: '1px solid rgba(61,170,106,0.2)',
              padding: '16px 20px', marginBottom: 24, textAlign: 'center'
            }}>
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
        <div style={{
          fontFamily: "'Playfair Display', serif", fontSize: 11, color: C.gold,
          letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 8
        }}>
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
          const isDone = results.some(r => r.spin_number === spinNum)
          const isActive = isSpinning && currentSpin === spinNum
          return (
            <div key={i} style={{
              width: 36, height: 36, border: `2px solid ${isDone ? C.green : isActive ? C.gold : C.border}`,
              background: isDone ? 'rgba(61,170,106,0.1)' : isActive ? 'rgba(201,168,76,0.1)' : C.surface,
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13,
              transition: 'all 0.3s', borderRadius: 2
            }}>
              {isDone ? '✓' : isActive ? '🎡' : spinNum}
            </div>
          )
        })}
      </div>

      {/* Wheel container */}
      <div className="wheel-frame" style={{ position: 'relative', marginBottom: 28 }}>
        {/* Pointer */}
        <div style={{
          position: 'absolute', top: -14, left: '50%', transform: 'translateX(-50%)',
          width: 0, height: 0, zIndex: 10,
          borderLeft: '12px solid transparent',
          borderRight: '12px solid transparent',
          borderTop: '28px solid #C9A84C',
          filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))'
        }} />

        {gifts.length > 0
          ? <Wheel ref={wheelRef} gifts={wheelGifts} size={Math.min(360, typeof window !== 'undefined' ? window.innerWidth - 40 : 360)} spinning={isSpinning} />
          : (
            <div style={{
              width: 300, height: 300, borderRadius: '50%', background: C.surface,
              border: `2px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: C.text3, fontSize: 11, letterSpacing: '0.15em'
            }}>
              LOADING GIFTS…
            </div>
          )
        }
      </div>

      {/* Latest result — shown after each spin, stays visible until next spin */}
      {latestResult && !isSpinning && (
        <div style={{
          background: C.surface, border: `1px solid ${C.borderGold}`,
          padding: '16px 24px', marginBottom: 20, animation: 'fadeIn 0.4s ease',
          display: 'flex', alignItems: 'center', gap: 14, minWidth: 260, width: '100%', maxWidth: 400,
        }}>
          <span style={{ fontSize: 36 }}>{latestResult.gift_emoji}</span>
          <div style={{ flex: 1, textAlign: 'left' }}>
            <div style={{ fontSize: 9, letterSpacing: '0.2em', color: C.gold, marginBottom: 3 }}>SPIN {latestResult.spin_number} RESULT</div>
            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 18, fontWeight: 700 }}>{latestResult.gift_name}</div>
            {latestResult.gift_value_aed && (
              <div style={{
                display: 'inline-block', marginTop: 5,
                background: 'rgba(61,170,106,0.1)', border: '1px solid rgba(61,170,106,0.3)',
                borderRadius: 99, padding: '2px 10px',
              }}>
                <span style={{ fontSize: 11, fontWeight: 800, color: C.green, fontFamily: "'DM Mono', monospace" }}>
                  {fmt(latestResult.gift_value_aed)}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Spinning indicator */}
      {isSpinning && (
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <div style={{ fontSize: 12, color: C.gold, letterSpacing: '0.15em', animation: 'pulse 1.2s ease infinite' }}>
            SPINNING {currentSpin} OF {session?.spins_total}…
          </div>
        </div>
      )}

      {/* Spin CTA — always above the fold */}
      {!isSpinning && state === 'ready' && (
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <button onClick={spinOnce} disabled={!gifts.length || spinsLeft === 0}
            style={{
              background: (gifts.length && spinsLeft > 0) ? C.gold : C.surface,
              color: (gifts.length && spinsLeft > 0) ? C.bg : C.text3,
              border: 'none', padding: '16px 48px', fontSize: 13,
              letterSpacing: '0.2em', textTransform: 'uppercase',
              cursor: (gifts.length && spinsLeft > 0) ? 'pointer' : 'not-allowed',
              fontFamily: "'DM Mono', monospace",
              boxShadow: (gifts.length && spinsLeft > 0) ? '0 0 32px rgba(201,168,76,0.3)' : 'none',
              transition: 'all 0.2s', fontWeight: 700,
            }}
            onMouseEnter={e => { if (gifts.length && spinsLeft > 0) e.currentTarget.style.transform = 'scale(1.05)' }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)' }}>
            🎡 SPIN TICKET {session ? session.spins_used + results.length + 1 : 1} →
          </button>
          <p style={{ fontSize: 10, color: C.text3, marginTop: 10 }}>
            {spinsLeft} spin{spinsLeft !== 1 ? 's' : ''} remaining
          </p>
        </div>
      )}

      {/* Prize legend — collapsible, below the fold by default */}
      {wheelGifts.length > 0 && (
        <div style={{ width: '100%', maxWidth: 760, marginBottom: 20 }}>
          <button
            onClick={() => setShowPrizes(v => !v)}
            style={{
              width: '100%', background: C.surface2, border: `1px solid ${C.border}`,
              padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              cursor: 'pointer', color: C.text, borderRadius: showPrizes ? '12px 12px 0 0' : 12,
              transition: 'border-radius 0.2s',
            }}>
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontSize: 13, fontWeight: 700 }}>Wheel Prizes</div>
              <div style={{ fontSize: 10, color: C.text3, letterSpacing: '0.15em', marginTop: 2 }}>Tap to {showPrizes ? 'hide' : 'see all prizes & amounts'}</div>
            </div>
            <span style={{ fontSize: 18, color: C.gold, transition: 'transform 0.2s', transform: showPrizes ? 'rotate(180deg)' : 'rotate(0deg)' }}>⌄</span>
          </button>

          {showPrizes && (
            <div style={{
              border: `1px solid ${C.border}`, borderTop: 'none',
              borderRadius: '0 0 12px 12px', padding: 14,
              display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 10,
              animation: 'fadeIn 0.2s ease',
            }}>
              {wheelGifts.map((g) => (
                <div key={g.id} style={{ background: C.surface2, border: `1px solid ${g.value_aed ? C.borderGold : C.border}`, borderRadius: 14, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 38, height: 38, borderRadius: 12, background: 'rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>
                    {g.emoji}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: C.text, lineHeight: 1.25 }}>{g.name}</div>
                    {g.value_aed ? (
                      <div style={{
                        display: 'inline-block', marginTop: 5,
                        background: 'rgba(201,168,76,0.12)', border: '1px solid rgba(201,168,76,0.35)',
                        borderRadius: 99, padding: '2px 8px',
                      }}>
                        <span style={{ fontSize: 10, fontWeight: 800, color: C.gold, fontFamily: "'DM Mono', monospace" }}>
                          {fmt(g.value_aed)}
                        </span>
                      </div>
                    ) : (
                      <div style={{ fontSize: 10, color: C.text3, marginTop: 3 }}>—</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: scale(0.98); } to { opacity: 1; transform: scale(1); } }
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
