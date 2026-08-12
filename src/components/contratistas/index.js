'use client'

import { useState } from 'react'
import DashboardContratistas from './DashboardContratistas'
import FichaContratista from './FichaContratista'
import NuevaEmpresa from './NuevaEmpresa'
import ConfigDocumentos from './ConfigDocumentos'

export default function Contratistas({ cliente, esAdmin }) {
  const [vista, setVista] = useState('dashboard')
  const [empresaActiva, setEmpresaActiva] = useState(null)

  const irDashboard = () => { setVista('dashboard'); setEmpresaActiva(null) }

  if (vista === 'config') {
    return <ConfigDocumentos cliente={cliente} onVolver={irDashboard} />
  }

  if (vista === 'nueva') {
    return (
      <NuevaEmpresa
        cliente={cliente}
        onVolver={irDashboard}
        onGuardado={(e) => { setEmpresaActiva(e); setVista('ficha') }}
      />
    )
  }

  if (vista === 'ficha' && empresaActiva) {
    return (
      <FichaContratista
        contratista={empresaActiva}
        cliente={cliente}
        esAdmin={esAdmin}
        onVolver={irDashboard}
      />
    )
  }

  return (
    <DashboardContratistas
      cliente={cliente}
      esAdmin={esAdmin}
      onVerEmpresa={(c) => { setEmpresaActiva(c); setVista('ficha') }}
      onNuevaEmpresa={() => setVista('nueva')}
      onConfig={() => setVista('config')}
    />
  )
}
