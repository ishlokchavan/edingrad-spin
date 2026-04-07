'use client'
import { useState, useEffect } from 'react'
import { getDb } from '@/lib/db'
import { toast } from 'sonner'

const C = {
  bg: '#060608', surface: '#0F0E13', surface2: '#161520',
  border: 'rgba(255,255,255,0.07)', borderGold: 'rgba(201,168,76,0.2)',
  text: '#EDE8DC', text2: '#A09890', text3: '#5A5450',
  gold: '#C9A84C', goldDim: '#5A4A20',
  green: '#3DAA6A', red: '#C44A3A',
}

interface Gift { id: string; name: string; emoji: string; value_aed: number | null; description: string | null }

export default function Root() {
  const [showForm, setShowForm] = useState(false)
  const [showThanks, setShowThanks] = useState(false)
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    agency: '',
    message: ''
  })
  const [loading, setLoading] = useState(false)
  const [gifts, setGifts] = useState<Gift[]>([])
  const db = getDb()

  useEffect(() => {
    loadRewards()
  }, [])

  const loadRewards = async () => {
    try {
      const { data } = await db
        .from('gifts')
        .select('id,name,emoji,value_aed,description')
        .limit(8)

      if (data) {
        setGifts(data as Gift[])
      }
    } catch (err) {
      console.error('Failed to load rewards:', err)
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.fullName.trim() || !formData.email.trim() || !formData.phone.trim() || !formData.agency.trim()) {
      toast.error('Please fill in all required fields')
      return
    }

    setLoading(true)
    try {
      // Check if agent with this email already exists
      const { data: existingAgent } = await db
        .from('agents')
        .select('id')
        .eq('email', formData.email)
        .single()

      let agent: any = existingAgent

      // If agent doesn't exist, create one
      if (!agent) {
        const { data: newAgent, error: agentError } = await db
          .from('agents')
          .insert([{
            full_name: formData.fullName,
            email: formData.email,
            phone: formData.phone,
            company: formData.agency,
            notes: formData.message,
            status: 'pending'
          }])
          .select()
          .single()

        if (agentError) throw agentError
        agent = newAgent
      } else {
        toast.info('Welcome back! Creating your new spin session...')
      }

      if (!agent) {
        throw new Error('Failed to register agent')
      }

      // Fetch an active deal (required by database constraint)
      const { data: deals, error: dealsError } = await db
        .from('deals')
        .select('id')
        .limit(1)

      if (dealsError) throw dealsError
      if (!deals || deals.length === 0) {
        throw new Error('Please create a deal first. Contact admin to set up a deal.')
      }

      const dealId = deals[0].id

      // Generate a unique token for the session
      const token = crypto.getRandomValues(new Uint8Array(16))
        .reduce((s, b) => s + b.toString(16).padStart(2, '0'), '')

      // Create session linked to this agent and deal
      const { data: session, error: sessionError } = await db
        .from('raffle_sessions')
        .insert([{
          token,
          agent_id: agent.id,
          deal_id: dealId,
          spins_total: 3,
          spins_used: 0,
          is_complete: false,
        }])
        .select()
        .single()

      if (sessionError) throw sessionError

      toast.success('✅ Registration Successful!')
      setShowForm(false)
      setShowThanks(true)
      setFormData({ fullName: '', email: '', phone: '', agency: '', message: '' })
    } catch (err: any) {
      console.error(err)
      toast.error(err.message || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: C.bg, color: C.text }}>
      {/* Navigation Bar */}
      <div style={{
        background: C.surface,
        borderBottom: `1px solid ${C.border}`,
        padding: '16px 40px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <div style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: 24,
          fontWeight: 900,
          letterSpacing: '-0.01em',
        }}>
          Edingrad<span style={{ color: C.gold }}>.</span>
        </div>
        <button
          onClick={() => setShowForm(true)}
          style={{
            background: C.gold,
            color: '#000',
            border: 'none',
            padding: '10px 24px',
            fontSize: 12,
            fontWeight: 600,
            borderRadius: 4,
            cursor: 'pointer',
            fontFamily: "'DM Mono', monospace",
            letterSpacing: '0.1em',
            transition: 'all 0.3s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#DAB856'
            e.currentTarget.style.transform = 'scale(1.05)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = C.gold
            e.currentTarget.style.transform = 'scale(1)'
          }}
        >
          REGISTER
        </button>
      </div>

      {/* Hero Section */}
      <div style={{
        padding: '80px 40px',
        textAlign: 'center',
        background: `linear-gradient(135deg, ${C.bg} 0%, ${C.surface} 100%)`,
      }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <div style={{
            fontSize: 14,
            color: C.gold,
            letterSpacing: '0.2em',
            marginBottom: 16,
            fontWeight: 600,
          }}>
            GROW TOEGETHER
          </div>

          <h1 style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: 72,
            fontWeight: 900,
            marginBottom: 16,
            lineHeight: 1.2,
            letterSpacing: '-0.02em',
          }}>
            Close Deals.
            <br />
            <span style={{ color: C.gold }}>Win Big.</span>
          </h1>

          <p style={{
            fontSize: 16,
            color: C.text2,
            lineHeight: 1.8,
            marginBottom: 24,
            maxWidth: 700,
            margin: '0 auto 24px',
          }}>
            Partner with Edingrad on 80/20 commission — and spin the wheel on every closed deal. 
            Unlock premium rewards, exclusive perks, and life-changing prizes. The more you close, the more you win.
          </p>

          <button
            onClick={() => setShowForm(true)}
            style={{
              background: C.gold,
              color: '#000',
              border: 'none',
              padding: '16px 48px',
              fontSize: 14,
              fontWeight: 700,
              borderRadius: 6,
              cursor: 'pointer',
              fontFamily: "'DM Mono', monospace",
              letterSpacing: '0.1em',
              transition: 'all 0.3s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#DAB856'
              e.currentTarget.style.transform = 'translateY(-2px)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = C.gold
              e.currentTarget.style.transform = 'translateY(0)'
            }}
          >
            REGISTER YOUR INTEREST →
          </button>
        </div>
      </div>

      {/* 4 Features Section */}
      <div style={{ padding: '60px 40px', background: C.bg }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: 32,
          }}>
            <FeatureCard
              icon="💰"
              title="80/20 Commission"
              description="Keep 80% of your deal value. Transparent. Immediate. Rewarding. Scale your earnings with every closed deal."
            />
            <FeatureCard
              icon="🎡"
              title="Spin The Wheel"
              description="Every closed deal earns you bonus spins. Land on premium rewards, cash bonuses, or life-changing prizes."
            />
            <FeatureCard
              icon="🏆"
              title="Tiered Rewards"
              description="Bigger deals unlock bigger prize pools. Silver, Gold, Platinum tiers—each with exclusive perks and rewards."
            />
            <FeatureCard
              icon="📱"
              title="Real-Time Tracking"
              description="Monitor your deals, spins, and winnings instantly. Dashboard transparency. No hidden mechanics."
            />
          </div>
        </div>
      </div>

      {/* Commission Breakdown */}
      <div style={{ padding: '60px 40px', background: C.surface }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <h2 style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: 48,
              fontWeight: 900,
              marginBottom: 16,
            }}>
              Commission Structure
            </h2>
            <p style={{ color: C.text2, fontSize: 16 }}>
              Simple. Transparent. Life-changing.
            </p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr auto 1fr',
            gap: 32,
            alignItems: 'center',
            marginBottom: 48,
          }}>
            <div style={{
              background: C.surface2,
              border: `2px solid ${C.gold}`,
              borderRadius: 12,
              padding: 32,
              textAlign: 'center',
            }}>
              <div style={{ fontSize: 56, fontWeight: 900, color: C.gold, marginBottom: 8 }}>
                80%
              </div>
              <div style={{ fontSize: 14, color: C.text2, fontWeight: 600 }}>
                YOUR COMMISSION
              </div>
              <div style={{ fontSize: 12, color: C.text3, marginTop: 12 }}>
                You earn 80% of every deal value. Direct to your account.
              </div>
            </div>

            <div style={{ fontSize: 32, color: C.gold, fontWeight: 900 }}>
              +
            </div>

            <div style={{
              background: C.surface2,
              border: `2px solid ${C.borderGold}`,
              borderRadius: 12,
              padding: 32,
              textAlign: 'center',
            }}>
              <div style={{ fontSize: 56, fontWeight: 900, color: C.green, marginBottom: 8 }}>
                ∞
              </div>
              <div style={{ fontSize: 14, color: C.text2, fontWeight: 600 }}>
                SPINS & REWARDS
              </div>
              <div style={{ fontSize: 12, color: C.text3, marginTop: 12 }}>
                Every deal = free spins. Win prizes, travel, cash bonuses.
              </div>
            </div>
          </div>

          <div style={{
            background: C.surface2,
            border: `1px solid ${C.borderGold}`,
            borderRadius: 8,
            padding: 24,
            textAlign: 'center',
            fontSize: 14,
            color: C.text2,
            lineHeight: 1.8,
          }}>
            <span style={{ color: C.gold, fontWeight: 700 }}>Example:</span> Close a 100K deal → Earn 80K commission + spin the wheel → Win anything from travel packages to luxury watches to cash prizes.
          </div>
        </div>
      </div>

      {/* How It Works */}
      <div style={{ padding: '60px 40px', background: C.bg }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <h2 style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: 48,
              fontWeight: 900,
              marginBottom: 16,
            }}>
              How The Gamification Works
            </h2>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: 24,
          }}>
            <StepCard number="01" title="Close A Deal" description="Close a deal with our network partners." />
            <StepCard number="02" title="Earn Commission" description="Receive 80% of deal value instantly." />
            <StepCard number="03" title="Get Spins" description="Unlock 3 bonus spins per closed deal." />
            <StepCard number="04" title="Win Rewards" description="Spin the wheel and win premium prizes." />
          </div>
        </div>
      </div>

      {/* Dynamic Rewards Section */}
      {gifts.length > 0 && (
        <div style={{ padding: '60px 40px', background: C.surface }}>
          <div style={{ maxWidth: 1200, margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: 48 }}>
              <h2 style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: 48,
                fontWeight: 900,
                marginBottom: 16,
              }}>
                What You Can Win
              </h2>
              <p style={{ color: C.text2, fontSize: 16 }}>
                Premium rewards await. Spin to claim yours.
              </p>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: 24,
            }}>
              {gifts.map((gift) => (
                <RewardCard key={gift.id} gift={gift} />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Registration Form Modal */}
      {showForm && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 20,
          zIndex: 1000,
          overflowY: 'auto',
        }}>
          <div style={{
            background: C.surface,
            border: `1px solid ${C.borderGold}`,
            borderRadius: 8,
            padding: 40,
            maxWidth: 600,
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto',
          }}>
            <div style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: 32,
              fontWeight: 900,
              marginBottom: 12,
              color: C.text,
            }}>
              Register Your Interest
            </div>
            <p style={{ color: C.text2, fontSize: 13, marginBottom: 28 }}>
              Fill in your details and Edingrad will reach out to formalize the partnership.
            </p>

            <form onSubmit={handleRegister}>
              {/* Full Name */}
              <FormField
                label="FULL NAME *"
                placeholder="Your full name"
                type="text"
                value={formData.fullName}
                onChange={(value) => setFormData({ ...formData, fullName: value })}
              />

              {/* Email */}
              <FormField
                label="EMAIL ADDRESS *"
                placeholder="your@email.com"
                type="email"
                value={formData.email}
                onChange={(value) => setFormData({ ...formData, email: value })}
              />

              {/* Phone / WhatsApp */}
              <FormField
                label="PHONE / WHATSAPP *"
                placeholder="+971 50 XXX XXXX"
                type="tel"
                value={formData.phone}
                onChange={(value) => setFormData({ ...formData, phone: value })}
              />

              {/* Agency / Company */}
              <FormField
                label="AGENCY / COMPANY *"
                placeholder="Your brokerage name"
                type="text"
                value={formData.agency}
                onChange={(value) => setFormData({ ...formData, agency: value })}
              />

              {/* Message */}
              <div style={{ marginBottom: 24 }}>
                <label style={{
                  display: 'block',
                  fontSize: 12,
                  color: C.text2,
                  marginBottom: 8,
                  letterSpacing: '0.1em',
                  fontWeight: 600,
                }}>
                  MESSAGE (OPTIONAL)
                </label>
                <textarea
                  placeholder="Tell us about your market, typical deal size, or anything you'd like Edingrad to know..."
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  style={{
                    width: '100%',
                    background: C.surface2,
                    border: `1px solid ${C.border}`,
                    borderRadius: 6,
                    padding: 12,
                    color: C.text,
                    fontFamily: "'DM Mono', monospace",
                    fontSize: 13,
                    boxSizing: 'border-box',
                    minHeight: 100,
                    resize: 'vertical',
                    transition: 'border 0.3s',
                  }}
                  onFocus={(e) => e.target.style.borderColor = C.gold}
                  onBlur={(e) => e.target.style.borderColor = C.border}
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                style={{
                  width: '100%',
                  background: loading ? C.text3 : C.gold,
                  color: '#000',
                  border: 'none',
                  padding: 14,
                  fontSize: 13,
                  fontWeight: 700,
                  borderRadius: 6,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  fontFamily: "'DM Mono', monospace",
                  letterSpacing: '0.1em',
                  transition: 'all 0.3s',
                  marginBottom: 12,
                  opacity: loading ? 0.6 : 1,
                }}
                onMouseEnter={(e) => {
                  if (!loading) e.currentTarget.style.background = '#DAB856'
                }}
                onMouseLeave={(e) => {
                  if (!loading) e.currentTarget.style.background = C.gold
                }}
              >
                {loading ? 'SUBMITTING...' : 'SUBMIT APPLICATION →'}
              </button>

              {/* Cancel Button */}
              <button
                type="button"
                onClick={() => !loading && setShowForm(false)}
                disabled={loading}
                style={{
                  width: '100%',
                  background: 'transparent',
                  color: C.text2,
                  border: `1px solid ${C.border}`,
                  padding: 14,
                  fontSize: 13,
                  fontWeight: 600,
                  borderRadius: 6,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  fontFamily: "'DM Mono', monospace",
                  letterSpacing: '0.1em',
                  transition: 'all 0.3s',
                  opacity: loading ? 0.5 : 1,
                }}
                onMouseEnter={(e) => {
                  if (!loading) e.currentTarget.style.borderColor = C.gold
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = C.border
                }}
              >
                CANCEL
              </button>

              <p style={{
                color: C.text3,
                fontSize: 11,
                textAlign: 'center',
                marginTop: 16,
                lineHeight: 1.6,
              }}>
                By submitting you agree to be contacted by Edingrad Real Estate. No commitment until you sign the formal partnership agreement.
              </p>
            </form>
          </div>
        </div>
      )}

      {/* Footer */}
      <div style={{
        padding: '32px 40px',
        textAlign: 'center',
        borderTop: `1px solid ${C.border}`,
        color: C.text3,
        fontSize: 12,
      }}>
        © 2026 Edingrad Real Estate Brokers LLC · Licensed by RERA · Dubai, UAE
      </div>

      {/* Thank You Screen Modal */}
      {showThanks && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.9)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 20,
          zIndex: 2000,
        }}>
          <div style={{
            background: C.surface,
            border: `2px solid ${C.gold}`,
            borderRadius: 12,
            padding: 60,
            maxWidth: 600,
            width: '100%',
            textAlign: 'center',
          }}>
            <div style={{
              fontSize: 64,
              marginBottom: 24,
              animation: 'pulse 2s infinite',
            }}>
              🎉
            </div>

            <div style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: 40,
              fontWeight: 900,
              marginBottom: 16,
              color: C.gold,
            }}>
              Thank You!
            </div>

            <div style={{
              fontSize: 18,
              color: C.text,
              marginBottom: 24,
              lineHeight: 1.8,
            }}>
              Your registration with Edingrad has been received.
            </div>

            <div style={{
              background: C.surface2,
              border: `1px solid ${C.borderGold}`,
              borderRadius: 8,
              padding: 24,
              marginBottom: 24,
              textAlign: 'left',
            }}>
              <div style={{ fontSize: 14, color: C.text2, marginBottom: 16, fontWeight: 600 }}>
                📋 Here&apos;s What Happens Next:
              </div>
              <div style={{ fontSize: 13, color: C.text, lineHeight: 2 }}>
                <div style={{ marginBottom: 12 }}>
                  <span style={{ color: C.gold, fontWeight: 700 }}>1. Review</span> — Our team will review your application
                </div>
                <div style={{ marginBottom: 12 }}>
                  <span style={{ color: C.gold, fontWeight: 700 }}>2. Close Deals</span> — Start closing deals with our network
                </div>
                <div style={{ marginBottom: 12 }}>
                  <span style={{ color: C.gold, fontWeight: 700 }}>3. Earn Spins</span> — Each deal = multiple spins awarded
                </div>
                <div>
                  <span style={{ color: C.gold, fontWeight: 700 }}>4. Receive Link</span> — We&apos;ll send you your spin link via email/ whatsapp
                </div>
              </div>
            </div>

            <div style={{
              background: C.goldDim,
              borderRadius: 8,
              padding: 16,
              marginBottom: 24,
              fontSize: 13,
              color: C.text,
            }}>
              <span style={{ color: C.gold, fontWeight: 700 }}>💡 Pro Tip:</span> Keep an eye on your email for updates. Your spin link will be shared once your first deal is confirmed.
            </div>

            <button
              onClick={() => setShowThanks(false)}
              style={{
                width: '100%',
                background: C.gold,
                color: '#000',
                border: 'none',
                padding: 16,
                fontSize: 14,
                fontWeight: 700,
                borderRadius: 6,
                cursor: 'pointer',
                fontFamily: "'DM Mono', monospace",
                letterSpacing: '0.1em',
                transition: 'all 0.3s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#DAB856'
                e.currentTarget.style.transform = 'translateY(-2px)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = C.gold
                e.currentTarget.style.transform = 'translateY(0)'
              }}
            >
              BACK TO HOME
            </button>

            <div style={{
              color: C.text3,
              fontSize: 11,
              marginTop: 16,
            }}>
              Any questions? Contact us at support@edingrad.ae
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function FeatureCard({ icon, title, description }: { icon: string; title: string; description: string }) {
  return (
    <div style={{
      background: C.surface2,
      border: `1px solid ${C.border}`,
      borderRadius: 8,
      padding: 24,
      textAlign: 'center',
      transition: 'all 0.3s ease',
      cursor: 'pointer',
    }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = C.gold
        e.currentTarget.style.background = C.surface
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = C.border
        e.currentTarget.style.background = C.surface2
      }}
    >
      <div style={{ fontSize: 40, marginBottom: 12 }}>{icon}</div>
      <div style={{ fontSize: 16, fontWeight: 700, color: C.gold, marginBottom: 8 }}>
        {title}
      </div>
      <div style={{ fontSize: 13, color: C.text2, lineHeight: 1.6 }}>
        {description}
      </div>
    </div>
  )
}

