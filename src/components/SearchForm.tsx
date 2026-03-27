'use client'

import { useState, useTransition } from 'react'
import { Search, MapPin, Sparkles, Loader2, Radar } from 'lucide-react'
import { searchLeadsAction } from '@/app/(dashboard)/lead-actions'
import UpgradeModal from './UpgradeModal'

interface SearchFormProps {
  segment: string;
  campaignId?: string;
  isFloating?: boolean;
  currentPlan: string;
}

export default function SearchForm({ segment, campaignId, isFloating = true, currentPlan }: SearchFormProps) {
  const [isPending, startTransition] = useTransition()
  const [query, setQuery] = useState('')
  const [region, setRegion] = useState('')
  const [limitError, setLimitError] = useState<string | null>(null)
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!query.trim() || !region.trim()) return

    startTransition(async () => {
      setLimitError(null)
      const res = await searchLeadsAction(query, region, campaignId)
      if (res?.error) {
        setLimitError(res.error)
        if (res.error.includes('LIMITE')) {
          setShowUpgradeModal(true)
        }
      } else {
        setQuery('')
        setRegion('')
      }
    })
  }

  const containerClasses = isFloating 
    ? "absolute top-4 left-4 z-10 w-[420px]" 
    : "w-full max-w-2xl mx-auto";

  return (
    <div className={containerClasses}>
      <UpgradeModal 
        isOpen={showUpgradeModal} 
        onClose={() => setShowUpgradeModal(false)}
        currentPlan={currentPlan}
      />
      <form onSubmit={handleSubmit} className="relative">
        <div
          className="glass rounded-2xl shadow-2xl transition-all duration-500"
          style={{
            borderColor: isPending ? "rgba(0,229,255,0.3)" : "var(--border)",
            border: isPending ? "1px solid rgba(0,229,255,0.3)" : "1px solid var(--border)",
            boxShadow: isPending 
              ? "0 8px 32px rgba(0,229,255,0.1), 0 0 0 1px rgba(0,229,255,0.1)" 
              : "0 8px 32px rgba(0,0,0,0.3)",
          }}
        >
          {/* Header */}
          <div className="px-4 pt-3.5 pb-2 flex items-center gap-2">
            <div
              className="p-1.5 rounded-lg transition-colors"
              style={{ background: isPending ? "var(--primary-dim)" : "rgba(0,229,255,0.08)" }}
            >
              <Radar
                className={`h-4 w-4 transition-colors ${isPending ? 'animate-pulse' : ''}`}
                style={{ color: "var(--primary)" }}
              />
            </div>
            <span className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--foreground-muted)" }}>
              {campaignId ? 'Descobrir para esta Campanha' : 'Prospecção IA'}
            </span>
          </div>

          {/* Limit Error */}
          {limitError && (
            <div className="mx-4 mt-2 mb-2 px-3 py-2 rounded-lg border border-destructive/20 bg-destructive/15 flex flex-col gap-2">
              <span className="text-sm font-medium text-destructive">{limitError.replace(/_/g, ' ')}</span>
              <button 
                type="button" 
                onClick={() => setShowUpgradeModal(true)} 
                className="text-xs font-bold text-white bg-primary px-3 py-1.5 rounded-md hover:bg-primary/90 w-max transition-colors shadow-lg shadow-primary/20"
                disabled={isPending}
              >
                Liberar Agora
              </button>
            </div>
          )}

          {/* Input Row */}
          <div className="px-3 pb-3 flex flex-wrap md:flex-nowrap gap-2">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: "var(--foreground-dim)" }} />
              <input
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder={`Ex: ${segment || 'Academias, Restaurantes...'}`}
                disabled={isPending}
                required
                className="w-full h-10 pl-9 pr-3 rounded-xl text-sm outline-none transition-all disabled:opacity-50"
                style={{
                  background: "var(--background-3)",
                  border: "1px solid var(--border)",
                  color: "var(--foreground)",
                }}
                onFocus={(e: React.FocusEvent<HTMLInputElement>) => {
                  e.target.style.borderColor = "var(--primary)";
                  e.target.style.boxShadow = "0 0 0 2px var(--primary-dim)";
                }}
                onBlur={(e: React.FocusEvent<HTMLInputElement>) => {
                  e.target.style.borderColor = "var(--border)";
                  e.target.style.boxShadow = "none";
                }}
              />
            </div>
            <div className="relative w-full md:w-36">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: "var(--foreground-dim)" }} />
              <input
                value={region}
                onChange={e => setRegion(e.target.value)}
                placeholder="Cidade/UF"
                disabled={isPending}
                required
                className="w-full h-10 pl-9 pr-3 rounded-xl text-sm outline-none transition-all disabled:opacity-50"
                style={{
                  background: "var(--background-3)",
                  border: "1px solid var(--border)",
                  color: "var(--foreground)",
                }}
                onFocus={(e: React.FocusEvent<HTMLInputElement>) => {
                  e.target.style.borderColor = "var(--primary)";
                  e.target.style.boxShadow = "0 0 0 2px var(--primary-dim)";
                }}
                onBlur={(e: React.FocusEvent<HTMLInputElement>) => {
                  e.target.style.borderColor = "var(--border)";
                  e.target.style.boxShadow = "none";
                }}
              />
            </div>
            <button
              type="submit"
              disabled={isPending}
              className="h-10 px-4 rounded-xl font-semibold text-sm flex items-center gap-2 transition-all duration-300 shrink-0 disabled:cursor-wait w-full md:w-auto justify-center"
              style={{
                background: isPending 
                  ? "var(--primary)" 
                  : "linear-gradient(135deg, var(--primary), #0066FF)",
                color: "var(--primary-fg)",
                boxShadow: "0 4px 16px var(--primary-glow)",
                transform: isPending ? "scale(0.95)" : "scale(1)",
              }}
              onMouseEnter={(e: React.MouseEvent<HTMLButtonElement>) => !isPending && (e.currentTarget.style.transform = "scale(1.05)")}
              onMouseLeave={(e: React.MouseEvent<HTMLButtonElement>) => !isPending && (e.currentTarget.style.transform = "scale(1)")}
            >
              {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
              <span>{isPending ? 'Buscando' : 'Buscar'}</span>
            </button>
          </div>
        </div>

        {/* Enhanced Loading Overlay */}
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
                  background: "linear-gradient(90deg, rgba(0,229,255,0.4), var(--primary), rgba(0,229,255,0.4))",
                  animation: "loading-bar 2s ease-in-out infinite",
                }}
              />
            </div>

            {/* Steps with animated dots */}
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
      </form>
    </div>
  )
}
