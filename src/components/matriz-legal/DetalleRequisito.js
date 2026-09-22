'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { ArrowLeft, Pencil, Trash2, Loader2, Plus, Paperclip, Upload } from 'lucide-react'
import { Card, Label, Input, BtnPrimary, BtnGhost } from '../contratistas/ui'
import { calcularEstadoRequisito, calcularVencimiento, SEMAFORO_MATRIZ } from './logica'

const formatFecha = (f) => f
  ? new Date(f + 'T00:00:00').toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })
  : null

const formatFechaHora = (f) => new Date(f).toLocaleString('es-AR', {
  day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
})

const PRESETS_AVANCE = [
  { label: 'En trámite', color: '#3B82F6', chip: 'bg-blue-50 text-blue-800' },
  { label: 'Esperando respuesta', color: '#EAB308', chip: 'bg-yellow-50 text-yellow-800' },
  { label: 'Documentación enviada', color: '#8B5CF6', chip: 'bg-purple-50 text-purple-800' },
  { label: 'Resuelto / Cumplido', color: '#16A365', chip: 'bg-green-50 text-green-800' },
]

const estiloAvance = (texto) => PRESETS_AVANCE.find(p => p.label === texto) || { color: '#94A3B8', chip: 'bg-slate-100 text-slate-700' }

