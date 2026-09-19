// Genera un nombre de archivo prolijo para el PDF exportado, a partir de
// los datos del control. Los navegadores usan document.title como nombre
// sugerido al hacer "Guardar como PDF", así que este valor se asigna al
// título de la pestaña justo antes de imprimir.

function limpiar(s) {
  return (s || '')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // quita acentos
    .replace(/[^a-zA-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
}

export function nombreArchivoControl({ tema, cliente, equipoCodigo, fecha }) {
  const partes = [
    'Control',
    limpiar(tema),
    limpiar(cliente),
    equipoCodigo ? limpiar(equipoCodigo) : null,
    fecha || null,
  ].filter(Boolean)
  return partes.join('_')
}
