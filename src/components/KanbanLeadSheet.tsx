'use client'

import { useState } from 'react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { LeadScoreDisplay } from "@/components/ui/ScoreBadge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { saveLeadNote, toggleLeadTag, generatePipelineMessage } from "@/app/(dashboard)/pipeline/actions"
import { Building2, MessageSquare, Bot, MapPin, Star, History, Tag, Loader2, Send, Sparkles, Copy, Check } from "lucide-react"

interface KanbanLeadSheetProps {
  lead: any | null
  isOpen: boolean
  onClose: () => void
}

export default function KanbanLeadSheet({ lead, isOpen, onClose }: KanbanLeadSheetProps) {
  const [noteText, setNoteText] = useState('')
  const [tagText, setTagText] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [copiedMessage, setCopiedMessage] = useState(false)

  if (!lead) return null

  const handleSaveNote = async () => {
    if (!noteText.trim()) return
    setIsSaving(true)
    try {
      await saveLeadNote(lead.id, noteText)
      setNoteText('')
    } finally {
      setIsSaving(false)
    }
  }

  const handleGenerateMessage = async () => {
    if (!lead?.campaign_id) return
    setIsGenerating(true)
    try {
      await generatePipelineMessage(lead.id, lead.campaign_id)
    } catch (e) {
      console.error(e)
    } finally {
      setIsGenerating(false)
    }
  }

  const handleToggleTag = async (tag: string) => {
    if (!tag.trim()) return
    try {
      await toggleLeadTag(lead.id, tag.trim())
      setTagText('')
    } catch (e) {
      console.error(e)
    }
  }

  const handleCopyGeneratedMessage = async () => {
    const message = lead?.metadata?.generated_message
    if (!message) return

    try {
      await navigator.clipboard.writeText(message)
      setCopiedMessage(true)
      setTimeout(() => setCopiedMessage(false), 1800)
    } catch (e) {
      console.error(e)
    }
  }

  const tags = lead.metadata?.tags || []
  const notes = lead.metadata?.notes || []
  const history = lead.metadata?.contact_history || []
  
  // Combine and sort activities
  const allActivity = [
    ...notes.map((n: any) => ({ ...n, type: 'note' })),
    ...history.map((h: any) => ({ ...h, type: 'contact' }))
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto p-0 flex flex-col pt-6">
        
        {/* Header Fixed Top */}
        <div className="px-6 pb-6 pt-2 border-b">
          <SheetHeader className="text-left space-y-4">
            <div>
              <div className="flex items-start justify-between gap-4">
                <SheetTitle className="text-xl leading-tight">{lead.name}</SheetTitle>
                <LeadScoreDisplay
                  score={lead.score || 0}
                  tier={lead.metadata?.tier}
                  priority={lead.metadata?.priority}
                  reasoning={lead.metadata?.reasoning}
                  variant="block"
                  className="shrink-0"
                />
              </div>
              <SheetDescription className="mt-2 flex flex-wrap gap-2 text-xs">
                {lead.campaign_name && (
                  <Badge variant="secondary" className="font-normal text-[10px] bg-secondary/10">Campanha: {lead.campaign_name}</Badge>
                )}
                {lead.segment && (
                  <Badge variant="secondary" className="font-normal text-[10px] capitalize bg-muted/50">{lead.segment}</Badge>
                )}
                {lead.address && lead.address.includes(',') && (
                  <Badge variant="secondary" className="font-normal text-[10px] bg-muted/50">
                    {lead.address.split(',').pop()?.trim().substring(0, 15)}...
                  </Badge>
                )}
              </SheetDescription>
            </div>
            
            <div className="flex gap-2">
              <Button 
                variant="default" 
                className="flex-1 bg-[#25D366] hover:bg-[#20bd5a] text-white"
                onClick={() => lead.phone && window.open(`https://wa.me/55${lead.phone.replace(/\D/g,'')}`, '_blank')}
                disabled={!lead.phone}
              >
                <MessageSquare className="h-4 w-4 mr-2" />
                WhatsApp
              </Button>
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={() => lead.website && window.open(lead.website, '_blank')}
                disabled={!lead.website}
              >
                Website
              </Button>
            </div>
          </SheetHeader>
        </div>

        {/* Tabs Body */}
        <Tabs defaultValue="info" className="flex-1 flex flex-col mt-4 px-6">
          <TabsList className="w-full grid-cols-3 grid mb-6">
            <TabsTrigger value="info">Info</TabsTrigger>
            <TabsTrigger value="ai">Agente IA</TabsTrigger>
            <TabsTrigger value="history">Histórico</TabsTrigger>
          </TabsList>

          <TabsContent value="info" className="space-y-6 pb-6 outline-none">
            <div className="space-y-3">
              <h4 className="text-sm font-semibold flex items-center gap-2">
                <Building2 className="h-4 w-4 text-primary" />
                Dados do Lead
              </h4>
              <div className="text-sm space-y-2 text-muted-foreground bg-muted/30 p-3 rounded-xl border border-border/40">
                <div className="flex gap-2 items-start">
                  <MapPin className="h-4 w-4 mt-0.5 shrink-0" />
                  <p>{lead.address || 'Endereço não disponível'}</p>
                </div>
                {lead.metadata?.rating && (
                  <div className="flex gap-2 items-start">
                    <Star className="h-4 w-4 mt-0.5 shrink-0 text-amber-500 fill-amber-500" />
                    <p>{lead.metadata.rating} / 5 estrelas</p>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="text-sm font-semibold flex items-center gap-2">
                <Tag className="h-4 w-4 text-primary" />
                Tags do Lead
              </h4>
              <div className="flex flex-wrap gap-2 mb-3">
                {tags.length === 0 && <span className="text-xs text-muted-foreground">Sem tags</span>}
                {tags.map((tag: string) => (
                  <Badge 
                    key={tag} 
                    variant="secondary" 
                    className="cursor-pointer hover:bg-destructive hover:text-destructive-foreground transition-colors"
                    onClick={() => handleToggleTag(tag)}
                    title="Clique para remover"
                  >
                    {tag} &times;
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2">
                <Input 
                  placeholder="Nova tag..." 
                  value={tagText}
                  onChange={e => setTagText(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleToggleTag(tagText)}
                  className="h-8 text-xs"
                />
                <Button size="sm" className="h-8 px-3" onClick={() => handleToggleTag(tagText)}>Adicionar</Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="ai" className="space-y-6 pb-6 outline-none">
            <div className="space-y-3">
              <h4 className="text-sm font-semibold flex items-center gap-2">
                <Bot className="h-4 w-4 text-secondary" />
                Análise de Fit (Score)
              </h4>
              <p className="text-sm text-muted-foreground bg-secondary/5 border border-secondary/20 p-3 rounded-xl">
                {lead.metadata?.reasoning || 'Nenhuma justificativa gerada.'}
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold">Mensagem Sugerida</h4>
                {lead.campaign_id && !lead.metadata?.generated_message && (
                  <Button 
                    size="sm" 
                    variant="default" 
                    className="h-8 text-xs" 
                    onClick={handleGenerateMessage}
                    disabled={isGenerating}
                  >
                    {isGenerating ? <Loader2 className="h-3 w-3 animate-spin mr-2" /> : <Sparkles className="h-3 w-3 mr-2" />}
                    Gerar com IA
                  </Button>
                )}
              </div>
              {lead.metadata?.generated_message ? (
                <div className="bg-muted p-4 rounded-xl text-sm whitespace-pre-wrap border border-border/50 relative group">
                  {lead.metadata.generated_message}
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={handleCopyGeneratedMessage}
                  >
                    {copiedMessage ? (
                      <span className="inline-flex items-center gap-1">
                        <Check className="h-3.5 w-3.5 text-green-600" />
                        Copiado
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1">
                        <Copy className="h-3.5 w-3.5" />
                        Copiar
                      </span>
                    )}
                  </Button>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground italic">Nenhuma mensagem gerada para este lead na campanha atual.</p>
              )}
            </div>
          </TabsContent>

          <TabsContent value="history" className="flex flex-col h-[calc(100vh-16rem)] pb-6 outline-none">
            
            <div className="flex-1 overflow-y-auto mb-4 pr-2 space-y-4">
              {allActivity.length === 0 ? (
                <p className="text-xs text-center text-muted-foreground mt-8">Nenhum evento registrado.</p>
              ) : (
                allActivity.map((activity: any, i: number) => (
                  <div key={i} className="flex gap-3 text-sm">
                    <div className="mt-1 shrink-0 h-2 w-2 rounded-full bg-primary/40 ring-4 ring-primary/10" />
                    <div className="flex-1 bg-muted/40 p-2.5 rounded-lg border border-border/40">
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-semibold text-xs capitalize">
                          {activity.type === 'note' ? 'Anotação' : activity.type}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          {new Date(activity.date).toLocaleDateString()} {new Date(activity.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </span>
                      </div>
                      {activity.type === 'note' && (
                        <p className="text-xs text-muted-foreground whitespace-pre-wrap">{activity.text}</p>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="pt-2 border-t mt-auto relative">
               <Textarea 
                placeholder="Adicionar anotação..."
                className="min-h-[80px] text-sm resize-none pr-12 pb-2"
                value={noteText}
                onChange={e => setNoteText(e.target.value)}
              />
              <Button 
                size="icon" 
                className="absolute right-2 bottom-3 h-8 w-8 rounded-full"
                onClick={handleSaveNote}
                disabled={isSaving || !noteText.trim()}
              >
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </div>
          </TabsContent>
        </Tabs>

      </SheetContent>
    </Sheet>
  )
}
