'use client'

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Zap, LayoutDashboard, Columns3, MessageSquare, Settings, LogOut } from "lucide-react";
import { signOut } from "@/app/(auth)/actions";

interface SidebarProps {
  userEmail?: string | null;
}

export default function Sidebar({ userEmail }: SidebarProps) {
  const pathname = usePathname();

  const navItems = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/pipeline", label: "Pipeline", icon: Columns3 },
    { href: "/campanhas", label: "Campanhas", icon: MessageSquare },
    { href: "/settings", label: "Configurações", icon: Settings },
  ];

  return (
    <aside className="w-60 bg-primary text-white flex flex-col shrink-0">
      <div className="p-5 flex items-center gap-2.5 font-bold text-lg border-b border-white/10">
        <div className="p-1.5 rounded-lg bg-secondary/20">
          <Zap className="h-5 w-5 fill-secondary text-secondary" />
        </div>
        <span>ProspectAI</span>
      </div>
      
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname.startsWith(item.href);
          
          return (
            <Link key={item.href} href={item.href}>
              <Button 
                variant="ghost" 
                className={`w-full justify-start h-10 transition-colors ${
                  isActive 
                    ? "text-white bg-white/10 hover:bg-white/15" 
                    : "text-white/60 hover:bg-white/10 hover:text-white"
                }`}
              >
                <Icon className="mr-2.5 h-4 w-4" /> 
                {item.label}
              </Button>
            </Link>
          );
        })}
      </nav>

      <div className="p-3 border-t border-white/10">
        <form action={signOut}>
          <Button variant="ghost" className="w-full justify-start text-white/50 hover:bg-white/10 hover:text-white h-10 text-sm">
            <LogOut className="mr-2.5 h-4 w-4" /> Sair
          </Button>
        </form>
      </div>
    </aside>
  );
}
