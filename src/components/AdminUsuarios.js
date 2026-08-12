'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { ArrowLeft, RefreshCw, Users, Loader2, Info, ExternalLink } from 'lucide-react'
import { Card, Select, BtnGhost, EmptyState } from './contratistas/ui'

export default function AdminUsuarios({ onVolver }) {
  const [usuarios, setUsuarios] = useState([])
  const [clientes, setClientes] = useState([])
  const [guardando, setGuardando] = useState(null)
  const [cargando, setCargando] = useState(true)

  useEffect(() => { cargar() }, [])

  const cargar = async () => {
    const [{ data: perfiles }, { data: clts }] = await Promise.all([
      supabase.from('profiles').select('*, clientes(nombre)').order('email'),
      supabase.from('clientes').select('*').eq('activo', true).order('nombre'),
    ])
    if (perfiles) setUsuarios(perfiles)
    if (clts) setClientes(clts)
    setCargando(false)
  }

  const actualizar = async (id, campo, valor) => {
    setGuardando(id)
    await supabase.from('profiles').update({ [campo]: valor || null }).eq('id', id)
    await cargar()
    setGuardando(null)
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
            Asignás rol y cliente a cada usuario
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
          <li>Hacé clic en <strong>Add user → Create new user</strong></li>
          <li>Completá email y contraseña, y guardá</li>
          <li>Volvé acá y asignale un <strong>cliente y rol</strong> desde la tabla de abajo</li>
        </ol>
        <button onClick={cargar}
          className="inline-flex items-center gap-1.5 mt-4 px-4 py-2 rounded-md text-[13px]
                     font-semibold text-white bg-blue-700 hover:bg-blue-800 transition-colors">
          <RefreshCw className="w-3.5 h-3.5" strokeWidth={2} />
          Actualizar lista
        </button>
      </div>

      {/* Tabla */}
      <Card className="overflow-hidden">
        <div className="px-6 py-4 border-b border-hairline">
          <h3 className="text-[15px] font-semibold text-ink">
            Usuarios registrados ({usuarios.length})
          </h3>
        </div>

        {usuarios.length === 0 ? (
          <EmptyState Icon={Users} title="No hay usuarios todavía"
            desc="Creá uno desde Supabase siguiendo las instrucciones de arriba." />
        ) : usuarios.map((u, i) => {
          const esAdmin = u.rol === 'admin'
          return (
            <div key={u.id}
              className={`flex flex-wrap items-center gap-4 px-6 py-4
                          ${i > 0 ? 'border-t border-hairline' : ''}
                          ${guardando === u.id ? 'bg-slate-50' : ''}`}>

              {/* Avatar */}
              <div className={`w-[38px] h-[38px] rounded-lg flex items-center justify-center
                              text-[13px] font-bold shrink-0
                              ${esAdmin ? 'bg-blue-50 text-blue-700' : 'bg-accent-light text-accent'}`}>
                {u.email?.slice(0, 2).toUpperCase()}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-[180px]">
                <p className="text-[15px] font-semibold text-ink">{u.email}</p>
                <p className="text-[13px] text-slate mt-0.5">
                  {u.clientes?.nombre || (esAdmin ? 'Acceso a todos los clientes' : 'Sin cliente asignado')}
                </p>
              </div>

              {/* Rol */}
              <div>
                <p className="text-[11px] font-semibold text-slate uppercase tracking-wide mb-1">Rol</p>
                <Select
                  value={u.rol || 'cliente'}
                  onChange={e => actualizar(u.id, 'rol', e.target.value)}
                  className="w-[160px] py-1.5 text-[13px]"
                >
                  <option value="admin">Administrador</option>
                  <option value="cliente">Usuario de cliente</option>
                </Select>
              </div>

              {/* Cliente asignado */}
              <div>
                <p className="text-[11px] font-semibold text-slate uppercase tracking-wide mb-1">
                  Cliente asignado
                </p>
                <Select
                  value={u.cliente_id || ''}
                  onChange={e => actualizar(u.id, 'cliente_id', e.target.value)}
                  disabled={esAdmin}
                  className={`w-[180px] py-1.5 text-[13px] ${esAdmin ? 'opacity-40 cursor-not-allowed' : ''}`}
                >
                  <option value="">Sin cliente</option>
                  {clientes.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                </Select>
              </div>

              {guardando === u.id && (
                <span className="flex items-center gap-1.5 text-xs font-semibold text-accent">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" strokeWidth={2} />
                  Guardando
                </span>
              )}
            </div>
          )
        })}
      </Card>
    </div>
  )
}
