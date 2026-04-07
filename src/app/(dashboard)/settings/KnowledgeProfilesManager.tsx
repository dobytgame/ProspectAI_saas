"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Loader2, Trash2, BookOpen, AlertCircle, CheckCircle2 } from "lucide-react";
import { deleteKnowledgeProfileAction } from "./actions";
import UpgradeModal from "@/components/UpgradeModal";
import { PLAN_LIMITS, PlanType, isPlanLimitError } from "@/utils/plan-limits";

export type KnowledgeProfileRow = {
  id: string;
  name: string;
  status: string;
  source_summary: string | null;
  ai_feedback: string | null;
  created_at: string;
};

export default function KnowledgeProfilesManager({
  businessId,
  plan,
  initialProfiles,
}: {
  businessId: string;
  plan: PlanType;
  initialProfiles: KnowledgeProfileRow[];
}) {
  const [profiles, setProfiles] = useState(initialProfiles);
  const [name, setName] = useState("");
  const [openText, setOpenText] = useState("");
  const [url, setUrl] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [pending, setPending] = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [, startTransition] = useTransition();

  const maxP = PLAN_LIMITS[plan].maxKnowledgeProfiles;
  const atLimit = maxP !== -1 && profiles.length >= maxP;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (atLimit) {
      setShowUpgrade(true);
      return;
    }
    if (!businessId) return;

    setPending(true);
    const fd = new FormData();
    fd.append("business_id", businessId);
    fd.append("name", name);
    fd.append("open_text", openText);
    fd.append("url", url);
    for (const f of files.slice(0, 3)) {
      fd.append("files", f);
    }

    try {
      const resp = await fetch("/api/knowledge-profiles", { method: "POST", body: fd });
      const data = await resp.json();
      setPending(false);

      if (data.error && isPlanLimitError(data.error)) {
        setShowUpgrade(true);
        return;
      }
      if (!resp.ok) {
        alert(data.error || "Erro ao criar perfil.");
        return;
      }
      if (data.profile) {
        setProfiles((p) => [data.profile as KnowledgeProfileRow, ...p]);
        setName("");
        setOpenText("");
        setUrl("");
        setFiles([]);
      }
    } catch {
      setPending(false);
      alert("Falha de rede ao criar perfil.");
    }
  }

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const list = e.target.files ? Array.from(e.target.files).slice(0, 3) : [];
    setFiles(list);
    e.target.value = "";
  }

  function removeProfile(id: string) {
    if (!confirm("Excluir este perfil? Campanhas que o usam deixarão de referenciá-lo.")) return;
    startTransition(async () => {
      const r = await deleteKnowledgeProfileAction(id, businessId);
      if (r.ok) setProfiles((p) => p.filter((x) => x.id !== id));
      else alert("message" in r ? r.message : "Erro ao excluir.");
    });
  }

  return (
    <div className="space-y-6 p-6 rounded-2xl bg-muted/10 border border-border/40">
      <UpgradeModal
        isOpen={showUpgrade}
        onClose={() => setShowUpgrade(false)}
        currentPlan={plan}
        title="Limite de perfis de conhecimento"
        description="Você atingiu o máximo de perfis de conhecimento para campanhas neste plano. Faça upgrade para criar mais perfis e personalizar mais campanhas."
      />

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
            <BookOpen className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-black uppercase tracking-wide text-foreground">
              Perfis de conhecimento para campanhas
            </h3>
            <p className="text-xs text-muted-foreground font-medium mt-0.5 max-w-xl">
              Combine texto livre, URL do site e até 3 arquivos (PDF ou .txt). A IA analisa e gera um briefing
              usado ao gerar mensagens nas campanhas que você vincular.
            </p>
          </div>
        </div>
        <Badge variant="outline" className="text-[10px] font-black uppercase shrink-0">
          {maxP === -1
            ? "Perfis ilimitados neste plano"
            : `Até ${maxP} perfis · ${profiles.length}/${maxP} usados`}
        </Badge>
      </div>

      {atLimit && (
        <div className="flex items-center gap-2 text-xs text-amber-600 dark:text-amber-400 font-medium">
          <AlertCircle className="h-4 w-4 shrink-0" />
          Limite de perfis atingido. Faça upgrade para criar mais.
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="kp-name" className="text-xs font-bold uppercase text-muted-foreground">
            Nome do perfil <span className="text-destructive">*</span>
          </Label>
          <Input
            id="kp-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex: Campanha restaurantes — delivery"
            required
            disabled={atLimit || pending}
            className="bg-muted/20 border-border/40"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="kp-text" className="text-xs font-bold uppercase text-muted-foreground">
            Texto livre (opcional, mín. 20 caracteres se for a única fonte)
          </Label>
          <Textarea
            id="kp-text"
            value={openText}
            onChange={(e) => setOpenText(e.target.value)}
            rows={4}
            disabled={atLimit || pending}
            placeholder="Descreva oferta, público, diferenciais desta campanha..."
            className="bg-muted/20 border-border/40 text-sm"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="kp-url" className="text-xs font-bold uppercase text-muted-foreground">
            URL do site (opcional)
          </Label>
          <Input
            id="kp-url"
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://"
            disabled={atLimit || pending}
            className="bg-muted/20 border-border/40"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="kp-files" className="text-xs font-bold uppercase text-muted-foreground">
            Arquivos (opcional, até 3 — PDF ou .txt)
          </Label>
          <Input
            id="kp-files"
            type="file"
            multiple
            accept=".pdf,.txt,text/plain,application/pdf"
            onChange={onFileChange}
            disabled={atLimit || pending}
            className="bg-muted/20 border-border/40 text-sm file:mr-3"
          />
          {files.length > 0 && (
            <p className="text-[11px] text-muted-foreground">{files.map((f) => f.name).join(", ")}</p>
          )}
        </div>

        <Button type="submit" disabled={atLimit || pending || !name.trim()} className="gap-2">
          {pending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Processando com IA…
            </>
          ) : (
            "Criar e analisar perfil"
          )}
        </Button>
      </form>

      {profiles.length > 0 && (
        <div className="space-y-3 pt-4 border-t border-border/40">
          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
            Seus perfis
          </p>
          <ul className="space-y-2">
            {profiles.map((p) => (
              <li
                key={p.id}
                className="flex items-start justify-between gap-3 p-3 rounded-xl bg-background/50 border border-border/30"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-sm truncate">{p.name}</span>
                    {p.status === "completed" && (
                      <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" aria-hidden />
                    )}
                    {p.status === "processing" && (
                      <Badge variant="secondary" className="text-[9px]">
                        Processando
                      </Badge>
                    )}
                    {p.status === "failed" && (
                      <Badge variant="destructive" className="text-[9px]">
                        Falhou
                      </Badge>
                    )}
                  </div>
                  {p.source_summary && (
                    <p className="text-[11px] text-muted-foreground mt-1">{p.source_summary}</p>
                  )}
                  {p.status === "failed" && p.ai_feedback && (
                    <p className="text-[11px] text-destructive/90 mt-1 line-clamp-2">{p.ai_feedback}</p>
                  )}
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="shrink-0 text-muted-foreground hover:text-destructive"
                  onClick={() => removeProfile(p.id)}
                  aria-label={`Excluir ${p.name}`}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
