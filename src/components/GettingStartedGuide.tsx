"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import {
  BookOpen,
  MessageSquare,
  MapPin,
  Wand2,
  CheckCircle2,
  Circle,
  X,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import type { GettingStartedProgress } from "@/lib/onboarding/getting-started";
import { setGettingStartedGuideDismissed } from "@/app/(dashboard)/dashboard/getting-started-actions";

const steps = [
  {
    key: "knowledge" as const,
    title: "Alimente a base de conhecimento",
    body: "Na Base de conhecimento, envie site, PDF ou texto e, se quiser, crie um perfil só para uma campanha. A IA usa isso nas mensagens.",
    href: "/conhecimento",
    cta: "Abrir Base de conhecimento",
    icon: BookOpen,
  },
  {
    key: "campaign" as const,
    title: "Crie uma campanha",
    body: "Escolha WhatsApp ou e-mail e dê um nome objetivo. Você pode vincular um perfil de conhecimento só para essa campanha.",
    href: "/campanhas",
    cta: "Nova campanha",
    icon: MessageSquare,
  },
  {
    key: "prospects" as const,
    title: "Busque prospects no mapa",
    body: "Use segmento e local no painel. O Capturo traz empresas do Maps e já pontua cada lead com o seu ICP.",
    href: "/dashboard#buscar-prospects",
    cta: "Buscar agora",
    icon: MapPin,
  },
  {
    key: "messages" as const,
    title: "Gere os primeiros textos",
    body: "Abra a campanha com leads, use gerar mensagens e copie o texto pronto para colar no WhatsApp ou e-mail.",
    href: "/campanhas",
    cta: "Abrir campanhas",
    icon: Wand2,
  },
];

type Props = {
  progress: GettingStartedProgress;
};

export default function GettingStartedGuide({ progress }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  if (progress.allComplete) {
    return null;
  }

  if (progress.dismissed) {
    const done = [progress.knowledge, progress.campaign, progress.prospects, progress.messages].filter(
      Boolean
    ).length;
    return (
      <div className="shrink-0 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border/40 bg-background/50 px-3 py-2">
        <p className="text-xs text-muted-foreground">
          <span className="font-bold text-foreground">{done}/4</span> etapas do primeiro fluxo concluídas.
        </p>
        <button
          type="button"
          onClick={() => {
            startTransition(async () => {
              await setGettingStartedGuideDismissed(false);
              router.refresh();
            });
          }}
          disabled={pending}
          className="text-xs font-bold text-primary hover:underline disabled:opacity-50"
        >
          Ver passo a passo completo
        </button>
      </div>
    );
  }

  const messagesHref =
    progress.firstCampaignId && progress.campaign
      ? `/campanhas/${progress.firstCampaignId}`
      : "/campanhas";

  const hrefFor = (key: (typeof steps)[number]["key"]) => {
    if (key === "messages") return messagesHref;
    const s = steps.find((x) => x.key === key);
    return s?.href ?? "/dashboard";
  };

  return (
    <div
      className="shrink-0 rounded-2xl border overflow-hidden shadow-lg"
      style={{
        borderColor: "rgba(0, 229, 255, 0.28)",
        background:
          "linear-gradient(145deg, rgba(0,229,255,0.07) 0%, rgba(2,8,23,0.92) 45%, rgba(0,102,255,0.05) 100%)",
        boxShadow: "0 0 32px rgba(0,229,255,0.06)",
      }}
    >
      <div className="px-4 py-3 sm:px-5 sm:py-4 border-b border-white/5 flex flex-wrap items-start justify-between gap-3">
        <div className="flex gap-3 min-w-0">
          <div
            className="shrink-0 h-11 w-11 rounded-xl flex items-center justify-center"
            style={{ background: "var(--primary-dim)", color: "var(--primary)" }}
          >
            <Sparkles className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <h2 className="text-sm sm:text-base font-black tracking-tight text-foreground">
              Seu primeiro fluxo no Capturo
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 leading-relaxed max-w-2xl">
              Quatro passos para sair do zero: memória da IA → campanha → busca no mapa → mensagens prontas. Sem
              complicação — você marca o que já fez automaticamente.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 text-muted-foreground hover:text-foreground gap-1"
            disabled={pending}
            onClick={() => {
              startTransition(async () => {
                await setGettingStartedGuideDismissed(true);
                router.refresh();
              });
            }}
          >
            <X className="h-4 w-4" />
            Ocultar
          </Button>
        </div>
      </div>

      <div className="px-4 py-3 sm:px-5 sm:pb-4 space-y-3">
        <div className="flex items-center justify-between gap-3 text-xs">
          <span className="font-bold text-muted-foreground uppercase tracking-wider">
            Progresso
          </span>
          <span className="font-black text-primary tabular-nums">{progress.percent}%</span>
        </div>
        <Progress value={progress.percent} className="h-2 bg-muted/40 [&>div]:bg-primary" />

        <ol className="grid gap-2 sm:gap-3 sm:grid-cols-2 pt-1">
          {steps.map((step, idx) => {
            const done = progress[step.key];
            const Icon = step.icon;
            const href = hrefFor(step.key);

            return (
              <li
                key={step.key}
                className={`relative flex gap-3 p-3 rounded-xl border transition-colors ${
                  done
                    ? "border-green-500/25 bg-green-500/[0.06]"
                    : "border-border/50 bg-background/40 hover:border-primary/25"
                }`}
              >
                <div className="shrink-0 mt-0.5">
                  {done ? (
                    <CheckCircle2 className="h-5 w-5 text-green-500" aria-hidden />
                  ) : (
                    <Circle className="h-5 w-5 text-muted-foreground/50" aria-hidden />
                  )}
                </div>
                <div className="min-w-0 flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black text-muted-foreground tabular-nums">
                      {idx + 1}/4
                    </span>
                    <Icon className="h-3.5 w-3.5 text-primary shrink-0" aria-hidden />
                    <h3 className="text-sm font-bold leading-tight">{step.title}</h3>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">{step.body}</p>
                  {!done && (
                    <Button
                      asChild
                      size="sm"
                      className="h-8 text-xs font-bold gap-1 bg-primary text-black hover:bg-primary/90"
                    >
                      <Link href={href}>
                        {step.cta}
                        <ChevronRight className="h-3.5 w-3.5" />
                      </Link>
                    </Button>
                  )}
                  {done && (
                    <p className="text-[11px] font-semibold text-green-600 dark:text-green-400">
                      Concluído
                    </p>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}
