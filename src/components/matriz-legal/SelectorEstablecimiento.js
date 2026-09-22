'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { MapPin, ArrowRight, Loader2, Building2 } from 'lucide-react'
import { Card, EmptyState } from '../contratistas/ui'

export default function SelectorEstablecimiento({ cliente, esAdmin, onSeleccionar }) {
  const [establecimientos, setEstablecimientos] = useState([])
  const [cargando, setCargando] = useState(true)

  useEffect(() => { cargar() }, [cliente.id])

  const cargar = async () => {
    const { data } = await supabase.from('establecimientos').select('*')
      .eq('cliente_id', cliente.id).eq('activo', true).order('nombre')
    setEstablecimientos(data || [])
    setCargando(false)
  }

  if (cargando) return (
    <div className="flex items-center justify-center gap-2.5 py-20 text-slate">
      <Loader2 className="w-5 h-5 animate-spin" strokeWidth={2} />
      Cargando establecimientos...
    </div>
  )

  return (
    <div className="max-w-[760px] mx-auto p-5 md:p-8">
      <div className="mb-6">
        <h2 className="text-xl md:text-[22px] font-bold text-ink tracking-tight">Matriz de Cumplimiento Legal</h2>
        <p className="text-sm text-slate mt-0.5">
          Cliente: <span className="font-semibold text-ink">{cliente.nombre}</span> · elegí el establecimiento
        </p>
      </div>

      {establecimientos.length === 0 ? (
        <Card>
          <EmptyState
            Icon={MapPin}
            title="Este cliente no tiene establecimientos cargados"
            desc={esAdmin
              ? 'Agregalos desde Administración → Clientes → botón "Establecimientos".'
              : 'Pedile al administrador que cargue al menos uno.'}
          />
        </Card>
      ) : (
        <div className="flex flex-col gap-2.5">
          {establecimientos.map(e => (
            <button
              key={e.id}
              onClick={() => onSeleccionar(e)}
              className="flex items-center gap-3.5 text-left bg-white border border-hairline rounded-xl px-5 py-4
                         transition-colors hover:border-accent"
            >
              <div className="w-10 h-10 rounded-lg bg-accent-light flex items-center justify-center shrink-0">
                <Building2 className="w-5 h-5 text-accent" strokeWidth={1.8} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[15px] font-semibold text-ink">{e.nombre}</p>
                {e.direccion && <p className="text-[13px] text-slate mt-0.5">{e.direccion}</p>}
              </div>
              <ArrowRight className="w-4 h-4 text-slate shrink-0" strokeWidth={2} />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
