'use client'

import { useState, useTransition } from 'react'
import { Search, MapPin, Sparkles, Loader2, Radar } from 'lucide-react'
import { searchLeadsAction } from '@/app/(dashboard)/lead-actions'

interface SearchFormProps {
  segment: string;
  campaignId?: string;
  isFloating?: boolean;
}

export default function SearchForm({ segment, campaignId, isFloating = true }: SearchFormProps) {
  const [isPending, startTransition] = useTransition()
  const [query, setQuery] = useState('')
  const [region, setRegion] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!query.trim() || !region.trim()) return

    startTransition(async () => {
      await searchLeadsAction(query, region, campaignId)
      setQuery('')
      setRegion('')
    })
  }

  const containerClasses = isFloating 
    ? "absolute top-4 left-4 z-10 w-[420px]" 
    : "w-full max-w-2xl mx-auto";

  return (
    <div className={containerClasses}>
      <form onSubmit={handleSubmit} className="relative">
        <div className={`
          bg-background/95 backdrop-blur-xl rounded-2xl shadow-2xl border transition-all duration-500
          ${isPending 
            ? 'border-secondary/60 shadow-secondary/20' 
            : 'border-border/50 shadow-black/10'
          }
        `}>
          {/* Header */}
          <div className="px-4 pt-3.5 pb-2 flex items-center gap-2">
            <div className={`p-1.5 rounded-lg transition-colors ${isPending ? 'bg-secondary/20' : 'bg-primary/10'}`}>
              <Radar className={`h-4 w-4 transition-colors ${isPending ? 'text-secondary animate-pulse' : 'text-primary'}`} />
            </div>
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              {campaignId ? 'Descobrir para esta Campanha' : 'Prospecção IA'}
            </span>
          </div>

          {/* Input Row */}
          <div className="px-3 pb-3 flex flex-wrap md:flex-nowrap gap-2">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60" />
              <input
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder={`Ex: ${segment || 'Academias, Restaurantes...'}`}
                disabled={isPending}
                required
                className="w-full h-10 pl-9 pr-3 rounded-xl text-sm bg-muted/40 border border-border/40 
                         placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/30 
                         focus:border-primary/50 transition-all disabled:opacity-50"
              />
            </div>
            <div className="relative w-full md:w-36">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60" />
              <input
                value={region}
                onChange={e => setRegion(e.target.value)}
                placeholder="Cidade/UF"
                disabled={isPending}
                required
                className="w-full h-10 pl-9 pr-3 rounded-xl text-sm bg-muted/40 border border-border/40 
                         placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/30 
                         focus:border-primary/50 transition-all disabled:opacity-50"
              />
            </div>
            <button
              type="submit"
              disabled={isPending}
              className={`
                h-10 px-4 rounded-xl font-semibold text-sm text-white flex items-center gap-2 
                transition-all duration-300 shrink-0 disabled:cursor-wait w-full md:w-auto justify-center
                ${isPending 
                  ? 'bg-secondary shadow-lg shadow-secondary/30 scale-95' 
                  : 'bg-primary hover:bg-primary/90 hover:scale-105 hover:shadow-lg hover:shadow-primary/20 active:scale-95'
                }
              `}
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

        {/* Loading overlay animation */}
        {isPending && (
          <div className="mt-2 bg-background/95 backdrop-blur-xl rounded-xl border border-secondary/40 shadow-lg shadow-secondary/10 px-4 py-3 animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="h-9 w-9 rounded-full border-2 border-secondary/30 border-t-secondary animate-spin" />
                <Sparkles className="h-4 w-4 text-secondary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">
                  Prospectando em {region || '...'}
                </p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-[11px] text-muted-foreground">Buscando</span>
                  <span className="text-[11px] text-secondary font-medium">{query}</span>
                  <span className="flex gap-0.5">
                    <span className="h-1 w-1 rounded-full bg-secondary animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="h-1 w-1 rounded-full bg-secondary animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="h-1 w-1 rounded-full bg-secondary animate-bounce" style={{ animationDelay: '300ms' }} />
                  </span>
                </div>
                <div className="mt-2 h-1 w-full bg-muted/60 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-secondary/60 via-secondary to-secondary/60 rounded-full" 
                       style={{ animation: 'loading-bar 2s ease-in-out infinite' }} />
                </div>
              </div>
            </div>
            <div className="flex gap-2 mt-2.5 text-[10px] text-muted-foreground">
              <span className="flex items-center gap-1">📍 Geolocalizando</span>
              <span>→</span>
              <span className="flex items-center gap-1">🔍 Google Maps</span>
              <span>→</span>
              <span className="flex items-center gap-1">🤖 Qualificando IA</span>
            </div>
          </div>
        )}
      </form>
    </div>
  )
}
