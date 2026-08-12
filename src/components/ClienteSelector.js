'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { ArrowRight, LogOut, Building2, Loader2 } from 'lucide-react'

export default function ClienteSelector({ onSelect }) {
  const [clientes, setClientes] = useState([])
  const [clienteId, setClienteId] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase
      .from('clientes')
      .select('*')
      .eq('activo', true)
      .order('nombre')
      .then(({ data }) => {
        setClientes(data || [])
        setLoading(false)
      })
  }, [])

  const handleLogout = async () => await supabase.auth.signOut()

  const entrar = () => {
    const c = clientes.find(x => x.id === clienteId)
    if (c) onSelect(c)
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-5 py-10">
      <div className="w-full max-w-[420px]">
        <div className="bg-white border border-hairline rounded-xl px-11 py-12 shadow-[0_2px_16px_rgba(0,0,0,.05)]">

          {/* Logo */}
          <div className="mb-8">
            <img src="/logo-deve.png" alt="Devé" className="h-[52px] w-auto block" />
            <p className="text-slate text-sm mt-3 leading-snug">
              ¿Con qué cliente vas a trabajar hoy?
            </p>
          </div>

          <label className="block text-[13px] font-semibold text-slate mb-1.5">
            Seleccioná un cliente
          </label>

          {loading ? (
            <div className="flex items-center gap-2 text-slate text-[15px] py-3">
              <Loader2 className="w-4 h-4 animate-spin" strokeWidth={2} />
              Cargando clientes...
            </div>
          ) : clientes.length === 0 ? (
            <div className="bg-accent-light border border-green-200 rounded-md px-4 py-3.5 text-success text-sm mb-4">
              Todavía no hay clientes cargados. Ingresá al panel de administrador para agregar uno.
            </div>
          ) : (
            <div className="relative mb-6">
              <Building2
                className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-slate pointer-events-none"
                strokeWidth={1.8}
              />
              <select
                value={clienteId}
                onChange={e => setClienteId(e.target.value)}
                className="w-full pl-11 pr-10 py-3 text-base bg-white appearance-none cursor-pointer border-[1.5px] border-hairline rounded-md outline-none transition-colors focus:border-accent text-ink"
              >
                <option value="">— Elegí un cliente —</option>
                {clientes.map(c => (
                  <option key={c.id} value={c.id}>{c.nombre}</option>
                ))}
              </select>
              <svg
                className="absolute right-3.5 top-1/2 -translate-y-1/2 w-3 h-3 text-slate pointer-events-none"
                viewBox="0 0 12 12" fill="currentColor"
              >
                <path d="M6 8L1 3h10z" />
              </svg>
            </div>
          )}

          <button
            onClick={entrar}
            disabled={!clienteId}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-md text-base font-semibold text-white transition-colors bg-accent hover:bg-accent-hover disabled:bg-slate-400 disabled:cursor-not-allowed"
          >
            Ingresar
            <ArrowRight className="w-[18px] h-[18px]" strokeWidth={2} />
          </button>

          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 mt-3 py-2.5 rounded-md border border-hairline text-sm text-slate transition-colors hover:border-accent hover:text-accent"
          >
            <LogOut className="w-4 h-4" strokeWidth={1.8} />
            Cerrar sesión
          </button>
        </div>
      </div>
    </div>
  )
}
