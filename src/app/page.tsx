'use client'

// ─────────────────────────────────────────────────────────────
//  Capturo — Landing Page Completa
//  Substitui: src/app/page.tsx
//
//  Seções:
//   1. Header sticky glassmorphism
//   2. Hero — headline + CTA + badge animado
//   3. Teia de Conexões — canvas animado interativo
//   4. Como Funciona — 4 steps com linha de progresso
//   5. Features — grid 6 cards com hover 3D
//   6. Prova Social — métricas animadas + depoimentos
//   7. Planos — 3 pricing cards (free / pro / business)
//   8. FAQ — accordion animado
//   9. CTA Final — urgência + formulário de email
//  10. Footer
// ─────────────────────────────────────────────────────────────

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import {
  ArrowRight, MapPin, Zap, MessageSquare, BarChart3,
  CheckCircle2, Star, ChevronDown, Users, Target,
  TrendingUp, Brain, Radar, Send, Phone, Globe,
  Sparkles, Shield, Clock, Building2, LayoutDashboard
} from 'lucide-react'
import { createClient } from '@/utils/supabase/client'

// ── TEIA DE CONEXÕES ────────────────────────────────────────
function NetworkWeb() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const mouseRef = useRef({ x: -9999, y: -9999 })
  const animRef = useRef<number>(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let W = canvas.offsetWidth
    let H = canvas.offsetHeight
    canvas.width = W
    canvas.height = H

    const NODES_COUNT = 180
    const CONNECTION_DIST = 200
    const MOUSE_ATTRACT = 250

    type Node = {
      x: number; y: number; vx: number; vy: number
      r: number; pulse: number; pulseSpeed: number
      type: 'hub' | 'lead' | 'node'
      label?: string
    }

    const LABELS = [
      'Restaurante','Clínica','Academia','Loja','Escritório',
      'Salão','Hotel','Farmácia','Escola','Construtora',
      'Mercado','Barbearia','Padaria','Petshop','Studio',
      'Dentista','Advogado','Imobiliária','Mecânica','Bar',
    ]

    const nodes: Node[] = Array.from({ length: NODES_COUNT }, (_, i) => ({
      x: Math.random() * W,
      y: Math.random() * H,
      vx: (Math.random() - 0.5) * 0.35,
      vy: (Math.random() - 0.5) * 0.35,
      r: i < 5 ? 7 : i < 20 ? 4.5 : 2.5,
      pulse: Math.random() * Math.PI * 2,
      pulseSpeed: 0.02 + Math.random() * 0.02,
      type: i < 5 ? 'hub' : i < 20 ? 'lead' : 'node',
      label: i < 20 ? LABELS[i % LABELS.length] : undefined,
    }))

    // Cores
    const C_PRIMARY  = '#00E5FF'
    const C_GREEN    = '#00FFA3'
    const C_YELLOW   = '#FFD600'
    const C_DIM      = '#1E2D45'

    const NODE_COLORS = {
      hub:  C_PRIMARY,
      lead: C_GREEN,
      node: '#6B7FA8',
    }

    const handleMouse = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect()
      mouseRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top }
    }
    const handleLeave = () => { mouseRef.current = { x: -9999, y: -9999 } }
    canvas.addEventListener('mousemove', handleMouse)
    canvas.addEventListener('mouseleave', handleLeave)

    const resize = () => {
      W = canvas.offsetWidth; H = canvas.offsetHeight
      canvas.width = W; canvas.height = H
    }
    window.addEventListener('resize', resize)

    let t = 0
    const draw = () => {
      ctx.clearRect(0, 0, W, H)
      t++

      const mx = mouseRef.current.x
      const my = mouseRef.current.y

      // Update nodes
      for (const n of nodes) {
        n.pulse += n.pulseSpeed

        // Soft mouse attraction for lead nodes
        if (n.type !== 'hub') {
          const dx = mx - n.x, dy = my - n.y
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < MOUSE_ATTRACT) {
            n.vx += (dx / dist) * 0.04
            n.vy += (dy / dist) * 0.04
          }
        }

        n.vx *= 0.98; n.vy *= 0.98
        n.x += n.vx; n.y += n.vy

        // Bounce
        if (n.x < 0 || n.x > W) n.vx *= -1
        if (n.y < 0 || n.y > H) n.vy *= -1
        n.x = Math.max(0, Math.min(W, n.x))
        n.y = Math.max(0, Math.min(H, n.y))
      }

      // Draw connections
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const a = nodes[i], b = nodes[j]
          const dx = b.x - a.x, dy = b.y - a.y
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist > CONNECTION_DIST) continue

          const alpha = (1 - dist / CONNECTION_DIST) * 0.28
          const isSpecial = a.type !== 'node' || b.type !== 'node'

          // Gradient line
          const grad = ctx.createLinearGradient(a.x, a.y, b.x, b.y)
          const ca = isSpecial ? C_PRIMARY : C_DIM
          const cb = isSpecial ? C_GREEN   : C_DIM
          grad.addColorStop(0, `${ca}${Math.floor(alpha * 255).toString(16).padStart(2,'0')}`)
          grad.addColorStop(1, `${cb}${Math.floor(alpha * 255).toString(16).padStart(2,'0')}`)

          ctx.beginPath()
          ctx.strokeStyle = grad
          ctx.lineWidth = isSpecial ? 1 : 0.5
          ctx.moveTo(a.x, a.y)
          ctx.lineTo(b.x, b.y)
          ctx.stroke()

          // Animated data packet
          if (isSpecial && Math.random() < 0.002) {
            const progress = (t % 120) / 120
            const px = a.x + (b.x - a.x) * progress
            const py = a.y + (b.y - a.y) * progress
            ctx.beginPath()
            ctx.arc(px, py, 2, 0, Math.PI * 2)
            ctx.fillStyle = C_PRIMARY
            ctx.fill()
          }
        }
      }

      // Draw nodes
      for (const n of nodes) {
        const color = NODE_COLORS[n.type]
        const pulseFactor = 1 + Math.sin(n.pulse) * (n.type === 'hub' ? 0.3 : 0.15)
        const r = n.r * pulseFactor

        // Glow ring for hubs and leads
        if (n.type !== 'node') {
          const glowR = r * 3
          const grd = ctx.createRadialGradient(n.x, n.y, r, n.x, n.y, glowR)
          grd.addColorStop(0, `${color}40`)
          grd.addColorStop(1, `${color}00`)
          ctx.beginPath()
          ctx.arc(n.x, n.y, glowR, 0, Math.PI * 2)
          ctx.fillStyle = grd
          ctx.fill()
        }

        // Node circle
        ctx.beginPath()
        ctx.arc(n.x, n.y, r, 0, Math.PI * 2)
        ctx.fillStyle = color
        ctx.shadowBlur = n.type === 'hub' ? 16 : 8
        ctx.shadowColor = color
        ctx.fill()
        ctx.shadowBlur = 0

        // Inner bright dot
        ctx.beginPath()
        ctx.arc(n.x, n.y, r * 0.4, 0, Math.PI * 2)
        ctx.fillStyle = '#ffffff88'
        ctx.fill()

        // Label for lead nodes
        if (n.label) {
          ctx.font = '10px Geist, sans-serif'
          ctx.fillStyle = `${color}CC`
          ctx.textAlign = 'center'
          ctx.fillText(n.label, n.x, n.y - r - 6)
        }
      }

      // Score indicators near hub nodes
      nodes.slice(0, 5).forEach((n, i) => {
        const scores = [94, 87, 91, 88, 96]
        const score = scores[i]
        const scoreColor = score >= 90 ? C_PRIMARY : C_GREEN
        ctx.font = 'bold 11px Geist Mono, monospace'
        ctx.fillStyle = scoreColor
        ctx.textAlign = 'center'
        ctx.fillText(`${score}`, n.x + 16, n.y - 12)
      })

      animRef.current = requestAnimationFrame(draw)
    }

    draw()
    return () => {
      cancelAnimationFrame(animRef.current)
      canvas.removeEventListener('mousemove', handleMouse)
      canvas.removeEventListener('mouseleave', handleLeave)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full"
      style={{ display: 'block' }}
    />
  )
}

