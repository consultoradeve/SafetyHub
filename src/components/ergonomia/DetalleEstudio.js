'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { ArrowLeft, Loader2, Flag, ImageOff } from 'lucide-react'
import { Card, BtnGhost } from '../contratistas/ui'
import { FACTORES, METODOS, NivelChip, ESTILO_ESTADO, indiceRiesgo, fechaCorta } from './comun'

const siNo = (v) => v === true ? 'Sí' : v === false ? 'No' : '—'

function Fotos({ fotos, urls }) {
  if (!fotos.length) return null
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
      {fotos.map(f => (
        <a key={f.id} href={urls[f.ruta] || '#'} target="_blank" rel="noreferrer"
           className="block rounded-md overflow-hidden border border-hairline bg-slate-50 aspect-[4/3]">
          {urls[f.ruta] ? (
            <img src={urls[f.ruta]} alt={f.epigrafe || 'Foto del estudio'} className="w-full h-full object-cover" loading="lazy" />
          ) : (
            <span className="w-full h-full flex items-center justify-center text-slate-300">
              <ImageOff className="w-6 h-6" strokeWidth={1.5} />
            </span>
          )}
        </a>
      ))}
    </div>
  )
}

function Medidas({ medidas }) {
  if (!medidas.length) return <p className="text-sm text-slate italic">Sin medidas específicas.</p>
  return (
    <ol className="flex flex-col gap-2.5">
      {medidas.map(m => (
        <li key={m.id} className="flex gap-3">
          <span className="w-6 shrink-0 text-[13px] font-bold text-slate pt-0.5">{m.numero}.</span>
          <div className="flex-1">
            <div className="flex flex-wrap gap-1.5 mb-1">
              {m.priorizar && (
                <span className="inline-flex items-center gap-1 text-[11px] px-1.5 py-0.5 rounded bg-red-100 text-red-900 font-bold">
                  <Flag className="w-3 h-3" strokeWidth={2.2} /> PRIORIZAR
                </span>
              )}
              <span className={`text-[11px] px-1.5 py-0.5 rounded font-semibold ${ESTILO_ESTADO[m.estado]}`}>{m.estado}</span>
            </div>
            <p className="text-[14px] text-ink leading-relaxed whitespace-pre-line">{m.texto}</p>
            {m.observaciones && <p className="text-[12px] text-slate mt-1">{m.observaciones}</p>}
          </div>
        </li>
      ))}
    </ol>
  )
}

