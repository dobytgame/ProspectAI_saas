# ProspectAI — Plano de Redesign UI/UX

> **Objetivo:** Transformar a UI atual (Inter + cards flat + sem animações) em uma interface premium dark-first com micro-interações, feedback visual rico e sensação de produto moderno de alto nível.
> **Referências de estilo:** Linear, Vercel Dashboard, Raycast, Resend, Clerk

---

## Diagnóstico da UI Atual

| Área | Problema identificado | Impacto |
|------|----------------------|---------|
| Tipografia | Inter genérica, sem hierarquia visual forte | ⚠️ Médio |
| Cores | Light mode apenas, dark mode quebrado com cinzas genéricos | 🔴 Alto |
| Sidebar | 240px plana, sem animações, ícone sem glow | ⚠️ Médio |
| Cards | `border/50 shadow-sm` — flat demais, sem profundidade | ⚠️ Médio |
| Animações | Zero transições de página, `hover:shadow-md` como única interação | 🔴 Alto |
| Feedback de ação | Loader básico no SearchForm, sem toast, sem estados empty | 🔴 Alto |
| Login page | Card genérico em fundo cinza — sem personalidade | ⚠️ Médio |
| Score badges | `bg-green-500` hardcoded, sem contexto visual | 🟡 Baixo |
| Fontes | `next/font/google` carregando apenas Inter | ⚠️ Médio |
| Efeitos visuais | Nenhum blur, glow, gradient mesh ou noise texture | 🔴 Alto |

---

## Identidade Visual Alvo

### Direção de Design

**Dark-first, tech premium.** O produto lida com dados de negócios e IA — a UI deve transmitir sofisticação, precisão e poder. Referências: Linear (tipografia precisa), Resend (dark elegante) e Vercel (densidade informacional com leveza).

### Paleta atualizada

```css
/* globals.css — substituir o :root e .dark completamente */

:root {
  /* === DARK MODE COMO PADRÃO === */
  --background:        #080C14;   /* quase preto azulado */
  --background-2:      #0D1420;   /* superfície de cards */
  --background-3:      #111827;   /* hover state */

  --foreground:        #E2EAF4;   /* texto principal */
  --foreground-muted:  #6B7FA8;   /* texto secundário */
  --foreground-dim:    #3D4F6E;   /* placeholders, desabilitado */

  --primary:           #00E5FF;   /* cyan elétrico — ações principais */
  --primary-glow:      #00E5FF22; /* glow sutil do cyan */
  --primary-dim:       #00E5FF11; /* background de estados ativos */

  --green:             #00FFA3;   /* qualificado, sucesso */
  --green-dim:         #00FFA322;
  --yellow:            #FFD600;   /* em progresso, atenção */
  --yellow-dim:        #FFD60022;
  --red:               #FF4D6D;   /* perdido, erro */
  --red-dim:           #FF4D6D22;
  --purple:            #A855F7;   /* proposta, premium */
  --purple-dim:        #A855F722;

  --border:            #1E2D45;   /* bordas de cards */
  --border-hover:      #2D4060;   /* hover de borda */

  --navy:              #0A1628;   /* sidebar, headers */
  --radius:            0.75rem;
}

/* Light mode — mantido mas secundário */
.light {
  --background:        #F8FAFC;
  --background-2:      #FFFFFF;
  --background-3:      #F1F5F9;
  --foreground:        #0A1628;
  --foreground-muted:  #64748B;
  --foreground-dim:    #CBD5E1;
  --primary:           #0099B3;
  --primary-glow:      #0099B322;
  --primary-dim:       #0099B311;
  --border:            #E2E8F0;
  --border-hover:      #CBD5E1;
  --navy:              #0A1628;
}
```

### Tipografia

```typescript
// src/app/layout.tsx — trocar Inter por Geist + Geist Mono
import { Geist, Geist_Mono } from "next/font/google";

const geist = Geist({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  display: "swap",
});

// No html tag:
// className={`${geist.variable} ${geistMono.variable} h-full antialiased dark`}
// Adicionar "dark" para ativar dark mode por padrão
```

**Hierarquia tipográfica:**

| Role | Font | Size | Weight | Uso |
|------|------|------|--------|-----|
| Display | Geist | 32–48px | 700 | Títulos hero, números grandes |
| Heading | Geist | 18–24px | 600 | Títulos de seção, cards |
| Body | Geist | 14–15px | 400 | Texto corrido |
| Label | Geist | 11–12px | 500 | Labels uppercase, metadata |
| Code | Geist Mono | 12–13px | 400 | Scores, IDs, timestamps |

---

## 1. globals.css — Fundação Completa

Substituir o arquivo atual por completo:

