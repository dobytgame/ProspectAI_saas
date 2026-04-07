'use client'

import React, { useState, useRef } from 'react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  useDroppable,
  defaultDropAnimationSideEffects,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { LeadScoreDisplay } from '@/components/ui/ScoreBadge'
import { Button } from '@/components/ui/button'
import { MoreHorizontal, GripVertical, MessageSquare, Search, Download, Upload } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import KanbanLeadSheet from './KanbanLeadSheet'

import { importLeads } from '@/app/(dashboard)/pipeline/actions'
import { PlanType, PLAN_LIMITS } from '@/utils/plan-limits'
import UpgradeModal from './UpgradeModal'

interface Lead {
  id: string
  name: string
  status: string
  score?: number
  phone?: string
  website?: string
  address?: string
  segment?: string
  metadata?: any
  updated_at?: string
  campaign_id?: string
  campaign_name?: string
}

interface KanbanBoardProps {
  initialLeads: Lead[]
  onStatusChange: (leadId: string, newStatus: string) => void
  plan: PlanType
}

const STAGES = [
  { id: 'new', title: 'Novo', accent: 'border-l-sky-500/80 dark:border-l-sky-400/70' },
  { id: 'contacted', title: 'Contatado', accent: 'border-l-violet-500/80 dark:border-l-violet-400/70' },
  { id: 'interested', title: 'Interessado', accent: 'border-l-amber-500/85 dark:border-l-amber-400/75' },
  { id: 'negotiating', title: 'Negociação', accent: 'border-l-orange-500/80 dark:border-l-orange-400/70' },
  { id: 'closed', title: 'Fechado', accent: 'border-l-emerald-600/85 dark:border-l-emerald-400/75' },
] as const

