'use client'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import PricingGrid from "./PricingGrid"
import { Zap } from "lucide-react"

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  currentPlan: string;
}

export default function UpgradeModal({ 
  isOpen, 
  onClose, 
  title = "Limite de Plano Atingido", 
  description = "Você atingiu o limite do seu plano atual. Faça o upgrade para continuar escalando sua prospecção.",
  currentPlan
}: UpgradeModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto p-0 border-none bg-transparent shadow-none">
        <div className="bg-background rounded-[2rem] border border-border/40 overflow-hidden shadow-2xl">
          <div className="bg-primary/5 p-8 border-b border-border/40 flex items-center gap-4">
            <div className="bg-primary/20 p-3 rounded-2xl">
              <Zap className="h-6 w-6 text-primary shadow-[0_0_15px_rgba(0,229,255,0.4)]" />
            </div>
            <div>
              <DialogTitle className="text-2xl font-black">{title}</DialogTitle>
              <DialogDescription className="text-muted-foreground mt-1">
                {description}
              </DialogDescription>
            </div>
          </div>
          
          <div className="p-8">
            <PricingGrid currentPlan={currentPlan} />
          </div>
          
          <div className="bg-muted/30 p-4 border-t border-border/40 text-center">
            <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">
              Pagamento Seguro via Stripe • Cancelamento Instantâneo
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