```css
@import "tailwindcss";
@import "tw-animate-css";
@import "shadcn/tailwind.css";

@custom-variant dark (&:is(.dark *));

/* ── TOKENS ─────────────────────────────────────────────── */
:root {
  --background:       #080C14;
  --background-2:     #0D1420;
  --background-3:     #111827;
  --foreground:       #E2EAF4;
  --foreground-muted: #6B7FA8;
  --foreground-dim:   #3D4F6E;
  --primary:          #00E5FF;
  --primary-fg:       #080C14;
  --primary-glow:     rgba(0, 229, 255, 0.15);
  --primary-dim:      rgba(0, 229, 255, 0.08);
  --green:            #00FFA3;
  --green-dim:        rgba(0, 255, 163, 0.12);
  --yellow:           #FFD600;
  --yellow-dim:       rgba(255, 214, 0, 0.12);
  --red:              #FF4D6D;
  --red-dim:          rgba(255, 77, 109, 0.12);
  --purple:           #A855F7;
  --purple-dim:       rgba(168, 85, 247, 0.12);
  --border:           #1E2D45;
  --border-hover:     #2D4060;
  --navy:             #0A1628;
  --card:             #0D1420;
  --card-hover:       #111827;
  --secondary:        #00C8E0;
  --accent:           #00FFA3;
  --muted:            #1E2D45;
  --muted-foreground: #6B7FA8;
  --input:            #1E2D45;
  --ring:             #00E5FF;
  --radius:           0.75rem;
  --sidebar:          #0A1628;
  --sidebar-border:   #1E2D45;
}

/* ── BASE ────────────────────────────────────────────────── */
@layer base {
  * { @apply border-border outline-ring/50; }

  html { @apply font-sans antialiased; }

  body {
    background-color: var(--background);
    color: var(--foreground);
    font-feature-settings: "rlig" 1, "calt" 1;
  }

  /* Scrollbar customizada */
  ::-webkit-scrollbar       { width: 4px; height: 4px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb {
    background: var(--border);
    border-radius: 2px;
  }
  ::-webkit-scrollbar-thumb:hover { background: var(--border-hover); }
}

/* ── ANIMAÇÕES GLOBAIS ───────────────────────────────────── */
@keyframes fade-in {
  from { opacity: 0; transform: translateY(6px); }
  to   { opacity: 1; transform: translateY(0); }
}

@keyframes fade-in-fast {
  from { opacity: 0; }
  to   { opacity: 1; }
}

@keyframes slide-in-left {
  from { opacity: 0; transform: translateX(-12px); }
  to   { opacity: 1; transform: translateX(0); }
}

@keyframes scale-in {
  from { opacity: 0; transform: scale(0.95); }
  to   { opacity: 1; transform: scale(1); }
}

@keyframes pulse-glow {
  0%, 100% { box-shadow: 0 0 0 0 var(--primary-glow); }
  50%       { box-shadow: 0 0 0 8px transparent; }
}

@keyframes shimmer {
  0%   { background-position: -200% 0; }
  100% { background-position:  200% 0; }
}

@keyframes spin-slow {
  to { transform: rotate(360deg); }
}

@keyframes loading-bar {
  0%   { width: 10%; margin-left: 0; }
  50%  { width: 70%; margin-left: 15%; }
  100% { width: 10%; margin-left: 90%; }
}

@keyframes count-up {
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
}

@keyframes dot-bounce {
  0%, 80%, 100% { transform: scale(0.8); opacity: 0.5; }
  40%            { transform: scale(1.2); opacity: 1; }
}

/* ── UTILITÁRIOS ─────────────────────────────────────────── */

/* Efeito glassmorphism */
.glass {
  background: rgba(13, 20, 32, 0.8);
  backdrop-filter: blur(16px) saturate(180%);
  -webkit-backdrop-filter: blur(16px) saturate(180%);
  border: 1px solid rgba(255, 255, 255, 0.06);
}

/* Gradient mesh de fundo */
.bg-mesh {
  background-color: var(--background);
  background-image:
    radial-gradient(ellipse 80% 50% at 20% -20%, rgba(0, 229, 255, 0.07) 0%, transparent 60%),
    radial-gradient(ellipse 60% 40% at 80% 110%, rgba(0, 255, 163, 0.05) 0%, transparent 60%);
}

/* Noise texture overlay */
.bg-noise::after {
  content: '';
  position: fixed;
  inset: 0;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.03'/%3E%3C/svg%3E");
  pointer-events: none;
  z-index: 0;
  opacity: 0.4;
}

/* Linha de glow no topo de cards */
.card-glow-top {
  position: relative;
  overflow: hidden;
}
.card-glow-top::before {
  content: '';
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent, var(--primary), transparent);
  opacity: 0;
  transition: opacity 0.3s;
}
.card-glow-top:hover::before { opacity: 1; }

/* Skeleton loading */
.skeleton {
  background: linear-gradient(
    90deg,
    var(--background-2) 25%,
    var(--background-3) 50%,
    var(--background-2) 75%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  border-radius: var(--radius);
}

/* Texto com gradiente */
.text-gradient {
  background: linear-gradient(135deg, var(--primary), #0066FF);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

/* Entrada animada de itens de lista */
.animate-list > * {
  animation: fade-in 0.4s ease both;
}
.animate-list > *:nth-child(1) { animation-delay: 0ms; }
.animate-list > *:nth-child(2) { animation-delay: 60ms; }
.animate-list > *:nth-child(3) { animation-delay: 120ms; }
.animate-list > *:nth-child(4) { animation-delay: 180ms; }
.animate-list > *:nth-child(5) { animation-delay: 240ms; }
.animate-list > *:nth-child(n+6) { animation-delay: 300ms; }

/* Ponto de status pulsante */
.status-dot {
  width: 8px; height: 8px;
  border-radius: 50%;
  display: inline-block;
}
.status-dot.active {
  background: var(--green);
  box-shadow: 0 0 0 0 var(--green-dim);
  animation: pulse-glow 2s infinite;
}
```

