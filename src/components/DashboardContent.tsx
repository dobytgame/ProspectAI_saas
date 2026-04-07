'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import LeadMap from '@/components/LeadMap'
import SearchForm from '@/components/SearchForm'
import { StatCard } from '@/components/ui/StatCard'
import { Button } from '@/components/ui/button'
import { Users, Target, TrendingUp, Handshake, Clock, Sparkles, ArrowRight } from 'lucide-react'
import { Progress } from "@/components/ui/progress"

interface Lead {
  id: string;
  name: string;
  lat: number;
  lng: number;
  score: number;
  address: string;
  phone: string;
  website: string;
  status: string;
  segment: string;
  rating: number | null;
  reasoning: string;
  metadata?: {
    reasoning?: string;
    search_query?: string;
    rating?: number | null;
  };
}

interface DashboardContentProps {
  leads: Lead[];
  segment: string;
  pipelineStats?: {
    total?: number;
    contacted?: number;
    interested?: number;
    closed?: number;
    avg_score?: number;
  };
  recentActivity?: Array<{
    name: string;
    status: string;
  }>;
  currentPlan: string;
  /** True quando o usuário pulou a base de conhecimento no onboarding (metadata). */
  showIcpBasicBanner?: boolean;
}

const SCORE_RANGES = [
  { label: 'Todos', min: 0, max: 100 },
  { label: '🟢 Qualificado (70+)', min: 70, max: 100 },
  { label: '🟡 Potencial (40-69)', min: 40, max: 69 },
  { label: '🔴 Baixo (<40)', min: 0, max: 39 },
];