// ── COUNTER ANIMADO ──────────────────────────────────────────
function CountUp({ target, suffix = '', duration = 1800 }: { target: number; suffix?: string; duration?: number }) {
  const [val, setVal] = useState(0)
  const ref = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const obs = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return
      obs.disconnect()
      let start = 0
      const step = target / (duration / 16)
      const interval = setInterval(() => {
        start = Math.min(start + step, target)
        setVal(Math.floor(start))
        if (start >= target) clearInterval(interval)
      }, 16)
    }, { threshold: 0.5 })
    if (ref.current) obs.observe(ref.current)
    return () => obs.disconnect()
  }, [target, duration])

  return <span ref={ref}>{val.toLocaleString('pt-BR')}{suffix}</span>
}

// ── FAQ ITEM ─────────────────────────────────────────────────
function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div
      className="rounded-2xl overflow-hidden transition-all duration-300 cursor-pointer"
      style={{
        background: open ? 'rgba(0,229,255,0.04)' : 'rgba(13,20,32,0.8)',
        border: `1px solid ${open ? 'rgba(0,229,255,0.25)' : '#1E2D45'}`,
      }}
      onClick={() => setOpen(!open)}
    >
      <div className="flex items-center justify-between px-6 py-5 gap-4">
        <span className="font-semibold text-base" style={{ color: open ? '#00E5FF' : '#E2EAF4' }}>
          {q}
        </span>
        <ChevronDown
          className="h-5 w-5 shrink-0 transition-transform duration-300"
          style={{
            color: open ? '#00E5FF' : '#6B7FA8',
            transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
          }}
        />
      </div>
      <div
        className="overflow-hidden transition-all duration-300"
        style={{ maxHeight: open ? '300px' : '0px', opacity: open ? 1 : 0 }}
      >
        <p className="px-6 pb-5 text-sm leading-relaxed" style={{ color: '#6B7FA8' }}>{a}</p>
      </div>
    </div>
  )
}