---

## 2. Sidebar — Redesign Completo

```tsx
// src/components/Sidebar.tsx
'use client'

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Columns3, MessageSquare, Settings, LogOut, Zap } from "lucide-react";
import { signOut } from "@/app/(auth)/actions";

const navItems = [
  { href: "/dashboard",  label: "Dashboard",      icon: LayoutDashboard },
  { href: "/pipeline",   label: "Pipeline",        icon: Columns3 },
  { href: "/campanhas",  label: "Campanhas",       icon: MessageSquare },
  { href: "/settings",   label: "Configurações",   icon: Settings },
];

export default function Sidebar({ userEmail }: { userEmail?: string | null }) {
  const pathname = usePathname();

  return (
    <aside
      className="w-16 flex flex-col shrink-0 border-r transition-all duration-300"
      style={{
        background: "var(--navy)",
        borderColor: "var(--border)",
      }}
    >
      {/* Logo */}
      <div className="h-14 flex items-center justify-center border-b" style={{ borderColor: "var(--border)" }}>
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center transition-transform hover:scale-110"
          style={{ background: "linear-gradient(135deg, var(--primary), #0066FF)" }}
        >
          <Zap className="h-5 w-5 text-[#080C14]" fill="currentColor" />
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 flex flex-col items-center py-4 gap-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              title={item.label}
              className="group relative w-10 h-10 flex items-center justify-center rounded-xl transition-all duration-200"
              style={{
                background: isActive ? "var(--primary-dim)" : "transparent",
                border: isActive ? "1px solid rgba(0, 229, 255, 0.2)" : "1px solid transparent",
              }}
            >
              <Icon
                className="h-[18px] w-[18px] transition-all duration-200"
                style={{
                  color: isActive ? "var(--primary)" : "var(--foreground-dim)",
                  filter: isActive ? "drop-shadow(0 0 6px var(--primary))" : "none",
                }}
              />
              {/* Tooltip */}
              <span
                className="absolute left-14 px-2.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap pointer-events-none opacity-0 group-hover:opacity-100 transition-all duration-150 translate-x-[-4px] group-hover:translate-x-0 z-50"
                style={{
                  background: "var(--background-3)",
                  border: "1px solid var(--border)",
                  color: "var(--foreground)",
                }}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* Avatar + Logout */}
      <div className="pb-4 flex flex-col items-center gap-3 border-t pt-4" style={{ borderColor: "var(--border)" }}>
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
          style={{
            background: "linear-gradient(135deg, rgba(0,229,255,0.2), rgba(0,102,255,0.2))",
            border: "1px solid var(--border)",
            color: "var(--primary)",
          }}
        >
          {userEmail?.[0]?.toUpperCase() ?? "U"}
        </div>
        <form action={signOut}>
          <button
            type="submit"
            title="Sair"
            className="w-8 h-8 flex items-center justify-center rounded-lg transition-colors"
            style={{ color: "var(--foreground-dim)" }}
            onMouseEnter={e => (e.currentTarget.style.color = "var(--red)")}
            onMouseLeave={e => (e.currentTarget.style.color = "var(--foreground-dim)")}
          >
            <LogOut className="h-4 w-4" />
          </button>
        </form>
      </div>
    </aside>
  );
}
```

---

## 3. Stat Cards — Animados com Contador

