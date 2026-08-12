'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import {
  HardHat, Settings, Plus, ChevronDown, ChevronUp, ArrowRight,
  X, Loader2, User, FileText, Building
} from 'lucide-react'
import {
  calcEstado, peorEstado, formatFecha,
  Dot, Badge, Card, BtnPrimary, BtnGhost, EmptyState
} from './ui'

export default function DashboardContratistas({ cliente, esAdmin, onVerEmpresa, onNuevaEmpresa, onConfig }) {
  const [cargando, setCargando] = useState(true)
  const [datos, setDatos] = useState([])
  const [expandido, setExpandido] = useState(null)
  const [confirmBaja, setConfirmBaja] = useState(null)

  useEffect(() => { cargar() }, [cliente.id])

  const cargar = async () => {
    setCargando(true)
    const { data: contras } = await supabase
      .from('contratistas').select('*')
      .eq('cliente_id', cliente.id).eq('activo', true).order('nombre')

    if (!contras?.length) { setDatos([]); setCargando(false); return }

    const [{ data: docsReq }, { data: docsEmp }, { data: trabs }, { data: docsTrab }] = await Promise.all([
      supabase.from('documentos_requeridos').select('*').eq('cliente_id', cliente.id).eq('activo', true),
      supabase.from('docs_empresa').select('*'),
      supabase.from('contratista_trabajadores').select('*').eq('activo', true),
      supabase.from('docs_trabajador').select('*'),
    ])

    const resultado = contras.map(c => {
      const reqEmp = (docsReq || []).filter(d => d.aplica_a === 'empresa')
      const docsDE = (docsEmp || []).filter(d => d.contratista_id === c.id)
      const trabsC = (trabs || []).filter(t => t.contratista_id === c.id)

      const estEmp = reqEmp.map(req => {
        const e = docsDE.find(d => d.documento_id === req.id)
        const aplica = e ? e.aplica !== false : true
        return { doc: req, estado: calcEstado(aplica, e?.recibido, e?.fecha_vencimiento), vencimiento: e?.fecha_vencimiento }
      })

      const detalleTrab = trabsC.map(t => {
        const req = (docsReq || []).filter(d => ['ambos_trabajadores', t.tipo].includes(d.aplica_a))
        const dt = (docsTrab || []).filter(d => d.trabajador_id === t.id)
        const estados = req.map(r => {
          const e = dt.find(d => d.documento_id === r.id)
          const aplica = e ? e.aplica !== false : true
          return { doc: r, estado: calcEstado(aplica, e?.recibido, e?.fecha_vencimiento), vencimiento: e?.fecha_vencimiento }
        })
        return { ...t, estados, estadoGlobal: peorEstado(estados.map(x => x.estado)) }
      })

      const todos = [...estEmp.map(e => e.estado), ...detalleTrab.flatMap(t => t.estados.map(x => x.estado))]
      const resumen = {
        verde: todos.filter(e => e === 'verde').length,
        amarillo: todos.filter(e => e === 'amarillo').length,
        rojo: todos.filter(e => e === 'rojo').length,
        total: todos.filter(e => e !== 'no_aplica').length,
      }

      return { contratista: c, estadoGlobal: peorEstado(todos), resumen, detalleEmpresa: estEmp, detalleTrabajadores: detalleTrab }
    })

    setDatos(resultado)
    setCargando(false)
  }

  const darDeBaja = async (id) => {
    await supabase.from('contratistas').update({ activo: false }).eq('id', id)
    setConfirmBaja(null)
    await cargar()
  }

  const totales = {
    total: datos.length,
    verde: datos.filter(d => d.estadoGlobal === 'verde').length,
    amarillo: datos.filter(d => d.estadoGlobal === 'amarillo').length,
    rojo: datos.filter(d => d.estadoGlobal === 'rojo').length,
    sin_docs: datos.filter(d => d.estadoGlobal === 'sin_docs').length,
  }

  const ordenados = [...datos].sort((a, b) => {
    const ord = { rojo: 0, amarillo: 1, sin_docs: 2, verde: 3 }
    return (ord[a.estadoGlobal] ?? 4) - (ord[b.estadoGlobal] ?? 4)
  })

  if (cargando) return (
    <div className="flex items-center justify-center gap-2.5 py-20 text-slate">
      <Loader2 className="w-5 h-5 animate-spin" strokeWidth={2} />
      Cargando contratistas...
    </div>
  )

  return (
    <div className="max-w-[960px] mx-auto p-5 md:p-8">

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3 mb-6">
        <div>
          <h2 className="text-xl md:text-[22px] font-bold text-ink tracking-tight">Control de Contratistas</h2>
          <p className="text-sm text-slate mt-0.5">Cliente: <span className="font-semibold text-ink">{cliente.nombre}</span></p>
        </div>
        <div className="flex flex-wrap gap-2.5">
          {esAdmin && (
            <BtnGhost onClick={onConfig}>
              <Settings className="w-4 h-4" strokeWidth={1.8} />
              Configurar documentos
            </BtnGhost>
          )}
          <BtnPrimary onClick={onNuevaEmpresa}>
            <Plus className="w-4 h-4" strokeWidth={2.2} />
            Nueva empresa
          </BtnPrimary>
        </div>
      </div>

      {/* Tarjetas resumen */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-2.5 mb-6">
        {[
          { label: 'Total',      valor: totales.total,    cls: 'bg-white text-ink border-hairline' },
          { label: 'Vigentes',   valor: totales.verde,    cls: 'bg-green-50 text-green-800 border-green-200' },
          { label: 'Por vencer', valor: totales.amarillo, cls: 'bg-yellow-50 text-yellow-800 border-yellow-200' },
          { label: 'Vencidos',   valor: totales.rojo,     cls: 'bg-red-50 text-red-800 border-red-200' },
          { label: 'Sin docs',   valor: totales.sin_docs, cls: 'bg-slate-100 text-slate border-slate-200' },
        ].map(({ label, valor, cls }) => (
          <div key={label} className={`border rounded-xl px-3 py-4 text-center ${cls}`}>
            <p className="text-[28px] font-bold leading-none">{valor}</p>
            <p className="text-xs font-semibold mt-1.5 opacity-80">{label}</p>
          </div>
        ))}
      </div>

      {/* Lista */}
      {ordenados.length === 0 ? (
        <Card>
          <EmptyState
            Icon={HardHat}
            title="No hay contratistas registrados"
            desc='Hacé clic en "Nueva empresa" para agregar el primero.'
          />
        </Card>
      ) : (
        <div className="flex flex-col gap-2.5">
          {ordenados.map(d => (
            <Card key={d.contratista.id} className="overflow-hidden">

              {/* Fila principal */}
              <div className="flex flex-wrap items-center gap-3 p-4 md:px-5">
                <Dot estado={d.estadoGlobal} />
                <div className="flex-1 min-w-0">
                  <p className="text-[15px] font-semibold text-ink truncate">{d.contratista.nombre}</p>
                  {d.contratista.contacto && (
                    <p className="text-xs text-slate mt-0.5">{d.contratista.contacto}</p>
                  )}
                </div>

                {/* Barra de progreso */}
                {d.resumen.total > 0 && (
                  <div className="w-full md:w-[130px] order-last md:order-none">
                    <div className="flex h-1.5 rounded-full overflow-hidden gap-px mb-1">
                      {d.resumen.verde > 0    && <div className="bg-green-600"  style={{ flex: d.resumen.verde }} />}
                      {d.resumen.amarillo > 0 && <div className="bg-yellow-500" style={{ flex: d.resumen.amarillo }} />}
                      {d.resumen.rojo > 0     && <div className="bg-red-600"    style={{ flex: d.resumen.rojo }} />}
                    </div>
                    <p className="text-[11px] text-slate flex gap-2">
                      {d.resumen.verde > 0    && <span className="text-green-700">✓ {d.resumen.verde}</span>}
                      {d.resumen.amarillo > 0 && <span className="text-yellow-700">⚠ {d.resumen.amarillo}</span>}
                      {d.resumen.rojo > 0     && <span className="text-red-700">✗ {d.resumen.rojo}</span>}
                    </p>
                  </div>
                )}

                <Badge estado={d.estadoGlobal} />

                <div className="flex gap-2">
                  <button
                    onClick={() => onVerEmpresa(d.contratista)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md text-[13px] font-semibold
                               text-slate border-[1.5px] border-hairline transition-colors
                               hover:border-accent hover:text-accent"
                  >
                    Ver ficha
                    <ArrowRight className="w-3.5 h-3.5" strokeWidth={2} />
                  </button>
                  <button
                    onClick={() => setExpandido(expandido === d.contratista.id ? null : d.contratista.id)}
                    className="px-2.5 py-2 rounded-md text-slate border-[1.5px] border-hairline
                               transition-colors hover:border-accent hover:text-accent"
                  >
                    {expandido === d.contratista.id
                      ? <ChevronUp className="w-4 h-4" strokeWidth={2} />
                      : <ChevronDown className="w-4 h-4" strokeWidth={2} />}
                  </button>

                  {confirmBaja === d.contratista.id ? (
                    <div className="flex items-center gap-1.5">
                      <span className="text-[13px] text-danger font-medium">¿Dar de baja?</span>
                      <button onClick={() => darDeBaja(d.contratista.id)}
                        className="px-3 py-2 rounded-md text-[13px] font-semibold text-white bg-danger hover:bg-red-800 transition-colors">
                        Sí
                      </button>
                      <button onClick={() => setConfirmBaja(null)}
                        className="px-2.5 py-2 rounded-md text-[13px] font-semibold text-slate border-[1.5px] border-hairline">
                        No
                      </button>
                    </div>
                  ) : (
                    <button onClick={() => setConfirmBaja(d.contratista.id)}
                      title="Dar de baja"
                      className="px-2.5 py-2 rounded-md text-danger border-[1.5px] border-red-200
                                 transition-colors hover:bg-red-50">
                      <X className="w-4 h-4" strokeWidth={2} />
                    </button>
                  )}
                </div>
              </div>

              {/* Panel expandido */}
              {expandido === d.contratista.id && (
                <div className="bg-slate-50 border-t border-hairline p-4 md:px-5 md:py-5">

                  {d.detalleEmpresa.length > 0 && (
                    <div className="mb-4">
                      <p className="text-[11px] font-bold text-slate uppercase tracking-wider mb-2 flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5" strokeWidth={2} />
                        Documentos de la empresa
                      </p>
                      <div className="flex flex-col gap-1.5">
                        {d.detalleEmpresa.map(({ doc, estado, vencimiento }) => (
                          <div key={doc.id}
                            className={`flex flex-wrap items-center gap-2 px-3 py-2 bg-white rounded-md border border-hairline
                                        ${estado === 'no_aplica' ? 'opacity-50' : ''}`}>
                            <Dot estado={estado} />
                            <span className="text-[13px] text-ink flex-1">{doc.nombre}</span>
                            {vencimiento && estado !== 'no_aplica' && (
                              <span className="text-[11px] text-slate">Vence: {formatFecha(vencimiento)}</span>
                            )}
                            <Badge estado={estado} />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {d.detalleTrabajadores.length > 0 && (
                    <div>
                      <p className="text-[11px] font-bold text-slate uppercase tracking-wider mb-2 flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5" strokeWidth={2} />
                        Trabajadores ({d.detalleTrabajadores.length})
                      </p>
                      <div className="flex flex-col gap-1.5">
                        {d.detalleTrabajadores.map(t => (
                          <div key={t.id} className="flex items-center gap-2.5 px-3 py-2 bg-white rounded-md border border-hairline">
                            <User className="w-4 h-4 text-slate shrink-0" strokeWidth={1.8} />
                            <span className="text-[13px] font-semibold text-ink flex-1">
                              {t.apellido}, {t.nombre}
                            </span>
                            <span className="text-[11px] text-slate">
                              {t.tipo === 'dependencia' ? 'Dependencia' : 'Monotributista'}
                            </span>
                            <Badge estado={t.estadoGlobal} />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {d.detalleEmpresa.length === 0 && d.detalleTrabajadores.length === 0 && (
                    <p className="text-sm text-slate text-center py-3">Sin documentación configurada.</p>
                  )}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
