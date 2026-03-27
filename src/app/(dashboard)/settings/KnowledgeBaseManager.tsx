'use client'

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Globe, FileText, Sparkles, Loader2, CheckCircle2, Trash2, BrainCircuit } from "lucide-react";
import { removeKnowledgeBaseItem } from "./actions";

export default function KnowledgeBaseManager({ businessId, initialItems }: { businessId: string, initialItems: any[] }) {
  const [urlInput, setUrlInput] = useState("");
  const [fileInput, setFileInput] = useState<File | null>(null);
  const [kbItems, setKbItems] = useState<any[]>(initialItems || []);
  const [processingItems, setProcessingItems] = useState<string[]>([]);
  const [isSynthesizing, setIsSynthesizing] = useState(false);

  const handleAddKB = async (type: 'url' | 'file') => {
    if (!businessId) return;
    if (type === 'url' && !urlInput.trim()) return;
    if (type === 'file' && !fileInput) return;

    const sourceName = type === 'url' ? urlInput : fileInput!.name;
    const processId = Date.now().toString();
    
    setProcessingItems(prev => [...prev, processId]);
    
    const formData = new FormData();
    formData.append("business_id", businessId);
    formData.append("type", type);
    if (type === 'url') formData.append("url", urlInput);
    if (type === 'file') formData.append("file", fileInput as Blob);

    if (type === 'url') setUrlInput("");
    if (type === 'file') setFileInput(null);

    try {
      const resp = await fetch("/api/knowledge/add", {
        method: "POST",
        body: formData,
      });

      const data = await resp.json();
      setProcessingItems(prev => prev.filter(p => p !== processId));

      if (data.success) {
        setKbItems(prev => [data.record, ...prev]);
      } else {
        alert(data.error || "Erro ao processar fonte.");
      }
    } catch (err) {
      setProcessingItems(prev => prev.filter(p => p !== processId));
      alert("Falha de rede ao tentar processar conhecimento.");
    }
  };

  const handleSynthesize = async () => {
    if (!businessId) return;
    setIsSynthesizing(true);
    
    try {
      const resp = await fetch("/api/knowledge/synthesize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ business_id: businessId })
      });

      const data = await resp.json();
      setIsSynthesizing(false);
      
      if (data.success) {
        // We can reload the page to get the updated ICP in the parent or just show a success message
        window.location.reload();
      } else {
        alert(data.error || "Erro ao sintetizar conhecimento.");
      }
    } catch (err) {
      setIsSynthesizing(false);
      alert("Falha na síntese. Tente novamente.");
    }
  };

  const handleDelete = async (id: string) => {
    const success = await removeKnowledgeBaseItem(id, businessId);
    if (success) {
      setKbItems(prev => prev.filter(item => item.id !== id));
    } else {
      alert("Erro ao remover item.");
    }
  };

  return (
    <div className="space-y-8 mt-8 border-t border-border/40 pt-8 relative">
      <div>
        <h3 className="text-xl font-black text-primary flex items-center gap-2 uppercase tracking-wide">
          <BrainCircuit className="h-5 w-5" /> Base de Conhecimento Ativa
        </h3>
        <p className="text-xs text-muted-foreground font-medium mt-1">
          Adicione materiais para enriquecer a inteligência do Agente e depois clique em Retreinar.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* URL Input */}
        <div className="space-y-3 bg-muted/20 p-5 rounded-2xl border border-border/40">
          <Label className="flex items-center gap-2 text-xs uppercase font-black tracking-widest text-primary">
            <Globe className="h-4 w-4" /> Link do Site
          </Label>
          <div className="flex gap-2">
            <Input 
              type="url"
              placeholder="https://seu-site.com" 
              value={urlInput}
              onChange={e => setUrlInput(e.target.value)}
              className="bg-background/50 border-border/40 h-11 rounded-lg font-medium"
            />
            <Button 
              type="button" 
              onClick={() => handleAddKB('url')}
              disabled={!urlInput.trim() || processingItems.length > 0}
              className="h-11 bg-primary hover:bg-primary/90 text-black font-black rounded-lg px-4"
            >
              Ler
            </Button>
          </div>
        </div>

        {/* File Input */}
        <div className="space-y-3 bg-muted/20 p-5 rounded-2xl border border-border/40">
          <Label className="flex items-center gap-2 text-xs uppercase font-black tracking-widest text-primary">
            <FileText className="h-4 w-4" /> Enviar PDF/Doc
          </Label>
          <div className="flex gap-2 items-center">
            <Input 
              type="file" 
              accept=".pdf,.txt,.doc,.docx"
              onChange={e => setFileInput(e.target.files?.[0] || null)}
              className="bg-background/50 border-border/40 h-11 rounded-lg file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-xs file:font-bold file:bg-primary/20 file:text-primary hover:file:bg-primary/30 cursor-pointer w-full text-xs"
            />
            <Button 
              type="button"
              onClick={() => handleAddKB('file')}
              disabled={!fileInput || processingItems.length > 0}
              className="h-11 bg-primary hover:bg-primary/90 text-black font-black rounded-lg px-4"
            >
              Analisar
            </Button>
          </div>
        </div>
      </div>

      {/* Lista de Itens */}
      <div className="space-y-3 max-h-80 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-muted-foreground/20">
        {processingItems.map((pi, idx) => (
          <div key={'proc-'+idx} className="flex gap-4 p-4 rounded-xl border border-primary/20 bg-primary/5 animate-pulse">
            <Loader2 className="h-6 w-6 text-primary animate-spin shrink-0" />
            <div className="space-y-1">
              <p className="text-sm font-bold text-primary">A IA está processando e lendo a fonte...</p>
            </div>
          </div>
        ))}
        
        {kbItems.map((item, idx) => (
          <div key={item.id || idx} className="flex gap-4 p-4 rounded-xl border border-border/40 bg-muted/20 hover:bg-muted/30 transition-colors group">
            <div className="mt-1 shrink-0">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
            </div>
            <div className="space-y-2 w-full pr-10 relative">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black tracking-wider text-muted-foreground uppercase">{item.type} • {String(item.source).substring(0,40)}</span>
              </div>
              <p className="text-sm font-medium text-foreground leading-relaxed italic border-l-2 border-primary/50 pl-3">"{item.ai_feedback}"</p>
              
              <button 
                type="button"
                onClick={() => handleDelete(item.id)}
                className="absolute right-0 top-0 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 p-2 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                title="Remover fonte e aprendizado"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
        {kbItems.length === 0 && processingItems.length === 0 && (
          <p className="text-sm text-center font-bold text-muted-foreground py-6">Nenhum aprendizado na base conectada.</p>
        )}
      </div>

      {/* Retreinar Agente Button */}
      {kbItems.length > 0 && (
        <div className="flex justify-end pt-4">
          <Button 
            type="button"
            onClick={handleSynthesize}
            disabled={isSynthesizing || processingItems.length > 0}
            className="h-12 bg-secondary hover:bg-secondary/90 text-white gap-3 px-8 rounded-xl font-black shadow-xl transition-all"
          >
            {isSynthesizing ? <Loader2 className="h-5 w-5 animate-spin" /> : <Sparkles className="h-5 w-5" />}
            {isSynthesizing ? "TREINANDO..." : "SINTETIZAR & ATUALIZAR ICP"}
          </Button>
        </div>
      )}
    </div>
  );
}
