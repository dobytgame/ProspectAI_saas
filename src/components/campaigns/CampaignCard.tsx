'use client'

import { useState, useRef, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { MessageCircle, Mail, ExternalLink, Pencil, Check, X, Loader2 } from 'lucide-react'
import Link from 'next/link'
import DeleteCampaignButton from './DeleteCampaignButton'
import { renameCampaignAction } from '@/app/(dashboard)/campanhas/actions'

interface CampaignCardProps {
  campaign: {
    id: string
    name: string
    description: string | null
    channel: string
    status: string
    leads: { count: number }[]
  }
}

export default function CampaignCard({ campaign }: CampaignCardProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [name, setName] = useState(campaign.name)
  const inputRef = useRef<HTMLInputElement>(null)
  const [isPending, startTransition] = useTransition()

  function startEditing() {
    setIsEditing(true)
    setTimeout(() => inputRef.current?.select(), 0)
  }

  function cancelEditing() {
    setName(campaign.name)
    setIsEditing(false)
  }

  function saveName() {
    const trimmedName = name.trim()
    if (!trimmedName || trimmedName === campaign.name) {
      cancelEditing()
      return
    }
    startTransition(async () => {
      await renameCampaignAction(campaign.id, trimmedName)
      setIsEditing(false)
    })
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') {
      e.preventDefault()
      saveName()
    } else if (e.key === 'Escape') {
      cancelEditing()
    }
  }

  return (
    <div className="bg-background rounded-2xl border border-border/50 shadow-sm overflow-hidden flex flex-col hover:shadow-md transition-shadow">
      <div className="p-6 flex-1">
        <div className="flex items-start justify-between mb-4">
          <div className={`p-2 rounded-xl ${campaign.channel === 'whatsapp' ? 'bg-green-500/10 text-green-600' : 'bg-blue-500/10 text-blue-600'}`}>
            {campaign.channel === 'whatsapp' ? <MessageCircle className="h-6 w-6" /> : <Mail className="h-6 w-6" />}
          </div>
          <Badge
            variant={campaign.status === 'active' ? 'default' : 'secondary'}
            className={`${campaign.status === 'active' ? 'bg-green-500 hover:bg-green-600' : ''} text-[10px]`}
          >
            {campaign.status === 'active' ? 'Ativa' : 'Rascunho'}
          </Badge>
        </div>

        {/* Editable campaign name */}
        <div className="flex items-center gap-2 mb-2 group">
          {isEditing ? (
            <div className="flex items-center gap-1.5 flex-1">
              <input
                ref={inputRef}
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={handleKeyDown}
                onBlur={saveName}
                disabled={isPending}
                className="flex-1 text-xl font-bold bg-muted/50 px-2 py-0.5 rounded-lg border border-border/60 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
              />
              {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground shrink-0" />
              ) : (
                <>
                  <button
                    type="button"
                    onClick={saveName}
                    className="p-1 rounded-md hover:bg-green-500/10 text-green-600 transition-colors shrink-0"
                  >
                    <Check className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={cancelEditing}
                    className="p-1 rounded-md hover:bg-destructive/10 text-destructive transition-colors shrink-0"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </>
              )}
            </div>
          ) : (
            <>
              <h3 className="text-xl font-bold">{campaign.name}</h3>
              <button
                type="button"
                onClick={startEditing}
                className="p-1 rounded-md opacity-0 group-hover:opacity-100 hover:bg-muted text-muted-foreground hover:text-foreground transition-all shrink-0"
                title="Renomear campanha"
              >
                <Pencil className="h-3.5 w-3.5" />
              </button>
            </>
          )}
        </div>

        <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{campaign.description}</p>

        <div className="flex items-center gap-4 py-4 border-t border-border/40">
          <div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Leads</p>
            <p className="text-lg font-bold">{(campaign.leads?.[0] as any)?.count || 0}</p>
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Conversão</p>
            <p className="text-lg font-bold">0%</p>
          </div>
        </div>
      </div>

      <div className="bg-muted/30 p-4 border-t border-border/40 flex items-center justify-between">
        <div className="flex gap-2">
          <DeleteCampaignButton campaignId={campaign.id} campaignName={campaign.name} />
        </div>
        <Link href={`/campanhas/${campaign.id}`}>
          <Button variant="outline" size="sm" className="gap-2 h-9">
            Ver Detalhes <ExternalLink className="h-3.5 w-3.5" />
          </Button>
        </Link>
      </div>
    </div>
  )
}
