'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import {
  CheckCircle2, HardHat, ClipboardList, TriangleAlert, ShieldCheck, Wrench,
  Users, Building2, LogOut, Menu, X, ChevronRight, ArrowLeft
} from 'lucide-react'
import Contratistas from './contratistas'
import ControlesOperativos from './controles-operativos'
import AdminClientes from './AdminClientes'
import AdminUsuarios from './AdminUsuarios'
import { useIsMobile } from '@/lib/useResponsive'

export const MODULOS = [
  { id: 'controles',   Icon: CheckCircle2,   label: 'Controles Operativos',   desc: 'Inspecciones por tipo de equipo con exportación PDF.',                   activo: true  },
  { id: 'contratistas',Icon: HardHat,        label: 'Control de Contratistas',desc: 'Gestión documental de empresas contratistas y sus trabajadores.',        activo: true  },
  { id: 'incidentes',  Icon: ClipboardList,  label: 'Registro de Incidentes', desc: 'Documentación de accidentes, casi-accidentes y situaciones de riesgo.',  activo: false },
  { id: 'riesgo',      Icon: TriangleAlert,  label: 'Matriz de Riesgo',       desc: 'Evaluación y priorización de riesgos por probabilidad e impacto.',       activo: false },
  { id: 'epp',         Icon: ShieldCheck,    label: 'Gestión de EPP',         desc: 'Control de entrega y stock de equipos de protección personal.',          activo: false },
  { id: 'acap',        Icon: Wrench,         label: 'Plan ACAP',              desc: 'Consolidador de acciones correctivas y preventivas de todos los módulos.',activo: false },
]

const NAV = [
  { id: 'controles',    icon: CheckCircle2,  label: 'Controles Operativos' },
  { id: 'contratistas', icon: HardHat,       label: 'Contratistas' },
  { id: 'incidentes',   icon: ClipboardList, label: 'Incidentes' },
  { id: 'riesgo',       icon: TriangleAlert, label: 'Matriz de Riesgo' },
  { id: 'epp',          icon: ShieldCheck,   label: 'Gestión EPP' },
  { id: 'acap',         icon: Wrench,        label: 'Plan ACAP' },
]