export default function DetalleEstudio({ estudioId, onVolver }) {
  const [e, setE] = useState(null)
  const [urls, setUrls] = useState({})

  useEffect(() => {
    const cargar = async () => {
      const { data } = await supabase.from('erg_estudios')
        .select('*, erg_tareas(*, erg_factores(*), erg_evaluaciones(*)), erg_medidas(*), erg_fotos(*)')
        .eq('id', estudioId).single()
      if (!data) return
      data.erg_tareas.sort((a, b) => a.orden - b.orden)
      data.erg_medidas.sort((a, b) => (a.numero || 0) - (b.numero || 0))
      data.erg_fotos.sort((a, b) => a.orden - b.orden)
      setE(data)
      // Fotos del depósito privado: enlaces temporales (1 hora)
      const rutas = data.erg_fotos.map(f => f.ruta)
      if (rutas.length) {
        const { data: firmadas } = await supabase.storage.from('ergonomia').createSignedUrls(rutas, 3600)
        setUrls(Object.fromEntries((firmadas || []).filter(x => x.signedUrl).map(x => [x.path, x.signedUrl])))
      }
    }
    cargar()
  }, [estudioId])

  if (!e) return (
    <div className="flex items-center justify-center gap-2.5 py-20 text-slate">
      <Loader2 className="w-5 h-5 animate-spin" strokeWidth={2} /> Cargando estudio...
    </div>
  )

  const fotosGenerales = e.erg_fotos.filter(f => !f.tarea_id && !f.medida_id)
  const medidasGenerales = e.erg_medidas.filter(m => !m.tarea_id)
  const datos = [
    ['Sector', e.sector], ['Jornada', e.jornada], ['Turnos', e.turnos], ['Rotaciones', e.rotaciones],
    ['Descansos formales', e.descansos_formales], ['Descansos informales', e.descansos_informales],
    ['Postura', e.postura], ['N.º de trabajadores', e.n_trabajadores],
    ['Procedimiento escrito', siNo(e.procedimiento_escrito)], ['Capacitación', siNo(e.capacitacion)],
    ['Manifestación temprana', siNo(e.manifestacion_temprana)],
  ].filter(([, v]) => v)

  return (
    <div className="max-w-[1000px] mx-auto p-5 md:p-8 flex flex-col gap-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold text-accent uppercase tracking-wider mb-1">
            Protocolo de Ergonomía · Res. SRT 886/2015
          </p>
          <h2 className="text-xl md:text-[24px] font-bold text-ink tracking-tight">{e.puesto}</h2>
          <p className="text-sm text-slate mt-0.5">
            {fechaCorta(e.fecha)}{e.evaluador_texto ? ` · Evaluación: ${e.evaluador_texto}` : ''}
            {e.origen === 'migrado' && ' · Migrado de informe Word'}
          </p>
        </div>
        <BtnGhost onClick={onVolver}><ArrowLeft className="w-4 h-4" strokeWidth={2} /> Volver</BtnGhost>
      </div>

      <Card className="p-5">
        <h3 className="text-[15px] font-semibold text-ink mb-3">Datos del puesto</h3>
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
          {datos.map(([k, v]) => (
            <div key={k} className="flex gap-2 text-[14px]">
              <dt className="text-slate min-w-[150px]">{k}</dt>
              <dd className="text-ink">{v}</dd>
            </div>
          ))}
        </dl>
        {e.descripcion && <p className="text-[14px] text-ink leading-relaxed whitespace-pre-line mt-4">{e.descripcion}</p>}
        {fotosGenerales.length > 0 && <div className="mt-4"><Fotos fotos={fotosGenerales} urls={urls} /></div>}
      </Card>

      {e.erg_tareas.map(t => {
        const presentes = (t.erg_factores || []).filter(f => f.presente || f.nivel)
        const fotosTarea = e.erg_fotos.filter(f => f.tarea_id === t.id)
        const medidasTarea = e.erg_medidas.filter(m => m.tarea_id === t.id)
        const evals = (t.erg_evaluaciones || []).sort((a, b) => a.orden - b.orden)
        return (
          <Card key={t.id} className="p-5 flex flex-col gap-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-[17px] font-bold text-ink">Tarea {t.orden}: {t.nombre}</h3>
              <span className="text-[13px] text-slate">
                Índice de riesgo <span className="ml-1 inline-block px-2 py-0.5 rounded bg-ink text-white font-bold">{indiceRiesgo(t.erg_factores)}</span>
              </span>
            </div>
            {t.descripcion && <p className="text-[14px] text-ink leading-relaxed whitespace-pre-line">{t.descripcion}</p>}

            <div>
              <p className="text-[11px] font-bold text-slate uppercase tracking-wider mb-2">Planilla 1 · Factores de riesgo</p>
              {presentes.length === 0 ? (
                <p className="text-sm text-slate italic">Sin factores de riesgo presentes.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {FACTORES.filter(f => presentes.some(p => p.factor === f.id)).map(f => {
                    const p = presentes.find(x => x.factor === f.id)
                    return (
                      <span key={f.id} className="inline-flex items-center gap-2 pl-2.5 pr-1 py-1 rounded-md border border-hairline text-[13px] text-ink">
                        {f.id} · {f.nombre}{e.exposicion?.[f.id] ? ` (${e.exposicion[f.id]})` : ''}
                        <NivelChip nivel={p.nivel} />
                      </span>
                    )
                  })}
                </div>
              )}
            </div>

            {evals.length > 0 && (
              <div>
                <p className="text-[11px] font-bold text-slate uppercase tracking-wider mb-2">Métodos de evaluación</p>
                <div className="flex flex-col gap-2.5">
                  {evals.map(ev => (
                    <div key={ev.id} className="rounded-md bg-slate-50 border border-hairline px-4 py-3">
                      <p className="text-[14px] font-semibold text-ink">{METODOS[ev.metodo] || ev.metodo}</p>
                      {ev.datos?.titulo && <p className="text-[12px] text-slate">{ev.datos.titulo}</p>}
                      {ev.resultado && <p className="text-[13px] text-ink mt-1.5">{ev.resultado}</p>}
                      {ev.conclusion && <p className="text-[13px] text-ink mt-1.5 whitespace-pre-line"><strong>Conclusión:</strong> {ev.conclusion}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div>
              <p className="text-[11px] font-bold text-slate uppercase tracking-wider mb-2">Medidas correctivas y preventivas</p>
              <Medidas medidas={medidasTarea} />
            </div>

            {fotosTarea.length > 0 && (
              <div>
                <p className="text-[11px] font-bold text-slate uppercase tracking-wider mb-2">Fotos</p>
                <Fotos fotos={fotosTarea} urls={urls} />
              </div>
            )}
          </Card>
        )
      })}

      {medidasGenerales.length > 0 && (
        <Card className="p-5">
          <h3 className="text-[15px] font-semibold text-ink mb-3">Medidas para todas las tareas</h3>
          <Medidas medidas={medidasGenerales} />
        </Card>
      )}
    </div>
  )
}
