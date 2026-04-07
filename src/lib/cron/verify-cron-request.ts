import { NextResponse } from "next/server";

/**
 * Autenticação dos endpoints /api/cron/*.
 *
 * - Plano Vercel Hobby não inclui Cron integrado: use um agendador externo
 *   (ex.: cron-job.org, GitHub Actions) com GET e header Authorization.
 * - Plano Pro+: opcionalmente use `vercel.json` com `crons` (o Vercel envia
 *   `Authorization: Bearer $CRON_SECRET` quando CRON_SECRET está definido no projeto).
 *
 * Headers aceitos (qualquer um):
 * - `Authorization: Bearer <CRON_SECRET>`
 * - `X-Cron-Secret: <CRON_SECRET>` (útil se o agendador não permitir Bearer)
 *
 * Desenvolvimento local: `CRON_SKIP_AUTH=true` em `.env.local` desliga a checagem
 * (somente com NODE_ENV=development; nunca use em produção).
 */
export function assertCronAuthorized(req: Request): NextResponse | null {
  const isDev = process.env.NODE_ENV === "development";
  if (isDev && process.env.CRON_SKIP_AUTH === "true") {
    console.warn(
      "[cron] CRON_SKIP_AUTH está ativo — apenas para desenvolvimento local"
    );
    return null;
  }

  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) {
    return NextResponse.json(
      { error: "Cron não configurado: defina CRON_SECRET" },
      { status: 503 }
    );
  }

  const auth = req.headers.get("authorization");
  const bearerOk = auth === `Bearer ${secret}`;
  const alt = req.headers.get("x-cron-secret");
  const headerOk = alt === secret;

  if (!bearerOk && !headerOk) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return null;
}
