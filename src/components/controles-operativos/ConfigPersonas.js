'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { ArrowLeft, Plus, Trash2, Loader2, UserCheck, Users } from 'lucide-react'
import { Card, Label, Input, BtnPrimary, BtnGhost, EmptyState } from '../contratistas/ui'

// ─── AUDITORES (globales, compartidos entre todos los clientes) ─────────────
function ListaAuditores() {
  const [items, setItems] = useState([])
  const [nombre, setNombre] = useState('')
  const [matricula, setMatricula] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [confirmDel, setConfirmDel] = useState(null)
  const [cargando, setCargando] = useState(true)

  useEffect(() => { cargar() }, [])

  const cargar = async () => {
    const { data } = await supabase.from('co_auditores').select('*').order('nombre')
    setItems(data || [])
    setCargando(false)
  }

  const agregar = async () => {
    if (!nombre.trim()) return
    setGuardando(true)
    await supabase.from('co_auditores').insert({ nombre: nombre.trim(), matricula: matricula.trim() || null })
    setNombre(''); setMatricula('')
    await cargar()
    setGuardando(false)
  }

  const toggleActivo = async (item) => {
    await supabase.from('co_auditores').update({ activo: !item.activo }).eq('id', item.id)
    await cargar()
  }

  const eliminar = async (id) => {
    await supabase.from('co_auditores').delete().eq('id', id)
    setConfirmDel(null)
    await cargar()
  }

  return (
    <Card className="overflow-hidden">
      <div className="px-5 py-4 border-b border-hairline flex items-center gap-2.5">
        <UserCheck className="w-[18px] h-[18px] text-accent" strokeWidth={1.8} />
        <div>
          <h3 className="text-[15px] font-semibold text-ink">Auditores</h3>
          <p className="text-xs text-slate mt-0.5">Lista compartida — visible para todos los clientes</p>
        </div>
      </div>

      <div className="p-5 border-b border-hairline">
        <div className="flex flex-col gap-2.5">
          <div className="flex flex-col sm:flex-row gap-2.5">
            <Input
              placeholder="Nombre y apellido..."
              value={nombre}
              onChange={e => setNombre(e.target.value)}
              className="flex-1 min-w-0"
            />
            <Input
              placeholder="Matrícula (opcional)"
              value={matricula}
              onChange={e => setMatricula(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && agregar()}
              className="sm:w-[160px]"
            />
          </div>
          <BtnPrimary onClick={agregar} disabled={guardando || !nombre.trim()} className="w-full sm:w-auto sm:self-end">
            <Plus className="w-4 h-4" strokeWidth={2.2} />
            Agregar
          </BtnPrimary>
        </div>
      </div>

      {cargando ? (
        <div className="flex items-center justify-center gap-2 py-8 text-slate text-sm">
          <Loader2 className="w-4 h-4 animate-spin" strokeWidth={2} />
          Cargando...
        </div>
      ) : items.length === 0 ? (
        <EmptyState title="Sin auditores cargados" desc="Agregá el primero desde el campo de arriba." />
      ) : (
        items.map((item, i) => (
          <div key={item.id}
            className={`flex flex-wrap items-center gap-2 px-5 py-3.5 ${i > 0 ? 'border-t border-hairline' : ''} ${!item.activo ? 'opacity-45' : ''}`}>
            <div className="flex-1 min-w-[120px]">
              <p className="text-[15px] text-ink">{item.nombre}</p>
              {item.matricula && <p className="text-xs text-slate mt-0.5">Matrícula: {item.matricula}</p>}
            </div>
            <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-md shrink-0
              ${item.activo ? 'bg-accent-light text-accent' : 'bg-hairline text-slate'}`}>
              {item.activo ? 'Activo' : 'Inactivo'}
            </span>
            <button onClick={() => toggleActivo(item)}
              className="px-3 py-1.5 rounded-md text-[13px] font-semibold text-slate shrink-0
                         border-[1.5px] border-hairline transition-colors hover:border-accent hover:text-accent">
              {item.activo ? 'Desactivar' : 'Activar'}
            </button>
            {confirmDel === item.id ? (
              <div className="flex items-center gap-1.5 shrink-0">
                <span className="text-[13px] text-danger">¿Confirmar?</span>
                <button onClick={() => eliminar(item.id)}
                  className="px-2.5 py-1.5 rounded-md text-[13px] font-semibold text-white bg-danger hover:bg-red-800">
                  Sí
                </button>
                <button onClick={() => setConfirmDel(null)}
                  className="px-2.5 py-1.5 rounded-md text-[13px] font-semibold text-slate border-[1.5px] border-hairline">
                  No
                </button>
              </div>
            ) : (
              <button onClick={() => setConfirmDel(item.id)}
                className="p-1.5 rounded-md text-danger border-[1.5px] border-red-200 transition-colors hover:bg-red-50 shrink-0">
                <Trash2 className="w-3.5 h-3.5" strokeWidth={2} />
              </button>
            )}
          </div>
        ))
      )}
    </Card>
  )
}

// ─── RESPONSABLES (por cliente) ──────────────────────────────────────────────
function ListaResponsables({ cliente }) {
  const [items, setItems] = useState([])
  const [nombre, setNombre] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [confirmDel, setConfirmDel] = useState(null)
  const [cargando, setCargando] = useState(true)

  useEffect(() => { cargar() }, [cliente.id])

  const cargar = async () => {
    const { data } = await supabase.from('co_responsables').select('*')
      .eq('cliente_id', cliente.id).order('nombre')
    setItems(data || [])
    setCargando(false)
  }

  const agregar = async () => {
    if (!nombre.trim()) return
    setGuardando(true)
    await supabase.from('co_responsables').insert({ cliente_id: cliente.id, nombre: nombre.trim() })
    setNombre('')
    await cargar()
    setGuardando(false)
  }

  const toggleActivo = async (item) => {
    await supabase.from('co_responsables').update({ activo: !item.activo }).eq('id', item.id)
    await cargar()
  }

  const eliminar = async (id) => {
    await supabase.from('co_responsables').delete().eq('id', id)
    setConfirmDel(null)
    await cargar()
  }

  return (
    <Card className="overflow-hidden">
      <div className="px-5 py-4 border-b border-hairline flex items-center gap-2.5">
        <Users className="w-[18px] h-[18px] text-accent" strokeWidth={1.8} />
        <div>
          <h3 className="text-[15px] font-semibold text-ink">Responsables</h3>
          <p className="text-xs text-slate mt-0.5">Lista propia de {cliente.nombre}</p>
        </div>
      </div>

      <div className="p-5 border-b border-hairline">
        <div className="flex gap-2.5">
          <Input
            placeholder="Nombre y apellido..."
            value={nombre}
            onChange={e => setNombre(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && agregar()}
          />
          <BtnPrimary onClick={agregar} disabled={guardando || !nombre.trim()} className="shrink-0">
            <Plus className="w-4 h-4" strokeWidth={2.2} />
            Agregar
          </BtnPrimary>
        </div>
      </div>

      {cargando ? (
        <div className="flex items-center justify-center gap-2 py-8 text-slate text-sm">
          <Loader2 className="w-4 h-4 animate-spin" strokeWidth={2} />
          Cargando...
        </div>
      ) : items.length === 0 ? (
        <EmptyState title="Sin responsables cargados" desc="Agregá el primero desde el campo de arriba." />
      ) : (
        items.map((item, i) => (
          <div key={item.id}
            className={`flex flex-wrap items-center gap-2 px-5 py-3.5 ${i > 0 ? 'border-t border-hairline' : ''} ${!item.activo ? 'opacity-45' : ''}`}>
            <p className="flex-1 min-w-[120px] text-[15px] text-ink">{item.nombre}</p>
            <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-md shrink-0
              ${item.activo ? 'bg-accent-light text-accent' : 'bg-hairline text-slate'}`}>
              {item.activo ? 'Activo' : 'Inactivo'}
            </span>
            <button onClick={() => toggleActivo(item)}
              className="px-3 py-1.5 rounded-md text-[13px] font-semibold text-slate shrink-0
                         border-[1.5px] border-hairline transition-colors hover:border-accent hover:text-accent">
              {item.activo ? 'Desactivar' : 'Activar'}
            </button>
            {confirmDel === item.id ? (
              <div className="flex items-center gap-1.5 shrink-0">
                <span className="text-[13px] text-danger">¿Confirmar?</span>
                <button onClick={() => eliminar(item.id)}
                  className="px-2.5 py-1.5 rounded-md text-[13px] font-semibold text-white bg-danger hover:bg-red-800">
                  Sí
                </button>
                <button onClick={() => setConfirmDel(null)}
                  className="px-2.5 py-1.5 rounded-md text-[13px] font-semibold text-slate border-[1.5px] border-hairline">
                  No
                </button>
              </div>
            ) : (
              <button onClick={() => setConfirmDel(item.id)}
                className="p-1.5 rounded-md text-danger border-[1.5px] border-red-200 transition-colors hover:bg-red-50 shrink-0">
                <Trash2 className="w-3.5 h-3.5" strokeWidth={2} />
              </button>
            )}
          </div>
        ))
      )}
    </Card>
  )
}

export default function ConfigPersonas({ cliente, onVolver }) {
  return (
    <div className="max-w-[820px] mx-auto p-5 md:p-8">

      <div className="flex flex-wrap items-start justify-between gap-3 mb-6">
        <div>
          <h2 className="text-xl md:text-[22px] font-bold text-ink tracking-tight">
            Auditores y Responsables
          </h2>
          <p className="text-sm text-slate mt-0.5">
            Usados en los 12 temas de Controles Operativos
          </p>
        </div>
        <BtnGhost onClick={onVolver}>
          <ArrowLeft className="w-4 h-4" strokeWidth={2} />
          Volver
        </BtnGhost>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <ListaAuditores />
        <ListaResponsables cliente={cliente} />
      </div>
    </div>
  )
}
