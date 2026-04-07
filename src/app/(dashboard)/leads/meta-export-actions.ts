'use server'

import { createClient } from '@/utils/supabase/server'
import { hasFeature, type PlanType } from '@/utils/plan-limits'
import { buildMetaCustomAudienceCsv, type MetaAudienceLeadInput } from '@/lib/meta-custom-audience-csv'

const MAX_ROWS = 10_000

export type ExportMetaAudienceResult =
  | { ok: true; csv: string; included: number; skipped: number; rowCount: number }
  | { ok: false; error: string; code?: 'PLAN' | 'EMPTY' | 'AUTH' }

export async function exportMetaCustomAudienceCsvAction(input: {
  campaignId?: string
  city?: string
  segment?: string
  leadIds?: string[]
}): Promise<ExportMetaAudienceResult> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { ok: false, error: 'Faça login para exportar.', code: 'AUTH' }
  }

  const { data: business } = await supabase
    .from('businesses')
    .select('id, plan')
    .eq('user_id', user.id)
    .single()

  if (!business) {
    return { ok: false, error: 'Negócio não encontrado.', code: 'AUTH' }
  }

  const plan = (business.plan || 'free') as PlanType
  if (!hasFeature(plan, 'can_export_csv')) {
    return {
      ok: false,
      error:
        'Exportação para Meta Ads está disponível a partir do plano Starter. Faça upgrade para liberar.',
      code: 'PLAN',
    }
  }

  let query = supabase
    .from('leads')
    .select('name, phone, address, metadata')
    .eq('business_id', business.id)
    .limit(MAX_ROWS)

  if (input.campaignId) {
    query = query.eq('campaign_id', input.campaignId)
  }

  if (input.leadIds && input.leadIds.length > 0) {
    query = query.in('id', input.leadIds)
  }

  if (input.city?.trim()) {
    query = query.ilike('address', `%${input.city.trim()}%`)
  }

  if (input.segment?.trim()) {
    query = query.ilike('segment', `%${input.segment.trim()}%`)
  }

  const { data: rows, error } = await query

  if (error) {
    return { ok: false, error: error.message }
  }

  const leads = (rows || []) as MetaAudienceLeadInput[]
  const { csv, included, skipped } = buildMetaCustomAudienceCsv(leads)

  if (included === 0) {
    return {
      ok: false,
      error:
        'Nenhum lead com telefone ou e-mail válido para o Meta. Inclua telefones nos leads ou enriqueça com e-mail antes de exportar.',
      code: 'EMPTY',
    }
  }

  return {
    ok: true,
    csv,
    included,
    skipped,
    rowCount: included,
  }
}
