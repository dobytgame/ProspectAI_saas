'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Loader2, Target } from 'lucide-react'
import { useToast } from '@/components/ui/Toast'
import UpgradeModal from '@/components/UpgradeModal'
import { exportMetaCustomAudienceCsvAction } from '@/app/(dashboard)/leads/meta-export-actions'
import { downloadUtf8Csv } from '@/lib/meta-custom-audience-csv'
import { cn } from '@/lib/utils'

type Props = {
  currentPlan: string
  /** Exportação no contexto de uma campanha */
  campaignId?: string
  /** Filtros da página de leads (quando não é campanha) */
  cityFilter?: string
  segmentFilter?: string
  /** Se houver IDs, exporta só a seleção; senão, todos que batem com os filtros */
  selectedLeadIds?: string[]
  className?: string
  size?: 'default' | 'sm'
  variant?: 'default' | 'outline' | 'secondary'
}

export default function ExportMetaAudienceButton({
  currentPlan,
  campaignId,
  cityFilter = '',
  segmentFilter = '',
  selectedLeadIds,
  className,
  size = 'sm',
  variant = 'outline',
}: Props) {
  const toast = useToast()
  const [pending, startTransition] = useTransition()
  const [upgradeOpen, setUpgradeOpen] = useState(false)

  const selectionMode = Boolean(selectedLeadIds && selectedLeadIds.length > 0)

  const handleExport = () => {
    startTransition(async () => {
      const res = await exportMetaCustomAudienceCsvAction({
        campaignId,
        city: cityFilter.trim() || undefined,
        segment: segmentFilter.trim() || undefined,
        leadIds: selectionMode ? selectedLeadIds : undefined,
      })

      if (!res.ok) {
        if (res.code === 'PLAN') {
          setUpgradeOpen(true)
          return
        }
        toast(res.error, 'error')
        return
      }

      const stamp = new Date().toISOString().slice(0, 10)
      const suffix = campaignId ? `campanha-${campaignId.slice(0, 8)}` : 'leads'
      downloadUtf8Csv(`capturo-meta-lookalike-${suffix}-${stamp}.csv`, res.csv)

      const extra =
        res.skipped > 0
          ? ` ${res.skipped} lead(s) sem telefone nem e-mail foram ignorados.`
          : ''
      toast(`Arquivo pronto para o Meta: ${res.included} linha(s).${extra}`, 'success')
    })
  }

  return (
    <>
      <UpgradeModal
        isOpen={upgradeOpen}
        onClose={() => setUpgradeOpen(false)}
        currentPlan={currentPlan}
        title="Exportação Meta Ads"
        description="A exportação em formato para público personalizado e lookalikes está disponível a partir do plano Starter. Faça upgrade para liberar."
      />
      <Button
        type="button"
        variant={variant}
        size={size}
        disabled={pending}
        onClick={handleExport}
        className={cn('gap-2 font-semibold', className)}
        title={
          selectionMode
            ? 'CSV com telefone/e-mail no formato da lista de clientes do Meta (lookalike)'
            : 'Exportar todos os leads desta visão com telefone ou e-mail para o Meta'
        }
      >
        {pending ? (
          <Loader2 className="h-4 w-4 animate-spin shrink-0" />
        ) : (
          <Target className="h-4 w-4 shrink-0 text-primary" />
        )}
        <span className="hidden sm:inline">
          Meta Ads
          {selectionMode && selectedLeadIds
            ? ` (${selectedLeadIds.length})`
            : ''}
        </span>
        <span className="sm:hidden">Meta</span>
      </Button>
    </>
  )
}