```tsx
// src/components/ui/StatCard.tsx
'use client'

import { useEffect, useRef, useState } from "react";

interface StatCardProps {
  label: string;
  value: number;
  suffix?: string;
  sub?: string;
  color?: string;
  icon: React.ReactNode;
  delay?: number;
}

function useCountUp(target: number, duration = 800, delay = 0) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    const timer = setTimeout(() => {
      let start = 0;
      const step = target / (duration / 16);
      const interval = setInterval(() => {
        start = Math.min(start + step, target);
        setCount(Math.floor(start));
        if (start >= target) clearInterval(interval);
      }, 16);
      return () => clearInterval(interval);
    }, delay);
    return () => clearTimeout(timer);
  }, [target, duration, delay]);
  return count;
}

export function StatCard({ label, value, suffix = "", sub, color = "var(--primary)", icon, delay = 0 }: StatCardProps) {
  const displayed = useCountUp(value, 700, delay);

  return (
    <div
      className="card-glow-top relative rounded-2xl p-5 flex flex-col gap-3 transition-all duration-300 cursor-default"
      style={{
        background: "var(--background-2)",
        border: "1px solid var(--border)",
        animation: `fade-in 0.5s ease ${delay}ms both`,
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLElement).style.borderColor = "var(--border-hover)";
        (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)";
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLElement).style.borderColor = "var(--border)";
        (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
      }}
    >
      {/* Ícone */}
      <div
        className="w-9 h-9 rounded-xl flex items-center justify-center"
        style={{ background: `${color}18`, border: `1px solid ${color}30` }}
      >
        <span style={{ color }}>{icon}</span>
      </div>

      {/* Número animado */}
      <div>
        <div
          className="text-3xl font-bold tracking-tight tabular-nums"
          style={{ color, fontVariantNumeric: "tabular-nums" }}
        >
          {displayed.toLocaleString("pt-BR")}{suffix}
        </div>
        <div className="text-xs font-medium mt-1 uppercase tracking-wider" style={{ color: "var(--foreground-muted)" }}>
          {label}
        </div>
        {sub && <div className="text-[11px] mt-0.5" style={{ color: "var(--foreground-dim)" }}>{sub}</div>}
      </div>
    </div>
  );
}
```

---

## 4. Toast / Notificações

```tsx
// src/components/ui/Toast.tsx
'use client'

import { useEffect, useState } from "react";
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from "lucide-react";

type ToastType = "success" | "error" | "warning" | "info";

interface ToastProps {
  message: string;
  type?: ToastType;
  duration?: number;
  onClose: () => void;
}

const configs = {
  success: { icon: CheckCircle2, color: "var(--green)",  bg: "var(--green-dim)"  },
  error:   { icon: XCircle,      color: "var(--red)",    bg: "var(--red-dim)"    },
  warning: { icon: AlertTriangle,color: "var(--yellow)", bg: "var(--yellow-dim)" },
  info:    { icon: Info,         color: "var(--primary)",bg: "var(--primary-dim)" },
};

export function Toast({ message, type = "success", duration = 4000, onClose }: ToastProps) {
  const [visible, setVisible] = useState(true);
  const { icon: Icon, color, bg } = configs[type];

  useEffect(() => {
    const t = setTimeout(() => { setVisible(false); setTimeout(onClose, 300); }, duration);
    return () => clearTimeout(t);
  }, [duration, onClose]);

  return (
    <div
      className="flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl min-w-[280px] max-w-sm"
      style={{
        background: "var(--background-2)",
        border: `1px solid ${color}40`,
        borderLeft: `3px solid ${color}`,
        boxShadow: `0 8px 32px rgba(0,0,0,0.4), 0 0 0 1px var(--border)`,
        animation: visible ? "slide-in-left 0.3s ease" : "fade-in-fast 0.3s ease reverse",
        opacity: visible ? 1 : 0,
        transform: visible ? "translateX(0)" : "translateX(20px)",
        transition: "opacity 0.3s, transform 0.3s",
      }}
    >
      <Icon className="h-5 w-5 shrink-0" style={{ color }} />
      <p className="text-sm flex-1" style={{ color: "var(--foreground)" }}>{message}</p>
      <button onClick={() => { setVisible(false); setTimeout(onClose, 300); }}
        className="rounded-md p-1 transition-colors"
        style={{ color: "var(--foreground-dim)" }}
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

// Provider — adicionar em layout.tsx
// src/components/ui/ToastProvider.tsx
import { createContext, useCallback, useContext, useState } from "react";
import { createPortal } from "react-dom";

interface ToastItem { id: string; message: string; type: ToastType; }
const ToastContext = createContext<(msg: string, type?: ToastType) => void>(() => {});
export const useToast = () => useContext(ToastContext);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const addToast = useCallback((message: string, type: ToastType = "success") => {
    const id = Math.random().toString(36).slice(2);
    setToasts(prev => [...prev, { id, message, type }]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={addToast}>
      {children}
      {typeof window !== "undefined" && createPortal(
        <div className="fixed bottom-6 right-6 flex flex-col gap-3 z-[9999]">
          {toasts.map(t => (
            <Toast key={t.id} message={t.message} type={t.type} onClose={() => removeToast(t.id)} />
          ))}
        </div>,
        document.body
      )}
    </ToastContext.Provider>
  );
}
```