function StepCard({ number, title, description }: { number: string; title: string; description: string }) {
  return (
    <div style={{
      background: C.surface2,
      border: `1px solid ${C.borderGold}`,
      borderRadius: 8,
      padding: 24,
      textAlign: 'center',
    }}>
      <div style={{
        fontSize: 32,
        fontWeight: 900,
        color: C.gold,
        marginBottom: 12,
      }}>
        {number}
      </div>
      <div style={{ fontSize: 16, fontWeight: 700, color: C.text, marginBottom: 8 }}>
        {title}
      </div>
      <div style={{ fontSize: 13, color: C.text3 }}>
        {description}
      </div>
    </div>
  )
}

function RewardCard({ gift }: { gift: Gift }) {
  return (
    <div style={{
      background: C.surface2,
      border: `1px solid ${C.border}`,
      borderRadius: 8,
      padding: 20,
      textAlign: 'center',
      transition: 'all 0.3s ease',
    }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = C.gold
        e.currentTarget.style.transform = 'translateY(-8px)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = C.border
        e.currentTarget.style.transform = 'translateY(0)'
      }}
    >
      <div style={{ fontSize: 48, marginBottom: 12 }}>
        {gift.emoji}
      </div>
      <div style={{ fontSize: 14, fontWeight: 700, color: C.gold, marginBottom: 6 }}>
        {gift.name}
      </div>
      {gift.value_aed && (
        <div style={{ fontSize: 12, color: C.green, fontWeight: 600, marginBottom: 8 }}>
          Worth AED {gift.value_aed.toLocaleString()}
        </div>
      )}
      {gift.description && (
        <div style={{ fontSize: 12, color: C.text3, lineHeight: 1.4 }}>
          {gift.description}
        </div>
      )}
    </div>
  )
}

function FormField({ label, placeholder, type, value, onChange }: {
  label: string
  placeholder: string
  type: string
  value: string
  onChange: (value: string) => void
}) {
  return (
    <div style={{ marginBottom: 20 }}>
      <label style={{
        display: 'block',
        fontSize: 12,
        color: C.text2,
        marginBottom: 8,
        letterSpacing: '0.1em',
        fontWeight: 600,
      }}>
        {label}
      </label>
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          width: '100%',
          background: C.surface2,
          border: `1px solid ${C.border}`,
          borderRadius: 6,
          padding: 12,
          color: C.text,
          fontFamily: "'DM Mono', monospace",
          fontSize: 13,
          boxSizing: 'border-box',
          transition: 'border 0.3s',
        }}
        onFocus={(e) => e.target.style.borderColor = C.gold}
        onBlur={(e) => e.target.style.borderColor = C.border}
      />
    </div>
  )
}
