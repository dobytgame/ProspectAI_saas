'use client'

import { useEffect, useState } from "react";

interface StatCardProps {
  label: string;
  value: number;
  suffix?: string;
  sub?: string;
  color?: string;
  icon: React.ReactNode;
  delay?: number;
}

function useCountUp(target: number, duration = 800, delay = 0) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    const timer = setTimeout(() => {
      let start = 0;
      const step = target / (duration / 16);
      const interval = setInterval(() => {
        start = Math.min(start + step, target);
        setCount(Math.floor(start));
        if (start >= target) clearInterval(interval);
      }, 16);
      return () => clearInterval(interval);
    }, delay);
    return () => clearTimeout(timer);
  }, [target, duration, delay]);
  return count;
}

export function StatCard({ label, value, suffix = "", sub, color = "var(--primary)", icon, delay = 0 }: StatCardProps) {
  const displayed = useCountUp(value, 700, delay);

  return (
    <div
      className="card-glow-top relative rounded-2xl p-5 flex flex-col gap-3 transition-all duration-300 cursor-default"
      style={{
        background: "var(--background-2)",
        border: "1px solid var(--border)",
        animation: `fade-in 0.5s ease ${delay}ms both`,
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLElement).style.borderColor = "var(--border-hover)";
        (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)";
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLElement).style.borderColor = "var(--border)";
        (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
      }}
    >
      {/* Ícone */}
      <div
        className="w-9 h-9 rounded-xl flex items-center justify-center"
        style={{ background: `${color}18`, border: `1px solid ${color}30` }}
      >
        <span style={{ color }}>{icon}</span>
      </div>

      {/* Número animado */}
      <div>
        <div
          className="text-3xl font-bold tracking-tight tabular-nums"
          style={{ color, fontVariantNumeric: "tabular-nums" }}
        >
          {displayed.toLocaleString("pt-BR")}{suffix}
        </div>
        <div className="text-xs font-medium mt-1 uppercase tracking-wider" style={{ color: "var(--foreground-muted)" }}>
          {label}
        </div>
        {sub && <div className="text-[11px] mt-0.5" style={{ color: "var(--foreground-dim)" }}>{sub}</div>}
      </div>
    </div>
  );
}
