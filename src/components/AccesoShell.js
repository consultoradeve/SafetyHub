'use client'

import { useEffect, useState } from 'react'
import FondoDiario from './FondoDiario'

export default function AccesoShell({ children, stepKey }) {
  const [visible, setVisible] = useState(false)

  // Pequeño fundido al cambiar de paso (login -> selector de cliente),
  // para que se sienta como una transformación y no como un salto brusco.
  useEffect(() => {
    setVisible(false)
    const t = setTimeout(() => setVisible(true), 20)
    return () => clearTimeout(t)
  }, [stepKey])

  return (
    <div className="min-h-screen flex items-center justify-center px-5 py-10">
      <FondoDiario />
      <div className="w-full max-w-[420px]">
        <div
          className="bg-white border border-hairline rounded-xl px-11 py-12 shadow-[0_8px_40px_rgba(0,0,0,.25)] transition-opacity duration-300"
          style={{ opacity: visible ? 1 : 0 }}
        >
          {children}
        </div>
      </div>
    </div>
  )
}
