import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import DashboardContent from "@/components/DashboardContent";
import Sidebar from "@/components/Sidebar";
import { getPlanUsage, PlanType } from "@/utils/plan-limits";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: businesses } = await supabase
    .from("businesses")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1);

  const business = businesses?.[0];

  if (!business) {
    redirect("/onboarding");
  }

  const { data: leads } = await supabase
    .from("leads")
    .select("*")
    .eq("business_id", business.id)
    .order("created_at", { ascending: false })
    .limit(200);

  const { data: pipelineData } = await supabase.rpc('get_pipeline_stats', { p_business_id: business.id });

  const { data: recentActivity } = await supabase
    .from("leads")
    .select("id, name, score, status, metadata, updated_at")
    .eq("business_id", business.id)
    .not('updated_at', 'is', null)
    .order("updated_at", { ascending: false })
    .limit(5);

  const allLeads = leads?.map(l => ({
    id: l.id,
    name: l.name,
    lat: l.lat || 0,
    lng: l.lng || 0,
    score: l.score || 0,
    address: l.address || '',
    phone: l.phone || '',
    website: l.website || '',
    status: l.status || 'new',
    segment: l.segment || '',
    rating: l.metadata?.rating || null,
    reasoning: l.metadata?.reasoning || '',
    metadata: {
      reasoning: l.metadata?.reasoning || '',
      search_query: l.metadata?.search_query || l.segment || '',
      rating: l.metadata?.rating || null,
    },
  })) || [];

  const usage = await getPlanUsage(supabase, business.id, (business.plan || 'free') as PlanType);

  return (
    <div className="flex h-screen bg-muted/30">
      <Sidebar userEmail={user.email} usage={usage} />

      {/* Main */}
      <main className="flex-1 flex flex-col overflow-hidden pt-16 md:pt-0">
        <header className="h-14 bg-background border-b border-border/40 flex items-center justify-between px-3 sm:px-6">
          <div className="flex items-center gap-3">
            <h1 className="text-base sm:text-lg font-semibold">Dashboard</h1>
            <Badge variant="outline" className="hidden sm:inline-flex text-secondary border-secondary/30 bg-secondary/5 text-xs">
              {business.name}
            </Badge>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <span className="hidden md:inline text-sm text-muted-foreground">{user.email}</span>
            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-secondary/30 to-primary/30 border border-secondary/30 flex items-center justify-center text-xs font-bold text-secondary">
              {user.email?.[0].toUpperCase()}
            </div>
          </div>
        </header>

        <DashboardContent 
          leads={allLeads} 
          segment={business.segment || ''} 
          pipelineStats={pipelineData || {}}
          recentActivity={recentActivity || []}
          currentPlan={business.plan || 'free'}
        />
      </main>
    </div>
  );
}
