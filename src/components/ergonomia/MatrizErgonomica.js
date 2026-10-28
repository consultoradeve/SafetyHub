'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Loader2, Grid3x3, History } from 'lucide-react'
import { Card, EmptyState } from '../contratistas/ui'
import { indiceRiesgo, claveTarea, fechaCorta } from './comun'

// Matriz ergonómica del establecimiento (formato del Excel PEI de Devé).
// Una fila por puesto y tarea, con la evaluación MÁS RECIENTE de cada una.
// El índice de riesgo se calcula solo (criterio de Devé) y se muestra sin el detalle del cálculo.

const FACTORES = [
  { id: 'A', nombre: 'Levantamiento y descenso', pregunta: '¿Realiza levantamiento y/o descenso mayor a 2 kg?', planilla: '2A' },
  { id: 'B', nombre: 'Empuje / arrastre', pregunta: '¿Empuja y/o arrastra manualmente un objeto?', planilla: '2B' },
  { id: 'C', nombre: 'Transporte', pregunta: '¿Transporta un peso mayor a 2 kg?', planilla: '2C' },
  { id: 'D', nombre: 'Bipedestación', pregunta: '¿Se encuentra de pie sin posibilidad de sentarse?', planilla: '2D' },
  { id: 'E', nombre: 'Movimientos repetitivos', pregunta: '¿Realiza una monotarea durante 4 h o más?', planilla: '2E' },
  { id: 'F', nombre: 'Postura forzada', pregunta: '¿Adopta posturas forzadas?', planilla: '2F' },
  { id: 'G', nombre: 'Vibraciones', pregunta: '¿Expuesto a vibraciones de miembros superiores o cuerpo entero?', planilla: '2G' },
  { id: 'H', nombre: 'Confort térmico', pregunta: '¿Expuesto a temperaturas no confortables para la tarea?', planilla: '2H' },
  { id: 'I', nombre: 'Estrés de contacto', pregunta: '¿Mantiene alguna parte del cuerpo ejerciendo presión?', planilla: '2I' },
]

const CELDA = {
  '1': 'bg-[#CDEFD8] text-[#14532D]',
  '2': 'bg-[#FBDF9C] text-[#713F12]',
  '3': 'bg-[#F2A99F] text-[#7F1D1D]',
  'A evaluar': 'bg-white text-slate-700 border-[1.5px] border-dashed border-slate-500 text-[10px]',
}

const estiloIndice = (niveles) => {
  const v = Object.values(niveles)
  if (v.includes('3')) return 'bg-[#7F1D1D] text-white'
  if (v.includes('2')) return 'bg-[#713F12] text-white'
  if (v.includes('1')) return 'bg-[#14532D] text-white'
  return 'bg-slate-100 text-slate-700'
}

const COLS = 'grid-cols-[236px_repeat(9,minmax(0,1fr))_86px]'

