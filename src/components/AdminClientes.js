'use client'

import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { ArrowLeft, Plus, Trash2, Building2, Loader2, Image as ImageIcon, Upload } from 'lucide-react'
import {
  Card, CardTitle, Label, Input, BtnPrimary, BtnGhost, EmptyState
} from './contratistas/ui'

const CAMPOS = [
  ['nombre',   'Nombre de la empresa *', 'Carrefour S.A.'],
  ['contacto', 'Persona de contacto',    'Juan Pérez'],
  ['rut',      'CUIT / RUT',             '30-12345678-9'],
]

export default function AdminClientes({ onVolver }) {
  const [clientes, setClientes] = useState([])
  const [form, setForm] = useState({ nombre: '', contacto: '', rut: '' })
  const [editando, setEditando] = useState(null)
  const [guardando, setGuardando] = useState(false)
  const [confirmDel, setConfirmDel] = useState(null)
  const [cargando, setCargando] = useState(true)

  const [logoFile, setLogoFile] = useState(null)
  const [logoPreview, setLogoPreview] = useState(null)
  const [subiendoLogo, setSubiendoLogo] = useState(false)
  const fileInputRef = useRef(null)

  useEffect(() => { cargar() }, [])

  const cargar = async () => {
    const { data } = await supabase.from('clientes').select('*').order('nombre')
    if (data) setClientes(data)
    setCargando(false)
  }

  const seleccionarLogo = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setLogoFile(file)
    setLogoPreview(URL.createObjectURL(file))
  }

  const subirLogo = async (clienteId) => {
    if (!logoFile) return null
    setSubiendoLogo(true)
    const ext = logoFile.name.split('.').pop()
    const path = `${clienteId}-${Date.now()}.${ext}`

    const { error } = await supabase.storage
      .from('logos-clientes')
      .upload(path, logoFile, { upsert: true })

    setSubiendoLogo(false)
    if (error) { console.error(error); return null }

    const { data } = supabase.storage.from('logos-clientes').getPublicUrl(path)
    return data.publicUrl
  }

  const guardar = async () => {
    if (!form.nombre.trim()) return
    setGuardando(true)

    if (editando) {
      let logo_url
      if (logoFile) logo_url = await subirLogo(editando)
      const payload = { ...form, ...(logo_url ? { logo_url } : {}) }
      await supabase.from('clientes').update(payload).eq('id', editando)
      setEditando(null)
    } else {
      const { data: nuevo } = await supabase.from('clientes').insert(form).select().single()
      if (nuevo && logoFile) {
        const logo_url = await subirLogo(nuevo.id)
        if (logo_url) await supabase.from('clientes').update({ logo_url }).eq('id', nuevo.id)
      }
    }

    setForm({ nombre: '', contacto: '', rut: '' })
    setLogoFile(null); setLogoPreview(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
    await cargar()
    setGuardando(false)
  }

  const eliminar = async (id) => {
    await supabase.from('clientes').delete().eq('id', id)
    setConfirmDel(null)
    await cargar()
  }

  const editar = (c) => {
    setEditando(c.id)
    setForm({ nombre: c.nombre, contacto: c.contacto || '', rut: c.rut || '' })
    setLogoFile(null)
    setLogoPreview(c.logo_url || null)
  }

  const cancelarEdicion = () => {
    setEditando(null)
    setForm({ nombre: '', contacto: '', rut: '' })
    setLogoFile(null); setLogoPreview(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const toggleActivo = async (c) => {
    await supabase.from('clientes').update({ activo: !c.activo }).eq('id', c.id)
    await cargar()
  }

  if (cargando) return (
    <div className="flex items-center justify-center gap-2.5 py-20 text-slate">
      <Loader2 className="w-5 h-5 animate-spin" strokeWidth={2} />
      Cargando clientes...
    </div>
  )

  return (
    <div className="max-w-[860px] mx-auto p-5 md:p-8">

      <div className="flex flex-wrap items-start justify-between gap-3 mb-6">
        <div>
          <h2 className="text-xl md:text-[22px] font-bold text-ink tracking-tight">
            Administración de Clientes
          </h2>
          <p className="text-sm text-slate mt-0.5">
            Gestioná los clientes disponibles en la app
          </p>
        </div>
        <BtnGhost onClick={onVolver}>
          <ArrowLeft className="w-4 h-4" strokeWidth={2} />
          Volver
        </BtnGhost>
      </div>

      {/* Formulario */}
      <Card className="p-6 mb-6">
        <CardTitle>{editando ? 'Editar cliente' : 'Agregar cliente nuevo'}</CardTitle>

        <div className="flex items-start gap-5 mb-5">
          <div
            onClick={() => fileInputRef.current?.click()}
            className="w-20 h-20 rounded-lg border-2 border-dashed border-hairline flex items-center justify-center
                       shrink-0 cursor-pointer overflow-hidden bg-slate-50 hover:border-accent transition-colors"
          >
            {logoPreview ? (
              <img src={logoPreview} alt="Logo" className="w-full h-full object-contain p-1" />
            ) : (
              <ImageIcon className="w-6 h-6 text-slate-300" strokeWidth={1.5} />
            )}
          </div>
          <div>
            <Label>Logo del cliente</Label>
            <input
              ref={fileInputRef} type="file" accept="image/*"
              onChange={seleccionarLogo} className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md text-[13px] font-semibold text-slate
                         border-[1.5px] border-hairline transition-colors hover:border-accent hover:text-accent"
            >
              <Upload className="w-3.5 h-3.5" strokeWidth={1.8} />
              {logoPreview ? 'Cambiar imagen' : 'Subir imagen'}
            </button>
            <p className="text-xs text-slate mt-2">PNG o JPG, fondo transparente recomendado.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
          {CAMPOS.map(([k, l, p]) => (
            <div key={k}>
              <Label>{l}</Label>
              <Input placeholder={p} value={form[k]}
                onChange={e => setForm({ ...form, [k]: e.target.value })} />
            </div>
          ))}
        </div>
        <div className="flex gap-2.5">
          <BtnPrimary onClick={guardar} disabled={guardando || subiendoLogo || !form.nombre.trim()}>
            {!editando && <Plus className="w-4 h-4" strokeWidth={2.2} />}
            {guardando || subiendoLogo ? 'Guardando...' : editando ? 'Guardar cambios' : 'Agregar cliente'}
          </BtnPrimary>
          {editando && (
            <BtnGhost onClick={cancelarEdicion}>Cancelar</BtnGhost>
          )}
        </div>
      </Card>

      {/* Lista */}
      <Card className="overflow-hidden">
        <div className="px-6 py-4 border-b border-hairline">
          <h3 className="text-[15px] font-semibold text-ink">
            Clientes registrados ({clientes.length})
          </h3>
        </div>

        {clientes.length === 0 ? (
          <EmptyState Icon={Building2} title="No hay clientes cargados" />
        ) : clientes.map((c, i) => (
          <div key={c.id}
            className={`flex flex-wrap items-center gap-3 px-6 py-4
                        ${i > 0 ? 'border-t border-hairline' : ''}
                        ${!c.activo ? 'bg-slate-50' : ''}`}>

            <div className="w-10 h-10 rounded-lg border border-hairline bg-white flex items-center justify-center shrink-0 overflow-hidden">
              {c.logo_url
                ? <img src={c.logo_url} alt={c.nombre} className="w-full h-full object-contain p-1" />
                : <Building2 className="w-4 h-4 text-slate-300" strokeWidth={1.6} />}
            </div>

            <div className="flex-1 min-w-[200px]">
              <div className="flex items-center gap-2.5">
                <p className={`text-[15px] font-semibold ${c.activo ? 'text-ink' : 'text-slate'}`}>
                  {c.nombre}
                </p>
                <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-md
                  ${c.activo ? 'bg-accent-light text-accent' : 'bg-hairline text-slate'}`}>
                  {c.activo ? 'Activo' : 'Inactivo'}
                </span>
              </div>
              <p className="text-[13px] text-slate mt-0.5">
                {[c.contacto, c.rut].filter(Boolean).join(' · ') || 'Sin datos adicionales'}
              </p>
            </div>

            <div className="flex gap-2">
              <button onClick={() => editar(c)}
                className="px-3.5 py-2 rounded-md text-[13px] font-semibold text-slate
                           border-[1.5px] border-hairline transition-colors hover:border-accent hover:text-accent">
                Editar
              </button>
              <button onClick={() => toggleActivo(c)}
                className={`px-3.5 py-2 rounded-md text-[13px] font-semibold border-[1.5px] border-hairline
                            transition-colors ${c.activo ? 'text-warn hover:border-warn' : 'text-success hover:border-success'}`}>
                {c.activo ? 'Desactivar' : 'Activar'}
              </button>
              {confirmDel === c.id ? (
                <div className="flex items-center gap-1.5">
                  <span className="text-[13px] text-danger">¿Confirmar?</span>
                  <button onClick={() => eliminar(c.id)}
                    className="px-3 py-2 rounded-md text-[13px] font-semibold text-white bg-danger hover:bg-red-800">
                    Sí
                  </button>
                  <button onClick={() => setConfirmDel(null)}
                    className="px-2.5 py-2 rounded-md text-[13px] font-semibold text-slate border-[1.5px] border-hairline">
                    No
                  </button>
                </div>
              ) : (
                <button onClick={() => setConfirmDel(c.id)}
                  className="px-2.5 py-2 rounded-md text-danger border-[1.5px] border-red-200
                             transition-colors hover:bg-red-50">
                  <Trash2 className="w-4 h-4" strokeWidth={2} />
                </button>
              )}
            </div>
          </div>
        ))}
      </Card>
    </div>
  )
}
