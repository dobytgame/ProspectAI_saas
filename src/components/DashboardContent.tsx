'use client'

import { useState, useMemo } from 'react'
import LeadMap from '@/components/LeadMap'
import LeadSidebar from '@/components/LeadSidebar'
import SearchForm from '@/components/SearchForm'
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

  // Filtered leads (shared between map and sidebar)
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

  // Stats
  const totalLeads = filteredLeads.length
  const qualifiedLeads = filteredLeads.filter(l => l.score >= 70).length
  const avgScore = totalLeads > 0 
    ? Math.round(filteredLeads.reduce((a, c) => a + (c.score || 0), 0) / totalLeads) 
    : 0

  return (
    <div className="flex-1 overflow-auto p-6">
      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-4 mb-5">
        <div className="bg-background p-5 rounded-2xl border border-border/50 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Leads Encontrados</p>
            <div className="p-2 rounded-lg bg-primary/10">
              <Users className="h-4 w-4 text-primary" />
            </div>
          </div>
          <h3 className="text-3xl font-bold tracking-tight">{totalLeads}</h3>
          {leads.length !== totalLeads && (
            <p className="text-[10px] text-muted-foreground mt-1">de {leads.length} total</p>
          )}
        </div>
        <div className="bg-background p-5 rounded-2xl border border-border/50 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Qualificados</p>
            <div className="p-2 rounded-lg bg-green-500/10">
              <Target className="h-4 w-4 text-green-500" />
            </div>
          </div>
          <h3 className="text-3xl font-bold tracking-tight text-green-600">{qualifiedLeads}</h3>
          {totalLeads > 0 && (
            <p className="text-[10px] text-muted-foreground mt-1">{Math.round(qualifiedLeads / totalLeads * 100)}% do total</p>
          )}
        </div>
        <div className="bg-background p-5 rounded-2xl border border-border/50 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Score Médio</p>
            <div className="p-2 rounded-lg bg-secondary/10">
              <TrendingUp className="h-4 w-4 text-secondary" />
            </div>
          </div>
          <h3 className={`text-3xl font-bold tracking-tight ${avgScore >= 70 ? 'text-green-600' : avgScore >= 40 ? 'text-amber-500' : 'text-red-400'}`}>
            {avgScore}
          </h3>
          <p className="text-[10px] text-muted-foreground mt-1">
            {avgScore >= 70 ? 'Excelente' : avgScore >= 40 ? 'Regular' : avgScore > 0 ? 'Precisa melhorar' : '—'}
          </p>
        </div>
      </div>

      {/* Main Content: Map + Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-5 h-[calc(100vh-15rem)]">
        {/* Map */}
        <div className="lg:col-span-3 bg-background rounded-2xl border border-border/50 shadow-sm overflow-hidden relative">
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
