'use client'

import { useMemo, useTransition } from 'react'
import { Badge } from '@/components/ui/badge'
import { LeadScoreDisplay } from '@/components/ui/ScoreBadge'
import { TrendingUp, Filter, SlidersHorizontal, Tag, Phone, Globe, PlusCircle, Loader2 } from 'lucide-react'
import { assignLeadToCampaignAction } from '@/app/(dashboard)/campanhas/actions'

interface Lead {
  id: string;
  name: string;
  score: number;
  address?: string;
  phone?: string;
  website?: string;
  status?: string;
  segment?: string;
  campaign_id?: string;
  metadata?: {
    reasoning?: string;
    search_query?: string;
    rating?: number | null;
    tier?: string;
    priority?: string;
  };
}

interface LeadSidebarProps {
  leads: Lead[];
  filteredLeads: Lead[];
  segment: string;
  campaigns: { id: string; name: string }[];
  selectedCategory: string;
  setSelectedCategory: (cat: string) => void;
  selectedScoreRange: number;
  setSelectedScoreRange: (index: number) => void;
}

const SCORE_RANGES = [
  { label: 'Todos', min: 0, max: 100 },
  { label: '🟢 Qualific.', min: 70, max: 100 },
  { label: '🟡 Potenc.', min: 40, max: 69 },
  { label: '🔴 Baixo', min: 0, max: 39 },
];

export default function LeadSidebar({ 
  leads, 
  filteredLeads,
  segment, 
  campaigns,
  selectedCategory,
  setSelectedCategory,
  selectedScoreRange,
  setSelectedScoreRange
}: LeadSidebarProps) {
  const [isPending, startTransition] = useTransition()

  // Extract unique categories from leads
  const categories = useMemo(() => {
    const cats = new Set<string>();
    leads.forEach(l => {
      const query = l.metadata?.search_query || l.segment;
      if (query) cats.add(query);
    });
    return Array.from(cats);
  }, [leads]);

  const handleAssign = (leadId: string, campaignId: string) => {
    if (!campaignId) return
    startTransition(async () => {
      await assignLeadToCampaignAction(leadId, campaignId)
    })
  }

  return (
    <div className="space-y-4 flex flex-col h-full overflow-hidden">

      {/* Filters Card */}
      <div className="bg-background p-4 rounded-xl border border-border/50 shadow-sm space-y-3">
        <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
          <SlidersHorizontal className="h-3.5 w-3.5" /> Filtros
        </h4>

        {/* Category Filter */}
        {categories.length > 0 && (
          <div>
            <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1 mb-1.5">
              <Tag className="h-3 w-3" /> Categoria
            </label>
            <div className="flex flex-wrap gap-1.5">
              <button
                onClick={() => setSelectedCategory('all')}
                className={`px-2.5 py-1 rounded-full text-[10px] font-medium transition-all border ${
                  selectedCategory === 'all'
                    ? 'bg-primary text-white border-primary shadow-sm'
                    : 'bg-muted/30 text-muted-foreground border-border/50 hover:bg-muted/60'
                }`}
              >
                Todos ({leads.length})
              </button>
              {categories.slice(0, 5).map(cat => {
                const count = leads.filter(l => (l.metadata?.search_query || l.segment) === cat).length;
                return (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-2.5 py-1 rounded-full text-[10px] font-medium transition-all border ${
                      selectedCategory === cat
                        ? 'bg-primary text-white border-primary shadow-sm'
                        : 'bg-muted/30 text-muted-foreground border-border/50 hover:bg-muted/60'
                    }`}
                  >
                    {cat} ({count})
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Score Filter */}
        <div>
          <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1 mb-1.5">
            <TrendingUp className="h-3 w-3" /> Pontuação
          </label>
          <div className="flex flex-wrap gap-1.5">
            {SCORE_RANGES.map((range, i) => (
              <button
                key={i}
                onClick={() => setSelectedScoreRange(i)}
                className={`px-2.5 py-1 rounded-full text-[10px] font-medium transition-all border ${
                  selectedScoreRange === i
                    ? 'bg-primary text-white border-primary shadow-sm'
                    : 'bg-muted/30 text-muted-foreground border-border/50 hover:bg-muted/60'
                }`}
              >
                {range.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Leads List */}
      <div className="bg-background p-4 rounded-xl border border-border/50 shadow-sm grow flex flex-col overflow-hidden">
        <h3 className="font-semibold mb-3 flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-accent" />
            Leads Qualificados
          </div>
          <Badge variant="outline" className="text-[10px] uppercase tracking-wider opacity-60">
            {filteredLeads.length}
          </Badge>
        </h3>
        
        <div className="space-y-2.5 overflow-y-auto flex-1 pr-1 pb-4">
          {filteredLeads.map(lead => (
            <div key={lead.id} className="p-3 rounded-lg border border-border/40 bg-muted/20 hover:bg-muted/40 transition-all group relative">
              <div className="flex items-start justify-between mb-1.5">
                <span className="text-sm font-medium leading-tight group-hover:text-primary transition-colors line-clamp-1 flex-1 mr-2">
                  {lead.name}
                </span>
                <LeadScoreDisplay
                  score={lead.score || 0}
                  tier={lead.metadata?.tier}
                  priority={lead.metadata?.priority}
                  reasoning={lead.metadata?.reasoning}
                  variant="compact"
                  className="shrink-0 max-w-[min(100%,11rem)]"
                />
              </div>

              {/* Contact Info */}
              <div className="flex flex-wrap gap-x-3 gap-y-0.5 mb-2.5">
                {lead.phone && (
                  <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                    <Phone className="h-2.5 w-2.5" /> {lead.phone}
                  </span>
                )}
                {lead.website && (
                  <a href={lead.website} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1 text-[10px] text-blue-500 hover:underline">
                    <Globe className="h-2.5 w-2.5" /> Site
                  </a>
                )}
              </div>

              {/* Campaign Assigner */}
              <div className="flex items-center gap-2 mt-auto pt-2 border-t border-border/40">
                <div className="relative flex-1">
                  <select 
                    defaultValue={lead.campaign_id || ""}
                    onChange={(e) => handleAssign(lead.id, e.target.value)}
                    disabled={isPending}
                    className="w-full bg-background border border-border/50 rounded-md py-1 px-2 text-[10px] font-medium outline-none focus:ring-1 focus:ring-primary/50 transition-all appearance-none pr-6 truncate"
                  >
                    <option value="" disabled>Adicionar à Campanha...</option>
                    {campaigns.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none opacity-50">
                    <PlusCircle className="h-3 w-3" />
                  </div>
                </div>
                {isPending && (
                  <Loader2 className="h-3 w-3 animate-spin text-muted-foreground shrink-0" />
                )}
                {lead.campaign_id && !isPending && (
                    <Badge variant="secondary" className="h-4 px-1.5 text-[9px] bg-secondary/10 text-secondary border-none">✓ Iniciado</Badge>
                )}
              </div>

              {/* AI Reasoning (Hidden by default to save space, visible on hover if small screen or simplified) */}
              {lead.metadata?.reasoning && (
                <p className="text-[10px] text-muted-foreground mt-2 line-clamp-1 italic opacity-60">
                  {lead.metadata.reasoning}
                </p>
              )}
            </div>
          ))}
          
          {filteredLeads.length === 0 && (
            <div className="text-center py-8 opacity-40">
              <Filter className="h-8 w-8 mx-auto mb-2" />
              <p className="text-xs">Nenhum lead encontrado.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
