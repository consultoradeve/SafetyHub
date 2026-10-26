'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Loader2, FileText, ArrowRight } from 'lucide-react'
import { Card, EmptyState } from '../contratistas/ui'
import { fechaCorta } from './comun'

export default function ListaEstudios({ planta, onVerEstudio }) {
  const [estudios, setEstudios] = useState([])
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    supabase.from('erg_estudios')
      .select('id, fecha, puesto, sector, origen, estado, evaluador_texto, erg_tareas(count), erg_medidas(count)')
      .eq('establecimiento_id', planta.id)
      .order('fecha', { ascending: false })
      .then(({ data }) => { setEstudios(data || []); setCargando(false) })
  }, [planta.id])

  if (cargando) return (
    <div className="flex items-center justify-center gap-2.5 py-16 text-slate">
      <Loader2 className="w-5 h-5 animate-spin" strokeWidth={2} /> Cargando estudios...
    </div>
  )
  if (estudios.length === 0) return (
    <Card><EmptyState Icon={FileText} title="Todavía no hay estudios en este establecimiento" /></Card>
  )

  return (
    <Card className="overflow-hidden">
      {estudios.map((e, i) => (
        <button key={e.id} onClick={() => onVerEstudio(e.id)}
          className={`w-full flex flex-wrap items-center gap-4 px-5 py-4 text-left hover:bg-accent-light/40
                      ${i > 0 ? 'border-t border-hairline' : ''}`}>
          <div className="w-[88px] shrink-0">
            <p className="text-[15px] font-bold text-ink">{fechaCorta(e.fecha)}</p>
            {e.origen === 'migrado' && (
              <span className="inline-block mt-1 text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">Migrado</span>
            )}
          </div>
          <div className="flex-1 min-w-[200px]">
            <p className="text-[15px] font-semibold text-ink">{e.puesto}</p>
            <p className="text-[13px] text-slate mt-0.5">
              {[e.sector, e.evaluador_texto].filter(Boolean).join(' · ')}
            </p>
          </div>
          <div className="text-[13px] text-slate whitespace-nowrap">
            {e.erg_tareas?.[0]?.count ?? 0} tareas · {e.erg_medidas?.[0]?.count ?? 0} medidas
          </div>
          <ArrowRight className="w-4 h-4 text-slate" strokeWidth={2} />
        </button>
      ))}
    </Card>
  )
}
