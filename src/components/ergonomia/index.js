'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { MapPin, ArrowRight, ArrowLeft, Loader2, Grid3x3, FileText, ListChecks } from 'lucide-react'
import { Card, EmptyState, BtnGhost } from '../contratistas/ui'
import MatrizErgonomica from './MatrizErgonomica'
import ListaEstudios from './ListaEstudios'
import DetalleEstudio from './DetalleEstudio'
import Acciones from './Acciones'
import ChecklistCampo from './ChecklistCampo'

const PESTANAS = [
  { id: 'matriz',   label: 'Matriz ergonómica', Icon: Grid3x3 },
  { id: 'estudios', label: 'Estudios',          Icon: FileText },
  { id: 'acciones', label: 'Acciones',          Icon: ListChecks },
]

export default function Ergonomia({ cliente, esAdmin, puedeCargar }) {
  const [plantas, setPlantas] = useState([])
  const [planta, setPlanta] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [pestana, setPestana] = useState('matriz')
  const [estudioId, setEstudioId] = useState(null)
  const [checklist, setChecklist] = useState(null) // null | 'nuevo' | id de un borrador
  const [refresco, setRefresco] = useState(0)
  const abrirEstudio = (id, estado) => (estado === 'borrador' && puedeCargar) ? setChecklist(id) : setEstudioId(id)

  useEffect(() => {
    const cargar = async () => {
      const { data } = await supabase.from('establecimientos').select('*')
        .eq('cliente_id', cliente.id).eq('activo', true).order('nombre')
      const conModulo = (data || []).filter(e => (e.modulos || []).includes('ergonomico'))
      setPlantas(conModulo)
      if (conModulo.length === 1) setPlanta(conModulo[0])
      setCargando(false)
    }
    cargar()
  }, [cliente.id])

  if (cargando) return (
    <div className="flex items-center justify-center gap-2.5 py-20 text-slate">
      <Loader2 className="w-5 h-5 animate-spin" strokeWidth={2} />
      Cargando...
    </div>
  )

  // Elegir planta
  if (!planta) return (
    <div className="max-w-[760px] mx-auto p-5 md:p-8">
      <h2 className="text-xl md:text-[22px] font-bold text-ink tracking-tight">Ergonomía</h2>
      <p className="text-sm text-slate mt-0.5 mb-6">
        Cliente: <span className="font-semibold text-ink">{cliente.nombre}</span> · elegí el establecimiento
      </p>
      {plantas.length === 0 ? (
        <Card>
          <EmptyState Icon={MapPin} title="Ningún establecimiento tiene Ergonomía activa"
            desc={esAdmin ? 'Activala en Administración → Clientes → Establecimientos.' : null} />
        </Card>
      ) : (
        <div className="flex flex-col gap-2">
          {plantas.map(p => (
            <button key={p.id} onClick={() => setPlanta(p)}
              className="w-full min-h-[56px] flex items-center gap-3 px-4 py-3 rounded-lg border-[1.5px] border-hairline bg-surface text-left hover:border-accent hover:bg-accent-light group">
              <MapPin className="w-[18px] h-[18px] text-slate group-hover:text-accent" strokeWidth={1.8} />
              <span className="flex-1">
                <span className="block text-[15px] font-semibold text-ink">{p.nombre}</span>
                {p.direccion && <span className="block text-xs text-slate">{p.direccion}</span>}
              </span>
              <ArrowRight className="w-4 h-4 text-slate group-hover:text-accent" strokeWidth={2} />
            </button>
          ))}
        </div>
      )}
    </div>
  )

  if (checklist) return (
    <ChecklistCampo cliente={cliente} planta={planta} estudioId={checklist === 'nuevo' ? null : checklist}
      onCerrar={() => { setChecklist(null); setPestana('estudios'); setRefresco(r => r + 1) }} />
  )

  if (estudioId) return (
    <DetalleEstudio estudioId={estudioId} esAdmin={esAdmin} onVolver={() => setEstudioId(null)} />
  )

  return (
    <div className="max-w-[1200px] mx-auto p-5 md:p-8">
      <div className="flex flex-wrap items-start justify-between gap-3 mb-5">
        <div>
          <h2 className="text-xl md:text-[22px] font-bold text-ink tracking-tight">Ergonomía</h2>
          <p className="text-sm text-slate mt-0.5">
            {cliente.nombre} · <span className="font-semibold text-ink">{planta.nombre}</span>
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {puedeCargar && (
            <button onClick={() => setChecklist('nuevo')}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-md text-sm font-semibold text-white bg-accent hover:bg-accent-hover">
              + Nuevo estudio
            </button>
          )}
          {plantas.length > 1 && (
            <BtnGhost onClick={() => setPlanta(null)}>
              <ArrowLeft className="w-4 h-4" strokeWidth={2} />
              Cambiar establecimiento
            </BtnGhost>
          )}
        </div>
      </div>

      <div className="flex gap-1 border-b border-hairline mb-5 overflow-x-auto" role="tablist">
        {PESTANAS.map(({ id, label, Icon }) => (
          <button key={id} role="tab" aria-selected={pestana === id} onClick={() => setPestana(id)}
            className={`inline-flex items-center gap-1.5 px-4 py-2.5 text-[14px] font-semibold border-b-2 -mb-px whitespace-nowrap
                        ${pestana === id ? 'border-accent text-accent' : 'border-transparent text-slate hover:text-ink'}`}>
            <Icon className="w-4 h-4" strokeWidth={1.8} />
            {label}
          </button>
        ))}
      </div>

      {pestana === 'matriz'   && <MatrizErgonomica cliente={cliente} planta={planta} onVerEstudio={setEstudioId} />}
      {pestana === 'estudios' && <ListaEstudios key={refresco} planta={planta} onVerEstudio={abrirEstudio} />}
      {pestana === 'acciones' && <Acciones planta={planta} onVerEstudio={setEstudioId} />}
    </div>
  )
}