**Uso em Server Actions via redirect com searchParams ou em Client Components:**
```tsx
const toast = useToast();
toast("Mensagem enviada com sucesso!", "success");
toast("Erro ao conectar com WhatsApp", "error");
toast("12 leads encontrados na região", "info");
```

---

## 5. Login Page — Dark Premium

```tsx
// src/app/(auth)/login/page.tsx — substituir completamente
import Link from "next/link";
import { Zap } from "lucide-react";
import { login } from "@/app/(auth)/actions";

export default function LoginPage() {
  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 bg-mesh bg-noise"
      style={{ background: "var(--background)" }}
    >
      {/* Glow de fundo */}
      <div
        className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] rounded-full pointer-events-none"
        style={{ background: "radial-gradient(ellipse, rgba(0,229,255,0.06) 0%, transparent 70%)" }}
      />

      <div
        className="relative w-full max-w-sm rounded-2xl p-8 z-10"
        style={{
          background: "var(--background-2)",
          border: "1px solid var(--border)",
          boxShadow: "0 24px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.04)",
          animation: "scale-in 0.4s ease",
        }}
      >
        {/* Logo */}
        <div className="flex flex-col items-center gap-3 mb-8">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center"
            style={{
              background: "linear-gradient(135deg, var(--primary), #0066FF)",
              boxShadow: "0 0 30px var(--primary-glow)",
            }}
          >
            <Zap className="h-6 w-6 text-[#080C14]" fill="currentColor" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-center" style={{ color: "var(--foreground)" }}>ProspectAI</h1>
            <p className="text-sm text-center mt-1" style={{ color: "var(--foreground-muted)" }}>
              Entre na sua conta
            </p>
          </div>
        </div>

        {/* Form */}
        <form className="space-y-4" action={login}>
          <div className="space-y-1.5">
            <label className="text-xs font-medium uppercase tracking-wider" style={{ color: "var(--foreground-muted)" }}>
              E-mail
            </label>
            <input
              name="email" type="email" placeholder="nome@empresa.com" required
              className="w-full h-11 px-4 rounded-xl text-sm outline-none transition-all duration-200"
              style={{
                background: "var(--background-3)",
                border: "1px solid var(--border)",
                color: "var(--foreground)",
              }}
              onFocus={e => {
                e.target.style.borderColor = "var(--primary)";
                e.target.style.boxShadow = "0 0 0 3px var(--primary-dim)";
              }}
              onBlur={e => {
                e.target.style.borderColor = "var(--border)";
                e.target.style.boxShadow = "none";
              }}
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium uppercase tracking-wider" style={{ color: "var(--foreground-muted)" }}>
                Senha
              </label>
              <Link href="#" className="text-xs transition-colors" style={{ color: "var(--primary)" }}>
                Esqueceu?
              </Link>
            </div>
            <input
              name="password" type="password" required
              className="w-full h-11 px-4 rounded-xl text-sm outline-none transition-all duration-200"
              style={{
                background: "var(--background-3)",
                border: "1px solid var(--border)",
                color: "var(--foreground)",
              }}
              onFocus={e => {
                e.target.style.borderColor = "var(--primary)";
                e.target.style.boxShadow = "0 0 0 3px var(--primary-dim)";
              }}
              onBlur={e => {
                e.target.style.borderColor = "var(--border)";
                e.target.style.boxShadow = "none";
              }}
            />
          </div>

          <button
            type="submit"
            className="w-full h-11 rounded-xl font-semibold text-sm transition-all duration-200 mt-2"
            style={{
              background: "linear-gradient(135deg, var(--primary), #0066FF)",
              color: "var(--primary-fg)",
              boxShadow: "0 4px 20px var(--primary-glow)",
            }}
            onMouseEnter={e => (e.currentTarget.style.transform = "translateY(-1px)")}
            onMouseLeave={e => (e.currentTarget.style.transform = "translateY(0)")}
          >
            Entrar
          </button>
        </form>

        {/* Divisor */}
        <div className="relative my-6 flex items-center">
          <div className="flex-1 h-px" style={{ background: "var(--border)" }} />
          <span className="px-3 text-xs" style={{ color: "var(--foreground-dim)" }}>ou continue com</span>
          <div className="flex-1 h-px" style={{ background: "var(--border)" }} />
        </div>

        {/* Google */}
        <button
          type="button"
          className="w-full h-11 rounded-xl text-sm font-medium flex items-center justify-center gap-2.5 transition-all duration-200"
          style={{
            background: "var(--background-3)",
            border: "1px solid var(--border)",
            color: "var(--foreground)",
          }}
          onMouseEnter={e => (e.currentTarget.style.borderColor = "var(--border-hover)")}
          onMouseLeave={e => (e.currentTarget.style.borderColor = "var(--border)")}
        >
          <svg width="16" height="16" viewBox="0 0 48 48">
            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
            <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.36-8.16 2.36-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
          </svg>
          Google
        </button>

        {/* Footer */}
        <p className="text-center text-xs mt-6" style={{ color: "var(--foreground-dim)" }}>
          Não tem conta?{" "}
          <Link href="/signup" className="font-semibold transition-colors" style={{ color: "var(--primary)" }}>
            Criar conta grátis
          </Link>
        </p>
      </div>
    </div>
  );
}
```

