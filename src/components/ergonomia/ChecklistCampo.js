'use client'

// Checklist de relevamiento de campo (Etapa A: con señal).
// El estudio nace como "borrador" y se guarda solo en erg_estudios.datos.checklist.
// Al marcar "Relevamiento completo" se vuelcan las Planillas 1 y 2 a las tablas del módulo.

import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { ArrowLeft, Loader2, Camera, Mic, X, Check, CloudOff, Cloud } from 'lucide-react'
import { FACT_886, LETRAS_886, codigoPlanilla, nivelPreliminar } from './planilla886'

const PASOS = ['Datos', 'Organización', 'Tareas', 'Cierre']
const nuevoFactor = () => ({ on: false, exp: '', u: 'minutos', r: [] })
const nuevaTarea = () => ({ nombre: '', so: '', dur: '', du: 'horas', postura: '', tras: '', fotos: [], obs: '', f: Object.fromEntries(LETRAS_886.map(l => [l, nuevoFactor()])) })
const nuevoChecklist = () => ({
  datos: { fecha: new Date().toISOString().slice(0, 10), sector: '', puesto: '', trab: '', pob: '', tipo: 'funcionamiento' },
  org: { turnos: [], turnoOtro: '', hd: '', ds: '', hx: '', hxa: '', descansos: { Almuerzo: { on: false, h: '12:00', m: '30' }, Merienda: { on: false, h: '16:00', m: '15' } }, infTipo: '', inf: '', obs: '' },
  tareas: [nuevaTarea()], cierreObs: '',
})
const TONO = { verde: 'bg-green-100 text-green-900', ambar: 'bg-amber-100 text-amber-900', rojo: 'bg-red-100 text-red-900', gris: 'bg-slate-100 text-slate-600' }
const HORAS = ['06:00','07:00','08:00','09:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00','18:00','19:00','20:00','21:00','22:00','23:00','00:00','01:00','02:00','03:00','04:00','05:00']

// ── piezas de interfaz ──────────────────────────────────────────────────────
const Tarjeta = ({ titulo, children }) => (
  <section className="bg-surface border border-hairline rounded-xl p-4 flex flex-col gap-3">
    {titulo && <h3 className="text-[16px] font-semibold text-ink">{titulo}</h3>}
    {children}
  </section>
)
const Campo = ({ label, value, onChange, type = 'text', inputMode, placeholder }) => (
  <label className="flex flex-col gap-1 text-[13px] font-medium text-slate">
    {label}
    <input type={type} value={value || ''} inputMode={inputMode} placeholder={placeholder}
      onChange={e => onChange(e.target.value)}
      className="min-h-[44px] border border-hairline rounded-lg px-3 text-[16px] text-ink bg-surface" />
  </label>
)
const Chips = ({ opciones, valor, onChange, multiple }) => (
  <div className="flex flex-wrap gap-2">
    {opciones.map(o => {
      const activo = multiple ? valor.includes(o) : valor === o
      return (
        <button key={o} type="button" aria-pressed={activo}
          onClick={() => multiple ? onChange(activo ? valor.filter(x => x !== o) : [...valor, o]) : onChange(activo ? '' : o)}
          className={`min-h-[40px] px-3.5 rounded-full text-[14px] border ${activo ? 'border-2 border-accent bg-accent-light text-accent font-semibold' : 'border-hairline bg-surface text-ink'}`}>
          {o}
        </button>
      )
    })}
  </div>
)
const Unidad = ({ valor, onChange }) => (
  <select aria-label="Unidad" value={valor} onChange={e => onChange(e.target.value)}
    className="min-h-[44px] border border-hairline rounded-lg px-2 text-[15px] bg-surface text-ink">
    <option value="horas">horas</option><option value="minutos">minutos</option>
  </select>
)
function TextoObs({ label, valor, onChange }) {
  const dictar = () => {
    const SR = typeof window !== 'undefined' && (window.SpeechRecognition || window.webkitSpeechRecognition)
    if (!SR) { alert('Para dictar, tocá el micrófono del teclado del teléfono dentro del campo.'); return }
    try {
      const r = new SR(); r.lang = 'es-AR'
      r.onresult = e => onChange(((valor || '') + ' ' + [...e.results].map(x => x[0].transcript).join(' ')).trim())
      r.onerror = () => alert('No se pudo usar el micrófono. Probá con el micrófono del teclado.')
      r.start()
    } catch { alert('Para dictar, tocá el micrófono del teclado del teléfono.') }
  }
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-[13px] font-medium text-slate">{label}</span>
      <textarea value={valor || ''} onChange={e => onChange(e.target.value)} rows={3}
        className="border border-hairline rounded-lg px-3 py-2 text-[15px] text-ink bg-surface" />
      <div className="flex gap-2">
        <button type="button" onClick={dictar} className="inline-flex items-center gap-1.5 min-h-[36px] px-3 rounded-lg border border-hairline text-[13px]">
          <Mic className="w-4 h-4" strokeWidth={1.8} /> Audio
        </button>
        <span className="text-[12px] text-slate self-center">"Mejorar redacción" se suma en la próxima entrega.</span>
      </div>
    </div>
  )
}

