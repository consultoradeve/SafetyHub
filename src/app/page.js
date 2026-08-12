'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Loader2, TriangleAlert } from 'lucide-react'
import Login from '@/components/Login'
import ClienteSelector from '@/components/ClienteSelector'
import Dashboard from '@/components/Dashboard'

export default function Home() {
  const [user, setUser] = useState(null)
  const [perfil, setPerfil] = useState(null)
  const [cliente, setCliente] = useState(null)
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user)
        await cargarPerfil(session.user.id)
      }
      setCargando(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_e, session) => {
      if (session?.user) {
        setUser(session.user)
        await cargarPerfil(session.user.id)
      } else {
        setUser(null); setPerfil(null); setCliente(null)
      }
    })
    return () => subscription.unsubscribe()
  }, [])

  const cargarPerfil = async (userId) => {
    const { data } = await supabase
      .from('profiles')
      .select('*, clientes(*)')
      .eq('id', userId)
      .single()

    if (data) {
      setPerfil(data)
      if (data.rol === 'cliente' && data.clientes) setCliente(data.clientes)
    }
  }

  if (cargando) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center gap-2.5 text-accent">
          <Loader2 className="w-5 h-5 animate-spin" strokeWidth={2} />
          <span className="text-lg">Cargando...</span>
        </div>
      </div>
    )
  }

  if (!user) return <Login />

  const esAdmin = perfil?.rol === 'admin'

  // Usuario de cliente sin cliente asignado
  if (perfil?.rol === 'cliente' && !cliente) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center">
          <TriangleAlert className="w-10 h-10 text-warn mx-auto mb-4" strokeWidth={1.6} />
          <h2 className="text-lg font-bold text-ink mb-2">
            Sin cliente asignado
          </h2>
          <p className="text-[15px] text-slate mb-6">
            Comunicate con el administrador para que te asigne un cliente.
          </p>
          <button
            onClick={() => supabase.auth.signOut()}
            className="px-6 py-2.5 rounded-md bg-accent hover:bg-accent-hover text-white text-[15px] font-semibold transition-colors"
          >
            Cerrar sesión
          </button>
        </div>
      </div>
    )
  }

  if (!cliente) return <ClienteSelector onSelect={setCliente} />

  return (
    <Dashboard
      user={user}
      perfil={perfil}
      cliente={cliente}
      esAdmin={esAdmin}
      onCambiarCliente={() => setCliente(null)}
    />
  )
}
