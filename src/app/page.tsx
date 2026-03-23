import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, MapPin, Zap, MessageSquare, BarChart3 } from "lucide-react";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="px-4 lg:px-6 h-16 flex items-center border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="flex items-center gap-2 font-bold text-xl text-primary">
          <Zap className="h-6 w-6 fill-secondary text-secondary" />
          <span>ProspectAI</span>
        </div>
        <nav className="ml-auto flex gap-4 sm:gap-6 items-center">
          <a className="text-sm font-medium hover:text-secondary transition-colors" href="#">Funcionalidades</a>
          <a className="text-sm font-medium hover:text-secondary transition-colors" href="#">Preços</a>
          <Link href="/login">
            <Button variant="default" size="sm" className="bg-primary hover:bg-primary/90">Acessar App</Button>
          </Link>
        </nav>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-secondary/10 via-background to-background">
          <div className="container px-4 md:px-6 mx-auto">
            <div className="flex flex-col items-center space-y-4 text-center">
              <div className="space-y-2">
                <Badge variant="outline" className="px-3 py-1 border-secondary/30 text-secondary bg-secondary/5 mb-4">
                  Inteligência Artificial & Google Maps
                </Badge>
                <h1 className="text-4xl font-extrabold tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl/none max-w-3xl mx-auto">
                  Encontre e aborde leads <span className="text-secondary">qualificados</span> em segundos.
                </h1>
                <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl dark:text-gray-400 mt-6">
                  O ProspectAI utiliza IA de ponta para buscar estabelecimentos, qualificar o ICP e automatizar a abordagem via WhatsApp e E-mail.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-4 mt-8">
                <Link href="/signup">
                  <Button size="lg" className="bg-primary text-white h-12 px-8 text-lg hover:scale-105 transition-transform">
                    Começar agora <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Button variant="outline" size="lg" className="h-12 px-8 text-lg border-border hover:bg-muted">
                  Ver Demonstração
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Features Preview */}
        <section className="w-full py-12 md:py-24 lg:py-32 bg-muted/30">
          <div className="container px-4 md:px-6 mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="border-border/50 bg-background/50 backdrop-blur-sm hover:shadow-lg transition-all border shadow-sm">
                <CardHeader>
                  <MapPin className="h-10 w-10 text-secondary mb-2" />
                  <CardTitle>Busca Geográfica</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">Localize prospects diretamente no Google Maps com filtros avançados por nicho e região.</p>
                </CardContent>
              </Card>
              <Card className="border-border/50 bg-background/50 backdrop-blur-sm hover:shadow-lg transition-all border shadow-sm">
                <CardHeader>
                  <Zap className="h-10 w-10 text-accent mb-2" />
                  <CardTitle>Qualificação IA</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">Nossa IA analisa a presença digital e dá um score de 0-100 para cada lead encontrado.</p>
                </CardContent>
              </Card>
              <Card className="border-border/50 bg-background/50 backdrop-blur-sm hover:shadow-lg transition-all border shadow-sm">
                <CardHeader>
                  <MessageSquare className="h-10 w-10 text-highlight mb-2 text-purple-600" />
                  <CardTitle>Abordagem</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">Mensagens hiper-personalizadas geradas pelo Claude e enviadas via WhatsApp automaticamente.</p>
                </CardContent>
              </Card>
              <Card className="border-border/50 bg-background/50 backdrop-blur-sm hover:shadow-lg transition-all border shadow-sm">
                <CardHeader>
                  <BarChart3 className="h-10 w-10 text-primary mb-2" />
                  <CardTitle>Pipeline Kanban</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">Acompanhe cada etapa da negociação em um CRM visual integrado e intuitivo.</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      </main>

      <footer className="flex flex-col gap-2 sm:flex-row py-6 w-full shrink-0 items-center px-4 md:px-6 border-t border-border/40">
        <p className="text-xs text-muted-foreground">© 2024 ProspectAI Inc. Todos os direitos reservados.</p>
        <nav className="sm:ml-auto flex gap-4 sm:gap-6">
          <a className="text-xs hover:underline underline-offset-4" href="#">Termos de Serviço</a>
          <a className="text-xs hover:underline underline-offset-4" href="#">Privacidade</a>
        </nav>
      </footer>
    </div>
  );
}
