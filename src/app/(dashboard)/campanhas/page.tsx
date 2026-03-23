import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { signOut } from "@/app/(auth)/actions";
import { Zap, LayoutDashboard, Columns3, MessageSquare, Settings, LogOut, Plus, Mail, MessageCircle, Trash2, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { createCampaignAction, deleteCampaignAction } from "./actions";
import Sidebar from "@/components/Sidebar";

export default async function CampaignsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: business } = await supabase
    .from("businesses")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!business) {
    redirect("/onboarding");
  }

  const { data: campaigns } = await supabase
    .from("campaigns")
    .select("*, leads:leads(count)")
    .eq("business_id", business.id)
    .order("created_at", { ascending: false });

  return (
    <div className="flex h-screen bg-muted/30 font-sans text-foreground">
      <Sidebar userEmail={user.email} />

      {/* Main */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-14 bg-background border-b border-border/40 flex items-center justify-between px-6 shrink-0">
          <h1 className="text-lg font-semibold">Campanhas de Prospecção</h1>
          <form action={createCampaignAction} className="flex gap-2">
            <input type="hidden" name="channel" value="whatsapp" />
            <input type="hidden" name="name" value="Nova Campanha" />
            <input type="hidden" name="description" value="Abordagem inicial de leads prospectados." />
            <Button size="sm" type="submit" className="gap-2">
              <Plus className="h-4 w-4" /> Nova Campanha
            </Button>
          </form>
        </header>

        <div className="flex-1 overflow-auto p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {campaigns?.map((campaign) => (
              <div key={campaign.id} className="bg-background rounded-2xl border border-border/50 shadow-sm overflow-hidden flex flex-col hover:shadow-md transition-shadow">
                <div className="p-6 flex-1">
                  <div className="flex items-start justify-between mb-4">
                    <div className={`p-2 rounded-xl ${campaign.channel === 'whatsapp' ? 'bg-green-500/10 text-green-600' : 'bg-blue-500/10 text-blue-600'}`}>
                      {campaign.channel === 'whatsapp' ? <MessageCircle className="h-6 w-6" /> : <Mail className="h-6 w-6" />}
                    </div>
                    <Badge variant={campaign.status === 'active' ? 'default' : 'secondary'} className={`${campaign.status === 'active' ? 'bg-green-500 hover:bg-green-600' : ''} text-[10px]`}>
                      {campaign.status === 'active' ? 'Ativa' : 'Rascunho'}
                    </Badge>
                  </div>
                  
                  <h3 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors">{campaign.name}</h3>
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{campaign.description}</p>
                  
                  <div className="flex items-center gap-4 py-4 border-t border-border/40">
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Leads</p>
                      <p className="text-lg font-bold">{(campaign.leads?.[0] as any)?.count || 0}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Conversão</p>
                      <p className="text-lg font-bold">0%</p>
                    </div>
                  </div>
                </div>

                <div className="bg-muted/30 p-4 border-t border-border/40 flex items-center justify-between">
                  <div className="flex gap-2">
                    <form action={async () => {
                      'use server'
                      await deleteCampaignAction(campaign.id);
                    }}>
                      <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-destructive hover:bg-destructive/10">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </form>
                  </div>
                  <Link href={`/campanhas/${campaign.id}`}>
                    <Button variant="outline" size="sm" className="gap-2 h-9">
                      Ver Detalhes <ExternalLink className="h-3.5 w-3.5" />
                    </Button>
                  </Link>
                </div>
              </div>
            ))}

            {campaigns?.length === 0 && (
              <div className="col-span-full py-20 flex flex-col items-center justify-center text-center bg-background rounded-3xl border border-dashed border-border/60">
                <div className="bg-muted p-4 rounded-full mb-4">
                  <MessageSquare className="h-10 w-10 text-muted-foreground/40" />
                </div>
                <h3 className="text-xl font-bold">Nenhuma campanha criada</h3>
                <p className="text-muted-foreground mt-2 max-w-sm">
                  Crie sua primeira campanha para começar a abordar os leads qualificados que você encontrou.
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
