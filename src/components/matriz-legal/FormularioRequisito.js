'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { ArrowLeft, Check, Trash2, Loader2, Paperclip, Upload } from 'lucide-react'
import { Card, CardTitle, Label, Input, Select, BtnPrimary, BtnGhost } from '../contratistas/ui'

const PRESETS_FRECUENCIA = [
  { label: '90 días', valor: 90 },
  { label: '180 días', valor: 180 },
  { label: '365 días', valor: 365 },
  { label: '2 años', valor: 730 },
]

export default function FormularioRequisito({ cliente, establecimiento, requisito, onVolver, onGuardado }) {
  const editando = !!requisito

  const [categorias, setCategorias] = useState([])
  const [responsables, setResponsables] = useState([])
  const [cargando, setCargando] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [confirmDel, setConfirmDel] = useState(false)

  const [form, setForm] = useState({
    aspecto_legal: requisito?.aspecto_legal || '',
    categoria_id: requisito?.categoria_id || '',
    responsable_id: requisito?.responsable_id || '',
    reglamentacion: requisito?.reglamentacion || '',
    organismo: requisito?.organismo || '',
    entregable: requisito?.entregable || '',
    referencia: requisito?.referencia || '',
    frecuencia_dias: requisito?.frecuencia_dias ?? '',
    fecha_presentacion: requisito?.fecha_presentacion || '',
    observacion: requisito?.observacion || '',
  })
  const [documentoUrl, setDocumentoUrl] = useState(requisito?.documento_url || '')
  const [subiendoArchivo, setSubiendoArchivo] = useState(false)
  const [sinVencimiento, setSinVencimiento] = useState(requisito ? !requisito.frecuencia_dias : false)

  useEffect(() => { cargar() }, [])

  const cargar = async () => {
    const [{ data: cats }, { data: resps }] = await Promise.all([
      supabase.from('matriz_categorias').select('*').eq('activo', true).order('nombre'),
      supabase.from('matriz_responsables').select('*').eq('activo', true).order('nombre'),
    ])
    setCategorias(cats || [])
    setResponsables(resps || [])
    setCargando(false)
  }

  // Al elegir categoría, si el responsable todavía no fue tocado, sugerimos el de esa categoría
  const handleCategoria = (categoriaId) => {
    const nuevoForm = { ...form, categoria_id: categoriaId }
    if (!form.responsable_id) {
      const sugerido = responsables.find(r => r.categoria_default_id === categoriaId)
      if (sugerido) nuevoForm.responsable_id = sugerido.id
    }
    setForm(nuevoForm)
  }

  const puedeGuardar = form.aspecto_legal.trim() && !guardando

  const subirArchivo = async (file) => {
    if (!file) return
    setSubiendoArchivo(true)
    const ext = file.name.split('.').pop()
    const path = `${establecimiento.id}-${Date.now()}.${ext}`
    const { error } = await supabase.storage.from('documentos-legales').upload(path, file)
    if (!error) {
      const { data } = supabase.storage.from('documentos-legales').getPublicUrl(path)
      setDocumentoUrl(data.publicUrl)
    }
    setSubiendoArchivo(false)
  }

  const guardar = async () => {
    if (!puedeGuardar) return
    setGuardando(true)

    const payload = {
      establecimiento_id: establecimiento.id,
      aspecto_legal: form.aspecto_legal.trim(),
      categoria_id: form.categoria_id || null,
      responsable_id: form.responsable_id || null,
      reglamentacion: form.reglamentacion.trim() || null,
      organismo: form.organismo.trim() || null,
      entregable: form.entregable.trim() || null,
      referencia: form.referencia.trim() || null,
      frecuencia_dias: sinVencimiento ? null : (form.frecuencia_dias ? parseInt(form.frecuencia_dias) : null),
      fecha_presentacion: form.fecha_presentacion || null,
      observacion: form.observacion.trim() || null,
      documento_url: documentoUrl.trim() || null,
    }

    if (editando) {
      await supabase.from('matriz_requisitos').update(payload).eq('id', requisito.id)
    } else {
      await supabase.from('matriz_requisitos').insert(payload)
    }

    setGuardando(false)
    onGuardado()
  }

  const eliminar = async () => {
    await supabase.from('matriz_requisitos').update({ activo: false }).eq('id', requisito.id)
    onGuardado()
  }

  if (cargando) return (
    <div className="flex items-center justify-center gap-2.5 py-20 text-slate">
      <Loader2 className="w-5 h-5 animate-spin" strokeWidth={2} />
      Cargando...
    </div>
  )

  return (
    <div className="max-w-[760px] mx-auto p-5 md:p-8">

      <div className="flex flex-wrap items-start justify-between gap-3 mb-6">
        <div>
          <h2 className="text-xl md:text-[22px] font-bold text-ink tracking-tight">
            {editando ? 'Editar requisito' : 'Nuevo requisito legal'}
          </h2>
          <p className="text-sm text-slate mt-0.5">{cliente.nombre} · {establecimiento.nombre}</p>
        </div>
        <BtnGhost onClick={onVolver}>
          <ArrowLeft className="w-4 h-4" strokeWidth={2} />
          Volver
        </BtnGhost>
      </div>

      <Card className="p-6 mb-5">
        <CardTitle>Datos del requisito</CardTitle>
        <div className="grid grid-cols-1 gap-4 mb-1">
          <div>
            <Label>Aspecto legal *</Label>
            <Input placeholder="Ej: Control de Extintores" value={form.aspecto_legal}
              onChange={e => setForm({ ...form, aspecto_legal: e.target.value })} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Categoría</Label>
              <Select value={form.categoria_id} onChange={e => handleCategoria(e.target.value)}>
                <option value="">— Sin categoría —</option>
                {categorias.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
              </Select>
            </div>
            <div>
              <Label>Responsable</Label>
              <Select value={form.responsable_id} onChange={e => setForm({ ...form, responsable_id: e.target.value })}>
                <option value="">— Sin asignar —</option>
                {responsables.map(r => <option key={r.id} value={r.id}>{r.nombre}</option>)}
              </Select>
            </div>
          </div>

          <div>
            <Label>Organismo</Label>
            <Input placeholder="Ej: SRT - Superintendencia de Riesgos del Trabajo" value={form.organismo}
              onChange={e => setForm({ ...form, organismo: e.target.value })} />
          </div>

          <div>
            <Label>Reglamentación</Label>
            <textarea
              value={form.reglamentacion} onChange={e => setForm({ ...form, reglamentacion: e.target.value })}
              rows={3} placeholder="Leyes, decretos, resoluciones aplicables..."
              className="w-full px-3.5 py-2.5 text-[15px] text-ink bg-white border-[1.5px] border-hairline
                         rounded-md outline-none focus:border-accent resize-none placeholder:text-slate-400"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Entregable</Label>
              <Input placeholder="Ej: Declaración Jurada" value={form.entregable}
                onChange={e => setForm({ ...form, entregable: e.target.value })} />
            </div>
            <div>
              <Label>Referencia / Matrícula / Expediente</Label>
              <Input placeholder="Ej: Mat.Prof. CPSH 12345" value={form.referencia}
                onChange={e => setForm({ ...form, referencia: e.target.value })} />
            </div>
          </div>
        </div>
      </Card>

      <Card className="p-6 mb-6">
        <CardTitle>Vencimiento</CardTitle>

        <label className="flex items-center gap-2 text-sm text-ink cursor-pointer mb-4">
          <input type="checkbox" checked={sinVencimiento}
            onChange={e => setSinVencimiento(e.target.checked)}
            className="w-4 h-4 accent-[#0F5132] cursor-pointer" />
          Este requisito no tiene vencimiento (ej: habilitación, plano aprobado)
        </label>

        {!sinVencimiento && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
              <div>
                <Label>Fecha de presentación</Label>
                <Input type="date" value={form.fecha_presentacion}
                  onChange={e => setForm({ ...form, fecha_presentacion: e.target.value })} />
              </div>
              <div>
                <Label>Frecuencia (días)</Label>
                <Input type="number" placeholder="Ej: 365" value={form.frecuencia_dias}
                  onChange={e => setForm({ ...form, frecuencia_dias: e.target.value })} />
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {PRESETS_FRECUENCIA.map(p => (
                <button key={p.valor} onClick={() => setForm({ ...form, frecuencia_dias: p.valor })}
                  className="px-3 py-1.5 rounded-md text-[13px] font-semibold text-slate border-[1.5px] border-hairline
                             transition-colors hover:border-accent hover:text-accent">
                  {p.label}
                </button>
              ))}
            </div>
          </>
        )}

        <div className="mt-5">
          <Label>Observaciones</Label>
          <textarea
            value={form.observacion} onChange={e => setForm({ ...form, observacion: e.target.value })}
            rows={2} placeholder="Notas, estado del trámite, pendientes..."
            className="w-full px-3.5 py-2.5 text-[15px] text-ink bg-white border-[1.5px] border-hairline
                       rounded-md outline-none focus:border-accent resize-none placeholder:text-slate-400"
          />
        </div>

        <div className="mt-5">
          <Label>Documento / Enlace a Google Drive</Label>
          <div className="flex flex-col sm:flex-row gap-2.5">
            <Input
              placeholder="Pegá un enlace (Google Drive, etc.)..."
              value={documentoUrl}
              onChange={e => setDocumentoUrl(e.target.value)}
              className="flex-1"
            />
            <label className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-md text-[13px] font-semibold
                               text-slate border-[1.5px] border-hairline cursor-pointer transition-colors
                               hover:border-accent hover:text-accent whitespace-nowrap">
              {subiendoArchivo ? (
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
              <input type="file" className="hidden" disabled={subiendoArchivo}
                onChange={e => subirArchivo(e.target.files?.[0])} />
            </label>
          </div>
          {documentoUrl && (
            <a href={documentoUrl} target="_blank" rel="noopener noreferrer"
               className="inline-flex items-center gap-1.5 mt-2 text-[13px] font-semibold text-accent hover:underline">
              <Paperclip className="w-3.5 h-3.5" strokeWidth={2} />
              Ver documento actual
            </a>
          )}
        </div>
      </Card>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <BtnPrimary onClick={guardar} disabled={!puedeGuardar}>
          {guardando ? 'Guardando...' : editando ? 'Guardar cambios' : 'Crear requisito'}
        </BtnPrimary>

        {editando && (
          confirmDel ? (
            <div className="flex items-center gap-2">
              <span className="text-[13px] text-danger font-semibold">¿Eliminar este requisito?</span>
              <button onClick={eliminar}
                className="px-4 py-2 rounded-md text-[13px] font-semibold text-white bg-danger hover:bg-red-800 transition-colors">
                Sí, eliminar
              </button>
              <BtnGhost onClick={() => setConfirmDel(false)} className="px-3.5 py-2 text-[13px]">Cancelar</BtnGhost>
            </div>
          ) : (
            <button onClick={() => setConfirmDel(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-md text-sm font-semibold text-danger
                         border-[1.5px] border-red-200 transition-colors hover:bg-red-50">
              <Trash2 className="w-3.5 h-3.5" strokeWidth={2} />
              Eliminar requisito
            </button>
          )
        )}
      </div>
    </div>
  )
}
