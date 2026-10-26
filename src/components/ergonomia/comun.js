'use client'

// Utilidades compartidas del módulo de Ergonomía

export const FACTORES = [
  { id: 'A', corto: 'Levant.',   nombre: 'Levantamiento y descenso' },
  { id: 'B', corto: 'Empuje',    nombre: 'Empuje y arrastre' },
  { id: 'C', corto: 'Transp.',   nombre: 'Transporte' },
  { id: 'D', corto: 'Biped.',    nombre: 'Bipedestación' },
  { id: 'E', corto: 'Repet.',    nombre: 'Movimientos repetitivos' },
  { id: 'F', corto: 'Postura',   nombre: 'Postura forzada' },
  { id: 'G', corto: 'Vibrac.',   nombre: 'Vibraciones' },
  { id: 'H', corto: 'Térmico',   nombre: 'Confort térmico' },
  { id: 'I', corto: 'Contacto',  nombre: 'Estrés de contacto' },
]

export const METODOS = {
  LMC_295: 'Levantamiento manual de cargas (Res. 295/03)',
  NAM_295: 'Nivel de Actividad Manual (Res. 295/03)',
  REBA: 'REBA',
  RULA: 'RULA',
  EMPUJE_3345: 'Empuje y tracción (Res. 3345/15)',
  TRASLADO_3345: 'Traslado de cargas (Res. 3345/15)',
  LEST: 'LEST',
}

// Colores de nivel (texto oscuro sobre fondo claro, con contraste suficiente)
export const ESTILO_NIVEL = {
  '1': 'bg-green-100 text-green-900 border-green-300',
  '2': 'bg-amber-100 text-amber-900 border-amber-300',
  '3': 'bg-red-100 text-red-900 border-red-300',
  'A evaluar': 'bg-slate-100 text-slate-700 border-slate-300 border-dashed',
}

export const PESO_NIVEL = { '1': 1, '2': 4, '3': 9 }

// Índice de riesgo de una tarea: (n1 × 1) + (n2 × 4) + (n3 × 9). "A evaluar" no suma.
export const indiceRiesgo = (factores = []) =>
  factores.reduce((s, f) => s + (PESO_NIVEL[f.nivel] || 0), 0)

export const NivelChip = ({ nivel, grande = false }) => {
  if (!nivel) return <span className="text-slate-300">–</span>
  return (
    <span className={`inline-flex items-center justify-center border rounded-md font-bold
                      ${grande ? 'min-w-[34px] h-8 px-2 text-sm' : 'min-w-[28px] h-7 px-1.5 text-xs'}
                      ${ESTILO_NIVEL[nivel] || ''}`}
          title={nivel === 'A evaluar' ? 'A evaluar' : `Nivel ${nivel}`}>
      {nivel === 'A evaluar' ? 'A ev.' : nivel}
    </span>
  )
}

export const ESTADOS_MEDIDA = ['Pendiente', 'En proceso', 'Cumplida', 'Vencida']

export const ESTILO_ESTADO = {
  'Pendiente': 'bg-slate-100 text-slate-800',
  'En proceso': 'bg-blue-100 text-blue-900',
  'Cumplida': 'bg-green-100 text-green-900',
  'Vencida': 'bg-red-100 text-red-900',
}

export const fechaCorta = (f) => {
  if (!f) return ''
  const [a, m, d] = f.split('-')
  return `${d}/${m}/${a}`
}

// Clave para agrupar la misma tarea del mismo puesto entre estudios
export const claveTarea = (puesto, tarea) =>
  `${(puesto || '').trim().toLowerCase()}|${(tarea || '').trim().toLowerCase()}`
