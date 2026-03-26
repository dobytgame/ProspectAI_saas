import Link from "next/link";
import { Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signup } from "@/app/(auth)/actions";

export default function SignupPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 px-4 py-12">
      <Card className="w-full max-w-md shadow-lg border-border/50 bg-background/80 backdrop-blur-sm">
        <CardHeader className="space-y-1 flex flex-col items-center">
          <Link href="/" className="transition-transform hover:scale-105 mb-2">
            <img src="/capturo.png" alt="Capturo Logo" className="h-10 w-auto object-contain" />
          </Link>
          <CardTitle className="text-2xl font-bold tracking-tight">Crie sua conta</CardTitle>
          <CardDescription>
            Comece a prospectar de forma inteligente hoje mesmo
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form className="space-y-4" action={signup}>
            <div className="space-y-2">
              <Label htmlFor="name">Nome Completo</Label>
              <Input id="name" name="name" placeholder="João Silva" required className="bg-background/50" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input id="email" name="email" type="email" placeholder="nome@exemplo.com" required className="bg-background/50" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input id="password" name="password" type="password" required className="bg-background/50" />
            </div>
            <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-white h-11">
              Criar conta
            </Button>
          </form>
          
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">Ou cadastre-se com</span>
            </div>
          </div>
          
          <Button variant="outline" type="button" className="w-full h-11 border-border/50 hover:bg-muted">
            <svg className="mr-2 h-4 w-4" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512">
              <path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"></path>
            </svg>
            Google
          </Button>
        </CardContent>
        <CardFooter className="flex flex-wrap items-center justify-center gap-1 text-sm text-muted-foreground border-t border-border/40 py-4">
          Já tem uma conta?{" "}
          <Link href="/login" className="font-semibold text-secondary hover:underline underline-offset-4">
            Entrar
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}
