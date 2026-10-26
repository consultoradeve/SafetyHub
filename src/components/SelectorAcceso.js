'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { ArrowRight, ArrowLeft, LogOut, Building2, MapPin, Loader2, TriangleAlert } from 'lucide-react'

// Ingreso a SafetyHub:
// - Administrador y supervisor: eligen el cliente y después el establecimiento.
// - Técnico y usuario de cliente: si tienen un solo establecimiento entran directo;
//   si tienen varios, eligen de una lista agrupada por cliente.
// La base de datos ya filtra qué clientes y establecimientos puede ver cada usuario.
export default function SelectorAcceso({ perfil, clienteInicial, onEntrar, onPlantasCargadas, embebido = false }) {
  const esGestor = ['admin', 'supervisor'].includes(perfil?.rol)
  const esAdmin = perfil?.rol === 'admin'

  const [clientes, setClientes] = useState([])
  const [plantas, setPlantas] = useState([])
  const [cargando, setCargando] = useState(true)
  const [clienteId, setClienteId] = useState(clienteInicial?.id || '')
  const [paso, setPaso] = useState('cliente') // solo para gestores: cliente | planta

  useEffect(() => {
    const cargar = async () => {
      const [{ data: clts }, { data: ests }] = await Promise.all([
        supabase.from('clientes').select('*').eq('activo', true).order('nombre'),
        supabase.from('establecimientos').select('*').order('nombre'),
      ])
      const listaClientes = clts || []
      const idsActivos = new Set(listaClientes.map(c => c.id))
      const listaPlantas = (ests || []).filter(e => idsActivos.has(e.cliente_id))

      setClientes(listaClientes)
      setPlantas(listaPlantas)
      setCargando(false)
      onPlantasCargadas?.(listaPlantas.length)

      // Un solo establecimiento: entra directo
      if (!esGestor && listaPlantas.length === 1) {
        const p = listaPlantas[0]
        onEntrar(listaClientes.find(c => c.id === p.cliente_id), p)
      }
    }
    cargar()
  }, [])

  const handleLogout = async () => await supabase.auth.signOut()

  const clienteElegido = clientes.find(c => c.id === clienteId)
  const plantasDe = (id) => plantas.filter(p => p.cliente_id === id)

  const continuarConCliente = () => {
    if (!clienteElegido) return
    const suyas = plantasDe(clienteElegido.id)
    if (suyas.length === 1) onEntrar(clienteElegido, suyas[0])
    else setPaso('planta')
  }

  const BotonPlanta = ({ cliente, planta }) => (
    <button
      onClick={() => onEntrar(cliente, planta)}
      className="w-full min-h-[52px] flex items-center gap-3 px-4 py-3 rounded-md border-[1.5px] border-hairline
                 bg-white text-left transition-colors hover:border-accent hover:bg-accent-light group"
    >
      <MapPin className="w-[18px] h-[18px] text-slate group-hover:text-accent shrink-0" strokeWidth={1.8} />
      <span className="flex-1 min-w-0">
        <span className="block text-[15px] font-semibold text-ink">{planta.nombre}</span>
        {planta.direccion && <span className="block text-xs text-slate truncate">{planta.direccion}</span>}
      </span>
      <ArrowRight className="w-4 h-4 text-slate group-hover:text-accent shrink-0" strokeWidth={2} />
    </button>
  )

  const Encabezado = ({ texto }) => embebido ? (
    <p className="text-[15px] font-semibold text-ink mb-4">{texto}</p>
  ) : (
    <div className="mb-7">
      <img src="/logo-deve.png" alt="Devé" className="h-[52px] w-auto block" />
      <p className="text-slate text-sm mt-3 leading-snug">{texto}</p>
    </div>
  )

  const BotonSalir = () => embebido ? null : (
    <button
      onClick={handleLogout}
      className="w-full flex items-center justify-center gap-2 mt-4 py-2.5 rounded-md border border-hairline text-sm text-slate transition-colors hover:border-accent hover:text-accent"
    >
      <LogOut className="w-4 h-4" strokeWidth={1.8} />
      Cerrar sesión
    </button>
  )

  const Aviso = ({ titulo, texto }) => (
    <div className="bg-amber-50 border border-amber-200 rounded-md px-4 py-3.5 mb-2">
      <p className="flex items-center gap-2 text-sm font-semibold text-ink">
        <TriangleAlert className="w-4 h-4 text-warn shrink-0" strokeWidth={2} />
        {titulo}
      </p>
      <p className="text-sm text-slate mt-1">{texto}</p>
    </div>
  )

  if (cargando) {
    return (
      <>
        <Encabezado texto="Preparando tu acceso..." />
        <div className="flex items-center gap-2 text-slate text-[15px] py-3">
          <Loader2 className="w-4 h-4 animate-spin" strokeWidth={2} />
          Cargando...
        </div>
      </>
    )
  }

  // ─── ADMINISTRADOR Y SUPERVISOR ─────────────────────────────────────────────
  if (esGestor) {
    if (paso === 'planta' && clienteElegido) {
      const suyas = plantasDe(clienteElegido.id)
      return (
        <>
          <Encabezado texto={`Establecimientos de ${clienteElegido.nombre}`} />
          {suyas.length === 0 ? (
            <Aviso
              titulo="Este cliente no tiene establecimientos"
              texto={esAdmin
                ? 'Cargalos en Administración → Clientes → Establecimientos.'
                : 'Pedile al administrador que los cargue.'} />
          ) : (
            <div className={`flex flex-col gap-2 overflow-y-auto pr-1 ${embebido ? '' : 'max-h-[50vh]'}`}>
              {suyas.map(p => <BotonPlanta key={p.id} cliente={clienteElegido} planta={p} />)}
            </div>
          )}
          <button
            onClick={() => setPaso('cliente')}
            className="w-full flex items-center justify-center gap-2 mt-5 py-2.5 rounded-md text-sm font-semibold text-accent hover:bg-accent-light"
          >
            <ArrowLeft className="w-4 h-4" strokeWidth={2} />
            Elegir otro cliente
          </button>
          {esAdmin && suyas.length === 0 && (
            <button
              onClick={() => onEntrar(clienteElegido, null)}
              className="w-full mt-2 py-2.5 rounded-md border border-hairline text-sm text-slate hover:border-accent hover:text-accent"
            >
              Entrar igual para administrar
            </button>
          )}
          <BotonSalir />
        </>
      )
    }

    return (
      <>
        <Encabezado texto="¿Con qué cliente vas a trabajar hoy?" />
        <label htmlFor="selector-cliente" className="block text-[13px] font-semibold text-slate mb-1.5">
          Seleccioná un cliente
        </label>
        {clientes.length === 0 ? (
          <Aviso titulo="Todavía no hay clientes cargados"
            texto={esAdmin ? 'Agregalos en Administración → Clientes.' : 'Pedile al administrador que los cargue.'} />
        ) : (
          <div className="relative mb-6">
            <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-slate pointer-events-none" strokeWidth={1.8} />
            <select
              id="selector-cliente"
              value={clienteId}
              onChange={e => setClienteId(e.target.value)}
              className="w-full pl-11 pr-10 py-3 text-base bg-white appearance-none cursor-pointer border-[1.5px] border-hairline rounded-md outline-none transition-colors focus:border-accent text-ink"
            >
              <option value="">— Elegí un cliente —</option>
              {clientes.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
            </select>
            <svg className="absolute right-3.5 top-1/2 -translate-y-1/2 w-3 h-3 text-slate pointer-events-none" viewBox="0 0 12 12" fill="currentColor" aria-hidden="true">
              <path d="M6 8L1 3h10z" />
            </svg>
          </div>
        )}
        <button
          onClick={continuarConCliente}
          disabled={!clienteId}
          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-md text-base font-semibold text-white transition-colors bg-accent hover:bg-accent-hover disabled:bg-slate-400 disabled:cursor-not-allowed"
        >
          Continuar
          <ArrowRight className="w-[18px] h-[18px]" strokeWidth={2} />
        </button>
        <BotonSalir />
      </>
    )
  }

  // ─── TÉCNICO Y USUARIO DE CLIENTE ───────────────────────────────────────────
  if (plantas.length === 0) {
    return (
      <>
        <Encabezado texto="Bienvenido a SafetyHub" />
        <Aviso titulo="Sin establecimientos asignados"
          texto="Comunicate con el administrador para que te asigne un cliente o establecimiento." />
        <BotonSalir />
      </>
    )
  }

  const clientesConPlantas = clientes.filter(c => plantasDe(c.id).length > 0)

  return (
    <>
      <Encabezado texto="¿En qué establecimiento vas a trabajar?" />
      <div className="flex flex-col gap-5 max-h-[55vh] overflow-y-auto pr-1">
        {clientesConPlantas.map(c => (
          <div key={c.id}>
            <p className="text-[11px] font-bold text-slate uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5" strokeWidth={2} />
              {c.nombre}
            </p>
            <div className="flex flex-col gap-2">
              {plantasDe(c.id).map(p => <BotonPlanta key={p.id} cliente={c} planta={p} />)}
            </div>
          </div>
        ))}
      </div>
      <BotonSalir />
    </>
  )
}
