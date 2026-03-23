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
import { updateBusinessAction, updateProfileAction } from "./actions";

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: business } = await supabase
    .from("businesses")
    .select("*")
    .eq("user_id", user.id)
    .single();

  const fullName = user.user_metadata?.full_name || "";
  const [firstName, ...lastNameParts] = fullName.split(" ");
  const lastName = lastNameParts.join(" ");

  // Helper to format ICP for Textarea
  const formatICP = (icp: any) => {
    if (!icp) return "";
    if (typeof icp === 'string') return icp;
    
    // If it's the JSON object from extractBusinessProfile
    if (icp.target_audience) {
      return `Público: ${icp.target_audience}\nDores: ${Array.isArray(icp.pain_points) ? icp.pain_points.join(", ") : icp.pain_points}\nValor: ${icp.solution_value}`;
    }
    
    return JSON.stringify(icp, null, 2);
  };

  return (
    <div className="flex h-screen bg-muted/30 font-sans text-foreground">
      <Sidebar userEmail={user.email} />

      <main className="flex-1 overflow-auto p-6 md:p-10">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-black tracking-tight">Configurações</h1>
              <p className="text-muted-foreground mt-1">Gerencie sua conta e as preferências da sua IA.</p>
            </div>
          </div>

          <Tabs defaultValue="business" className="space-y-6">
            <TabsList className="bg-background border p-1 rounded-xl h-11">
              <TabsTrigger value="profile" className="rounded-lg px-6 gap-2 data-[state=active]:bg-primary data-[state=active]:text-white">
                <User className="h-4 w-4" /> Conta
              </TabsTrigger>
              <TabsTrigger value="business" className="rounded-lg px-6 gap-2 data-[state=active]:bg-primary data-[state=active]:text-white">
                <Building2 className="h-4 w-4" /> Negócio & IA
              </TabsTrigger>
            </TabsList>

            <TabsContent value="profile" className="space-y-6">
              <Card className="border-border/40 shadow-sm overflow-hidden">
                <CardHeader className="bg-muted/30 pb-6 border-b">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                      <User className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle>Perfil de Usuário</CardTitle>
                      <CardDescription>Como você será identificado no ProspectAI.</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <form action={updateProfileAction}>
                  <CardContent className="pt-6 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="firstName">Primeiro Nome</Label>
                        <Input id="firstName" name="firstName" defaultValue={firstName} required />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="lastName">Sobrenome</Label>
                        <Input id="lastName" name="lastName" defaultValue={lastName} required />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">E-mail (Não editável)</Label>
                      <Input id="email" defaultValue={user.email} disabled className="bg-muted/50" />
                    </div>
                  </CardContent>
                  <CardFooter className="bg-muted/10 border-t px-6 py-4 flex justify-end">
                    <Button type="submit" className="gap-2 px-6 font-bold shadow-lg shadow-primary/20">
                      <Save className="h-4 w-4" /> Salvar Perfil
                    </Button>
                  </CardFooter>
                </form>
              </Card>

              <Card className="border-border/40 shadow-sm border-red-100 bg-red-50/10">
                <CardHeader>
                  <CardTitle className="text-red-600 flex items-center gap-2">
                    <ShieldCheck className="h-5 w-5" /> Zona de Segurança
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">Se você deseja alterar sua senha ou excluir sua conta, entre em contato com o suporte ou acesse as configurações de segurança do Supabase.</p>
                  <Button variant="outline" disabled className="text-red-600 border-red-200">Excluir minha conta</Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="business" className="space-y-6">
              <Card className="border-border/40 shadow-sm overflow-hidden border-l-4 border-l-secondary">
                <CardHeader className="bg-secondary/5 pb-6 border-b">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-secondary/10 flex items-center justify-center text-secondary">
                      <Building2 className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle>Identidade do Negócio</CardTitle>
                      <CardDescription>Essas informações são usadas para gerar propostas e qualificar leads.</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <form action={updateBusinessAction}>
                  <CardContent className="pt-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="name">Nome da Empresa</Label>
                        <Input id="name" name="name" defaultValue={business?.name} required />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="segment">Segmento/Nicho</Label>
                        <Input id="segment" name="segment" defaultValue={business?.segment} placeholder="Ex: Marketing Digital, Software B2B" required />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="website" className="flex items-center gap-2">
                        <Globe className="h-4 w-4 text-muted-foreground" /> Website Principal
                      </Label>
                      {/* Note: Check if website column exists. Falling back to empty string if it fails during update */}
                      <Input id="website" name="website" defaultValue={business?.website || ""} placeholder="https://seu-site.com" />
                    </div>

                    <div className="space-y-3 p-4 rounded-xl bg-primary/5 border border-primary/10">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="icp" className="flex items-center gap-2 text-primary font-bold">
                          <Sparkles className="h-4 w-4 fill-primary" /> Perfil de Cliente Ideal (ICP)
                        </Label>
                        <Badge variant="outline" className="text-[10px] bg-white border-primary/20 text-primary">Coração da sua IA</Badge>
                      </div>
                      <p className="text-[11px] text-muted-foreground italic mb-2">Descreva detalhadamente quem é seu cliente ideal. Quanto melhor a descrição, mais precisa será a nota do lead e o script de vendas.</p>
                      <Textarea 
                        id="icp" 
                        name="icp" 
                        defaultValue={formatICP(business?.icp)} 
                        rows={6}
                        required
                        className="bg-white/80 border-primary/20 focus:ring-primary/30"
                        placeholder="Ex: Procuro empresas de médio porte no setor industrial que ainda não tenham presença digital forte em São Paulo..." 
                      />
                      <div className="flex items-center gap-2 text-primary/60 text-[10px]">
                        <Info className="h-3 w-3" />
                        <span>A IA usará este texto para analisar cada estabelecimento encontrado no Google Maps.</span>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="bg-muted/10 border-t px-6 py-4 flex flex-col items-end gap-3">
                    <Button type="submit" className="bg-secondary hover:bg-secondary/90 text-white gap-2 px-8 font-black shadow-lg shadow-secondary/10 w-full sm:w-auto">
                      <Save className="h-4 w-4" /> Atualizar Inteligência do Negócio
                    </Button>
                  </CardFooter>
                </form>
              </Card>

              {/* Action alert for missing column */}
              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex gap-3 text-amber-800 shadow-sm">
                <AlertTriangle className="h-5 w-5 shrink-0" />
                <div className="text-xs space-y-1">
                  <p className="font-bold">Aviso Técnico:</p>
                  <p>Para o campo de "Website" funcionar corretamente, você precisa rodar o SQL abaixo no seu painel da Supabase:</p>
                  <code className="block bg-amber-100/50 p-2 rounded mt-2 border border-amber-200/50 select-all">
                    ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS website TEXT;
                  </code>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}
