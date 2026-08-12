'use client'

import { useState } from 'react'
import DashboardControlesOperativos from './DashboardControlesOperativos'
import TemaDetalle from './TemaDetalle'
import FormularioControl from './FormularioControl'
import { Card, BtnGhost } from '../contratistas/ui'
import { ArrowLeft } from 'lucide-react'

export default function ControlesOperativos({ cliente, esAdmin, user }) {
  const [vista, setVista] = useState('dashboard') // dashboard | tema | formulario | config
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

  if (vista === 'config') {
    return (
      <div className="max-w-[760px] mx-auto p-5 md:p-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-ink">Configurar frecuencias</h2>
          <BtnGhost onClick={irDashboard}>
            <ArrowLeft className="w-4 h-4" strokeWidth={2} />
            Volver
          </BtnGhost>
        </div>
        <Card className="p-8 text-center">
          <p className="text-slate text-sm">El panel de configuración se construye en el próximo paso.</p>
        </Card>
      </div>
    )
  }

  return (
    <DashboardControlesOperativos
      cliente={cliente}
      esAdmin={esAdmin}
      onSeleccionarTema={(t) => { setTemaActivo(t); setVista('tema') }}
      onConfig={() => setVista('config')}
    />
  )
}
