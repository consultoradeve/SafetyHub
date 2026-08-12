'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import {
  Zap, Link2, Warehouse, Truck, MoveVertical, ShieldHalf,
  HeartPulse, DoorOpen, Flame, Droplets, HardHat as HardHatIcon,
  ArrowUpDown, Settings, ArrowRight, Loader2, Clock
} from 'lucide-react'
import { Dot, Badge, Card, BtnGhost, EmptyState } from '../contratistas/ui'

// ─── ÍCONO POR TEMA (según slug) ──────────────────────────────────────────────
const ICONOS = {
  tableros: Zap,
  aparejos: Link2,
  montacargas: Warehouse,
  autoelevadores: Truck,
  puente_grua: MoveVertical,
  resguardos: ShieldHalf,
  dea: HeartPulse,
  vias_evac: DoorOpen,
  hidrantes: Droplets,
  extintores: Flame,
  arneses: HardHatIcon,
  pemp: ArrowUpDown,
}

// ─── FRECUENCIA → DÍAS ────────────────────────────────────────────────────────
const DIAS_FRECUENCIA = {
  diaria: 1, semanal: 7, quincenal: 15, mensual: 30,
  trimestral: 90, semestral: 180, anual: 365, unica: null,
}

const FRECUENCIA_LABEL = {
  diaria: 'Diaria', semanal: 'Semanal', quincenal: 'Quincenal', mensual: 'Mensual',
  trimestral: 'Trimestral', semestral: 'Semestral', anual: 'Anual', unica: 'Única vez',
  sin_config: 'Sin configurar',
}

// ─── CÁLCULO DE ESTADO POR TEMA ───────────────────────────────────────────────
function calcularEstadoTema(config, ultimoControl) {
  if (!config) return 'sin_config'
  if (!ultimoControl) return 'rojo' // nunca se hizo el control

  const dias = DIAS_FRECUENCIA[config.frecuencia]
  if (dias === null || dias === undefined) return 'verde' // única vez, ya se hizo

  const fechaUltimo = new Date(ultimoControl.fecha)
  const fechaProxima = new Date(fechaUltimo)
  fechaProxima.setDate(fechaProxima.getDate() + dias)

  const hoy = new Date()
  const diasRestantes = Math.ceil((fechaProxima - hoy) / 86400000)
  const alerta = config.dias_alerta ?? 30

  if (diasRestantes < 0) return 'rojo'
  if (diasRestantes <= alerta) return 'amarillo'
  return 'verde'
}

const SEMAFORO_EXTRA = {
  sin_config: { label: 'Sin configurar', dot: 'bg-slate-300', chip: 'bg-slate-100 text-slate-500 border-slate-200' },
}

