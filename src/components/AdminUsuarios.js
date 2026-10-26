'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { ArrowLeft, RefreshCw, Users, Loader2, Info, Plus, X, MapPin } from 'lucide-react'
import { Card, Select, Input, BtnGhost, EmptyState } from './contratistas/ui'

const ROLES = [
  { id: 'admin',   label: 'Administrador' },
  { id: 'tecnico', label: 'Técnico' },
  { id: 'cliente', label: 'Usuario de cliente' },
]

// ─── UN USUARIO ──────────────────────────────────────────────────────────────
function FilaUsuario({ u, clientes, plantas, asignaciones, onCambio }) {
  const [nombre, setNombre] = useState(u.nombre || '')
  const [matricula, setMatricula] = useState(u.matricula || '')
  const [nuevoCliente, setNuevoCliente] = useState('')
  const [nuevaPlanta, setNuevaPlanta] = useState('')
  const [guardando, setGuardando] = useState(false)

  const rol = u.rol || 'cliente'
  const esAdmin = rol === 'admin'
  const esTecnico = rol === 'tecnico'
  const accesoTotal = esTecnico && u.acceso_total
  const misAsig = asignaciones.filter(a => a.usuario_id === u.id)
  const plantasDelCliente = plantas.filter(p => p.cliente_id === nuevoCliente)

  const nombreCliente = (id) => clientes.find(c => c.id === id)?.nombre || 'Cliente'
  const nombrePlanta = (id) => plantas.find(p => p.id === id)?.nombre || 'Planta'

  const guardarPerfil = async (cambios) => {
    setGuardando(true)
    await supabase.from('profiles').update(cambios).eq('id', u.id)
    await onCambio()
    setGuardando(false)
  }

  // Mientras no esté lista la etapa 3, el usuario de cliente entra por su
  // "cliente del perfil": se mantiene igual a su primera asignación.
  const sincronizarClientePerfil = async (lista) => {
    if (rol !== 'cliente') return
    const deseado = lista[0]?.cliente_id || null
    if (deseado !== (u.cliente_id || null)) {
      await supabase.from('profiles').update({ cliente_id: deseado }).eq('id', u.id)
    }
  }

  const agregarAsignacion = async () => {
    if (!nuevoCliente) return
    const planta = nuevaPlanta || null
    const repetida = misAsig.some(a =>
      a.cliente_id === nuevoCliente && (a.establecimiento_id || null) === planta)
    if (repetida) return
    setGuardando(true)
    // "Todas las plantas" reemplaza las asignaciones a plantas sueltas de ese cliente
    if (!planta) {
      const sueltas = misAsig.filter(a => a.cliente_id === nuevoCliente).map(a => a.id)
      if (sueltas.length) await supabase.from('usuario_asignaciones').delete().in('id', sueltas)
    }
    await supabase.from('usuario_asignaciones').insert({
      usuario_id: u.id, cliente_id: nuevoCliente, establecimiento_id: planta,
    })
    await sincronizarClientePerfil([...misAsig.filter(a => planta || a.cliente_id !== nuevoCliente),
      { cliente_id: nuevoCliente }])
    setNuevoCliente(''); setNuevaPlanta('')
    await onCambio()
    setGuardando(false)
  }

  const quitarAsignacion = async (a) => {
    setGuardando(true)
    await supabase.from('usuario_asignaciones').delete().eq('id', a.id)
    await sincronizarClientePerfil(misAsig.filter(x => x.id !== a.id))
    await onCambio()
    setGuardando(false)
  }

  return (
    <div className={`px-6 py-5 flex flex-col gap-4 ${guardando ? 'bg-slate-50' : ''}`}>
      {/* Encabezado */}
      <div className="flex flex-wrap items-center gap-4">
        <div className={`w-[38px] h-[38px] rounded-lg flex items-center justify-center text-[13px] font-bold shrink-0
                        ${esAdmin ? 'bg-blue-50 text-blue-700' : 'bg-accent-light text-accent'}`}>
          {(u.nombre || u.email || '?').slice(0, 2).toUpperCase()}
        </div>
        <div className="flex-1 min-w-[200px]">
          <p className="text-[15px] font-semibold text-ink">{u.nombre || u.email}</p>
          <p className="text-[13px] text-slate mt-0.5">{u.email}</p>
        </div>
        <div>
          <p className="text-[11px] font-semibold text-slate uppercase tracking-wide mb-1">Rol</p>
          <Select value={rol} onChange={e => guardarPerfil({ rol: e.target.value })}
            className="w-[180px] py-1.5 text-[13px]">
            {ROLES.map(r => <option key={r.id} value={r.id}>{r.label}</option>)}
          </Select>
        </div>
        {guardando && (
          <span className="flex items-center gap-1.5 text-xs font-semibold text-accent">
            <Loader2 className="w-3.5 h-3.5 animate-spin" strokeWidth={2} />
            Guardando
          </span>
        )}
      </div>

      {/* Datos */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:pl-[54px]">
        <div>
          <p className="text-[11px] font-semibold text-slate uppercase tracking-wide mb-1">Nombre y apellido</p>
          <Input value={nombre} onChange={e => setNombre(e.target.value)}
            onBlur={() => nombre !== (u.nombre || '') && guardarPerfil({ nombre: nombre.trim() || null })}
            placeholder="Ej.: Lic. Gisela C. Losi" />
        </div>
        {(esAdmin || esTecnico) && (
          <div>
            <p className="text-[11px] font-semibold text-slate uppercase tracking-wide mb-1">Matrícula</p>
            <Input value={matricula} onChange={e => setMatricula(e.target.value)}
              onBlur={() => matricula !== (u.matricula || '') && guardarPerfil({ matricula: matricula.trim() || null })}
              placeholder="Ej.: MP N.º 1409 (UTN)" />
          </div>
        )}
      </div>

      {/* Accesos */}
      <div className="sm:pl-[54px]">
        <p className="text-[11px] font-semibold text-slate uppercase tracking-wide mb-2 flex items-center gap-1.5">
          <MapPin className="w-3.5 h-3.5" strokeWidth={2} /> Accesos
        </p>

        {esAdmin ? (
          <p className="text-[13px] text-slate">Acceso a todos los clientes y establecimientos.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {esTecnico && (
              <label className="inline-flex items-center gap-2 text-[13px] text-ink cursor-pointer w-fit">
                <input type="checkbox" className="accent-[#0F5132] w-4 h-4"
                  checked={!!u.acceso_total}
                  onChange={() => guardarPerfil({ acceso_total: !u.acceso_total })} />
                Acceso a todos los clientes (incluye los que se den de alta después)
              </label>
            )}

            {!accesoTotal && (
              <>
                {misAsig.length === 0 ? (
                  <p className="text-[13px] text-warn">Sin accesos: este usuario no ve ningún cliente.</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {misAsig.map(a => (
                      <span key={a.id} className="inline-flex items-center gap-1.5 pl-3 pr-1.5 py-1 rounded-full bg-accent-light text-accent text-[13px] font-semibold">
                        {nombreCliente(a.cliente_id)} · {a.establecimiento_id ? nombrePlanta(a.establecimiento_id) : 'todas las plantas'}
                        <button onClick={() => quitarAsignacion(a)} aria-label="Quitar acceso"
                          className="p-0.5 rounded-full hover:bg-white/60">
                          <X className="w-3.5 h-3.5" strokeWidth={2.2} />
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                <div className="flex flex-col sm:flex-row gap-2">
                  <Select value={nuevoCliente} onChange={e => { setNuevoCliente(e.target.value); setNuevaPlanta('') }}
                    className="sm:w-[200px] py-1.5 text-[13px]">
                    <option value="">Elegí un cliente</option>
                    {clientes.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                  </Select>
                  <Select value={nuevaPlanta} onChange={e => setNuevaPlanta(e.target.value)}
                    disabled={!nuevoCliente}
                    className={`sm:w-[220px] py-1.5 text-[13px] ${!nuevoCliente ? 'opacity-40' : ''}`}>
                    <option value="">Todas las plantas</option>
                    {plantasDelCliente.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                  </Select>
                  <button onClick={agregarAsignacion} disabled={!nuevoCliente || guardando}
                    className="inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-md text-[13px] font-semibold
                               text-accent border-[1.5px] border-accent hover:bg-accent-light disabled:opacity-40">
                    <Plus className="w-3.5 h-3.5" strokeWidth={2.2} /> Dar acceso
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── PANTALLA ────────────────────────────────────────────────────────────────
export default function AdminUsuarios({ onVolver }) {
  const [usuarios, setUsuarios] = useState([])
  const [clientes, setClientes] = useState([])
  const [plantas, setPlantas] = useState([])
  const [asignaciones, setAsignaciones] = useState([])
  const [cargando, setCargando] = useState(true)

  useEffect(() => { cargar() }, [])

  const cargar = async () => {
    const [{ data: perfiles }, { data: clts }, { data: ests }, { data: asig }] = await Promise.all([
      supabase.from('profiles').select('*').order('email'),
      supabase.from('clientes').select('id, nombre').eq('activo', true).order('nombre'),
      supabase.from('establecimientos').select('id, nombre, cliente_id').order('nombre'),
      supabase.from('usuario_asignaciones').select('*'),
    ])
    if (perfiles) setUsuarios(perfiles)
    if (clts) setClientes(clts)
    if (ests) setPlantas(ests)
    if (asig) setAsignaciones(asig)
    setCargando(false)
  }

  if (cargando) return (
    <div className="flex items-center justify-center gap-2.5 py-20 text-slate">
      <Loader2 className="w-5 h-5 animate-spin" strokeWidth={2} />
      Cargando usuarios...
    </div>
  )

  return (
    <div className="max-w-[900px] mx-auto p-5 md:p-8">

      <div className="flex flex-wrap items-start justify-between gap-3 mb-6">
        <div>
          <h2 className="text-xl md:text-[22px] font-bold text-ink tracking-tight">
            Gestión de Usuarios
          </h2>
          <p className="text-sm text-slate mt-0.5">
            Rol, matrícula y accesos de cada usuario
          </p>
        </div>
        <BtnGhost onClick={onVolver}>
          <ArrowLeft className="w-4 h-4" strokeWidth={2} />
          Volver
        </BtnGhost>
      </div>

      {/* Instrucciones */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 mb-6">
        <div className="flex items-start gap-2.5 mb-3">
          <Info className="w-[18px] h-[18px] text-blue-700 shrink-0 mt-0.5" strokeWidth={2} />
          <h3 className="text-[15px] font-semibold text-blue-900">
            ¿Cómo agregar un usuario nuevo?
          </h3>
        </div>
        <ol className="pl-7 text-sm text-blue-900 space-y-1.5 list-decimal marker:text-blue-500">
          <li>Entrá a <strong>supabase.com</strong> → tu proyecto → <strong>Authentication → Users</strong></li>
          <li>Hacé clic en <strong>Add user → Create new user</strong>, completá email y contraseña, y tildá <strong>Auto Confirm User</strong></li>
          <li>Volvé acá y tocá <strong>Actualizar lista</strong>: el usuario aparece sin accesos</li>
          <li>Elegí su <strong>rol</strong> y dale <strong>acceso</strong> a clientes o plantas</li>
        </ol>
        <button onClick={cargar}
          className="inline-flex items-center gap-1.5 mt-4 px-4 py-2 rounded-md text-[13px]
                     font-semibold text-white bg-blue-700 hover:bg-blue-800 transition-colors">
          <RefreshCw className="w-3.5 h-3.5" strokeWidth={2} />
          Actualizar lista
        </button>
      </div>

      {/* Lista */}
      <Card className="overflow-hidden">
        <div className="px-6 py-4 border-b border-hairline">
          <h3 className="text-[15px] font-semibold text-ink">
            Usuarios registrados ({usuarios.length})
          </h3>
        </div>

        {usuarios.length === 0 ? (
          <EmptyState Icon={Users} title="No hay usuarios todavía"
            desc="Creá uno desde Supabase siguiendo las instrucciones de arriba." />
        ) : usuarios.map((u, i) => (
          <div key={u.id} className={i > 0 ? 'border-t border-hairline' : ''}>
            <FilaUsuario u={u} clientes={clientes} plantas={plantas}
              asignaciones={asignaciones} onCambio={cargar} />
          </div>
        ))}
      </Card>
    </div>
  )
}
