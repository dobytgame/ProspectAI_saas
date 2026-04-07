'use client'

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, Columns3, LayoutDashboard, MessageSquare, Settings, Users } from "lucide-react";

const items = [
  { href: "/dashboard", label: "Início", icon: LayoutDashboard },
  { href: "/pipeline", label: "Pipeline", icon: Columns3 },
  { href: "/leads", label: "Leads", icon: Users },
  { href: "/campanhas", label: "Campanhas", icon: MessageSquare },
  { href: "/conhecimento", label: "Base", icon: BookOpen },
  { href: "/settings", label: "Ajustes", icon: Settings },
];

export default function MobileBottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="md:hidden fixed inset-x-0 bottom-0 z-50 border-t border-border bg-background/95 backdrop-blur supports-[padding:max(0px)]:pb-[max(env(safe-area-inset-bottom),0.5rem)]"
      aria-label="Navegação principal mobile"
    >
      <ul className="grid grid-cols-6 gap-0.5 px-1 pt-2 pb-2">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = pathname.startsWith(item.href);

          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={`flex flex-col items-center justify-center rounded-lg py-1.5 text-[9px] font-semibold leading-tight transition-colors ${
                  isActive ? "text-primary bg-primary/10" : "text-muted-foreground"
                }`}
              >
                <Icon className="h-4 w-4 mb-1" />
                <span>{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
