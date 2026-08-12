'use client'

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

  const datosFirma = control.datos_extra || {}

  return (
    <div className="printable-area hidden print:block" style={{ fontFamily: 'Arial, Helvetica, sans-serif', fontSize: '10.2px', lineHeight: 1.35, color: '#000' }}>
      <style>{`
        @page { size: A4; margin: 12mm 14mm; }
        .co-pdf table { width: 100%; border-collapse: collapse; }
        .co-pdf td, .co-pdf th { border: 0.75px solid #000; padding: 3px 7px; font-size: 10px; }
        .co-pdf .logo-td { width: 100px; text-align: center; padding: 8px 6px; }
        .co-pdf .logo-td img { height: 30px; }
        .co-pdf .title-td { text-align: center; padding: 8px 10px; }
        .co-pdf .title-main { font-size: 13px; font-weight: bold; text-transform: uppercase; letter-spacing: .4px; }
        .co-pdf .title-sub { font-size: 10px; text-transform: uppercase; letter-spacing: .4px; color: #333; margin-top: 2px; }
        .co-pdf .field-label { background: #C9C9C9; font-size: 9.5px; font-weight: bold; text-transform: uppercase; letter-spacing: .2px; padding: 3px 7px; }
        .co-pdf .field-value { font-size: 10.5px; padding: 4px 7px; font-weight: bold; }
        .co-pdf .section-bar { background: #111; color: #fff; font-size: 10px; font-weight: bold; text-transform: uppercase; letter-spacing: .4px; padding: 5px 8px; margin-top: 10px; }
        .co-pdf .items-table th { background: #262626; color: #fff; font-size: 10px; text-transform: uppercase; padding: 4px 6px; text-align: left; font-weight: bold; }
        .co-pdf .items-table td { font-size: 10.2px; padding: 4px 6px; }
        .co-pdf .n-col { width: 22px; text-align: center; }
        .co-pdf .chk { width: 32px; text-align: center; font-weight: bold; }
        .co-pdf .categoria-row td { background: #DCDCDC; font-weight: bold; font-size: 9.5px; text-transform: uppercase; letter-spacing: .3px; padding: 4px 6px; }
        .co-pdf .obs-cell { font-size: 9.5px; padding: 4px 7px; background: #F5F5F5; font-style: italic; }
        .co-pdf .resultado-titulo { font-size: 9.5px; font-weight: bold; text-transform: uppercase; letter-spacing: .3px; margin-bottom: 8px; }
        .co-pdf .resultado-opciones { display: flex; gap: 22px; flex-wrap: wrap; }
        .co-pdf .resultado-opciones span { display: flex; align-items: center; gap: 6px; font-size: 10.2px; font-weight: bold; }
        .co-pdf .sello-box { display: inline-block; width: 12px; height: 12px; border: 1.5px solid #000; flex-shrink: 0; }
        .co-pdf .sello-box.marcado { background: #111; }
        .co-pdf .correccion-label { font-weight: bold; background: #EDEDED; width: 30%; font-size: 9px; text-transform: uppercase; letter-spacing: .2px; }
        .co-pdf .firma-linea { border-bottom: 1px solid #000; height: 34px; }
        .co-pdf .firma-rol { font-size: 9.5px; font-weight: bold; text-transform: uppercase; letter-spacing: .3px; margin-top: 5px; }
        .co-pdf .firma-nombre { font-size: 10px; color: #333; margin-top: 3px; }
        .co-pdf .pie { text-align: center; font-size: 8.5px; color: #888; margin-top: 16px; padding-top: 8px; border-top: 1px solid #ddd; }
      `}</style>

      <div className="co-pdf">
        {/* Encabezado */}
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

        {/* Datos generales */}
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
              <td className="field-value">{control.auditor || '—'}</td>
            </tr>
            <tr>
              <td className="field-label">Sector</td>
              <td className="field-label" colSpan={3}>Ubicación</td>
            </tr>
            <tr>
              <td className="field-value">{control.sector || '—'}</td>
              <td className="field-value" colSpan={3}>{control.ubicacion || '—'}</td>
            </tr>
          </tbody>
        </table>

        {/* Ítems por categoría */}
        <div className="section-bar">Ítems de verificación</div>
        <table className="items-table" style={{ marginTop: -1 }}>
          <thead>
            <tr>
              <th className="n-col">N°</th>
              <th>Descripción</th>
              <th className="chk">Sí</th>
              <th className="chk">No</th>
              <th className="chk">N/A</th>
            </tr>
          </thead>
          <tbody>
            {categorias.map((cat, ci) => (
              <>
                {cat.nombre && (
                  <tr className="categoria-row" key={`cat-${ci}`}>
                    <td colSpan={5}>{cat.nombre}</td>
                  </tr>
                )}
                {cat.items.map((it, i) => {
                  const r = respuestaPorItem[it.id]
                  return (
                    <>
                      <tr key={it.id}>
                        <td className="n-col">{i + 1}</td>
                        <td>{it.texto}</td>
                        <td className="chk">{r?.respuesta === 'SI' ? 'X' : ''}</td>
                        <td className="chk">{r?.respuesta === 'NO' ? 'X' : ''}</td>
                        <td className="chk">{r?.respuesta === 'N/A' ? 'X' : ''}</td>
                      </tr>
                      {r?.observacion && (
                        <tr key={`${it.id}-obs`}>
                          <td colSpan={5} className="obs-cell">Obs.: {r.observacion}</td>
                        </tr>
                      )}
                    </>
                  )
                })}
              </>
            ))}
          </tbody>
        </table>

        {/* Resultado */}
        <div className="section-bar">Cierre del control</div>
        <table style={{ marginTop: -1 }}>
          <tbody>
            <tr>
              <td style={{ padding: '9px 10px' }}>
                <div className="resultado-titulo">Resultado general</div>
                <div className="resultado-opciones">
                  {['aprobado', 'observaciones', 'rechazado'].map(v => (
                    <span key={v}>
                      <span className={`sello-box ${control.resultado === v ? 'marcado' : ''}`} />
                      {RESULTADO_TEXTO[v]}
                    </span>
                  ))}
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
                  <td style={{ fontSize: 10 }}>{control.observaciones_generales}</td>
                </tr>
              )}
              {control.plazo_correccion && (
                <>
                  <tr>
                    <td className="correccion-label">Plazo para corrección</td>
                    <td style={{ fontSize: 10 }}>{formatFecha(control.plazo_correccion)}</td>
                  </tr>
                  <tr>
                    <td className="correccion-label">Responsable de la corrección</td>
                    <td style={{ fontSize: 10 }}>{control.responsable_correccion || '—'}</td>
                  </tr>
                </>
              )}
            </tbody>
          </table>
        )}

        {/* Firmas */}
        <table style={{ marginTop: 14, border: 'none' }}>
          <tbody>
            <tr>
              <td style={{ border: 'none', width: '50%', padding: '0 12px', textAlign: 'center' }}>
                <div className="firma-linea" />
                <div className="firma-rol">Operador / Usuario</div>
                <div className="firma-nombre">{datosFirma.firma_operador || '—'}</div>
              </td>
              <td style={{ border: 'none', width: '50%', padding: '0 12px', textAlign: 'center' }}>
                <div className="firma-linea" />
                <div className="firma-rol">Auditor / Inspector</div>
                <div className="firma-nombre">{datosFirma.firma_auditor || '—'}</div>
              </td>
            </tr>
          </tbody>
        </table>

        <div className="pie">Devé — Sistema de Gestión HSO · app.deve.ar</div>
      </div>
    </div>
  )
}