---

## 6. Score Badges — Sistema Visual Completo

```tsx
// src/components/ui/ScoreBadge.tsx
interface ScoreBadgeProps {
  score: number;
  showTier?: boolean;
  size?: "sm" | "md" | "lg";
}

const getTierConfig = (score: number) => {
  if (score >= 90) return { tier: "A+", color: "var(--primary)",  bg: "var(--primary-dim)",  glow: "0 0 12px rgba(0,229,255,0.3)"  };
  if (score >= 75) return { tier: "A",  color: "var(--green)",   bg: "var(--green-dim)",   glow: "0 0 12px rgba(0,255,163,0.3)"  };
  if (score >= 60) return { tier: "B",  color: "var(--yellow)",  bg: "var(--yellow-dim)",  glow: "none" };
  if (score >= 40) return { tier: "C",  color: "#FF8C42",        bg: "rgba(255,140,66,.12)", glow: "none" };
  return              { tier: "D",  color: "var(--red)",    bg: "var(--red-dim)",     glow: "none" };
};

export function ScoreBadge({ score, showTier = false, size = "sm" }: ScoreBadgeProps) {
  const { tier, color, bg, glow } = getTierConfig(score);
  const sizes = { sm: "h-6 px-2 text-[11px]", md: "h-8 px-3 text-sm", lg: "h-10 px-4 text-base" };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-lg font-bold font-mono ${sizes[size]}`}
      style={{ background: bg, color, boxShadow: glow, border: `1px solid ${color}30` }}
    >
      {score}
      {showTier && <span className="opacity-60 text-[9px]">{tier}</span>}
    </span>
  );
}

// Barra de progresso do score
export function ScoreBar({ score }: { score: number }) {
  const { color } = getTierConfig(score);
  return (
    <div className="w-full h-1 rounded-full overflow-hidden" style={{ background: "var(--border)" }}>
      <div
        className="h-full rounded-full transition-all duration-700 ease-out"
        style={{
          width: `${score}%`,
          background: `linear-gradient(90deg, ${color}80, ${color})`,
          boxShadow: `0 0 8px ${color}40`,
        }}
      />
    </div>
  );
}
```

---

## 7. Skeleton Loading — States de Carregamento

```tsx
// src/components/ui/Skeleton.tsx

export function SkeletonCard() {
  return (
    <div
      className="rounded-2xl p-5 space-y-3"
      style={{ background: "var(--background-2)", border: "1px solid var(--border)" }}
    >
      <div className="skeleton h-9 w-9 rounded-xl" />
      <div className="skeleton h-8 w-24 rounded-lg" />
      <div className="skeleton h-3 w-32 rounded" />
    </div>
  );
}

export function SkeletonLeadItem() {
  return (
    <div className="p-3 rounded-lg space-y-2" style={{ background: "var(--background-3)" }}>
      <div className="flex justify-between">
        <div className="skeleton h-4 w-36 rounded" />
        <div className="skeleton h-5 w-8 rounded-lg" />
      </div>
      <div className="skeleton h-3 w-24 rounded" />
      <div className="skeleton h-7 w-full rounded-lg" />
    </div>
  );
}

export function SkeletonStatRow() {
  return (
    <div className="grid grid-cols-3 gap-4">
      {[0, 1, 2].map(i => <SkeletonCard key={i} />)}
    </div>
  );
}
```

---

## 8. Botão — Variantes com Feedback

```tsx
// Substituir o botão genérico por versões com efeito
// Adicionar ao cva do button.tsx as novas variantes:

// variant: "primary-glow"
"bg-gradient-to-r from-[var(--primary)] to-[#0066FF] text-[var(--primary-fg)] font-semibold shadow-[0_4px_20px_var(--primary-glow)] hover:shadow-[0_6px_28px_var(--primary-glow)] hover:-translate-y-px active:translate-y-0 transition-all",

// variant: "ghost-border"
"border border-[var(--border)] bg-transparent text-[var(--foreground-muted)] hover:bg-[var(--background-3)] hover:text-[var(--foreground)] hover:border-[var(--border-hover)] transition-all",

// variant: "danger-ghost"
"border border-[var(--red-dim)] bg-[var(--red-dim)] text-[var(--red)] hover:bg-[var(--red)] hover:text-white transition-all",

// variant: "success-ghost"
"border border-[var(--green-dim)] bg-[var(--green-dim)] text-[var(--green)] hover:bg-[var(--green)] hover:text-[#080C14] transition-all",
```

---

## 9. DashboardContent — Entrada Animada

```tsx
// Substituir o grid de stats em DashboardContent.tsx
// Importar StatCard e animar a entrada:

