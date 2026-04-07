import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { MessageSquare } from "lucide-react";
import Sidebar from "@/components/Sidebar";
import MobileBottomNav from "@/components/MobileBottomNav";
import CreateCampaignDialog from "@/components/campaigns/CreateCampaignDialog";
import CampaignCard from "@/components/campaigns/CampaignCard";
import { getPlanUsage, PlanType, PLAN_LIMITS } from "@/utils/plan-limits";

export default async function CampaignsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: business } = await supabase
    .from("businesses")
    .select("id, plan")
    .eq("user_id", user.id)
    .single();

  if (!business) {
    redirect("/onboarding");
  }

  const plan = (business.plan || "free") as PlanType;
  const usage = await getPlanUsage(supabase, business.id, plan);

  const { data: completedKnowledgeProfiles } = await supabase
    .from("knowledge_profiles")
    .select("id, name")
    .eq("business_id", business.id)
    .eq("status", "completed")
    .order("created_at", { ascending: false });

  const { data: campaigns } = await supabase
    .from("campaigns")
    .select("*, leads:leads(count)")
    .eq("business_id", business.id)
    .order("created_at", { ascending: false });

  const atCampaignLimit =
    (campaigns?.length ?? 0) >= PLAN_LIMITS[plan].maxCampaigns;

  return (
    <div className="flex h-screen bg-muted/30 font-sans text-foreground">
      <Sidebar userEmail={user.email} usage={usage} />

      {/* Main */}
      <main className="flex-1 flex flex-col overflow-hidden pb-20 md:pb-0">
        <header className="h-14 bg-background border-b border-border/40 flex items-center justify-between px-3 sm:px-6 shrink-0 gap-3">
          <h1 className="text-base sm:text-lg font-semibold truncate">Campanhas de Prospecção</h1>
          <CreateCampaignDialog
            currentPlan={plan}
            atCampaignLimit={atCampaignLimit}
            knowledgeProfiles={completedKnowledgeProfiles || []}
          />
        </header>

        <div className="flex-1 overflow-auto p-3 sm:p-6 md:p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {campaigns?.map((campaign) => (
              <CampaignCard key={campaign.id} campaign={campaign} />
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
      <MobileBottomNav />
    </div>
  );
}
