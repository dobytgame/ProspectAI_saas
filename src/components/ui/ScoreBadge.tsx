import { cn } from "@/lib/utils";
import {
  getScoreBand,
  getScorePresentation,
  type LeadScoreMeta,
} from "@/lib/leads/score-presentation";

type ScoreBand = ReturnType<typeof getScoreBand>;

/** Cores por faixa: número em faixa forte, texto em fundo suave (bom contraste claro/escuro). */
const BAND_CHIPS: Record<
  ScoreBand,
  { score: string; label: string; border: string; glow: string }
> = {
  "A+": {
    score: "bg-sky-600 text-white shadow-inner dark:bg-sky-500",
    label: "bg-sky-50 text-sky-950 dark:bg-sky-950/55 dark:text-sky-50",
    border: "border-sky-300/70 dark:border-sky-600/45",
    glow: "shadow-[0_1px_8px_rgba(2,132,199,0.28)] dark:shadow-[0_1px_12px_rgba(56,189,248,0.15)]",
  },
  A: {
    score: "bg-emerald-600 text-white shadow-inner dark:bg-emerald-500",
    label: "bg-emerald-50 text-emerald-950 dark:bg-emerald-950/50 dark:text-emerald-50",
    border: "border-emerald-300/70 dark:border-emerald-600/45",
    glow: "shadow-[0_1px_8px_rgba(5,150,105,0.25)] dark:shadow-[0_1px_12px_rgba(52,211,153,0.12)]",
  },
  B: {
    score: "bg-amber-500 text-amber-950 shadow-inner dark:bg-amber-400 dark:text-amber-950",
    label: "bg-amber-50 text-amber-950 dark:bg-amber-950/45 dark:text-amber-50",
    border: "border-amber-300/80 dark:border-amber-700/45",
    glow: "shadow-[0_1px_8px_rgba(245,158,11,0.22)]",
  },
  C: {
    score: "bg-orange-600 text-white shadow-inner dark:bg-orange-500",
    label: "bg-orange-50 text-orange-950 dark:bg-orange-950/45 dark:text-orange-50",
    border: "border-orange-300/70 dark:border-orange-700/45",
    glow: "shadow-[0_1px_8px_rgba(234,88,12,0.22)]",
  },
  D: {
    score: "bg-rose-600 text-white shadow-inner dark:bg-rose-500",
    label: "bg-rose-50 text-rose-950 dark:bg-rose-950/45 dark:text-rose-50",
    border: "border-rose-300/70 dark:border-rose-700/45",
    glow: "shadow-[0_1px_8px_rgba(225,29,72,0.2)]",
  },
};

const BAND_BLOCK: Record<ScoreBand, { wrap: string; num: string; subtle: string; text: string }> = {
  "A+": {
    wrap: "bg-sky-50 border-sky-200/80 dark:bg-sky-950/40 dark:border-sky-800/50",
    num: "text-sky-700 dark:text-sky-300",
    subtle: "text-sky-500/90 dark:text-sky-500",
    text: "text-sky-800 dark:text-sky-200",
  },
  A: {
    wrap: "bg-emerald-50 border-emerald-200/80 dark:bg-emerald-950/40 dark:border-emerald-800/50",
    num: "text-emerald-700 dark:text-emerald-300",
    subtle: "text-emerald-600/90 dark:text-emerald-500",
    text: "text-emerald-900 dark:text-emerald-100",
  },
  B: {
    wrap: "bg-amber-50 border-amber-200/85 dark:bg-amber-950/35 dark:border-amber-800/50",
    num: "text-amber-800 dark:text-amber-300",
    subtle: "text-amber-700/90 dark:text-amber-500",
    text: "text-amber-950 dark:text-amber-100",
  },
  C: {
    wrap: "bg-orange-50 border-orange-200/80 dark:bg-orange-950/40 dark:border-orange-800/50",
    num: "text-orange-700 dark:text-orange-300",
    subtle: "text-orange-600/90 dark:text-orange-500",
    text: "text-orange-950 dark:text-orange-100",
  },
  D: {
    wrap: "bg-rose-50 border-rose-200/80 dark:bg-rose-950/40 dark:border-rose-800/50",
    num: "text-rose-700 dark:text-rose-300",
    subtle: "text-rose-600/90 dark:text-rose-500",
    text: "text-rose-950 dark:text-rose-100",
  },
};

interface ScoreBadgeProps {
  score: number;
  showTier?: boolean;
  size?: "sm" | "md" | "lg";
}

