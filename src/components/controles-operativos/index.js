'use client'

import { useState } from 'react'
import DashboardControlesOperativos from './DashboardControlesOperativos'
import TemaDetalle from './TemaDetalle'
import FormularioControl from './FormularioControl'
import ConfigPersonas from './ConfigPersonas'
import ConfigFrecuencias from './ConfigFrecuencias'
import { Card, BtnGhost } from '../contratistas/ui'
import { ArrowLeft } from 'lucide-react'

export default function ControlesOperativos({ cliente, esAdmin, user }) {
  const [vista, setVista] = useState('dashboard') // dashboard | tema | formulario | config | personas
  const [temaActivo, setTemaActivo] = useState(null)

  const irDashboard = () => { setVista('dashboard'); setTemaActivo(null) }
  const irTema = () => setVista('tema')

  if (vista === 'formulario' && temaActivo) {
    return (
      <FormularioControl
        tema={temaActivo}
        cliente={cliente}
        user={user}
        onVolver={irTema}
        onGuardadoOk={irTema}
      />
    )
  }

  if (vista === 'tema' && temaActivo) {
    return (
      <TemaDetalle
        tema={temaActivo}
        cliente={cliente}
        onNuevoControl={() => setVista('formulario')}
        onVolver={irDashboard}
      />
    )
  }

  if (vista === 'personas') {
    return <ConfigPersonas cliente={cliente} onVolver={irDashboard} />
  }

  if (vista === 'config') {
    return <ConfigFrecuencias cliente={cliente} onVolver={irDashboard} />
  }

  return (
    <DashboardControlesOperativos
      cliente={cliente}
      esAdmin={esAdmin}
      onSeleccionarTema={(t) => { setTemaActivo(t); setVista('tema') }}
      onConfig={() => setVista('config')}
      onConfigPersonas={() => setVista('personas')}
    />
  )
}