function NavItem({ Icon, label, activo, disabled, badge, onClick }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        relative w-full flex items-center gap-2.5 px-3 py-2.5 rounded-md text-[15px]
        text-left transition-colors
        ${activo
          ? 'bg-accent-light text-accent font-semibold'
          : disabled
            ? 'text-slate-300 cursor-default'
            : 'text-slate hover:bg-bg hover:text-ink cursor-pointer'}
      `}
    >
      {activo && (
        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-[58%] bg-accent rounded-r-sm" />
      )}
      <Icon className="w-[18px] h-[18px] shrink-0" strokeWidth={1.8} />
      <span className="flex-1">{label}</span>
      {badge && (
        <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-hairline text-slate">
          {badge}
        </span>
      )}
    </button>
  )
}

function SidebarContent({ cliente, esAdmin, moduloActivo, vistaAdmin, onModulo, onAdmin, onCambiarCliente, onLogout, onClose }) {
  const iniciales = cliente?.nombre?.slice(0, 2).toUpperCase() || 'DV'
  const go = (fn) => () => { fn(); onClose?.() }

  return (
    <>
      {/* Logo Devé */}
      <div
        className="px-5 pt-[18px] pb-4 border-b border-hairline cursor-pointer"
        onClick={go(() => onModulo(null))}
      >
        <img src="/logo-deve.png" alt="Devé" className="h-9 w-auto block mb-1" />
        <p className="text-[11px] text-slate tracking-wide">Gestión HSO</p>
      </div>

      {/* Cliente activo — con logo si tiene */}
      <div className="px-4 py-3 bg-accent-light border-b border-green-200">
        <p className="text-[11px] font-semibold text-accent uppercase tracking-wide mb-2">
          Cliente activo
        </p>
        <div className="flex items-center gap-2.5">
          {cliente?.logo_url ? (
            <div className="w-9 h-9 rounded-md bg-white border border-green-200 flex items-center justify-center shrink-0 overflow-hidden">
              <img src={cliente.logo_url} alt={cliente.nombre} className="w-full h-full object-contain p-0.5" />
            </div>
          ) : (
            <div className="w-9 h-9 rounded-md bg-white border border-green-200 flex items-center justify-center shrink-0">
              <Building2 className="w-4 h-4 text-accent" strokeWidth={1.8} />
            </div>
          )}
          <p className="text-sm font-semibold text-ink leading-tight">{cliente?.nombre}</p>
        </div>
        {esAdmin && (
          <button
            onClick={go(onCambiarCliente)}
            className="flex items-center gap-1 text-xs font-semibold text-accent mt-2 hover:underline"
          >
            Cambiar cliente
            <ChevronRight className="w-3 h-3" strokeWidth={2.5} />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2.5 py-3.5 overflow-y-auto">
        <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-2.5 pt-2 pb-1.5">
          Módulos
        </p>
        {NAV.map(item => {
          const disponible = MODULOS.find(m => m.id === item.id)?.activo
          const activo = moduloActivo === item.id
          return (
            <div key={item.id}>
              <NavItem
                Icon={item.icon} label={item.label}
                activo={activo} disabled={!disponible}
                badge={!disponible ? 'Pronto' : null}
                onClick={disponible ? go(() => onModulo(item.id)) : undefined}
              />
            </div>
          )
        })}

        {esAdmin && (
          <div className="mt-4 pt-4 border-t border-hairline">
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-2.5 pb-1.5">
              Administración
            </p>
            <NavItem Icon={Users}     label="Usuarios" activo={vistaAdmin === 'usuarios'} onClick={go(() => onAdmin('usuarios'))} />
            <NavItem Icon={Building2} label="Clientes" activo={vistaAdmin === 'clientes'} onClick={go(() => onAdmin('clientes'))} />
          </div>
        )}
      </nav>

      {/* Footer usuario */}
      <div className="px-4 py-3.5 border-t border-hairline flex items-center gap-2.5">
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center text-[13px] font-bold shrink-0
                        ${esAdmin ? 'bg-blue-50 text-blue-700' : 'bg-accent-light text-accent'}`}>
          {iniciales}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-semibold text-ink truncate">
            {esAdmin ? 'Administrador' : 'Usuario'}
          </p>
          <p className="text-[11px] text-slate">Devé</p>
        </div>
        <button
          onClick={onLogout}
          title="Cerrar sesión"
          className="text-slate-400 hover:text-danger transition-colors p-1"
        >
          <LogOut className="w-[18px] h-[18px]" strokeWidth={1.8} />
        </button>
      </div>
    </>
  )
}

