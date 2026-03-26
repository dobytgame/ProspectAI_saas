'use client'

import { useState } from 'react'
import { Button } from './ui/button'
import { Loader2, Zap } from 'lucide-react'

export default function UpgradeClientButton({ isPro }: { isPro: boolean }) {
  const [loading, setLoading] = useState(false)

  const handleUpgrade = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
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

  if (isPro) {
    return (
      <Button disabled className="w-full rounded-xl h-14 text-lg font-bold bg-green-500/20 text-green-500 border border-green-500/50">
        Plano Pro Ativo
      </Button>
    )
  }

  return (
    <Button 
      onClick={handleUpgrade} 
      disabled={loading}
      className="w-full rounded-xl h-14 text-lg font-bold bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:scale-[1.02]"
    >
      {loading ? (
        <Loader2 className="h-5 w-5 animate-spin mx-auto" />
      ) : (
        <span className="flex items-center justify-center gap-2 w-full">
          <Zap className="h-5 w-5 fill-current" /> Assinar Agora
        </span>
      )}
    </Button>
  )
}