<div className="grid grid-cols-3 gap-4 mb-5">
  <StatCard
    label="Leads Encontrados"
    value={totalLeads}
    sub={leads.length !== totalLeads ? `de ${leads.length} total` : undefined}
    color="var(--primary)"
    icon={<Users className="h-4 w-4" />}
    delay={0}
  />
  <StatCard
    label="Qualificados"
    value={qualifiedLeads}
    sub={totalLeads > 0 ? `${Math.round(qualifiedLeads / totalLeads * 100)}% do total` : undefined}
    color="var(--green)"
    icon={<Target className="h-4 w-4" />}
    delay={80}
  />
  <StatCard
    label="Score Médio"
    value={avgScore}
    sub={avgScore >= 70 ? "Excelente" : avgScore >= 40 ? "Regular" : "—"}
    color={avgScore >= 70 ? "var(--green)" : avgScore >= 40 ? "var(--yellow)" : "var(--red)"}
    icon={<TrendingUp className="h-4 w-4" />}
    delay={160}
  />
</div>
```

---

## 10. SearchForm — Feedback de Loading Aprimorado

```tsx
// Substituir o estado de loading em SearchForm.tsx:
{isPending && (
  <div
    className="mt-2 rounded-xl px-4 py-3 glass"
    style={{ animation: "scale-in 0.2s ease", border: "1px solid rgba(0,229,255,0.15)" }}
  >
    {/* Header */}
    <div className="flex items-center gap-3 mb-3">
      <div className="relative w-8 h-8">
        <div
          className="absolute inset-0 rounded-full"
          style={{
            border: "2px solid var(--border)",
            borderTopColor: "var(--primary)",
            animation: "spin 1s linear infinite",
          }}
        />
        <Sparkles className="absolute inset-0 m-auto h-3.5 w-3.5" style={{ color: "var(--primary)" }} />
      </div>
      <div>
        <p className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>
          Prospectando em <span style={{ color: "var(--primary)" }}>{region}</span>
        </p>
        <p className="text-xs" style={{ color: "var(--foreground-muted)" }}>
          Buscando <strong>{query}</strong>
        </p>
      </div>
    </div>

    {/* Progress bar */}
    <div className="h-1 rounded-full overflow-hidden mb-3" style={{ background: "var(--border)" }}>
      <div
        className="h-full rounded-full"
        style={{
          background: "linear-gradient(90deg, var(--primary)60, var(--primary), var(--primary)60)",
          animation: "loading-bar 2s ease-in-out infinite",
        }}
      />
    </div>

    {/* Steps com dots animados */}
    <div className="flex items-center gap-2 text-[11px]" style={{ color: "var(--foreground-dim)" }}>
      {["Geolocalizando", "Google Maps", "Qualificando IA"].map((step, i) => (
        <span key={step} className="flex items-center gap-1">
          {i > 0 && <span style={{ color: "var(--border)" }}>→</span>}
          <span
            className="inline-block w-1.5 h-1.5 rounded-full"
            style={{
              background: "var(--primary)",
              animation: `dot-bounce 1.4s ${i * 0.2}s infinite`,
            }}
          />
          {step}
        </span>
      ))}
    </div>
  </div>
)}
```

---

## 11. KanbanBoard — Cards Premium

```tsx
// Atualizar o LeadCard em KanbanBoard.tsx:

function LeadCard({ lead, isDragging, onOpenChat, dndProps }: LeadCardProps) {
  return (
    <div
      className="group relative rounded-2xl p-4 transition-all duration-200 cursor-grab active:cursor-grabbing card-glow-top"
      style={{
        background: isDragging ? "var(--background-3)" : "var(--background-2)",
        border: isDragging
          ? `1px solid var(--primary)`
          : "1px solid var(--border)",
        boxShadow: isDragging
          ? "0 16px 40px rgba(0,0,0,0.5), 0 0 0 1px var(--primary-dim)"
          : "none",
        transform: isDragging ? "rotate(2deg) scale(1.02)" : "none",
      }}
      onMouseEnter={e => !isDragging && ((e.currentTarget as HTMLElement).style.borderColor = "var(--border-hover)")}
      onMouseLeave={e => !isDragging && ((e.currentTarget as HTMLElement).style.borderColor = "var(--border)")}
    >
      <div className="flex items-start justify-between gap-2 mb-3">
        <span
          className="text-sm font-medium leading-tight line-clamp-2"
          style={{ color: "var(--foreground)" }}
        >
          {lead.name}
        </span>
        <div {...dndProps}>
          <GripVertical
            className="h-4 w-4 shrink-0 opacity-20 group-hover:opacity-60 transition-opacity"
            style={{ color: "var(--foreground-muted)" }}
          />
        </div>
      </div>

      <ScoreBar score={lead.score || 0} />

      <div className="flex items-center justify-between mt-3">
        <ScoreBadge score={lead.score || 0} showTier />
        <button
          onClick={e => { e.stopPropagation(); onOpenChat?.(); }}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-200"
          style={{
            color: "var(--primary)",
            background: "var(--primary-dim)",
            border: "1px solid rgba(0,229,255,0.15)",
          }}
          onMouseEnter={e => (e.currentTarget.style.background = "rgba(0,229,255,0.15)")}
          onMouseLeave={e => (e.currentTarget.style.background = "var(--primary-dim)")}
        >
          <MessageSquare className="h-3 w-3" />
          Chat IA
        </button>
      </div>
    </div>
  );
}

