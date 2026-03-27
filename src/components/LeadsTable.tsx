'use client'

import { useState, useEffect, useTransition, useCallback } from 'react'
import { getLeadsAction, deleteLeadsAction } from '@/app/(dashboard)/leads/actions'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Search, Trash2, ChevronLeft, ChevronRight, Phone, Globe, MapPin, Building2, Loader2, AlertCircle } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/components/ui/Toast'
import { DeleteLeadsDialog } from '@/components/DeleteLeadsDialog'
import { cn } from '@/lib/utils'

interface Lead {
  id: string
  name: string
  address: string
  phone: string | null
  website: string | null
  segment: string | null
  score: number
  status: string
  created_at: string
}

export default function LeadsTable() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [cityFilter, setCityFilter] = useState('')
  const [segmentFilter, setSegmentFilter] = useState('')
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [leadToDelete, setLeadToDelete] = useState<string | null>(null)
  
  const [isPending, startTransition] = useTransition()
  const toast = useToast()

  const fetchLeads = useCallback(async () => {
    setIsLoading(true)
    try {
      const result = await getLeadsAction({ city: cityFilter, segment: segmentFilter }, page)
      setLeads(result.leads as Lead[])
      setTotal(result.total)
      setTotalPages(result.totalPages)
    } catch (error) {
      toast("Erro ao carregar leads", "error")
    } finally {
      setIsLoading(false)
    }
  }, [cityFilter, segmentFilter, page, toast])

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchLeads()
    }, 500)
    return () => clearTimeout(timer)
  }, [fetchLeads])

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(leads.map(l => l.id))
    } else {
      setSelectedIds([])
    }
  }

  const handleSelectOne = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedIds(prev => [...prev, id])
    } else {
      setSelectedIds(prev => prev.filter(i => i !== id))
    }
  }

  const handleDelete = async () => {
    const idsToDelete = leadToDelete ? [leadToDelete] : selectedIds
    if (idsToDelete.length === 0) return

    setIsDeleting(true)
    try {
      await deleteLeadsAction(idsToDelete)
      toast(`${idsToDelete.length === 1 ? 'Lead excluído' : 'Leads excluídos'} com sucesso!`, "success")
      setSelectedIds([])
      setLeadToDelete(null)
      setDeleteDialogOpen(false)
      fetchLeads()
    } catch (error) {
      toast("Erro ao excluir leads", "error")
    } finally {
      setIsDeleting(false)
    }
  }

  const openDeleteDialog = (id?: string) => {
    if (id) {
      setLeadToDelete(id)
    } else {
      setLeadToDelete(null)
    }
    setDeleteDialogOpen(true)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4 items-end justify-between bg-background p-6 rounded-2xl border border-border/40 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1 w-full">
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">Cidade</label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Filtrar por cidade..." 
                value={cityFilter}
                onChange={(e) => { setCityFilter(e.target.value); setPage(1); }}
                className="pl-10 h-11 bg-muted/20 border-border/40 focus:border-secondary/50 transition-all rounded-xl"
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">Segmento</label>
            <div className="relative">
              <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Filtrar por segmento..." 
                value={segmentFilter}
                onChange={(e) => { setSegmentFilter(e.target.value); setPage(1); }}
                className="pl-10 h-11 bg-muted/20 border-border/40 focus:border-secondary/50 transition-all rounded-xl"
              />
            </div>
          </div>
        </div>
        
        {selectedIds.length > 0 && (
          <Button 
            variant="destructive" 
            onClick={() => openDeleteDialog()}
            className="h-11 px-6 font-black gap-2 shadow-lg shadow-red-500/20 active:scale-95 transition-all rounded-xl"
          >
            <Trash2 className="h-4 w-4" />
            Excluir ({selectedIds.length})
          </Button>
        )}
      </div>

      <div className="bg-background rounded-2xl border border-border/40 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-muted/30 border-b border-border/40">
                <th className="p-4 w-10">
                  <Checkbox 
                    checked={leads.length > 0 && selectedIds.length === leads.length}
                    onChange={(e) => handleSelectAll((e.target as HTMLInputElement).checked)}
                  />
                </th>
                <th className="p-4 text-xs font-black uppercase tracking-widest text-muted-foreground">Lead</th>
                <th className="p-4 text-xs font-black uppercase tracking-widest text-muted-foreground">Segmento</th>
                <th className="p-4 text-xs font-black uppercase tracking-widest text-muted-foreground">Cidade / Endereço</th>
                <th className="p-4 text-xs font-black uppercase tracking-widest text-muted-foreground">Contato</th>
                <th className="p-4 text-xs font-black uppercase tracking-widest text-muted-foreground text-center">Score</th>
                <th className="p-4 text-xs font-black uppercase tracking-widest text-muted-foreground text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-muted-foreground">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-primary" />
                    <p className="font-medium">Buscando seus leads...</p>
                  </td>
                </tr>
              ) : leads.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-muted-foreground">
                    <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-20" />
                    <p className="font-medium">Nenhum lead encontrado com estes filtros.</p>
                  </td>
                </tr>
              ) : (
                leads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-muted/10 transition-colors group">
                    <td className="p-4">
                      <Checkbox 
                        checked={selectedIds.includes(lead.id)}
                        onChange={(e) => handleSelectOne(lead.id, (e.target as HTMLInputElement).checked)}
                      />
                    </td>
                    <td className="p-4">
                      <div className="flex flex-col">
                        <span className="font-bold text-sm text-foreground">{lead.name}</span>
                        <span className="text-[10px] text-muted-foreground font-mono">{lead.id.slice(0, 8)}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-tight bg-secondary/5 text-secondary border-secondary/20">
                        {lead.segment || 'Geral'}
                      </Badge>
                    </td>
                    <td className="p-4 max-w-[200px]">
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <MapPin className="h-3 w-3 shrink-0" />
                        <span className="truncate">{lead.address}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex flex-col gap-1">
                        {lead.phone && (
                          <div className="flex items-center gap-1.5 text-xs font-medium">
                            <Phone className="h-3 w-3 text-green-500" />
                            {lead.phone}
                          </div>
                        )}
                        {lead.website ? (
                          <a href={lead.website} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-xs text-blue-500 hover:underline">
                            <Globe className="h-3 w-3" />
                            Site
                          </a>
                        ) : (
                          <span className="text-[10px] text-muted-foreground italic">Sem link</span>
                        )}
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <Badge className={cn(
                        "font-black text-[10px] h-6 px-2",
                        lead.score >= 70 ? "bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.3)]" : 
                        lead.score >= 40 ? "bg-amber-500" : "bg-red-400"
                      )}>
                        {lead.score || 0}
                      </Badge>
                    </td>
                    <td className="p-4 text-right">
                      <Button 
                        variant="ghost" 
                        size="icon-sm"
                        onClick={() => openDeleteDialog(lead.id)}
                        className="text-muted-foreground hover:text-red-500 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-all rounded-lg"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="p-4 flex items-center justify-between border-t border-border/40 bg-muted/5">
          <p className="text-xs text-muted-foreground font-medium">
            Mostrando <span className="text-foreground font-bold">{leads.length}</span> de <span className="text-foreground font-bold">{total}</span> leads
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 1 || isLoading}
              onClick={() => setPage(p => Math.max(1, p - 1))}
              className="h-8 rounded-lg border-border/40"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-1 px-2">
              <span className="text-xs font-bold text-foreground">{page}</span>
              <span className="text-xs text-muted-foreground mx-1">/</span>
              <span className="text-xs font-medium text-muted-foreground">{totalPages}</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              disabled={page === totalPages || isLoading}
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              className="h-8 rounded-lg border-border/40"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <DeleteLeadsDialog 
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDelete}
        count={leadToDelete ? 1 : selectedIds.length}
        isDeleting={isDeleting}
      />
    </div>
  )
}
