'use client'

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Columns3, MessageSquare, Settings, LogOut, Zap } from "lucide-react";
import { signOut } from "@/app/(auth)/actions";

const navItems = [
  { href: "/dashboard",  label: "Dashboard",      icon: LayoutDashboard },
  { href: "/pipeline",   label: "Pipeline",        icon: Columns3 },
  { href: "/campanhas",  label: "Campanhas",       icon: MessageSquare },
  { href: "/settings",   label: "Configurações",   icon: Settings },
];

import SidebarUsage from "./SidebarUsage";

export default function Sidebar({ 
  userEmail, 
  usage 
}: { 
  userEmail?: string | null;
  usage?: { used: number; total: number; planName: string };
}) {
  const pathname = usePathname();

  return (
    <aside
      className="w-20 flex flex-col shrink-0 border-r transition-all duration-300"
      style={{
        background: "var(--navy)",
        borderColor: "var(--border)",
      }}
    >
      {/* Logo */}
      <div className="h-14 flex items-center justify-center border-b" style={{ borderColor: "var(--border)" }}>
        <Link href="/dashboard" className="transition-transform hover:scale-110">
          <img src="/capturo.png" alt="Capturo Logo" className="w-9 h-9 object-contain" />
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 flex flex-col items-center py-4 gap-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              title={item.label}
              className="group relative w-12 h-12 flex items-center justify-center rounded-xl transition-all duration-200"
              style={{
                background: isActive ? "var(--primary-dim)" : "transparent",
                border: isActive ? "1px solid rgba(0, 229, 255, 0.2)" : "1px solid transparent",
              }}
            >
              <Icon
                className="h-[20px] w-[20px] transition-all duration-200"
                style={{
                  color: isActive ? "var(--primary)" : "var(--foreground-dim)",
                  filter: isActive ? "drop-shadow(0 0 6px var(--primary))" : "none",
                }}
              />
              {/* Tooltip */}
              <span
                className="absolute left-16 px-2.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap pointer-events-none opacity-0 group-hover:opacity-100 transition-all duration-150 translate-x-[-4px] group-hover:translate-x-0 z-50 shadow-2xl"
                style={{
                  background: "var(--background-3)",
                  border: "1px solid var(--border)",
                  color: "var(--foreground)",
                }}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* Usage Indicator */}
      {usage && (
        <div className="px-2 pb-4">
           <SidebarUsage used={usage.used} total={usage.total} planName={usage.planName} />
        </div>
      )}

      {/* Avatar + Logout */}
      <div className="pb-4 flex flex-col items-center gap-3 border-t pt-4" style={{ borderColor: "var(--border)" }}>
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-black"
          style={{
            background: "linear-gradient(135deg, rgba(0,229,255,0.1), rgba(0,102,255,0.1))",
            border: "1px solid var(--border)",
            color: "var(--primary)",
          }}
        >
          {userEmail?.[0]?.toUpperCase() ?? "U"}
        </div>
        <form action={signOut}>
          <button
            type="submit"
            title="Sair"
            className="w-10 h-10 flex items-center justify-center rounded-xl transition-colors hover:bg-red-500/10"
            style={{ color: "var(--foreground-dim)" }}
            onMouseEnter={e => (e.currentTarget.style.color = "var(--red)")}
            onMouseLeave={e => (e.currentTarget.style.color = "var(--foreground-dim)")}
          >
            <LogOut className="h-5 w-5" />
          </button>
        </form>
      </div>
    </aside>
  );
}