export default function DetalleRequisito({ cliente, establecimiento, requisito, user, esAdmin, onVolver, onEditar, onEliminado }) {
  const [config, setConfig] = useState(null)
  const [categoria, setCategoria] = useState(null)
  const [responsable, setResponsable] = useState(null)
  const [seguimientos, setSeguimientos] = useState([])
  const [cargando, setCargando] = useState(true)
  const [confirmDel, setConfirmDel] = useState(false)

  const [mostrarForm, setMostrarForm] = useState(false)
  const [estadoAvance, setEstadoAvance] = useState('')
  const [nota, setNota] = useState('')
  const [documentoSeg, setDocumentoSeg] = useState('')
  const [subiendoArchivoSeg, setSubiendoArchivoSeg] = useState(false)
  const [guardandoSeg, setGuardandoSeg] = useState(false)

  useEffect(() => { cargar() }, [requisito.id])

  const cargar = async () => {
    setCargando(true)
    const [{ data: configData }, { data: cat }, { data: resp }, { data: segs }] = await Promise.all([
      supabase.from('matriz_config').select('*').eq('cliente_id', cliente.id).maybeSingle(),
      requisito.categoria_id ? supabase.from('matriz_categorias').select('*').eq('id', requisito.categoria_id).single() : Promise.resolve({ data: null }),
      requisito.responsable_id ? supabase.from('matriz_responsables').select('*').eq('id', requisito.responsable_id).single() : Promise.resolve({ data: null }),
      supabase.from('matriz_seguimientos').select('*').eq('requisito_id', requisito.id).order('fecha_hora', { ascending: false }),
    ])
    setConfig(configData)
    setCategoria(cat)
    setResponsable(resp)
    setSeguimientos(segs || [])
    setCargando(false)
  }

  const subirArchivoSeguimiento = async (file) => {
    if (!file) return
    setSubiendoArchivoSeg(true)
    const ext = file.name.split('.').pop()
    const path = `${requisito.id}-seg-${Date.now()}.${ext}`
    const { error } = await supabase.storage.from('documentos-legales').upload(path, file)
    if (!error) {
      const { data } = supabase.storage.from('documentos-legales').getPublicUrl(path)
      setDocumentoSeg(data.publicUrl)
    }
    setSubiendoArchivoSeg(false)
  }

  const agregarSeguimiento = async () => {
    if (!estadoAvance.trim()) return
    setGuardandoSeg(true)
    await supabase.from('matriz_seguimientos').insert({
      requisito_id: requisito.id,
      usuario_id: user?.id || null,
      estado_avance: estadoAvance.trim(),
      nota: nota.trim() || null,
      documento_url: documentoSeg.trim() || null,
    })
    setEstadoAvance(''); setNota(''); setDocumentoSeg(''); setMostrarForm(false)
    await cargar()
    setGuardandoSeg(false)
  }

  const eliminar = async () => {
    await supabase.from('matriz_requisitos').update({ activo: false }).eq('id', requisito.id)
    onEliminado()
  }

  if (cargando) return (
    <div className="flex items-center justify-center gap-2.5 py-20 text-slate">
      <Loader2 className="w-5 h-5 animate-spin" strokeWidth={2} />
      Cargando...
    </div>
  )

  const estado = calcularEstadoRequisito(requisito, config)
  const s = SEMAFORO_MATRIZ[estado]
  const vencimiento = calcularVencimiento(requisito)
  const hoy = new Date(); hoy.setHours(0, 0, 0, 0)
  const diasRestantes = vencimiento ? Math.ceil((vencimiento - hoy) / 86400000) : null

  return (
    <div className="max-w-[820px] mx-auto p-5 md:p-8">

      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <BtnGhost onClick={onVolver}>
          <ArrowLeft className="w-4 h-4" strokeWidth={2} />
          Volver a la matriz
        </BtnGhost>
        <div className="flex gap-2.5">
          <button onClick={() => onEditar(requisito)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md text-[13px] font-semibold text-slate
                       border-[1.5px] border-hairline transition-colors hover:border-accent hover:text-accent">
            <Pencil className="w-3.5 h-3.5" strokeWidth={2} />
            Editar
          </button>
          {confirmDel ? (
            <div className="flex items-center gap-1.5">
              <span className="text-[13px] text-danger font-semibold">¿Eliminar?</span>
              <button onClick={eliminar} className="px-3 py-2 rounded-md text-[13px] font-semibold text-white bg-danger hover:bg-red-800">Sí</button>
              <button onClick={() => setConfirmDel(false)} className="px-2.5 py-2 rounded-md text-[13px] font-semibold text-slate border-[1.5px] border-hairline">No</button>
            </div>
          ) : (
            <button onClick={() => setConfirmDel(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md text-[13px] font-semibold text-danger
                         border-[1.5px] border-red-200 transition-colors hover:bg-red-50">
              <Trash2 className="w-3.5 h-3.5" strokeWidth={2} />
              Eliminar
            </button>
          )}
        </div>
      </div>

      {/* Encabezado */}
      <Card className="p-6 md:p-7 mb-3.5">
        <span className="inline-block text-[11px] font-bold text-slate bg-slate-100 px-2.5 py-1 rounded-md uppercase tracking-wide mb-3">
          {categoria?.nombre || 'Sin categoría'}
        </span>
        <h2 className="text-xl md:text-[22px] font-bold text-ink tracking-tight mb-4">{requisito.aspecto_legal}</h2>
        <div className="flex flex-wrap items-center gap-3.5">
          <span className={`inline-flex items-center gap-2 font-bold text-sm px-4 py-2 rounded-lg border ${s.chip}`}>
            <span className={`w-2.5 h-2.5 rounded-full ${s.dot}`} />
            {s.label}
          </span>
          {vencimiento && (
            <span className="text-sm text-slate">
              {diasRestantes < 0
                ? <>Venció el <strong className="text-ink">{formatFecha(vencimiento.toISOString().split('T')[0])}</strong> · hace {Math.abs(diasRestantes)} días</>
                : <>Vence el <strong className="text-ink">{formatFecha(vencimiento.toISOString().split('T')[0])}</strong> · en {diasRestantes} días</>}
            </span>
          )}
        </div>
      </Card>

      {/* Datos generales */}
      <Card className="p-6 mb-3.5">
        <p className="text-[13px] font-bold text-ink uppercase tracking-wide pb-3 mb-4 border-b border-hairline">Datos generales</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            ['Categoría', categoria?.nombre],
            ['Responsable', responsable?.nombre],
            ['Organismo', requisito.organismo],
            ['Entregable', requisito.entregable],
            ['Referencia / Matrícula / Expediente', requisito.referencia],
            ['Establecimiento', establecimiento.nombre],
          ].map(([label, val]) => (
            <div key={label}>
              <Label>{label}</Label>
              <p className={val ? 'text-[15px] text-ink font-medium' : 'text-[15px] text-slate-300 italic'}>{val || 'No cargado'}</p>
            </div>
          ))}
        </div>
        {requisito.documento_url && (
          <a href={requisito.documento_url} target="_blank" rel="noopener noreferrer"
             className="inline-flex items-center gap-1.5 mt-4 pt-4 border-t border-hairline text-[13.5px] font-semibold text-accent hover:underline">
            <Paperclip className="w-4 h-4" strokeWidth={2} />
            Ver documento adjunto
          </a>
        )}
      </Card>

      {/* Vencimiento */}
      <Card className="p-6 mb-3.5">
        <p className="text-[13px] font-bold text-ink uppercase tracking-wide pb-3 mb-4 border-b border-hairline">Vencimiento</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>Fecha de presentación</Label>
            <p className={requisito.fecha_presentacion ? 'text-[15px] text-ink font-medium' : 'text-[15px] text-slate-300 italic'}>
              {formatFecha(requisito.fecha_presentacion) || 'No cargada'}
            </p>
          </div>
          <div>
            <Label>Frecuencia</Label>
            <p className="text-[15px] text-ink font-medium">{requisito.frecuencia_dias ? `${requisito.frecuencia_dias} días` : 'Sin vencimiento'}</p>
          </div>
          <div>
            <Label>Vencimiento calculado</Label>
            <p className="text-[15px] text-ink font-medium">{vencimiento ? formatFecha(vencimiento.toISOString().split('T')[0]) : '—'}</p>
          </div>
          <div>
            <Label>Días restantes</Label>
            <p className="text-[15px] text-ink font-medium">
              {diasRestantes === null ? '—' : diasRestantes < 0 ? `${diasRestantes} días (vencido)` : `${diasRestantes} días`}
            </p>
          </div>
        </div>
      </Card>

      {/* Seguimiento y trazabilidad */}
      <Card className="p-6 mb-3.5">
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-hairline">
          <p className="text-[13px] font-bold text-ink uppercase tracking-wide">Seguimiento y trazabilidad</p>
          <button onClick={() => setMostrarForm(!mostrarForm)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[12.5px] font-semibold text-white bg-accent hover:bg-accent-hover transition-colors">
            <Plus className="w-3.5 h-3.5" strokeWidth={2.2} />
            Agregar seguimiento
          </button>
        </div>

        {mostrarForm && (
          <div className="bg-slate-50 border border-hairline rounded-lg p-4 mb-4">
            <Label>Estado de avance</Label>
            <div className="flex flex-wrap gap-2 mb-3">
              {PRESETS_AVANCE.map(p => (
                <button key={p.label} onClick={() => setEstadoAvance(p.label)}
                  className={`px-3 py-1.5 rounded-full text-[12.5px] font-semibold border-[1.5px] transition-colors
                    ${estadoAvance === p.label ? 'border-accent bg-accent-light text-accent' : 'border-hairline text-slate hover:border-accent'}`}>
                  {p.label}
                </button>
              ))}
            </div>
            <Input placeholder="O escribí un estado personalizado..." value={estadoAvance}
              onChange={e => setEstadoAvance(e.target.value)} className="mb-3" />
            <Label>Nota (opcional)</Label>
            <textarea
              value={nota} onChange={e => setNota(e.target.value)}
              rows={2} placeholder="¿Qué se hizo? ¿Con quién se habló?..."
              className="w-full mb-3 px-3.5 py-2.5 text-[15px] text-ink bg-white border-[1.5px] border-hairline
                         rounded-md outline-none focus:border-accent resize-none placeholder:text-slate-400"
            />
            <Label>Documento / Enlace (opcional)</Label>
            <div className="flex flex-col sm:flex-row gap-2.5 mb-3">
              <Input
                placeholder="Pegá un enlace (Google Drive, etc.)..."
                value={documentoSeg}
                onChange={e => setDocumentoSeg(e.target.value)}
                className="flex-1"
              />
              <label className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-md text-[13px] font-semibold
                                 text-slate border-[1.5px] border-hairline cursor-pointer transition-colors
                                 hover:border-accent hover:text-accent whitespace-nowrap">
                {subiendoArchivoSeg ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" strokeWidth={2} />
                    Subiendo...
                  </>
                ) : (
                  <>
                    <Upload className="w-3.5 h-3.5" strokeWidth={1.8} />
                    Subir archivo
                  </>
                )}
                <input type="file" className="hidden" disabled={subiendoArchivoSeg}
                  onChange={e => subirArchivoSeguimiento(e.target.files?.[0])} />
              </label>
            </div>
            <BtnPrimary onClick={agregarSeguimiento} disabled={guardandoSeg || !estadoAvance.trim()} className="px-5 py-2 text-[13px]">
              {guardandoSeg ? 'Guardando...' : 'Guardar seguimiento'}
            </BtnPrimary>
          </div>
        )}

        {seguimientos.length === 0 ? (
          <p className="text-sm text-slate italic">Sin seguimientos registrados todavía.</p>
        ) : (
          <div>
            {seguimientos.map((seg, i) => {
              const est = estiloAvance(seg.estado_avance)
              return (
                <div key={seg.id} className="relative pl-6 pb-5 last:pb-0">
                  {i < seguimientos.length - 1 && (
                    <span className="absolute left-[5px] top-4 bottom-0 w-[2px] bg-hairline" />
                  )}
                  <span className="absolute left-0 top-[3px] w-3 h-3 rounded-full border-2 border-white shadow-[0_0_0_1px_#E2E8F0]"
                    style={{ backgroundColor: est.color }} />
                  <div className="flex flex-wrap items-center gap-2.5 mb-1">
                    <span className="text-xs font-semibold text-slate-400">{formatFechaHora(seg.fecha_hora)}</span>
                    <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${est.chip}`}>{seg.estado_avance}</span>
                  </div>
                  {seg.nota && <p className="text-[13.5px] text-ink leading-relaxed">{seg.nota}</p>}
                  {seg.documento_url && (
                    <a href={seg.documento_url} target="_blank" rel="noopener noreferrer"
                       className="inline-flex items-center gap-1 mt-1 text-xs font-semibold text-accent hover:underline">
                      <Paperclip className="w-3 h-3" strokeWidth={2} />
                      Ver documento
                    </a>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </Card>

      {/* Reglamentación */}
      {requisito.reglamentacion && (
        <Card className="p-6 mb-3.5">
          <p className="text-[13px] font-bold text-ink uppercase tracking-wide pb-3 mb-4 border-b border-hairline">Reglamentación aplicable</p>
          <p className="text-[14.5px] text-ink leading-relaxed whitespace-pre-line">{requisito.reglamentacion}</p>
        </Card>
      )}

      {/* Observaciones */}
      {requisito.observacion && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl px-5 py-4">
          <p className="text-[11px] font-bold text-yellow-800 uppercase tracking-wide mb-1.5">Observaciones</p>
          <p className="text-[14px] text-yellow-900 leading-relaxed">{requisito.observacion}</p>
        </div>
      )}
    </div>
  )
}
