'use client'

import { Progress } from "@/components/ui/progress"
import { Zap } from "lucide-react"
import Link from "next/link"

interface SidebarUsageProps {
  used: number;
  total: number;
  planName: string;
  isExpanded: boolean;
}

export default function SidebarUsage({ used, total, planName, isExpanded }: SidebarUsageProps) {
  const percentage = Math.min((used / total) * 100, 100);
  const colorClass = percentage > 90 ? "bg-red-500" : percentage > 70 ? "bg-yellow-500" : "bg-primary";

  if (!isExpanded) {
    return (
      <div className="flex justify-center mt-auto py-4 border-t border-border/40 relative group/usage">
        <Link
          href="/upgrade"
          className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200 ${percentage > 90 ? 'bg-red-500/10 text-red-500' : 'bg-primary/10 text-primary'} hover:scale-110 active:scale-95`}
        >
          <Zap className="h-5 w-5 fill-current" />
        </Link>
        
        {/* Manual Tooltip */}
        <div 
          className="absolute left-16 px-3 py-2.5 rounded-xl text-xs font-medium whitespace-nowrap pointer-events-none opacity-0 group-hover/usage:opacity-100 transition-all duration-200 translate-x-[-8px] group-hover/usage:translate-x-0 z-50 shadow-2xl flex flex-col gap-1.5 min-w-[120px]"
          style={{
            background: "var(--background-3)",
            border: "1px solid var(--border)",
            color: "var(--foreground)",
          }}
        >
          <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground leading-none">{planName}</span>
          <span className="text-[13px] font-bold text-foreground leading-none">{used} / {total} Leads</span>
          <div className="w-full h-1.5 bg-muted/40 rounded-full mt-0.5 overflow-hidden">
            <div 
              className={`h-full transition-all duration-700 ${colorClass}`} 
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="px-5 py-5 border-t border-border/40 mt-auto">
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between text-[10px] uppercase font-black tracking-widest text-muted-foreground">
          <span>{planName}</span>
          <span className={`font-bold ${percentage > 90 ? 'text-red-500' : ''}`}>{used}/{total}</span>
        </div>
        
        <Progress value={percentage} className="h-1.5" indicatorClassName={colorClass} />
        
        <Link href="/upgrade" className="mt-1 flex items-center justify-center gap-2 py-2 rounded-xl bg-primary/10 hover:bg-primary/20 border border-primary/20 transition-all duration-200 group">
          <Zap className="h-3.5 w-3.5 text-primary group-hover:scale-110 transition-transform fill-primary/20" />
          <span className="text-[11px] font-black tracking-tight text-primary">UPGRADE</span>
        </Link>
      </div>
    </div>
  )
}
