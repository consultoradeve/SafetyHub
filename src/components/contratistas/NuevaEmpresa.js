'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { ArrowLeft, ArrowRight, Check, Users, Briefcase, Layers } from 'lucide-react'
import { Card, CardTitle, Label, Input, BtnPrimary, BtnGhost } from './ui'

const TIPOS_PERSONAL = [
  { value: 'dependencia',    Icon: Users,     label: 'Relación de dependencia',    desc: 'Todo el personal está en relación de dependencia' },
  { value: 'monotributista', Icon: Briefcase, label: 'Monotributista / Autónomo',  desc: 'Todo el personal es monotributista o autónomo' },
  { value: 'mixto',          Icon: Layers,    label: 'Mixto (ambos tipos)',         desc: 'La empresa tiene personal de ambos tipos' },
]

const CAMPOS = [
  ['nombre',    'Razón social *', 'Electricidad del Norte S.A.'],
  ['cuit',      'CUIT',           '30-12345678-9'],
  ['contacto',  'Contacto',       'Juan Pérez'],
  ['email',     'Email',          'contacto@empresa.com'],
  ['telefono',  'Teléfono',       '11 1234-5678'],
]

export default function NuevaEmpresa({ cliente, onVolver, onGuardado }) {
  const [paso, setPaso] = useState(1)
  const [form, setForm] = useState({ nombre: '', cuit: '', contacto: '', email: '', telefono: '' })
  const [tipoPersonal, setTipoPersonal] = useState('')
  const [guardando, setGuardando] = useState(false)

  const guardar = async () => {
    if (!form.nombre.trim() || !tipoPersonal) return
    setGuardando(true)

    // 1. Crear la empresa
    const { data: empresa } = await supabase
      .from('contratistas')
      .insert({ ...form, cliente_id: cliente.id, tipo_personal: tipoPersonal })
      .select().single()

    // 2. Pre-cargar documentos de empresa desde el catálogo
    if (empresa) {
      const { data: catalogo } = await supabase
        .from('docs_catalogo').select('*').eq('aplica_a', 'empresa').order('nombre')

      if (catalogo?.length) {
        const { data: yaExisten } = await supabase
          .from('documentos_requeridos').select('*')
          .eq('cliente_id', cliente.id).eq('aplica_a', 'empresa')

        const nombresExistentes = (yaExisten || []).map(d => d.nombre)
        const nuevos = catalogo
          .filter(c => !nombresExistentes.includes(c.nombre))
          .map(c => ({
            cliente_id: cliente.id,
            nombre: c.nombre,
            aplica_a: c.aplica_a,
            frecuencia: c.frecuencia_sugerida || 'mensual',
            dias_alerta: 30,
            activo: true,
          }))

        if (nuevos.length) await supabase.from('documentos_requeridos').insert(nuevos)

        const { data: todosDocsReq } = await supabase
          .from('documentos_requeridos').select('*')
          .eq('cliente_id', cliente.id).eq('aplica_a', 'empresa').eq('activo', true)

        if (todosDocsReq?.length) {
          await supabase.from('docs_empresa').insert(
            todosDocsReq.map(d => ({
              contratista_id: empresa.id, documento_id: d.id, aplica: true, recibido: false,
            }))
          )
        }
      }
    }

    setGuardando(false)
    onGuardado(empresa)
  }

  return (
    <div className="max-w-[760px] mx-auto p-5 md:p-8">

      {/* Header con pasos */}
      <div className="flex flex-wrap items-start justify-between gap-3 mb-6">
        <div>
          <h2 className="text-xl md:text-[22px] font-bold text-ink tracking-tight">Nueva empresa contratista</h2>
          <div className="flex items-center gap-2 mt-3">
            {['Datos de la empresa', 'Tipo de personal'].map((label, i) => {
              const n = i + 1
              const done = paso > n
              const active = paso === n
              return (
                <div key={label} className="flex items-center gap-1.5">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold
                                  ${done || active ? 'bg-accent text-white' : 'bg-hairline text-slate'}`}>
                    {done ? <Check className="w-3 h-3" strokeWidth={3} /> : n}
                  </div>
                  <span className={`text-[13px] ${active ? 'text-ink font-semibold' : 'text-slate'}`}>
                    {label}
                  </span>
                  {i === 0 && <span className="text-hairline mx-1">›</span>}
                </div>
              )
            })}
          </div>
        </div>
        <BtnGhost onClick={onVolver}>
          <ArrowLeft className="w-4 h-4" strokeWidth={2} />
          Volver
        </BtnGhost>
      </div>

      {/* PASO 1 */}
      {paso === 1 && (
        <Card className="p-6 md:p-7">
          <CardTitle>Datos de la empresa</CardTitle>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
            {CAMPOS.map(([k, l, p]) => (
              <div key={k}>
                <Label>{l}</Label>
                <Input
                  placeholder={p}
                  value={form[k]}
                  onChange={e => setForm({ ...form, [k]: e.target.value })}
                />
              </div>
            ))}
          </div>
          <div className="flex gap-2.5">
            <BtnPrimary onClick={() => form.nombre.trim() && setPaso(2)} disabled={!form.nombre.trim()}>
              Siguiente
              <ArrowRight className="w-4 h-4" strokeWidth={2} />
            </BtnPrimary>
            <BtnGhost onClick={onVolver}>Cancelar</BtnGhost>
          </div>
        </Card>
      )}

      {/* PASO 2 */}
      {paso === 2 && (
        <Card className="p-6 md:p-7">
          <CardTitle>¿Cómo está compuesto el personal de {form.nombre}?</CardTitle>
          <p className="text-sm text-slate -mt-2 mb-5">
            Esto define qué documentación se va a requerir a los trabajadores de esta empresa.
          </p>

          <div className="flex flex-col gap-2.5 mb-6">
            {TIPOS_PERSONAL.map(({ value, Icon, label, desc }) => {
              const sel = tipoPersonal === value
              return (
                <button
                  key={value}
                  onClick={() => setTipoPersonal(value)}
                  className={`flex items-start gap-3.5 text-left px-5 py-4 rounded-lg border-2 transition-all
                    ${sel ? 'border-accent bg-accent-light' : 'border-hairline bg-white hover:border-accent'}`}
                >
                  <Icon className={`w-5 h-5 mt-0.5 shrink-0 ${sel ? 'text-accent' : 'text-slate'}`} strokeWidth={1.8} />
                  <div>
                    <p className={`text-[15px] font-semibold mb-0.5 ${sel ? 'text-accent' : 'text-ink'}`}>{label}</p>
                    <p className="text-[13px] text-slate">{desc}</p>
                  </div>
                </button>
              )
            })}
          </div>

          {tipoPersonal && (
            <div className="flex items-start gap-2 bg-accent-light border border-green-200 rounded-lg px-4 py-3 mb-5">
              <Check className="w-4 h-4 text-success shrink-0 mt-0.5" strokeWidth={2.5} />
              <p className="text-sm text-success">
                Se pre-cargarán automáticamente los documentos de empresa del catálogo.
                Los documentos de cada trabajador se cargan al agregar cada persona.
              </p>
            </div>
          )}

          <div className="flex gap-2.5">
            <BtnPrimary onClick={guardar} disabled={guardando || !tipoPersonal}>
              {guardando ? 'Guardando...' : 'Registrar empresa'}
              {!guardando && <ArrowRight className="w-4 h-4" strokeWidth={2} />}
            </BtnPrimary>
            <BtnGhost onClick={() => setPaso(1)}>
              <ArrowLeft className="w-4 h-4" strokeWidth={2} />
              Atrás
            </BtnGhost>
          </div>
        </Card>
      )}
    </div>
  )
}
