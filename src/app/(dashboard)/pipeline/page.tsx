import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import KanbanBoard from "@/components/KanbanBoard";
import { updateLeadStatus } from "./actions";
import { Zap, LayoutDashboard, Users, MessageSquare, Settings, LogOut, Columns3 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { signOut } from "@/app/(auth)/actions";
import Sidebar from "@/components/Sidebar";
import LeadMap from "@/components/LeadMap";
import SearchForm from "@/components/SearchForm";
import { Globe } from "lucide-react";
import { getPlanUsage, PlanType } from "@/utils/plan-limits";

export default async function PipelinePage({ searchParams }: { searchParams: Promise<{ view?: string }> }) {
  const { view = 'kanban' } = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: business } = await supabase
    .from("businesses")
    .select("*")
    .eq("user_id", user.id)
    .single();

  if (!business) redirect("/onboarding");

  const { data: leads } = await supabase
    .from("leads")
    .select("id, name, status, score, phone, website, address, segment, metadata, updated_at, campaign_id, lat, lng, campaigns(name)")
    .eq("business_id", business.id)
    .order("score", { ascending: false });

  const kanbanLeads = leads?.map(l => ({
    id: l.id,
    name: l.name,
    status: l.status || 'new',
    score: l.score || 0,
    phone: l.phone,
    website: l.website,
    address: l.address,
    segment: l.segment,
    campaign_id: l.campaign_id,
    campaign_name: (l.campaigns as any)?.name || 'Sem Campanha',
    metadata: l.metadata,
    updated_at: l.updated_at,
    lat: l.lat,
    lng: l.lng
  })) || [];

  const usage = await getPlanUsage(supabase, business.id, (business.plan || 'free') as PlanType);

  return (
    <div className="flex h-screen bg-muted/30">
      <Sidebar userEmail={user.email} usage={usage} />

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-14 bg-background border-b border-border/40 flex items-center justify-between px-6 shrink-0">
          <div className="flex items-center gap-4 text-sm font-medium">
            <h1 className="text-base font-bold text-foreground tracking-tight underline decoration-primary/40 decoration-2 underline-offset-4">Pipeline de Leads</h1>
            <div className="flex bg-muted/40 p-1 rounded-xl border border-border/40 ml-2">
              <Link href="/pipeline?view=kanban">
                <Button variant={view === 'kanban' ? "secondary" : "ghost"} size="sm" className="h-7 text-[11px] font-bold gap-1.5 px-3 rounded-lg">
                  <Columns3 className="h-3.5 w-3.5" /> Quadro
                </Button>
              </Link>
              <Link href="/pipeline?view=map">
                <Button variant={view === 'map' ? "secondary" : "ghost"} size="sm" className="h-7 text-[11px] font-bold gap-1.5 px-3 rounded-lg">
                  <Globe className="h-3.5 w-3.5" /> Mapa
                </Button>
              </Link>
            </div>
          </div>

          <div className="flex items-center gap-4 text-[11px] font-black uppercase tracking-widest">
            <span className="flex items-center gap-1.5 text-muted-foreground"><Users className="h-3.5 w-3.5" /> {kanbanLeads.length} Total</span>
            <span className="flex items-center gap-1.5 text-secondary"><Zap className="h-3.5 w-3.5" /> {kanbanLeads.filter((l: any) => l.status === 'closed').length} Ganhos</span>
          </div>
        </header>

        <div className="flex-1 overflow-hidden p-6 relative">
          {view === 'map' ? (
            <div className="h-full rounded-2xl overflow-hidden border border-border/40 relative shadow-2xl">
              <SearchForm segment={business.segment || ""} currentPlan={business.plan || 'free'} />
              <LeadMap leads={kanbanLeads} />
            </div>
          ) : (
            <KanbanBoard 
              initialLeads={kanbanLeads} 
              onStatusChange={updateLeadStatus} 
              plan={(business.plan || 'free') as PlanType}
            />
          )}
        </div>
      </main>
    </div>
  );
}
