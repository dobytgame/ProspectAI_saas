import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import UpgradeClientButton from "@/components/UpgradeClientButton";
import { CheckCircle2, ShieldCheck } from "lucide-react";

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

  const isPro = business.plan === 'pro';

  return (
    <div className="flex h-screen bg-muted/30 font-sans text-foreground">
      <Sidebar userEmail={user.email} />

      <main className="flex-1 overflow-auto p-12 flex flex-col items-center justify-center">
        <div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          
          {/* Text/Copy */}
          <div className="space-y-6">
            <h1 className="text-4xl font-extrabold tracking-tight">
              Acelere suas vendas com o <span className="text-primary">Capturo Pro</span>
            </h1>
            <p className="text-muted-foreground text-lg leading-relaxed">
              Você atingiu o limite do plano gratuito. Faça o upgrade agora para desbloquear todo o potencial do seu agente de vendas com IA e decolar seus resultados.
            </p>

            <ul className="space-y-4 mt-8 bg-background p-6 rounded-2xl border border-border/50">
              <li className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
                <span className="font-medium">Campanhas de Prospecção Ilimitadas</span>
              </li>
              <li className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
                <span className="font-medium">Mapeamento de até 2.000 Leads</span>
              </li>
              <li className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
                <span className="font-medium">Mensagens Geradas por IA Premium</span>
              </li>
              <li className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
                <span className="font-medium">Suporte Prioritário VIP</span>
              </li>
            </ul>
          </div>

          {/* Pricing Card */}
          <div className="bg-background border border-border/50 rounded-3xl p-8 shadow-2xl relative overflow-hidden flex flex-col items-center text-center">
            <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-[10px] font-bold px-3 py-1 rounded-bl-xl uppercase tracking-wider">
              Mais popular
            </div>

            <div className="mb-6 w-full">
              <h3 className="text-xl font-bold uppercase tracking-widest text-muted-foreground mb-4">Plano Pro</h3>
              <div className="mt-4 flex items-baseline justify-center text-6xl font-extrabold">
                R$ 97
                <span className="ml-1 text-xl font-medium text-muted-foreground">/mês</span>
              </div>
            </div>

            <div className="w-full space-y-4">
              <UpgradeClientButton isPro={isPro} />
              <p className="text-[11px] text-muted-foreground flex items-center justify-center gap-1.5 mt-4">
                <ShieldCheck className="h-3.5 w-3.5" /> Pagamento 100% seguro via Stripe
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
