'use client'

import React, { useState } from 'react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
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
import { MoreHorizontal, GripVertical, MessageSquare } from 'lucide-react'
import LeadChat from './LeadChat'

interface Lead {
  id: string
  name: string
  status: string
  score?: number
}

interface KanbanBoardProps {
  initialLeads: Lead[]
  onStatusChange: (leadId: string, newStatus: string) => void
}

const STAGES = [
  { id: 'new', title: 'Novo' },
  { id: 'contacted', title: 'Contatado' },
  { id: 'interested', title: 'Interessado' },
  { id: 'negotiating', title: 'Negociação' },
  { id: 'closed', title: 'Fechado' },
]

export default function KanbanBoard({ initialLeads, onStatusChange }: KanbanBoardProps) {
  const [leads, setLeads] = useState(initialLeads)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [activeChatLead, setActiveChatLead] = useState<Lead | null>(null)

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
    const overStage = STAGES.find((s) => s.id === overId) || 
                      leads.find((l) => l.id === overId)

    if (activeLead && overStage) {
      const newStatus = overStage.id
      if (activeLead.status !== newStatus && STAGES.some(s => s.id === newStatus)) {
        setLeads((prev) =>
          prev.map((l) => (l.id === activeId ? { ...l, status: newStatus } : l))
        )
      }
    }
  }

  const handleDragEnd = (event: any) => {
    const { active, over } = event
    if (over && active.id !== over.id) {
      const lead = leads.find(l => l.id === active.id)
      if (lead) onStatusChange(lead.id, lead.status)
    }
    setActiveId(null)
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 h-full overflow-x-auto pb-4">
        {STAGES.map((stage) => (
          <div key={stage.id} className="min-w-[300px] flex flex-col h-full bg-muted/20 rounded-xl border border-border/40">
            <div className="p-4 flex items-center justify-between">
              <h3 className="font-semibold text-sm flex items-center gap-2">
                {stage.title}
                <Badge variant="secondary" className="text-[10px] h-5">
                  {leads.filter((l) => l.status === stage.id).length}
                </Badge>
              </h3>
              <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
            </div>

            <div className="flex-1 p-2 space-y-3">
              <SortableContext
                id={stage.id}
                items={leads.filter((l) => l.status === stage.id).map((l) => l.id)}
                strategy={verticalListSortingStrategy}
              >
                {leads
                  .filter((l) => l.status === stage.id)
                  .map((lead) => (
                    <SortableItem key={lead.id} lead={lead} onOpenChat={() => setActiveChatLead(lead)} />
                  ))}
              </SortableContext>
            </div>
          </div>
        ))}
      </div>
      
      {activeChatLead && (
        <LeadChat lead={activeChatLead} onClose={() => setActiveChatLead(null)} />
      )}

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

function SortableItem({ lead, onOpenChat }: { lead: Lead, onOpenChat: () => void }) {
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
      <LeadCard lead={lead} onOpenChat={onOpenChat} dndProps={{ ...attributes, ...listeners }} />
    </div>
  )
}

function LeadCard({ lead, isDragging, onOpenChat, dndProps }: { lead: Lead; isDragging?: boolean, onOpenChat?: () => void, dndProps?: any }) {
  return (
    <Card className={`group relative bg-background border-border/50 shadow-sm hover:shadow-md transition-shadow cursor-grab active:cursor-grabbing ${isDragging ? 'shadow-xl border-primary ring-1 ring-primary' : ''}`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <span className="text-sm font-medium leading-tight">{lead.name}</span>
          <div {...dndProps} className="p-1 -m-1">
            <GripVertical className="h-4 w-4 text-muted-foreground/30 group-hover:text-muted-foreground transition-colors" />
          </div>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge className={`${(lead.score || 0) > 70 ? 'bg-green-500' : 'bg-amber-500'} text-white text-[10px] h-5 px-1.5`}>
              {lead.score || 0}
            </Badge>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-8 px-2 text-secondary hover:text-secondary hover:bg-secondary/10"
            onClick={(e: React.MouseEvent) => {
              e.stopPropagation();
              onOpenChat?.();
            }}
          >
            <MessageSquare className="h-4 w-4 mr-1" />
            <span className="text-[10px] font-bold">Chat</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
