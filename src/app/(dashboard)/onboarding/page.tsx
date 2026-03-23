'use client'

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Zap, Sparkles, Building2, Globe, FileText, Loader2 } from "lucide-react";
import { onboardBusiness } from "./actions";

export default function OnboardingPage() {
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    setIsLoading(true);
    // Let the standard form action handle it, but we can show loading
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 px-4 py-12 lg:py-24">
      <div className="w-full max-w-3xl space-y-8">
        <div className="flex flex-col items-center text-center space-y-2">
          <div className="h-12 w-12 rounded-xl bg-primary flex items-center justify-center shadow-lg">
            <Zap className="h-8 w-8 fill-secondary text-secondary" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Personalize seu Agente</h1>
          <p className="text-muted-foreground max-w-md">
            Escolha como prefere nos dar contexto sobre sua empresa. O treinamento leva menos de 1 minuto.
          </p>
        </div>

        <Card className="shadow-xl border-border/50 bg-background/80 backdrop-blur-sm overflow-hidden">
          <div className="h-2 bg-gradient-to-r from-primary via-secondary to-accent" />
          <CardHeader className="pb-4">
            <CardTitle className="text-xl flex items-center gap-2">
              <Building2 className="h-5 w-5 text-secondary" />
              Fonte de Dados
            </CardTitle>
            <CardDescription>
              A IA analisará esses dados para entender seu Tom de Voz e ICP.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form action={onboardBusiness} onSubmit={() => setIsLoading(true)} className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome da Empresa</Label>
                  <Input 
                    id="name" 
                    name="name" 
                    placeholder="Ex: Agência Digital Prospect" 
                    required 
                    className="bg-background/50 h-11"
                  />
                </div>

                <Tabs defaultValue="description" className="w-full">
                  <TabsList className="grid w-full grid-cols-3 bg-muted/50 p-1 h-12">
                    <TabsTrigger value="description" className="data-[state=active]:bg-background data-[state=active]:shadow-sm">
                      <Sparkles className="h-4 w-4 mr-2" /> Descrição
                    </TabsTrigger>
                    <TabsTrigger value="website" className="data-[state=active]:bg-background data-[state=active]:shadow-sm">
                      <Globe className="h-4 w-4 mr-2" /> Website
                    </TabsTrigger>
                    <TabsTrigger value="document" className="data-[state=active]:bg-background data-[state=active]:shadow-sm">
                      <FileText className="h-4 w-4 mr-2" /> Documento
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="description" className="space-y-4 pt-4 animate-in fade-in transition-all">
                    <div className="space-y-2">
                      <Label htmlFor="description">Descrição detalhada</Label>
                      <Textarea 
                        id="description" 
                        name="description" 
                        placeholder="Descreva o que seu negócio faz, seus produtos e clientes..."
                        className="min-h-[150px] bg-background/50 resize-none border-border/60"
                      />
                    </div>
                  </TabsContent>

                  <TabsContent value="website" className="space-y-4 pt-4 animate-in fade-in transition-all">
                    <div className="space-y-2">
                      <Label htmlFor="website">Link do Site</Label>
                      <Input 
                        id="website" 
                        name="website_url" 
                        type="url"
                        placeholder="https://seu-site.com.br" 
                        className="bg-background/50 h-11"
                      />
                      <p className="text-[10px] text-muted-foreground italic">
                        Nossa IA irá visitar o site para extrair informações automaticamente.
                      </p>
                    </div>
                  </TabsContent>

                  <TabsContent value="document" className="space-y-4 pt-4 animate-in fade-in transition-all">
                    <div className="space-y-2">
                      <Label htmlFor="file">Enviar Arquivo (PDF/TXT)</Label>
                      <div className="border-2 border-dashed border-border/60 rounded-lg p-8 text-center bg-muted/10 hover:bg-muted/20 transition-colors cursor-pointer relative">
                        <input 
                          type="file" 
                          id="file" 
                          name="file" 
                          className="absolute inset-0 opacity-0 cursor-pointer"
                          accept=".pdf,.txt"
                        />
                        <FileText className="h-8 w-8 mx-auto text-muted-foreground/50 mb-2" />
                        <p className="text-sm text-muted-foreground">Clique para fazer upload ou arraste o arquivo aqui</p>
                        <p className="text-[10px] text-muted-foreground mt-1">Limite: 5MB</p>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </div>

              <div className="pt-4">
                <Button 
                  type="submit" 
                  disabled={isLoading}
                  className="w-full bg-primary hover:bg-primary/90 text-white h-12 text-lg shadow-lg"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Treinando IA...
                    </>
                  ) : (
                    "Finalizar Configuração & Treinar IA"
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <div className="flex justify-center gap-8 text-[10px] text-muted-foreground grayscale opacity-40 uppercase tracking-widest font-bold">
          <div className="flex items-center gap-1.5">
            <div className="h-1.5 w-1.5 rounded-full bg-secondary shadow-[0_0_8px_rgba(0,153,179,0.5)]" />
            Configuração
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-1.5 w-1.5 rounded-full bg-muted-foreground" />
            Treinamento
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-1.5 w-1.5 rounded-full bg-muted-foreground" />
            Lançamento
          </div>
        </div>
      </div>
    </div>
  );
}
