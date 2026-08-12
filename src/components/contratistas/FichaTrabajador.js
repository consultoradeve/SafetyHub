'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { ArrowLeft, FileText, Loader2 } from 'lucide-react'
import {
  calcEstado, peorEstado, FRECUENCIAS,
  Dot, Badge, Card, Label, BtnGhost, ToggleAplica, EmptyState
} from './ui'

export default function FichaTrabajador({ trabajador, cliente, onVolver }) {
  const [docsReq, setDocsReq] = useState([])
  const [docsEstado, setDocsEstado] = useState({})
  const [guardando, setGuardando] = useState(null)
  const [cargando, setCargando] = useState(true)

  useEffect(() => { cargar() }, [trabajador.id])

  const cargar = async () => {
    const [{ data: reqs }, { data: est }] = await Promise.all([
      supabase.from('documentos_requeridos').select('*')
        .eq('cliente_id', cliente.id)
        .in('aplica_a', ['ambos_trabajadores', trabajador.tipo])
        .eq('activo', true).order('nombre'),
      supabase.from('docs_trabajador').select('*').eq('trabajador_id', trabajador.id),
    ])
    if (reqs) setDocsReq(reqs)
    if (est) { const m = {}; est.forEach(d => { m[d.documento_id] = d }); setDocsEstado(m) }
    setCargando(false)
  }

  const updateDoc = async (docId, field, value) => {
    setGuardando(docId)
    const ex = docsEstado[docId]
    const payload = { trabajador_id: trabajador.id, documento_id: docId, updated_at: new Date().toISOString(), [field]: value }
    if (ex) await supabase.from('docs_trabajador').update(payload).eq('id', ex.id)
    else await supabase.from('docs_trabajador').insert({
      ...payload,
      recibido: field === 'recibido' ? value : false,
      aplica: field === 'aplica' ? value : true,
    })
    await cargar(); setGuardando(null)
  }

  if (cargando) return (
    <div className="flex items-center justify-center gap-2.5 py-20 text-slate">
      <Loader2 className="w-5 h-5 animate-spin" strokeWidth={2} />
      Cargando...
    </div>
  )

  const estados = docsReq.map(d => {
    const e = docsEstado[d.id]
    const aplica = e ? e.aplica !== false : true
    return calcEstado(aplica, e?.recibido, e?.fecha_vencimiento)
  })

  return (
    <div className="max-w-[760px] mx-auto p-5 md:p-8">

      <div className="flex flex-wrap items-start justify-between gap-3 mb-6">
        <div>
          <h2 className="text-xl md:text-[22px] font-bold text-ink tracking-tight">
            {trabajador.apellido}, {trabajador.nombre}
          </h2>
          <p className="text-sm text-slate mt-1">
            {trabajador.tipo === 'dependencia' ? 'Relación de dependencia' : 'Monotributista / Autónomo'}
            {trabajador.cargo && ` · ${trabajador.cargo}`}
            {trabajador.dni && ` · DNI ${trabajador.dni}`}
          </p>
          <div className="mt-2.5"><Badge estado={peorEstado(estados)} /></div>
        </div>
        <BtnGhost onClick={onVolver}>
          <ArrowLeft className="w-4 h-4" strokeWidth={2} />
          Volver
        </BtnGhost>
      </div>

      {docsReq.length === 0 ? (
        <Card>
          <EmptyState Icon={FileText}
            title="Sin documentos configurados"
            desc="No hay documentos definidos para este tipo de trabajador." />
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="px-5 py-4 border-b border-hairline">
            <h3 className="text-[15px] font-semibold text-ink">Documentación requerida</h3>
          </div>
          {docsReq.map((doc, i) => {
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
    </div>
  )
}
