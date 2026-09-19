'use client'

import { Fragment } from 'react'

const RESULTADO_TEXTO = {
  aprobado: 'Aprobado',
  observaciones: 'Aprobado con observaciones',
  rechazado: 'Rechazado / fuera de servicio',
}

const formatFecha = (f) => f
  ? new Date(f + 'T00:00:00').toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })
  : '—'

export default function ImprimirControl({ tema, cliente, control, respuestas, itemsCatalogo }) {
  // Agrupar respuestas por categoría, en el orden del catálogo
  const items = Object.values(itemsCatalogo)
    .filter(it => it.tema_id === tema.id)
    .sort((a, b) => a.orden - b.orden)

  const categorias = []
  items.forEach(it => {
    const cat = it.categoria || null
    if (!categorias.some(c => c.nombre === cat)) categorias.push({ nombre: cat, items: [] })
    categorias.find(c => c.nombre === cat).items.push(it)
  })

  const respuestaPorItem = {}
  respuestas.forEach(r => { respuestaPorItem[r.item_id] = r })

  // Ítems con foto adjunta, en el mismo orden del catálogo — van en una segunda página
  const fotosItems = items
    .map(it => ({ item: it, r: respuestaPorItem[it.id] }))
    .filter(x => x.r?.foto_url)

  // NOTA DE MAPEO: control.sector guarda el valor de "Subsector" (campo opcional nuevo)
  // y control.ubicacion guarda el valor de "Sector" (antes llamado Ubicación).
  const subsectorValor = control.sector
  const sectorValor = control.ubicacion
  const matriculaAuditor = control.datos_extra?.auditor_matricula
  const auditorTexto = control.auditor
    ? (matriculaAuditor ? `${control.auditor} — Mat. ${matriculaAuditor}` : control.auditor)
    : '—'

  return (
    <div className="printable-area hidden print:block" style={{ fontFamily: 'Arial, Helvetica, sans-serif', fontSize: '9.6px', lineHeight: 1.3, color: '#000' }}>
      <style>{`
        @page { size: A4; margin: 10mm 12mm; }
        .co-pdf table { width: 100%; border-collapse: collapse; }
        .co-pdf td, .co-pdf th { border: 0.75px solid #000; padding: 2.5px 6px; font-size: 9.4px; }
        .co-pdf .logo-td { width: 92px; text-align: center; padding: 6px 6px; }
        .co-pdf .logo-td img { height: 26px; }
        .co-pdf .title-td { text-align: center; padding: 6px 10px; }
        .co-pdf .title-main { font-size: 12.5px; font-weight: bold; text-transform: uppercase; letter-spacing: .4px; }
        .co-pdf .title-sub { font-size: 9.5px; text-transform: uppercase; letter-spacing: .4px; color: #333; margin-top: 2px; }
        .co-pdf .field-label { background: #C9C9C9; font-size: 9px; font-weight: bold; text-transform: uppercase; letter-spacing: .2px; padding: 2.5px 6px; }
        .co-pdf .field-value { font-size: 10px; padding: 3.5px 6px; font-weight: bold; }
        .co-pdf .section-bar { background: #111; color: #fff; font-size: 9.5px; font-weight: bold; text-transform: uppercase; letter-spacing: .4px; padding: 3.5px 8px; margin-top: 7px; }
        .co-pdf .items-table th { background: #262626; color: #fff; font-size: 9.4px; text-transform: uppercase; padding: 3px 6px; text-align: left; font-weight: bold; }
        .co-pdf .items-table td { font-size: 9.4px; padding: 2.5px 6px; text-align: left; }
        .co-pdf .desc-cell { text-align: left; }
        .co-pdf .n-col { width: 20px; text-align: center; }
        .co-pdf .chk { width: 28px; text-align: center; font-weight: bold; }
        .co-pdf .categoria-row td { background: #DCDCDC; font-weight: bold; font-size: 9px; text-transform: uppercase; letter-spacing: .3px; padding: 3px 6px; text-align: left; }
        .co-pdf .obs-cell { font-size: 8.8px; padding: 3px 6px; background: #F5F5F5; font-style: italic; text-align: left; }
        .co-pdf .resultado-titulo { font-size: 9px; font-weight: bold; text-transform: uppercase; letter-spacing: .3px; margin-bottom: 6px; }
        .co-pdf .resultado-opciones { display: flex; flex-direction: column; gap: 6px; }
        .co-pdf .resultado-opciones span { display: flex; align-items: center; gap: 6px; font-size: 9.6px; font-weight: bold; }
        .co-pdf .sello-box { display: inline-flex; align-items: center; justify-content: center; width: 12px; height: 12px; border: 1.5px solid #000; flex-shrink: 0; font-size: 9px; line-height: 1; }
        .co-pdf .firma-espacio { text-align: center; padding: 4px 10px; }
        .co-pdf .firma-linea { border-bottom: 1px solid #000; height: 30px; }
        .co-pdf .firma-rol { font-size: 8.5px; font-weight: bold; text-transform: uppercase; letter-spacing: .3px; margin-top: 4px; }
        .co-pdf .firma-nombre { font-size: 9px; color: #333; margin-top: 2px; }
        .co-pdf .foto-grid { display: grid; grid-template-columns: 1fr 1fr; grid-template-rows: repeat(5, 1fr); gap: 8px; margin-top: 10px; height: 245mm; }
        .co-pdf .foto-celda { display: flex; flex-direction: column; border: 1px solid #999; border-radius: 2px; overflow: hidden; }
        .co-pdf .foto-img-wrap { position: relative; flex: 1; min-height: 0; background: #EEE; }
        .co-pdf .foto-img { width: 100%; height: 100%; object-fit: cover; display: block; }
        .co-pdf .foto-num { position: absolute; top: 4px; left: 4px; background: rgba(0,0,0,.72); color: #fff; font-size: 9px; font-weight: bold; width: 18px; height: 18px; border-radius: 50%; display: flex; align-items: center; justify-content: center; }
        .co-pdf .foto-caption { font-size: 8px; color: #333; padding: 3px 6px; text-align: left; border-top: 1px solid #ccc; background: #F7F7F7; line-height: 1.25; }
        .co-pdf .correccion-label { font-weight: bold; background: #EDEDED; width: 30%; font-size: 8.5px; text-transform: uppercase; letter-spacing: .2px; }
        .co-pdf .pie { text-align: center; font-size: 8px; color: #888; margin-top: 10px; padding-top: 6px; border-top: 1px solid #ddd; }
      `}</style>

      <div className="co-pdf">
        {/* Encabezado con logo Devé */}
        <table>
          <tbody>
            <tr>
              <td className="logo-td"><img src="/logo-deve.png" alt="Devé" /></td>
              <td className="title-td">
                <div className="title-main">{tema.nombre}</div>
                <div className="title-sub">Control Operativo — Higiene y Seguridad Laboral</div>
              </td>
            </tr>
          </tbody>
        </table>

        {/* Datos generales — Subsector (opcional) y Sector reemplazan a Sector/Ubicación */}
        <table style={{ marginTop: -1 }}>
          <tbody>
            <tr>
              <td className="field-label" style={{ width: '25%' }}>Empresa / Cliente</td>
              <td className="field-label" style={{ width: '25%' }}>Fecha</td>
              <td className="field-label" style={{ width: '25%' }}>Responsable</td>
              <td className="field-label" style={{ width: '25%' }}>Auditor</td>
            </tr>
            <tr>
              <td className="field-value">{cliente.nombre}</td>
              <td className="field-value">{formatFecha(control.fecha)}</td>
              <td className="field-value">{control.responsable}</td>
              <td className="field-value">{auditorTexto}</td>
            </tr>
            <tr>
              <td className="field-label">Subsector (opcional)</td>
              <td className="field-label" colSpan={3}>Sector</td>
            </tr>
            <tr>
              <td className="field-value">{subsectorValor || '—'}</td>
              <td className="field-value" colSpan={3}>{sectorValor || '—'}</td>
            </tr>
          </tbody>
        </table>

        {/* Ítems por categoría */}
        <div className="section-bar">Ítems de verificación</div>
        <table className="items-table" style={{ marginTop: -1 }}>
          <thead>
            <tr>
              <th className="n-col">N°</th>
              <th className="desc-cell">Descripción</th>
              <th className="chk">Sí</th>
              <th className="chk">No</th>
              <th className="chk">N/A</th>
            </tr>
          </thead>
          <tbody>
            {categorias.map((cat, ci) => (
              <Fragment key={`grupo-${ci}`}>
                {cat.nombre && (
                  <tr className="categoria-row">
                    <td colSpan={5}>{cat.nombre}</td>
                  </tr>
                )}
                {cat.items.map((it, i) => {
                  const r = respuestaPorItem[it.id]
                  return (
                    <Fragment key={it.id}>
                      <tr>
                        <td className="n-col">{i + 1}</td>
                        <td className="desc-cell">{it.texto}</td>
                        <td className="chk">{r?.respuesta === 'SI' ? 'X' : ''}</td>
                        <td className="chk">{r?.respuesta === 'NO' ? 'X' : ''}</td>
                        <td className="chk">{r?.respuesta === 'N/A' ? 'X' : ''}</td>
                      </tr>
                      {r?.observacion && (
                        <tr>
                          <td colSpan={5} className="obs-cell">Obs.: {r.observacion}</td>
                        </tr>
                      )}
                    </Fragment>
                  )
                })}
              </Fragment>
            ))}
          </tbody>
        </table>

        {/* Resultado */}
        <div className="section-bar">Cierre del control</div>
        <table style={{ marginTop: -1 }}>
          <tbody>
            <tr>
              <td style={{ padding: '7px 8px', width: '60%', verticalAlign: 'top' }}>
                <div className="resultado-titulo">Resultado general</div>
                <div className="resultado-opciones">
                  {['aprobado', 'observaciones', 'rechazado'].map(v => {
                    const marcado = control.resultado === v
                    return (
                      <span key={v}>
                        <span className="sello-box">{marcado ? 'X' : ''}</span>
                        {RESULTADO_TEXTO[v]}
                      </span>
                    )
                  })}
                </div>
              </td>
              <td style={{ padding: '7px 8px', width: '40%', verticalAlign: 'top' }}>
                <div className="firma-espacio">
                  <div className="firma-linea" />
                  <div className="firma-rol">Firma del auditor</div>
                  {auditorTexto !== '—' && <div className="firma-nombre">{auditorTexto}</div>}
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        {(control.observaciones_generales || control.plazo_correccion) && (
          <table style={{ marginTop: -1 }}>
            <tbody>
              {control.observaciones_generales && (
                <tr>
                  <td className="correccion-label">Observaciones generales</td>
                  <td style={{ fontSize: 9.4, textAlign: 'left' }}>{control.observaciones_generales}</td>
                </tr>
              )}
              {control.plazo_correccion && (
                <>
                  <tr>
                    <td className="correccion-label">Plazo para corrección</td>
                    <td style={{ fontSize: 9.4, textAlign: 'left' }}>{formatFecha(control.plazo_correccion)}</td>
                  </tr>
                  <tr>
                    <td className="correccion-label">Responsable de la corrección</td>
                    <td style={{ fontSize: 9.4, textAlign: 'left' }}>{control.responsable_correccion || '—'}</td>
                  </tr>
                </>
              )}
            </tbody>
          </table>
        )}

        {fotosItems.length > 0 && (() => {
          const porHoja = 10 // cuadrante 2 columnas x 5 filas
          const hojas = []
          for (let i = 0; i < fotosItems.length; i += porHoja) hojas.push(fotosItems.slice(i, i + porHoja))

          return hojas.map((hoja, hojaIdx) => (
            <div key={hojaIdx} style={{ pageBreakBefore: 'always', breakBefore: 'page' }}>
              <table>
                <tbody>
                  <tr>
                    <td className="logo-td"><img src="/logo-deve.png" alt="Devé" /></td>
                    <td className="title-td">
                      <div className="title-main">{tema.nombre}</div>
                      <div className="title-sub">
                        Registro fotográfico de desvíos{hojas.length > 1 ? ` — Hoja ${hojaIdx + 1} de ${hojas.length}` : ''}
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>

              <div className="foto-grid">
                {hoja.map(({ item, r }, i) => {
                  const numeroGlobal = hojaIdx * porHoja + i + 1
                  return (
                    <div key={item.id} className="foto-celda">
                      <div className="foto-img-wrap">
                        <img src={r.foto_url} alt="" className="foto-img" data-print-img="1" />
                        <span className="foto-num">{numeroGlobal}</span>
                      </div>
                      <p className="foto-caption">
                        Desvío {numeroGlobal}{r.foto_epigrafe ? ` - ${r.foto_epigrafe}` : ''}
                      </p>
                    </div>
                  )
                })}
              </div>
            </div>
          ))
        })()}

        <div className="pie">Devé — Sistema de Gestión HSO · app.deve.ar</div>
      </div>
    </div>
  )
}