export default function MatrizErgonomica({ cliente, planta, onVerEstudio }) {
  const [grupos, setGrupos] = useState([])
  const [filas, setFilas] = useState([])
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    const cargar = async () => {
      const { data } = await supabase
        .from('erg_estudios')
        .select('id, fecha, puesto, sector, erg_tareas(id, orden, nombre, erg_factores(factor, nivel))')
        .eq('establecimiento_id', planta.id)
        .order('fecha', { ascending: false })

      const porClave = {}
      for (const e of data || []) {
        for (const t of (e.erg_tareas || []).sort((a, b) => a.orden - b.orden)) {
          const k = claveTarea(e.puesto, t.nombre)
          if (porClave[k]) { porClave[k].anteriores += 1; continue }   // ya está la más reciente
          const factores = t.erg_factores || []
          porClave[k] = {
            clave: k, estudioId: e.id, fecha: e.fecha, puesto: e.puesto, sector: e.sector, tarea: t.nombre,
            niveles: Object.fromEntries(factores.filter(f => f.nivel).map(f => [f.factor, f.nivel])),
            indice: indiceRiesgo(factores), anteriores: 0,
          }
        }
      }
      const lista = Object.values(porClave)
      // Agrupar por puesto; puestos y tareas ordenados por índice (mayor primero)
      const g = {}
      for (const r of lista) {
        if (!g[r.puesto]) g[r.puesto] = { puesto: r.puesto, sector: r.sector, fecha: r.fecha, tareas: [] }
        g[r.puesto].tareas.push(r)
        if (r.fecha > g[r.puesto].fecha) g[r.puesto].fecha = r.fecha
      }
      const gl = Object.values(g)
      gl.forEach(x => { x.tareas.sort((a, b) => b.indice - a.indice); x.max = x.tareas[0]?.indice || 0 })
      gl.sort((a, b) => b.max - a.max || b.fecha.localeCompare(a.fecha))
      setFilas(lista)
      setGrupos(gl)
      setCargando(false)
    }
    cargar()
  }, [planta.id])

  if (cargando) return (
    <div className="flex items-center justify-center gap-2.5 py-16 text-slate">
      <Loader2 className="w-5 h-5 animate-spin" strokeWidth={2} /> Armando la matriz...
    </div>
  )
  if (filas.length === 0) return (
    <Card><EmptyState Icon={Grid3x3} title="Todavía no hay estudios en este establecimiento" /></Card>
  )

  const pct = (id) => Math.round(filas.filter(r => ['1', '2', '3'].includes(r.niveles[id])).length / filas.length * 100)
  const ultima = filas.reduce((m, r) => (r.fecha > m ? r.fecha : m), '')

  return (
    <div className="flex flex-col gap-4">
      <div>
        <p className="text-xs font-semibold text-accent uppercase tracking-wider">Análisis ergonómico · PEI conf. Res. SRT 886/2015</p>
        <h3 className="text-xl font-bold text-ink mt-1">{cliente?.nombre}</h3>
        <p className="text-sm text-slate mt-0.5">
          {planta.direccion || planta.nombre} · {filas.length} tareas en {grupos.length} puestos · última evaluación {fechaCorta(ultima)}
        </p>
      </div>

      <Card className="px-4 py-3 text-[13px] text-slate leading-relaxed">
        El profesional ergónomo realiza un análisis de la tarea y determina en cada caso si alguno de los factores de riesgo se presentan en dicho puesto.
        En caso afirmativo, completa la Planilla 2 correspondiente al factor de riesgo y (de ser necesario) la evaluación ergonómica.
      </Card>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <div className="min-w-[1080px]">
            <div className={`grid ${COLS} bg-[#1F2A24] text-white text-xs`}>
              <div className="px-3.5 py-2.5 font-semibold">Factores de riesgo de la jornada habitual de trabajo</div>
              <div className="col-span-9 px-3.5 py-2.5 font-semibold text-center border-l border-[#3A4740]">
                IDENTIFICACIÓN DE FACTORES DE RIESGO: ¿El puesto se encuentra expuesto al siguiente factor de riesgo?
              </div>
              <div className="px-2 py-2.5 font-semibold text-center border-l border-[#3A4740]">Índice de riesgo</div>
            </div>

            <div className={`grid ${COLS} border-b border-hairline text-[11px] text-slate`}>
              <div className="px-3.5 py-2.5 flex flex-col justify-end gap-1">
                <span className="text-xs font-bold text-ink">Puesto / tarea</span>
                <span>Evaluación inicial de factores de riesgo</span>
              </div>
              {FACTORES.map(f => (
                <div key={f.id} className="px-1.5 py-2 border-l border-slate-100 flex flex-col gap-1 text-center">
                  <span className="text-[15px] font-bold text-ink">{f.id}</span>
                  <span className="font-bold text-ink leading-tight">{f.nombre}</span>
                  <span className="leading-snug min-h-[56px]">{f.pregunta}</span>
                  <span className="font-semibold text-accent">Planilla {f.planilla}</span>
                </div>
              ))}
              <div className="border-l border-slate-100" />
            </div>

            <div className={`grid ${COLS} bg-[#F3F6F2] border-b border-hairline text-xs`}>
              <div className="px-3.5 py-2 font-semibold">Tareas afectadas por factor</div>
              {FACTORES.map(f => (
                <div key={f.id} className="px-1.5 py-1.5 border-l border-[#E6EAE5] flex flex-col items-center gap-1">
                  <span className="font-bold">{pct(f.id)}%</span>
                  <span className="block w-4/5 h-[5px] bg-[#E1E4E0] rounded overflow-hidden">
                    <span className="block h-[5px] bg-accent" style={{ width: `${pct(f.id)}%` }} />
                  </span>
                </div>
              ))}
              <div className="border-l border-[#E6EAE5]" />
            </div>

            {grupos.map(g => (
              <div key={g.puesto} className="border-b border-hairline">
                <div className="flex justify-between items-center px-3.5 pt-2 pb-1 bg-[#FAFBF9]">
                  <span className="text-sm font-bold text-ink">{g.puesto}</span>
                  <span className="text-xs text-slate">{[g.sector, `evaluado ${fechaCorta(g.fecha)}`].filter(Boolean).join(' · ')}</span>
                </div>
                {g.tareas.map(r => (
                  <div key={r.clave} onClick={() => onVerEstudio(r.estudioId)}
                       className={`grid ${COLS} items-center text-[13px] cursor-pointer hover:bg-accent-light/40`}>
                    <div className="pl-6 pr-3 py-1 text-ink flex items-center gap-2">
                      {r.tarea}
                      {r.anteriores > 0 && (
                        <span className="inline-flex items-center gap-0.5 text-[11px] text-slate" title="Evaluaciones anteriores de esta tarea">
                          <History className="w-3 h-3" strokeWidth={2} />{r.anteriores}
                        </span>
                      )}
                    </div>
                    {FACTORES.map(f => {
                      const n = r.niveles[f.id]
                      return (
                        <div key={f.id} className="px-1.5 py-[3px]">
                          <div className={`h-7 rounded-[5px] flex items-center justify-center font-bold text-[13px] ${n ? CELDA[n] : 'bg-[#F4F5F3] text-[#8A928E] font-normal'}`}
                               title={n ? (n === 'A evaluar' ? 'A evaluar' : `Nivel ${n}`) : 'No presente'}>
                            {n ? (n === 'A evaluar' ? 'A ev.' : n) : '–'}
                          </div>
                        </div>
                      )
                    })}
                    <div className="text-center">
                      <span className={`inline-block min-w-[36px] px-2 py-0.5 rounded-md font-bold ${estiloIndice(r.niveles)}`}>{r.indice}</span>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs text-slate">
        {[
          ['1', 'Tolerable.', 'No se requieren medidas para proteger la salud del trabajador.', CELDA['1']],
          ['2', 'Moderado.', 'Se deben implementar medidas correctivas y/o preventivas.', CELDA['2']],
          ['3', 'No tolerable.', 'Medidas en forma inmediata para disminuir el riesgo.', CELDA['3']],
          ['A ev.', 'A evaluar.', 'Pendiente de definir por la ergónoma.', 'bg-white text-slate-700 border-[1.5px] border-dashed border-slate-500 text-[9px]'],
          ['–', 'No presente.', 'El factor no aparece en la tarea.', 'bg-[#F4F5F3] text-[#8A928E]'],
        ].map(([n, t, d, c]) => (
          <div key={t} className="flex gap-2 items-start">
            <span className={`flex-none w-[26px] h-[22px] rounded flex items-center justify-center font-bold ${c}`}>{n}</span>
            <span><strong className="text-ink">{t}</strong> {d}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
