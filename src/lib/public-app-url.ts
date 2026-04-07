/**
 * URL pública do app para redirects (Stripe success/cancel, metadata, etc.).
 * Ordem: NEXT_PUBLIC_APP_URL → VERCEL_URL → headers da request → localhost.
 */
export function resolvePublicAppUrl(req?: Request): string {
  const fromEnv = process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/$/, '')
  if (fromEnv) return fromEnv

  const vercel = process.env.VERCEL_URL?.trim()
  if (vercel) {
    const host = vercel.replace(/^https?:\/\//, '')
    return `https://${host}`
  }

  if (req) {
    const origin = req.headers.get('origin')
    if (origin && /^https?:\/\//i.test(origin)) {
      return origin.replace(/\/$/, '')
    }
    const referer = req.headers.get('referer')
    if (referer) {
      try {
        const u = new URL(referer)
        return `${u.protocol}//${u.host}`.replace(/\/$/, '')
      } catch {
        /* ignore */
      }
    }
    const host = req.headers.get('x-forwarded-host') || req.headers.get('host')
    const proto = (req.headers.get('x-forwarded-proto') || 'https').split(',')[0].trim()
    if (host && !/^localhost(:\d+)?$/i.test(host) && !/^127\./.test(host)) {
      return `${proto}://${host}`.replace(/\/$/, '')
    }
  }

  return 'http://localhost:3000'
}
