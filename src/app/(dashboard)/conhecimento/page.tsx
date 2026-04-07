import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import Sidebar from "@/components/Sidebar";
import MobileBottomNav from "@/components/MobileBottomNav";
import { getPlanUsage, PlanType } from "@/utils/plan-limits";
import BaseConhecimentoView from "./BaseConhecimentoView";

export const metadata: Metadata = {
  title: "Base de conhecimento",
  description:
    "Fontes gerais e perfis por campanha — o que a IA usa para qualificar leads e escrever mensagens.",
};

export default async function ConhecimentoPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

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

  const [{ data: knowledgeItems }, { data: knowledgeProfiles }] = await Promise.all([
    supabase
      .from("knowledge_bases")
      .select("id, type, source, ai_feedback, status, metadata")
      .eq("business_id", business.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("knowledge_profiles")
      .select("id, name, status, source_summary, ai_feedback, created_at")
      .eq("business_id", business.id)
      .order("created_at", { ascending: false }),
  ]);

  const usage = await getPlanUsage(supabase, business.id, plan);

  return (
    <div className="flex h-screen bg-muted/30 font-sans text-foreground overflow-hidden">
      <Sidebar userEmail={user.email} usage={usage} />

      <main className="flex-1 overflow-auto pb-20 md:pb-0">
        <BaseConhecimentoView
          businessId={business.id}
          plan={plan}
          knowledgeItems={knowledgeItems || []}
          initialProfiles={knowledgeProfiles || []}
        />
      </main>

      <MobileBottomNav />
    </div>
  );
}
