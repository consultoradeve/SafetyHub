'use client'

import { Circle } from 'lucide-react'

// ─── LÓGICA DE SEMÁFORO ──────────────────────────────────────────────────────
export const calcEstado = (aplica, recibido, fechaVenc) => {
  if (!aplica) return 'no_aplica'
  if (!recibido) return 'rojo'
  if (!fechaVenc) return 'verde'
  const dias = Math.ceil((new Date(fechaVenc) - new Date()) / 86400000)
  if (dias < 0) return 'rojo'
  if (dias <= 30) return 'amarillo'
  return 'verde'
}

export const peorEstado = (estados) => {
  const activos = estados.filter(e => e !== 'no_aplica')
  if (!activos.length) return 'sin_docs'
  if (activos.includes('rojo')) return 'rojo'
  if (activos.includes('amarillo')) return 'amarillo'
  return 'verde'
}

export const SEMAFORO = {
  verde:     { label: 'Vigente',    dot: 'bg-green-600',  chip: 'bg-green-100 text-green-800 border-green-200' },
  amarillo:  { label: 'Por vencer', dot: 'bg-yellow-500', chip: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
  rojo:      { label: 'Vencido',    dot: 'bg-red-600',    chip: 'bg-red-100 text-red-800 border-red-200' },
  no_aplica: { label: 'No aplica',  dot: 'bg-slate-300',  chip: 'bg-slate-100 text-slate-500 border-slate-200' },
  sin_docs:  { label: 'Sin docs',   dot: 'bg-slate-300',  chip: 'bg-slate-100 text-slate-500 border-slate-200' },
}

export const FRECUENCIAS = [
  { value: 'diaria',     label: 'Diaria' },
  { value: 'semanal',    label: 'Semanal' },
  { value: 'quincenal',  label: 'Quincenal' },
  { value: 'mensual',    label: 'Mensual' },
  { value: 'trimestral', label: 'Trimestral' },
  { value: 'semestral',  label: 'Semestral' },
  { value: 'anual',      label: 'Anual' },
  { value: 'unica',      label: 'Única vez' },
]

export const APLICA_LABELS = {
  empresa:            'Empresa',
  dependencia:        'Personal dependencia',
  monotributista:     'Monotributista / Autónomo',
  ambos_trabajadores: 'Todos los trabajadores',
  vehiculos:          'Vehículos y maquinaria',
}

export const formatFecha = (f) =>
  f ? new Date(f + 'T00:00:00').toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' }) : null

// ─── COMPONENTES DE UI ───────────────────────────────────────────────────────
export const Dot = ({ estado }) => (
  <span className={`inline-block w-2.5 h-2.5 rounded-full shrink-0 ${SEMAFORO[estado]?.dot || 'bg-slate-300'}`} />
)

export const Badge = ({ estado }) => {
  const s = SEMAFORO[estado] || SEMAFORO.sin_docs
  return (
    <span className={`inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-md border whitespace-nowrap ${s.chip}`}>
      {s.label}
    </span>
  )
}

export const Card = ({ children, className = '' }) => (
  <div className={`bg-white border border-hairline rounded-xl ${className}`}>{children}</div>
)

export const CardTitle = ({ children }) => (
  <h3 className="text-[15px] font-semibold text-ink tracking-tight pb-3.5 mb-4 border-b border-hairline">
    {children}
  </h3>
)

export const Label = ({ children }) => (
  <label className="block text-xs font-semibold text-slate uppercase tracking-wide mb-1.5">
    {children}
  </label>
)

export const Input = (props) => (
  <input
    {...props}
    className={`w-full px-3.5 py-2.5 text-[15px] text-ink bg-white border-[1.5px] border-hairline
                rounded-md outline-none transition-colors focus:border-accent
                placeholder:text-slate-400 ${props.className || ''}`}
  />
)

export const Select = ({ children, ...props }) => (
  <div className="relative">
    <select
      {...props}
      className={`w-full pl-3.5 pr-10 py-2.5 text-[15px] text-ink bg-white appearance-none cursor-pointer
                  border-[1.5px] border-hairline rounded-md outline-none transition-colors
                  focus:border-accent ${props.className || ''}`}
    >
      {children}
    </select>
    <svg className="absolute right-3.5 top-1/2 -translate-y-1/2 w-3 h-3 text-slate pointer-events-none"
         viewBox="0 0 12 12" fill="currentColor">
      <path d="M6 8L1 3h10z" />
    </svg>
  </div>
)

export const BtnPrimary = ({ children, className = '', ...props }) => (
  <button
    {...props}
    className={`inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-md
                text-[15px] font-semibold text-white transition-colors
                bg-accent hover:bg-accent-hover
                disabled:bg-slate-400 disabled:cursor-not-allowed ${className}`}
  >
    {children}
  </button>
)

export const BtnGhost = ({ children, className = '', ...props }) => (
  <button
    {...props}
    className={`inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-md
                text-sm font-semibold text-slate bg-transparent border-[1.5px] border-hairline
                transition-colors hover:border-accent hover:text-accent ${className}`}
  >
    {children}
  </button>
)

export const BtnDanger = ({ children, className = '', ...props }) => (
  <button
    {...props}
    className={`inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-md
                text-[13px] font-semibold text-danger bg-transparent border-[1.5px] border-red-200
                transition-colors hover:bg-red-50 ${className}`}
  >
    {children}
  </button>
)

export const ToggleAplica = ({ aplica, onChange }) => (
  <button
    onClick={() => onChange(!aplica)}
    title={aplica ? 'Marcar como No aplica' : 'Marcar como Aplica'}
    className={`px-3 py-1.5 rounded-full border-[1.5px] text-xs font-semibold whitespace-nowrap transition-colors
      ${aplica
        ? 'border-green-200 bg-green-50 text-accent hover:bg-green-100'
        : 'border-hairline bg-slate-50 text-slate hover:bg-slate-100'}`}
  >
    {aplica ? '✓ Aplica' : '— No aplica'}
  </button>
)

export const EmptyState = ({ Icon, title, desc }) => (
  <div className="text-center py-12 px-6">
    {Icon && <Icon className="w-8 h-8 text-slate-300 mx-auto mb-3" strokeWidth={1.5} />}
    <p className="text-base font-semibold text-ink mb-1.5">{title}</p>
    {desc && <p className="text-sm text-slate">{desc}</p>}
  </div>
)
