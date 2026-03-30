import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, Building2, Sparkles, Save, ShieldCheck, Globe, Info, AlertTriangle } from "lucide-react";
import { getPlanUsage, PlanType } from "@/utils/plan-limits";
import KnowledgeBaseManager from "./KnowledgeBaseManager";
import {
  BusinessSettingsForm,
  ProfileSettingsForm,
  SettingsSubmitButton,
} from "./SettingsFormShell";

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: business } = await supabase
    .from("businesses")
    .select("*, agents(config)")
    .eq("user_id", user.id)
    .single();

  if (!business) {
    redirect("/onboarding");
  }

  const { data: knowledgeItems } = await supabase
    .from("knowledge_bases")
    .select("id, type, source, ai_feedback, status")
    .eq("business_id", business.id)
    .order("created_at", { ascending: false });

  const usage = await getPlanUsage(supabase, business.id, (business.plan || 'free') as PlanType);

  const fullName = user.user_metadata?.full_name || "";
  const [firstName, ...lastNameParts] = fullName.split(" ");
  const lastName = lastNameParts.join(" ");

  // Helper to format ICP for Textarea
  const formatICP = (icp: unknown) => {
    if (!icp) return "";
    if (typeof icp === "string") return icp;
    if (typeof icp !== "object" || icp === null) return "";
    const o = icp as Record<string, unknown>;
    if (typeof o.outline === "string") return o.outline;
    if (typeof o.target_audience === "string") {
      const pains = o.pain_points;
      const painStr = Array.isArray(pains) ? pains.join(", ") : String(pains ?? "");
      return `Público: ${o.target_audience}\nDores: ${painStr}\nValor: ${o.solution_value ?? ""}`;
    }
    return JSON.stringify(icp, null, 2);
  };

  return (
    <div className="flex h-screen bg-[#020817] font-sans text-foreground overflow-hidden">
      <Sidebar userEmail={user.email} usage={usage} />

      <main className="flex-1 overflow-auto bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/5 via-background to-background">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 space-y-10 pb-32">
          {/* Header Section */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8 border-b border-white/5">
            <div className="space-y-1.5">
              <h1 className="text-3xl md:text-5xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/60">Configurações</h1>
              <p className="text-sm md:text-base text-muted-foreground font-medium">Controle sua identidade digital e potência de IA no CAPTURO.</p>
            </div>
            
            {/* Quick Usage Summary */}
            <div className="flex items-center gap-5 p-4 rounded-2xl bg-white/[0.03] border border-white/5 backdrop-blur-md w-full md:w-auto justify-between md:justify-start">
              <div className="flex flex-col text-right pr-5 border-r border-white/10 flex-1 md:flex-none">
                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-0.5">Plano Atual</span>
                <span className="text-sm font-black text-primary">{usage.planName}</span>
              </div>
              <div className="flex flex-col flex-1 md:flex-none">
                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-0.5">Leads Usados</span>
                <span className="text-sm font-black text-foreground">{usage.used} / {usage.total}</span>
              </div>
            </div>
          </div>

          <Tabs defaultValue="business" className="space-y-8">
            <div className="w-full flex justify-center md:justify-start">
              <TabsList className="bg-muted/40 p-1.5 rounded-2xl flex w-max border-none h-auto items-center">
                <TabsTrigger value="business" className="rounded-xl px-4 md:px-6 py-2.5 md:py-3 gap-2 font-black tracking-wide data-[state=active]:bg-primary data-[state=active]:text-black data-[state=active]:shadow-md transition-all text-xs md:text-sm">
                  <Building2 className="h-4 w-4 shrink-0" /> Negócio & IA
                </TabsTrigger>
                <TabsTrigger value="profile" className="rounded-xl px-4 md:px-6 py-2.5 md:py-3 gap-2 font-black tracking-wide data-[state=active]:bg-primary data-[state=active]:text-black data-[state=active]:shadow-md transition-all text-xs md:text-sm">
                  <User className="h-4 w-4 shrink-0" /> Perfil
                </TabsTrigger>
                <TabsTrigger value="billing" className="rounded-xl px-4 md:px-6 py-2.5 md:py-3 gap-2 font-black tracking-wide data-[state=active]:bg-primary data-[state=active]:text-black data-[state=active]:shadow-md transition-all text-xs md:text-sm">
                  <ShieldCheck className="h-4 w-4 shrink-0" /> Assinatura
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="business" className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 outline-none mt-8">
              <Card className="bg-muted/20 border-border/40 backdrop-blur-sm overflow-hidden border-t-0 ring-1 ring-border/20 shadow-2xl">
                <div className="h-1.5 w-full bg-gradient-to-r from-primary via-secondary to-primary bg-[length:200%_auto] animate-gradient" />
                <CardHeader className="pb-8">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-[0_0_20px_rgba(0,229,255,0.15)]">
                      <Sparkles className="h-6 w-6 fill-primary/20" />
                    </div>
                    <div>
                      <CardTitle className="text-2xl font-black italic tracking-tighter uppercase">Cérebro da IA</CardTitle>
                      <CardDescription className="text-muted-foreground font-medium">Defina como nossa IA deve agir e quem ela deve prospectar.</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <BusinessSettingsForm>
                  <CardContent className="space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-2.5">
                        <Label htmlFor="name" className="text-xs font-black uppercase tracking-widest text-muted-foreground">Nome da Empresa</Label>
                        <Input id="name" name="name" defaultValue={business?.name} className="h-12 bg-muted/20 border-border/40 focus:border-primary/40 focus:ring-primary/10 rounded-xl font-bold" required />
                      </div>
                      <div className="space-y-2.5">
                        <Label htmlFor="segment" className="text-xs font-black uppercase tracking-widest text-muted-foreground">Segmento / Especialidade</Label>
                        <Input id="segment" name="segment" defaultValue={business?.segment} placeholder="Ex: Marketing para Médicos, Software de Gestão" className="h-12 bg-muted/20 border-border/40 focus:border-primary/40 focus:ring-primary/10 rounded-xl font-bold" required />
                      </div>
                    </div>

                    <div className="space-y-2.5">
                      <Label htmlFor="website" className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                        <Globe className="h-4 w-4" /> Website Principal
                      </Label>
                      <Input id="website" name="website" defaultValue={business?.website || ""} placeholder="https://seu-site.com" className="h-12 bg-muted/20 border-border/40 focus:border-primary/40 focus:ring-primary/10 rounded-xl font-bold" />
                    </div>

                    <div className="space-y-4 p-6 rounded-2xl bg-primary/5 border border-primary/20 relative group overflow-hidden">
                      <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Sparkles className="h-24 w-24 text-primary" />
                      </div>
                      
                      <div className="flex items-center justify-between relative z-10">
                        <Label htmlFor="icp" className="text-sm font-black text-primary flex items-center gap-2 uppercase tracking-wide">
                          Personalidade do Cliente Ideal (ICP)
                        </Label>
                        <Badge className="bg-primary/20 text-primary border-primary/20 text-[10px] font-black uppercase translate-y-[-2px]">Motor Inteligente</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground font-medium relative z-10 max-w-2xl leading-relaxed">
                        Descreva detalhadamente quem você quer atingir. Informe dores, regiões, tamanhos de empresa e diferenciais que você oferece. Nossa IA usará isso para dar <span className="text-primary font-bold">notas (Lead Score)</span> a cada prospecção.
                      </p>
                      <Textarea 
                        id="icp" 
                        name="icp" 
                        defaultValue={formatICP(business?.icp)} 
                        rows={8}
                        required
                        className="bg-muted/10 border-primary/20 focus:border-primary/50 focus:ring-primary/5 rounded-xl text-sm leading-relaxed font-medium relative z-10 placeholder:text-muted-foreground/40"
                        placeholder="Ex: Procuro agências de marketing de 5 a 20 funcionários em SP que ainda não usem CRM..." 
                      />
                    </div>

                    <KnowledgeBaseManager businessId={business.id} initialItems={knowledgeItems || []} />
                  </CardContent>
                  <CardFooter className="p-8 bg-muted/20 border-t border-border/40 backdrop-blur-md flex justify-end">
                    <SettingsSubmitButton
                      type="submit"
                      pendingLabel="SALVANDO…"
                      className="h-12 bg-secondary hover:bg-secondary/90 text-white gap-3 px-10 rounded-xl font-black shadow-2xl shadow-secondary/20 transition-all hover:scale-[1.02] active:scale-95"
                    >
                      <Save className="h-5 w-5" /> ATUALIZAR INFORMAÇÕES BÁSICAS
                    </SettingsSubmitButton>
                  </CardFooter>
                </BusinessSettingsForm>
              </Card>
            </TabsContent>

            <TabsContent value="profile" className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 outline-none mt-8">
              <Card className="bg-muted/20 border-border/40 backdrop-blur-sm overflow-hidden border-t-0 ring-1 ring-border/20 shadow-2xl max-w-2xl mx-auto">
                <CardHeader>
                  <CardTitle className="text-xl font-black uppercase italic tracking-tight">Informações Pessoais</CardTitle>
                </CardHeader>
                <ProfileSettingsForm>
                  <CardContent className="space-y-6">
                    <div className="flex flex-col items-center gap-4 mb-4 pb-6 border-b border-border/40">
                      <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-3xl font-black text-black shadow-xl shrink-0">
                        {user.email?.[0]?.toUpperCase()}
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-black text-foreground">{fullName}</p>
                        <p className="text-xs text-muted-foreground font-medium">{user.email}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="firstName" className="text-[10px] font-black uppercase text-muted-foreground tracking-widest pl-1">Primeiro Nome</Label>
                        <Input id="firstName" name="firstName" defaultValue={firstName} className="h-11 bg-muted/20 border-border/40 focus:border-primary/40 rounded-xl font-bold" required />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="lastName" className="text-[10px] font-black uppercase text-muted-foreground tracking-widest pl-1">Sobrenome</Label>
                        <Input id="lastName" name="lastName" defaultValue={lastName} className="h-11 bg-muted/20 border-border/40 focus:border-primary/40 rounded-xl font-bold" required />
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="bg-muted/30 p-6 border-t border-border/40 flex justify-end">
                    <SettingsSubmitButton
                      type="submit"
                      pendingLabel="SALVANDO…"
                      className="h-11 bg-primary text-black hover:bg-primary/90 gap-2 px-8 rounded-xl font-black"
                    >
                      <Save className="h-4 w-4" /> SALVAR PERFIL
                    </SettingsSubmitButton>
                  </CardFooter>
                </ProfileSettingsForm>
              </Card>
            </TabsContent>

            {/* Integrations tab hidden for now */}

            <TabsContent value="billing" className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 outline-none mt-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <Card className="md:col-span-2 bg-gradient-to-br from-muted/30 to-background border-border/40 shadow-2xl overflow-hidden relative">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 blur-[100px] -translate-y-1/2 translate-x-1/2 rounded-full" />
                  
                  <CardHeader className="pb-8">
                    <CardTitle className="text-2xl font-black italic uppercase tracking-tighter">Status da Assinatura</CardTitle>
                    <CardDescription className="text-muted-foreground font-medium">Gerencie seu faturamento e consumo mensal.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-10">
                    <div className="flex flex-col md:flex-row gap-8 items-start md:items-center justify-between p-8 rounded-3xl bg-white/[0.03] border border-white/5 ring-1 ring-white/10">
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <Badge className="bg-primary text-black font-black uppercase tracking-widest text-[10px] px-3">Plano {usage.planName}</Badge>
                          <Badge variant="outline" className="border-border/40 text-[10px] uppercase font-bold">Ativo</Badge>
                        </div>
                        <h3 className="text-4xl font-black tracking-tighter text-foreground">
                          {usage.total === 100 ? 'Gratuito' : `Prospecção ${usage.planName}`}
                        </h3>
                        <p className="text-sm text-muted-foreground font-medium flex items-center gap-2">
                          <Info className="h-4 w-4 text-primary" /> Seu limite reinicia no dia 01 de cada mês.
                        </p>
                      </div>

                      <div className="w-full md:w-auto flex flex-col items-center gap-3">
                        <div className="relative w-32 h-32 flex items-center justify-center">
                          <svg className="w-full h-full transform -rotate-90">
                            <circle className="text-muted/10" strokeWidth="10" stroke="currentColor" fill="transparent" r="58" cx="64" cy="64" />
                            <circle 
                              className="text-primary transition-all duration-1000 ease-out" 
                              strokeWidth="10" 
                              strokeDasharray={364.4} 
                              strokeDashoffset={364.4 - (364.4 * Math.min(usage.used/usage.total, 1))} 
                              strokeLinecap="round" 
                              stroke="currentColor" 
                              fill="transparent" 
                              r="58" 
                              cx="64" 
                              cy="64" 
                            />
                          </svg>
                          <div className="absolute flex flex-col items-center">
                            <span className="text-2xl font-black text-foreground">{Math.round((usage.used/usage.total)*100)}%</span>
                            <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground">Usado</span>
                          </div>
                        </div>
                        <div className="text-center">
                          <p className="text-xs font-black text-muted-foreground uppercase">{usage.used} / {usage.total} LEADS</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4">
                      <Button className="h-12 bg-primary text-black hover:bg-primary/90 font-black rounded-xl px-8 flex-1">ALTERAR PLANO</Button>
                      <Button variant="outline" className="h-12 border-border/40 font-black rounded-xl px-8 flex-1">GESTÃO DE COBRANÇA</Button>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-red-500/[0.02] border-red-500/10 flex flex-col shadow-xl">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-sm font-black text-red-500 uppercase tracking-widest flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4" /> Zona de Risco
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 flex-1">
                    <p className="text-xs text-muted-foreground font-medium leading-relaxed">Se você desejar interromper sua jornada no CAPTURO ou precisar remover todos os seus dados permanentemente.</p>
                  </CardContent>
                  <CardFooter className="pt-0">
                    <Button variant="ghost" className="w-full text-red-500/60 hover:text-red-500 hover:bg-red-500/10 text-[10px] font-black uppercase tracking-widest h-9 rounded-lg">Excluir Conta Permanentemente</Button>
                  </CardFooter>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}
