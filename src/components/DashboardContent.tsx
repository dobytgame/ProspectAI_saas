'use client'

import { useState, useMemo } from 'react'
import LeadMap from '@/components/LeadMap'
import LeadSidebar from '@/components/LeadSidebar'
import SearchForm from '@/components/SearchForm'
import { StatCard } from '@/components/ui/StatCard'
import { Users, Target, TrendingUp } from 'lucide-react'

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
  campaigns: { id: string; name: string }[];
}

const SCORE_RANGES = [
  { label: 'Todos', min: 0, max: 100 },
  { label: '🟢 Qualificado (70+)', min: 70, max: 100 },
  { label: '🟡 Potencial (40-69)', min: 40, max: 69 },
  { label: '🔴 Baixo (<40)', min: 0, max: 39 },
];

export default function DashboardContent({ leads, segment, campaigns }: DashboardContentProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedScoreRange, setSelectedScoreRange] = useState<number>(0)

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

  return (
    <div className="flex-1 overflow-auto p-6">
      {/* Animated Stats Row */}
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

      {/* Main Content: Map + Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-5 h-[calc(100vh-15rem)]">
        {/* Map */}
        <div
          className="lg:col-span-3 rounded-2xl overflow-hidden relative"
          style={{
            background: "var(--background-2)",
            border: "1px solid var(--border)",
          }}
        >
          <SearchForm segment={segment} />
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

        {/* Sidebar: Filters + Lead List */}
        <LeadSidebar 
          leads={leads} 
          filteredLeads={filteredLeads}
          segment={segment} 
          campaigns={campaigns}
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
          selectedScoreRange={selectedScoreRange}
          setSelectedScoreRange={setSelectedScoreRange}
        />
      </div>
    </div>
  )
}