export default function DashboardContent({ leads, segment, pipelineStats = {}, recentActivity = [], currentPlan, showIcpBasicBanner = false }: DashboardContentProps) {
  const [selectedCategory] = useState<string>('all')
  const [selectedScoreRange] = useState<number>(0)

  const filteredLeads = useMemo(() => {
    const range = SCORE_RANGES[selectedScoreRange]
    return leads.filter(l => {
      const score = l.score || 0
      const inScore = score >= range.min && score <= range.max
      if (selectedCategory === 'all') return inScore
      const cat = l.metadata?.search_query || l.segment || ''
      return inScore && cat === selectedCategory
    }).sort((a, b) => (b.score || 0) - (a.score || 0))
  }, [leads, selectedCategory, selectedScoreRange])

  const totalLeads = filteredLeads.length
  const qualifiedLeads = filteredLeads.filter(l => l.score >= 70).length
  const avgScore = totalLeads > 0 
    ? Math.round(filteredLeads.reduce((a, c) => a + (c.score || 0), 0) / totalLeads) 
    : 0
  const avgScoreValue = pipelineStats?.avg_score ?? avgScore
  const pipelineTotal = pipelineStats?.total ?? 0
  const pipelineContacted = pipelineStats?.contacted ?? 0
  const pipelineInterested = pipelineStats?.interested ?? 0
  const pipelineClosed = pipelineStats?.closed ?? 0

  return (
    <div className="flex-1 flex flex-col overflow-auto md:overflow-hidden p-3 sm:p-6 space-y-4 sm:space-y-6">
      {showIcpBasicBanner && (
        <div
          className="shrink-0 rounded-2xl border px-4 py-3 sm:px-5 sm:py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
          style={{
            borderColor: "rgba(0, 229, 255, 0.35)",
            background:
              "linear-gradient(135deg, rgba(0,229,255,0.08) 0%, rgba(0,102,255,0.06) 100%)",
            boxShadow: "0 0 24px rgba(0,229,255,0.08)",
          }}
        >
          <div className="flex gap-3 min-w-0">
            <div
              className="shrink-0 h-10 w-10 rounded-xl flex items-center justify-center"
              style={{ background: "var(--primary-dim)", color: "var(--primary)" }}
            >
              <Sparkles className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-foreground leading-snug">
                Sua IA está em modo básico
              </p>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                Você entrou sem site, PDF ou texto na base. Adicione fontes em{" "}
                <strong className="text-foreground/90">Configurações → Negócio &amp; IA</strong> e
                rode a síntese para mensagens e scores mais alinhados ao seu negócio.
              </p>
            </div>
          </div>
          <Button
            asChild
            className="shrink-0 h-10 font-bold rounded-xl bg-primary text-black hover:bg-primary/90 shadow-md shadow-primary/20"
          >
            <Link href="/settings" className="inline-flex items-center gap-2">
              Alimentar a IA agora
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      )}

      {/* Animated Stats Row (4 Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4 shrink-0">
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
          label="Score Médio (Funil)"
          value={avgScoreValue}
          sub={avgScoreValue >= 70 ? "Excelente" : avgScoreValue >= 40 ? "Regular" : "—"}
          color={avgScoreValue >= 70 ? "var(--green)" : avgScoreValue >= 40 ? "var(--yellow)" : "var(--red)"}
          icon={<TrendingUp className="h-4 w-4" />}
          delay={160}
        />
        <StatCard
          label="Fechamentos (Won)"
          value={pipelineClosed}
          sub={pipelineTotal > 0 ? `${Math.round((pipelineClosed / pipelineTotal) * 100)}% de conversão` : "0% de conversão"}
          color="var(--primary)"
          icon={<Handshake className="h-4 w-4" />}
          delay={240}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 lg:items-stretch flex-1 min-h-0">
        {/* Left Column: Funnel & Activity */}
        <div className="lg:col-span-1 flex flex-col gap-4 h-full">
          {/* Funnel Metrics */}
          <div className="bg-background rounded-2xl border border-border/40 p-4 sm:p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <Target className="h-4 w-4 text-primary" />
              <h3 className="font-semibold text-sm">Funil de Conversão</h3>
            </div>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Descobertos</span>
                  <span className="font-medium text-foreground">{pipelineTotal}</span>
                </div>
                <Progress value={100} className="h-1.5 bg-muted/30 [&>div]:bg-muted-foreground/30" />
              </div>
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Contatados</span>
                  <span className="font-medium text-purple-600">{pipelineContacted}</span>
                </div>
                <Progress value={pipelineTotal ? (pipelineContacted / pipelineTotal) * 100 : 0} className="h-1.5 bg-purple-100 [&>div]:bg-purple-600" />
              </div>
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Interessados</span>
                  <span className="font-medium text-blue-600">{pipelineInterested}</span>
                </div>
                <Progress value={pipelineContacted ? (pipelineInterested / pipelineContacted) * 100 : 0} className="h-1.5 bg-blue-100 [&>div]:bg-blue-600" />
              </div>
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Fechados</span>
                  <span className="font-medium text-green-600">{pipelineClosed}</span>
                </div>
                <Progress value={pipelineInterested ? (pipelineClosed / pipelineInterested) * 100 : 0} className="h-1.5 bg-green-100 [&>div]:bg-green-600" />
              </div>
            </div>
          </div>

          {/* Recent Activity Feed */}
          <div className="bg-background rounded-2xl border border-border/40 p-4 sm:p-5 shadow-sm flex-1 flex flex-col">
            <div className="flex items-center gap-2 mb-4">
              <Clock className="h-4 w-4 text-primary" />
              <h3 className="font-semibold text-sm">Atividade Recente</h3>
            </div>
            <div className="space-y-3 flex-1 overflow-auto max-h-[300px] lg:max-h-none pr-2 scrollbar-thin">
              {recentActivity.length === 0 ? (
                <div className="flex-1 flex items-center justify-center">
                  <p className="text-xs text-muted-foreground text-center py-4 italic">Nenhuma atividade recente.</p>
                </div>
              ) : (
                recentActivity.map((activity, i) => (
                  <div key={i} className="flex gap-3 text-sm">
                    <div className="mt-1 shrink-0 h-2 w-2 rounded-full bg-primary/40 ring-4 ring-primary/10"></div>
                    <div>
                      <p className="font-medium leading-none text-[13px]">{activity.name}</p>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                        Moveu para <strong className="font-semibold capitalize">{activity.status}</strong>
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Map */}
        <div
          className="lg:col-span-3 rounded-2xl overflow-hidden relative flex flex-col min-h-[420px] md:min-h-0"
          style={{
            background: "var(--background-2)",
            border: "1px solid var(--border)",
          }}
        >
          <SearchForm segment={segment} currentPlan={currentPlan} />
          <LeadMap leads={filteredLeads.map(l => ({
            id: l.id,
            name: l.name,
            lat: l.lat,
            lng: l.lng,
            score: l.score,
            address: l.address,
            phone: l.phone,
            website: l.website,
            status: l.status,
            rating: l.rating,
            reasoning: l.reasoning,
          }))} />
        </div>
      </div>
    </div>
  )
}
