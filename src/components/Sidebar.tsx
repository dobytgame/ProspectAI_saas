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

export default function Sidebar({ userEmail }: { userEmail?: string | null }) {
  const pathname = usePathname();

  return (
    <aside
      className="w-16 flex flex-col shrink-0 border-r transition-all duration-300"
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
              className="group relative w-10 h-10 flex items-center justify-center rounded-xl transition-all duration-200"
              style={{
                background: isActive ? "var(--primary-dim)" : "transparent",
                border: isActive ? "1px solid rgba(0, 229, 255, 0.2)" : "1px solid transparent",
              }}
            >
              <Icon
                className="h-[18px] w-[18px] transition-all duration-200"
                style={{
                  color: isActive ? "var(--primary)" : "var(--foreground-dim)",
                  filter: isActive ? "drop-shadow(0 0 6px var(--primary))" : "none",
                }}
              />
              {/* Tooltip */}
              <span
                className="absolute left-14 px-2.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap pointer-events-none opacity-0 group-hover:opacity-100 transition-all duration-150 translate-x-[-4px] group-hover:translate-x-0 z-50"
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

      {/* Avatar + Logout */}
      <div className="pb-4 flex flex-col items-center gap-3 border-t pt-4" style={{ borderColor: "var(--border)" }}>
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
          style={{
            background: "linear-gradient(135deg, rgba(0,229,255,0.2), rgba(0,102,255,0.2))",
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
            className="w-8 h-8 flex items-center justify-center rounded-lg transition-colors"
            style={{ color: "var(--foreground-dim)" }}
            onMouseEnter={e => (e.currentTarget.style.color = "var(--red)")}
            onMouseLeave={e => (e.currentTarget.style.color = "var(--foreground-dim)")}
          >
            <LogOut className="h-4 w-4" />
          </button>
        </form>
      </div>
    </aside>
  );
}