export default function DashboardControlesOperativos({ cliente, esAdmin, onSeleccionarTema, onConfig }) {
  const [cargando, setCargando] = useState(true)
  const [temas, setTemas] = useState([])
  const [datos, setDatos] = useState({}) // { tema_id: { config, ultimoControl, estado } }

  useEffect(() => { cargar() }, [cliente.id])

  const cargar = async () => {
    setCargando(true)
    const [{ data: temasData }, { data: configs }, { data: controles }] = await Promise.all([
      supabase.from('co_temas').select('*').eq('activo', true).order('orden'),
      supabase.from('co_config').select('*').eq('cliente_id', cliente.id),
      supabase.from('co_controles').select('*').eq('cliente_id', cliente.id).order('fecha', { ascending: false }),
    ])

    const temasList = temasData || []
    const configsMap = {}
    ;(configs || []).forEach(c => { configsMap[c.tema_id] = c })

    const ultimosMap = {}
    ;(controles || []).forEach(c => {
      if (!ultimosMap[c.tema_id]) ultimosMap[c.tema_id] = c // ya viene ordenado desc
    })

    const nuevosDatos = {}
    temasList.forEach(t => {
      const config = configsMap[t.id]
      const ultimoControl = ultimosMap[t.id]
      nuevosDatos[t.id] = {
        config,
        ultimoControl,
        estado: calcularEstadoTema(config, ultimoControl),
      }
    })

    setTemas(temasList)
    setDatos(nuevosDatos)
    setCargando(false)
  }

  const totales = {
    total: temas.length,
    verde: Object.values(datos).filter(d => d.estado === 'verde').length,
    amarillo: Object.values(datos).filter(d => d.estado === 'amarillo').length,
    rojo: Object.values(datos).filter(d => d.estado === 'rojo').length,
    sin_config: Object.values(datos).filter(d => d.estado === 'sin_config').length,
  }

  const formatFecha = (f) => f
    ? new Date(f + 'T00:00:00').toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })
    : null

  if (cargando) return (
    <div className="flex items-center justify-center gap-2.5 py-20 text-slate">
      <Loader2 className="w-5 h-5 animate-spin" strokeWidth={2} />
      Cargando controles operativos...
    </div>
  )

  return (
    <div className="max-w-[1000px] mx-auto p-5 md:p-8">

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3 mb-6">
        <div>
          <h2 className="text-xl md:text-[22px] font-bold text-ink tracking-tight">Controles Operativos</h2>
          <p className="text-sm text-slate mt-0.5">
            Cliente: <span className="font-semibold text-ink">{cliente.nombre}</span>
          </p>
        </div>
        {esAdmin && (
          <BtnGhost onClick={onConfig}>
            <Settings className="w-4 h-4" strokeWidth={1.8} />
            Configurar frecuencias
          </BtnGhost>
        )}
      </div>

      {/* Tarjetas resumen */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-2.5 mb-6">
        {[
          { label: 'Total temas',   valor: totales.total,      cls: 'bg-white text-ink border-hairline' },
          { label: 'Al día',        valor: totales.verde,      cls: 'bg-green-50 text-green-800 border-green-200' },
          { label: 'Por vencer',    valor: totales.amarillo,   cls: 'bg-yellow-50 text-yellow-800 border-yellow-200' },
          { label: 'Vencidos',      valor: totales.rojo,       cls: 'bg-red-50 text-red-800 border-red-200' },
          { label: 'Sin configurar',valor: totales.sin_config, cls: 'bg-slate-100 text-slate border-slate-200' },
        ].map(({ label, valor, cls }) => (
          <div key={label} className={`border rounded-xl px-3 py-4 text-center ${cls}`}>
            <p className="text-[28px] font-bold leading-none">{valor}</p>
            <p className="text-xs font-semibold mt-1.5 opacity-80">{label}</p>
          </div>
        ))}
      </div>

      {/* Grilla de temas */}
      {temas.length === 0 ? (
        <Card><EmptyState title="No hay temas configurados" /></Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {temas
            .slice()
            .sort((a, b) => {
              const ord = { rojo: 0, amarillo: 1, sin_config: 2, verde: 3 }
              return (ord[datos[a.id]?.estado] ?? 4) - (ord[datos[b.id]?.estado] ?? 4)
            })
            .map(t => {
              const Icon = ICONOS[t.slug] || Zap
              const d = datos[t.id] || {}
              const estado = d.estado || 'sin_config'
              const semaforo = SEMAFORO_EXTRA[estado]

              return (
                <button
                  key={t.id}
                  onClick={() => onSeleccionarTema(t)}
                  className="text-left bg-white border border-hairline rounded-xl p-5
                             transition-all hover:border-accent hover:shadow-[0_4px_18px_rgba(15,81,50,.07)]"
                >
                  <div className="flex items-start justify-between mb-3.5">
                    <div className="w-10 h-10 rounded-lg bg-accent-light flex items-center justify-center">
                      <Icon className="w-5 h-5 text-accent" strokeWidth={1.8} />
                    </div>
                    <Dot estado={estado} />
                  </div>

                  <h3 className="text-[15px] font-semibold text-ink tracking-tight mb-2">
                    {t.nombre}
                  </h3>

                  <div className="flex items-center gap-1.5 text-xs text-slate mb-3">
                    <Clock className="w-3.5 h-3.5" strokeWidth={1.8} />
                    {d.config ? FRECUENCIA_LABEL[d.config.frecuencia] : 'Sin configurar'}
                  </div>

                  {d.ultimoControl ? (
                    <p className="text-xs text-slate mb-3">
                      Último control: {formatFecha(d.ultimoControl.fecha)}
                    </p>
                  ) : (
                    <p className="text-xs text-slate mb-3 italic">Sin controles registrados</p>
                  )}

                  <div className="flex items-center justify-between">
                    {semaforo
                      ? <span className={`inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-md border ${semaforo.chip}`}>{semaforo.label}</span>
                      : <Badge estado={estado} />}
                    <span className="flex items-center gap-1 text-xs font-semibold text-accent">
                      Ver
                      <ArrowRight className="w-3.5 h-3.5" strokeWidth={2} />
                    </span>
                  </div>
                </button>
              )
            })}
        </div>
      )}
    </div>
  )
}
