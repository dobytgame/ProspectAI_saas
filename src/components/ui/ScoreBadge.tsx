interface ScoreBadgeProps {
  score: number;
  showTier?: boolean;
  size?: "sm" | "md" | "lg";
}

const getTierConfig = (score: number) => {
  if (score >= 90) return { tier: "A+", color: "var(--primary)",  bg: "var(--primary-dim)",  glow: "0 0 12px rgba(0,229,255,0.3)"  };
  if (score >= 75) return { tier: "A",  color: "var(--green)",   bg: "var(--green-dim)",   glow: "0 0 12px rgba(0,255,163,0.3)"  };
  if (score >= 60) return { tier: "B",  color: "var(--yellow)",  bg: "var(--yellow-dim)",  glow: "none" };
  if (score >= 40) return { tier: "C",  color: "#FF8C42",        bg: "rgba(255,140,66,.12)", glow: "none" };
  return              { tier: "D",  color: "var(--red)",    bg: "var(--red-dim)",     glow: "none" };
};

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
