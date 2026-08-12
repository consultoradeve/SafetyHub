'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import {
  ArrowLeft, ArrowRight, FileText, Users, Plus, X, User, Briefcase, Loader2
} from 'lucide-react'
import {
  calcEstado, peorEstado, FRECUENCIAS,
  Dot, Badge, Card, CardTitle, Label, Input, Select,
  BtnPrimary, BtnGhost, ToggleAplica, EmptyState
} from './ui'
import FichaTrabajador from './FichaTrabajador'

export default function FichaContratista({ contratista, cliente, esAdmin, onVolver }) {
  const [tab, setTab] = useState('docs')
  const [docsReq, setDocsReq] = useState([])
  const [docsEstado, setDocsEstado] = useState({})
  const [trabajadores, setTrabajadores] = useState([])
  const [guardando, setGuardando] = useState(null)
  const [trabActivo, setTrabActivo] = useState(null)
  const [mostrarForm, setMostrarForm] = useState(false)
  const [formTrab, setFormTrab] = useState({ nombre: '', apellido: '', dni: '', tipo: 'dependencia', cargo: '' })
  const [savingTrab, setSavingTrab] = useState(false)
  const [confirmDel, setConfirmDel] = useState(null)
  const [confirmBaja, setConfirmBaja] = useState(false)
  const [cargando, setCargando] = useState(true)

  useEffect(() => { cargar() }, [contratista.id])

  const cargar = async () => {
    const [{ data: reqs }, { data: est }, { data: trabs }] = await Promise.all([
      supabase.from('documentos_requeridos').select('*')
        .eq('cliente_id', cliente.id).eq('aplica_a', 'empresa').eq('activo', true).order('nombre'),
      supabase.from('docs_empresa').select('*').eq('contratista_id', contratista.id),
      supabase.from('contratista_trabajadores').select('*')
        .eq('contratista_id', contratista.id).eq('activo', true).order('apellido'),
    ])
    if (reqs) setDocsReq(reqs)
    if (est) { const m = {}; est.forEach(d => { m[d.documento_id] = d }); setDocsEstado(m) }
    if (trabs) setTrabajadores(trabs)
    setCargando(false)
  }

  const updateDoc = async (docId, field, value) => {
    setGuardando(docId)
    const ex = docsEstado[docId]
    const payload = { contratista_id: contratista.id, documento_id: docId, updated_at: new Date().toISOString(), [field]: value }
    if (ex) await supabase.from('docs_empresa').update(payload).eq('id', ex.id)
    else await supabase.from('docs_empresa').insert({
      ...payload,
      recibido: field === 'recibido' ? value : false,
      aplica: field === 'aplica' ? value : true,
    })
    await cargar(); setGuardando(null)
  }

  const guardarTrabajador = async () => {
    if (!formTrab.nombre.trim() || !formTrab.apellido.trim()) return
    setSavingTrab(true)

    const { data: trab } = await supabase
      .from('contratista_trabajadores')
      .insert({ ...formTrab, contratista_id: contratista.id })
      .select().single()

    // Pre-cargar docs del trabajador desde el catálogo según su tipo
    if (trab) {
      const { data: catalogo } = await supabase
        .from('docs_catalogo').select('*')
        .in('aplica_a', ['ambos_trabajadores', formTrab.tipo])

      if (catalogo?.length) {
        const { data: yaExisten } = await supabase
          .from('documentos_requeridos').select('*')
          .eq('cliente_id', cliente.id)
          .in('aplica_a', ['ambos_trabajadores', formTrab.tipo])

        const existentes = (yaExisten || []).map(d => d.nombre)
        const nuevos = catalogo
          .filter(c => !existentes.includes(c.nombre))
          .map(c => ({
            cliente_id: cliente.id, nombre: c.nombre, aplica_a: c.aplica_a,
            frecuencia: c.frecuencia_sugerida || 'mensual', dias_alerta: 30, activo: true,
          }))
        if (nuevos.length) await supabase.from('documentos_requeridos').insert(nuevos)

        const { data: todos } = await supabase
          .from('documentos_requeridos').select('*')
          .eq('cliente_id', cliente.id)
          .in('aplica_a', ['ambos_trabajadores', formTrab.tipo]).eq('activo', true)

        if (todos?.length) {
          await supabase.from('docs_trabajador').insert(
            todos.map(d => ({ trabajador_id: trab.id, documento_id: d.id, aplica: true, recibido: false }))
          )
        }
      }
    }

    setFormTrab({ nombre: '', apellido: '', dni: '', tipo: 'dependencia', cargo: '' })
    setMostrarForm(false)
    await cargar()
    setSavingTrab(false)
  }

  const eliminarTrabajador = async (id) => {
    await supabase.from('contratista_trabajadores').update({ activo: false }).eq('id', id)
    setConfirmDel(null)
    await cargar()
  }

  const darDeBajaEmpresa = async () => {
    await supabase.from('contratistas').update({ activo: false }).eq('id', contratista.id)
    onVolver()
  }

  if (trabActivo) {
    return <FichaTrabajador
      trabajador={trabActivo} cliente={cliente}
      onVolver={() => { setTrabActivo(null); cargar() }}
    />
  }

  if (cargando) return (
    <div className="flex items-center justify-center gap-2.5 py-20 text-slate">
      <Loader2 className="w-5 h-5 animate-spin" strokeWidth={2} />
      Cargando...
    </div>
  )

  const estadosEmpresa = docsReq.map(d => {
    const e = docsEstado[d.id]
    const aplica = e ? e.aplica !== false : true
    return calcEstado(aplica, e?.recibido, e?.fecha_vencimiento)
  })

  const tabCls = (t) => `px-5 py-2.5 text-[15px] border-b-2 transition-colors flex items-center gap-2
    ${tab === t ? 'border-accent text-accent font-semibold' : 'border-transparent text-slate hover:text-ink'}`

  return (
    <div className="max-w-[960px] mx-auto p-5 md:p-8">

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3 mb-6">
        <div>
          <h2 className="text-xl md:text-[22px] font-bold text-ink tracking-tight">{contratista.nombre}</h2>
          <p className="text-sm text-slate mt-1">
            {[contratista.cuit && `CUIT: ${contratista.cuit}`, contratista.contacto, contratista.email]
              .filter(Boolean).join(' · ')}
          </p>
          <div className="mt-2.5"><Badge estado={peorEstado(estadosEmpresa)} /></div>
        </div>
        <div className="flex flex-wrap gap-2.5">
          {confirmBaja ? (
            <div className="flex items-center gap-2">
              <span className="text-[13px] text-danger font-semibold">¿Confirmar baja?</span>
              <button onClick={darDeBajaEmpresa}
                className="px-4 py-2 rounded-md text-[13px] font-semibold text-white bg-danger hover:bg-red-800 transition-colors">
                Sí, dar de baja
              </button>
              <BtnGhost onClick={() => setConfirmBaja(false)} className="px-3.5 py-2 text-[13px]">Cancelar</BtnGhost>
            </div>
          ) : (
            <button onClick={() => setConfirmBaja(true)}
              className="px-4 py-2.5 rounded-md text-sm font-semibold text-danger border-[1.5px] border-red-200
                         transition-colors hover:bg-red-50">
              Dar de baja empresa
            </button>
          )}
          <BtnGhost onClick={onVolver}>
            <ArrowLeft className="w-4 h-4" strokeWidth={2} />
            Volver
          </BtnGhost>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-hairline mb-6">
        <button className={tabCls('docs')} onClick={() => setTab('docs')}>
          <FileText className="w-4 h-4" strokeWidth={1.8} />
          Docs empresa ({docsReq.length})
        </button>
        <button className={tabCls('trabajadores')} onClick={() => setTab('trabajadores')}>
          <Users className="w-4 h-4" strokeWidth={1.8} />
          Trabajadores ({trabajadores.length})
        </button>
      </div>

      {/* TAB: DOCS EMPRESA */}
      {tab === 'docs' && (
        <Card className="overflow-hidden">
          {docsReq.length === 0 ? (
            <EmptyState Icon={FileText} title="No hay documentos configurados"
              desc={esAdmin ? 'Configurálos desde "Configurar documentos".' : null} />
          ) : docsReq.map((doc, i) => {
            const est = docsEstado[doc.id]
            const aplica = est ? est.aplica !== false : true
            const estado = calcEstado(aplica, est?.recibido, est?.fecha_vencimiento)
            return (
              <div key={doc.id}
                className={`flex flex-wrap items-center gap-3.5 px-5 py-4
                            ${i > 0 ? 'border-t border-hairline' : ''}
                            ${!aplica ? 'bg-slate-50' : ''}
                            ${guardando === doc.id ? 'opacity-60' : ''}`}>
                <Dot estado={estado} />
                <div className="flex-1 min-w-[200px]">
                  <p className={`text-[15px] font-semibold ${aplica ? 'text-ink' : 'text-slate line-through'}`}>
                    {doc.nombre}
                  </p>
                  <p className="text-xs text-slate mt-0.5">
                    {FRECUENCIAS.find(f => f.value === doc.frecuencia)?.label}
                  </p>
                </div>
                <Badge estado={estado} />
                <ToggleAplica aplica={aplica} onChange={v => updateDoc(doc.id, 'aplica', v)} />
                {aplica && (
                  <>
                    <label className="flex items-center gap-2 text-sm text-slate cursor-pointer whitespace-nowrap">
                      <input type="checkbox"
                        checked={est?.recibido || false}
                        onChange={e => updateDoc(doc.id, 'recibido', e.target.checked)}
                        className="w-4 h-4 accent-[#0F5132] cursor-pointer" />
                      Recibido
                    </label>
                    {est?.recibido && doc.frecuencia !== 'unica' && (
                      <div>
                        <Label>Vence</Label>
                        <input type="date"
                          value={est?.fecha_vencimiento || ''}
                          onChange={e => updateDoc(doc.id, 'fecha_vencimiento', e.target.value || null)}
                          className="w-[150px] px-2.5 py-1.5 text-sm text-ink bg-white border-[1.5px]
                                     border-hairline rounded-md outline-none focus:border-accent" />
                      </div>
                    )}
                  </>
                )}
              </div>
            )
          })}
        </Card>
      )}

      {/* TAB: TRABAJADORES */}
      {tab === 'trabajadores' && (
        <>
          <div className="flex justify-end mb-4">
            <BtnPrimary onClick={() => setMostrarForm(!mostrarForm)}>
              {mostrarForm ? <X className="w-4 h-4" strokeWidth={2} /> : <Plus className="w-4 h-4" strokeWidth={2.2} />}
              {mostrarForm ? 'Cancelar' : 'Agregar trabajador'}
            </BtnPrimary>
          </div>

          {mostrarForm && (
            <Card className="p-6 mb-5">
              <CardTitle>Nuevo trabajador</CardTitle>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
                {[['nombre','Nombre *','Juan'],['apellido','Apellido *','Pérez'],
                  ['dni','DNI','12345678'],['cargo','Cargo','Electricista']].map(([k,l,p]) => (
                  <div key={k}>
                    <Label>{l}</Label>
                    <Input placeholder={p} value={formTrab[k]}
                      onChange={e => setFormTrab({ ...formTrab, [k]: e.target.value })} />
                  </div>
                ))}
                <div>
                  <Label>Tipo *</Label>
                  <Select value={formTrab.tipo} onChange={e => setFormTrab({ ...formTrab, tipo: e.target.value })}>
                    <option value="dependencia">Relación de dependencia</option>
                    <option value="monotributista">Monotributista / Autónomo</option>
                  </Select>
                </div>
              </div>
              <BtnPrimary onClick={guardarTrabajador}
                disabled={savingTrab || !formTrab.nombre.trim() || !formTrab.apellido.trim()}>
                {savingTrab ? 'Guardando...' : 'Agregar trabajador'}
              </BtnPrimary>
            </Card>
          )}

          {trabajadores.length === 0 ? (
            <Card><EmptyState Icon={Users} title="No hay trabajadores registrados" /></Card>
          ) : (
            <Card className="overflow-hidden">
              {trabajadores.map((t, i) => (
                <div key={t.id}
                  className={`flex flex-wrap items-center gap-3.5 px-5 py-4 ${i > 0 ? 'border-t border-hairline' : ''}`}>
                  {t.tipo === 'dependencia'
                    ? <User className="w-[18px] h-[18px] text-slate shrink-0" strokeWidth={1.8} />
                    : <Briefcase className="w-[18px] h-[18px] text-slate shrink-0" strokeWidth={1.8} />}
                  <div className="flex-1 min-w-[180px]">
                    <p className="text-[15px] font-semibold text-ink">{t.apellido}, {t.nombre}</p>
                    <p className="text-[13px] text-slate mt-0.5">
                      {t.tipo === 'dependencia' ? 'Dependencia' : 'Monotributista'}
                      {t.cargo && ` · ${t.cargo}`}
                      {t.dni && ` · DNI ${t.dni}`}
                    </p>
                  </div>
                  <button onClick={() => setTrabActivo(t)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md text-[13px] font-semibold
                               text-slate border-[1.5px] border-hairline transition-colors
                               hover:border-accent hover:text-accent">
                    Ver documentos
                    <ArrowRight className="w-3.5 h-3.5" strokeWidth={2} />
                  </button>
                  {confirmDel === t.id ? (
                    <div className="flex items-center gap-1.5">
                      <span className="text-[13px] text-danger">¿Eliminar?</span>
                      <button onClick={() => eliminarTrabajador(t.id)}
                        className="px-3 py-2 rounded-md text-[13px] font-semibold text-white bg-danger hover:bg-red-800">
                        Sí
                      </button>
                      <button onClick={() => setConfirmDel(null)}
                        className="px-2.5 py-2 rounded-md text-[13px] font-semibold text-slate border-[1.5px] border-hairline">
                        No
                      </button>
                    </div>
                  ) : (
                    <button onClick={() => setConfirmDel(t.id)}
                      className="px-2.5 py-2 rounded-md text-danger border-[1.5px] border-red-200
                                 transition-colors hover:bg-red-50">
                      <X className="w-4 h-4" strokeWidth={2} />
                    </button>
                  )}
                </div>
              ))}
            </Card>
          )}
        </>
      )}
    </div>
  )
}
