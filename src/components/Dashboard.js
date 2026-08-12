'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import {
  CheckCircle2, HardHat, ClipboardList, TriangleAlert, ShieldCheck, Wrench,
  Users, Building2, LogOut, Menu, X, ChevronRight, ArrowLeft
} from 'lucide-react'
import Contratistas from './contratistas'
import ControlesOperativos from './controles-operativos'
import AdminClientes from './AdminClientes'
import AdminUsuarios from './AdminUsuarios'

// ─── DEFINICIÓN DE MÓDULOS ───────────────────────────────────────────────────
export const MODULOS = [
  { id: 'controles',   Icon: CheckCircle2,   label: 'Controles Operativos',   desc: 'Inspecciones por tipo de equipo con exportación PDF.',                   activo: true  },
  { id: 'contratistas',Icon: HardHat,        label: 'Control de Contratistas',desc: 'Gestión documental de empresas contratistas y sus trabajadores.',        activo: true  },
  { id: 'incidentes',  Icon: ClipboardList,  label: 'Registro de Incidentes', desc: 'Documentación de accidentes, casi-accidentes y situaciones de riesgo.',  activo: false },
  { id: 'riesgo',      Icon: TriangleAlert,  label: 'Matriz de Riesgo',       desc: 'Evaluación y priorización de riesgos por probabilidad e impacto.',       activo: false },
  { id: 'epp',         Icon: ShieldCheck,    label: 'Gestión de EPP',         desc: 'Control de entrega y stock de equipos de protección personal.',          activo: false },
  { id: 'acap',        Icon: Wrench,         label: 'Plan ACAP',              desc: 'Consolidador de acciones correctivas y preventivas de todos los módulos.',activo: false },
]

// ─── ITEM DE NAVEGACIÓN ──────────────────────────────────────────────────────
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

