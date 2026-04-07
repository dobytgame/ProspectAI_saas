import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import MobileBottomNav from "@/components/MobileBottomNav";
import { getPlanUsage, PlanType } from "@/utils/plan-limits";
import LeadsTable from "@/components/LeadsTable";
import { Badge } from "@/components/ui/badge";
import { Users } from "lucide-react";

export default async function LeadsPage() {
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

  const usage = await getPlanUsage(supabase, business.id, (business.plan || 'free') as PlanType);

  return (
    <div className="flex h-screen bg-muted/30">
      <Sidebar userEmail={user.email} usage={usage} />

      {/* Main */}
      <main className="flex-1 flex flex-col overflow-hidden pb-20 md:pb-0">
        <header className="h-14 bg-background border-b border-border/40 flex items-center justify-between px-3 sm:px-6 shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-secondary/10 flex items-center justify-center">
              <Users className="h-4 w-4 text-secondary" />
            </div>
            <h1 className="text-base sm:text-lg font-bold">Gestão de Leads</h1>
            <Badge variant="outline" className="hidden sm:inline-flex text-secondary border-secondary/30 bg-secondary/5 text-[10px] font-black uppercase tracking-widest">
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

        <div className="flex-1 overflow-auto p-3 sm:p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            <div className="flex flex-col space-y-1">
              <h2 className="text-2xl font-black tracking-tight text-foreground">Explorar Base</h2>
              <p className="text-sm text-muted-foreground font-medium">
                Visualize, filtre e gerencie todos os leads prospectados pelo Capturo AI.
              </p>
            </div>
            
            <LeadsTable currentPlan={business.plan || "free"} />
          </div>
        </div>
      </main>
      <MobileBottomNav />
    </div>
  );
}
