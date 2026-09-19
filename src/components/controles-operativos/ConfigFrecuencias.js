'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { ArrowLeft, Loader2, Check, Zap, Link2, Warehouse, Truck, MoveVertical, ShieldHalf, HeartPulse, DoorOpen, Flame, Droplets, HardHat as HardHatIcon, ArrowUpDown } from 'lucide-react'
import { Card, Select, Input, BtnGhost, FRECUENCIAS } from '../contratistas/ui'

const ICONOS = {
  tableros: Zap, aparejos: Link2, montacargas: Warehouse, autoelevadores: Truck,
  puente_grua: MoveVertical, resguardos: ShieldHalf, dea: HeartPulse, vias_evac: DoorOpen,
  hidrantes: Droplets, extintores: Flame, arneses: HardHatIcon, pemp: ArrowUpDown,
}

export default function ConfigFrecuencias({ cliente, onVolver }) {
  const [temas, setTemas] = useState([])
  const [configs, setConfigs] = useState({}) // { tema_id: { frecuencia, dias_alerta } }
  const [guardandoId, setGuardandoId] = useState(null)
  const [guardadoId, setGuardadoId] = useState(null)
  const [cargando, setCargando] = useState(true)

  useEffect(() => { cargar() }, [cliente.id])

  const cargar = async () => {
    setCargando(true)
    const [{ data: temasData }, { data: configsData }] = await Promise.all([
      supabase.from('co_temas').select('*').eq('activo', true).order('orden'),
      supabase.from('co_config').select('*').eq('cliente_id', cliente.id),
    ])
    const map = {}
    ;(configsData || []).forEach(c => { map[c.tema_id] = c })
    setTemas(temasData || [])
    setConfigs(map)
    setCargando(false)
  }

  const actualizar = async (temaId, campo, valor) => {
    setGuardandoId(temaId)
    const actual = configs[temaId] || { frecuencia: 'trimestral', dias_alerta: 30 }
    const nuevo = { ...actual, [campo]: valor }

    setConfigs(prev => ({ ...prev, [temaId]: nuevo }))

    await supabase.from('co_config').upsert({
      cliente_id: cliente.id,
      tema_id: temaId,
      frecuencia: nuevo.frecuencia,
      dias_alerta: nuevo.dias_alerta,
      activo: true,
    }, { onConflict: 'cliente_id,tema_id' })

    setGuardandoId(null)
    setGuardadoId(temaId)
    setTimeout(() => setGuardadoId(null), 1500)
  }

  if (cargando) return (
    <div className="flex items-center justify-center gap-2.5 py-20 text-slate">
      <Loader2 className="w-5 h-5 animate-spin" strokeWidth={2} />
      Cargando plan de controles...
    </div>
  )

  return (
    <div className="max-w-[860px] mx-auto p-5 md:p-8">

      <div className="flex flex-wrap items-start justify-between gap-3 mb-6">
        <div>
          <h2 className="text-xl md:text-[22px] font-bold text-ink tracking-tight">
            Plan de Controles Operativos
          </h2>
          <p className="text-sm text-slate mt-0.5">
            Cliente: <span className="font-semibold text-ink">{cliente.nombre}</span> · definí la frecuencia de cada tema
          </p>
        </div>
        <BtnGhost onClick={onVolver}>
          <ArrowLeft className="w-4 h-4" strokeWidth={2} />
          Volver
        </BtnGhost>
      </div>

      <Card className="overflow-hidden">
        {temas.map((t, i) => {
          const Icon = ICONOS[t.slug] || Zap
          const config = configs[t.id] || {}
          return (
            <div key={t.id}
              className={`flex flex-wrap items-center gap-4 px-5 py-4 ${i > 0 ? 'border-t border-hairline' : ''}`}>
              <div className="w-9 h-9 rounded-lg bg-accent-light flex items-center justify-center shrink-0">
                <Icon className="w-[18px] h-[18px] text-accent" strokeWidth={1.8} />
              </div>
              <p className="text-[15px] font-semibold text-ink flex-1 min-w-[160px]">{t.nombre}</p>

              <div className="w-[160px]">
                <Select
                  value={config.frecuencia || 'trimestral'}
                  onChange={e => actualizar(t.id, 'frecuencia', e.target.value)}
                  className="py-2 text-[13px]"
                >
                  {FRECUENCIAS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
                </Select>
              </div>

              <div className="w-[130px]">
                <Input
                  type="number"
                  value={config.dias_alerta ?? 30}
                  onChange={e => actualizar(t.id, 'dias_alerta', parseInt(e.target.value) || 0)}
                  className="py-2 text-[13px]"
                  placeholder="Días alerta"
                />
              </div>
              <span className="text-[11px] text-slate w-16 shrink-0">días antes</span>

              <div className="w-5 shrink-0">
                {guardandoId === t.id && <Loader2 className="w-4 h-4 animate-spin text-slate" strokeWidth={2} />}
                {guardadoId === t.id && <Check className="w-4 h-4 text-accent" strokeWidth={2.5} />}
              </div>
            </div>
          )
        })}
      </Card>

      <p className="text-xs text-slate mt-4">
        La frecuencia define cada cuánto se espera un nuevo control. Los días de alerta previa determinan cuándo el
        semáforo pasa a amarillo antes del vencimiento.
      </p>
    </div>
  )
}
