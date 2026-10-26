'use client'

import { useState } from 'react'
import SelectorEstablecimiento from './SelectorEstablecimiento'
import DashboardRequisitos from './DashboardRequisitos'
import DetalleRequisito from './DetalleRequisito'
import FormularioRequisito from './FormularioRequisito'
import ConfigMatrizLegal from './ConfigMatrizLegal'

// Si llega un establecimiento (elegido al ingresar a SafetyHub), entra directo a sus
// requisitos; si no, muestra el selector de establecimientos como antes.
export default function MatrizLegal({ cliente, establecimiento: establecimientoFijo, esAdmin, user }) {
  const [vista, setVista] = useState(establecimientoFijo ? 'dashboard' : 'establecimientos') // establecimientos | dashboard | detalle | formulario | config
  const [establecimiento, setEstablecimiento] = useState(establecimientoFijo || null)
  const [requisitoActivo, setRequisitoActivo] = useState(null)

  const irDashboard = () => { setVista('dashboard'); setRequisitoActivo(null) }
  const irEstablecimientos = () => { setVista('establecimientos'); setEstablecimiento(null) }
  const irDetalle = (r) => { setRequisitoActivo(r); setVista('detalle') }

  if (vista === 'formulario' && establecimiento) {
    return (
      <FormularioRequisito
        cliente={cliente}
        establecimiento={establecimiento}
        requisito={requisitoActivo}
        onVolver={requisitoActivo ? () => irDetalle(requisitoActivo) : irDashboard}
        onGuardado={irDashboard}
      />
    )
  }

  if (vista === 'detalle' && establecimiento && requisitoActivo) {
    return (
      <DetalleRequisito
        cliente={cliente}
        establecimiento={establecimiento}
        requisito={requisitoActivo}
        user={user}
        esAdmin={esAdmin}
        onVolver={irDashboard}
        onEditar={(r) => { setRequisitoActivo(r); setVista('formulario') }}
        onEliminado={irDashboard}
      />
    )
  }

  if (vista === 'config') {
    return <ConfigMatrizLegal cliente={cliente} onVolver={irDashboard} />
  }

  if (vista === 'dashboard' && establecimiento) {
    return (
      <DashboardRequisitos
        cliente={cliente}
        establecimiento={establecimiento}
        esAdmin={esAdmin}
        onNuevo={() => { setRequisitoActivo(null); setVista('formulario') }}
        onVerDetalle={irDetalle}
        onConfig={() => setVista('config')}
        onVolver={establecimientoFijo ? null : irEstablecimientos}
      />
    )
  }

  return (
    <SelectorEstablecimiento
      cliente={cliente}
      esAdmin={esAdmin}
      onSeleccionar={(e) => { setEstablecimiento(e); setVista('dashboard') }}
    />
  )
}
