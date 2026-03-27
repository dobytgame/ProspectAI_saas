'use client'

import { useState } from 'react'
import { Button } from './ui/button'
import { Loader2, Zap } from 'lucide-react'

export default function UpgradeClientButton({ 
  isCurrentPlan, 
  priceId, 
  variant = 'primary',
  label = 'Assinar Agora'
}: { 
  isCurrentPlan: boolean, 
  priceId?: string,
  variant?: 'primary' | 'secondary' | 'outline',
  label?: string
}) {
  const [loading, setLoading] = useState(false)

  const handleUpgrade = async () => {
    if (!priceId) return;
    setLoading(true)
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        body: JSON.stringify({ priceId }),
      })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      }
    } catch (err) {
      console.error(err)
    } finally {
      if (!window.location.href.includes('stripe')) {
        setLoading(false)
      }
    }
  }

  if (isCurrentPlan) {
    return (
      <Button disabled className="w-full rounded-xl h-11 text-sm font-bold bg-green-500/10 text-green-500 border border-green-500/20">
        Plano Atual
      </Button>
    )
  }

  const variants = {
    primary: "bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20",
    secondary: "bg-background border border-border hover:bg-muted text-foreground",
    outline: "bg-transparent border-2 border-primary text-primary hover:bg-primary/5"
  }

  return (
    <Button 
      onClick={handleUpgrade} 
      disabled={loading || !priceId}
      className={`w-full rounded-xl h-11 text-sm font-bold transition-all hover:scale-[1.02] ${variants[variant]}`}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin mx-auto" />
      ) : (
        <span className="flex items-center justify-center gap-2 w-full">
          {variant === 'primary' && <Zap className="h-4 w-4 fill-current" />}
          {label}
        </span>
      )}
    </Button>
  )
}