export default function Dashboard({ user, perfil, cliente, esAdmin, onCambiarCliente }) {
  const [moduloActivo, setModuloActivo] = useState(null)
  const [vistaAdmin, setVistaAdmin] = useState(null)
  const [drawerAbierto, setDrawerAbierto] = useState(false)
  const isMobile = useIsMobile()

  const handleLogout = async () => await supabase.auth.signOut()
  const goHome = () => { setModuloActivo(null); setVistaAdmin(null) }
  const handleModulo = (id) => { setModuloActivo(id); setVistaAdmin(null) }
  const handleAdmin = (v) => { setVistaAdmin(v); setModuloActivo(null) }

  if (vistaAdmin === 'clientes') return <AdminClientes onVolver={goHome} />
  if (vistaAdmin === 'usuarios') return <AdminUsuarios onVolver={goHome} />

  const moduloLabel = MODULOS.find(m => m.id === moduloActivo)?.label

  const sidebarProps = {
    cliente, esAdmin, moduloActivo, vistaAdmin,
    onModulo: handleModulo, onAdmin: handleAdmin,
    onCambiarCliente, onLogout: handleLogout,
  }

  return (
    <div className="min-h-screen bg-bg flex flex-col">

      {isMobile && (
        <div className="fixed top-0 left-0 right-0 z-[200] bg-surface border-b border-hairline
                        flex items-center gap-3 px-4 h-14">
          <button onClick={() => setDrawerAbierto(true)} className="p-1.5 text-ink">
            <Menu className="w-5 h-5" strokeWidth={2} />
          </button>
          <img src="/logo-deve.png" alt="Devé" className="h-7 w-auto" onClick={goHome} />
          <div className="flex-1" />
          {moduloActivo && (
            <button onClick={goHome} className="text-accent text-[13px] font-semibold">
              ← Inicio
            </button>
          )}
        </div>
      )}

      {isMobile && drawerAbierto && (
        <>
          <div onClick={() => setDrawerAbierto(false)} className="fixed inset-0 bg-black/40 z-[300]" />
          <div className="fixed top-0 left-0 bottom-0 w-[80%] max-w-[300px] bg-surface z-[400]
                          flex flex-col shadow-[4px_0_24px_rgba(0,0,0,.12)]">
            <SidebarContent {...sidebarProps} onClose={() => setDrawerAbierto(false)} />
          </div>
        </>
      )}

      <div className={`flex flex-1 ${isMobile ? 'pt-14' : ''}`}>

        {!isMobile && (
          <aside className="w-[248px] bg-surface border-r border-hairline flex flex-col flex-shrink-0
                            sticky top-0 h-screen overflow-y-auto">
            <SidebarContent {...sidebarProps} />
          </aside>
        )}

        <main className="flex-1 overflow-y-auto overflow-x-hidden">
          {moduloActivo ? (
            <div>
              {!isMobile && (
                <div className="bg-surface border-b border-hairline px-8 py-3.5 flex items-center gap-2.5 flex-wrap">
                  <button onClick={goHome} className="text-sm text-slate hover:text-accent transition-colors">
                    ← Volver
                  </button>
                  <span className="text-hairline mx-1">·</span>
                  <span className="text-sm font-semibold text-accent">{cliente.nombre}</span>
                  <span className="text-hairline mx-1">·</span>
                  <span className="text-sm font-semibold text-ink">{moduloLabel}</span>
                </div>
              )}

              {isMobile && (
                <div className="px-5 pt-4 border-b border-hairline bg-surface">
                  <p className="text-[11px] font-semibold text-accent uppercase tracking-wide mb-0.5">{cliente.nombre}</p>
                  <p className="text-lg font-bold text-ink pb-3">{moduloLabel}</p>
                </div>
              )}

              {moduloActivo === 'contratistas' && (
                <Contratistas cliente={cliente} esAdmin={esAdmin} />
              )}
              {moduloActivo === 'controles' && (
                <ControlesOperativos cliente={cliente} esAdmin={esAdmin} user={user} />
              )}
              {moduloActivo !== 'contratistas' && moduloActivo !== 'controles' && (
                <div className="p-6 md:p-10 max-w-2xl">
                  <div className="bg-surface border border-hairline rounded-xl p-8 text-center">
                    <p className="text-slate text-sm">
                      Módulo <strong className="text-ink">{moduloLabel}</strong> próximamente.
                    </p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className={isMobile ? 'p-5' : 'p-10 md:p-11'}>
              <p className="text-xs font-semibold text-accent uppercase tracking-wider mb-2">Panel principal</p>
              <h1 className="text-2xl md:text-[26px] font-bold text-ink tracking-tight mb-1.5">
                {cliente.nombre}
              </h1>
              <p className="text-slate text-[15px] mb-8">Seleccioná un módulo para comenzar.</p>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {MODULOS.map(({ id, Icon, label, desc, activo }) => (
                  <button
                    key={id}
                    onClick={() => activo && handleModulo(id)}
                    disabled={!activo}
                    className={`
                      text-left bg-surface border rounded-xl p-6 transition-all
                      ${activo
                        ? 'border-hairline hover:border-accent hover:shadow-[0_4px_18px_rgba(15,81,50,.07)] hover:-translate-y-px cursor-pointer'
                        : 'border-hairline opacity-45 cursor-default'}
                    `}
                  >
                    <Icon className="w-[26px] h-[26px] text-accent mb-4" strokeWidth={1.6} />
                    <h3 className="text-[15px] font-semibold text-ink tracking-tight mb-2">{label}</h3>
                    <p className="text-sm text-slate leading-relaxed mb-4">{desc}</p>
                    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold
                                      px-2.5 py-1 rounded-md
                                      ${activo ? 'bg-accent-light text-accent' : 'bg-hairline text-slate'}`}>
                      {activo ? '● Disponible' : 'Próximamente'}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