// ── pantalla ────────────────────────────────────────────────────────────────
export default function ChecklistCampo({ cliente, planta, estudioId: idInicial, onCerrar }) {
  const [id, setId] = useState(idInicial || null)
  const [c, setC] = useState(null)
  const [paso, setPaso] = useState(0)
  const [tsel, setTsel] = useState(0)
  const [abiertos, setAbiertos] = useState({})
  const [estadoGuardado, setEstadoGuardado] = useState('ok') // ok | guardando | local
  const [urls, setUrls] = useState({})
  const [subiendo, setSubiendo] = useState(0)
  const [cerrando, setCerrando] = useState(false)
  const timer = useRef(null)

  // Cargar o crear el borrador
  useEffect(() => {
    const iniciar = async () => {
      if (idInicial) {
        const { data } = await supabase.from('erg_estudios').select('datos').eq('id', idInicial).single()
        let ck = data?.datos?.checklist
        try { const loc = JSON.parse(localStorage.getItem('ergo-borrador-' + idInicial) || 'null'); if (loc && (!ck || loc.t > (ck.t || 0))) ck = loc } catch {}
        setC(ck || nuevoChecklist())
        return
      }
      const { data: { user } } = await supabase.auth.getUser()
      const ck = nuevoChecklist()
      const { data, error } = await supabase.from('erg_estudios').insert({
        cliente_id: cliente.id, establecimiento_id: planta.id, fecha: ck.datos.fecha,
        puesto: '(nuevo estudio)', estado: 'borrador', origen: 'app', created_by: user?.id, evaluador_id: user?.id,
        datos: { checklist: ck },
      }).select('id').single()
      if (error) { alert('No se pudo crear el estudio: ' + error.message); onCerrar(); return }
      setId(data.id); setC(ck)
    }
    iniciar()
  }, [])

  // Miniaturas de fotos ya subidas
  useEffect(() => {
    if (!c) return
    const faltan = c.tareas.flatMap(t => t.fotos).filter(f => f.tipo === 'foto' && !urls[f.ruta]).map(f => f.ruta)
    if (!faltan.length) return
    supabase.storage.from('ergonomia').createSignedUrls(faltan, 3600).then(({ data }) => {
      if (data) setUrls(u => ({ ...u, ...Object.fromEntries(data.filter(x => x.signedUrl).map(x => [x.path, x.signedUrl])) }))
    })
  }, [c])

  // Guardado automático (y copia en el teléfono)
  const cambiar = (fn) => {
    setC(prev => {
      const nuevo = structuredClone(prev); fn(nuevo); nuevo.t = Date.now()
      try { localStorage.setItem('ergo-borrador-' + id, JSON.stringify(nuevo)) } catch {}
      clearTimeout(timer.current); setEstadoGuardado('guardando')
      timer.current = setTimeout(() => guardarNube(nuevo), 1200)
      return nuevo
    })
  }
  const guardarNube = async (ck) => {
    if (!id) return
    const { error } = await supabase.from('erg_estudios').update({
      datos: { checklist: ck }, fecha: ck.datos.fecha, puesto: ck.datos.puesto || '(nuevo estudio)',
      sector: ck.datos.sector || null, n_trabajadores: ck.datos.trab || null,
      poblacion: ck.datos.pob ? ck.datos.pob.toLowerCase() : null, tipo: ck.datos.tipo,
      updated_at: new Date().toISOString(),
    }).eq('id', id)
    setEstadoGuardado(error ? 'local' : 'ok')
  }

  if (!c || !id) return (
    <div className="flex items-center justify-center gap-2.5 py-20 text-slate"><Loader2 className="w-5 h-5 animate-spin" strokeWidth={2} /> Preparando el estudio...</div>
  )

  const t = c.tareas[tsel] || c.tareas[0]

  // ── fotos ──
  const comprimir = (file) => new Promise(res => {
    if (!file.type.startsWith('image/')) return res(file)
    const im = new Image()
    im.onload = () => { const m = 1600, s = Math.min(1, m / Math.max(im.width, im.height)); const cv = document.createElement('canvas'); cv.width = Math.round(im.width * s); cv.height = Math.round(im.height * s); cv.getContext('2d').drawImage(im, 0, 0, cv.width, cv.height); cv.toBlob(b => res(b || file), 'image/jpeg', 0.8) }
    im.onerror = () => res(file); im.src = URL.createObjectURL(file)
  })
  const subirFotos = async (files) => {
    const idx = tsel
    for (const f of files) {
      const esVideo = f.type.startsWith('video')
      if (esVideo && f.size > 45 * 1024 * 1024) { alert('El video supera 45 MB. Grabá uno más corto.'); continue }
      setSubiendo(n => n + 1)
      const blob = await comprimir(f)
      const ruta = `${id}/campo_${Date.now()}_${Math.random().toString(36).slice(2, 7)}.${esVideo ? (f.name.split('.').pop() || 'mp4') : 'jpg'}`
      const { error } = await supabase.storage.from('ergonomia').upload(ruta, blob, { contentType: esVideo ? f.type : 'image/jpeg' })
      setSubiendo(n => n - 1)
      if (error) { alert('No se pudo subir: ' + error.message); continue }
      if (!esVideo) setUrls(u => ({ ...u, [ruta]: URL.createObjectURL(blob) }))
      cambiar(n => n.tareas[idx].fotos.push({ ruta, tipo: esVideo ? 'video' : 'foto' }))
    }
  }

  // ── pendientes ──
  const pendientes = []
  if (!c.datos.puesto) pendientes.push('Datos: falta el puesto')
  c.tareas.forEach((x, i) => {
    if (!x.nombre) pendientes.push(`Tarea ${i + 1}: falta el nombre`)
    LETRAS_886.forEach(l => { const F = x.f[l]; if (!F.on) return; const n = nivelPreliminar(l, F)
      if (n.inc) pendientes.push(`Tarea ${i + 1} · ${FACT_886[l].n}: ${n.t.toLowerCase()}`)
      if (!F.exp) pendientes.push(`Tarea ${i + 1} · ${FACT_886[l].n}: falta la exposición`) })
  })
  const estadoTarea = (x) => !x.nombre ? 'Sin empezar' : LETRAS_886.some(l => x.f[l].on && (nivelPreliminar(l, x.f[l]).inc || !x.f[l].exp)) ? 'Incompleta' : 'Completa'

  // ── volcado final a las tablas ──
  const completar = async () => {
    if (pendientes.length && !confirm(`Faltan ${pendientes.length} datos. ¿Marcar igual el relevamiento como completo? Podés completarlos después.`)) return
    setCerrando(true)
    try {
      const o = c.org
      const descansos = Object.entries(o.descansos).filter(([, d]) => d.on).map(([n, d]) => `${n} ${d.h} (${d.m} min)`).join(' · ')
      await supabase.from('erg_estudios').update({
        estado: 'relevado', puesto: c.datos.puesto || '(sin puesto)', sector: c.datos.sector || null, fecha: c.datos.fecha,
        tipo: c.datos.tipo, poblacion: c.datos.pob ? c.datos.pob.toLowerCase() : null, n_trabajadores: c.datos.trab || null,
        jornada: [o.hd && `${o.hd} h por día`, o.ds && `${o.ds} días por semana`, o.hx && `horas extras: ${o.hx}${o.hxa ? ' (' + o.hxa + ')' : ''}`].filter(Boolean).join(' · ') || null,
        turnos: [...o.turnos.filter(x => x !== 'Otro'), o.turnos.includes('Otro') ? o.turnoOtro : null].filter(Boolean).join(', ') || null,
        descansos_formales: descansos || null,
        descansos_informales: o.infTipo === 'Otro' ? o.inf : (o.infTipo || null),
        datos: { checklist: c },
      }).eq('id', id)
      for (let i = 0; i < c.tareas.length; i++) {
        const x = c.tareas[i]
        const { data: tarea, error } = await supabase.from('erg_tareas').upsert({
          estudio_id: id, orden: i + 1, nombre: x.nombre || `Tarea ${i + 1}`, descripcion: x.so || null,
          datos: { duracion: x.dur, unidad: x.du, postura: x.postura, traslados: x.tras, observaciones: x.obs },
        }, { onConflict: 'estudio_id,orden' }).select('id').single()
        if (error) throw error
        const filas = LETRAS_886.map(l => {
          const F = x.f[l], n = nivelPreliminar(l, F)
          return { tarea_id: tarea.id, factor: l, presente: !!F.on,
            nivel: !F.on ? null : n.clave === '3' ? '3' : (n.clave === '1' || n.clave === 'tolerable') ? '1' : null,
            nivel_preliminar: F.on ? n.clave : null,
            exposicion_valor: F.on && F.exp !== '' ? Number(String(F.exp).replace(',', '.')) || null : null,
            exposicion_unidad: F.on ? F.u : null }
        })
        const { error: e2 } = await supabase.from('erg_factores').upsert(filas, { onConflict: 'tarea_id,factor' }); if (e2) throw e2
        const p2 = []
        LETRAS_886.forEach(l => { const F = x.f[l]; if (!F.on) return
          FACT_886[l].bloques.forEach((B, bi) => { const r = (F.r || [])[bi]; if (!r || !(r.p1 || []).some(v => v != null)) return
            const conv = (arr, n) => Array.from({ length: n }, (_, k) => arr[k] === 'S' ? true : arr[k] === 'N' ? false : null)
            p2.push({ tarea_id: tarea.id, planilla: codigoPlanilla(l, bi), paso1: conv(r.p1 || [], B.p1.length), paso2: conv(r.p2 || [], B.p2.length) }) }) })
        if (p2.length) { const { error: e3 } = await supabase.from('erg_planillas2').upsert(p2, { onConflict: 'tarea_id,planilla' }); if (e3) throw e3 }
        const nuevas = x.fotos.filter(f => !f.registrada)
        if (nuevas.length) {
          const { error: e4 } = await supabase.from('erg_fotos').insert(nuevas.map((f, k) => ({ estudio_id: id, tarea_id: tarea.id, ruta: f.ruta, tipo: f.tipo, en_informe: false, orden: k + 1 })))
          if (e4) throw e4
          x.fotos.forEach(f => { f.registrada = true })
        }
      }
      await supabase.from('erg_estudios').update({ datos: { checklist: c } }).eq('id', id)
      try { localStorage.removeItem('ergo-borrador-' + id) } catch {}
      alert('Relevamiento completo. Las Planillas 1 y 2 ya están en el estudio.')
      onCerrar()
    } catch (e) {
      alert('No se pudo completar: ' + (e.message || e) + '. Tus datos siguen guardados en el borrador.')
    }
    setCerrando(false)
  }

  // ── pantallas ──
  const P0 = () => (
    <Tarjeta titulo="Datos del estudio">
      <Campo label="Fecha" type="date" value={c.datos.fecha} onChange={v => cambiar(n => { n.datos.fecha = v })} />
      <div className="text-[13px] text-slate">{cliente.nombre} · {planta.nombre}</div>
      <Campo label="Sector" value={c.datos.sector} onChange={v => cambiar(n => { n.datos.sector = v })} />
      <Campo label="Puesto" value={c.datos.puesto} onChange={v => cambiar(n => { n.datos.puesto = v })} />
      <Campo label="N.º de trabajadores" inputMode="numeric" value={c.datos.trab} onChange={v => cambiar(n => { n.datos.trab = v })} />
      <div className="flex flex-col gap-1.5"><span className="text-[13px] font-medium text-slate">Población del puesto</span>
        <Chips opciones={['Masculina', 'Femenina', 'Mixta']} valor={c.datos.pob} onChange={v => cambiar(n => { n.datos.pob = v })} /></div>
      <div className="flex flex-col gap-1.5"><span className="text-[13px] font-medium text-slate">Tipo de estudio</span>
        <Chips opciones={['Puesto en funcionamiento', 'De concepción']} valor={c.datos.tipo === 'concepcion' ? 'De concepción' : 'Puesto en funcionamiento'}
          onChange={v => cambiar(n => { n.datos.tipo = v === 'De concepción' ? 'concepcion' : 'funcionamiento' })} /></div>
    </Tarjeta>
  )
  const P1 = () => { const o = c.org; return (<>
    <Tarjeta titulo="Turnos">
      <Chips multiple opciones={['Mañana', 'Tarde', 'Noche', 'Rotativo', 'Otro']} valor={o.turnos} onChange={v => cambiar(n => { n.org.turnos = v })} />
      {o.turnos.includes('Otro') && <Campo label="¿Cuál?" value={o.turnoOtro} onChange={v => cambiar(n => { n.org.turnoOtro = v })} />}
    </Tarjeta>
    <Tarjeta titulo="Jornada">
      <div className="grid grid-cols-2 gap-2">
        <Campo label="Horas por día" inputMode="decimal" value={o.hd} onChange={v => cambiar(n => { n.org.hd = v })} />
        <Campo label="Días por semana" inputMode="numeric" value={o.ds} onChange={v => cambiar(n => { n.org.ds = v })} />
      </div>
      <div className="flex flex-col gap-1.5"><span className="text-[13px] font-medium text-slate">Horas extras</span>
        <Chips opciones={['Sí', 'No', 'Eventuales']} valor={o.hx} onChange={v => cambiar(n => { n.org.hx = v })} /></div>
      <Campo label="Aclaración (opcional)" value={o.hxa} onChange={v => cambiar(n => { n.org.hxa = v })} />
    </Tarjeta>
    <Tarjeta titulo="Descansos">
      {Object.entries(o.descansos).map(([nom, d]) => (
        <div key={nom} className="grid grid-cols-[1fr_92px_100px] gap-2 items-center">
          <button type="button" aria-pressed={d.on} onClick={() => cambiar(n => { n.org.descansos[nom].on = !d.on })}
            className={`min-h-[40px] rounded-full border text-[14px] ${d.on ? 'border-2 border-accent bg-accent-light text-accent font-semibold' : 'border-hairline'}`}>{nom}</button>
          <select aria-label={`Horario de ${nom}`} disabled={!d.on} value={d.h} onChange={e => cambiar(n => { n.org.descansos[nom].h = e.target.value })} className="min-h-[40px] border border-hairline rounded-lg px-1 bg-surface disabled:opacity-40">{HORAS.map(h => <option key={h}>{h}</option>)}</select>
          <select aria-label={`Minutos de ${nom}`} disabled={!d.on} value={d.m} onChange={e => cambiar(n => { n.org.descansos[nom].m = e.target.value })} className="min-h-[40px] border border-hairline rounded-lg px-1 bg-surface disabled:opacity-40">{['10','15','20','30','45','60'].map(m => <option key={m} value={m}>{m} min</option>)}</select>
        </div>
      ))}
      <div className="flex flex-col gap-1.5"><span className="text-[13px] font-medium text-slate">Descansos informales</span>
        <Chips opciones={['Según necesidad', 'Con relevo', 'Otro']} valor={o.infTipo} onChange={v => cambiar(n => { n.org.infTipo = v })} /></div>
      {o.infTipo === 'Otro' && <Campo label="¿Cuál?" value={o.inf} onChange={v => cambiar(n => { n.org.inf = v })} />}
      <TextoObs label="Observaciones (opcional)" valor={o.obs} onChange={v => cambiar(n => { n.org.obs = v })} />
    </Tarjeta>
  </>) }
  const P2 = () => (<>
    <div className="flex gap-2 overflow-x-auto pb-1">
      {c.tareas.map((x, i) => (
        <button key={i} type="button" aria-current={i === tsel} onClick={() => { setTsel(i); window.scrollTo(0, 0) }}
          className={`flex-none text-left text-[12px] leading-tight rounded-lg border px-3 py-2 ${i === tsel ? 'border-2 border-accent bg-accent-light' : 'border-hairline bg-surface'}`}>
          <strong>{i + 1} · {x.nombre || 'Sin nombre'}</strong><br />{estadoTarea(x)}
        </button>
      ))}
      <button type="button" onClick={() => { cambiar(n => n.tareas.push(nuevaTarea())); setTsel(c.tareas.length) }} className="flex-none rounded-lg border border-hairline bg-surface px-3 text-[13px]">+ Tarea</button>
    </div>
    <Tarjeta titulo={`Tarea ${tsel + 1}`}>
      <Campo label="Nombre de la tarea" value={t.nombre} onChange={v => cambiar(n => { n.tareas[tsel].nombre = v })} />
      <TextoObs label="Sistema operativo (descripción)" valor={t.so} onChange={v => cambiar(n => { n.tareas[tsel].so = v })} />
      <div className="grid grid-cols-[1fr_112px] gap-2 items-end">
        <Campo label="Duración en la jornada" inputMode="decimal" value={t.dur} onChange={v => cambiar(n => { n.tareas[tsel].dur = v })} />
        <Unidad valor={t.du} onChange={v => cambiar(n => { n.tareas[tsel].du = v })} />
      </div>
    </Tarjeta>
    <Tarjeta titulo="Postura">
      <Chips opciones={['Bipedestación', 'Sedestación']} valor={t.postura} onChange={v => cambiar(n => { n.tareas[tsel].postura = v; n.tareas[tsel].tras = '' })} />
      {t.postura && <div className="pl-3 border-l-4 border-accent-light">
        <Chips opciones={t.postura === 'Bipedestación' ? ['Traslados frecuentes', 'Traslados infrecuentes', 'Traslados constantes', 'Sin traslados'] : ['Traslados frecuentes', 'Traslados infrecuentes']}
          valor={t.tras} onChange={v => cambiar(n => { n.tareas[tsel].tras = v })} /></div>}
      <label className="flex items-center justify-center gap-2 min-h-[44px] rounded-lg border-[1.5px] border-dashed border-accent text-accent font-semibold cursor-pointer">
        <Camera className="w-5 h-5" strokeWidth={1.8} /> Foto o video {subiendo > 0 && `(subiendo ${subiendo}…)`}
        <input type="file" accept="image/*,video/*" capture="environment" multiple className="sr-only" onChange={e => { subirFotos([...e.target.files]); e.target.value = '' }} />
      </label>
      {t.fotos.length > 0 && <div className="flex flex-wrap gap-2">
        {t.fotos.map(f => <div key={f.ruta} className="w-[84px] h-[64px] rounded-md overflow-hidden bg-slate-200 flex items-center justify-center text-[12px]">
          {f.tipo === 'video' ? '▶ video' : urls[f.ruta] ? <img src={urls[f.ruta]} alt="Foto de la tarea" className="w-full h-full object-cover" /> : '…'}</div>)}
      </div>}
      <p className="text-[12px] text-slate">Sacá de más: en la computadora se eligen las que van al informe.</p>
    </Tarjeta>
    <Tarjeta titulo="Factores presentes · Planillas 1 y 2">
      <p className="text-[12px] text-slate">Tocá cada factor para marcarlo y responder su Planilla 2. El nivel preliminar se calcula solo.</p>
      {LETRAS_886.map(l => {
        const F = t.f[l], D = FACT_886[l], niv = nivelPreliminar(l, F), clave = tsel + l, ab = abiertos[clave]
        const set = fn => cambiar(n => fn(n.tareas[tsel].f[l]))
        return (
          <div key={l} className="border border-hairline rounded-xl px-3 py-2 flex flex-col gap-2">
            <button type="button" aria-expanded={!!ab} onClick={() => setAbiertos(a => ({ ...a, [clave]: !ab }))} className="flex items-center gap-2 text-left">
              <span className={`w-7 h-7 flex-none rounded-md flex items-center justify-center font-bold text-[13px] ${F.on ? 'bg-accent text-white' : 'border border-hairline text-slate'}`}>{l}</span>
              <span className="flex-1 text-[14px]">{D.n}</span>
              <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${TONO[niv.tono]}`}>{niv.t}</span>
            </button>
            {ab && <>
              <Chips opciones={['Presente', 'No presente']} valor={F.on ? 'Presente' : 'No presente'} onChange={v => set(x => { x.on = v === 'Presente' })} />
              {F.on && <>
                <div className="grid grid-cols-[1fr_112px] gap-2 items-end">
                  <Campo label="Exposición tiempo/jornada" inputMode="decimal" value={F.exp} onChange={v => set(x => { x.exp = v })} />
                  <Unidad valor={F.u} onChange={v => set(x => { x.u = v })} />
                </div>
                {D.bloques.map((B, bi) => {
                  const R = (F.r || [])[bi] || { p1: [], p2: [] }
                  const resp = (paso, i, v) => set(x => { x.r = x.r || []; x.r[bi] = x.r[bi] || { p1: [], p2: [] }; x.r[bi][paso][i] = x.r[bi][paso][i] === v ? null : v })
                  const Preg = ({ i, txt, paso }) => (
                    <div className="grid grid-cols-[1fr_auto] gap-2 items-center text-[13px] leading-snug">
                      <span><strong>{i + 1}.</strong> {txt}</span>
                      <span className="flex gap-1">{['S', 'N'].map(v => (
                        <button key={v} type="button" aria-pressed={R[paso][i] === v} onClick={() => resp(paso, i, v)}
                          className={`min-w-[44px] min-h-[36px] rounded-lg border font-bold text-[13px] ${R[paso][i] === v ? 'bg-accent border-accent text-white' : 'border-hairline bg-surface'}`}>{v === 'S' ? 'SI' : 'NO'}</button>))}</span>
                    </div>)
                  return (
                    <div key={bi} className="flex flex-col gap-2">
                      <div className="text-[12px] font-bold text-ink">{B.titulo}</div>
                      <div className="text-[11px] font-bold uppercase tracking-wide text-slate">{B.paso1}</div>
                      {B.p1.map((q, i) => <Preg key={i} i={i} txt={q[0]} paso="p1" />)}
                      <p className="text-[11px] text-slate">{B.reglas1.join(' ')}</p>
                      {B.p1.some((_, i) => R.p1[i] === 'S') && <>
                        <div className="text-[11px] font-bold uppercase tracking-wide text-slate">{B.paso2}</div>
                        {B.p2.map((q, i) => <Preg key={i} i={i} txt={q} paso="p2" />)}
                        {B.reglas2.length > 0 && <p className="text-[11px] text-slate">{B.reglas2.join(' ')}</p>}
                      </>}
                    </div>)
                })}
              </>}
            </>}
          </div>)
      })}
      <TextoObs label="Observaciones de la tarea (opcional)" valor={t.obs} onChange={v => cambiar(n => { n.tareas[tsel].obs = v })} />
    </Tarjeta>
    {c.tareas.length > 1 && <button type="button" className="min-h-[44px] rounded-lg border border-hairline text-[14px]"
      onClick={() => { if (confirm('¿Quitar esta tarea del borrador?')) { cambiar(n => n.tareas.splice(tsel, 1)); setTsel(0) } }}>Quitar esta tarea</button>}
  </>)
  const P3 = () => (<>
    <Tarjeta titulo="Estado del relevamiento">
      {pendientes.length
        ? <div className="rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 text-[13px] leading-relaxed"><strong>Faltan {pendientes.length} datos.</strong><br />{pendientes.join(' · ')}</div>
        : <div className="rounded-lg bg-green-50 border border-green-200 px-3 py-2 text-[13px]">Planillas 1 y 2 completas. Te podés ir tranquila.</div>}
    </Tarjeta>
    <Tarjeta titulo="Planilla 1 · Identificación de factores de riesgo">
      <div className="overflow-x-auto"><table className="w-full text-[12px] border-collapse">
        <thead><tr><th className="border border-hairline p-1.5 text-left bg-slate-50">Factor de riesgo de la jornada habitual de trabajo</th>
          {c.tareas.map((x, i) => <th key={i} className="border border-hairline p-1.5 bg-slate-50">T{i + 1}</th>)}</tr></thead>
        <tbody>{LETRAS_886.map(l => <tr key={l}><td className="border border-hairline p-1.5">{l} · {FACT_886[l].n}</td>
          {c.tareas.map((x, i) => { const n = nivelPreliminar(l, x.f[l]); return <td key={i} className="border border-hairline p-1.5 text-center font-bold">{x.f[l].on ? `X · ${n.clave === 'tolerable' ? '1' : n.clave === 'evaluar' ? 'eval.' : n.clave === 'pendiente' ? 'pend.' : n.clave}` : ''}</td> })}</tr>)}</tbody>
      </table></div>
      <p className="text-[12px] text-slate">X = factor presente · nivel preliminar (eval. = requiere evaluación, pend. = pendiente).</p>
    </Tarjeta>
    <Tarjeta><TextoObs label="Observaciones finales (opcional)" valor={c.cierreObs} onChange={v => cambiar(n => { n.cierreObs = v })} /></Tarjeta>
    <button type="button" disabled={cerrando} onClick={completar}
      className="min-h-[48px] rounded-xl bg-accent text-white font-semibold text-[16px] disabled:opacity-50 inline-flex items-center justify-center gap-2">
      {cerrando ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" strokeWidth={2.2} />} Marcar relevamiento completo
    </button>
  </>)

  return (
    <div className="max-w-[640px] mx-auto p-3 md:p-6 pb-28 flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <button type="button" onClick={onCerrar} className="inline-flex items-center gap-1.5 text-[14px] text-accent font-semibold"><ArrowLeft className="w-4 h-4" /> Estudios</button>
        <span className="inline-flex items-center gap-1.5 text-[12px] text-slate">
          {estadoGuardado === 'local' ? <><CloudOff className="w-4 h-4" /> Sin conexión · guardado en el teléfono</> : estadoGuardado === 'guardando' ? <><Loader2 className="w-4 h-4 animate-spin" /> Guardando…</> : <><Cloud className="w-4 h-4" /> Guardado</>}
        </span>
      </div>
      <h2 className="text-[20px] font-bold text-ink">{c.datos.puesto || 'Nuevo estudio'}</h2>
      <nav className="grid grid-cols-4 gap-1.5" aria-label="Pasos del relevamiento">
        {PASOS.map((p, i) => <button key={p} type="button" aria-current={i === paso ? 'step' : undefined} onClick={() => { setPaso(i); window.scrollTo(0, 0) }}
          className={`min-h-[40px] rounded-lg text-[13px] font-semibold ${i === paso ? 'bg-accent text-white' : 'bg-surface border border-hairline text-slate'}`}>{i + 1} {p}</button>)}
      </nav>
      {[P0, P1, P2, P3][paso]()}
      <div className="fixed left-0 right-0 bottom-0 bg-surface border-t border-hairline px-3 py-2.5 flex gap-2 justify-center" style={{ paddingBottom: 'calc(10px + env(safe-area-inset-bottom, 0px))' }}>
        <button type="button" disabled={paso === 0} onClick={() => { setPaso(paso - 1); window.scrollTo(0, 0) }} className="flex-1 max-w-[300px] min-h-[46px] rounded-xl border border-hairline font-semibold disabled:opacity-40">‹ Anterior</button>
        <button type="button" disabled={paso === 3} onClick={() => { setPaso(paso + 1); window.scrollTo(0, 0) }} className="flex-1 max-w-[300px] min-h-[46px] rounded-xl bg-accent text-white font-semibold disabled:opacity-40">Siguiente ›</button>
      </div>
    </div>
  )
}
