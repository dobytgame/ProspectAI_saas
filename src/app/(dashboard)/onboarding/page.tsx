'use client'

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles, Building2, Globe, FileText, Loader2, MessageCircle, CheckCircle2, ArrowRight, BrainCircuit, X, PenLine } from "lucide-react";
import { createBusinessCore, finalizeOnboarding } from "./actions";

// Tone Options
const TONE_OPTIONS = [
  { value: "Profissional", label: "Profissional", desc: "Formal e direto ao ponto" },
  { value: "Amigável", label: "Amigável", desc: "Próximo e acessível" },
  { value: "Consultivo", label: "Consultivo", desc: "Especialista que orienta" },
  { value: "Direto", label: "Direto", desc: "Objetivo e sem rodeios" },
];

export default function OnboardingMultiStep() {
  const [step, setStep] = useState(1);
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Step 1: Info Base
  const [name, setName] = useState("");
  const [tone, setTone] = useState("Profissional");

  // Step 2: Conhecimento
  const [urlInput, setUrlInput] = useState("");
  const [fileInput, setFileInput] = useState<File | null>(null);
  const [kbItems, setKbItems] = useState<any[]>([]); // histórico de fontes
  const [processingItems, setProcessingItems] = useState<string[]>([]); // fontes em proc.
  const [manualText, setManualText] = useState("");

  // Step 3: Plan
  const [selectedPlan, setSelectedPlan] = useState("free");

  // Handle Step 1
  const handleCreateCore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsLoading(true);
    setErrorMsg("");

    const fd = new FormData();
    fd.append("name", name);
    fd.append("tone", tone);

    const res = await createBusinessCore(fd);
    setIsLoading(false);

    if (res.error) {
      setErrorMsg(res.error);
    } else if (res.success) {
      setBusinessId(res.businessId);
      setStep(2); // Avança pra Inteligência
    }
  };

  // Handle Knowledge Base Add (Step 2)
  const handleAddKB = async (type: 'url' | 'file') => {
    if (!businessId) return;
    if (type === 'url' && !urlInput.trim()) return;
    if (type === 'file' && !fileInput) return;

    const sourceName = type === 'url' ? urlInput : fileInput!.name;
    const processId = Date.now().toString(); // local tracker
    
    setProcessingItems(prev => [...prev, processId]);
    
    const formData = new FormData();
    formData.append("business_id", businessId);
    formData.append("type", type);
    if (type === 'url') formData.append("url", urlInput);
    if (type === 'file') formData.append("file", fileInput as Blob);

    if (type === 'url') setUrlInput("");
    if (type === 'file') setFileInput(null);

    try {
      const resp = await fetch("/api/knowledge/add", {
        method: "POST",
        body: formData,
      });

      const data = await resp.json();
      setProcessingItems(prev => prev.filter(p => p !== processId));

      if (data.success) {
        setKbItems(prev => [...prev, data.record]);
      } else {
        // Se houver um registro (mesmo falho), podemos adicionar pra mostrar o erro no histórico
        if (data.record) {
          setKbItems(prev => [...prev, data.record]);
        }
        setErrorMsg(data.error || "Erro ao processar fonte.");
        // setTimeout(() => setErrorMsg(""), 5000);
      }
    } catch (err) {
      setProcessingItems(prev => prev.filter(p => p !== processId));
      setErrorMsg("Falha de rede ao tentar processar conhecimento.");
    }
  };

  const completedKbCount = kbItems.filter((i) => i.status === "completed").length;

  const handleAddManual = async () => {
    if (!businessId) return;
    const t = manualText.trim();
    if (t.length < 20) {
      setErrorMsg("Use pelo menos 20 caracteres na descrição manual.");
      return;
    }
    setErrorMsg("");
    const processId = Date.now().toString();
    setProcessingItems((prev) => [...prev, processId]);
    const fd = new FormData();
    fd.append("business_id", businessId);
    fd.append("type", "manual");
    fd.append("manual_text", t);
    try {
      const resp = await fetch("/api/knowledge/add", { method: "POST", body: fd });
      const data = await resp.json();
      setProcessingItems((prev) => prev.filter((p) => p !== processId));
      if (data.success) {
        setKbItems((prev) => [...prev, data.record]);
        setManualText("");
      } else {
        setErrorMsg(data.error || "Erro ao salvar o texto.");
      }
    } catch {
      setProcessingItems((prev) => prev.filter((p) => p !== processId));
      setErrorMsg("Falha de rede ao salvar a descrição.");
    }
  };

  /** Gera ICP + agente a partir das fontes (ou só nome/tom se não houver fontes). */
  const runSynthesizeToStep3 = async (opts?: { skippedEmptyKb?: boolean }) => {
    if (!businessId) return;

    setIsLoading(true);
    setErrorMsg("");
    try {
      const resp = await fetch("/api/knowledge/synthesize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          business_id: businessId,
          skipped_empty_kb: opts?.skippedEmptyKb === true,
        }),
      });

      const data = await resp.json();
      setIsLoading(false);

      if (data.success) {
        setStep(3);
      } else {
        setErrorMsg(data.error || "Erro ao sintetizar conhecimento.");
      }
    } catch {
      setIsLoading(false);
      setErrorMsg("Falha na síntese do ICP Mestre.");
    }
  };

  const handleSynthesize = () => runSynthesizeToStep3();

  /** Sem site/PDF: segue com perfil mínimo (IA usa nome + tom da empresa). */
  const handleSkipKnowledge = () => runSynthesizeToStep3({ skippedEmptyKb: true });

  // Handle Finish (Step 3)
  const handleFinish = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    await finalizeOnboarding(selectedPlan);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 px-4 py-12 lg:py-24">
      <div className="w-full max-w-3xl space-y-8">
        
        {/* PROGRESS INDICATOR */}
        <div className="flex justify-center gap-6 md:gap-12 text-xs md:text-sm font-bold uppercase tracking-widest relative">
          <div className="absolute top-1/2 left-10 right-10 h-[2px] bg-border/40 -z-10 -translate-y-1/2 hidden md:block" />
          
          <div className={`flex items-center gap-2 bg-muted/30 px-4 py-2 rounded-full transition-all ${step >= 1 ? 'text-primary ring-1 ring-primary/30' : 'text-muted-foreground'}`}>
            <div className={`h-2 w-2 rounded-full ${step >= 1 ? 'bg-primary shadow-[0_0_8px_rgba(0,229,255,0.8)]' : 'bg-muted-foreground'}`} />
            <span className="hidden sm:inline">1. Perfil Inicial</span>
          </div>
          <div className={`flex items-center gap-2 bg-muted/30 px-4 py-2 rounded-full transition-all ${step >= 2 ? 'text-primary ring-1 ring-primary/30' : 'text-muted-foreground'}`}>
            <div className={`h-2 w-2 rounded-full ${step >= 2 ? 'bg-primary shadow-[0_0_8px_rgba(0,229,255,0.8)]' : 'bg-muted-foreground'}`} />
            <span className="hidden sm:inline">2. Cérebro da IA</span>
          </div>
          <div className={`flex items-center gap-2 bg-muted/30 px-4 py-2 rounded-full transition-all ${step >= 3 ? 'text-primary ring-1 ring-primary/30' : 'text-muted-foreground'}`}>
            <div className={`h-2 w-2 rounded-full ${step >= 3 ? 'bg-primary shadow-[0_0_8px_rgba(0,229,255,0.8)]' : 'bg-muted-foreground'}`} />
            <span className="hidden sm:inline">3. Plano & Ativação</span>
          </div>
        </div>

        {/* STEP 1: INITIAL PROFILE */}
        {step === 1 && (
          <Card className="shadow-2xl border-border/40 bg-background/80 backdrop-blur-md overflow-hidden animate-in fade-in slide-in-from-bottom-4">
            <div className="h-1.5 w-full bg-gradient-to-r from-primary via-secondary to-primary bg-[length:200%_auto] animate-gradient" />
            <CardHeader className="text-center pb-8 pt-10">
              <div className="mx-auto h-16 w-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(0,229,255,0.15)] ring-1 ring-primary/20">
                <Building2 className="h-8 w-8 text-primary" />
              </div>
              <CardTitle className="text-3xl font-black tracking-tight">Qual é o seu Negócio?</CardTitle>
              <CardDescription className="text-base font-medium mt-2">
                Dê um nome e escolha como nossa IA deve se comunicar pelas suas campanhas.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateCore} className="space-y-8">
                {errorMsg && (
                  <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-sm font-bold text-center">
                    {errorMsg}
                  </div>
                )}
                <div className="space-y-3">
                  <Label htmlFor="name" className="text-xs uppercase font-black tracking-widest text-muted-foreground">Nome da Empresa</Label>
                  <Input 
                    id="name" 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ex: Agência XYZ" 
                    required 
                    className="h-14 bg-muted/20 border-border/40 focus:border-primary/50 text-lg font-bold rounded-xl"
                  />
                </div>

                <div className="space-y-3">
                  <Label className="flex items-center gap-2 text-xs uppercase font-black tracking-widest text-muted-foreground">
                    <MessageCircle className="h-4 w-4" /> Tom de Voz do Agente IA
                  </Label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {TONE_OPTIONS.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setTone(option.value)}
                        className={`
                          flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all text-center
                          ${tone === option.value
                            ? 'border-primary bg-primary/10 shadow-[0_4px_20px_rgba(0,229,255,0.15)]'
                            : 'border-border/40 bg-muted/20 hover:border-border/80 hover:bg-muted/40'
                          }
                        `}
                      >
                        <span className={`text-sm font-black ${tone === option.value ? 'text-primary' : 'text-foreground'}`}>
                          {option.label}
                        </span>
                        <span className="text-[10px] text-muted-foreground mt-1 font-medium">{option.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <Button 
                  type="submit" 
                  disabled={isLoading || !name.trim()}
                  className="w-full h-14 bg-primary text-black hover:bg-primary/90 text-sm font-black rounded-xl shadow-xl flex items-center justify-center gap-2"
                >
                  {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <><ArrowRight className="h-5 w-5" /> CRIAR PERFIL AGORA</>}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {/* STEP 2: KNOWLEDGE BASE HUB */}
        {step === 2 && (
          <Card className="shadow-2xl border-border/40 bg-background/80 backdrop-blur-md overflow-hidden animate-in fade-in slide-in-from-bottom-4">
            <div className="h-1.5 w-full bg-gradient-to-r from-primary via-secondary to-primary bg-[length:200%_auto] animate-gradient" />
            <CardHeader className="pb-6 pt-10 px-8">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-3xl font-black tracking-tighter flex items-center gap-3">
                    <BrainCircuit className="h-8 w-8 text-primary" /> Alimente sua IA
                  </CardTitle>
                  <CardDescription className="text-base font-medium mt-2 max-w-lg">
                    Adicione site, PDF ou uma descrição em texto. Sem isso, você pode <strong>pular</strong> — a IA monta um perfil básico só com o nome e o tom da empresa (dá para enriquecer depois nas configurações).
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-8 px-8">
              {errorMsg && (
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-sm font-bold text-center">
                  {errorMsg}
                </div>
              )}

              {/* Descrição manual */}
              <div className="space-y-3 bg-muted/15 p-5 rounded-2xl border border-primary/25">
                <Label className="flex items-center gap-2 text-xs uppercase font-black tracking-widest text-primary">
                  <PenLine className="h-4 w-4" /> Ou descreva seu negócio em texto
                </Label>
                <Textarea
                  value={manualText}
                  onChange={(e) => setManualText(e.target.value)}
                  placeholder="Ex: Somos uma agência de tráfego pago em São Paulo. Atendemos e-commerces de moda e beleza. Nosso diferencial é criativo + performance com relatórios semanais..."
                  rows={5}
                  disabled={processingItems.length > 0}
                  className="bg-background/50 border-border/40 rounded-xl text-sm font-medium resize-y min-h-[120px]"
                />
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-[10px] text-muted-foreground font-medium">
                    Mínimo 20 caracteres. Vira uma fonte na memória da IA como a URL ou o PDF.
                  </p>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={handleAddManual}
                    disabled={
                      manualText.trim().length < 20 || processingItems.length > 0
                    }
                    className="h-10 font-bold rounded-lg"
                  >
                    Adicionar à memória
                  </Button>
                </div>
              </div>
              
              {/* Inputs */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-8 border-b border-border/40">
                {/* URL */}
                <div className="space-y-3 bg-muted/20 p-5 rounded-2xl border border-border/40">
                  <Label className="flex items-center gap-2 text-xs uppercase font-black tracking-widest text-primary">
                    <Globe className="h-4 w-4" /> Link do Site
                  </Label>
                  <div className="flex gap-2">
                    <Input 
                      type="url"
                      placeholder="https://seu-site.com" 
                      value={urlInput}
                      onChange={e => setUrlInput(e.target.value)}
                      className="bg-background/50 border-border/40 h-11 rounded-lg font-medium"
                    />
                    <Button 
                      type="button" 
                      onClick={() => handleAddKB('url')}
                      disabled={!urlInput.trim() || processingItems.length > 0}
                      className="h-11 bg-secondary hover:bg-secondary/90 text-white font-bold rounded-lg px-4"
                    >
                      Ler
                    </Button>
                  </div>
                  <p className="text-[10px] text-muted-foreground font-medium">A IA raspará a página para aprender.</p>
                </div>

                {/* FILE */}
                <div className="space-y-3 bg-muted/20 p-5 rounded-2xl border border-border/40">
                  <Label className="flex items-center gap-2 text-xs uppercase font-black tracking-widest text-primary">
                    <FileText className="h-4 w-4" /> Enviar PDF/Doc
                  </Label>
                  <div className="flex gap-2 items-center">
                    <Input 
                      type="file" 
                      accept=".pdf,.txt,.doc,.docx"
                      onChange={e => setFileInput(e.target.files?.[0] || null)}
                      className="bg-background/50 border-border/40 h-11 rounded-lg file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-xs file:font-bold file:bg-primary/20 file:text-primary hover:file:bg-primary/30 cursor-pointer"
                    />
                    <Button 
                      type="button"
                      onClick={() => handleAddKB('file')}
                      disabled={!fileInput || processingItems.length > 0}
                      className="h-11 bg-secondary hover:bg-secondary/90 text-white font-bold rounded-lg px-4"
                    >
                      Analisar
                    </Button>
                  </div>
                  <p className="text-[10px] text-muted-foreground font-medium">Faça upload de propostas ou catálogos.</p>
                </div>
              </div>

              {/* Status & Processing Items List */}
              <div className="space-y-4">
                <h3 className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                  Memória da IA <span className="text-muted-foreground font-normal">({kbItems.length} aprendizados)</span>
                </h3>
                
                {kbItems.length === 0 && processingItems.length === 0 ? (
                  <div className="text-center py-12 px-4 border-2 border-dashed border-border/40 rounded-2xl bg-muted/10">
                    <Sparkles className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
                    <p className="text-sm font-bold text-muted-foreground">Sua base está vazia.</p>
                    <p className="text-xs font-medium text-muted-foreground/60 mt-1 max-w-md mx-auto">
                      Adicione URL, arquivo ou texto manual — ou use <strong className="text-foreground/80">Pular por agora</strong> abaixo para gerar um perfil inicial mínimo.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-64 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-muted-foreground/20">
                    {/* Processing */}
                    {processingItems.map((pi, idx) => (
                      <div key={'proc-'+idx} className="flex gap-4 p-4 rounded-xl border border-primary/20 bg-primary/5 animate-pulse">
                        <Loader2 className="h-6 w-6 text-primary animate-spin shrink-0" />
                        <div className="space-y-1">
                          <p className="text-sm font-bold text-primary">A IA está processando e lendo a fonte...</p>
                          <p className="text-xs text-muted-foreground">Extraindo dores e persona ideal.</p>
                        </div>
                      </div>
                    ))}
                    
                    {/* Completed */}
                    {[...kbItems].reverse().map((item, idx) => (
                      <div key={item.id || idx} className={`flex gap-4 p-4 rounded-xl border transition-colors ${item.status === 'failed' ? 'border-red-500/30 bg-red-500/5' : 'border-border/40 bg-muted/20 hover:bg-muted/30'}`}>
                        <div className="mt-1 shrink-0">
                          {item.status === 'failed' ? (
                            <X className="h-5 w-5 text-red-500" />
                          ) : (
                            <CheckCircle2 className="h-5 w-5 text-green-500" />
                          )}
                        </div>
                        <div className="space-y-2 w-full">
                          <div className="flex items-center justify-between">
                            <span className={`text-xs font-black tracking-wider uppercase ${item.status === 'failed' ? 'text-red-400' : 'text-muted-foreground'}`}>
                              {item.type} • {String(item.source).substring(0,30)}
                            </span>
                          </div>
                          <p className={`text-sm font-medium leading-relaxed italic border-l-2 pl-3 ${item.status === 'failed' ? 'border-red-500/50 text-red-200/70' : 'border-primary/50 text-foreground'}`}>
                            "{item.ai_feedback}"
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
            <CardFooter className="px-8 pb-8 pt-4 flex flex-col gap-3">
              <Button 
                onClick={handleSynthesize}
                disabled={
                  isLoading ||
                  processingItems.length > 0 ||
                  completedKbCount === 0
                }
                className="w-full h-14 bg-primary text-black hover:bg-primary/90 text-sm font-black rounded-xl shadow-xl flex items-center justify-center gap-2 group relative overflow-hidden"
              >
                {isLoading ? (
                  <><Loader2 className="h-5 w-5 animate-spin" /> SINTETIZANDO CONHECIMENTO...</>
                ) : (
                  <>SINTETIZAR & TREINAR AGENTE MESTRE <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" /></>
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleSkipKnowledge}
                disabled={isLoading || processingItems.length > 0}
                className="w-full h-11 rounded-xl text-sm font-bold border-border/60 text-muted-foreground hover:text-foreground"
              >
                Pular por agora — perfil básico
              </Button>
              <p className="text-[11px] text-center text-muted-foreground font-medium leading-relaxed">
                Com fontes na memória, use o botão principal para um ICP mais rico. Sem fontes, &quot;Pular&quot; usa só o nome e o tom definidos no passo 1.
              </p>
            </CardFooter>
          </Card>
        )}

        {/* STEP 3: PLATFORM GO LIVE (PLANS) */}
        {step === 3 && (
          <Card className="shadow-2xl border-border/40 bg-background/80 backdrop-blur-md overflow-hidden animate-in fade-in slide-in-from-right-8 duration-500">
            <div className="h-1.5 w-full bg-gradient-to-r from-green-500 via-emerald-400 to-green-500 bg-[length:200%_auto] animate-gradient" />
            <CardHeader className="text-center pb-8 pt-10">
              <div className="mx-auto h-16 w-16 bg-green-500/10 rounded-2xl flex items-center justify-center mb-6 ring-1 ring-green-500/30">
                <CheckCircle2 className="h-8 w-8 text-green-500" />
              </div>
              <CardTitle className="text-3xl font-black tracking-tight">IA Treinada com Sucesso</CardTitle>
              <CardDescription className="text-base font-medium mt-2">
                O Cérebro da IA gerou o seu Master ICP. Agora, escolha o tamanho da sua operação e ative o Capturo.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleFinish} className="space-y-8">
                <input type="hidden" name="plan" value={selectedPlan} />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Free Plan */}
                  <div
                    onClick={() => setSelectedPlan("free")}
                    className={`relative flex flex-col p-6 rounded-2xl border-2 transition-all cursor-pointer ${selectedPlan === 'free' ? 'border-primary bg-primary/5 shadow-[0_0_30px_rgba(0,229,255,0.1)]' : 'border-border/40 bg-background/50 hover:border-primary/30'}`}
                  >
                    <div className="space-y-2 mb-6">
                      <h3 className="text-xl font-black uppercase">Start Free</h3>
                      <p className="text-sm text-muted-foreground font-medium">O essencial para validar e escalar sua prospecção.</p>
                    </div>
                    <div className="space-y-3 flex-1 mb-8">
                      <div className="flex items-center gap-2 text-sm font-bold"><CheckCircle2 className="h-4 w-4 text-primary" /> 100 Leads / mês</div>
                      <div className="flex items-center gap-2 text-sm font-bold"><CheckCircle2 className="h-4 w-4 text-primary" /> 3 Campanhas simultâneas</div>
                      <div className="flex items-center gap-2 text-sm font-bold"><CheckCircle2 className="h-4 w-4 text-primary" /> Exportar CSV Leads</div>
                    </div>
                    <div className="text-3xl font-black text-foreground">R$ 0<span className="text-sm text-muted-foreground">/mês</span></div>
                  </div>

                  {/* PRO Plan */}
                  <div
                    onClick={() => setSelectedPlan("pro")}
                    className={`relative flex flex-col p-6 rounded-2xl border-2 transition-all cursor-pointer overflow-hidden ${selectedPlan === 'pro' ? 'border-secondary bg-secondary/5 shadow-[0_0_30px_rgba(0,153,179,0.15)]' : 'border-border/40 bg-background/50 hover:border-secondary/30'}`}
                  >
                    <div className="absolute top-0 right-0 bg-secondary text-[10px] font-black px-4 py-1 text-white uppercase tracking-widest rounded-bl-xl shadow-lg">Recomendado</div>
                    
                    <div className="space-y-2 mb-6">
                      <h3 className="text-xl font-black uppercase">Pro Growth</h3>
                      <p className="text-sm text-muted-foreground font-medium">A máquina de vendas completa, ilimitada.</p>
                    </div>
                    <div className="space-y-3 flex-1 mb-8">
                      <div className="flex items-center gap-2 text-sm font-bold"><CheckCircle2 className="h-4 w-4 text-secondary" /> 1.000 Leads / mês</div>
                      <div className="flex items-center gap-2 text-sm font-bold"><CheckCircle2 className="h-4 w-4 text-secondary" /> Campanhas Ilimitadas</div>
                      <div className="flex items-center gap-2 text-sm font-bold"><CheckCircle2 className="h-4 w-4 text-secondary" /> Exportação Ilimitada</div>
                    </div>
                    <div className="text-3xl font-black text-foreground">R$ 97<span className="text-sm text-muted-foreground">/mês</span></div>
                  </div>
                </div>

                <Button 
                  type="submit" 
                  disabled={isLoading}
                  className="w-full h-14 bg-foreground hover:bg-foreground/90 text-background text-sm font-black rounded-xl shadow-xl flex items-center justify-center gap-2"
                >
                  {isLoading ? <Loader2 className="h-5 w-5 animate-spin text-background" /> : "IR PARA O DASHBOARD"}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

      </div>
    </div>
  );
}
