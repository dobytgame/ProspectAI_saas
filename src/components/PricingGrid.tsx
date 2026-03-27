'use client'

import { useState } from 'react'
import { Check, Info, Sparkles } from 'lucide-react'
import UpgradeClientButton from './UpgradeClientButton'

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

export default function PricingGrid({ currentPlan }: { currentPlan: string }) {
  const [isAnnual, setIsAnnual] = useState(false)

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
    <div className="w-full space-y-12">
      {/* Toggle */}
      <div className="flex flex-col items-center justify-center space-y-4">
        <div className="flex items-center gap-4 bg-muted/50 p-1.5 rounded-2xl border border-border/50">
          <button
            onClick={() => setIsAnnual(false)}
            className={`px-6 py-2 rounded-xl text-sm font-semibold transition-all ${!isAnnual ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
          >
            Mensal
          </button>
          <button
            onClick={() => setIsAnnual(true)}
            className={`px-6 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 ${isAnnual ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
          >
            Anual
            <span className="bg-green-500/10 text-green-500 text-[10px] px-2 py-0.5 rounded-full border border-green-500/20">
              -2 meses
            </span>
          </button>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {plans.map((plan) => (
          <div
            key={plan.slug}
            className={`relative flex flex-col p-8 rounded-3xl transition-all duration-300 ${
              plan.featured 
                ? 'bg-background border-2 border-primary shadow-2xl shadow-primary/10 scale-105 z-10' 
                : 'bg-background border border-border/50 hover:border-border hover:shadow-xl'
            }`}
          >
            {plan.featured && (
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-4 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 shadow-lg">
                <Sparkles className="h-3 w-3" />
                Destaque
              </div>
            )}

            <div className="mb-8">
              <h3 className={`text-lg font-bold mb-2 ${plan.featured ? 'text-primary' : ''}`}>
                {plan.name}
              </h3>
              <p className="text-sm text-muted-foreground min-h-[40px]">
                {plan.description}
              </p>
              <div className="mt-6 flex items-baseline gap-1">
                <span className="text-4xl font-black">
                  R$ {isAnnual ? (plan.price.annual / 12).toFixed(0) : plan.price.monthly}
                </span>
                <span className="text-muted-foreground text-sm font-medium">
                  /mês
                </span>
              </div>
              {isAnnual && plan.slug !== 'free' && (
                <p className="text-xs text-green-500 mt-2 font-medium">
                  R$ {plan.price.annual} cobrado anualmente
                </p>
              )}
            </div>

            <div className="space-y-4 mb-8 flex-1">
              <ul className="space-y-3">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex gap-2.5 text-sm text-foreground/80 leading-snug">
                    <Check className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
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
