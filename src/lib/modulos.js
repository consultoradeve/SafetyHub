import {
  CheckCircle2, HardHat, ClipboardList, TriangleAlert, ShieldCheck, Wrench,
  Gauge, PersonStanding, Flame, Scale
} from 'lucide-react'

// Lista única de módulos de SafetyHub.
// "activo: true" = el módulo ya está desarrollado. Solo esos se pueden
// habilitar en cada establecimiento (Administración → Clientes).
export const MODULOS = [
  { id: 'controles',    Icon: CheckCircle2,   label: 'Controles Operativos',         desc: 'Inspecciones por tipo de equipo con exportación PDF.',                                activo: true  },
  { id: 'contratistas', Icon: HardHat,        label: 'Control de Contratistas',      desc: 'Gestión documental de empresas contratistas y sus trabajadores.',                     activo: true  },
  { id: 'legal',        Icon: Scale,          label: 'Matriz de Cumplimiento Legal', desc: 'Requisitos legales por establecimiento con vencimientos y semáforo.',                  activo: true  },
  { id: 'mediciones',   Icon: Gauge,          label: 'Mediciones de Higiene',        desc: 'Iluminación, ruido y puesta a tierra en un solo módulo.',                             activo: false },
  { id: 'ergonomico',   Icon: PersonStanding, label: 'Estudio Ergonómico',           desc: 'Evaluación de puestos de trabajo y factores de riesgo ergonómico.',                   activo: false },
  { id: 'carga_fuego',  Icon: Flame,          label: 'Estudio de Carga de Fuego',    desc: 'Cálculo de carga de fuego por sector según normativa vigente.',                       activo: false },
  { id: 'accidentes',   Icon: ClipboardList,  label: 'Investigación de Accidentes',  desc: 'Registro e investigación de accidentes, lecciones aprendidas y análisis de brecha.',  activo: false },
  { id: 'riesgo',       Icon: TriangleAlert,  label: 'Matriz de Riesgo',             desc: 'Evaluación y priorización de riesgos por probabilidad e impacto.',                    activo: false },
  { id: 'epp',          Icon: ShieldCheck,    label: 'Gestión de EPP',               desc: 'Control de entrega y stock de equipos de protección personal.',                       activo: false },
  { id: 'acp',          Icon: Wrench,         label: 'Plan de Acciones Correctivas y Preventivas (ACP)', desc: 'Consolidador de acciones correctivas y preventivas de todos los módulos.', activo: false },
]

// Módulos que hoy se pueden habilitar en un establecimiento
export const MODULOS_OPERATIVOS = MODULOS.filter(m => m.activo)
