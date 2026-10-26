'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Loader2, Grid3x3, History } from 'lucide-react'
import { Card, EmptyState } from '../contratistas/ui'
import { FACTORES, NivelChip, indiceRiesgo, claveTarea, fechaCorta } from './comun'

// Matriz ergonómica del establecimiento:
// una fila por puesto y tarea, con la evaluación MÁS RECIENTE de cada una.
export default function MatrizErgonomica({ planta, onVerEstudio }) {
  const [filas, setFilas] = useState([])
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    const cargar = async () => {
      const { data } = await supabase
        .from('erg_estudios')
        .select('id, fecha, puesto, sector, erg_tareas(id, orden, nombre, erg_factores(factor, presente, nivel))')
        .eq('establecimiento_id', planta.id)
        .order('fecha', { ascending: false })

      const porClave = {}
      for (const e of data || []) {
        for (const t of e.erg_tareas || []) {
          const k = claveTarea(e.puesto, t.nombre)
          const factores = t.erg_factores || []
          const fila = {
            clave: k, estudioId: e.id, fecha: e.fecha, puesto: e.puesto, sector: e.sector,
            tarea: t.nombre, orden: t.orden,
            niveles: Object.fromEntries(factores.map(f => [f.factor, f.nivel])),
            n1: factores.filter(f => f.nivel === '1').length,
            n2: factores.filter(f => f.nivel === '2').length,
            n3: factores.filter(f => f.nivel === '3').length,
            aEvaluar: factores.filter(f => f.nivel === 'A evaluar').length,
            indice: indiceRiesgo(factores),
          }
          if (!porClave[k]) porClave[k] = { ...fila, anteriores: 0 }
          else porClave[k].anteriores += 1   // ya está la más reciente (orden por fecha desc)
        }
      }
      const lista = Object.values(porClave).sort((a, b) =>
        b.indice - a.indice || b.fecha.localeCompare(a.fecha) || a.puesto.localeCompare(b.puesto))
      setFilas(lista)
      setCargando(false)
    }
    cargar()
  }, [planta.id])

  if (cargando) return (
    <div className="flex items-center justify-center gap-2.5 py-16 text-slate">
      <Loader2 className="w-5 h-5 animate-spin" strokeWidth={2} />
      Armando la matriz...
    </div>
  )

  if (filas.length === 0) return (
    <Card><EmptyState Icon={Grid3x3} title="Todavía no hay estudios en este establecimiento" /></Card>
  )

  // % de tareas afectadas por cada factor (nivel 1, 2 o 3)
  const afectadas = Object.fromEntries(FACTORES.map(f => [
    f.id, filas.filter(r => ['1', '2', '3'].includes(r.niveles[f.id])).length / filas.length,
  ]))
  const totales = {
    n1: filas.reduce((s, r) => s + r.n1, 0),
    n2: filas.reduce((s, r) => s + r.n2, 0),
    n3: filas.reduce((s, r) => s + r.n3, 0),
    aEvaluar: filas.reduce((s, r) => s + r.aEvaluar, 0),
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Resumen */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-2.5">
        {[
          ['Tareas evaluadas', filas.length, 'text-ink'],
          ['Factores en nivel 3', totales.n3, 'text-red-800'],
          ['Factores en nivel 2', totales.n2, 'text-amber-800'],
          ['Factores en nivel 1', totales.n1, 'text-green-800'],
          ['A evaluar', totales.aEvaluar, 'text-slate'],
        ].map(([t, v, c]) => (
          <Card key={t} className="px-4 py-3">
            <p className="text-[11px] font-semibold text-slate uppercase tracking-wide">{t}</p>
            <p className={`text-2xl font-bold mt-0.5 ${c}`}>{v}</p>
          </Card>
        ))}
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse min-w-[980px]">
            <thead>
              <tr className="bg-slate-50 text-[11px] uppercase tracking-wide text-slate">
                <th className="text-left font-semibold px-3 py-2" colSpan={2}>Tareas afectadas por factor</th>
                {FACTORES.map(f => (
                  <th key={f.id} className="font-semibold px-1 py-2 text-center">
                    {Math.round(afectadas[f.id] * 100)}%
                  </th>
                ))}
                <th colSpan={5}></th>
              </tr>
              <tr className="border-b border-hairline text-[12px] text-slate">
                <th className="text-left font-semibold px-3 py-2.5">Puesto</th>
                <th className="text-left font-semibold px-3 py-2.5">Tarea</th>
                {FACTORES.map(f => (
                  <th key={f.id} className="font-semibold px-1 py-2.5 text-center w-[58px]" title={f.nombre}>
                    <span className="block text-ink">{f.id}</span>
                    <span className="block text-[10px] font-normal">{f.corto}</span>
                  </th>
                ))}
                <th className="font-semibold px-2 py-2.5 text-center" title="Factores en nivel 1">N1</th>
                <th className="font-semibold px-2 py-2.5 text-center" title="Factores en nivel 2">N2</th>
                <th className="font-semibold px-2 py-2.5 text-center" title="Factores en nivel 3">N3</th>
                <th className="font-semibold px-3 py-2.5 text-center">Índice</th>
                <th className="font-semibold px-3 py-2.5 text-left">Evaluación</th>
              </tr>
            </thead>
            <tbody>
              {filas.map(r => (
                <tr key={r.clave} onClick={() => onVerEstudio(r.estudioId)}
                    className="border-b border-hairline last:border-0 hover:bg-accent-light/40 cursor-pointer">
                  <td className="px-3 py-2.5 font-semibold text-ink">{r.puesto}</td>
                  <td className="px-3 py-2.5 text-ink">{r.tarea}</td>
                  {FACTORES.map(f => (
                    <td key={f.id} className="px-1 py-2 text-center"><NivelChip nivel={r.niveles[f.id]} /></td>
                  ))}
                  <td className="px-2 py-2 text-center text-slate">{r.n1}</td>
                  <td className="px-2 py-2 text-center text-slate">{r.n2}</td>
                  <td className="px-2 py-2 text-center text-slate">{r.n3}</td>
                  <td className="px-3 py-2 text-center">
                    <span className="inline-block min-w-[40px] px-2 py-1 rounded-md bg-ink text-white font-bold">{r.indice}</span>
                  </td>
                  <td className="px-3 py-2 text-[13px] text-slate whitespace-nowrap">
                    <button onClick={(e) => { e.stopPropagation(); onVerEstudio(r.estudioId) }}
                      className="text-accent font-semibold hover:underline">{fechaCorta(r.fecha)}</button>
                    {r.anteriores > 0 && (
                      <span className="ml-2 inline-flex items-center gap-1 text-[11px]" title="Evaluaciones anteriores de esta tarea">
                        <History className="w-3 h-3" strokeWidth={2} />{r.anteriores}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <p className="text-xs text-slate leading-relaxed">
        <strong className="text-ink">Índice de riesgo</strong> = (factores en nivel 1 × 1) + (nivel 2 × 4) + (nivel 3 × 9).
        "A ev." = a evaluar, no suma al índice. Cada fila muestra la evaluación más reciente de la tarea; tocala para abrir el estudio.
      </p>
    </div>
  )
}
