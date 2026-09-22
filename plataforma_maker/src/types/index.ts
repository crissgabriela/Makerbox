export type EstadoSolicitud =
  | 'pendiente'
  | 'en_evaluacion'
  | 'aprobada'
  | 'en_impresion'
  | 'lista_retiro'
  | 'entregada'
  | 'rechazada';

export type Material3D = 'PLA' | 'PETG' | 'TPU' | 'Resina UV' | 'Otro';

export const CARRERAS_Y_UNIDADES = [
  // Carreras Facultad de Ingeniería UTalca
  'Ingeniería Civil Industrial',
  'Ingeniería Civil Mecánica',
  'Ingeniería Civil en Computación',
  'Ingeniería Civil Eléctrica',
  'Ingeniería Civil de Minas',
  'Ingeniería Civil Mecatrónica',
  'Ingeniería Civil en Bioinformática',
  'Ingeniería en Desarrollo de Videojuegos y Realidad Virtual',
  // Unidades Académicas y Estamentos
  'Postgrado (Magíster / Doctorado)',
  'Docente / Investigador(a) Facultad de Ingeniería',
  'Proyecto de Título / Capstone',
  'Equipo / Taller Makerbox',
  'Funcionario(a) / Administrativo(a) UTalca',
  'Otra Carrera / Unidad UTalca',
  'Externo / Vinculación con el Medio'
] as const;

export type CarreraOUnidad = typeof CARRERAS_Y_UNIDADES[number];

export interface Solicitud3D {
  id: string; // Ej: MBX-2026-A101
  createdAt: string;
  updatedAt: string;
  
  // Datos solicitante
  nombre: string;
  correo: string;
  telefono: string;
  carrera: CarreraOUnidad | string;
  tipoUsuario?: string; // Mantenido por retrocompatibilidad

  // Archivo 3D
  archivoNombre: string;
  archivoTamanoMb: number;
  archivoUrl: string; // URL accesible (/api/files/[id])
  archivoFormato: 'stl' | 'obj' | '3mf' | 'otro';
  dimensionesMm?: {
    x: number;
    y: number;
    z: number;
  };

  // Parámetros solicitados
  material: Material3D;
  color: string;
  relleno: string; // '15%', '20%', '35%', '60%+', 'A criterio técnico'
  calidad: string; // 'Borrador (0.28mm)', 'Estándar (0.20mm)', 'Fino (0.12mm)'
  observaciones?: string;

  // Gestión interna Equipo MakerBox
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