export default function KanbanBoard({ initialLeads, onStatusChange, plan }: KanbanBoardProps) {
  const [leads, setLeads] = useState(initialLeads)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [activeSheetLead, setActiveSheetLead] = useState<Lead | null>(null)
  const [search, setSearch] = useState('')
  const [filterTier, setFilterTier] = useState<string | null>(null)
  const [filterCampaign, setFilterCampaign] = useState<string | null>(null)
  const [filterSegment, setFilterSegment] = useState<string | null>(null)
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  const [upgradeTitle, setUpgradeTitle] = useState('')
  const [upgradeDesc, setUpgradeDesc] = useState('')

  const campaigns = Array.from(new Set(initialLeads.map(l => l.campaign_name).filter(Boolean)))
  const segments = Array.from(new Set(initialLeads.map(l => l.segment).filter(Boolean)))

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragStart = (event: any) => {
    setActiveId(event.active.id)
  }

  const handleDragOver = (event: any) => {
    const { active, over } = event
    if (!over) return

    const activeId = active.id
    const overId = over.id

    if (activeId === overId) return

    const activeLead = leads.find((l) => l.id === activeId)
    const overLead = leads.find((l) => l.id === overId)
    const overStageId = overLead ? overLead.status : overId

    if (activeLead && overStageId) {
      if (activeLead.status !== overStageId && STAGES.some(s => s.id === overStageId)) {
        setLeads((prev) =>
          prev.map((l) => (l.id === activeId ? { ...l, status: overStageId } : l))
        )
      }
    }
  }

  const handleDragEnd = (event: any) => {
    const { active, over } = event
    if (over && active.id !== over.id) {
      const overId = over.id
      const overLead = leads.find(l => l.id === overId)
      const overStageId = overLead ? overLead.status : overId
      
      const activeLead = leads.find(l => l.id === active.id)
      
      if (activeLead && activeLead.status !== overStageId) {
        onStatusChange(activeLead.id, overStageId)
        setLeads((prev) =>
          prev.map((l) => (l.id === active.id ? { ...l, status: overStageId } : l))
        )
      }
    }
    setActiveId(null)
  }

  const filteredLeads = leads.filter(l => {
    const matchesSearch = l.name.toLowerCase().includes(search.toLowerCase()) || 
                          l.segment?.toLowerCase().includes(search.toLowerCase()) ||
                          l.address?.toLowerCase().includes(search.toLowerCase());
    const matchesTier = filterTier ? l.metadata?.tier === filterTier : true;
    const matchesCampaign = filterCampaign ? l.campaign_name === filterCampaign : true;
    const matchesSegment = filterSegment ? l.segment === filterSegment : true;
    
    return matchesSearch && matchesTier && matchesCampaign && matchesSegment;
  })

  const fileInputRef = useRef<HTMLInputElement>(null)
  const handleImportCSV = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!PLAN_LIMITS[plan].features.includes('can_import_csv')) {
      setUpgradeTitle("Importação de CSV Bloqueada")
      setUpgradeDesc("A importação direta de leads via CSV é uma funcionalidade exclusiva dos planos PRO e Scale.")
      setShowUpgradeModal(true)
      return
    }

    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = async (event) => {
      const text = event.target?.result as string
      const lines = text.split('\n')
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase())
      
      const importedLeads = lines.slice(1).filter(line => line.trim()).map(line => {
        const values = line.split(',').map(v => v.trim())
        const lead: any = {}
        headers.forEach((header, index) => {
          if (header === 'nome') lead.name = values[index]
          if (header === 'telefone') lead.phone = values[index]
          if (header === 'website') lead.website = values[index]
          if (header === 'segmento') lead.segment = values[index]
          if (header === 'endereco') lead.address = values[index]
        })
        return lead
      }).filter(l => l.name)

      if (importedLeads.length > 0) {
        try {
          await importLeads(importedLeads)
          alert(`${importedLeads.length} leads importados com sucesso!`)
        } catch (error: any) {
          alert(error.message || 'Erro ao importar leads')
        }
      }
    }
    reader.readAsText(file)
  }

  const exportToCSV = () => {
    if (!PLAN_LIMITS[plan].features.includes('can_export_csv')) {
      setUpgradeTitle("Exportação de CSV Bloqueada")
      setUpgradeDesc("A exportação de dados é uma funcionalidade disponível a partir do plano Starter.")
      setShowUpgradeModal(true)
      return
    }

    const headers = ['Nome', 'Status', 'Score', 'Telefone', 'Website', 'Segmento', 'Campanha']
    const rows = filteredLeads.map(l => [
      l.name,
      l.status,
      l.score || 0,
      l.phone || '',
      l.website || '',
      l.segment || '',
      l.campaign_name || ''
    ])

    const csvContent = [
      headers.join(','),
      ...rows.map(r => r.join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.setAttribute('href', url)
    link.setAttribute('download', `leads-prospectai-${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="flex h-full min-h-0 w-full min-w-0 flex-col">
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <UpgradeModal 
        isOpen={showUpgradeModal} 
        onClose={() => setShowUpgradeModal(false)}
        title={upgradeTitle}
        description={upgradeDesc}
        currentPlan={plan}
      />
      <div className="flex min-h-0 flex-1 flex-col">
        {/* Toolbar: altura fixa, tema consistente, responsivo */}
        <div className="mb-4 shrink-0 space-y-3">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div className="relative w-full min-w-0 max-w-md">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome, segmento ou endereço..."
                className="h-10 border-border/50 bg-background pl-9 shadow-sm transition-colors focus-visible:ring-primary/30"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept=".csv"
                onChange={handleImportCSV}
              />
              <Button
                variant="outline"
                size="sm"
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="h-9 gap-2 border-border/50 bg-background shadow-sm hover:bg-muted/60"
              >
                <Upload className="h-4 w-4" />
                Importar CSV
              </Button>
              <Button
                variant="outline"
                size="sm"
                type="button"
                onClick={exportToCSV}
                className="h-9 gap-2 border-border/50 bg-background shadow-sm hover:bg-muted/60"
              >
                <Download className="h-4 w-4" />
                Exportar CSV
              </Button>
              <select
                className="h-9 min-w-[160px] flex-1 rounded-md border border-border/50 bg-background px-3 text-sm shadow-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:flex-none sm:min-w-[180px]"
                value={filterCampaign || ''}
                onChange={(e) => setFilterCampaign(e.target.value || null)}
                aria-label="Filtrar por campanha"
              >
                <option value="">Todas as campanhas</option>
                {campaigns.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              <select
                className="h-9 min-w-[160px] flex-1 rounded-md border border-border/50 bg-background px-3 text-sm shadow-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:flex-none sm:min-w-[180px]"
                value={filterSegment || ''}
                onChange={(e) => setFilterSegment(e.target.value || null)}
                aria-label="Filtrar por segmento"
              >
                <option value="">Todos os segmentos</option>
                {segments.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 border-t border-border/40 pt-3">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Classe</span>
            {(['A+', 'A', 'B', 'C'] as const).map((tier) => (
              <Button
                key={tier}
                type="button"
                variant={filterTier === tier ? 'secondary' : 'outline'}
                size="sm"
                onClick={() => setFilterTier(filterTier === tier ? null : tier)}
                className="h-8 rounded-full px-3 text-xs font-semibold"
              >
                {tier}
              </Button>
            ))}
            {filterTier && (
              <Button type="button" variant="ghost" size="sm" className="h-8 text-xs" onClick={() => setFilterTier(null)}>
                Limpar filtro
              </Button>
            )}
          </div>
        </div>

        {/* Colunas: ocupam todo o espaço vertical restante; scroll horizontal no quadro */}
        <div className="flex min-h-0 flex-1 gap-4 overflow-x-auto overflow-y-hidden pb-1 [scrollbar-gutter:stable]">
          {STAGES.map((stage) => (
            <DroppableColumn key={stage.id} stage={stage}>
              <div className="flex shrink-0 items-center justify-between border-b border-border/40 bg-background/80 px-4 py-3 backdrop-blur-sm dark:bg-background/60">
                <h3 className="flex items-center gap-2 text-sm font-semibold tracking-tight text-foreground">
                  {stage.title}
                  <Badge variant="secondary" className="h-5 min-w-[1.25rem] justify-center px-1.5 text-[10px] font-bold tabular-nums">
                    {filteredLeads.filter((l) => l.status === stage.id).length}
                  </Badge>
                </h3>
                <button
                  type="button"
                  className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  aria-label={`Opções da coluna ${stage.title}`}
                >
                  <MoreHorizontal className="h-4 w-4" />
                </button>
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden p-2">
                <SortableContext
                  id={stage.id}
                  items={filteredLeads.filter((l) => l.status === stage.id).map((l) => l.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="flex flex-col gap-3 pb-2">
                    {filteredLeads
                      .filter((l) => l.status === stage.id)
                      .map((lead) => (
                        <SortableItem
                          key={lead.id}
                          lead={lead}
                          onOpenSheet={() => setActiveSheetLead(lead)}
                        />
                      ))}
                  </div>
                </SortableContext>
              </div>
            </DroppableColumn>
          ))}
        </div>
      </div>
      
      <KanbanLeadSheet 
        lead={activeSheetLead ? (leads.find(l => l.id === activeSheetLead.id) || activeSheetLead) : null} 
        isOpen={!!activeSheetLead} 
        onClose={() => setActiveSheetLead(null)} 
      />

      <DragOverlay>
        {activeId ? (
          <div className="w-[280px]">
            <LeadCard lead={leads.find((l) => l.id === activeId)!} isDragging />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
    </div>
  )
}

function DroppableColumn({
  stage,
  children,
}: {
  stage: (typeof STAGES)[number]
  children: React.ReactNode
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: stage.id,
  })

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'flex h-full min-h-0 w-[min(100%,300px)] min-w-[280px] shrink-0 flex-col self-stretch overflow-hidden rounded-xl border border-border/50 border-l-4 bg-muted/45 shadow-sm transition-[box-shadow,background-color] duration-200 dark:bg-muted/25',
        stage.accent,
        isOver && 'bg-primary/[0.07] shadow-md ring-2 ring-primary/25 dark:bg-primary/[0.12]'
      )}
    >
      {children}
    </div>
  )
}

function SortableItem({ lead, onOpenSheet }: { lead: Lead; onOpenSheet: () => void }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: lead.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0 : 1,
  }

  return (
    <div ref={setNodeRef} style={style}>
      <LeadCard lead={lead} onOpenSheet={onOpenSheet} dndProps={{ ...attributes, ...listeners }} />
    </div>
  )
}

function LeadCard({ lead, isDragging, onOpenSheet, dndProps }: { lead: Lead; isDragging?: boolean; onOpenSheet?: () => void; dndProps?: any }) {
  const timeSinceActivity = lead.updated_at 
    ? Math.floor((new Date().getTime() - new Date(lead.updated_at).getTime()) / (1000 * 3600 * 24))
    : 0;

  return (
    <Card 
      className={`group relative cursor-pointer border-border/50 bg-background shadow-sm transition-[box-shadow,border-color] duration-200 hover:border-primary/25 hover:shadow-md ${isDragging ? 'shadow-xl border-primary ring-1 ring-primary' : ''}`}
      onClick={() => onOpenSheet?.()}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <span className="text-sm font-medium leading-tight">{lead.name}</span>
          <div {...dndProps} className="p-1 -m-1 cursor-grab active:cursor-grabbing" onClick={(e) => e.stopPropagation()}>
            <GripVertical className="h-4 w-4 text-muted-foreground/30 group-hover:text-muted-foreground transition-colors" />
          </div>
        </div>
        
        {lead.metadata?.tags && lead.metadata.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {lead.metadata.tags.map((tag: string) => (
              <Badge key={tag} className="text-[9px] bg-muted/50 text-muted-foreground font-medium border-border/40">
                {tag}
              </Badge>
            ))}
          </div>
        )}
        
        <div className="flex items-center justify-between mt-4">
          <div className="flex items-center gap-2">
            <LeadScoreDisplay
              score={lead.score || 0}
              tier={lead.metadata?.tier}
              priority={lead.metadata?.priority}
              reasoning={lead.metadata?.reasoning}
              variant="compact"
              className="max-w-[min(100%,10.5rem)]"
            />
            {timeSinceActivity >= 0 && (
              <span className="text-[10px] text-muted-foreground font-medium">
                {timeSinceActivity === 0 ? 'Hoje' : `${timeSinceActivity}d atrás`}
              </span>
            )}
          </div>
          {lead.phone ? (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-9 w-9 shrink-0 text-[#25D366] hover:bg-[#25D366]/10 dark:hover:bg-[#25D366]/15"
              aria-label="Abrir WhatsApp"
              onClick={(e) => {
                e.stopPropagation()
                window.open(`https://wa.me/55${lead.phone?.replace(/\D/g, '')}`, '_blank')
              }}
            >
              <MessageSquare className="h-4 w-4" />
            </Button>
          ) : null}
        </div>
      </CardContent>
    </Card>
  )
}
