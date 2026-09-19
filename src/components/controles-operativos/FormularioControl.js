'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import {
  ArrowLeft, ArrowRight, Plus, Loader2, Check,
  CircleCheck, CircleAlert, CircleX, Printer, Camera, X as XIcon
} from 'lucide-react'
import { Card, CardTitle, Label, Input, Select, BtnPrimary, BtnGhost, EmptyState } from '../contratistas/ui'
import ImprimirControl from './ImprimirControl'
import { comprimirImagen } from '@/lib/comprimirImagen'
import { nombreArchivoControl } from '@/lib/nombreArchivo'

const RESULTADOS = [
  { value: 'aprobado',       label: 'Aprobado',                     Icon: CircleCheck, cls: 'border-green-600 bg-green-50 text-green-700' },
  { value: 'observaciones',  label: 'Aprobado con observaciones',   Icon: CircleAlert, cls: 'border-yellow-600 bg-yellow-50 text-yellow-700' },
  { value: 'rechazado',      label: 'Rechazado / fuera de servicio',Icon: CircleX,     cls: 'border-red-600 bg-red-50 text-red-700' },
]

// ─── SELECTOR SI / NO / N/A ───────────────────────────────────────────────────
function RespuestaBtns({ valor, onChange }) {
  const opciones = [
    { v: 'SI',  label: 'Sí',  sel: 'bg-green-600 text-white border-green-600', idle: 'border-hairline text-slate hover:border-green-600 hover:text-green-700' },
    { v: 'NO',  label: 'No',  sel: 'bg-red-600 text-white border-red-600',     idle: 'border-hairline text-slate hover:border-red-600 hover:text-red-700' },
    { v: 'N/A', label: 'N/A', sel: 'bg-slate-500 text-white border-slate-500', idle: 'border-hairline text-slate hover:border-slate-500' },
  ]
  return (
    <div className="flex gap-1.5 shrink-0">
      {opciones.map(o => (
        <button
          key={o.v}
          onClick={() => onChange(valor === o.v ? null : o.v)}
          className={`px-3 py-1.5 rounded-md text-[13px] font-semibold border-[1.5px] transition-colors
                      ${valor === o.v ? o.sel : o.idle}`}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

// ─── PASO 0: SELECCIÓN / ALTA DE EQUIPO ──────────────────────────────────────
function SelectorEquipo({ tema, cliente, onSeleccionar, onVolver }) {
  const [equipos, setEquipos] = useState([])
  const [cargando, setCargando] = useState(true)
  const [mostrarForm, setMostrarForm] = useState(false)
  const [form, setForm] = useState({ codigo: '', ubicacion: '' })
  const [guardando, setGuardando] = useState(false)

  useEffect(() => { cargar() }, [tema.id])

  const cargar = async () => {
    const { data } = await supabase.from('co_equipos').select('*')
      .eq('cliente_id', cliente.id).eq('tema_id', tema.id).eq('activo', true).order('codigo')
    setEquipos(data || [])
    setCargando(false)
  }

  const crear = async () => {
    if (!form.codigo.trim()) return
    setGuardando(true)
    const { data } = await supabase.from('co_equipos')
      .insert({ cliente_id: cliente.id, tema_id: tema.id, codigo: form.codigo, ubicacion: form.ubicacion })
      .select().single()
    setGuardando(false)
    if (data) onSeleccionar(data)
  }

  if (cargando) return (
    <div className="flex items-center justify-center gap-2.5 py-20 text-slate">
      <Loader2 className="w-5 h-5 animate-spin" strokeWidth={2} />
      Cargando equipos...
    </div>
  )

  return (
    <div className="max-w-[700px] mx-auto p-5 md:p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-ink tracking-tight">{tema.nombre}</h2>
          <p className="text-sm text-slate mt-0.5">Seleccioná el equipo a controlar</p>
        </div>
        <BtnGhost onClick={onVolver}>
          <ArrowLeft className="w-4 h-4" strokeWidth={2} />
          Volver
        </BtnGhost>
      </div>

      {equipos.length === 0 && !mostrarForm && (
        <Card><EmptyState title="No hay equipos cargados para este tema" desc="Agregá el primero para empezar." /></Card>
      )}

      {equipos.length > 0 && (
        <div className="flex flex-col gap-2 mb-5">
          {equipos.map(e => (
            <button key={e.id} onClick={() => onSeleccionar(e)}
              className="flex items-center justify-between text-left bg-white border border-hairline rounded-lg px-4 py-3.5
                         transition-colors hover:border-accent">
              <div>
                <p className="text-[15px] font-semibold text-ink">{e.codigo}</p>
                {e.ubicacion && <p className="text-[13px] text-slate mt-0.5">{e.ubicacion}</p>}
              </div>
              <ArrowRight className="w-4 h-4 text-slate" strokeWidth={2} />
            </button>
          ))}
        </div>
      )}

      {mostrarForm ? (
        <Card className="p-6">
          <CardTitle>Nuevo equipo</CardTitle>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
            <div>
              <Label>Código / identificación *</Label>
              <Input placeholder="Ej: TE-01" value={form.codigo}
                onChange={e => setForm({ ...form, codigo: e.target.value })} />
            </div>
            <div>
              <Label>Ubicación</Label>
              <Input placeholder="Ej: Sector depósito" value={form.ubicacion}
                onChange={e => setForm({ ...form, ubicacion: e.target.value })} />
            </div>
          </div>
          <div className="flex gap-2.5">
            <BtnPrimary onClick={crear} disabled={guardando || !form.codigo.trim()}>
              {guardando ? 'Guardando...' : 'Guardar y continuar'}
            </BtnPrimary>
            <BtnGhost onClick={() => setMostrarForm(false)}>Cancelar</BtnGhost>
          </div>
        </Card>
      ) : (
        <BtnPrimary onClick={() => setMostrarForm(true)}>
          <Plus className="w-4 h-4" strokeWidth={2.2} />
          Nuevo equipo
        </BtnPrimary>
      )}
    </div>
  )
}

// ─── FORMULARIO PRINCIPAL DEL CHECKLIST ──────────────────────────────────────
function Checklist({ tema, cliente, equipo, user, onVolver, onGuardado }) {
  const [items, setItems] = useState([])
  const [auditores, setAuditores] = useState([])
  const [responsables, setResponsables] = useState([])
  const [cargando, setCargando] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [guardado, setGuardado] = useState(false)

  // NOTA: "subsector" = campo opcional nuevo. "sector" ahora reemplaza al antiguo "ubicacion".
  const [cabecera, setCabecera] = useState({
    fecha: new Date().toISOString().split('T')[0],
    responsable: '', auditor: '', subsector: '', sector: equipo?.ubicacion || '',
  })
  const [respuestas, setRespuestas] = useState({})
  const [observaciones, setObservaciones] = useState({})
  const [fotosFiles, setFotosFiles] = useState({})
  const [fotosPreview, setFotosPreview] = useState({})
  const [epigrafes, setEpigrafes] = useState({})
  const [respuestasFinal, setRespuestasFinal] = useState([])
  const [resultado, setResultado] = useState('')
  const [obsGenerales, setObsGenerales] = useState('')
  const [plazoCorreccion, setPlazoCorreccion] = useState('')
  const [respCorreccion, setRespCorreccion] = useState('')
  const [imprimir, setImprimir] = useState(false)

  useEffect(() => { cargarTodo() }, [tema.id])

  // Pre-completa "Responsable de la corrección" con el Responsable del control,
  // la primera vez que aparece el bloque (el auditor puede cambiarlo si corresponde a otra persona)
  useEffect(() => {
    if ((resultado === 'observaciones' || resultado === 'rechazado') && !respCorreccion && cabecera.responsable) {
      setRespCorreccion(cabecera.responsable)
    }
  }, [resultado])

  useEffect(() => {
    if (!imprimir) return
    const tituloOriginal = document.title
    let cancelado = false
    const imprimirCuandoListo = async () => {
      await new Promise(r => setTimeout(r, 50)) // deja que React pinte el DOM
      const imgs = Array.from(document.querySelectorAll('.printable-area img'))
      await Promise.all(imgs.map(img => {
        if (img.complete) return Promise.resolve()
        return new Promise(resolve => {
          img.onload = resolve
          img.onerror = resolve
          setTimeout(resolve, 4000) // salvavidas si la imagen tarda demasiado
        })
      }))
      if (!cancelado) {
        document.title = nombreArchivoControl({
          tema: tema.nombre, cliente: cliente.nombre,
          equipoCodigo: equipo?.codigo, fecha: cabecera.fecha,
        })
        window.print()
      }
    }
    imprimirCuandoListo()
    const handleAfterPrint = () => { document.title = tituloOriginal; setImprimir(false) }
    window.addEventListener('afterprint', handleAfterPrint)
    return () => { cancelado = true; document.title = tituloOriginal; window.removeEventListener('afterprint', handleAfterPrint) }
  }, [imprimir])

  const cargarTodo = async () => {
    const [{ data: itemsData }, { data: auditoresData }, { data: responsablesData }] = await Promise.all([
      supabase.from('co_items_catalogo').select('*').eq('tema_id', tema.id).eq('activo', true).order('orden'),
      supabase.from('co_auditores').select('*').eq('activo', true).order('nombre'),
      supabase.from('co_responsables').select('*').eq('cliente_id', cliente.id).eq('activo', true).order('nombre'),
    ])
    setItems(itemsData || [])
    setAuditores(auditoresData || [])
    setResponsables(responsablesData || [])
    setCargando(false)
  }

  const manejarFoto = (itemId, file) => {
    if (!file) return
    setFotosFiles(prev => ({ ...prev, [itemId]: file }))
    setFotosPreview(prev => ({ ...prev, [itemId]: URL.createObjectURL(file) }))
  }

  const quitarFoto = (itemId) => {
    setFotosFiles(prev => { const n = { ...prev }; delete n[itemId]; return n })
    setFotosPreview(prev => { const n = { ...prev }; delete n[itemId]; return n })
    setEpigrafes(prev => { const n = { ...prev }; delete n[itemId]; return n })
  }

  const categorias = []
  items.forEach(it => {
    const cat = it.categoria || null
    if (!categorias.some(c => c.nombre === cat)) categorias.push({ nombre: cat, items: [] })
    categorias.find(c => c.nombre === cat).items.push(it)
  })

  const respondidos = Object.keys(respuestas).filter(k => respuestas[k]).length
  const siCount = Object.values(respuestas).filter(r => r === 'SI').length
  const noCount = Object.values(respuestas).filter(r => r === 'NO').length
  const evaluables = siCount + noCount
  const porcentaje = evaluables > 0 ? Math.round((siCount / evaluables) * 100) : 0

  const puedeGuardar = cabecera.responsable.trim() && resultado && respondidos > 0

  // Busca la matrícula del auditor seleccionado (si viene de la lista) para incluirla en el PDF
  const matriculaAuditor = auditores.find(a => a.nombre === cabecera.auditor)?.matricula || null

  const guardar = async () => {
    if (!puedeGuardar) return
    setGuardando(true)

    const { data: control } = await supabase.from('co_controles').insert({
      cliente_id: cliente.id,
      tema_id: tema.id,
      equipo_id: equipo?.id || null,
      usuario_id: user.id,
      fecha: cabecera.fecha,
      responsable: cabecera.responsable,
      auditor: cabecera.auditor,
      sector: cabecera.subsector,      // el campo DB "sector" ahora guarda el Subsector (opcional)
      ubicacion: cabecera.sector,      // el campo DB "ubicacion" ahora guarda el Sector (antes Ubicación)
      resultado,
      observaciones_generales: obsGenerales,
      plazo_correccion: plazoCorreccion || null,
      responsable_correccion: respCorreccion || null,
      porcentaje_cumplimiento: porcentaje,
      datos_extra: { auditor_matricula: matriculaAuditor },
    }).select().single()

    let filas = []
    if (control) {
      filas = await Promise.all(
        items.filter(it => respuestas[it.id]).map(async (it) => {
          let foto_url = null
          let foto_epigrafe = null
          if (respuestas[it.id] === 'NO' && fotosFiles[it.id]) {
            try {
              const blob = await comprimirImagen(fotosFiles[it.id])
              const path = `${control.id}-${it.id}-${Date.now()}.jpg`
              const { error } = await supabase.storage
                .from('fotos-desvios')
                .upload(path, blob, { contentType: 'image/jpeg' })
              if (!error) {
                const { data: pub } = supabase.storage.from('fotos-desvios').getPublicUrl(path)
                foto_url = pub.publicUrl
                foto_epigrafe = epigrafes[it.id]?.trim() || null
              }
            } catch (e) {
              console.error('Error subiendo foto:', e)
            }
          }
          return {
            control_id: control.id,
            item_id: it.id,
            respuesta: respuestas[it.id],
            observacion: observaciones[it.id] || null,
            foto_url,
            foto_epigrafe,
          }
        })
      )
      if (filas.length) await supabase.from('co_respuestas').insert(filas)
    }

    setRespuestasFinal(filas)
    setGuardando(false)
    setGuardado(true)
  }

  if (cargando) return (
    <div className="flex items-center justify-center gap-2.5 py-20 text-slate">
      <Loader2 className="w-5 h-5 animate-spin" strokeWidth={2} />
      Cargando ítems...
    </div>
  )

  if (guardado) {
    const itemsCatalogoLocal = {}
    items.forEach(it => { itemsCatalogoLocal[it.id] = it })
    const controlLocal = {
      fecha: cabecera.fecha, responsable: cabecera.responsable, auditor: cabecera.auditor,
      sector: cabecera.subsector, ubicacion: cabecera.sector, resultado,
      observaciones_generales: obsGenerales, plazo_correccion: plazoCorreccion || null,
      responsable_correccion: respCorreccion || null, porcentaje_cumplimiento: porcentaje,
      datos_extra: { auditor_matricula: matriculaAuditor },
    }

    return (
      <div className="max-w-[600px] mx-auto p-5 md:p-8 text-center py-20">
        <div className="w-14 h-14 rounded-full bg-accent-light flex items-center justify-center mx-auto mb-5">
          <Check className="w-7 h-7 text-accent" strokeWidth={2.5} />
        </div>
        <h2 className="text-xl font-bold text-ink mb-2">Control guardado correctamente</h2>
        <p className="text-slate text-sm mb-6">
          {tema.nombre} · {cabecera.fecha} · {porcentaje}% de cumplimiento
        </p>
        <div className="flex flex-col sm:flex-row gap-2.5 justify-center">
          <BtnPrimary onClick={onGuardado}>Volver a Controles Operativos</BtnPrimary>
          <BtnGhost onClick={() => setImprimir(true)}>
            <Printer className="w-4 h-4" strokeWidth={1.8} />
            Exportar PDF
          </BtnGhost>
        </div>

        {imprimir && (
          <ImprimirControl
            tema={tema} cliente={cliente} control={controlLocal}
            respuestas={respuestasFinal} itemsCatalogo={itemsCatalogoLocal}
          />
        )}
      </div>
    )
  }

  return (
    <div className="max-w-[820px] mx-auto p-5 md:p-8">

      <div className="flex flex-wrap items-start justify-between gap-3 mb-6">
        <div>
          <h2 className="text-xl md:text-[22px] font-bold text-ink tracking-tight">{tema.nombre}</h2>
          <p className="text-sm text-slate mt-0.5">
            {cliente.nombre}{equipo && ` · ${equipo.codigo}`}
          </p>
        </div>
        <BtnGhost onClick={onVolver}>
          <ArrowLeft className="w-4 h-4" strokeWidth={2} />
          Volver
        </BtnGhost>
      </div>

      <Card className="p-6 mb-5">
        <CardTitle>Datos del control</CardTitle>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>Fecha *</Label>
            <Input type="date" value={cabecera.fecha}
              onChange={e => setCabecera({ ...cabecera, fecha: e.target.value })} />
          </div>

          <div>
            <Label>Responsable *</Label>
            {responsables.length > 0 ? (
              <Select value={cabecera.responsable} onChange={e => setCabecera({ ...cabecera, responsable: e.target.value })}>
                <option value="">— Seleccionar —</option>
                {responsables.map(r => <option key={r.id} value={r.nombre}>{r.nombre}</option>)}
              </Select>
            ) : (
              <>
                <Input placeholder="Nombre" value={cabecera.responsable}
                  onChange={e => setCabecera({ ...cabecera, responsable: e.target.value })} />
                <p className="text-xs text-slate mt-1.5">
                  Sin lista configurada para este cliente. Se puede cargar en Configurar auditores/responsables.
                </p>
              </>
            )}
          </div>

          <div>
            <Label>Auditor</Label>
            {auditores.length > 0 ? (
              <Select value={cabecera.auditor} onChange={e => setCabecera({ ...cabecera, auditor: e.target.value })}>
                <option value="">— Seleccionar —</option>
                {auditores.map(a => <option key={a.id} value={a.nombre}>{a.nombre}</option>)}
              </Select>
            ) : (
              <>
                <Input placeholder="Nombre" value={cabecera.auditor}
                  onChange={e => setCabecera({ ...cabecera, auditor: e.target.value })} />
                <p className="text-xs text-slate mt-1.5">
                  Sin lista configurada para este cliente. Se puede cargar en Configurar auditores/responsables.
                </p>
              </>
            )}
          </div>

          <div>
            <Label>Subsector <span className="normal-case text-slate-400 font-normal">(campo opcional)</span></Label>
            <Input placeholder="Ej: Línea 2" value={cabecera.subsector}
              onChange={e => setCabecera({ ...cabecera, subsector: e.target.value })} />
          </div>

          <div className="md:col-span-2">
            <Label>Sector</Label>
            <Input placeholder="Ej: Planta, Depósito" value={cabecera.sector}
              onChange={e => setCabecera({ ...cabecera, sector: e.target.value })} />
          </div>
        </div>
      </Card>

      <div className="mb-5">
        <div className="flex justify-between mb-1.5">
          <span className="text-sm text-slate">Progreso</span>
          <span className="text-sm font-semibold text-accent">{respondidos} / {items.length} ítems</span>
        </div>
        <div className="h-1.5 bg-hairline rounded-full overflow-hidden">
          <div className="h-full bg-accent transition-all"
               style={{ width: `${items.length ? (respondidos / items.length) * 100 : 0}%` }} />
        </div>
      </div>

      {categorias.map((cat, ci) => (
        <Card key={ci} className="overflow-hidden mb-5">
          {cat.nombre && (
            <div className="px-5 py-3 bg-slate-100 border-b border-hairline">
              <p className="text-[13px] font-bold text-ink uppercase tracking-wide">{cat.nombre}</p>
            </div>
          )}
          {cat.items.map((it, i) => (
            <div key={it.id} className={`px-5 py-4 ${i > 0 || cat.nombre ? 'border-t border-hairline' : ''}`}>
              <div className="flex flex-wrap items-center gap-3">
                <p className="text-[15px] text-ink flex-1 min-w-[220px] text-left">{it.texto}</p>
                <RespuestaBtns valor={respuestas[it.id]} onChange={v => setRespuestas({ ...respuestas, [it.id]: v })} />
              </div>
              <textarea
                placeholder="Observaciones (opcional)..."
                value={observaciones[it.id] || ''}
                onChange={e => setObservaciones({ ...observaciones, [it.id]: e.target.value })}
                rows={1}
                className="w-full mt-2.5 px-3 py-2 text-sm text-ink bg-slate-50 border border-hairline
                           rounded-md outline-none focus:border-accent resize-none placeholder:text-slate-400"
              />
              {respuestas[it.id] === 'NO' && (
                <div className="mt-2.5">
                  {!fotosPreview[it.id] ? (
                    <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[12.5px] font-semibold
                                       text-slate border-[1.5px] border-hairline cursor-pointer transition-colors
                                       hover:border-accent hover:text-accent">
                      <Camera className="w-3.5 h-3.5" strokeWidth={1.8} />
                      Adjuntar foto (opcional)
                      <input
                        type="file" accept="image/*" capture="environment" className="hidden"
                        onChange={e => manejarFoto(it.id, e.target.files?.[0])}
                      />
                    </label>
                  ) : (
                    <div>
                      <div className="flex items-center gap-3">
                        <img src={fotosPreview[it.id]} alt="" className="w-14 h-14 object-cover rounded-md border border-hairline shrink-0" />
                        <button onClick={() => quitarFoto(it.id)}
                          className="inline-flex items-center gap-1 text-[12.5px] font-semibold text-danger hover:underline shrink-0">
                          <XIcon className="w-3.5 h-3.5" strokeWidth={2} />
                          Quitar foto
                        </button>
                        <input
                          type="text"
                          maxLength={50}
                          placeholder="Epígrafe de la foto (opcional)..."
                          value={epigrafes[it.id] || ''}
                          onChange={e => setEpigrafes({ ...epigrafes, [it.id]: e.target.value })}
                          className="flex-1 min-w-0 px-2.5 py-1.5 text-[13px] text-ink bg-white border-[1.5px]
                                     border-hairline rounded-md outline-none focus:border-accent placeholder:text-slate-400"
                        />
                      </div>
                      <p className="text-[11px] text-slate mt-1.5">
                        Si lo dejás vacío, aparecerá como "Desvío {"{n}"}" en el PDF.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </Card>
      ))}

      <Card className="p-6 mb-6">
        <CardTitle>Resultado general</CardTitle>
        <div className="flex flex-col sm:flex-row gap-2.5 mb-5">
          {RESULTADOS.map(r => (
            <button key={r.value} onClick={() => setResultado(r.value)}
              className={`flex-1 flex items-center gap-2.5 px-4 py-3 rounded-lg border-2 transition-all
                          ${resultado === r.value ? r.cls : 'border-hairline text-slate hover:border-slate-300'}`}>
              <r.Icon className="w-5 h-5 shrink-0" strokeWidth={1.8} />
              <span className="text-[14px] font-semibold text-left">{r.label}</span>
            </button>
          ))}
        </div>

        <Label>Observaciones generales</Label>
        <textarea
          value={obsGenerales} onChange={e => setObsGenerales(e.target.value)}
          rows={2} placeholder="Comentarios generales del control..."
          className="w-full mb-4 px-3.5 py-2.5 text-[15px] text-ink bg-white border-[1.5px] border-hairline
                     rounded-md outline-none focus:border-accent resize-none placeholder:text-slate-400"
        />

        {(resultado === 'observaciones' || resultado === 'rechazado') && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-hairline mt-1">
            <div className="pt-4">
              <Label>Plazo para corrección</Label>
              <Input type="date" value={plazoCorreccion} onChange={e => setPlazoCorreccion(e.target.value)} />
            </div>
            <div className="pt-4">
              <Label>Responsable de la corrección</Label>
              <Input placeholder="Nombre" value={respCorreccion} onChange={e => setRespCorreccion(e.target.value)} />
            </div>
          </div>
        )}
      </Card>

      <div className="flex justify-end">
        <BtnPrimary onClick={guardar} disabled={guardando || !puedeGuardar}>
          {guardando
            ? (Object.keys(fotosFiles).length > 0 ? 'Subiendo fotos...' : 'Guardando...')
            : 'Guardar control'}
        </BtnPrimary>
      </div>
      {!puedeGuardar && (
        <p className="text-xs text-slate text-right mt-2">
          Completá responsable, al menos un ítem y el resultado general para guardar.
        </p>
      )}
    </div>
  )
}

// ─── ORQUESTADOR ──────────────────────────────────────────────────────────────
export default function FormularioControl({ tema, cliente, user, onVolver, onGuardadoOk }) {
  const [equipo, setEquipo] = useState(null)
  const [equipoElegido, setEquipoElegido] = useState(!tema.lleva_equipos)

  if (tema.lleva_equipos && !equipoElegido) {
    return (
      <SelectorEquipo
        tema={tema} cliente={cliente}
        onSeleccionar={(e) => { setEquipo(e); setEquipoElegido(true) }}
        onVolver={onVolver}
      />
    )
  }

  return (
    <Checklist
      tema={tema} cliente={cliente} equipo={equipo} user={user}
      onVolver={onVolver} onGuardado={onGuardadoOk || onVolver}
    />
  )
}
