'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { ArrowLeft, Plus, Settings, Loader2, Scale } from 'lucide-react'
import { Card, BtnPrimary, BtnGhost, EmptyState } from '../contratistas/ui'
import { calcularEstadoRequisito, calcularVencimiento, SEMAFORO_MATRIZ, ORDEN_URGENCIA } from './logica'

const formatFecha = (f) => f
  ? new Date(f + 'T00:00:00').toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })
  : '—'

const BARRA = {
  vencido: 'border-l-red-800', rojo: 'border-l-red-500', amarillo: 'border-l-yellow-500',
  verde: 'border-l-green-600', sin_vencimiento: 'border-l-blue-400', sin_datos: 'border-l-slate-300',
}

function Badge({ estado }) {
  const s = SEMAFORO_MATRIZ[estado]
  return (
    <span className={`inline-flex items-center justify-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border w-[120px] whitespace-nowrap ${s.chip}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
      {s.label}
    </span>
  )
}

export default function DashboardRequisitos({ cliente, establecimiento, esAdmin, onNuevo, onVerDetalle, onConfig, onVolver }) {
  const [requisitos, setRequisitos] = useState([])
  const [config, setConfig] = useState(null)
  const [categorias, setCategorias] = useState({})
  const [responsables, setResponsables] = useState({})
  const [filtroUrgente, setFiltroUrgente] = useState(false)
  const [cargando, setCargando] = useState(true)

  useEffect(() => { cargar() }, [establecimiento.id])

  const cargar = async () => {
    setCargando(true)
    const [{ data: reqs }, { data: configData }, { data: cats }, { data: resps }] = await Promise.all([
      supabase.from('matriz_requisitos').select('*')
        .eq('establecimiento_id', establecimiento.id).eq('activo', true).order('aspecto_legal'),
      supabase.from('matriz_config').select('*').eq('cliente_id', cliente.id).maybeSingle(),
      supabase.from('matriz_categorias').select('*'),
      supabase.from('matriz_responsables').select('*'),
    ])
    setRequisitos(reqs || [])
    setConfig(configData)
    const catMap = {}; (cats || []).forEach(c => { catMap[c.id] = c })
    setCategorias(catMap)
    const respMap = {}; (resps || []).forEach(r => { respMap[r.id] = r })
    setResponsables(respMap)
    setCargando(false)
  }

  const conEstado = requisitos.map(r => ({ ...r, estado: calcularEstadoRequisito(r, config) }))

  const totales = {
    total: conEstado.length,
    vencido: conEstado.filter(r => r.estado === 'vencido').length,
    rojo: conEstado.filter(r => r.estado === 'rojo').length,
    amarillo: conEstado.filter(r => r.estado === 'amarillo').length,
    verde: conEstado.filter(r => r.estado === 'verde').length,
  }

  const visibles = filtroUrgente
    ? conEstado.filter(r => r.estado === 'vencido' || r.estado === 'rojo')
    : conEstado

  // Agrupar por categoría, categorías sin nombre van al final como "Sin categoría"
  const grupos = []
  visibles.forEach(r => {
    const nombreCat = categorias[r.categoria_id]?.nombre || 'Sin categoría'
    let g = grupos.find(x => x.nombre === nombreCat)
    if (!g) { g = { nombre: nombreCat, items: [] }; grupos.push(g) }
    g.items.push(r)
  })
  grupos.forEach(g => g.items.sort((a, b) => ORDEN_URGENCIA[a.estado] - ORDEN_URGENCIA[b.estado]))
  grupos.sort((a, b) => {
    const peorA = Math.min(...a.items.map(i => ORDEN_URGENCIA[i.estado]))
    const peorB = Math.min(...b.items.map(i => ORDEN_URGENCIA[i.estado]))
    return peorA - peorB
  })

  if (cargando) return (
    <div className="flex items-center justify-center gap-2.5 py-20 text-slate">
      <Loader2 className="w-5 h-5 animate-spin" strokeWidth={2} />
      Cargando matriz legal...
    </div>
  )

  return (
    <div className="max-w-[1000px] mx-auto p-5 md:p-8">

      <div className="flex flex-wrap items-start justify-between gap-3 mb-6">
        <div>
          <h2 className="text-xl md:text-[22px] font-bold text-ink tracking-tight">Matriz de Cumplimiento Legal</h2>
          <p className="text-sm text-slate mt-0.5">
            {cliente.nombre} · <span className="font-semibold text-ink">{establecimiento.nombre}</span>
          </p>
        </div>
        <div className="flex flex-wrap gap-2.5">
          {esAdmin && (
            <BtnGhost onClick={onConfig}>
              <Settings className="w-4 h-4" strokeWidth={1.8} />
              Responsables y umbrales
            </BtnGhost>
          )}
          <BtnPrimary onClick={onNuevo}>
            <Plus className="w-4 h-4" strokeWidth={2.2} />
            Nuevo requisito
          </BtnPrimary>
          <BtnGhost onClick={onVolver}>
            <ArrowLeft className="w-4 h-4" strokeWidth={2} />
            Volver
          </BtnGhost>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-2.5 mb-5">
        {[
          { label: 'Total',      valor: totales.total,   cls: 'bg-white text-ink border-hairline' },
          { label: 'Vencidos',   valor: totales.vencido, cls: 'bg-red-100 text-red-800 border-red-300' },
          { label: 'Urgentes',   valor: totales.rojo,    cls: 'bg-red-50 text-red-700 border-red-200' },
          { label: 'Por vencer', valor: totales.amarillo,cls: 'bg-yellow-50 text-yellow-800 border-yellow-200' },
          { label: 'Vigentes',   valor: totales.verde,   cls: 'bg-green-50 text-green-800 border-green-200' },
        ].map(({ label, valor, cls }) => (
          <div key={label} className={`border rounded-xl px-3 py-4 text-center ${cls}`}>
            <p className="text-[28px] font-bold leading-none">{valor}</p>
            <p className="text-xs font-semibold mt-1.5 opacity-80">{label}</p>
          </div>
        ))}
      </div>

      <div className="flex gap-2 mb-5">
        <button onClick={() => setFiltroUrgente(false)}
          className={`px-4 py-2 rounded-full text-[13px] font-semibold transition-colors
            ${!filtroUrgente ? 'bg-accent text-white' : 'bg-white border border-hairline text-slate hover:border-accent'}`}>
          Todas las categorías
        </button>
        <button onClick={() => setFiltroUrgente(true)}
          className={`px-4 py-2 rounded-full text-[13px] font-semibold transition-colors
            ${filtroUrgente ? 'bg-accent text-white' : 'bg-white border border-hairline text-slate hover:border-accent'}`}>
          Solo vencidos y urgentes
        </button>
      </div>

      {grupos.length === 0 ? (
        <Card><EmptyState Icon={Scale} title="No hay requisitos cargados" desc='Hacé clic en "Nuevo requisito" para agregar el primero.' /></Card>
      ) : (
        <div className="flex flex-col gap-3.5">
          {grupos.map(g => (
            <Card key={g.nombre} className="overflow-hidden">
              <div className="bg-slate-100 px-5 py-2.5 flex items-center justify-between">
                <p className="text-[11px] font-bold text-slate uppercase tracking-wider">{g.nombre}</p>
                <p className="text-[11px] font-semibold text-slate-400">{g.items.length} {g.items.length === 1 ? 'ítem' : 'ítems'}</p>
              </div>
              {g.items.map((r, i) => {
                const vencimiento = calcularVencimiento(r)
                const responsable = responsables[r.responsable_id]
                return (
                  <button
                    key={r.id}
                    onClick={() => onVerDetalle(r)}
                    className={`w-full flex flex-wrap items-center gap-3 px-5 py-3.5 text-left border-l-4
                                ${BARRA[r.estado]} ${i > 0 ? 'border-t border-hairline' : ''}
                                transition-colors hover:bg-slate-50`}
                  >
                    <span className="text-[14px] font-semibold text-ink flex-1 min-w-[180px]">{r.aspecto_legal}</span>
                    <span className="text-xs text-slate w-[130px] shrink-0">{responsable?.nombre || '—'}</span>
                    <span className="text-xs text-slate w-[90px] shrink-0 whitespace-nowrap">
                      {vencimiento ? formatFecha(vencimiento.toISOString().split('T')[0]) : '—'}
                    </span>
                    <Badge estado={r.estado} />
                  </button>
                )
              })}
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
