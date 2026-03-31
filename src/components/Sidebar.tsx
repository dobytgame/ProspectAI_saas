'use client'

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  Columns3, 
  MessageSquare, 
  Settings, 
  LogOut, 
  ChevronLeft, 
  ChevronRight,
  User,
  Users
} from "lucide-react";
import { signOut } from "@/app/(auth)/actions";
import SidebarUsage from "./SidebarUsage";

const navItems = [
  { href: "/dashboard",  label: "Dashboard",      icon: LayoutDashboard },
  { href: "/pipeline",   label: "Pipeline",        icon: Columns3 },
  { href: "/leads",      label: "Leads",           icon: Users },
  { href: "/campanhas",  label: "Campanhas",       icon: MessageSquare },
  { href: "/settings",   label: "Configurações",   icon: Settings },
];

export default function Sidebar({ 
  userEmail, 
  usage 
}: { 
  userEmail?: string | null;
  usage?: { used: number; total: number; planName: string };
}) {
  const pathname = usePathname();
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <aside
      className={`hidden md:flex flex-col shrink-0 border-r transition-all duration-300 relative group/sidebar ${isExpanded ? 'w-64' : 'w-20'}`}
      style={{
        background: "var(--navy)",
        borderColor: "var(--border)",
      }}
    >
      {/* Toggle Button */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="absolute -right-3 top-7 w-6 h-6 rounded-full border border-border bg-background flex items-center justify-center text-muted-foreground hover:text-primary transition-all duration-200 opacity-0 group-hover/sidebar:opacity-100 z-50 shadow-lg"
      >
        {isExpanded ? <ChevronLeft className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
      </button>

      {/* Logo */}
      <div className="h-16 flex items-center px-6 border-b shrink-0 overflow-hidden" style={{ borderColor: "var(--border)" }}>
        <Link href="/dashboard" className="flex items-center transition-transform hover:scale-[1.02]">
          {isExpanded ? (
            <img src="/capturo.png" alt="Capturo" className="h-8 w-auto object-contain" />
          ) : (
            <div className="w-9 h-9 flex items-center justify-center">
              <img src="/icon-capturo.png" alt="C" className="w-8 h-8 object-contain" />
            </div>
          )}
        </Link>
      </div>

      {/* Nav */}
      <nav className={`flex-1 flex flex-col py-6 gap-2 ${isExpanded ? 'px-4' : 'items-center'}`}>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`group relative flex items-center gap-3 rounded-xl transition-all duration-200 ${isExpanded ? 'px-3 py-2.5 w-full' : 'w-12 h-12 justify-center'}`}
              style={{
                background: isActive ? "var(--primary-dim)" : "transparent",
                border: isActive ? "1px solid rgba(0, 229, 255, 0.2)" : "1px solid transparent",
              }}
            >
              <Icon
                className="h-[20px] w-[20px] shrink-0 transition-all duration-200"
                style={{
                  color: isActive ? "var(--primary)" : "var(--foreground-dim)",
                  filter: isActive ? "drop-shadow(0 0 6px var(--primary))" : "none",
                }}
              />
              {isExpanded && (
                <span className={`text-[13px] font-bold transition-colors ${isActive ? 'text-foreground' : 'text-foreground-dim group-hover:text-foreground'}`}>
                  {item.label}
                </span>
              )}
              
              {/* Tooltip (only when collapsed) */}
              {!isExpanded && (
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
              )}
            </Link>
          );
        })}
      </nav>

      {/* Usage Indicator */}
      {usage && (
        <div className="pb-4 shrink-0 transition-opacity duration-300">
          <SidebarUsage used={usage.used} total={usage.total} planName={usage.planName} isExpanded={isExpanded} />
        </div>
      )}

      {/* Profile & Logout */}
      <div className={`py-4 shrink-0 border-t ${isExpanded ? 'px-4' : 'flex flex-col items-center'}`} style={{ borderColor: "var(--border)" }}>
        <div className={`flex items-center gap-3 mb-3 ${!isExpanded && 'flex-col'}`}>
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-black shrink-0"
            style={{
              background: "linear-gradient(135deg, rgba(0,229,255,0.1), rgba(0,102,255,0.1))",
              border: "1px solid var(--border)",
              color: "var(--primary)",
            }}
          >
            {userEmail?.[0]?.toUpperCase() ?? <User className="h-5 w-5" />}
          </div>
          {isExpanded && (
            <div className="flex flex-col overflow-hidden">
              <span className="text-xs font-bold text-foreground truncate">{userEmail}</span>
              <span className="text-[10px] text-primary font-black uppercase tracking-widest">{usage?.planName}</span>
            </div>
          )}
        </div>

        <form action={signOut} className="w-full">
          <button
            type="submit"
            className={`flex items-center gap-3 rounded-xl transition-all duration-200 group w-full ${isExpanded ? 'px-3 py-2 text-red-500/80 hover:bg-red-500/10' : 'w-10 h-10 justify-center text-foreground-dim hover:text-red-500 hover:bg-red-500/10'}`}
          >
            <LogOut className="h-5 w-5 shrink-0" />
            {isExpanded && <span className="text-[13px] font-bold">Encerrar Sessão</span>}
          </button>
        </form>
      </div>
    </aside>
  );
}
