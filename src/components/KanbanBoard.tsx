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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { MoreHorizontal, GripVertical, MessageSquare, Bot, Search, Filter, Download, Upload } from 'lucide-react'
import { Input } from '@/components/ui/input'
import LeadChat from './LeadChat'
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
  { id: 'new', title: 'Novo' },
  { id: 'contacted', title: 'Contatado' },
  { id: 'interested', title: 'Interessado' },
  { id: 'negotiating', title: 'Negociação' },
  { id: 'closed', title: 'Fechado' },
]

export default function KanbanBoard({ initialLeads, onStatusChange, plan }: KanbanBoardProps) {
  const [leads, setLeads] = useState(initialLeads)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [activeChatLead, setActiveChatLead] = useState<Lead | null>(null)
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
      <div className="flex items-center gap-4 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome ou segmento..."
            className="pl-9 bg-white"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
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
            onClick={() => fileInputRef.current?.click()}
            className="bg-white border-border/40 hover:bg-muted/50 text-muted-foreground gap-2"
          >
            <Upload className="h-4 w-4" />
            Importar CSV
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={exportToCSV}
            className="bg-white border-border/40 hover:bg-muted/50 text-muted-foreground gap-2"
          >
            <Download className="h-4 w-4" />
            Exportar CSV
          </Button>
          <Input
            type="text"
            placeholder="Tier..."
            className="w-20 bg-white"
            value={filterTier || ''}
            onChange={(e) => setFilterTier(e.target.value.toUpperCase() || null)}
            maxLength={2}
          />
          <select 
            className="flex h-10 w-[180px] items-center justify-between rounded-md border border-input bg-white px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            value={filterCampaign || ''}
            onChange={(e) => setFilterCampaign(e.target.value || null)}
          >
            <option value="">Todas Campanhas</option>
            {campaigns.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <select 
            className="flex h-10 w-[180px] items-center justify-between rounded-md border border-input bg-white px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            value={filterSegment || ''}
            onChange={(e) => setFilterSegment(e.target.value || null)}
          >
            <option value="">Todos Segmentos</option>
            {segments.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div className="flex gap-2">
          {['A+', 'A', 'B', 'C'].map(tier => (
            <Button
              key={tier}
              variant={filterTier === tier ? "secondary" : "outline"}
              size="sm"
              onClick={() => setFilterTier(filterTier === tier ? null : tier)}
              className="h-9"
            >
              Tier {tier}
            </Button>
          ))}
        </div>
      </div>

      <div className="flex gap-4 h-full overflow-x-auto pb-4">
        {STAGES.map((stage) => (
          <DroppableColumn key={stage.id} stage={stage} leadsCount={filteredLeads.filter((l) => l.status === stage.id).length}>
            <div className="p-4 flex items-center justify-between">
              <h3 className="font-semibold text-sm flex items-center gap-2">
                {stage.title}
                <Badge variant="secondary" className="text-[10px] h-5">
                  {filteredLeads.filter((l) => l.status === stage.id).length}
                </Badge>
              </h3>
              <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
            </div>

            <div className="flex-1 p-2 space-y-3">
              <SortableContext
                id={stage.id}
                items={filteredLeads.filter((l) => l.status === stage.id).map((l) => l.id)}
                strategy={verticalListSortingStrategy}
              >
                {filteredLeads
                  .filter((l) => l.status === stage.id)
                  .map((lead) => (
                    <SortableItem key={lead.id} lead={lead} onOpenChat={() => setActiveChatLead(lead)} onOpenSheet={() => setActiveSheetLead(lead)} />
                  ))}
              </SortableContext>
            </div>
          </DroppableColumn>
        ))}
      </div>
      
      {activeChatLead && (
        <LeadChat lead={activeChatLead} onClose={() => setActiveChatLead(null)} />
      )}

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
  )
}

function DroppableColumn({ stage, leadsCount, children }: { stage: any, leadsCount: number, children: React.ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({
    id: stage.id,
  })

  return (
    <div 
      ref={setNodeRef} 
      className={`min-w-[300px] flex flex-col h-full rounded-xl border border-border/40 transition-colors ${
        isOver ? 'bg-muted/40 border-primary/50' : 'bg-muted/20'
      }`}
    >
      {children}
    </div>
  )
}

function SortableItem({ lead, onOpenChat, onOpenSheet }: { lead: Lead, onOpenChat: () => void, onOpenSheet: () => void }) {
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
      <LeadCard lead={lead} onOpenChat={onOpenChat} onOpenSheet={onOpenSheet} dndProps={{ ...attributes, ...listeners }} />
    </div>
  )
}

function LeadCard({ lead, isDragging, onOpenChat, onOpenSheet, dndProps }: { lead: Lead; isDragging?: boolean, onOpenChat?: () => void, onOpenSheet?: () => void, dndProps?: any }) {
  const timeSinceActivity = lead.updated_at 
    ? Math.floor((new Date().getTime() - new Date(lead.updated_at).getTime()) / (1000 * 3600 * 24))
    : 0;

  return (
    <Card 
      className={`group relative bg-background border-border/50 shadow-sm hover:shadow-md transition-shadow cursor-pointer ${isDragging ? 'shadow-xl border-primary ring-1 ring-primary' : ''}`}
      onClick={(e) => {
        // Only open sheet if we are not clicking a button inside (handled by stopPropagation on buttons)
        onOpenSheet?.();
      }}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <span className="text-sm font-medium leading-tight">{lead.name}</span>
          <div {...dndProps} className="p-1 -m-1 cursor-grab active:cursor-grabbing" onClick={(e) => e.stopPropagation()}>
            <GripVertical className="h-4 w-4 text-muted-foreground/30 group-hover:text-muted-foreground transition-colors" />
          </div>
        </div>
        
        {lead.metadata?.tier && (
          <Badge variant="outline" className="mb-2 text-[10px] font-bold border-secondary/20 text-secondary bg-secondary/5">
            Tier {lead.metadata.tier}
          </Badge>
        )}
        
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
            <Badge className={`${(lead.score || 0) > 70 ? 'bg-green-500' : 'bg-amber-500'} text-white text-[10px] h-5 px-1.5 border-none shadow-sm`}>
              {lead.score || 0}
            </Badge>
            {timeSinceActivity >= 0 && (
              <span className="text-[10px] text-muted-foreground font-medium">
                {timeSinceActivity === 0 ? 'Hoje' : `${timeSinceActivity}d atrás`}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            {lead.phone && (
              <Button variant="ghost" size="icon" className="h-7 w-7 text-green-600 hover:bg-green-50" onClick={(e) => { e.stopPropagation(); window.open(`https://wa.me/55${lead.phone?.replace(/\D/g,'')}`, '_blank'); }}>
                <MessageSquare className="h-3 w-3" />
              </Button>
            )}
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-7 px-2 text-secondary hover:text-secondary hover:bg-secondary/10"
              onClick={(e: React.MouseEvent) => {
                e.stopPropagation();
                onOpenChat?.();
              }}
            >
              <Bot className="h-3 w-3 mr-1" />
              <span className="text-[10px] font-bold">IA</span>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
