/**
 * CSV para público personalizado / lookalike no Meta Ads.
 * Cabeçalhos abreviados alinhados ao modelo de “lista de clientes” (email, phone, fn, ln, ct, st, zip, country).
 * @see https://www.facebook.com/business/help/337435179622353
 */

export const META_CUSTOM_AUDIENCE_HEADERS = [
  'email',
  'phone',
  'fn',
  'ln',
  'ct',
  'st',
  'zip',
  'country',
] as const

export type MetaAudienceLeadInput = {
  name: string
  phone?: string | null
  address?: string | null
  metadata?: Record<string, unknown> | null
}

function escapeCsvField(value: string): string {
  if (/[",\r\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}

/** E.164 quando possível; foco Brasil (+55). */
export function normalizePhoneForMeta(phone: string | null | undefined): string {
  if (!phone) return ''
  const digits = phone.replace(/\D/g, '')
  if (digits.length < 8) return ''
  if (digits.startsWith('55') && digits.length >= 12) return `+${digits}`
  if (digits.length >= 10 && digits.length <= 11) return `+55${digits}`
  if (digits.length >= 10) return `+${digits}`
  return ''
}

export function splitFirstLastName(name: string): { fn: string; ln: string } {
  const t = name.trim()
  if (!t) return { fn: '', ln: '' }
  const i = t.indexOf(' ')
  if (i === -1) return { fn: t, ln: '' }
  return { fn: t.slice(0, i), ln: t.slice(i + 1).trim() }
}

/** Heurística para endereços estilo Google Places no Brasil. */
export function parseLocationHints(
  address: string | null | undefined
): { city: string; state: string; zip: string } {
  if (!address) return { city: '', state: '', zip: '' }
  const zipMatch = address.match(/\b(\d{5})-?(\d{3})\b/)
  const zip = zipMatch ? `${zipMatch[1]}${zipMatch[2]}` : ''

  const cityState = address.match(/([^,]+)\s*-\s*([A-Za-z]{2})\s*(?:,|$)/)
  let city = ''
  let state = ''
  if (cityState) {
    city = cityState[1].trim()
    state = cityState[2].trim().toLowerCase()
  } else {
    const parts = address.split(',').map((p) => p.trim()).filter(Boolean)
    if (parts.length >= 2) {
      city = parts[parts.length - 2] || ''
    }
  }

  return { city, state, zip }
}

function emailFromMetadata(metadata: Record<string, unknown> | null | undefined): string {
  if (!metadata) return ''
  const e = metadata.email ?? metadata.contact_email
  return typeof e === 'string' ? e.trim().toLowerCase() : ''
}

function rowFromLead(lead: MetaAudienceLeadInput): string[] | null {
  const meta =
    lead.metadata && typeof lead.metadata === 'object'
      ? (lead.metadata as Record<string, unknown>)
      : null
  const email = emailFromMetadata(meta)
  const phone = normalizePhoneForMeta(lead.phone)
  if (!email && !phone) return null

  const { fn, ln } = splitFirstLastName(lead.name || '')
  const { city, state, zip } = parseLocationHints(lead.address ?? null)

  return [
    email,
    phone,
    fn,
    ln,
    city,
    state,
    zip,
    'br',
  ].map((v) => escapeCsvField(v ?? ''))
}

/**
 * Gera CSV UTF-8 com BOM para Excel / Meta.
 * Ignora leads sem email e sem telefone válido.
 */
export function buildMetaCustomAudienceCsv(leads: MetaAudienceLeadInput[]): {
  csv: string
  included: number
  skipped: number
} {
  const lines: string[] = [META_CUSTOM_AUDIENCE_HEADERS.join(',')]
  let included = 0
  let skipped = 0

  for (const lead of leads) {
    const row = rowFromLead(lead)
    if (!row) {
      skipped += 1
      continue
    }
    lines.push(row.join(','))
    included += 1
  }

  return {
    csv: lines.join('\r\n'),
    included,
    skipped,
  }
}

export function downloadUtf8Csv(filename: string, csvBody: string): void {
  const blob = new Blob([`\uFEFF${csvBody}`], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.rel = 'noopener'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
