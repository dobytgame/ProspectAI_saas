'use client'

import { useState } from 'react'
import { Check, Sparkles } from 'lucide-react'
import UpgradeClientButton from './UpgradeClientButton'
import { cn } from '@/lib/utils'

interface Plan {
  name: string
  slug: string
  description: string
  price: { monthly: number; annual: number }
  priceIdMonthly: string
  priceIdAnnual: string
  features: string[]
  notIncluded?: string[]
  featured?: boolean
  buttonVariant: 'primary' | 'secondary' | 'outline'
}

export default function PricingGrid({
  currentPlan,
  variant = 'default',
}: {
  currentPlan: string
  /** `modal`: grid 2 colunas, sem scale no card PRO (evita overflow no dialog) */
  variant?: 'default' | 'modal'
}) {
  const [isAnnual, setIsAnnual] = useState(false)
  const isModal = variant === 'modal'

  const plans: Plan[] = [
    {
      name: 'Free',
      slug: 'free',
      description: 'Para validar sua estratégia inicial.',
      price: { monthly: 0, annual: 0 },
      priceIdMonthly: '',
      priceIdAnnual: '',
      features: [
        '100 leads / mês',
        '1 Agente de Negócios',
        'IA Escritora (Abordagem Básica)',
        '1 Campanha ativa',
        'Visualização Leads Maps',
        'Suporte via e-mail',
      ],
      buttonVariant: 'outline'
    },
    {
      name: 'Starter',
      slug: 'starter',
      description: 'Ideal para profissionais autônomos.',
      price: { monthly: 97, annual: 970 },
      priceIdMonthly: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_STARTER_MONTHLY || '',
      priceIdAnnual: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_STARTER_ANNUAL || '',
      features: [
        '300 leads / mês',
        'Copywriter IA (Vendas Pro - GPT4)',
        '3 Campanhas ativas',
        'Exportar CSV',
        'Filtros Avançados Maps',
        'Suporte via e-mail',
      ],
      buttonVariant: 'secondary'
    },
    {
      name: 'PRO',
      slug: 'pro',
      description: 'O plano completo para escala.',
      price: { monthly: 197, annual: 1970 },
      priceIdMonthly: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_PRO_MONTHLY || '',
      priceIdAnnual: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_PRO_ANNUAL || '',
      featured: true,
      features: [
        '1.000 leads / mês',
        'IA de Vendas Consultiva (Premium)',
        'Até 3 Usuários',
        'Auto Follow-up (CRM)',
        'Campanhas Ilimitadas',
        'Importar CSV',
        'Filtros Avançados Maps',
        'Suporte via e-mail',
      ],
      buttonVariant: 'primary'
    },
    {
      name: 'Scale',
      slug: 'scale',
      description: 'Para operações de alto volume.',
      price: { monthly: 397, annual: 3970 },
      priceIdMonthly: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_SCALE_MONTHLY || '',
      priceIdAnnual: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_SCALE_ANNUAL || '',
      features: [
        '5.000 leads / mês',
        'Inteligência de Escala (Atendimento IA)',
        'Até 5 usuários vinculados',
        'A/B Testing de Mensagens',
        'ICP Dinâmico (IA Aprende)',
        'Enriquecimento de Sites',
        'Auto Follow-up (CRM)',
        'Campanhas Ilimitadas',
        'Importar CSV',
        'Filtros Avançados Maps',
        'Suporte Prioritário VIP',
      ],
      buttonVariant: 'secondary'
    }
  ]

  return (
    <div className={cn('w-full', isModal ? 'space-y-6' : 'space-y-12')}>
      {/* Toggle */}
      <div className="flex flex-col items-center justify-center space-y-4">
        <div
          className={cn(
            'flex items-center gap-2 rounded-2xl border border-border/50 bg-muted/50 p-1.5 sm:gap-4',
            isModal && 'w-full max-w-md justify-center'
          )}
        >
          <button
            type="button"
            onClick={() => setIsAnnual(false)}
            className={cn(
              'rounded-xl px-5 py-2 text-sm font-semibold transition-all sm:px-6',
              !isAnnual
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            Mensal
          </button>
          <button
            type="button"
            onClick={() => setIsAnnual(true)}
            className={cn(
              'flex items-center gap-2 rounded-xl px-5 py-2 text-sm font-semibold transition-all sm:px-6',
              isAnnual
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            Anual
            <span className="rounded-full border border-green-500/20 bg-green-500/10 px-2 py-0.5 text-[10px] text-green-500">
              -2 meses
            </span>
          </button>
        </div>
      </div>

      {/* Grid */}
      <div
        className={cn(
          'grid gap-4 md:gap-6',
          isModal
            ? 'grid-cols-1 sm:grid-cols-2'
            : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4'
        )}
      >
        {plans.map((plan) => (
          <div
            key={plan.slug}
            className={cn(
              'relative flex flex-col rounded-3xl bg-background transition-all duration-300',
              isModal ? 'p-6' : 'p-8',
              plan.featured
                ? cn(
                    'z-[1] border-2 border-primary shadow-2xl shadow-primary/15',
                    !isModal && 'z-10 scale-105'
                  )
                : 'border border-border/50 hover:border-border hover:shadow-xl'
            )}
          >
            {plan.featured && (
              <div className="absolute -top-3 left-1/2 flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-primary px-3 py-1 text-xs font-bold text-primary-foreground shadow-lg sm:-top-4 sm:px-4">
                <Sparkles className="h-3 w-3" />
                Destaque
              </div>
            )}

            <div className={cn('mb-6', !isModal && 'mb-8')}>
              <h3
                className={cn(
                  'mb-2 text-lg font-bold',
                  plan.featured && 'text-primary'
                )}
              >
                {plan.name}
              </h3>
              <p
                className={cn(
                  'min-h-[40px] text-sm text-muted-foreground',
                  isModal && 'min-h-0'
                )}
              >
                {plan.description}
              </p>
              <div className="mt-5 flex items-baseline gap-1 sm:mt-6">
                <span
                  className={cn(
                    'font-black',
                    isModal ? 'text-3xl' : 'text-4xl'
                  )}
                >
                  R$ {isAnnual ? (plan.price.annual / 12).toFixed(0) : plan.price.monthly}
                </span>
                <span className="text-sm font-medium text-muted-foreground">
                  /mês
                </span>
              </div>
              {isAnnual && plan.slug !== 'free' && (
                <p className="text-xs text-green-500 mt-2 font-medium">
                  R$ {plan.price.annual} cobrado anualmente
                </p>
              )}
            </div>

            <div className={cn('mb-6 flex-1 space-y-3', !isModal && 'mb-8 space-y-4')}>
              <ul className={cn('space-y-2.5', !isModal && 'space-y-3')}>
                {plan.features.map((feature, i) => (
                  <li
                    key={i}
                    className="flex gap-2.5 text-sm leading-snug text-foreground/80"
                  >
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-[var(--green)]" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>

            <UpgradeClientButton
              isCurrentPlan={currentPlan === plan.slug}
              priceId={isAnnual ? plan.priceIdAnnual : plan.priceIdMonthly}
              variant={plan.buttonVariant}
              label={plan.slug === 'free' ? 'Plano Gratuito' : 'Selecionar'}
            />
          </div>
        ))}
      </div>
    </div>
  )
}
