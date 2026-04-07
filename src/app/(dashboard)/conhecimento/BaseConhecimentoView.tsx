"use client";

import Link from "next/link";
import { ArrowRight, BookOpen, Layers, Settings2, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import KnowledgeBaseManager from "../settings/KnowledgeBaseManager";
import KnowledgeProfilesManager, {
  type KnowledgeProfileRow,
} from "../settings/KnowledgeProfilesManager";
import type { PlanType } from "@/utils/plan-limits";

type Props = {
  businessId: string;
  plan: PlanType;
  knowledgeItems: Record<string, unknown>[];
  initialProfiles: KnowledgeProfileRow[];
};

/**
 * Página dedicada: explica o fluxo (fontes gerais vs perfis de campanha) e embute os gestores em modo standalone.
 */
export default function BaseConhecimentoView({
  businessId,
  plan,
  knowledgeItems,
  initialProfiles,
}: Props) {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 space-y-10 pb-28 md:pb-12">
      <header className="space-y-4 border-b border-white/5 pb-8">
        <p className="text-[10px] font-black uppercase tracking-widest text-primary">
          Base de conhecimento
        </p>
        <h1 className="text-3xl md:text-4xl font-black tracking-tight text-foreground">
          O que a IA sabe sobre o seu negócio
        </h1>
        <p className="text-sm md:text-base text-muted-foreground font-medium max-w-3xl leading-relaxed">
          Aqui você alimenta a memória da IA. Isso é <strong className="text-foreground/90">complementar</strong>{" "}
          ao que você define em{" "}
          <Link href="/settings" className="text-primary font-bold underline-offset-4 hover:underline">
            Configurações → Negócio
          </Link>{" "}
          (nome, segmento e ICP). As fontes abaixo enriquecem qualificação de leads e textos; os perfis extras
          servem só quando uma <strong className="text-foreground/90">campanha</strong> precisa de outro foco.
        </p>
      </header>

      <section
        className="rounded-2xl border border-border/50 bg-muted/20 p-5 sm:p-6 space-y-5 ring-1 ring-white/5"
        aria-labelledby="como-funciona-heading"
      >
        <div className="flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-primary shrink-0" />
          <h2 id="como-funciona-heading" className="text-lg font-black tracking-tight">
            Como funciona (em 3 passos)
          </h2>
        </div>
        <ol className="grid gap-4 sm:grid-cols-3 text-sm">
          <li className="rounded-xl border border-border/40 bg-background/40 p-4 space-y-2">
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-primary/15 text-xs font-black text-primary">
              1
            </span>
            <div className="flex items-center gap-2 font-bold text-foreground">
              <Layers className="h-4 w-4 text-primary" />
              Fontes gerais
            </div>
            <p className="text-xs text-muted-foreground font-medium leading-relaxed">
              Site, PDF ou texto. Valem para <strong className="text-foreground/80">toda a conta</strong>{" "}
              (lead score, chat, mensagens quando não há perfil de campanha).
            </p>
          </li>
          <li className="rounded-xl border border-border/40 bg-background/40 p-4 space-y-2">
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-primary/15 text-xs font-black text-primary">
              2
            </span>
            <div className="flex items-center gap-2 font-bold text-foreground">
              <Settings2 className="h-4 w-4 text-primary" />
              ICP no Negócio
            </div>
            <p className="text-xs text-muted-foreground font-medium leading-relaxed">
              Quem você quer atingir fica em Configurações. A IA sempre combina ICP + fontes (e perfil da campanha,
              se você escolher um).
            </p>
            <Button variant="outline" size="sm" className="mt-1 h-8 text-xs font-bold" asChild>
              <Link href="/settings">
                Abrir Configurações
                <ArrowRight className="h-3.5 w-3.5 ml-1" />
              </Link>
            </Button>
          </li>
          <li className="rounded-xl border border-border/40 bg-background/40 p-4 space-y-2">
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-primary/15 text-xs font-black text-primary">
              3
            </span>
            <div className="flex items-center gap-2 font-bold text-foreground">
              <Target className="h-4 w-4 text-secondary" />
              Perfil só na campanha
            </div>
            <p className="text-xs text-muted-foreground font-medium leading-relaxed">
              Crie um perfil aqui quando precisar de <strong className="text-foreground/80">outro produto, tom ou público</strong>{" "}
              só numa sequência. Em <strong className="text-foreground/80">Nova campanha</strong>, escolha qual base usar.
            </p>
            <Button variant="outline" size="sm" className="mt-1 h-8 text-xs font-bold" asChild>
              <Link href="/campanhas">
                Ir às campanhas
                <ArrowRight className="h-3.5 w-3.5 ml-1" />
              </Link>
            </Button>
          </li>
        </ol>
      </section>

      <div id="fontes" className="scroll-mt-24 space-y-6">
        <KnowledgeBaseManager
          businessId={businessId}
          initialItems={knowledgeItems}
          variant="standalone"
        />
      </div>

      <div id="perfis-campanha" className="scroll-mt-24 space-y-6">
        <KnowledgeProfilesManager
          businessId={businessId}
          plan={plan}
          initialProfiles={initialProfiles}
          variant="standalone"
        />
      </div>
    </div>
  );
}
