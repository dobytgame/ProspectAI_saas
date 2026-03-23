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

export default async function PipelinePage() {
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
    .select("*")
    .eq("business_id", business.id)
    .order("score", { ascending: false });

  const kanbanLeads = leads?.map(l => ({
    id: l.id,
    name: l.name,
    status: l.status || 'new',
    score: l.score || 0
  })) || [];

  return (
    <div className="flex h-screen bg-muted/30">
      <Sidebar userEmail={user.email} />

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-background border-b border-border/40 flex items-center justify-between px-8 shrink-0">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold">Pipeline de Vendas</h1>
            <Badge variant="outline" className="text-secondary border-secondary/30 bg-secondary/5">
              {business.name}
            </Badge>
          </div>
        </header>

        <div className="flex-1 overflow-x-auto p-8 bg-muted/30">
          <KanbanBoard initialLeads={kanbanLeads} onStatusChange={updateLeadStatus} />
        </div>
      </main>
    </div>
  );
}