// ─── CONTENIDO DEL SIDEBAR ───────────────────────────────────────────────────
function SidebarContent({ user, cliente, esAdmin, moduloActivo, vistaAdmin, onModulo, onAdmin, onCambiarCliente, onLogout, onClose }) {
  const iniciales = user?.email?.slice(0, 2).toUpperCase() || 'DV'

  const go = (fn) => () => { fn(); onClose?.() }

  return (
    <>
      {/* Logo */}
      <div
        className="px-5 pt-[18px] pb-4 border-b border-hairline cursor-pointer"
        onClick={go(() => onModulo(null))}
      >
        <img src="/logo-deve.png" alt="Devé" className="h-9 w-auto block mb-1" />
        <p className="text-[11px] text-slate tracking-wide">Gestión HSO</p>
      </div>

      {/* Cliente activo */}
      <div className="px-4 py-3 bg-accent-light border-b border-green-200">
        <p className="text-[11px] font-semibold text-accent uppercase tracking-wide mb-0.5">
          Cliente activo
        </p>
        <p className="text-sm font-semibold text-ink">{cliente?.nombre}</p>
        {esAdmin && (
          <button
            onClick={go(onCambiarCliente)}
            className="flex items-center gap-1 text-xs font-semibold text-accent mt-1 hover:underline"
          >
            Cambiar cliente
            <ChevronRight className="w-3 h-3" strokeWidth={2.5} />
          </button>
        )}
      </div>

      {/* Navegación */}
      <nav className="flex-1 px-2.5 py-3.5 overflow-y-auto">
        <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-2.5 pt-2 pb-1.5">
          Módulos
        </p>
        {MODULOS.map(m => (
          <NavItem
            key={m.id}
            Icon={m.Icon}
            label={m.label}
            activo={moduloActivo === m.id}
            disabled={!m.activo}
            badge={!m.activo ? 'Pronto' : null}
            onClick={m.activo ? go(() => onModulo(m.id)) : undefined}
          />
        ))}

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

      {/* Footer */}
      <div className="px-4 py-3.5 border-t border-hairline flex items-center gap-2.5">
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center text-[13px] font-bold shrink-0 ${esAdmin ? 'bg-blue-50 text-blue-700' : 'bg-accent-light text-accent'}`}>
          {iniciales}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-semibold text-ink truncate">
            {user?.email}
          </p>
          <p className="text-[11px] text-slate">{esAdmin ? 'Administrador' : 'Usuario'}</p>
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

// ─── DASHBOARD PRINCIPAL ─────────────────────────────────────────────────────
export default function Dashboard({ user, perfil, cliente, esAdmin, onCambiarCliente }) {
  const [moduloActivo, setModuloActivo] = useState(null)
  const [vistaAdmin, setVistaAdmin] = useState(null)
  const [drawer, setDrawer] = useState(false)

  const handleLogout = async () => await supabase.auth.signOut()
  const goHome = () => { setModuloActivo(null); setVistaAdmin(null) }
  const handleModulo = (id) => { setModuloActivo(id); setVistaAdmin(null) }
  const handleAdmin = (v) => { setVistaAdmin(v); setModuloActivo(null) }

  const moduloLabel = MODULOS.find(m => m.id === moduloActivo)?.label
  const adminLabel = vistaAdmin === 'usuarios' ? 'Usuarios' : vistaAdmin === 'clientes' ? 'Clientes' : null
  const tituloActual = moduloLabel || adminLabel

  const sidebarProps = {
    user, cliente, esAdmin, moduloActivo, vistaAdmin,
    onModulo: handleModulo, onAdmin: handleAdmin,
    onCambiarCliente, onLogout: handleLogout,
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row">

      {/* ── BARRA SUPERIOR MÓVIL ── */}
      <div className="md:hidden sticky top-0 z-50 h-14 bg-white border-b border-hairline flex items-center gap-3 px-4">
        <button onClick={() => setDrawer(true)} className="p-1.5 -ml-1.5 text-ink">
          <Menu className="w-5 h-5" strokeWidth={2} />
        </button>
        <img src="/logo-deve.png" alt="Devé" className="h-7 w-auto" onClick={goHome} />
        <div className="flex-1" />
        {tituloActual && (
          <button
            onClick={goHome}
            className="flex items-center gap-1 text-[13px] font-semibold text-accent"
          >
            <ArrowLeft className="w-3.5 h-3.5" strokeWidth={2.5} />
            Inicio
          </button>
        )}
      </div>

      {/* ── DRAWER MÓVIL ── */}
      {drawer && (
        <>
          <div
            onClick={() => setDrawer(false)}
            className="md:hidden fixed inset-0 bg-black/40 z-[60]"
          />
          <aside className="md:hidden fixed inset-y-0 left-0 w-[80%] max-w-[300px] bg-white z-[70] flex flex-col shadow-[4px_0_24px_rgba(0,0,0,.12)]">
            <button
              onClick={() => setDrawer(false)}
              className="absolute top-4 right-4 p-1 text-slate z-10"
            >
              <X className="w-5 h-5" strokeWidth={2} />
            </button>
            <SidebarContent {...sidebarProps} onClose={() => setDrawer(false)} />
          </aside>
        </>
      )}

      {/* ── SIDEBAR DESKTOP ── */}
      <aside className="hidden md:flex w-[248px] shrink-0 bg-white border-r border-hairline flex-col sticky top-0 h-screen overflow-y-auto">
        <SidebarContent {...sidebarProps} />
      </aside>

      {/* ── CONTENIDO PRINCIPAL ── */}
      <main className="flex-1 overflow-x-hidden">
        {tituloActual ? (
          <div>
            {/* Breadcrumb desktop */}
            <div className="hidden md:flex items-center gap-2.5 px-8 py-3.5 bg-white border-b border-hairline">
              <button
                onClick={goHome}
                className="flex items-center gap-1 text-sm text-slate hover:text-accent transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" strokeWidth={2} />
                Volver
              </button>
              <span className="text-hairline">·</span>
              <span className="text-sm font-semibold text-accent">{cliente.nombre}</span>
              <span className="text-hairline">·</span>
              <span className="text-sm font-semibold text-ink">{tituloActual}</span>
            </div>

            {/* Título móvil */}
            <div className="md:hidden px-5 pt-4 pb-3 bg-white border-b border-hairline">
              <p className="text-[11px] font-semibold text-accent uppercase tracking-wide">
                {cliente.nombre}
              </p>
              <h1 className="text-lg font-bold text-ink">
                {tituloActual}
              </h1>
            </div>

            {/* Módulos */}
            {moduloActivo === 'contratistas' && (
              <Contratistas cliente={cliente} esAdmin={esAdmin} />
            )}

            {moduloActivo === 'controles' && (
              <ControlesOperativos cliente={cliente} esAdmin={esAdmin} user={user} />
            )}

            {moduloActivo && moduloActivo !== 'contratistas' && moduloActivo !== 'controles' && (
              <div className="p-6 md:p-10 max-w-2xl">
                <div className="bg-white border border-hairline rounded-xl p-8 text-center">
                  <p className="text-slate text-sm">
                    Módulo <strong className="text-ink">{tituloActual}</strong> pendiente de migrar.
                  </p>
                </div>
              </div>
            )}

            {vistaAdmin === 'clientes' && <AdminClientes onVolver={goHome} />}
            {vistaAdmin === 'usuarios' && <AdminUsuarios onVolver={goHome} />}
          </div>
        ) : (
          /* ── HOME ── */
          <div className="p-5 md:p-11 max-w-[1000px]">
            <p className="text-xs font-semibold text-accent uppercase tracking-wider mb-2">
              Panel principal
            </p>
            <h1 className="text-2xl md:text-[26px] font-bold text-ink tracking-tight mb-1.5">
              {cliente.nombre}
            </h1>
            <p className="text-slate text-[15px] mb-8">
              Seleccioná un módulo para comenzar.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {MODULOS.map(({ id, Icon, label, desc, activo }) => (
                <button
                  key={id}
                  onClick={() => activo && handleModulo(id)}
                  disabled={!activo}
                  className={`
                    text-left bg-white border rounded-xl p-6 transition-all
                    ${activo
                      ? 'border-hairline hover:border-accent hover:shadow-[0_4px_18px_rgba(15,81,50,.07)] hover:-translate-y-px cursor-pointer'
                      : 'border-hairline opacity-45 cursor-default'}
                  `}
                >
                  <Icon className="w-[26px] h-[26px] text-accent mb-4" strokeWidth={1.6} />
                  <h3 className="text-[15px] font-semibold text-ink tracking-tight mb-2">
                    {label}
                  </h3>
                  <p className="text-sm text-slate leading-relaxed mb-4">
                    {desc}
                  </p>
                  <span className={`inline-flex items-center gap-1.5 text-xs font-semibold
                                    px-2.5 py-1 rounded-md
                                    ${activo
                                      ? 'bg-accent-light text-accent'
                                      : 'bg-hairline text-slate'}`}>
                    {activo ? '● Disponible' : 'Próximamente'}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
