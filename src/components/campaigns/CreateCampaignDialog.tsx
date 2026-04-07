'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import { Plus, Mail, MessageCircle, Loader2 } from 'lucide-react'
import { createCampaignAction } from '@/app/(dashboard)/campanhas/actions'
import UpgradeModal from '@/components/UpgradeModal'
import { isPlanLimitError } from '@/utils/plan-limits'

interface CampaignKnowledgeOption {
  id: string
  name: string
}

interface CreateCampaignDialogProps {
  currentPlan: string
  /** Quando true, "Nova Campanha" abre o modal de upgrade em vez do formulário */
  atCampaignLimit?: boolean
  /** Perfis com status completed — opcional na criação da campanha */
  knowledgeProfiles?: CampaignKnowledgeOption[]
}

export default function CreateCampaignDialog({
  currentPlan,
  atCampaignLimit = false,
  knowledgeProfiles = [],
}: CreateCampaignDialogProps) {
  const [open, setOpen] = useState(false)
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  const [isPending, startTransition] = useTransition()

  function openCreateFlow() {
    if (atCampaignLimit) {
      setShowUpgradeModal(true)
      return
    }
    setOpen(true)
  }

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await createCampaignAction(formData)
      const err = result?.error
      if (err && isPlanLimitError(err)) {
        setOpen(false)
        setShowUpgradeModal(true)
      } else if (!err) {
        setOpen(false)
      }
    })
  }

  return (
    <>
      <Button size="sm" className="gap-2" onClick={openCreateFlow}>
        <Plus className="h-4 w-4" /> Nova Campanha
      </Button>

      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        currentPlan={currentPlan}
        title="Limite de campanhas"
        description="Você atingiu o número máximo de campanhas do seu plano. Faça upgrade para criar mais campanhas e escalar a prospecção."
      />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Criar Nova Campanha</DialogTitle>
            <DialogDescription>
              Defina nome, canal e qual base de conhecimento a IA deve usar ao gerar mensagens nesta campanha.
            </DialogDescription>
          </DialogHeader>

          <form action={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="campaign-name" className="text-sm font-medium">
                Nome da campanha <span className="text-destructive">*</span>
              </label>
              <input
                id="campaign-name"
                name="name"
                type="text"
                required
                autoFocus
                placeholder="Ex: Prospecção restaurantes SP"
                className="w-full px-3 py-2 rounded-lg border border-border/60 bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="campaign-description" className="text-sm font-medium">
                Descrição
              </label>
              <textarea
                id="campaign-description"
                name="description"
                rows={2}
                placeholder="Descreva o objetivo desta campanha..."
                className="w-full px-3 py-2 rounded-lg border border-border/60 bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors resize-none"
              />
            </div>

            <div className="space-y-3 rounded-xl border border-border/50 bg-muted/30 p-4">
              <div>
                <p className="text-sm font-semibold text-foreground">
                  Base de conhecimento nesta campanha
                </p>
                <ul className="mt-2 text-xs text-muted-foreground space-y-1.5 list-disc pl-4 leading-relaxed">
                  <li>
                    <span className="font-medium text-foreground/90">Padrão da conta:</span> ICP e fontes gerais
                    que você cadastrou em{' '}
                    <Link
                      href="/conhecimento"
                      className="text-primary font-semibold underline-offset-2 hover:underline"
                      onClick={(e) => e.stopPropagation()}
                    >
                      Base de conhecimento
                    </Link>
                    .
                  </li>
                  <li>
                    <span className="font-medium text-foreground/90">Perfil de campanha:</span> use quando esta
                    sequência for para outro produto, tom ou público — a IA prioriza o briefing desse perfil nas
                    mensagens.
                  </li>
                </ul>
              </div>
              <div className="space-y-2">
                <label htmlFor="knowledge_profile_id" className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                  Escolha a base
                </label>
                <select
                  id="knowledge_profile_id"
                  name="knowledge_profile_id"
                  defaultValue=""
                  className="w-full px-3 py-2.5 rounded-lg border border-border/60 bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
                >
                  <option value="">Padrão da conta (ICP + fontes gerais)</option>
                  {knowledgeProfiles.map((p) => (
                    <option key={p.id} value={p.id}>
                      Perfil: {p.name}
                    </option>
                  ))}
                </select>
                {knowledgeProfiles.length === 0 ? (
                  <p className="text-xs text-muted-foreground">
                    Nenhum perfil extra ainda.{' '}
                    <Link
                      href="/conhecimento#perfis-campanha"
                      className="text-primary font-semibold underline-offset-2 hover:underline"
                      onClick={(e) => e.stopPropagation()}
                    >
                      Criar perfil para campanha
                    </Link>{' '}
                    — opcional; o padrão da conta já funciona.
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    Perfis são criados em Base de conhecimento e só aparecem aqui quando o status está concluído.
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Canal</label>
              <div className="flex gap-3">
                <label className="flex-1 cursor-pointer">
                  <input
                    type="radio"
                    name="channel"
                    value="whatsapp"
                    defaultChecked
                    className="peer sr-only"
                  />
                  <div className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg border border-border/60 bg-background text-sm text-muted-foreground peer-checked:border-green-500 peer-checked:bg-green-500/10 peer-checked:text-green-600 transition-all">
                    <MessageCircle className="h-4 w-4" />
                    WhatsApp
                  </div>
                </label>
                <label className="flex-1 cursor-pointer">
                  <input
                    type="radio"
                    name="channel"
                    value="email"
                    className="peer sr-only"
                  />
                  <div className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg border border-border/60 bg-background text-sm text-muted-foreground peer-checked:border-blue-500 peer-checked:bg-blue-500/10 peer-checked:text-blue-600 transition-all">
                    <Mail className="h-4 w-4" />
                    E-mail
                  </div>
                </label>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={isPending}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isPending} className="gap-2">
                {isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Criando...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4" /> Criar Campanha
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
