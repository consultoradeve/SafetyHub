// Planillas 1 y 2 · Res. SRT 886/15
// Textos y orden del formulario editable oficial, con la ortografía corregida.
// NO editar la redacción a mano.
// p1: [texto, 1 si la norma lo define como No tolerable] · p2nt: índices del Paso 2 No tolerables

export const FACT_886 = {
 "A": {
  "n": "Levantamiento y descenso",
  "p": "2A",
  "bloques": [
   {
    "titulo": "2.A: LEVANTAMIENTO Y/O DESCENSO MANUAL DE CARGA SIN TRANSPORTE",
    "paso1": "PASO1: Identificar si la tarea del puesto de trabajo implica:",
    "reglas1": [
     "Si todas las respuestas son NO, se considera que el riesgo es tolerable.",
     "Si alguna de las respuestas 1 a 3 es SI, continuar con el paso 2.",
     "Si la respuesta 3 es SI se considera que el riesgo de la tarea es No tolerable, debiendo solicitarse mejoras en tiempo prudencial."
    ],
    "p1": [
     [
      "Levantar y/o bajar manualmente cargas de peso superior a 2 kg y hasta 25 kg.",
      0
     ],
     [
      "Realizar diariamente y en forma cíclica operaciones de levantamiento / descenso con una frecuencia ≥ 1 por hora o ≤ 360 por hora (si se realiza de forma esporádica, consignar NO)",
      0
     ],
     [
      "Levantar y/o bajar manualmente cargas de peso superior a 25 kg.",
      1
     ]
    ],
    "paso2": "PASO 2: Determinación del Nivel de Riesgo",
    "reglas2": [
     "Si todas las respuestas son NO se presume que el riesgo es tolerable. Si alguna respuesta es SI, el empleador no puede presumir que el riesgo sea tolerable. Por lo tanto, se debe realizar con una Evaluación de Riesgos."
    ],
    "p2": [
     "El trabajador levanta, sostiene y deposita la carga sobrepasando con sus manos 30 cm. sobre la altura del hombro",
     "El trabajador levanta, sostiene y deposita la carga sobrepasando con sus manos una distancia horizontal mayor de 80 cm. desde el punto medio entre los tobillos.",
     "Entre la toma y el depósito de la carga, el trabajador gira o inclina la cintura más de 30º a uno u otro lado (o a ambos) considerados desde el plano sagital.",
     "Las cargas poseen formas irregulares, son difíciles de asir, se deforman o hay movimiento en su interior.",
     "El trabajador levanta, sostiene y deposita la carga con un solo brazo",
     "El trabajador presenta alguna manifestación temprana de las enfermedades mencionadas en el Artículo 1° de la presente Resolución."
    ],
    "p2nt": []
   }
  ]
 },
 "B": {
  "n": "Empuje / arrastre",
  "p": "2B",
  "bloques": [
   {
    "titulo": "2.B: EMPUJE Y ARRASTRE MANUAL DE CARGA",
    "paso1": "PASO 1: Identificar si en puesto de trabajo:",
    "reglas1": [
     "Si todas las respuestas son NO, se considera que el riesgo es tolerable.",
     "Si alguna de las respuestas 1 a 3 es SI, continuar con el paso 2.",
     "Si la respuesta 3 es SI debe considerarse que el riesgo de la tarea es No tolerable, debiendo solicitarse mejoras en tiempo prudencial."
    ],
    "p1": [
     [
      "Se realizan diariamente tareas cíclicas, con una frecuencia ≥ 1 movimiento por jornada (si son esporádicas, consignar NO).",
      0
     ],
     [
      "El trabajador se desplaza empujando y/o arrastrando manualmente un objeto recorriendo una distancia mayor a los 60 metros",
      0
     ],
     [
      "En el puesto de trabajo se empujan o arrastran cíclicamente objetos (bolsones, cajas, muebles, máquinas, etc.) cuyo esfuerzo medido con dinamómetro supera los 34 kgf.",
      1
     ]
    ],
    "paso2": "PASO 2: Determinación del Nivel de Riesgo.",
    "reglas2": [
     "Si todas las respuestas son NO se presume que el riesgo es tolerable. Si alguna respuesta es SI, el empleador no puede presumir que el riesgo sea tolerable. Por lo tanto, se debe realizar una Evaluación de Riesgos."
    ],
    "p2": [
     "Para empujar el objeto rodante se requiere un esfuerzo inicial medido con dinamómetro ≥ 12 kgf para hombres o 10 kgf para mujeres.",
     "Para arrastrar el objeto rodante se requiere un esfuerzo inicial medido con dinamómetro ≥ 10 kgf para hombres o mujeres",
     "El objeto rodante es empujado y/o arrastrado con dificultad (la superficie de deslizamiento es despareja, hay rampas que subir o bajar, hay roturas u obstáculos en el recorrido, ruedas en mal estado, mal diseño del asa, etc.)",
     "El objeto rodante no puede ser empujado y/o arrastrado con ambas manos, y en caso que lo permita, el apoyo de las manos se encuentra a una altura incómoda (por encima del pecho o por debajo de la cintura)",
     "En el movimiento de empujar y/o arrastrar, el esfuerzo inicial requerido se mantiene significativamente una vez puesto en movimiento el objeto (se produce atascamiento de las ruedas, tirones o falta de deslizamiento uniforme)",
     "El trabajador empuja o arrastra el objeto rodante asiéndolo con una sola mano.",
     "El trabajador presenta alguna manifestación temprana de las enfermedades mencionadas en el Artículo 1° de la presente Resolución."
    ],
    "p2nt": []
   }
  ]
 },
 "C": {
  "n": "Transporte",
  "p": "2C",
  "bloques": [
   {
    "titulo": "2.C: TRANSPORTE MANUAL DE CARGAS",
    "paso1": "PASO 1: Identificar si la tarea del puesto de trabajo implica:",
    "reglas1": [
     "Si todas las respuestas son NO, se considera que el riesgo es tolerable.",
     "Si alguna de las respuestas 1 a 5 es SI, continuar con el paso 2.",
     "Si la respuesta 5 es SI debe considerarse que el riesgo de la tarea es No tolerable, debiendo solicitarse mejoras en tiempo prudencial."
    ],
    "p1": [
     [
      "Transportar manualmente cargas de peso superior a 2 kg y hasta 25 kg.",
      0
     ],
     [
      "El trabajador se desplaza sosteniendo manualmente la carga recorriendo una distancia mayor a 1 metro",
      0
     ],
     [
      "Realizarla diariamente en forma cíclica (si es esporádica, consignar NO)",
      0
     ],
     [
      "Se transporta manualmente cargas a una distancia superior a 20 metros",
      0
     ],
     [
      "Se transporta manualmente cargas de peso superior a 25 kg.",
      1
     ]
    ],
    "paso2": "PASO 2: Determinación del Nivel de Riesgo",
    "reglas2": [
     "Si todas las respuestas son NO se presume que el riesgo es tolerable. Si alguna respuesta es SI, el empleador no puede presumir que el riesgo sea tolerable. Por lo tanto, se debe realizar una Evaluación de Riesgos."
    ],
    "p2": [
     "En condiciones habituales de levantamiento el trabajador transporta la carga entre 1 y 10 metros con una masa acumulada (el producto de la masa por la frecuencia) mayor que 10.000 kg durante la jornada habitual",
     "En condiciones habituales de levantamiento el trabajador transporta la carga entre 10 y 20 metros con una masa acumulada (el producto de la masa por la frecuencia) mayor que 6.000 kg durante la jornada habitual",
     "Las cargas poseen formas irregulares, son difíciles de asir, se deforman o hay movimiento en su interior.",
     "El trabajador presenta alguna manifestación temprana de las enfermedades mencionadas en el Artículo 1° de la presente Resolución."
    ],
    "p2nt": []
   }
  ]
 },
 "D": {
  "n": "Bipedestación",
  "p": "2D",
  "bloques": [
   {
    "titulo": "2.D: BIPEDESTACIÓN",
    "paso1": "PASO 1: Identificar si la tarea del puesto de trabajo implica:",
    "reglas1": [
     "Si la respuesta es NO, se considera que el riesgo es tolerable.",
     "Si la respuesta en sí continuar con paso 2"
    ],
    "p1": [
     [
      "El puesto de trabajo se desarrolla en posición de pie, sin posibilidad de sentarse, durante 2 horas seguidas o más.",
      0
     ]
    ],
    "paso2": "PASO 2: Determinación del Nivel de Riesgo",
    "reglas2": [
     "Si todas las respuestas son NO se presume que el riesgo es tolerable. Si alguna respuesta es SI, el empleador no puede presumir que el riesgo sea tolerable. Por lo tanto, se debe realizar una Evaluación de Riesgos."
    ],
    "p2": [
     "En el puesto se realizan tareas donde se permanece de pie durante 3 horas seguidas o más, sin posibilidades de sentarse con escasa deambulación (caminando no más de 100 metros/hora).",
     "En el puesto se realizan tareas donde se permanece de pie durante 2 horas seguidas o más, sin posibilidades de sentarse ni desplazarse o con escasa deambulación, levantando y/o transportando cargas > 2 kg.",
     "Trabajos efectuados con bipedestación prolongada en ambientes donde la temperatura y la humedad del aire sobrepasan los límites legalmente admisibles y que demandan actividad física.",
     "El trabajador presenta alguna manifestación temprana de las enfermedades mencionadas en el Artículo 1° de la presente Resolución."
    ],
    "p2nt": []
   }
  ]
 },
 "E": {
  "n": "Movimientos repetitivos",
  "p": "2E",
  "bloques": [
   {
    "titulo": "2.E: MOVIMIENTOS REPETITIVOS DE MIEMBROS SUPERIORES",
    "paso1": "PASO 1: Identificar si el puesto de trabajo implica:",
    "reglas1": [
     "Si la respuesta es NO, se considera que el riesgo es tolerable.",
     "Si la respuesta es SI, continuar con el paso 2."
    ],
    "p1": [
     [
      "Realizar diariamente, una o más tareas donde se utilizan las extremidades superiores, durante 4 o más horas en la jornada habitual de trabajo en forma cíclica (en forma continuada o alternada).",
      0
     ]
    ],
    "paso2": "PASO 2: Determinación del Nivel de Riesgo.",
    "reglas2": [
     "Si todas las respuestas son NO se presume que el riesgo es tolerable. Si alguna respuesta es SI, el empleador no puede presumir que el riesgo sea tolerable. Por lo tanto, se debe realizar una Evaluación de Riesgos. Si la respuesta 3 es SI, se deben implementar mejoras en forma prudencial."
    ],
    "p2": [
     "Las extremidades superiores están activas por más del 40% del tiempo total del ciclo de trabajo.",
     "En el ciclo de trabajo se realiza un esfuerzo superior a moderado a 3 según la Escala de Borg, durante más de 6 segundos y más de una vez por minuto.",
     "Se realiza un esfuerzo superior a 7 según la escala de Borg.",
     "El trabajador presenta alguna manifestación temprana de las enfermedades mencionadas en el Artículo 1° de la presente Resolución."
    ],
    "p2nt": [
     2
    ]
   }
  ]
 },
 "F": {
  "n": "Postura forzada",
  "p": "2F",
  "bloques": [
   {
    "titulo": "2.F: POSTURAS FORZADAS",
    "paso1": "PASO 1: Identificar si la tarea del puesto de trabajo implica:",
    "reglas1": [
     "Si todas las respuestas son NO, se considera que el riesgo es tolerable.",
     "Si la respuesta es SI, continuar con el paso 2."
    ],
    "p1": [
     [
      "Adoptar posturas forzadas en forma habitual durante la jornada de trabajo, con o sin aplicación de fuerza. (No se deben considerar si las posturas son ocasionales)",
      0
     ]
    ],
    "paso2": "PASO 2: Determinación del Nivel de Riesgo",
    "reglas2": [
     "Si todas las respuestas son NO se presume que el riesgo es tolerable. Si alguna respuesta es SI, el empleador no puede presumir que el riesgo sea tolerable. Por lo tanto, se debe realizar una Evaluación de Riesgos."
    ],
    "p2": [
     "Cuello en extensión, flexión, lateralización y/o rotación",
     "Brazos por encima de los hombros o con movimientos de supinación, pronación o rotación.",
     "Muñecas y manos en flexión, extensión, desviación cubital o radial.",
     "Cintura en flexión, extensión, lateralización y/o rotación.",
     "Miembros inferiores: trabajo en posición de rodillas o en cuclillas.",
     "El trabajador presenta alguna manifestación temprana de las enfermedades mencionadas en el Artículo 1° de la presente Resolución."
    ],
    "p2nt": []
   }
  ]
 },
 "G": {
  "n": "Vibraciones",
  "p": "2G",
  "bloques": [
   {
    "titulo": "2.-G VIBRACIONES MANO - BRAZO (entre 5 y 1500Hz)",
    "paso1": "PASO 1: Identificar si la tarea del puesto de trabajo implica de forma habitual:",
    "reglas1": [
     "Si todas las respuestas son NO, se considera que el riesgo es tolerable.",
     "Si alguna de las respuestas es SI, continuar con el paso 2."
    ],
    "p1": [
     [
      "Trabajar con herramientas que producen vibraciones (martillo neumático, perforadora, destornilladores, pulidoras, esmeriladoras, otros)",
      0
     ],
     [
      "Sujetar piezas con las manos mientras estas son mecanizadas",
      0
     ],
     [
      "Sujetar palancas, volantes, etc. que transmiten vibraciones",
      0
     ]
    ],
    "paso2": "Paso 2: Determinación del Nivel de Riesgo",
    "reglas2": [
     "Si todas las respuestas son NO se presume que el riesgo es tolerable. Si alguna de las respuestas es SI, el empleador no puede presumir que el riesgo sea tolerable. Por lo tanto, se debe realizar una evaluación de riesgos."
    ],
    "p2": [
     "El valor de las vibraciones supera los límites establecidos en la Tabla I, de la parte correspondiente a Vibración (segmental) mano-brazo, del Anexo V, Resolución MTEySS N° 295/03.",
     "El trabajador presenta alguna manifestación temprana de las enfermedades mencionadas en el Artículo 1° de la presente Resolución."
    ],
    "p2nt": []
   },
   {
    "titulo": "2.-G VIBRACIONES CUERPO ENTERO (Entre 1 y 80 Hz)",
    "paso1": "PASO 1: Identificar si la tarea del puesto de trabajo implica de forma habitual:",
    "reglas1": [
     "Si todas las respuestas son NO, se considera que el riesgo es tolerable.",
     "Si alguna de las respuestas es SI, continuar con el paso 2."
    ],
    "p1": [
     [
      "Conducir vehículos industriales, camiones, máquinas agrícolas, transporte público y otros.",
      0
     ],
     [
      "Trabajar próximo a maquinarias generadoras de impacto.",
      0
     ]
    ],
    "paso2": "Paso 2: Determinación del Nivel de Riesgo",
    "reglas2": [
     "Si todas las respuestas son NO se presume que el riesgo es tolerable. Si alguna de las respuestas es SI, el empleador no puede presumir que el riesgo sea tolerable. Por lo tanto, se debe realizar una evaluación de riesgos."
    ],
    "p2": [
     "El valor de las vibraciones supera los límites establecidos en la parte correspondiente a Vibración Cuerpo Entero, del Anexo V, Resolución MTEySS N° 295/03.",
     "El trabajador presenta alguna manifestación temprana de las enfermedades mencionadas en el Artículo 1° de la presente Resolución."
    ],
    "p2nt": []
   }
  ]
 },
 "H": {
  "n": "Confort térmico",
  "p": "2H",
  "bloques": [
   {
    "titulo": "2.-H CONFORT TÉRMICO",
    "paso1": "PASO 1: Identificar si la tarea del puesto de trabajo implica:",
    "reglas1": [
     "Si la respuesta es NO, se considera que el riesgo es tolerable.",
     "Si la respuesta es SI, continuar con el paso 2."
    ],
    "p1": [
     [
      "En el puesto de trabajo se perciben temperaturas no confortables para la realización de las tareas",
      0
     ]
    ],
    "paso2": "PASO 2: Determinación del Nivel de Riesgo.",
    "reglas2": [
     "Si la respuesta es NO se presume que el riesgo es tolerable."
    ],
    "p2": [
     "El resultado del uso de la Curva de Confort de Fanger, se encuentra por fuera de la zona de confort."
    ],
    "p2nt": []
   }
  ]
 },
 "I": {
  "n": "Estrés de contacto",
  "p": "2I",
  "bloques": [
   {
    "titulo": "2.-I ESTRÉS DE CONTACTO",
    "paso1": "PASO 1: Identificar si la tarea del puesto de trabajo implica de forma habitual:",
    "reglas1": [
     "Si la respuesta es NO, se considera que el riesgo es tolerable.",
     "Si la respuesta es SI, continuar con el paso 2."
    ],
    "p1": [
     [
      "Mantener apoyada alguna parte del cuerpo ejerciendo una presión, contra una herramienta, plano de trabajo, máquina herramienta o partes y materiales.",
      0
     ]
    ],
    "paso2": "PASO 2: Determinación del Nivel de Riesgo.",
    "reglas2": [
     "Si todas las respuestas son NO se presume que el riesgo es tolerable. Si alguna respuesta es SI, el empleador no puede presumir que el riesgo sea tolerable. Por lo tanto, se debe realizar una Evaluación de Riesgos."
    ],
    "p2": [
     "El trabajador mantiene apoyada la muñeca, antebrazo, axila o muslo u otro segmento corporal sobre una superficie aguda o con canto.",
     "El trabajador utiliza herramientas de mano o manipula piezas que presionan sobre sus dedos y/o palma de la mano hábil.",
     "El trabajador realiza movimientos de percusión sobre partes o herramientas",
     "El trabajador presenta alguna manifestación temprana de las enfermedades mencionadas en el Artículo 1° de la presente Resolución."
    ],
    "p2nt": []
   }
  ]
 }
};