// Atualizar header das colunas:
// Adicionar linha colorida no topo de cada coluna por status
const STAGE_COLORS: Record<string, string> = {
  new:         "var(--primary)",
  contacted:   "var(--yellow)",
  interested:  "var(--green)",
  negotiating: "var(--purple)",
  closed:      "var(--green)",
};
```

---

## 12. Página de Campanhas — Visual de Cards

```tsx
// Atualizar o card de campanha em campanhas/page.tsx:
// Substituir o estilo atual por:

<div
  key={campaign.id}
  className="card-glow-top group rounded-2xl overflow-hidden flex flex-col transition-all duration-300"
  style={{
    background: "var(--background-2)",
    border: "1px solid var(--border)",
  }}
  onMouseEnter={e => {
    (e.currentTarget as HTMLElement).style.borderColor = "var(--border-hover)";
    (e.currentTarget as HTMLElement).style.transform = "translateY(-3px)";
    (e.currentTarget as HTMLElement).style.boxShadow = "0 12px 40px rgba(0,0,0,0.3)";
  }}
  onMouseLeave={e => {
    (e.currentTarget as HTMLElement).style.borderColor = "var(--border)";
    (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
    (e.currentTarget as HTMLElement).style.boxShadow = "none";
  }}
>
  {/* Topo colorido por canal */}
  <div
    className="h-1 w-full"
    style={{
      background: campaign.channel === "whatsapp"
        ? "linear-gradient(90deg, #25D366, #128C7E)"
        : "linear-gradient(90deg, var(--primary), #0066FF)",
    }}
  />
  {/* ... resto do card ... */}
</div>
```

---

## 13. Checklist de Implementação

### Fase 1 — Base (2–3 horas)
- [ ] Substituir `globals.css` completo
- [ ] Trocar `Inter` por `Geist + Geist_Mono` em `layout.tsx`
- [ ] Adicionar `className="dark"` no `<html>` para dark mode padrão
- [ ] Aplicar `bg-mesh` no `<body>`

### Fase 2 — Componentes Core (4–6 horas)
- [ ] Criar `StatCard.tsx` com animação de contador
- [ ] Criar `ScoreBadge.tsx` + `ScoreBar.tsx`
- [ ] Criar `Skeleton.tsx` para estados de loading
- [ ] Criar `Toast.tsx` + `ToastProvider.tsx`
- [ ] Atualizar `Sidebar.tsx` para versão icon-only com tooltip
- [ ] Adicionar variantes de botão (primary-glow, ghost-border)

### Fase 3 — Páginas (4–6 horas)
- [ ] Redesenhar página de Login com dark premium
- [ ] Atualizar `DashboardContent.tsx` com `StatCard` animado
- [ ] Atualizar `SearchForm.tsx` com novo estado de loading
- [ ] Atualizar `KanbanBoard.tsx` — cards premium + drag melhorado
- [ ] Atualizar cards de Campanhas com hover elevação

### Fase 4 — Polimento (2–3 horas)
- [ ] Adicionar `animate-list` em todas as listas de leads
- [ ] Substituir todos os `ScoreBadge` hardcoded pelo componente novo
- [ ] Adicionar `skeleton` em todas as queries de dados
- [ ] Testar dark mode em todas as páginas
- [ ] Verificar responsividade mobile

### Fase 5 — Micro-interações (2–3 horas)
- [ ] `Toast` em todos os form submits (onboarding, settings, envio de msg)
- [ ] Loading states nos botões de gerar mensagem
- [ ] Transição suave ao navegar entre páginas (Next.js `useTransition`)
- [ ] Efeito de entrada animada no dashboard ao carregar

---

## Estimativa Total

| Fase | Tempo | Dificuldade |
|------|-------|-------------|
| Base (CSS + fonts) | 2–3h | Fácil |
| Componentes core | 4–6h | Médio |
| Páginas | 4–6h | Médio |
| Polimento | 2–3h | Fácil |
| Micro-interações | 2–3h | Médio |
| **Total** | **14–21h** | — |

---

*Documento gerado em Março 2026 — ProspectAI UI/UX Redesign v1.0*