export const getTierConfig = (score: number) => {
  if (score >= 90) return { tier: "A+", color: "var(--primary)",  bg: "var(--primary-dim)",  glow: "0 0 12px rgba(0,229,255,0.3)"  };
  if (score >= 75) return { tier: "A",  color: "var(--green)",   bg: "var(--green-dim)",   glow: "0 0 12px rgba(0,255,163,0.3)"  };
  if (score >= 60) return { tier: "B",  color: "var(--yellow)",  bg: "var(--yellow-dim)",  glow: "none" };
  if (score >= 40) return { tier: "C",  color: "#FF8C42",        bg: "rgba(255,140,66,.12)", glow: "none" };
  return              { tier: "D",  color: "var(--red)",    bg: "var(--red-dim)",     glow: "none" };
};

export type LeadScoreDisplayProps = {
  score: number;
  tier?: string | null;
  priority?: string | null;
  reasoning?: string | null;
  /** compact: número + rótulo em pílula bicolor | block: cartão | minimal: só número com tooltip */
  variant?: "compact" | "block" | "minimal";
  className?: string;
};

/**
 * Score numérico + qualificação em texto (tooltip com resumo + reasoning quando houver).
 */
export function LeadScoreDisplay({
  score,
  tier,
  priority,
  reasoning,
  variant = "compact",
  className,
}: LeadScoreDisplayProps) {
  const s = Number.isFinite(score) ? score : 0;
  const meta: LeadScoreMeta = { tier, priority };
  const p = getScorePresentation(s, meta);
  const band = getScoreBand(s);
  const chip = BAND_CHIPS[band];
  const blk = BAND_BLOCK[band];
  const titleParts = [p.fullSummary, reasoning?.trim()].filter(Boolean);
  const title = titleParts.join("\n\n—\n\n");

  if (variant === "minimal") {
    return (
      <span
        title={title || undefined}
        className={cn(
          "inline-flex items-center justify-center rounded-lg font-mono font-black tabular-nums",
          "h-6 min-w-[2rem] px-2 text-[11px] border border-transparent",
          chip.score,
          className
        )}
      >
        {s}
      </span>
    );
  }

  if (variant === "block") {
    return (
      <div
        title={title || undefined}
        className={cn(
          "rounded-2xl border px-3 py-2.5 text-left max-w-[240px]",
          blk.wrap,
          BAND_CHIPS[band].glow,
          className
        )}
      >
        <div className="flex items-baseline gap-2">
          <span className={cn("text-2xl font-black tabular-nums leading-none", blk.num)}>{s}</span>
          <span className={cn("text-[10px] font-bold uppercase tracking-wide", blk.subtle)}>/100</span>
        </div>
        <p className={cn("text-[11px] font-semibold leading-snug mt-1", blk.text)}>{p.shortLabel}</p>
        {(p.aiTier || p.priorityHint) && (
          <p className={cn("text-[10px] mt-1.5 leading-snug opacity-90", blk.subtle)}>
            {[p.aiTier ? `IA: classe ${p.aiTier}` : null, p.priorityHint].filter(Boolean).join(" · ")}
          </p>
        )}
      </div>
    );
  }

  /* compact — pílula: faixa escura (nota) + faixa clara (rótulo) */
  return (
    <span
      title={title || undefined}
      className={cn(
        "inline-flex items-stretch rounded-full overflow-hidden border max-w-full",
        "text-[11px] leading-none shadow-sm",
        chip.border,
        chip.glow,
        className
      )}
    >
      <span
        className={cn(
          "tabular-nums font-black px-2 py-1.5 shrink-0 flex items-center min-h-[26px]",
          chip.score
        )}
      >
        {s}
      </span>
      <span
        className={cn(
          "font-semibold px-2.5 py-1.5 truncate flex items-center min-w-0 min-h-[26px] tracking-tight",
          chip.label
        )}
      >
        {p.shortLabel}
      </span>
    </span>
  );
}

export function ScoreBadge({ score, showTier = false, size = "sm" }: ScoreBadgeProps) {
  const { tier, color, bg, glow } = getTierConfig(score);
  const sizes = { sm: "h-6 px-2 text-[11px]", md: "h-8 px-3 text-sm", lg: "h-10 px-4 text-base" };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-lg font-bold font-mono ${sizes[size]}`}
      style={{ background: bg, color, boxShadow: glow, border: `1px solid ${color}30` }}
    >
      {score}
      {showTier && <span className="opacity-60 text-[9px]">{tier}</span>}
    </span>
  );
}

export function ScoreBar({ score }: { score: number }) {
  const { color } = getTierConfig(score);
  return (
    <div className="w-full h-1 rounded-full overflow-hidden" style={{ background: "var(--border)" }}>
      <div
        className="h-full rounded-full transition-all duration-700 ease-out"
        style={{
          width: `${score}%`,
          background: `linear-gradient(90deg, ${color}80, ${color})`,
          boxShadow: `0 0 8px ${color}40`,
        }}
      />
    </div>
  );
}
