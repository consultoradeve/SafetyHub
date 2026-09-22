// Calcula el estado de un requisito legal según fecha de presentación + frecuencia,
// comparado contra los umbrales configurados por el cliente (por defecto 45/90 días,
// igual que en el Excel original).

export function calcularVencimiento(req) {
  if (!req.frecuencia_dias || !req.fecha_presentacion) return null
  const fecha = new Date(req.fecha_presentacion + 'T00:00:00')
  fecha.setDate(fecha.getDate() + req.frecuencia_dias)
  return fecha
}

export function calcularEstadoRequisito(req, config) {
  if (!req.frecuencia_dias) return 'sin_vencimiento' // ej: habilitaciones, planos sin vencimiento
  if (!req.fecha_presentacion) return 'sin_datos'     // frecuencia cargada pero nunca se presentó

  const vencimiento = calcularVencimiento(req)
  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0)
  const diasRestantes = Math.ceil((vencimiento - hoy) / 86400000)

  const umbralRojo = config?.umbral_rojo ?? 45
  const umbralAmarillo = config?.umbral_amarillo ?? 90

  if (diasRestantes < 0) return 'vencido'
  if (diasRestantes < umbralRojo) return 'rojo'
  if (diasRestantes < umbralAmarillo) return 'amarillo'
  return 'verde'
}

export const SEMAFORO_MATRIZ = {
  vencido:         { label: 'Vencido',         dot: 'bg-red-700',    chip: 'bg-red-100 text-red-800 border-red-200' },
  rojo:            { label: 'Urgente',         dot: 'bg-red-500',    chip: 'bg-red-50 text-red-700 border-red-200' },
  amarillo:        { label: 'Por vencer',      dot: 'bg-yellow-500', chip: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
  verde:           { label: 'Vigente',         dot: 'bg-green-600',  chip: 'bg-green-100 text-green-800 border-green-200' },
  sin_vencimiento: { label: 'Sin vencimiento', dot: 'bg-blue-400',   chip: 'bg-blue-50 text-blue-700 border-blue-200' },
  sin_datos:       { label: 'Sin presentar',   dot: 'bg-slate-300',  chip: 'bg-slate-100 text-slate-500 border-slate-200' },
}

export const ORDEN_URGENCIA = { vencido: 0, rojo: 1, amarillo: 2, sin_datos: 3, verde: 4, sin_vencimiento: 5 }
