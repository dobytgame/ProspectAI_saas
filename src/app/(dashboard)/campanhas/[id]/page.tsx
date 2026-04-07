import { createClient } from "@/utils/supabase/server";
import { notFound, redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Radar } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import Sidebar from "@/components/Sidebar";
import SearchForm from "@/components/SearchForm";
import CampaignLeadsList from "@/components/CampaignLeadsList";
import BatchGenerateButton from "@/components/BatchGenerateButton";

export default async function CampaignDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: campaign } = await supabase
    .from("campaigns")
    .select("*, business:businesses(*)")
    .eq("id", id)
    .single();

  if (!campaign) {
    notFound();
  }

  const { data: leads } = await supabase
    .from("leads")
    .select("*")
    .eq("campaign_id", campaign.id)
    .order("score", { ascending: false });

  const pendingLeads = leads?.filter(l => !l.metadata?.generated_message).length || 0;

  return (
    <div className="flex h-screen bg-muted/30 font-sans text-foreground">
       <Sidebar userEmail={user.email} />

      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-14 bg-background border-b border-border/40 flex items-center justify-between px-6 shrink-0">
          <div className="flex items-center gap-3">
            <Link href="/campanhas">
              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                <ChevronLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div className="flex flex-col">
                <h1 className="text-sm font-bold flex items-center gap-2">
                    {campaign.name}
                    <Badge variant="outline" className="text-secondary border-secondary/30 bg-secondary/5 text-[9px] h-4 uppercase px-1">
                        {campaign.channel}
                    </Badge>
                </h1>
                <p className="text-[10px] text-muted-foreground line-clamp-1">{campaign.description}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <BatchGenerateButton campaignId={id} pendingCount={pendingLeads} />
            <Badge className="bg-green-500 text-white border-none text-[10px] px-2 h-5">Campanha Ativa</Badge>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-6 md:p-10">
          <div className="max-w-6xl mx-auto space-y-8">
            
            {/* Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-background/60 backdrop-blur-sm p-5 rounded-2xl border border-border/40 shadow-sm flex flex-col items-center text-center">
                    <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest mb-1">Leads no Funil</p>
                    <p className="text-3xl font-black">{leads?.length || 0}</p>
                </div>
                <div className="bg-background/60 backdrop-blur-sm p-5 rounded-2xl border border-border/40 shadow-sm flex flex-col items-center text-center">
                    <p className="text-[10px] text-secondary uppercase font-black tracking-widest mb-1">Scripts prontos</p>
                    <p className="text-3xl font-black text-secondary">{leads?.filter(l => l.metadata?.generated_message).length || 0}</p>
                </div>
                <div className="bg-background/60 backdrop-blur-sm p-5 rounded-2xl border border-border/40 shadow-sm flex flex-col items-center text-center">
                    <p className="text-[10px] text-green-500 uppercase font-black tracking-widest mb-1">Contatados</p>
                    <p className="text-3xl font-black text-green-500">{leads?.filter(l => l.status === 'contacted').length || 0}</p>
                </div>
                <div className="bg-background/60 backdrop-blur-sm p-5 rounded-2xl border border-border/40 shadow-sm flex flex-col items-center text-center">
                    <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest mb-1">Meta Batida</p>
                    <p className="text-3xl font-black">0%</p>
                </div>
            </div>

            {/* Discovery Section (New) */}
            <div className="bg-background/40 backdrop-blur-sm p-6 rounded-3xl border border-dashed border-border/60">
              <div className="max-w-2xl mx-auto text-center space-y-4">
                <div className="space-y-1">
                  <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground flex items-center justify-center gap-2">
                    <Radar className="h-4 w-4 text-secondary" /> Expandir Campanha
                  </h3>
                  <p className="text-[11px] text-muted-foreground italic">Encontre novos estabelecimentos na região para enviar seu script.</p>
                </div>
                <SearchForm
                  segment={campaign.business?.segment || ""}
                  campaignId={id}
                  isFloating={false}
                  currentPlan={campaign.business?.plan || 'free'}
                  discoveryState={campaign.discovery_state ?? null}
                />
              </div>
            </div>

            {/* Campaign Pipeline (Client Component) */}
            <CampaignLeadsList
              leads={leads || []}
              campaign={campaign}
              campaignId={id}
              currentPlan={campaign.business?.plan || "free"}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
