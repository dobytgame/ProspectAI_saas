'use client'

import { useState, useTransition } from 'react'
import { Sparkles, MessageCircle, Mail, Phone, Globe, CheckCircle2, AlertCircle, Loader2, Send, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LeadScoreDisplay } from "@/components/ui/ScoreBadge";
import Link from "next/link";
import { generateMessageAction, markAsContactedAction } from "@/app/(dashboard)/campanhas/[id]/actions";
import ExportMetaAudienceButton from "@/components/ExportMetaAudienceButton";

interface CampaignLeadsListProps {
  leads: any[];
  campaign: any;
  campaignId: string;
  currentPlan: string;
}

export default function CampaignLeadsList({ leads, campaign, campaignId, currentPlan }: CampaignLeadsListProps) {
  const [isGeneratingId, setIsGeneratingId] = useState<string | null>(null);
  const [copiedLeadId, setCopiedLeadId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleGenerate = (leadId: string) => {
    setIsGeneratingId(leadId);
    startTransition(async () => {
      await generateMessageAction(leadId, campaignId);
      setIsGeneratingId(null);
    });
  };

  const handleMarkContacted = (leadId: string) => {
    startTransition(async () => {
      await markAsContactedAction(leadId, campaignId);
    });
  };

  const handleCopyMessage = async (leadId: string, message: string) => {
    try {
      await navigator.clipboard.writeText(message);
      setCopiedLeadId(leadId);
      setTimeout(() => setCopiedLeadId((prev) => (prev === leadId ? null : prev)), 1800);
    } catch (error) {
      console.error("Erro ao copiar mensagem:", error);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 px-2 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
          <Send className="h-4 w-4" /> Pipeline de Abordagem
        </h2>
        <ExportMetaAudienceButton
          currentPlan={currentPlan}
          campaignId={campaignId}
          variant="secondary"
          className="shrink-0 border-primary/25 bg-primary/5 hover:bg-primary/10"
        />
      </div>
      
      <div className="grid grid-cols-1 gap-4">
        {leads.map((lead) => {
          const isThisGenerating = isGeneratingId === lead.id;
          
          return (
            <div key={lead.id} className="group bg-background rounded-2xl border border-border/50 shadow-sm hover:shadow-md transition-all overflow-hidden">
              <div className="flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-border/40">
                
                {/* Lead Info Sidebar (Left) */}
                <div className="w-full md:w-72 p-6 space-y-4 bg-muted/5 group-hover:bg-muted/10 transition-colors shrink-0">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-black text-base tracking-tight">{lead.name}</h4>
                      <LeadScoreDisplay
                        score={lead.score ?? 0}
                        tier={lead.metadata?.tier}
                        priority={lead.metadata?.priority}
                        reasoning={lead.metadata?.reasoning}
                        variant="compact"
                        className="shrink-0 max-w-[min(100%,11.5rem)]"
                      />
                    </div>
                    <div className="flex flex-wrap gap-2 pt-1">
                      {lead.phone && <span className="text-[10px] font-medium text-muted-foreground flex items-center gap-1"><Phone className="h-3 w-3" /> {lead.phone}</span>}
                      {lead.website && <a href={lead.website} target="_blank" rel="noreferrer" className="text-[10px] font-medium text-blue-500 hover:underline flex items-center gap-1"><Globe className="h-3 w-3" /> Site</a>}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className="text-[10px] text-muted-foreground leading-relaxed italic border-l-2 border-primary/20 pl-3">
                      &ldquo;{lead.metadata?.reasoning || 'Lead qualificado com base no ICP do negócio.'}&rdquo;
                    </p>
                    <div className="flex items-center gap-2 pt-1 border-t border-border/20 mt-3">
                      {lead.status === 'contacted' ? (
                        <Badge variant="outline" className="text-green-600 bg-green-50 font-bold border-green-200 gap-1 text-[10px]">
                          <CheckCircle2 className="h-3 w-3" /> Contatado
                        </Badge>
                      ) : lead.metadata?.generated_message ? (
                        <Badge variant="outline" className="text-secondary bg-secondary/5 font-bold border-secondary/20 gap-1 text-[10px]">
                          <Sparkles className="h-3 w-3" /> Pronto para envio
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-muted-foreground bg-muted font-bold border-none gap-1 text-[10px]">
                          <AlertCircle className="h-3 w-3" /> {isThisGenerating ? 'Processando...' : 'Pendente Script'}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>

                {/* Outreach Message Editor (Right) */}
                <div className="flex-1 p-6 relative">
                  {lead.metadata?.generated_message && !isThisGenerating ? (
                    <div className="h-full flex flex-col">
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-secondary flex items-center gap-1.5">
                          <Sparkles className="h-3.5 w-3.5" /> Script Sugerido pela IA
                        </p>
                        <div className="flex items-center gap-1">
                          <Button
                            onClick={() => handleCopyMessage(lead.id, lead.metadata.generated_message)}
                            variant="ghost"
                            size="sm"
                            className="h-6 text-[10px] px-2 text-muted-foreground hover:text-secondary hover:bg-secondary/5 gap-1.5"
                          >
                            {copiedLeadId === lead.id ? (
                              <>
                                <Check className="h-3 w-3 text-green-600" />
                                Copiado
                              </>
                            ) : (
                              <>
                                <Copy className="h-3 w-3" />
                                Copiar
                              </>
                            )}
                          </Button>
                          <Button 
                            onClick={() => handleGenerate(lead.id)}
                            disabled={isThisGenerating}
                            variant="ghost" 
                            size="sm" 
                            className="h-6 text-[10px] px-2 text-muted-foreground hover:text-secondary hover:bg-secondary/5 gap-1.5"
                          >
                            {isThisGenerating ? <Loader2 className="h-3 w-3 animate-spin"/> : <Sparkles className="h-3 w-3" />} 
                            Regenerar
                          </Button>
                        </div>
                      </div>
                      <div className="flex-1 bg-muted/20 border border-border/30 rounded-xl p-4 text-sm leading-relaxed text-foreground/80 font-medium whitespace-pre-wrap">
                        {lead.metadata.generated_message}
                      </div>
                      <div className="mt-4 flex flex-wrap gap-2 items-center">
                        {campaign.channel === 'whatsapp' ? (
                          <div className="flex items-center gap-2">
                            <Link 
                                href={`https://wa.me/${lead.phone?.replace(/\D/g, '')}?text=${encodeURIComponent(lead.metadata.generated_message)}`} 
                                target="_blank"
                                onClick={() => handleMarkContacted(lead.id)}
                            >
                              <Button size="sm" className="bg-green-600 hover:bg-green-700 shadow-sm gap-2 h-9 text-[11px] font-black">
                                <MessageCircle className="h-4 w-4" /> Enviar para WhatsApp
                              </Button>
                            </Link>
                          </div>
                        ) : (
                          <Button size="sm" className="bg-blue-600 hover:bg-blue-700 shadow-sm gap-2 h-9 text-[11px] font-black">
                            <Mail className="h-4 w-4" /> Enviar p/ Email
                          </Button>
                        )}
                        
                        {lead.status !== 'contacted' && (
                          <Button 
                            onClick={() => handleMarkContacted(lead.id)}
                            variant="ghost" 
                            size="sm" 
                            className="h-9 text-[10px] hover:text-green-600 hover:bg-green-50"
                          >
                            Marcar como Contatado s/ Enviar
                          </Button>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="h-full min-h-[160px] flex flex-col items-center justify-center text-center space-y-4">
                      <div className={`p-4 rounded-full ${isThisGenerating ? 'bg-secondary/20 scale-110' : 'bg-secondary/5'} border border-dashed border-secondary/30 transition-all duration-500`}>
                        {isThisGenerating ? (
                          <Loader2 className="h-8 w-8 text-secondary animate-spin" />
                        ) : (
                          <Sparkles className="h-8 w-8 text-secondary/40 animate-pulse" />
                        )}
                      </div>
                      <div className="space-y-1">
                        <h5 className="text-sm font-bold">
                          {isThisGenerating ? 'IA está escrevendo sua proposta...' : 'Otimize sua abordagem com IA'}
                        </h5>
                        <p className="text-[11px] text-muted-foreground italic">
                          {isThisGenerating ? 'Analisando os pontos fortes do lead e criando o roteiro...' : 'Analise os pontos fortes do lead e gere um script personalizado.'}
                        </p>
                      </div>
                      <Button 
                        onClick={() => handleGenerate(lead.id)}
                        disabled={isThisGenerating}
                        variant="secondary" 
                        size="sm" 
                        className="gap-2 h-9 shadow-sm px-6 font-bold text-[11px]"
                      >
                        {isThisGenerating ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Sparkles className="h-3.5 w-3.5" />
                        )} 
                        {isThisGenerating ? 'Processando...' : 'Gerar Proposta Personalizada'}
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {leads.length === 0 && (
          <div className="py-24 flex flex-col items-center justify-center text-center bg-background rounded-3xl border-2 border-dashed border-border/40">
            <div className="p-4 rounded-full bg-muted mb-4">
              <AlertCircle className="h-10 w-10 text-muted-foreground/30" />
            </div>
            <h3 className="text-lg font-bold">Inicie sua prospecção acima</h3>
            <p className="text-sm text-muted-foreground max-w-xs mt-2">
              Use o formulário de busca para encontrar leads qualificados para esta campanha.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
