export type EstadoSolicitud =
  | 'pendiente'
  | 'en_evaluacion'
  | 'aprobada'
  | 'en_impresion'
  | 'lista_retiro'
  | 'entregada'
  | 'rechazada';

export type Material3D = 'PLA' | 'PETG' | 'TPU' | 'Resina UV' | 'Otro';

export type TipoUsuario =
  | 'Estudiante Pregrado'
  | 'Estudiante Postgrado'
  | 'Docente / Investigador'
  | 'Proyecto de Título / Capstone'
  | 'Taller / Seminario Maker'
  | 'Externo';

export interface Solicitud3D {
  id: string; // Ej: MBX-2026-A8F2
  createdAt: string;
  updatedAt: string;
  
  // Datos solicitante
  nombre: string;
  correo: string;
  telefono: string;
  tipoUsuario: TipoUsuario;
  carrera: string;

  // Archivo 3D
  archivoNombre: string;
  archivoTamanoMb: number;
  archivoUrl: string; // URL en GitHub o data/local
  archivoFormato: 'stl' | 'obj' | '3mf' | 'otro';
  dimensionesMm?: {
    x: number;
    y: number;
    z: number;
  };

  // Parámetros solicitados
  material: Material3D;
  color: string;
  relleno: string; // '15%', '30%', '50%+', 'A criterio técnico'
  calidad: string; // 'Borrador (0.28mm)', 'Estándar (0.20mm)', 'Fino (0.12mm)'
  observaciones?: string;

  // Gestión interna MakerBox
  estado: EstadoSolicitud;
  impresoraAsignada?: string;
  gramosEstimados?: number;
  tiempoEstimadoHoras?: number;
  notasStaff?: string;
}

export interface StatsMakerbox {
  total: number;
  pendientes: number;
  enEvaluacion: number;
  aprobadas: number;
  enImpresion: number;
  listasRetiro: number;
  entregadas: number;
  rechazadas: number;
  totalGramos: number;
}
