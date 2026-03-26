'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Zap, Send, User, Bot, Loader2, X } from 'lucide-react'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

interface LeadChatProps {
  lead: {
    id: string
    name: string
    score?: number
    reasoning?: string
  }
  onClose: () => void
}

export default function LeadChat({ lead, onClose }: LeadChatProps) {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: `Olá! Sou o seu Agente de Prospecção. Analisei o lead **${lead.name}** (Score: ${lead.score}). Como posso te ajudar a abordar essa empresa hoje?` }
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const handleSend = async () => {
    if (!input.trim() || isLoading) return

    const userMsg = input.trim()
    setInput('')
    setMessages(prev => [...prev, { role: 'user', content: userMsg }])
    setIsLoading(true)

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: userMsg, 
          leadId: lead.id,
          history: messages 
        })
      })
      
      const data = await response.json()
      setMessages(prev => [...prev, { role: 'assistant', content: data.reply }])
    } catch (error) {
      setMessages(prev => [...prev, { role: 'assistant', content: "Desculpe, ocorreu um erro ao processar sua mensagem." }])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="fixed bottom-4 right-4 w-[450px] h-[600px] shadow-2xl flex flex-col border-primary/20 z-50 overflow-hidden">
      <CardHeader className="bg-primary text-white p-4 flex flex-row items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center">
            <Zap className="h-5 w-5 text-white fill-white" />
          </div>
          <div>
            <CardTitle className="text-sm font-bold">Agente Capturo</CardTitle>
            <p className="text-[10px] text-white/70">Estratégia para: {lead.name}</p>
          </div>
        </div>
        <Button variant="ghost" size="icon" className="text-white hover:bg-white/10" onClick={onClose}>
          <X className="h-5 w-5" />
        </Button>
      </CardHeader>

      <CardContent className="flex-1 overflow-hidden p-0 flex flex-col bg-muted/5">
        <ScrollArea className="flex-1 p-4" ref={scrollRef}>
          <div className="space-y-4">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded-2xl p-3 text-sm ${
                  m.role === 'user' 
                    ? 'bg-secondary text-white rounded-tr-none' 
                    : 'bg-white border border-border/50 rounded-tl-none shadow-sm text-foreground'
                }`}>
                  <div className="flex items-center gap-1.5 mb-1 opacity-60">
                    {m.role === 'user' ? <User className="h-3 w-3" /> : <Bot className="h-3 w-3" />}
                    <span className="text-[10px] font-bold uppercase tracking-tighter">
                      {m.role === 'user' ? 'Você' : 'Agente IA'}
                    </span>
                  </div>
                  <div className="whitespace-pre-wrap leading-relaxed">{m.content}</div>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white border border-border/50 rounded-2xl p-3 shadow-sm rounded-tl-none">
                  <Loader2 className="h-4 w-4 animate-spin text-secondary" />
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        <div className="p-4 bg-white border-t border-border/50">
          <div className="relative flex items-center gap-2">
            <Input 
              placeholder="Digite sua mensagem..." 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              className="pr-12 bg-muted/30 focus-visible:ring-secondary/50 border-border/40"
            />
            <Button 
              size="icon" 
              className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 bg-secondary hover:bg-secondary/90"
              onClick={handleSend}
              disabled={isLoading}
            >
              <Send className="h-4 w-4 text-white" />
            </Button>
          </div>
          <p className="text-[9px] text-center text-muted-foreground mt-3 uppercase tracking-widest opacity-50">
            Powered by Claude 3.5 Sonnet
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
