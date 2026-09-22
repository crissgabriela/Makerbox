import * as XLSX from 'xlsx';
import { Solicitud3D, EstadoSolicitud } from '@/types';

const ESTADOS_MAP: Record<EstadoSolicitud, string> = {
  pendiente: 'Pendiente de Revisión',
  en_evaluacion: 'En Evaluación / Slicer',
  aprobada: 'Aprobada / En Cola',
  en_impresion: 'En Impresión 3D',
  lista_retiro: 'Lista para Retiro',
  entregada: 'Entregada al Usuario',
  rechazada: 'Rechazada / Ajuste Requerido'
};

export function generateExcelBuffer(solicitudes: Solicitud3D[]): Uint8Array {
  const rows = solicitudes.map((s) => ({
    'ID Solicitud': s.id,
    'Fecha de Registro': new Date(s.createdAt).toLocaleString('es-CL'),
    'Nombre Solicitante': s.nombre,
    'Correo Electrónico': s.correo,
    'Teléfono / WhatsApp': s.telefono,
    'Tipo de Usuario': s.tipoUsuario,
    'Carrera / Unidad': s.carrera,
    'Nombre Archivo 3D': s.archivoNombre,
    'Formato': s.archivoFormato.toUpperCase(),
    'Tamaño (MB)': s.archivoTamanoMb,
    'Dimensiones X×Y×Z (mm)': s.dimensionesMm
      ? `${s.dimensionesMm.x.toFixed(1)} × ${s.dimensionesMm.y.toFixed(1)} × ${s.dimensionesMm.z.toFixed(1)} mm`
      : 'No calculadas',
    'Material Solicitado': s.material,
    'Color Solicitado': s.color,
    'Relleno (Infill)': s.relleno,
    'Calidad de Capa': s.calidad,
    'Estado': ESTADOS_MAP[s.estado] || s.estado,
    'Impresora Asignada': s.impresoraAsignada || 'Sin asignar',
    'Gramos Estimados': s.gramosEstimados || 0,
    'Tiempo Impresión (Horas)': s.tiempoEstimadoHoras || 0,
    'Observaciones Usuario': s.observaciones || '',
    'Notas Técnicas Staff': s.notasStaff || ''
  }));

  const worksheet = XLSX.utils.json_to_sheet(rows);

  // Ajuste automático de ancho de columnas
  worksheet['!cols'] = [
    { wch: 15 }, // ID
    { wch: 19 }, // Fecha
    { wch: 24 }, // Nombre
    { wch: 28 }, // Correo
    { wch: 16 }, // Teléfono
    { wch: 22 }, // Tipo
    { wch: 28 }, // Carrera
    { wch: 26 }, // Archivo
    { wch: 10 }, // Formato
    { wch: 12 }, // Tamaño
    { wch: 24 }, // Dimensiones
    { wch: 14 }, // Material
    { wch: 14 }, // Color
    { wch: 14 }, // Relleno
    { wch: 20 }, // Calidad
    { wch: 22 }, // Estado
    { wch: 20 }, // Impresora
    { wch: 16 }, // Gramos
    { wch: 16 }, // Horas
    { wch: 35 }, // Observaciones
    { wch: 35 }  // Notas
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Solicitudes MakerBox');

  return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
}

/**
 * Función para descargar directamente desde el navegador
 */
export function downloadExcelInBrowser(solicitudes: Solicitud3D[], filename = 'makerbox_solicitudes_impresion3d.xlsx') {
  const buffer = generateExcelBuffer(solicitudes);
  const blob = new Blob([buffer as any], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
