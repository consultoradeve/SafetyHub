'use client'

// Cantidad de fotos disponibles en /public/fondos (01.jpg a 21.jpg).
// Si agregás más fotos, solo hay que actualizar este número.
const TOTAL_FONDOS = 21

function indiceDelDia() {
  const hoy = new Date()
  const inicioAnio = new Date(hoy.getFullYear(), 0, 0)
  const diffMs = hoy - inicioAnio
  const diaDelAnio = Math.floor(diffMs / 86400000)
  return diaDelAnio % TOTAL_FONDOS
}

export default function FondoDiario() {
  const numero = String(indiceDelDia() + 1).padStart(2, '0')

  return (
    <div
      className="fixed inset-0 -z-10"
      style={{
        backgroundImage: `linear-gradient(rgba(10,20,15,.55), rgba(10,20,15,.55)), url(/fondos/${numero}.jpg)`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    />
  )
}
