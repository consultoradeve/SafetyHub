'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Loader2, ListChecks, Flag } from 'lucide-react'
import { Card, EmptyState } from '../contratistas/ui'
import { ESTADOS_MEDIDA, ESTILO_ESTADO, fechaCorta } from './comun'

// Todas las medidas de los estudios del establecimiento, con su estado.
// (Cuando exista el Plan ACP, esta vista va a ser ese listado filtrado por origen "Ergonomía".)
export default function Acciones({ planta, onVerEstudio }) {
  const [medidas, setMedidas] = useState([])
  const [cargando, setCargando] = useState(true)
  const [filtro, setFiltro] = useState('Todas')
  const [guardando, setGuardando] = useState(null)

  const cargar = async () => {
    const { data } = await supabase.from('erg_medidas')
      .select('*, erg_estudios!inner(id, fecha, puesto, establecimiento_id), erg_tareas(nombre)')
      .eq('erg_estudios.establecimiento_id', planta.id)
    const lista = (data || []).sort((a, b) =>
      (b.priorizar - a.priorizar) ||
      b.erg_estudios.fecha.localeCompare(a.erg_estudios.fecha) ||
      a.erg_estudios.puesto.localeCompare(b.erg_estudios.puesto) ||
      (a.numero || 0) - (b.numero || 0))
    setMedidas(lista)
    setCargando(false)
  }
  useEffect(() => { cargar() }, [planta.id])

  const cambiarEstado = async (m, estado) => {
    setGuardando(m.id)
    const { error } = await supabase.from('erg_medidas').update({ estado }).eq('id', m.id)
    if (!error) setMedidas(medidas.map(x => x.id === m.id ? { ...x, estado } : x))
    setGuardando(null)
  }

  if (cargando) return (
    <div className="flex items-center justify-center gap-2.5 py-16 text-slate">
      <Loader2 className="w-5 h-5 animate-spin" strokeWidth={2} /> Cargando acciones...
    </div>
  )
  if (medidas.length === 0) return (
    <Card><EmptyState Icon={ListChecks} title="Todavía no hay medidas cargadas" /></Card>
  )

  const conteo = Object.fromEntries(ESTADOS_MEDIDA.map(e => [e, medidas.filter(m => m.estado === e).length]))
  const visibles = filtro === 'Todas' ? medidas : medidas.filter(m => m.estado === filtro)

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-2">
        {['Todas', ...ESTADOS_MEDIDA].map(e => (
          <button key={e} onClick={() => setFiltro(e)}
            className={`px-3.5 py-2 rounded-full text-[13px] font-semibold border-[1.5px]
                        ${filtro === e ? 'border-accent bg-accent-light text-accent' : 'border-hairline text-slate hover:border-accent'}`}>
            {e} ({e === 'Todas' ? medidas.length : conteo[e]})
          </button>
        ))}
      </div>

      <Card className="overflow-hidden">
        {visibles.map((m, i) => (
          <div key={m.id} className={`px-5 py-4 flex flex-col md:flex-row gap-3 ${i > 0 ? 'border-t border-hairline' : ''}`}>
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1.5 text-[12px]">
                <button onClick={() => onVerEstudio(m.erg_estudios.id)} className="font-semibold text-accent hover:underline">
                  {m.erg_estudios.puesto}
                </button>
                <span className="text-slate">· {m.erg_tareas?.nombre || 'Todas las tareas'} · {fechaCorta(m.erg_estudios.fecha)}</span>
                {m.priorizar && (
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-red-100 text-red-900 font-bold">
                    <Flag className="w-3 h-3" strokeWidth={2.2} /> PRIORIZAR
                  </span>
                )}
                {m.tipo && (
                  <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">
                    {m.tipo === 'ingenieria' ? 'Ingeniería' : 'Administrativa'}{m.subtipo ? ` · ${m.subtipo}` : ''}
                  </span>
                )}
              </div>
              <p className="text-[14px] text-ink leading-relaxed whitespace-pre-line">{m.texto}</p>
            </div>
            <div className="md:w-[160px] shrink-0">
              <label className="sr-only" htmlFor={`estado-${m.id}`}>Estado</label>
              <select id={`estado-${m.id}`} value={m.estado} disabled={guardando === m.id}
                onChange={e => cambiarEstado(m, e.target.value)}
                className={`w-full px-3 py-2 rounded-md text-[13px] font-semibold border border-hairline cursor-pointer ${ESTILO_ESTADO[m.estado]}`}>
                {ESTADOS_MEDIDA.map(e => <option key={e} value={e}>{e}</option>)}
              </select>
            </div>
          </div>
        ))}
      </Card>
    </div>
  )
}
