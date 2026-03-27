'use client'

import { Progress } from "@/components/ui/progress"
import { Zap } from "lucide-react"
import Link from "next/link"

interface SidebarUsageProps {
  used: number;
  total: number;
  planName: string;
}

export default function SidebarUsage({ used, total, planName }: SidebarUsageProps) {
  const percentage = Math.min((used / total) * 100, 100);
  const colorClass = percentage > 90 ? "bg-red-500" : percentage > 70 ? "bg-yellow-500" : "bg-primary";

  return (
    <div className="px-3 py-4 border-t border-border/40 mt-auto">
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between text-[10px] uppercase font-black tracking-widest text-muted-foreground">
          <span>{planName}</span>
          <span>{used}/{total}</span>
        </div>
        
        <Progress value={percentage} className="h-1.5" indicatorClassName={colorClass} />
        
        <Link href="/upgrade" className="mt-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-primary/10 hover:bg-primary/20 transition-colors group">
          <Zap className="h-3 w-3 text-primary group-hover:scale-110 transition-transform" />
          <span className="text-[10px] font-bold text-primary">UPGRADE</span>
        </Link>
      </div>
    </div>
  )
}