// ── PRICING CARD ─────────────────────────────────────────────
function PricingCard({
  name, price, period, description, features, cta, highlight, badge,
}: {
  name: string; price: string; period: string; description: string
  features: string[]; cta: string; highlight?: boolean; badge?: string
}) {
  return (
    <div
      className="relative rounded-3xl p-8 flex flex-col transition-all duration-300 group"
      style={{
        background: highlight ? 'linear-gradient(145deg, #0D1F35, #0A1628)' : 'rgba(13,20,32,0.8)',
        border: highlight ? '1px solid rgba(0,229,255,0.4)' : '1px solid #1E2D45',
        boxShadow: highlight ? '0 0 60px rgba(0,229,255,0.12), inset 0 1px 0 rgba(0,229,255,0.1)' : 'none',
        transform: highlight ? 'scale(1.03)' : 'scale(1)',
      }}
      onMouseEnter={e => {
        if (!highlight) {
          (e.currentTarget as HTMLElement).style.borderColor = '#2D4060'
          ;(e.currentTarget as HTMLElement).style.transform = 'translateY(-4px)'
        }
      }}
      onMouseLeave={e => {
        if (!highlight) {
          (e.currentTarget as HTMLElement).style.borderColor = '#1E2D45'
          ;(e.currentTarget as HTMLElement).style.transform = 'translateY(0)'
        }
      }}
    >
      {/* Linha topo para o highlight */}
      {highlight && (
        <div
          className="absolute top-0 left-8 right-8 h-px"
          style={{ background: 'linear-gradient(90deg, transparent, #00E5FF, transparent)' }}
        />
      )}

      {badge && (
        <div
          className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider"
          style={{ background: 'linear-gradient(135deg, #00E5FF, #0066FF)', color: '#080C14' }}
        >
          {badge}
        </div>
      )}

      <div className="mb-6">
        <div className="text-sm font-bold uppercase tracking-widest mb-2" style={{ color: highlight ? '#00E5FF' : '#6B7FA8' }}>
          {name}
        </div>
        <div className="flex items-end gap-1 mb-2">
          <span className="text-4xl font-black" style={{ color: '#E2EAF4' }}>{price}</span>
          <span className="text-sm mb-1.5" style={{ color: '#6B7FA8' }}>{period}</span>
        </div>
        <p className="text-sm" style={{ color: '#6B7FA8' }}>{description}</p>
      </div>

      <ul className="flex-1 space-y-3 mb-8">
        {features.map((f, i) => (
          <li key={i} className="flex items-start gap-3 text-sm">
            <CheckCircle2
              className="h-4 w-4 mt-0.5 shrink-0"
              style={{ color: highlight ? '#00E5FF' : '#00FFA3' }}
            />
            <span style={{ color: '#A8B8CC' }}>{f}</span>
          </li>
        ))}
      </ul>

      <Link href="/signup">
        <button
          className="w-full h-12 rounded-xl font-bold text-sm transition-all duration-200"
          style={
            highlight
              ? {
                  background: 'linear-gradient(135deg, #00E5FF, #0066FF)',
                  color: '#080C14',
                  boxShadow: '0 4px 24px rgba(0,229,255,0.3)',
                }
              : {
                  background: 'transparent',
                  color: '#E2EAF4',
                  border: '1px solid #1E2D45',
                }
          }
          onMouseEnter={e => {
            if (!highlight) {
              (e.currentTarget as HTMLElement).style.borderColor = '#00E5FF'
              ;(e.currentTarget as HTMLElement).style.color = '#00E5FF'
            } else {
              (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)'
              ;(e.currentTarget as HTMLElement).style.boxShadow = '0 8px 32px rgba(0,229,255,0.4)'
            }
          }}
          onMouseLeave={e => {
            if (!highlight) {
              (e.currentTarget as HTMLElement).style.borderColor = '#1E2D45'
              ;(e.currentTarget as HTMLElement).style.color = '#E2EAF4'
            } else {
              (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'
              ;(e.currentTarget as HTMLElement).style.boxShadow = '0 4px 24px rgba(0,229,255,0.3)'
            }
          }}
        >
          {cta}
        </button>
      </Link>
    </div>
  )
}

// ── MAIN PAGE ────────────────────────────────────────────────
export default function LandingPage() {
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user)
    })

    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (email) setSubmitted(true)
  }

  return (
    <div
      className="flex flex-col min-h-screen"
      style={{ background: '#080C14', color: '#E2EAF4', fontFamily: 'Geist, system-ui, sans-serif' }}
    >
      {/* ── RADIAL GLOW DE FUNDO ──────────────────────── */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 80% 50% at 10% 0%, rgba(0,229,255,0.06) 0%, transparent 60%), radial-gradient(ellipse 60% 40% at 90% 100%, rgba(0,255,163,0.04) 0%, transparent 60%)',
          zIndex: 0,
        }}
      />

      {/* ═══════════════════════════════════════════════
          1. HEADER
      ═══════════════════════════════════════════════ */}
      <header
        className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
        style={{
          background: scrolled ? 'rgba(8,12,20,0.85)' : 'transparent',
          backdropFilter: scrolled ? 'blur(20px)' : 'none',
          borderBottom: scrolled ? '1px solid rgba(30,45,69,0.8)' : '1px solid transparent',
        }}
      >
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 transition-transform hover:scale-105">
            <img src="/capturo.png" alt="Capturo Logo" className="h-9 w-auto object-contain" />
          </Link>

          {/* Nav */}
          <nav className="hidden md:flex items-center gap-8">
            {[
              ['#como-funciona', 'Como funciona'],
              ['#funcionalidades', 'Funcionalidades'],
              ['#planos', 'Planos'],
              ['#faq', 'FAQ'],
            ].map(([href, label]) => (
              <a
                key={href}
                href={href}
                className="text-sm font-medium transition-colors"
                style={{ color: '#6B7FA8' }}
                onMouseEnter={e => ((e.target as HTMLElement).style.color = '#E2EAF4')}
                onMouseLeave={e => ((e.target as HTMLElement).style.color = '#6B7FA8')}
              >
                {label}
              </a>
            ))}
          </nav>

          {/* CTA Header */}
          <div className="flex items-center gap-3">
            {user ? (
              <Link href="/dashboard">
                <button
                  className="group flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-bold transition-all duration-200"
                  style={{
                    background: 'linear-gradient(135deg, #00E5FF, #0066FF)',
                    color: '#080C14',
                    boxShadow: '0 4px 16px rgba(0,229,255,0.25)',
                  }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLElement).style.boxShadow = '0 6px 24px rgba(0,229,255,0.4)'
                    ;(e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)'
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 16px rgba(0,229,255,0.25)'
                    ;(e.currentTarget as HTMLElement).style.transform = 'translateY(0)'
                  }}
                >
                  <LayoutDashboard className="h-4 w-4" />
                  Acessar Painel
                </button>
              </Link>
            ) : (
              <>
                <Link href="/login">
                  <button
                    className="text-sm font-medium px-4 py-2 rounded-lg transition-colors"
                    style={{ color: '#6B7FA8' }}
                    onMouseEnter={e => ((e.target as HTMLElement).style.color = '#E2EAF4')}
                    onMouseLeave={e => ((e.target as HTMLElement).style.color = '#6B7FA8')}
                  >
                    Entrar
                  </button>
                </Link>
                <Link href="/signup">
                  <button
                    className="px-5 py-2 rounded-xl text-sm font-bold transition-all duration-200"
                    style={{
                      background: 'linear-gradient(135deg, #00E5FF, #0066FF)',
                      color: '#080C14',
                      boxShadow: '0 4px 16px rgba(0,229,255,0.25)',
                    }}
                    onMouseEnter={e => {
                      (e.currentTarget as HTMLElement).style.boxShadow = '0 6px 24px rgba(0,229,255,0.4)'
                      ;(e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)'
                    }}
                    onMouseLeave={e => {
                      (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 16px rgba(0,229,255,0.25)'
                      ;(e.currentTarget as HTMLElement).style.transform = 'translateY(0)'
                    }}
                  >
                    Começar grátis
                  </button>
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 relative z-10">

        {/* ═══════════════════════════════════════════════
            2. HERO
        ═══════════════════════════════════════════════ */}
        <section className="pt-36 pb-20 px-6">
          <div className="max-w-5xl mx-auto text-center">

            {/* Badge animado */}
            <div
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider mb-8"
              style={{
                background: 'rgba(0,229,255,0.08)',
                border: '1px solid rgba(0,229,255,0.2)',
                color: '#00E5FF',
                animation: 'fadeIn 0.6s ease',
              }}
            >
              <span
                className="w-2 h-2 rounded-full"
                style={{ background: '#00FFA3', boxShadow: '0 0 8px #00FFA3', animation: 'pulse 2s infinite' }}
              />
              IA + Google Maps + WhatsApp — tudo em um lugar
            </div>

            {/* Headline */}
            <h1
              className="text-5xl md:text-6xl lg:text-7xl font-black tracking-tight leading-none mb-6"
              style={{ animation: 'fadeIn 0.8s ease 0.1s both' }}
            >
              Encontre{' '}
              <span
                style={{
                  background: 'linear-gradient(135deg, #00E5FF, #0066FF)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                clientes ideais
              </span>
              <br />
              enquanto você dorme.
            </h1>

            {/* Subheadline */}
            <p
              className="text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed"
              style={{ color: '#6B7FA8', animation: 'fadeIn 0.8s ease 0.2s both' }}
            >
              O Capturo descobre estabelecimentos no Google Maps, qualifica cada um com IA,
              gera mensagens personalizadas e envia via WhatsApp — tudo no piloto automático.
            </p>

            {/* CTAs */}
            <div
              className="flex flex-col sm:flex-row items-center justify-center gap-4"
              style={{ animation: 'fadeIn 0.8s ease 0.3s both' }}
            >
              <Link href="/signup">
                <button
                  className="group flex items-center gap-2 h-14 px-8 rounded-2xl font-bold text-base transition-all duration-200"
                  style={{
                    background: 'linear-gradient(135deg, #00E5FF, #0066FF)',
                    color: '#080C14',
                    boxShadow: '0 8px 32px rgba(0,229,255,0.3)',
                  }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'
                    ;(e.currentTarget as HTMLElement).style.boxShadow = '0 12px 40px rgba(0,229,255,0.45)'
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'
                    ;(e.currentTarget as HTMLElement).style.boxShadow = '0 8px 32px rgba(0,229,255,0.3)'
                  }}
                >
                  Começar grátis agora
                  <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                </button>
              </Link>
              <a
                href="#como-funciona"
                className="flex items-center gap-2 h-14 px-8 rounded-2xl font-semibold text-base transition-all duration-200"
                style={{
                  background: 'transparent',
                  color: '#A8B8CC',
                  border: '1px solid #1E2D45',
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLElement).style.borderColor = '#2D4060'
                  ;(e.currentTarget as HTMLElement).style.color = '#E2EAF4'
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.borderColor = '#1E2D45'
                  ;(e.currentTarget as HTMLElement).style.color = '#A8B8CC'
                }}
              >
                Ver como funciona
              </a>
            </div>

            {/* Trust line */}
            <p className="mt-6 text-xs" style={{ color: '#3D4F6E' }}>
              ✓ Grátis para começar &nbsp;·&nbsp; ✓ Sem cartão de crédito &nbsp;·&nbsp; ✓ Setup em 5 minutos
            </p>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════
            3. TEIA DE CONEXÕES — FULL PAGE
        ═══════════════════════════════════════════════ */}
        <section
          className="relative w-full overflow-hidden"
          id="rede"
          style={{
            height: '100vh',
            background: '#080C14',
          }}
        >
          {/* Canvas full-screen */}
          <NetworkWeb />

          {/* Overlay gradient topo */}
          <div
            className="absolute inset-x-0 top-0 h-32 pointer-events-none"
            style={{ background: 'linear-gradient(to bottom, #080C14, transparent)' }}
          />

          {/* Overlay gradient base */}
          <div
            className="absolute inset-x-0 bottom-0 h-32 pointer-events-none"
            style={{ background: 'linear-gradient(to top, #080C14, transparent)' }}
          />

          {/* Título centralizado */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: '#00E5FF' }}>
              Rede de Prospecção em Tempo Real
            </p>
            <h2
              className="text-4xl md:text-6xl font-black tracking-tight text-center px-6"
              style={{
                background: 'linear-gradient(135deg, #E2EAF4 0%, #00E5FF 50%, #00FFA3 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                textShadow: 'none',
              }}
            >
              Leads conectados.<br />Resultados reais.
            </h2>
            <p className="mt-4 text-sm" style={{ color: '#3D4F6E' }}>
              Passe o mouse para interagir com os leads
            </p>
          </div>

          {/* Legenda overlay — canto inferior esquerdo */}
          <div
            className="absolute bottom-8 left-8 flex items-center gap-6 px-4 py-2.5 rounded-xl text-xs"
            style={{ background: 'rgba(8,12,20,0.85)', border: '1px solid #1E2D45', backdropFilter: 'blur(12px)' }}
          >
            {[
              { color: '#00E5FF', label: 'Hub de IA' },
              { color: '#00FFA3', label: 'Lead qualificado' },
              { color: '#6B7FA8', label: 'Estabelecimento' },
            ].map(({ color, label }) => (
              <div key={label} className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full" style={{ background: color, boxShadow: `0 0 6px ${color}` }} />
                <span style={{ color: '#6B7FA8' }}>{label}</span>
              </div>
            ))}
          </div>

          {/* Score badge — canto superior direito */}
          <div
            className="absolute top-8 right-8 px-3 py-2 rounded-xl text-xs font-bold"
            style={{ background: 'rgba(0,229,255,0.08)', border: '1px solid rgba(0,229,255,0.2)', color: '#00E5FF' }}
          >
            <span className="text-lg font-black">247</span> leads ativos agora
          </div>
        </section>

        {/* ═══════════════════════════════════════════════
            4. COMO FUNCIONA — 4 STEPS
        ═══════════════════════════════════════════════ */}
        <section className="py-24 px-6" id="como-funciona">
          <div className="max-w-5xl mx-auto">

            <div className="text-center mb-16">
              <div className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: '#00E5FF' }}>
                Como funciona
              </div>
              <h2 className="text-4xl md:text-5xl font-black tracking-tight">
                De zero a lead qualificado{' '}
                <br />
                <span style={{ color: '#00E5FF' }}>em 4 passos.</span>
              </h2>
            </div>

            <div className="relative">
              {/* Linha conectora */}
              <div
                className="hidden md:block absolute top-12 left-[12.5%] right-[12.5%] h-px"
                style={{ background: 'linear-gradient(90deg, transparent, #1E2D45 20%, #00E5FF44 50%, #1E2D45 80%, transparent)' }}
              />

              <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                {[
                  {
                    step: '01', icon: Building2, color: '#00E5FF',
                    title: 'Cadastre seu negócio',
                    desc: 'Descreva sua empresa e produtos. A IA aprende seu ICP e cria o perfil de cliente ideal automaticamente.',
                  },
                  {
                    step: '02', icon: MapPin, color: '#00FFA3',
                    title: 'Selecione a região',
                    desc: 'Escolha o bairro ou cidade no mapa. O agente varre o Google Maps e encontra todos os estabelecimentos do nicho.',
                  },
                  {
                    step: '03', icon: Brain, color: '#FFD600',
                    title: 'IA qualifica os leads',
                    desc: 'Cada lead recebe um score de 0–100. Apenas os melhores perfis chegam ao seu pipeline.',
                  },
                  {
                    step: '04', icon: Send, color: '#A855F7',
                    title: 'Mensagem & contato',
                    desc: 'Uma mensagem única é gerada para cada lead e enviada via WhatsApp ou e-mail no tom certo.',
                  },
                ].map(({ step, icon: Icon, color, title, desc }) => (
                  <div key={step} className="flex flex-col items-center text-center group">
                    <div
                      className="relative w-24 h-24 rounded-2xl flex items-center justify-center mb-6 transition-all duration-300 group-hover:scale-110"
                      style={{
                        background: `${color}12`,
                        border: `1px solid ${color}30`,
                        boxShadow: `0 0 0 0 ${color}20`,
                      }}
                      onMouseEnter={e => {
                        (e.currentTarget as HTMLElement).style.boxShadow = `0 0 30px ${color}30`
                      }}
                      onMouseLeave={e => {
                        (e.currentTarget as HTMLElement).style.boxShadow = `0 0 0 0 ${color}20`
                      }}
                    >
                      <div
                        className="absolute -top-3 -right-3 w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-black"
                        style={{ background: color, color: '#080C14' }}
                      >
                        {step}
                      </div>
                      <Icon className="h-10 w-10" style={{ color }} />
                    </div>
                    <h3 className="font-bold text-base mb-2" style={{ color: '#E2EAF4' }}>{title}</h3>
                    <p className="text-sm leading-relaxed" style={{ color: '#6B7FA8' }}>{desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════
            5. FUNCIONALIDADES — 6 CARDS
        ═══════════════════════════════════════════════ */}
        <section
          className="py-24 px-6"
          id="funcionalidades"
          style={{ background: 'linear-gradient(180deg, transparent, rgba(13,20,32,0.5), transparent)' }}
        >
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <div className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: '#00E5FF' }}>
                Funcionalidades
              </div>
              <h2 className="text-4xl md:text-5xl font-black tracking-tight">
                Tudo que você precisa para{' '}
                <span style={{ color: '#00E5FF' }}>escalar vendas.</span>
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                {
                  icon: Radar, color: '#00E5FF',
                  title: 'Prospecção Geográfica',
                  desc: 'Busca por raio no Google Maps com filtros de nicho, avaliação mínima e status de operação. Dados enriquecidos com telefone e website.',
                  tag: 'Google Maps API',
                },
                {
                  icon: Brain, color: '#00FFA3',
                  title: 'Score IA por Lead',
                  desc: 'Claude analisa cada estabelecimento contra seu ICP e atribui score 0–100 com tier A/B/C/D e justificativa em português.',
                  tag: 'Claude Sonnet',
                },
                {
                  icon: MessageSquare, color: '#FFD600',
                  title: 'Mensagem Personalizada',
                  desc: 'Cada mensagem menciona o nome do negócio, localização e dor específica. Nunca um template genérico. Funciona para WhatsApp e e-mail.',
                  tag: 'IA Generativa',
                },
                {
                  icon: Phone, color: '#A855F7',
                  title: 'Envio via WhatsApp',
                  desc: 'Integração com Evolution API para envio real de mensagens. Tracking de entrega, leitura e resposta com movimentação automática no Kanban.',
                  tag: 'Evolution API',
                },
                {
                  icon: BarChart3, color: '#FF4D6D',
                  title: 'Pipeline Kanban',
                  desc: 'Funil visual drag & drop com estágios personalizáveis. Histórico completo de interações, notas e tarefas por lead.',
                  tag: 'CRM Integrado',
                },
                {
                  icon: Sparkles, color: '#00E5FF',
                  title: 'Agente de Chat IA',
                  desc: 'Chat assistido por IA para cada lead. O agente conhece seu negócio, o histórico do contato e sugere o próximo passo ideal.',
                  tag: 'Claude Chat',
                },
              ].map(({ icon: Icon, color, title, desc, tag }, i) => (
                <div
                  key={title}
                  className="group relative rounded-2xl p-6 transition-all duration-300 overflow-hidden"
                  style={{
                    background: 'rgba(13,20,32,0.8)',
                    border: '1px solid #1E2D45',
                    animation: `fadeIn 0.5s ease ${i * 80}ms both`,
                  }}
                  onMouseEnter={e => {
                    const el = e.currentTarget as HTMLElement
                    el.style.borderColor = `${color}40`
                    el.style.transform = 'translateY(-4px)'
                    el.style.boxShadow = `0 16px 40px rgba(0,0,0,0.3), 0 0 0 1px ${color}20`
                  }}
                  onMouseLeave={e => {
                    const el = e.currentTarget as HTMLElement
                    el.style.borderColor = '#1E2D45'
                    el.style.transform = 'translateY(0)'
                    el.style.boxShadow = 'none'
                  }}
                >
                  {/* Glow corner */}
                  <div
                    className="absolute -top-10 -right-10 w-32 h-32 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                    style={{ background: `radial-gradient(circle, ${color}10 0%, transparent 70%)` }}
                  />

                  <div className="relative z-10">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-transform duration-300 group-hover:scale-110"
                      style={{ background: `${color}15`, border: `1px solid ${color}25` }}
                    >
                      <Icon className="h-6 w-6" style={{ color }} />
                    </div>
                    <div
                      className="inline-block px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider mb-3"
                      style={{ background: `${color}10`, color, border: `1px solid ${color}20` }}
                    >
                      {tag}
                    </div>
                    <h3 className="font-bold text-base mb-2" style={{ color: '#E2EAF4' }}>{title}</h3>
                    <p className="text-sm leading-relaxed" style={{ color: '#6B7FA8' }}>{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════
            6. MÉTRICAS + DEPOIMENTOS
        ═══════════════════════════════════════════════ */}
        <section className="py-24 px-6">
          <div className="max-w-6xl mx-auto">

            {/* Métricas */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-20">
              {[
                { value: 12400, suffix: '+', label: 'Leads gerados', color: '#00E5FF' },
                { value: 94,    suffix: '%', label: 'Taxa de entrega', color: '#00FFA3' },
                { value: 3.8,   suffix: 'x', label: 'ROI médio',       color: '#FFD600', isFloat: true },
                { value: 5,     suffix: 'min', label: 'Até 1º contato', color: '#A855F7' },
              ].map(({ value, suffix, label, color, isFloat }) => (
                <div
                  key={label}
                  className="rounded-2xl p-6 text-center"
                  style={{ background: 'rgba(13,20,32,0.8)', border: '1px solid #1E2D45' }}
                >
                  <div
                    className="text-4xl font-black mb-1 tabular-nums"
                    style={{ color, fontVariantNumeric: 'tabular-nums' }}
                  >
                    {isFloat ? `${value}${suffix}` : <><CountUp target={value as number} suffix={suffix} /></>}
                  </div>
                  <div className="text-sm" style={{ color: '#6B7FA8' }}>{label}</div>
                </div>
              ))}
            </div>

            {/* Depoimentos */}
            <div className="text-center mb-12">
              <h2 className="text-3xl font-black">O que os usuários dizem</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                {
                  name: 'Marcos Oliveira', role: 'Agência de Marketing, SP',
                  text: 'Em 1 semana o Capturo gerou mais leads do que 3 meses de prospecção manual. A personalização das mensagens é absurda — ninguém percebe que é automático.',
                  score: 5,
                },
                {
                  name: 'Ana Paula Ramos', role: 'Consultora B2B, Campinas',
                  text: 'Finalmente uma ferramenta que entende o meu ICP de verdade. O score da IA é preciso — todos os leads que chegam como "A" realmente têm potencial de compra.',
                  score: 5,
                },
                {
                  name: 'Pedro Mendes', role: 'Startup SaaS, BH',
                  text: 'Rodamos uma campanha de 200 leads em 2 horas. O ROI no primeiro mês pagou o ano inteiro. Vale cada centavo, literalmente.',
                  score: 5,
                },
              ].map(({ name, role, text, score }) => (
                <div
                  key={name}
                  className="rounded-2xl p-6"
                  style={{
                    background: 'rgba(13,20,32,0.8)',
                    border: '1px solid #1E2D45',
                  }}
                >
                  <div className="flex gap-0.5 mb-4">
                    {Array.from({ length: score }).map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-current" style={{ color: '#FFD600' }} />
                    ))}
                  </div>
                  <p className="text-sm leading-relaxed mb-5" style={{ color: '#A8B8CC' }}>
                    &ldquo;{text}&rdquo;
                  </p>
                  <div className="flex items-center gap-3">
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold"
                      style={{
                        background: 'linear-gradient(135deg, rgba(0,229,255,0.2), rgba(0,102,255,0.2))',
                        border: '1px solid rgba(0,229,255,0.2)',
                        color: '#00E5FF',
                      }}
                    >
                      {name[0]}
                    </div>
                    <div>
                      <div className="text-sm font-bold" style={{ color: '#E2EAF4' }}>{name}</div>
                      <div className="text-xs" style={{ color: '#6B7FA8' }}>{role}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════
            7. PLANOS
        ═══════════════════════════════════════════════ */}
        <section
          className="py-24 px-6"
          id="planos"
          style={{ background: 'linear-gradient(180deg, transparent, rgba(0,229,255,0.02), transparent)' }}
        >
          <div className="max-w-5xl mx-auto">

            <div className="text-center mb-16">
              <div className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: '#00E5FF' }}>
                Planos & Preços
              </div>
              <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-4">
                Escale no seu ritmo.
              </h2>
              <p className="text-base" style={{ color: '#6B7FA8' }}>
                Comece grátis. Sem cartão. Faça upgrade quando estiver pronto.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
              <PricingCard
                name="Starter"
                price="Grátis"
                period=""
                description="Para começar a prospectar sem risco."
                features={[
                  '100 leads / mês',
                  'Score IA básico',
                  'Pipeline Kanban',
                  '1 campanha ativa',
                  'Link WhatsApp manual',
                  'Suporte por e-mail',
                ]}
                cta="Começar grátis"
              />
              <PricingCard
                name="Pro"
                price="R$ 197"
                period="/mês"
                description="Para quem quer resultados em escala."
                features={[
                  '500 leads / mês',
                  'Score + tier A/B/C/D',
                  'Mensagens IA personalizadas',
                  'Envio real via WhatsApp',
                  'Campanhas ilimitadas',
                  'Chat IA por lead',
                  'Analytics de funil',
                  'Suporte prioritário',
                ]}
                cta="Assinar Pro"
                highlight
                badge="Mais popular"
              />
              <PricingCard
                name="Business"
                price="R$ 397"
                period="/mês"
                description="Para times e operações de alto volume."
                features={[
                  'Leads ilimitados',
                  'Todos os recursos Pro',
                  'Envio de e-mail (Resend)',
                  'Sequências de follow-up',
                  'Multi-usuário (5 assentos)',
                  'API pública',
                  'Onboarding dedicado',
                  'SLA de suporte 24h',
                ]}
                cta="Falar com vendas"
              />
            </div>

            {/* Garantia */}
            <div
              className="mt-10 text-center py-5 rounded-2xl flex items-center justify-center gap-3"
              style={{ background: 'rgba(0,255,163,0.04)', border: '1px solid rgba(0,255,163,0.15)' }}
            >
              <Shield className="h-5 w-5" style={{ color: '#00FFA3' }} />
              <span className="text-sm font-medium" style={{ color: '#00FFA3' }}>
                Garantia de 7 dias — se não gostar, devolvemos 100% sem perguntas.
              </span>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════
            8. FAQ
        ═══════════════════════════════════════════════ */}
        <section className="py-24 px-6" id="faq">
          <div className="max-w-3xl mx-auto">

            <div className="text-center mb-16">
              <div className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: '#00E5FF' }}>
                Perguntas frequentes
              </div>
              <h2 className="text-4xl font-black tracking-tight">Ainda tem dúvidas?</h2>
            </div>

            <div className="space-y-3">
              {[
                {
                  q: 'Como a IA aprende sobre o meu negócio?',
                  a: 'No onboarding você descreve seus serviços, público-alvo e diferenciais. Pode também colar a URL do seu site ou fazer upload de um PDF. A IA da Anthropic (Claude) processa tudo e cria um perfil de ICP estruturado que guia toda a prospecção.',
                },
                {
                  q: 'O WhatsApp não vai ser bloqueado?',
                  a: 'O Capturo usa a Evolution API com envio humanizado — delays variáveis entre mensagens e simulação de digitação. Além disso, cada mensagem é única e personalizada, o que reduz drasticamente o risco de banimento. Recomendamos usar um número dedicado à prospecção.',
                },
                {
                  q: 'Os dados do Google Maps são confiáveis?',
                  a: 'Sim. Usamos diretamente a Google Places API (a mesma do Google Maps), que é atualizada em tempo real. Cada lead vem com nome, endereço, telefone, avaliação, número de reviews e website quando disponível.',
                },
                {
                  q: 'Posso usar para qualquer nicho?',
                  a: 'Sim. O sistema funciona para qualquer segmento que tenha estabelecimentos cadastrados no Google Maps — restaurantes, clínicas, academias, escritórios, lojas, hotéis e muito mais. O ICP é completamente customizável para o seu negócio.',
                },
                {
                  q: 'Quanto tempo leva para ter o primeiro lead contatado?',
                  a: 'Com as chaves de API configuradas, você pode fazer a primeira prospecção em menos de 5 minutos após o cadastro. O processo completo — busca, scoring, geração de mensagem e envio — é automatizado e leva menos de 30 minutos para uma campanha de 50 leads.',
                },
                {
                  q: 'Preciso saber programar para usar?',
                  a: 'Não. O Capturo é uma plataforma no-code. Toda a configuração é feita através de uma interface visual. O setup das chaves de API (Google Maps e WhatsApp) leva cerca de 15 minutos e temos um guia passo a passo em português.',
                },
                {
                  q: 'Posso cancelar a qualquer momento?',
                  a: 'Sim, sem burocracia. Você cancela pela própria dashboard e o acesso continua até o fim do período pago. Sem multas, sem letras miúdas.',
                },
              ].map(({ q, a }) => (
                <FaqItem key={q} q={q} a={a} />
              ))}
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════
            9. CTA FINAL
        ═══════════════════════════════════════════════ */}
        <section className="py-24 px-6">
          <div className="max-w-3xl mx-auto">
            <div
              className="relative rounded-3xl p-12 text-center overflow-hidden"
              style={{
                background: 'linear-gradient(145deg, #0D1F35, #0A1628)',
                border: '1px solid rgba(0,229,255,0.2)',
                boxShadow: '0 0 80px rgba(0,229,255,0.08)',
              }}
            >
              {/* Glow interno */}
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  background: 'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(0,229,255,0.08) 0%, transparent 70%)',
                }}
              />
              <div
                className="absolute top-0 left-0 right-0 h-px"
                style={{ background: 'linear-gradient(90deg, transparent, rgba(0,229,255,0.5), transparent)' }}
              />

              <div className="relative z-10">
                <div
                  className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider mb-6"
                  style={{ background: 'rgba(0,229,255,0.1)', border: '1px solid rgba(0,229,255,0.2)', color: '#00E5FF' }}
                >
                  <Clock className="h-3 w-3" />
                  Comece hoje — resultados em 24h
                </div>

                <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-4">
                  Sua próxima venda{' '}
                  <span style={{ color: '#00E5FF' }}>já está no mapa.</span>
                </h2>
                <p className="text-base mb-8 max-w-lg mx-auto" style={{ color: '#6B7FA8' }}>
                  Junte-se a centenas de profissionais que já substituíram a prospecção manual pelo Capturo.
                  Grátis para começar.
                </p>

                {!submitted ? (
                  <form onSubmit={handleEmailSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto mb-6">
                    <input
                      type="email"
                      placeholder="Seu melhor e-mail"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      required
                      className="flex-1 h-12 px-4 rounded-xl text-sm outline-none"
                      style={{
                        background: 'rgba(30,45,69,0.8)',
                        border: '1px solid #1E2D45',
                        color: '#E2EAF4',
                      }}
                      onFocus={e => {
                        e.target.style.borderColor = '#00E5FF'
                        e.target.style.boxShadow = '0 0 0 3px rgba(0,229,255,0.1)'
                      }}
                      onBlur={e => {
                        e.target.style.borderColor = '#1E2D45'
                        e.target.style.boxShadow = 'none'
                      }}
                    />
                    <button
                      type="submit"
                      className="h-12 px-6 rounded-xl font-bold text-sm whitespace-nowrap transition-all duration-200"
                      style={{
                        background: 'linear-gradient(135deg, #00E5FF, #0066FF)',
                        color: '#080C14',
                        boxShadow: '0 4px 20px rgba(0,229,255,0.3)',
                      }}
                      onMouseEnter={e => {
                        (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)'
                        ;(e.currentTarget as HTMLElement).style.boxShadow = '0 8px 28px rgba(0,229,255,0.4)'
                      }}
                      onMouseLeave={e => {
                        (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'
                        ;(e.currentTarget as HTMLElement).style.boxShadow = '0 4px 20px rgba(0,229,255,0.3)'
                      }}
                    >
                      Criar conta grátis →
                    </button>
                  </form>
                ) : (
                  <div
                    className="flex items-center justify-center gap-3 h-12 rounded-xl mb-6 max-w-md mx-auto"
                    style={{ background: 'rgba(0,255,163,0.08)', border: '1px solid rgba(0,255,163,0.25)' }}
                  >
                    <CheckCircle2 className="h-5 w-5" style={{ color: '#00FFA3' }} />
                    <span className="font-semibold text-sm" style={{ color: '#00FFA3' }}>
                      Perfeito! Acesse o link que enviamos para {email}
                    </span>
                  </div>
                )}

                <div className="flex items-center justify-center gap-6 flex-wrap">
                  {[
                    { icon: Shield,    text: 'Sem cartão de crédito' },
                    { icon: Clock,     text: 'Setup em 5 minutos' },
                    { icon: Users,     text: '100 leads grátis' },
                  ].map(({ icon: Icon, text }) => (
                    <div key={text} className="flex items-center gap-2 text-xs" style={{ color: '#6B7FA8' }}>
                      <Icon className="h-3.5 w-3.5" style={{ color: '#00FFA3' }} />
                      {text}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* ═══════════════════════════════════════════════
          10. FOOTER
      ═══════════════════════════════════════════════ */}
      <footer
        className="py-12 px-6 relative z-10"
        style={{ borderTop: '1px solid #1E2D45' }}
      >
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            {/* Logo */}
            <div className="flex items-center gap-2.5">
              <img src="/capturo.png" alt="Capturo Logo" className="h-7 w-auto object-contain" />
            </div>

            {/* Links */}
            <div className="flex flex-wrap items-center justify-center gap-6">
              {[
                ['#como-funciona', 'Como funciona'],
                ['#planos', 'Preços'],
                ['#faq', 'FAQ'],
                ['/login', 'Entrar'],
                ['/signup', 'Cadastrar'],
              ].map(([href, label]) => (
                <a
                  key={href}
                  href={href}
                  className="text-xs transition-colors"
                  style={{ color: '#6B7FA8' }}
                  onMouseEnter={e => ((e.target as HTMLElement).style.color = '#E2EAF4')}
                  onMouseLeave={e => ((e.target as HTMLElement).style.color = '#6B7FA8')}
                >
                  {label}
                </a>
              ))}
            </div>

            {/* Copyright */}
            <p className="text-xs" style={{ color: '#3D4F6E' }}>
              © 2026 Capturo — Feito com IA no Brasil 🇧🇷
            </p>
          </div>
        </div>
      </footer>

      {/* ── KEYFRAMES inline ──────────────────────────── */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.4; }
        }
      `}</style>
    </div>
  )
}
