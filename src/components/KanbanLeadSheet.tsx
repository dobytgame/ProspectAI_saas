'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { LeadScoreDisplay } from '@/components/ui/ScoreBadge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { saveLeadNote, toggleLeadTag, generatePipelineMessage } from '@/app/(dashboard)/pipeline/actions'
import {
  MessageSquare,
  MapPin,
  Star,
  Loader2,
  Send,
  Sparkles,
  Copy,
  Check,
  Phone,
  ExternalLink,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface KanbanLeadSheetProps {
  lead: any | null
  isOpen: boolean
  onClose: () => void
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">{children}</p>
  )
}

export default function KanbanLeadSheet({ lead, isOpen, onClose }: KanbanLeadSheetProps) {
  const router = useRouter()
  const [noteText, setNoteText] = useState('')
  const [tagText, setTagText] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [copiedMessage, setCopiedMessage] = useState(false)
  const [copiedPhone, setCopiedPhone] = useState(false)

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
      router.refresh()
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

  const handleCopyPhone = async () => {
    if (!lead.phone) return
    try {
      await navigator.clipboard.writeText(lead.phone)
      setCopiedPhone(true)
      setTimeout(() => setCopiedPhone(false), 1600)
    } catch (e) {
      console.error(e)
    }
  }

  const tags = lead.metadata?.tags || []
  const notes = lead.metadata?.notes || []
  const history = lead.metadata?.contact_history || []

  const allActivity = [
    ...notes.map((n: any) => ({ ...n, type: 'note' as const })),
    ...history.map((h: any) => ({ ...h, type: 'contact' as const })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  const waHref = lead.phone
    ? `https://wa.me/55${String(lead.phone).replace(/\D/g, '')}`
    : null

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        className={cn(
          'flex h-full w-full max-w-none flex-col gap-0 border-l border-border/60 bg-background p-0 shadow-2xl',
          'data-[side=right]:w-full sm:max-w-md lg:max-w-lg'
        )}
      >
        <div className="shrink-0 border-b border-border/50 bg-gradient-to-b from-muted/40 to-background px-6 pb-5 pt-10 dark:from-muted/20">
          <SheetHeader className="space-y-4 p-0 text-left">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
              <div className="min-w-0 flex-1 space-y-2">
                <SheetTitle className="text-xl font-bold leading-tight tracking-tight text-foreground">
                  {lead.name}
                </SheetTitle>
                <SheetDescription asChild>
                  <div className="flex flex-wrap gap-2">
                    {lead.campaign_name ? (
                      <Badge
                        variant="secondary"
                        className="max-w-full truncate border border-border/50 bg-background/80 font-normal text-[10px] text-foreground"
                      >
                        {lead.campaign_name}
                      </Badge>
                    ) : null}
                    {lead.segment ? (
                      <Badge
                        variant="outline"
                        className="border-primary/20 bg-primary/5 font-normal text-[10px] capitalize text-foreground"
                      >
                        {lead.segment}
                      </Badge>
                    ) : null}
                  </div>
                </SheetDescription>
              </div>
              <LeadScoreDisplay
                score={lead.score || 0}
                tier={lead.metadata?.tier}
                priority={lead.metadata?.priority}
                reasoning={lead.metadata?.reasoning}
                variant="block"
                className="w-full shrink-0 sm:w-auto sm:max-w-[200px]"
              />
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              <Button
                type="button"
                className="h-11 flex-1 gap-2 bg-[#25D366] font-semibold text-white shadow-sm hover:bg-[#20bd5a] dark:hover:bg-[#22c55e]"
                disabled={!waHref}
                onClick={() => waHref && window.open(waHref, '_blank')}
              >
                <MessageSquare className="h-4 w-4" />
                WhatsApp
              </Button>
              <Button
                type="button"
                variant="outline"
                className="h-11 flex-1 gap-2 border-border/60 bg-background shadow-sm"
                disabled={!lead.website}
                onClick={() => lead.website && window.open(lead.website, '_blank')}
              >
                <ExternalLink className="h-4 w-4 shrink-0 opacity-70" />
                Site
              </Button>
            </div>
            {lead.phone ? (
              <div className="flex items-center gap-2 rounded-lg border border-border/50 bg-muted/30 px-3 py-2 dark:bg-muted/20">
                <Phone className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
                <a
                  href={`tel:${String(lead.phone).replace(/\s/g, '')}`}
                  className="min-w-0 flex-1 truncate text-sm font-medium text-primary underline-offset-4 hover:underline"
                >
                  {lead.phone}
                </a>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 shrink-0 px-2 text-xs"
                  onClick={handleCopyPhone}
                >
                  {copiedPhone ? (
                    <span className="inline-flex items-center gap-1 text-green-600">
                      <Check className="h-3.5 w-3.5" />
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
            ) : null}
          </SheetHeader>
        </div>

        <Tabs defaultValue="details" className="flex min-h-0 flex-1 flex-col">
          <div className="shrink-0 border-b border-border/40 px-6 pt-4">
            <TabsList className="grid h-11 w-full grid-cols-2 rounded-xl bg-muted/50 p-1 dark:bg-muted/30">
              <TabsTrigger
                value="details"
                className="rounded-lg text-xs font-semibold data-[state=active]:bg-background data-[state=active]:shadow-sm"
              >
                Detalhes
              </TabsTrigger>
              <TabsTrigger
                value="history"
                className="rounded-lg text-xs font-semibold data-[state=active]:bg-background data-[state=active]:shadow-sm"
              >
                Histórico
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent
            value="details"
            className="mt-0 flex-1 overflow-y-auto overscroll-contain px-6 py-5 outline-none"
          >
            <div className="space-y-8">
              <section className="space-y-3">
                <SectionLabel>Dados</SectionLabel>
                <div className="space-y-3 rounded-xl border border-border/50 bg-muted/20 p-4 dark:bg-muted/15">
                  <div className="flex gap-3 text-sm text-foreground">
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
                    <p className="leading-relaxed text-muted-foreground">{lead.address || 'Endereço não informado.'}</p>
                  </div>
                  {lead.metadata?.rating != null && lead.metadata?.rating !== '' ? (
                    <div className="flex gap-3 text-sm">
                      <Star
                        className="mt-0.5 h-4 w-4 shrink-0 fill-amber-500 text-amber-500"
                        aria-hidden
                      />
                      <p className="text-muted-foreground">
                        <span className="font-semibold text-foreground">{lead.metadata.rating}</span> no Google
                      </p>
                    </div>
                  ) : null}
                </div>
              </section>

              <section className="space-y-3">
                <SectionLabel>Por que essa nota</SectionLabel>
                <div className="rounded-xl border-l-4 border-primary/50 bg-primary/[0.04] py-3 pl-4 pr-3 dark:bg-primary/[0.08]">
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {lead.metadata?.reasoning?.trim() || 'Nenhuma análise registrada para este lead.'}
                  </p>
                </div>
              </section>

              <section className="space-y-3">
                <SectionLabel>Mensagem sugerida</SectionLabel>
                {lead.metadata?.generated_message ? (
                  <div className="relative rounded-xl border border-secondary/25 bg-secondary/5 p-4 dark:bg-secondary/10">
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      className="absolute right-3 top-3 h-8 shadow-sm"
                      onClick={handleCopyGeneratedMessage}
                    >
                      {copiedMessage ? (
                        <span className="inline-flex items-center gap-1.5 text-xs font-medium">
                          <Check className="h-3.5 w-3.5 text-green-600" />
                          Copiado
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-xs font-medium">
                          <Copy className="h-3.5 w-3.5" />
                          Copiar
                        </span>
                      )}
                    </Button>
                    <p className="whitespace-pre-wrap pr-2 pt-10 text-sm leading-relaxed text-foreground sm:pr-24 sm:pt-0">
                      {lead.metadata.generated_message}
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-4 rounded-xl border border-dashed border-border/60 bg-muted/10 px-4 py-8 text-center dark:bg-muted/5">
                    <p className="max-w-sm text-sm text-muted-foreground">
                      {lead.campaign_id
                        ? 'Ainda não há mensagem de prospecção para este lead. Gere uma sugestão alinhada à campanha atual.'
                        : 'Associe este lead a uma campanha no dashboard ou na lista lateral para poder gerar mensagem com IA.'}
                    </p>
                    {lead.campaign_id ? (
                      <Button
                        type="button"
                        size="default"
                        className="h-11 w-full max-w-xs gap-2 font-semibold shadow-sm"
                        onClick={handleGenerateMessage}
                        disabled={isGenerating}
                      >
                        {isGenerating ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Sparkles className="h-4 w-4" />
                        )}
                        Gerar mensagem com IA
                      </Button>
                    ) : null}
                  </div>
                )}
              </section>

              <section className="space-y-3">
                <SectionLabel>Tags</SectionLabel>
                <div className="flex flex-wrap gap-2">
                  {tags.length === 0 ? (
                    <span className="text-xs text-muted-foreground">Nenhuma tag ainda.</span>
                  ) : (
                    tags.map((tag: string) => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => handleToggleTag(tag)}
                        className="inline-flex items-center gap-1 rounded-full border border-border/60 bg-muted/40 px-3 py-1 text-xs font-medium text-foreground transition-colors hover:border-destructive/40 hover:bg-destructive/10 hover:text-destructive"
                        title="Remover tag"
                      >
                        {tag}
                        <span className="text-muted-foreground" aria-hidden>
                          ×
                        </span>
                      </button>
                    ))
                  )}
                </div>
                <div className="flex gap-2">
                  <Input
                    placeholder="Nova tag…"
                    value={tagText}
                    onChange={(e) => setTagText(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleToggleTag(tagText)}
                    className="h-10 border-border/50 bg-background text-sm"
                  />
                  <Button type="button" className="h-10 shrink-0 px-4" onClick={() => handleToggleTag(tagText)}>
                    Adicionar
                  </Button>
                </div>
              </section>
            </div>
          </TabsContent>

          <TabsContent
            value="history"
            className="mt-0 flex min-h-0 flex-1 flex-col overflow-hidden outline-none"
          >
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 py-4">
              {allActivity.length === 0 ? (
                <p className="mt-10 text-center text-sm text-muted-foreground">
                  Nenhuma anotação ou contato registrado.
                </p>
              ) : (
                <ul className="space-y-4" aria-label="Linha do tempo">
                  {allActivity.map((activity: any, i: number) => (
                    <li key={i} className="flex gap-3">
                      <div
                        className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary ring-4 ring-primary/15"
                        aria-hidden
                      />
                      <div className="min-w-0 flex-1 rounded-xl border border-border/40 bg-muted/25 p-3 dark:bg-muted/15">
                        <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
                          <span className="text-xs font-semibold capitalize text-foreground">
                            {activity.type === 'note' ? 'Anotação' : activity.type}
                          </span>
                          <time
                            className="text-[10px] tabular-nums text-muted-foreground"
                            dateTime={activity.date}
                          >
                            {new Date(activity.date).toLocaleDateString()}{' '}
                            {new Date(activity.date).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </time>
                        </div>
                        {activity.type === 'note' ? (
                          <p className="whitespace-pre-wrap text-xs leading-relaxed text-muted-foreground">
                            {activity.text}
                          </p>
                        ) : null}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="shrink-0 border-t border-border/50 bg-background/95 px-6 py-4 backdrop-blur-sm dark:bg-background/90">
              <SectionLabel>Nova anotação</SectionLabel>
              <div className="relative mt-2">
                <Textarea
                  placeholder="Escreva uma nota interna sobre este lead…"
                  className="min-h-[88px] resize-none border-border/50 bg-muted/20 pr-14 text-sm dark:bg-muted/10"
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                />
                <Button
                  type="button"
                  size="icon"
                  className="absolute bottom-2 right-2 h-9 w-9 rounded-full shadow-md"
                  onClick={handleSaveNote}
                  disabled={isSaving || !noteText.trim()}
                  aria-label="Salvar anotação"
                >
                  {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  )
}