export const LETRAS_886 = Object.keys(FACT_886)

// Código de cada bloque de la Planilla 2 (la 2G tiene dos: mano-brazo y cuerpo entero)
export const codigoPlanilla = (l, bi) => l === 'G' ? (bi === 0 ? '2G-MB' : '2G-CE') : '2' + l

function nivelBloque(B, r) {
  const r1 = B.p1.map((_, i) => r.p1[i]), r2 = B.p2.map((_, i) => r.p2[i])
  if (r1.some(x => x == null)) return 'inc1'
  if (r1.every(x => x === 'N')) return 'tol'
  const nt = B.p1.some((q, i) => q[1] && r1[i] === 'S') || (B.p2nt || []).some(i => r2[i] === 'S')
  if (r2.some(x => x == null)) return nt ? 'nt-inc2' : 'inc2'
  if (nt) return 'nt'
  return r2.every(x => x === 'N') ? 'n1' : 'eval'
}

// Nivel preliminar de campo de un factor
// clave: tolerable | 1 | 3 | evaluar | pendiente · inc = faltan respuestas
export function nivelPreliminar(l, f) {
  if (!f || !f.on) return { clave: null, t: 'No presente', tono: 'gris' }
  const bloques = FACT_886[l].bloques
  const ks = bloques.map((B, bi) => nivelBloque(B, (f.r || [])[bi] || { p1: [], p2: [] }))
  // Vibraciones: alcanza con responder el bloque que corresponda
  const usados = ks.length > 1
    ? ks.filter((k, bi) => !(k === 'inc1' && !(((f.r || [])[bi] || {}).p1 || []).some(x => x != null)))
    : ks
  const K = usados.length ? usados : ks
  if (K.includes('inc1')) return { clave: 'pendiente', t: 'Paso 1 incompleto', tono: 'ambar', inc: true }
  const nt = K.some(k => k.startsWith('nt')), inc2 = K.some(k => k.endsWith('inc2'))
  if (nt) return inc2 ? { clave: '3', t: 'Nivel 3 · falta Paso 2', tono: 'rojo', inc: true } : { clave: '3', t: 'Nivel 3 · no tolerable', tono: 'rojo' }
  if (inc2) return { clave: 'pendiente', t: 'Paso 2 pendiente', tono: 'ambar', inc: true }
  if (K.includes('eval')) return { clave: 'evaluar', t: 'Requiere evaluación', tono: 'ambar' }
  if (K.includes('n1')) return { clave: '1', t: 'Nivel 1 · tolerable', tono: 'verde' }
  return { clave: 'tolerable', t: 'Tolerable (Paso 1 sin "SI")', tono: 'verde' }
}
