/**
 * Textos claros para o score numérico (0–100) e metadados da IA (tier, prioridade).
 * Faixas alinhadas ao ScoreBadge / heatmap do produto (90 / 75 / 60 / 40).
 */

export type LeadScoreMeta = {
  tier?: string | null;
  priority?: "high" | "medium" | "low" | string | null;
};

/** Faixa visual (A+ … D) — mesmos cortes que `ScoreBadge`. */
export function getScoreBand(score: number): "A+" | "A" | "B" | "C" | "D" {
  const s = Number.isFinite(score) ? score : 0;
  if (s >= 90) return "A+";
  if (s >= 75) return "A";
  if (s >= 60) return "B";
  if (s >= 40) return "C";
  return "D";
}

const BAND_COPY: Record<ReturnType<typeof getScoreBand>, { title: string; short: string }> = {
  "A+": {
    title: "Nota excelente. Este lead deve ir no topo da sua fila de contatos.",
    short: "Excelente",
  },
  A: {
    title: "Nota muito alta. Tem tudo para virar uma boa oportunidade.",
    short: "Muito bom",
  },
  B: {
    title: "Nota boa. Pode prospectar com confiança.",
    short: "Bom",
  },
  C: {
    title: "Nota na média. Vale olhar com calma antes de gastar muito tempo.",
    short: "Médio",
  },
  D: {
    title: "Nota baixa. Sugestão: deixar por último ou revisar se ainda faz sentido.",
    short: "Baixo",
  },
};

function normalizeTier(tier: unknown): string | null {
  if (typeof tier !== "string") return null;
  const t = tier.trim().toUpperCase();
  if (t === "A" || t === "B" || t === "C" || t === "D") return t;
  return null;
}

function priorityLabel(priority: string | null | undefined): string | undefined {
  if (!priority) return undefined;
  const p = String(priority).toLowerCase();
  if (p === "high") return "IA marcou como alta prioridade";
  if (p === "medium") return "IA marcou como prioridade média";
  if (p === "low") return "IA marcou como baixa prioridade";
  return undefined;
}

export function getScorePresentation(score: number, meta?: LeadScoreMeta) {
  const band = getScoreBand(score);
  const copy = BAND_COPY[band];
  const aiTier = normalizeTier(meta?.tier);
  const pri = priorityLabel(meta?.priority ?? undefined);

  const parts = [copy.title];
  if (aiTier) {
    parts.push(`A IA também classificou como ${aiTier} (ajuda a interpretar a nota).`);
  }
  if (pri) parts.push(pri);

  return {
    band,
    /** Uma linha curta ao lado do número (lista, tabela). */
    shortLabel: copy.short,
    /** Texto para title/tooltip. */
    fullSummary: parts.join("\n\n"),
    /** Classe A–D quando a IA devolveu tier. */
    aiTier,
    priorityHint: pri,
  };
}
