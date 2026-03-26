'use client'

import { useState, useTransition } from 'react'
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

export default function CreateCampaignDialog() {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  const [limitError, setLimitError] = useState(false)

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      setLimitError(false)
      const result = await createCampaignAction(formData)
      if (result?.error === "LIMIT_REACHED_CAMPAIGNS") {
        setLimitError(true)
      } else if (!result?.error) {
        setOpen(false)
      }
    })
  }

  return (
    <>
      <Button size="sm" className="gap-2" onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4" /> Nova Campanha
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Criar Nova Campanha</DialogTitle>
            <DialogDescription>
              Preencha as informações da sua nova campanha de prospecção.
            </DialogDescription>
          </DialogHeader>

          <form action={handleSubmit} className="space-y-4">
            {limitError && (
              <div className="bg-destructive/15 text-destructive text-sm p-3 rounded-lg border border-destructive/20 flex flex-col gap-2">
                <span>Você atingiu o limite de 3 campanhas do Plano Grátis.</span>
                <Button type="button" size="sm" variant="default" className="w-max bg-primary hover:bg-primary/90" onClick={() => window.location.href = '/upgrade'}>
                  Fazer Upgrade para o Pro
                </Button>
              </div>
            )}
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
