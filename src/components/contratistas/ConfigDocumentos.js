'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { ArrowLeft, Plus, Check, Trash2, Loader2 } from 'lucide-react'
import {
  FRECUENCIAS, APLICA_LABELS,
  Card, CardTitle, Label, Input, Select, BtnPrimary, BtnGhost, EmptyState
} from './ui'

export default function ConfigDocumentos({ cliente, onVolver }) {
  const [docs, setDocs] = useState([])
  const [catalogo, setCatalogo] = useState([])
  const [form, setForm] = useState({ nombre: '', aplica_a: 'empresa', frecuencia: 'mensual', dias_alerta: 30 })
  const [docSel, setDocSel] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [confirmDel, setConfirmDel] = useState(null)
  const [cargando, setCargando] = useState(true)

  useEffect(() => { cargar() }, [])

  const cargar = async () => {
    const [{ data: d }, { data: c }] = await Promise.all([
      supabase.from('documentos_requeridos').select('*')
        .eq('cliente_id', cliente.id).order('aplica_a').order('nombre'),
      supabase.from('docs_catalogo').select('*').order('categoria').order('nombre'),
    ])
    if (d) setDocs(d)
    if (c) setCatalogo(c)
    setCargando(false)
  }

  const handleCatalogo = (id) => {
    setDocSel(id)
    if (!id) return
    const doc = catalogo.find(c => c.id === id)
    if (doc) setForm(f => ({
      ...f,
      nombre: doc.nombre,
      aplica_a: doc.aplica_a,
      frecuencia: doc.frecuencia_sugerida || 'mensual',
    }))
  }

  const guardar = async () => {
    if (!form.nombre.trim()) return
    setGuardando(true)
    await supabase.from('documentos_requeridos').insert({ ...form, cliente_id: cliente.id })
    setForm({ nombre: '', aplica_a: 'empresa', frecuencia: 'mensual', dias_alerta: 30 })
    setDocSel('')
    await cargar()
    setGuardando(false)
  }

  const eliminar = async (id) => {
    await supabase.from('documentos_requeridos').delete().eq('id', id)
    setConfirmDel(null)
    await cargar()
  }

  const toggleActivo = async (doc) => {
    await supabase.from('documentos_requeridos').update({ activo: !doc.activo }).eq('id', doc.id)
    await cargar()
  }

  const categorias = [...new Set(catalogo.map(c => c.categoria))]

  if (cargando) return (
    <div className="flex items-center justify-center gap-2.5 py-20 text-slate">
      <Loader2 className="w-5 h-5 animate-spin" strokeWidth={2} />
      Cargando...
    </div>
  )

  return (
    <div className="max-w-[900px] mx-auto p-5 md:p-8">

      <div className="flex flex-wrap items-start justify-between gap-3 mb-6">
        <div>
          <h2 className="text-xl md:text-[22px] font-bold text-ink tracking-tight">Documentos requeridos</h2>
          <p className="text-sm text-slate mt-0.5">
            Cliente: <span className="font-semibold text-ink">{cliente.nombre}</span>
          </p>
        </div>
        <BtnGhost onClick={onVolver}>
          <ArrowLeft className="w-4 h-4" strokeWidth={2} />
          Volver
        </BtnGhost>
      </div>

      {/* Formulario */}
      <Card className="p-6 mb-5">
        <CardTitle>Agregar documento requerido</CardTitle>

        <div className="mb-4">
          <Label>Elegir del catálogo (opcional)</Label>
          <Select value={docSel} onChange={e => handleCatalogo(e.target.value)}>
            <option value="">— Seleccioná del catálogo o escribí uno nuevo —</option>
            {categorias.map(cat => (
              <optgroup key={cat} label={cat}>
                {catalogo.filter(c => c.categoria === cat).map(c => (
                  <option key={c.id} value={c.id}>{c.nombre}</option>
                ))}
              </optgroup>
            ))}
          </Select>
          {docSel && (
            <p className="flex items-center gap-1.5 mt-2 text-[13px] text-accent">
              <Check className="w-3.5 h-3.5" strokeWidth={2.5} />
              Datos pre-completados. Podés ajustarlos antes de guardar.
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
          <div className="md:col-span-3">
            <Label>Nombre *</Label>
            <Input placeholder="O escribí un documento personalizado..."
              value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} />
          </div>
          <div>
            <Label>Aplica a</Label>
            <Select value={form.aplica_a} onChange={e => setForm({ ...form, aplica_a: e.target.value })}>
              {Object.entries(APLICA_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </Select>
          </div>
          <div>
            <Label>Frecuencia</Label>
            <Select value={form.frecuencia} onChange={e => setForm({ ...form, frecuencia: e.target.value })}>
              {FRECUENCIAS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
            </Select>
          </div>
          <div>
            <Label>Días de alerta previa</Label>
            <Input type="number" value={form.dias_alerta}
              onChange={e => setForm({ ...form, dias_alerta: parseInt(e.target.value) || 30 })} />
          </div>
        </div>

        <BtnPrimary onClick={guardar} disabled={guardando || !form.nombre.trim()}>
          <Plus className="w-4 h-4" strokeWidth={2.2} />
          {guardando ? 'Guardando...' : 'Agregar documento'}
        </BtnPrimary>
      </Card>

      {/* Lista configurada */}
      <Card className="overflow-hidden">
        <div className="px-6 py-4 border-b border-hairline">
          <h3 className="text-[15px] font-semibold text-ink">
            Configurados para {cliente.nombre} ({docs.length})
          </h3>
        </div>

        {docs.length === 0 ? (
          <EmptyState title="Sin documentos configurados"
            desc="Usá el catálogo de arriba para agregar documentos rápido." />
        ) : (
          Object.entries(APLICA_LABELS).map(([grupo, grupoLabel]) => {
            const gDocs = docs.filter(d => d.aplica_a === grupo)
            if (!gDocs.length) return null
            return (
              <div key={grupo}>
                <p className="px-6 py-2.5 bg-slate-50 border-t border-hairline text-[11px] font-bold
                              text-slate uppercase tracking-wider">
                  {grupoLabel}
                </p>
                {gDocs.map(doc => (
                  <div key={doc.id}
                    className={`flex flex-wrap items-center gap-3 px-6 py-3.5 border-t border-hairline
                                ${doc.activo ? '' : 'opacity-45'}`}>
                    <div className="flex-1 min-w-[200px]">
                      <p className="text-[15px] font-semibold text-ink">{doc.nombre}</p>
                      <p className="text-xs text-slate mt-0.5">
                        {FRECUENCIAS.find(f => f.value === doc.frecuencia)?.label} · alerta {doc.dias_alerta} días antes
                      </p>
                    </div>
                    <span className={`text-[11px] font-semibold px-2 py-1 rounded-md
                      ${doc.activo ? 'bg-accent-light text-accent' : 'bg-hairline text-slate'}`}>
                      {doc.activo ? 'Activo' : 'Inactivo'}
                    </span>
                    <button onClick={() => toggleActivo(doc)}
                      className="px-3 py-1.5 rounded-md text-[13px] font-semibold text-slate
                                 border-[1.5px] border-hairline transition-colors hover:border-accent hover:text-accent">
                      {doc.activo ? 'Desactivar' : 'Activar'}
                    </button>
                    {confirmDel === doc.id ? (
                      <div className="flex items-center gap-1.5">
                        <span className="text-[13px] text-danger">¿Confirmar?</span>
                        <button onClick={() => eliminar(doc.id)}
                          className="px-3 py-1.5 rounded-md text-[13px] font-semibold text-white bg-danger hover:bg-red-800">
                          Sí
                        </button>
                        <button onClick={() => setConfirmDel(null)}
                          className="px-2.5 py-1.5 rounded-md text-[13px] font-semibold text-slate border-[1.5px] border-hairline">
                          No
                        </button>
                      </div>
                    ) : (
                      <button onClick={() => setConfirmDel(doc.id)}
                        className="px-2.5 py-1.5 rounded-md text-danger border-[1.5px] border-red-200
                                   transition-colors hover:bg-red-50">
                        <Trash2 className="w-3.5 h-3.5" strokeWidth={2} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )
          })
        )}
      </Card>
    </div>
  )
}
