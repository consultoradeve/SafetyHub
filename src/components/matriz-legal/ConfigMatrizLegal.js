'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { ArrowLeft, Plus, Trash2, Loader2, Check, Users, Sliders } from 'lucide-react'
import { Card, Label, Input, Select, BtnPrimary, BtnGhost, EmptyState } from '../contratistas/ui'

function ListaResponsables() {
  const [items, setItems] = useState([])
  const [categorias, setCategorias] = useState([])
  const [nombre, setNombre] = useState('')
  const [categoriaId, setCategoriaId] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [confirmDel, setConfirmDel] = useState(null)
  const [cargando, setCargando] = useState(true)

  useEffect(() => { cargar() }, [])

  const cargar = async () => {
    const [{ data: resps }, { data: cats }] = await Promise.all([
      supabase.from('matriz_responsables').select('*').order('nombre'),
      supabase.from('matriz_categorias').select('*').order('nombre'),
    ])
    setItems(resps || [])
    setCategorias(cats || [])
    setCargando(false)
  }

  const agregar = async () => {
    if (!nombre.trim()) return
    setGuardando(true)
    await supabase.from('matriz_responsables').insert({
      nombre: nombre.trim(), categoria_default_id: categoriaId || null,
    })
    setNombre(''); setCategoriaId('')
    await cargar()
    setGuardando(false)
  }

  const toggleActivo = async (item) => {
    await supabase.from('matriz_responsables').update({ activo: !item.activo }).eq('id', item.id)
    await cargar()
  }

  const eliminar = async (id) => {
    await supabase.from('matriz_responsables').delete().eq('id', id)
    setConfirmDel(null)
    await cargar()
  }

  const nombreCategoria = (id) => categorias.find(c => c.id === id)?.nombre

  return (
    <Card className="overflow-hidden">
      <div className="px-5 py-4 border-b border-hairline flex items-center gap-2.5">
        <Users className="w-[18px] h-[18px] text-accent" strokeWidth={1.8} />
        <div>
          <h3 className="text-[15px] font-semibold text-ink">Responsables</h3>
          <p className="text-xs text-slate mt-0.5">Lista compartida — visible para todos los clientes</p>
        </div>
      </div>

      <div className="p-5 border-b border-hairline">
        <div className="flex flex-col gap-2.5">
          <div className="flex flex-col sm:flex-row gap-2.5">
            <Input placeholder="Nombre y apellido..." value={nombre}
              onChange={e => setNombre(e.target.value)} className="flex-1 min-w-0" />
            <div className="sm:w-[220px]">
              <Select value={categoriaId} onChange={e => setCategoriaId(e.target.value)}>
                <option value="">— Categoría por defecto —</option>
                {categorias.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
              </Select>
            </div>
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
        <EmptyState title="Sin responsables cargados" desc="Agregá el primero desde el campo de arriba." />
      ) : (
        items.map((item, i) => (
          <div key={item.id}
            className={`flex flex-wrap items-center gap-2 px-5 py-3.5 ${i > 0 ? 'border-t border-hairline' : ''} ${!item.activo ? 'opacity-45' : ''}`}>
            <div className="flex-1 min-w-[140px]">
              <p className="text-[15px] text-ink">{item.nombre}</p>
              {item.categoria_default_id && (
                <p className="text-xs text-slate mt-0.5">{nombreCategoria(item.categoria_default_id)}</p>
              )}
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

function Umbrales({ cliente }) {
  const [umbralRojo, setUmbralRojo] = useState(45)
  const [umbralAmarillo, setUmbralAmarillo] = useState(90)
  const [cargando, setCargando] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [guardado, setGuardado] = useState(false)

  useEffect(() => { cargar() }, [cliente.id])

  const cargar = async () => {
    const { data } = await supabase.from('matriz_config').select('*').eq('cliente_id', cliente.id).maybeSingle()
    if (data) { setUmbralRojo(data.umbral_rojo); setUmbralAmarillo(data.umbral_amarillo) }
    setCargando(false)
  }

  const guardar = async () => {
    setGuardando(true)
    await supabase.from('matriz_config').upsert({
      cliente_id: cliente.id, umbral_rojo: parseInt(umbralRojo) || 45, umbral_amarillo: parseInt(umbralAmarillo) || 90,
    }, { onConflict: 'cliente_id' })
    setGuardando(false)
    setGuardado(true)
    setTimeout(() => setGuardado(false), 1500)
  }

  if (cargando) return (
    <div className="flex items-center justify-center gap-2 py-8 text-slate text-sm">
      <Loader2 className="w-4 h-4 animate-spin" strokeWidth={2} />
      Cargando...
    </div>
  )

  return (
    <Card className="overflow-hidden">
      <div className="px-5 py-4 border-b border-hairline flex items-center gap-2.5">
        <Sliders className="w-[18px] h-[18px] text-accent" strokeWidth={1.8} />
        <div>
          <h3 className="text-[15px] font-semibold text-ink">Umbrales del semáforo</h3>
          <p className="text-xs text-slate mt-0.5">Para {cliente.nombre}</p>
        </div>
      </div>
      <div className="p-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
          <div>
            <Label>Rojo: menos de estos días (o vencido)</Label>
            <Input type="number" value={umbralRojo} onChange={e => setUmbralRojo(e.target.value)} />
          </div>
          <div>
            <Label>Amarillo: menos de estos días</Label>
            <Input type="number" value={umbralAmarillo} onChange={e => setUmbralAmarillo(e.target.value)} />
          </div>
        </div>
        <p className="text-xs text-slate mb-4">
          Por defecto: rojo &lt; 45 días, amarillo entre 45 y 90 días, verde ≥ 90 días (igual que tu Excel original).
        </p>
        <BtnPrimary onClick={guardar} disabled={guardando}>
          {guardado ? <><Check className="w-4 h-4" strokeWidth={2.5} /> Guardado</> : guardando ? 'Guardando...' : 'Guardar umbrales'}
        </BtnPrimary>
      </div>
    </Card>
  )
}

export default function ConfigMatrizLegal({ cliente, onVolver }) {
  return (
    <div className="max-w-[820px] mx-auto p-5 md:p-8">
      <div className="flex flex-wrap items-start justify-between gap-3 mb-6">
        <div>
          <h2 className="text-xl md:text-[22px] font-bold text-ink tracking-tight">Responsables y umbrales</h2>
          <p className="text-sm text-slate mt-0.5">Matriz de Cumplimiento Legal</p>
        </div>
        <BtnGhost onClick={onVolver}>
          <ArrowLeft className="w-4 h-4" strokeWidth={2} />
          Volver
        </BtnGhost>
      </div>

      <div className="flex flex-col gap-5">
        <Umbrales cliente={cliente} />
        <ListaResponsables />
      </div>
    </div>
  )
}
