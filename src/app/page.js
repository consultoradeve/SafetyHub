'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Loader2 } from 'lucide-react'
import Login from '@/components/Login'
import SelectorAcceso from '@/components/SelectorAcceso'
import AccesoShell from '@/components/AccesoShell'
import Dashboard from '@/components/Dashboard'

export default function Home() {
  const [user, setUser] = useState(null)
  const [perfil, setPerfil] = useState(null)
  const [cliente, setCliente] = useState(null)
  const [establecimiento, setEstablecimiento] = useState(null)
  const [eligiendo, setEligiendo] = useState(true)
  const [cantPlantas, setCantPlantas] = useState(0)
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
        setUser(null); setPerfil(null); setCliente(null); setEstablecimiento(null); setEligiendo(true)
      }
    })
    return () => subscription.unsubscribe()
  }, [])

  const cargarPerfil = async (userId) => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (data) setPerfil(data)
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

  // Paso 1: sin sesión -> login. Paso 2: elegir cliente y establecimiento.
  // Los dos pasos comparten la misma tarjeta y fondo (AccesoShell),
  // así se siente como un único flujo que se transforma, no dos pantallas distintas.
  if (!user) {
    return (
      <AccesoShell stepKey="login">
        <Login />
      </AccesoShell>
    )
  }

  const esAdmin = perfil?.rol === 'admin'
  const esGestor = esAdmin || perfil?.rol === 'supervisor'

  const entrar = (c, e) => {
    setCliente(c)
    setEstablecimiento(e)
    setEligiendo(false)
  }

  const irAlPanelGeneral = () => {
    setCliente(null)
    setEstablecimiento(null)
  }

  // Paso 2: técnicos y clientes eligen establecimiento (o entran directo si hay uno solo).
  // Administrador y supervisores entran directo al Panel general.
  if (!perfil || (eligiendo && !esGestor)) {
    return (
      <AccesoShell stepKey="selector">
        {perfil ? (
          <SelectorAcceso
            perfil={perfil}
            clienteInicial={cliente}
            onEntrar={entrar}
            onPlantasCargadas={setCantPlantas}
          />
        ) : (
          <div className="flex items-center gap-2.5 text-accent">
            <Loader2 className="w-5 h-5 animate-spin" strokeWidth={2} />
            Cargando...
          </div>
        )}
      </AccesoShell>
    )
  }

  return (
    <Dashboard
      key={establecimiento?.id || cliente?.id || 'panel'}
      user={user}
      perfil={perfil}
      cliente={cliente}
      establecimiento={establecimiento}
      esAdmin={esAdmin}
      esGestor={esGestor}
      puedeCambiarEstablecimiento={esGestor || cantPlantas > 1}
      onCambiarEstablecimiento={esGestor ? irAlPanelGeneral : () => setEligiendo(true)}
      onElegir={entrar}
    />
  )
}
