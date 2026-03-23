'use client'

import { useTransition } from 'react'
import { Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { generateAllAction } from "@/app/(dashboard)/campanhas/[id]/actions";

export default function BatchGenerateButton({ campaignId, pendingCount }: { campaignId: string, pendingCount: number }) {
  const [isPending, startTransition] = useTransition();

  if (pendingCount === 0) return null;

  return (
    <Button 
      size="sm" 
      variant="secondary" 
      className="gap-2 h-8 text-[11px] font-bold"
      disabled={isPending}
      onClick={() => {
        startTransition(async () => {
          await generateAllAction(campaignId);
        });
      }}
    >
      {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
      {isPending ? 'Gerando Scripts...' : `Gerar Mensagens para ${pendingCount} Leads`}
    </Button>
  );
}
