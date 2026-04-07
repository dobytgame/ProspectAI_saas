'use client'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import PricingGrid from './PricingGrid'
import { ArrowUpRight, Zap } from 'lucide-react'

interface UpgradeModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  description?: string
  currentPlan: string
}

/**
 * Modal de upgrade — “sinal radar” alinhado ao tema dark + cyan do produto:
 * grade técnica, glow primário, tipografia com contraste editorial (mono + sans Geist).
 */
export default function UpgradeModal({
  isOpen,
  onClose,
  title = 'Limite de Plano Atingido',
  description = 'Você atingiu o limite do seu plano atual. Faça o upgrade para continuar escalando sua prospecção.',
  currentPlan,
}: UpgradeModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(next) => !next && onClose()}>
      <DialogContent
        showCloseButton
        overlayClassName="bg-[#050810]/80 supports-backdrop-filter:backdrop-blur-md"
        className="max-h-[min(92vh,900px)] w-[calc(100%-1.25rem)] max-w-5xl gap-0 overflow-hidden border-0 bg-transparent p-0 shadow-none ring-0 sm:max-w-5xl"
      >
        <div className="relative flex max-h-[min(92vh,900px)] flex-col overflow-hidden rounded-2xl border border-primary/20 bg-card shadow-[0_0_0_1px_rgba(0,229,255,0.08),0_32px_120px_rgba(0,0,0,0.65)]">
          {/* Glow + grid (âncora visual) */}
          <div
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_90%_60%_at_50%_-30%,var(--primary-glow),transparent_55%)]"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.06] motion-reduce:opacity-[0.03]"
            style={{
              backgroundImage: `linear-gradient(to right, var(--border) 1px, transparent 1px), linear-gradient(to bottom, var(--border) 1px, transparent 1px)`,
              backgroundSize: '28px 28px',
            }}
            aria-hidden
          />
          {/* Scan line sutil */}
          <div
            className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent motion-reduce:hidden"
            aria-hidden
          />

          <header className="relative z-[1] shrink-0 border-b border-border/50 px-5 pb-6 pt-7 sm:px-8 sm:pb-7 sm:pt-8">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between sm:gap-8">
              <DialogHeader className="space-y-3 text-left sm:max-w-[min(100%,28rem)]">
                <p className="font-mono text-[10px] font-medium uppercase tracking-[0.32em] text-primary">
                  Upgrade
                </p>
                <DialogTitle className="font-sans text-2xl font-bold leading-tight tracking-tight text-foreground sm:text-[1.65rem]">
                  {title}
                </DialogTitle>
                <DialogDescription className="text-[15px] leading-relaxed text-muted-foreground sm:text-base">
                  {description}
                </DialogDescription>
                <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground sm:hidden">
                  Plano atual ·{' '}
                  <span className="text-foreground/90">
                    {(currentPlan || 'free').toUpperCase()}
                  </span>
                </p>
              </DialogHeader>

              <div className="flex shrink-0 items-center gap-3 sm:flex-col sm:items-end">
                <div className="relative flex h-[4.5rem] w-[4.5rem] items-center justify-center rounded-2xl border border-primary/35 bg-primary/[0.08] sm:h-16 sm:w-16">
                  <div
                    className="absolute inset-0 rounded-2xl bg-primary/[0.06] motion-safe:animate-pulse motion-reduce:animate-none"
                    aria-hidden
                  />
                  <Zap
                    className="relative z-[1] h-8 w-8 text-primary drop-shadow-[0_0_14px_rgba(0,229,255,0.45)]"
                    aria-hidden
                  />
                </div>
                <p className="hidden font-mono text-[10px] uppercase tracking-widest text-foreground-dim sm:block">
                  Plano atual ·{' '}
                  <span className="text-foreground/90">
                    {(currentPlan || 'free').toUpperCase()}
                  </span>
                </p>
              </div>
            </div>
          </header>

          <div className="relative z-[1] min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-5 sm:px-8 sm:py-6">
            <PricingGrid currentPlan={currentPlan} variant="modal" />
          </div>

          <footer className="relative z-[1] shrink-0 border-t border-border/40 bg-muted/20 px-5 py-3.5 sm:px-8">
            <div className="flex flex-col items-center justify-center gap-1 sm:flex-row sm:gap-3">
              <p className="text-center font-mono text-[10px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
                Pagamento seguro · Stripe
              </p>
              <span className="hidden text-border sm:inline" aria-hidden>
                |
              </span>
              <p className="flex items-center gap-1 text-center text-[10px] text-muted-foreground/90">
                <ArrowUpRight className="h-3 w-3 shrink-0 text-primary/80" aria-hidden />
                Cancele quando quiser
              </p>
            </div>
          </footer>
        </div>
      </DialogContent>
    </Dialog>
  )
}
