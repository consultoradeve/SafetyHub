'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import {
  ArrowLeft, Plus, ChevronDown, ChevronUp, Loader2,
  CircleCheck, CircleAlert, CircleX, Calendar, User, Printer
} from 'lucide-react'
import { Card, BtnPrimary, BtnGhost, EmptyState } from '../contratistas/ui'
import ImprimirControl from './ImprimirControl'

const RESULTADO_UI = {
  aprobado:      { label: 'Aprobado',                   Icon: CircleCheck, chip: 'bg-green-100 text-green-800 border-green-200' },
  observaciones: { label: 'Con observaciones',           Icon: CircleAlert, chip: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
  rechazado:     { label: 'Rechazado',                   Icon: CircleX,     chip: 'bg-red-100 text-red-800 border-red-200' },
}

const formatFecha = (f) => f
  ? new Date(f + 'T00:00:00').toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })
  : '—'

export default function TemaDetalle({ tema, cliente, onNuevoControl, onVolver }) {
  const [controles, setControles] = useState([])
  const [cargando, setCargando] = useState(true)
  const [expandido, setExpandido] = useState(null)
  const [respuestasPorControl, setRespuestasPorControl] = useState({})
  const [itemsCatalogo, setItemsCatalogo] = useState({})
  const [imprimiendo, setImprimiendo] = useState(null) // control a imprimir

  useEffect(() => { cargar() }, [tema.id])

  const cargar = async () => {
    setCargando(true)
    const [{ data: ctr }, { data: items }] = await Promise.all([
      supabase.from('co_controles').select('*, co_equipos(codigo, ubicacion)')
        .eq('cliente_id', cliente.id).eq('tema_id', tema.id)
        .order('fecha', { ascending: false }).order('created_at', { ascending: false }),
      supabase.from('co_items_catalogo').select('*').eq('tema_id', tema.id),
    ])
    setControles(ctr || [])
    const map = {}
    ;(items || []).forEach(i => { map[i.id] = i })
    setItemsCatalogo(map)
    setCargando(false)
  }

  const toggleExpandir = async (controlId) => {
    if (expandido === controlId) { setExpandido(null); return }
    setExpandido(controlId)
    if (!respuestasPorControl[controlId]) {
      const { data } = await supabase.from('co_respuestas').select('*').eq('control_id', controlId)
      setRespuestasPorControl(prev => ({ ...prev, [controlId]: data || [] }))
    }
  }

  const exportarPDF = async (control) => {
    if (!respuestasPorControl[control.id]) {
      const { data } = await supabase.from('co_respuestas').select('*').eq('control_id', control.id)
      setRespuestasPorControl(prev => ({ ...prev, [control.id]: data || [] }))
    }
    setImprimiendo(control)
  }

  useEffect(() => {
    if (!imprimiendo) return
    const timer = setTimeout(() => window.print(), 150)
    const handleAfterPrint = () => setImprimiendo(null)
    window.addEventListener('afterprint', handleAfterPrint)
    return () => { clearTimeout(timer); window.removeEventListener('afterprint', handleAfterPrint) }
  }, [imprimiendo])

  if (cargando) return (
    <div className="flex items-center justify-center gap-2.5 py-20 text-slate">
      <Loader2 className="w-5 h-5 animate-spin" strokeWidth={2} />
      Cargando historial...
    </div>
  )

  return (
    <div className="max-w-[820px] mx-auto p-5 md:p-8">

      <div className="flex flex-wrap items-start justify-between gap-3 mb-6">
        <div>
          <h2 className="text-xl md:text-[22px] font-bold text-ink tracking-tight">{tema.nombre}</h2>
          <p className="text-sm text-slate mt-0.5">
            {cliente.nombre} · {controles.length} control{controles.length !== 1 ? 'es' : ''} registrado{controles.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex gap-2.5">
          <BtnPrimary onClick={onNuevoControl}>
            <Plus className="w-4 h-4" strokeWidth={2.2} />
            Nuevo control
          </BtnPrimary>
          <BtnGhost onClick={onVolver}>
            <ArrowLeft className="w-4 h-4" strokeWidth={2} />
            Volver
          </BtnGhost>
        </div>
      </div>

      {controles.length === 0 ? (
        <Card>
          <EmptyState title="Sin controles registrados" desc='Hacé clic en "Nuevo control" para cargar el primero.' />
        </Card>
      ) : (
        <div className="flex flex-col gap-2.5">
          {controles.map(c => {
            const ui = RESULTADO_UI[c.resultado] || {}
            const respuestas = respuestasPorControl[c.id] || []
            return (
              <Card key={c.id} className="overflow-hidden">
                <div
                  onClick={() => toggleExpandir(c.id)}
                  className="w-full flex flex-wrap items-center gap-3 px-5 py-4 text-left hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-1.5 text-sm text-slate">
                    <Calendar className="w-3.5 h-3.5" strokeWidth={1.8} />
                    {formatFecha(c.fecha)}
                  </div>
                  {c.co_equipos && (
                    <span className="text-xs font-semibold text-accent bg-accent-light px-2 py-0.5 rounded-md">
                      {c.co_equipos.codigo}
                    </span>
                  )}
                  <div className="flex items-center gap-1.5 text-sm text-slate">
                    <User className="w-3.5 h-3.5" strokeWidth={1.8} />
                    {c.responsable}
                  </div>
                  <div className="flex-1" />
                  <span className="text-sm font-semibold text-ink">{c.porcentaje_cumplimiento}%</span>
                  {ui.Icon && (
                    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-md border ${ui.chip}`}>
                      <ui.Icon className="w-3.5 h-3.5" strokeWidth={1.8} />
                      {ui.label}
                    </span>
                  )}
                  <button
                    onClick={(e) => { e.stopPropagation(); exportarPDF(c) }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[13px] font-semibold
                               text-slate border-[1.5px] border-hairline transition-colors hover:border-accent hover:text-accent"
                  >
                    <Printer className="w-3.5 h-3.5" strokeWidth={1.8} />
                    Exportar PDF
                  </button>
                  {expandido === c.id
                    ? <ChevronUp className="w-4 h-4 text-slate" strokeWidth={2} />
                    : <ChevronDown className="w-4 h-4 text-slate" strokeWidth={2} />}
                </div>

                {expandido === c.id && (
                  <div className="border-t border-hairline bg-slate-50 px-5 py-4">
                    {c.sector && (
                      <p className="text-xs text-slate mb-3">
                        Sector: <span className="text-ink font-medium">{c.sector}</span>
                        {c.ubicacion && <> · Ubicación: <span className="text-ink font-medium">{c.ubicacion}</span></>}
                        {c.auditor && <> · Auditor: <span className="text-ink font-medium">{c.auditor}</span></>}
                      </p>
                    )}

                    {c.observaciones_generales && (
                      <div className="bg-white border border-hairline rounded-md px-3 py-2.5 mb-3">
                        <p className="text-xs font-semibold text-slate uppercase tracking-wide mb-1">Observaciones generales</p>
                        <p className="text-sm text-ink">{c.observaciones_generales}</p>
                      </div>
                    )}

                    {c.plazo_correccion && (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-md px-3 py-2.5 mb-3">
                        <p className="text-xs font-semibold text-yellow-800 uppercase tracking-wide mb-1">Plazo de corrección</p>
                        <p className="text-sm text-yellow-900">
                          {formatFecha(c.plazo_correccion)} · Responsable: {c.responsable_correccion || '—'}
                        </p>
                      </div>
                    )}

                    <p className="text-xs font-semibold text-slate uppercase tracking-wide mb-2">Ítems verificados</p>
                    <div className="flex flex-col gap-1.5">
                      {respuestas.length === 0 ? (
                        <p className="text-sm text-slate italic">Cargando respuestas...</p>
                      ) : respuestas.map(r => {
                        const item = itemsCatalogo[r.item_id]
                        const color = r.respuesta === 'SI' ? 'text-green-700' : r.respuesta === 'NO' ? 'text-red-700' : 'text-slate'
                        return (
                          <div key={r.id} className="flex items-start gap-2.5 bg-white border border-hairline rounded-md px-3 py-2">
                            <span className={`text-xs font-bold shrink-0 w-7 ${color}`}>{r.respuesta}</span>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-ink">{item?.texto || '—'}</p>
                              {r.observacion && <p className="text-xs text-slate mt-0.5 italic">{r.observacion}</p>}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </Card>
            )
          })}
        </div>
      )}

      {imprimiendo && (
        <ImprimirControl
          tema={tema}
          cliente={cliente}
          control={imprimiendo}
          respuestas={respuestasPorControl[imprimiendo.id] || []}
          itemsCatalogo={itemsCatalogo}
        />
      )}
    </div>
  )
}
