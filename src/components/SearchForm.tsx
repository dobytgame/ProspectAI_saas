'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Search, MapPin, Sparkles, Loader2, Radar, ChevronDown } from 'lucide-react'
import {
  searchLeadsAction,
  type CampaignDiscoveryState,
} from '@/app/(dashboard)/lead-actions'
import UpgradeModal from './UpgradeModal'
import { PLAN_LIMITS, type PlanType, isPlanLimitError } from '@/utils/plan-limits'

interface SearchFormProps {
  segment: string
  campaignId?: string
  isFloating?: boolean
  currentPlan: string
  /** Estado de paginação do Google Places (só campanha) */
  discoveryState?: CampaignDiscoveryState | null
}

export default function SearchForm({
  segment,
  campaignId,
  isFloating = true,
  currentPlan,
  discoveryState = null,
}: SearchFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [query, setQuery] = useState('')
  const [region, setRegion] = useState('')
  const [limitError, setLimitError] = useState<string | null>(null)
  const [infoMessage, setInfoMessage] = useState<string | null>(null)
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)

  const plan = (currentPlan || 'free') as PlanType
  const maxPages = PLAN_LIMITS[plan].maxPagesPerSearch

  const [pageDepth, setPageDepth] = useState(1)

  const canLoadMore =
    Boolean(campaignId) &&
    Boolean(discoveryState?.next_page_token) &&
    (discoveryState?.pages_fetched ?? 0) < (discoveryState?.max_pages ?? 0)

  const runSearch = (loadMore: boolean) => {
    if (!loadMore && (!query.trim() || !region.trim())) return

    startTransition(async () => {
      setLimitError(null)
      setInfoMessage(null)
      try {
        const res = await searchLeadsAction(
          loadMore ? '' : query,
          loadMore ? '' : region,
          campaignId,
          loadMore
            ? { loadMore: true }
            : { maxPagesInThisSearch: pageDepth }
        )
        if (res?.error) {
          setLimitError(res.error)
          if (isPlanLimitError(res.error)) {
            setShowUpgradeModal(true)
          }
        } else {
          if (res?.inserted != null && res.inserted > 0) {
            setInfoMessage(
              `${res.inserted} lead(s) adicionado(s)${loadMore ? ' (próxima página)' : ''}.`
            )
          } else if (res?.message) {
            setInfoMessage(res.message)
          }
          if (!campaignId) {
            setQuery('')
            setRegion('')
          }
          router.refresh()
        }
      } catch (e) {
        const message = e instanceof Error ? e.message : 'Algo deu errado ao buscar leads.'
        setLimitError(message)
        if (isPlanLimitError(message)) {
          setShowUpgradeModal(true)
        }
      }
    })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    runSearch(false)
  }

  const handleLoadMore = () => {
    runSearch(true)
  }

  const containerClasses = isFloating
    ? 'absolute top-4 left-4 z-10 w-[420px]'
    : 'w-full max-w-2xl mx-auto'

  const depthOptions = Array.from({ length: maxPages }, (_, i) => i + 1)

  return (
    <div className={containerClasses}>
      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        currentPlan={currentPlan}
        title="Limite de leads do plano"
        description="Você atingiu o limite mensal de leads ou o uso permitido pelo seu plano. Faça upgrade para continuar buscando e salvando leads."
      />
      <form onSubmit={handleSubmit} className="relative">
        <div
          className="glass rounded-2xl shadow-2xl transition-all duration-500"
          style={{
            borderColor: isPending ? 'rgba(0,229,255,0.3)' : 'var(--border)',
            border: isPending ? '1px solid rgba(0,229,255,0.3)' : '1px solid var(--border)',
            boxShadow: isPending
              ? '0 8px 32px rgba(0,229,255,0.1), 0 0 0 1px rgba(0,229,255,0.1)'
              : '0 8px 32px rgba(0,0,0,0.3)',
          }}
        >
          <div className="px-4 pt-3.5 pb-2 flex items-center gap-2">
            <div
              className="p-1.5 rounded-lg transition-colors"
              style={{ background: isPending ? 'var(--primary-dim)' : 'rgba(0,229,255,0.08)' }}
            >
              <Radar
                className={`h-4 w-4 transition-colors ${isPending ? 'animate-pulse' : ''}`}
                style={{ color: 'var(--primary)' }}
              />
            </div>
            <span className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--foreground-muted)' }}>
              {campaignId ? 'Descobrir para esta Campanha' : 'Prospecção IA'}
            </span>
          </div>

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

          {infoMessage && !limitError && (
            <div className="mx-4 mt-2 mb-2 px-3 py-2 rounded-lg border border-secondary/25 bg-secondary/10 text-sm text-foreground">
              {infoMessage}
            </div>
          )}

          {maxPages > 1 && (
            <div className="mx-4 mb-2 flex flex-wrap items-center gap-2 text-[11px]">
              <span style={{ color: 'var(--foreground-muted)' }} className="font-medium">
                Resultados por busca (≈20 por página):
              </span>
              <div className="relative">
                <select
                  value={pageDepth}
                  onChange={(e) => setPageDepth(Number(e.target.value))}
                  disabled={isPending}
                  className="h-8 pl-2 pr-7 rounded-lg text-xs font-semibold appearance-none cursor-pointer disabled:opacity-50"
                  style={{
                    background: 'var(--background-3)',
                    border: '1px solid var(--border)',
                    color: 'var(--foreground)',
                  }}
                  aria-label="Quantidade de páginas do Google Maps por busca"
                >
                  {depthOptions.map((n) => (
                    <option key={n} value={n}>
                      Até ~{n * 20} locais ({n} pág.{n > 1 ? 's' : ''})
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 pointer-events-none opacity-50" />
              </div>
            </div>
          )}

          {maxPages === 1 && (
            <p className="mx-4 mb-2 text-[10px] italic" style={{ color: 'var(--foreground-muted)' }}>
              Plano Free: até ~20 locais por busca. Faça upgrade para buscar várias páginas de uma vez ou em sequência.
            </p>
          )}

          <div className="px-3 pb-3 flex flex-wrap md:flex-nowrap gap-2">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: 'var(--foreground-dim)' }} />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={`Ex: ${segment || 'Academias, Restaurantes...'}`}
                disabled={isPending}
                required
                className="w-full h-10 pl-9 pr-3 rounded-xl text-sm outline-none transition-all disabled:opacity-50"
                style={{
                  background: 'var(--background-3)',
                  border: '1px solid var(--border)',
                  color: 'var(--foreground)',
                }}
                onFocus={(e: React.FocusEvent<HTMLInputElement>) => {
                  e.target.style.borderColor = 'var(--primary)'
                  e.target.style.boxShadow = '0 0 0 2px var(--primary-dim)'
                }}
                onBlur={(e: React.FocusEvent<HTMLInputElement>) => {
                  e.target.style.borderColor = 'var(--border)'
                  e.target.style.boxShadow = 'none'
                }}
              />
            </div>
            <div className="relative w-full md:w-36">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: 'var(--foreground-dim)' }} />
              <input
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                placeholder="Cidade/UF"
                disabled={isPending}
                required
                className="w-full h-10 pl-9 pr-3 rounded-xl text-sm outline-none transition-all disabled:opacity-50"
                style={{
                  background: 'var(--background-3)',
                  border: '1px solid var(--border)',
                  color: 'var(--foreground)',
                }}
                onFocus={(e: React.FocusEvent<HTMLInputElement>) => {
                  e.target.style.borderColor = 'var(--primary)'
                  e.target.style.boxShadow = '0 0 0 2px var(--primary-dim)'
                }}
                onBlur={(e: React.FocusEvent<HTMLInputElement>) => {
                  e.target.style.borderColor = 'var(--border)'
                  e.target.style.boxShadow = 'none'
                }}
              />
            </div>
            <button
              type="submit"
              disabled={isPending}
              className="h-10 px-4 rounded-xl font-semibold text-sm flex items-center gap-2 transition-all duration-300 shrink-0 disabled:cursor-wait w-full md:w-auto justify-center"
              style={{
                background: isPending
                  ? 'var(--primary)'
                  : 'linear-gradient(135deg, var(--primary), #0066FF)',
                color: 'var(--primary-fg)',
                boxShadow: '0 4px 16px var(--primary-glow)',
                transform: isPending ? 'scale(0.95)' : 'scale(1)',
              }}
              onMouseEnter={(e: React.MouseEvent<HTMLButtonElement>) =>
                !isPending && (e.currentTarget.style.transform = 'scale(1.05)')
              }
              onMouseLeave={(e: React.MouseEvent<HTMLButtonElement>) =>
                !isPending && (e.currentTarget.style.transform = 'scale(1)')
              }
            >
              {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
              <span>{isPending ? 'Buscando' : 'Buscar'}</span>
            </button>
          </div>

          {campaignId && canLoadMore && (
            <div className="px-3 pb-3 pt-0 border-t border-border/30 mt-1">
              <button
                type="button"
                onClick={handleLoadMore}
                disabled={isPending}
                className="w-full h-9 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-colors disabled:opacity-50 border border-secondary/40 bg-secondary/5 hover:bg-secondary/10 text-secondary"
              >
                {isPending ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Sparkles className="h-3.5 w-3.5" />
                )}
                Buscar mais leads (~20 próximos)
              </button>
              <p className="text-[10px] text-center mt-1.5" style={{ color: 'var(--foreground-muted)' }}>
                Página {discoveryState?.pages_fetched ?? 0} de até {discoveryState?.max_pages ?? maxPages} no seu plano.
                O token do Google expira em poucos minutos — use em seguida se possível.
              </p>
            </div>
          )}
        </div>

        {isPending && (
          <div
            className="mt-2 rounded-xl px-4 py-3 glass"
            style={{ animation: 'scale-in 0.2s ease', border: '1px solid rgba(0,229,255,0.15)' }}
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="relative w-8 h-8">
                <div
                  className="absolute inset-0 rounded-full"
                  style={{
                    border: '2px solid var(--border)',
                    borderTopColor: 'var(--primary)',
                    animation: 'spin 1s linear infinite',
                  }}
                />
                <Sparkles className="absolute inset-0 m-auto h-3.5 w-3.5" style={{ color: 'var(--primary)' }} />
              </div>
              <div>
                <p className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>
                  Prospectando em <span style={{ color: 'var(--primary)' }}>{region || 'região salva'}</span>
                </p>
                <p className="text-xs" style={{ color: 'var(--foreground-muted)' }}>
                  Buscando <strong>{query || 'próxima página do Maps'}</strong>
                </p>
              </div>
            </div>

            <div className="h-1 rounded-full overflow-hidden mb-3" style={{ background: 'var(--border)' }}>
              <div
                className="h-full rounded-full"
                style={{
                  background: 'linear-gradient(90deg, rgba(0,229,255,0.4), var(--primary), rgba(0,229,255,0.4))',
                  animation: 'loading-bar 2s ease-in-out infinite',
                }}
              />
            </div>

            <div className="flex items-center gap-2 text-[11px]" style={{ color: 'var(--foreground-dim)' }}>
              {['Geolocalizando', 'Google Maps', 'Qualificando IA'].map((step, i) => (
                <span key={step} className="flex items-center gap-1">
                  {i > 0 && <span style={{ color: 'var(--border)' }}>→</span>}
                  <span
                    className="inline-block w-1.5 h-1.5 rounded-full"
                    style={{
                      background: 'var(--primary)',
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
