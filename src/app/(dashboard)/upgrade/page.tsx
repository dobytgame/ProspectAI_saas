import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import PricingGrid from "@/components/PricingGrid";

export default async function UpgradePage() {
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

  return (
    <div className="flex h-screen bg-muted/30 font-sans text-foreground">
      <Sidebar userEmail={user.email} />

      <main className="flex-1 overflow-auto p-8 lg:p-12">
        <div className="max-w-7xl mx-auto space-y-12">
          
          <div className="text-center space-y-4">
            <h1 className="text-4xl lg:text-5xl font-black tracking-tight">
              Escolha o plano ideal para sua <span className="text-primary">escala</span>
            </h1>
            <p className="text-muted-foreground text-lg max-w-3xl mx-auto">
              Seja você um consultor iniciante ou uma agência de alto desempenho, o Capturo tem as ferramentas necessárias para automatizar suas vendas.
            </p>
          </div>

          <PricingGrid currentPlan={business.plan || 'free'} />

          <div className="bg-background/50 border border-border/50 rounded-3xl p-8 text-center max-w-3xl mx-auto">
            <h3 className="text-xl font-bold mb-2">Precisa de algo sob medida?</h3>
            <p className="text-muted-foreground mb-6">
              Para operações com mais de 50.000 leads/mês ou necessidades específicas de integração via API privada.
            </p>
            <a 
              href="https://wa.me/seu-numero" 
              target="_blank" 
              className="text-primary font-bold hover:underline"
            >
              Falar com um Consultor de Vendas →
            </a>
          </div>

        </div>
      </main>
    </div>
  )
}
