import fs from 'fs';
import path from 'path';
import { Solicitud3D, EstadoSolicitud } from '@/types';

// Configuración de GitHub desde variables de entorno
const GITHUB_TOKEN = process.env.GITHUB_TOKEN || '';
const GITHUB_OWNER = process.env.GITHUB_REPO_OWNER || 'crissgabriela';
const GITHUB_REPO = process.env.GITHUB_REPO_NAME || 'Makerbox';
const GITHUB_BRANCH = process.env.GITHUB_BRANCH || 'main';

// Rutas locales de persistencia
const STORAGE_DIR = path.join(process.cwd(), 'storage');
const DB_FILE = path.join(STORAGE_DIR, 'database.json');
const UPLOADS_DIR = path.join(STORAGE_DIR, 'uploads');

// Semilla inicial si la base de datos no existe aún
const INITIAL_DEMO_DATA: Solicitud3D[] = [
  {
    id: 'MBX-2026-A101',
    createdAt: new Date(Date.now() - 3600000 * 24 * 2).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 24 * 2).toISOString(),
    nombre: 'Camila Morales',
    correo: 'camila.morales@alumnos.utalca.cl',
    telefono: '+56987654321',
    carrera: 'Ingeniería Civil Mecánica',
    tipoUsuario: 'Estudiante Pregrado',
    archivoNombre: 'engranaje_planetario_v2.stl',
    archivoTamanoMb: 4.2,
    archivoUrl: '/api/files/MBX-2026-A101',
    archivoFormato: 'stl',
    dimensionesMm: { x: 75.0, y: 75.0, z: 22.5 },
    material: 'PETG',
    color: 'Negro',
    relleno: '35% (Resistencia Media)',
    calidad: 'Estándar (0.20mm)',
    observaciones: 'Pieza para mecanismo de transmisión, requiere buena adherencia y tolerancias ajustadas.',
    estado: 'en_impresion',
    impresoraAsignada: 'Bambu Lab X1-Carbon #1',
    gramosEstimados: 54,
    tiempoEstimadoHoras: 3.5,
    notasStaff: 'Imprimiendo con 4 paredes para resistencia mecánica.'
  },
  {
    id: 'MBX-2026-B202',
    createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    nombre: 'Prof. Carlos Sepúlveda',
    correo: 'csepulveda@utalca.cl',
    telefono: '+56991234567',
    carrera: 'Docente / Investigador(a) Facultad de Ingeniería',
    tipoUsuario: 'Docente / Investigador',
    archivoNombre: 'soporte_sensor_lidar.stl',
    archivoTamanoMb: 2.8,
    archivoUrl: '/api/files/MBX-2026-B202',
    archivoFormato: 'stl',
    dimensionesMm: { x: 110.0, y: 45.0, z: 35.0 },
    material: 'PLA',
    color: 'Blanco',
    relleno: '20% (Estándar)',
    calidad: 'Estándar (0.20mm)',
    observaciones: 'Prototipo para robot de navegación autónoma. No requiere soportes si se imprime en horizontal.',
    estado: 'aprobada',
    impresoraAsignada: 'Prusa MK4 #1',
    gramosEstimados: 38,
    tiempoEstimadoHoras: 2.2,
    notasStaff: 'Listo para lanzar a la cola de impresión.'
  },
  {
    id: 'MBX-2026-C303',
    createdAt: new Date(Date.now() - 3600000 * 1).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 1).toISOString(),
    nombre: 'Ignacio Valenzuela',
    correo: 'ignacio.valenzuela@alumnos.utalca.cl',
    telefono: '+56976543210',
    carrera: 'Proyecto de Título / Capstone',
    tipoUsuario: 'Proyecto de Título',
    archivoNombre: 'proteina_modelo_molecular.3mf',
    archivoTamanoMb: 8.5,
    archivoUrl: '/api/files/MBX-2026-C303',
    archivoFormato: '3mf',
    dimensionesMm: { x: 92.0, y: 88.0, z: 95.0 },
    material: 'Resina UV',
    color: 'Transparente',
    relleno: 'A criterio del equipo Makerbox',
    calidad: 'Detalle Fino (0.12mm)',
    observaciones: 'Modelo para defensa de título la próxima semana. Urgente.',
    estado: 'pendiente',
    notasStaff: 'Pendiente de calcular volumen en Photon Mono.'
  }
];

// Inicializar carpetas de almacenamiento local
function ensureStorage() {
  try {
    if (!fs.existsSync(STORAGE_DIR)) fs.mkdirSync(STORAGE_DIR, { recursive: true });
    if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });
    if (!fs.existsSync(DB_FILE)) {
      fs.writeFileSync(DB_FILE, JSON.stringify(INITIAL_DEMO_DATA, null, 2), 'utf-8');
    }
  } catch (err) {
    console.warn('Error inicializando carpetas locales:', err);
  }
}

// Helper para llamadas a GitHub REST API
async function callGitHubApi(endpoint: string, options: RequestInit = {}) {
  const url = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      Accept: 'application/vnd.github.v3+json',
      Authorization: `Bearer ${GITHUB_TOKEN}`,
      'Content-Type': 'application/json',
      ...options.headers
    }
  });
  return response;
}

/**
 * Carga las solicitudes persistidas en el archivo local
 */
function readLocalDb(): Solicitud3D[] {
  ensureStorage();
  try {
    if (fs.existsSync(DB_FILE)) {
      const content = fs.readFileSync(DB_FILE, 'utf-8');
      return JSON.parse(content) as Solicitud3D[];
    }
  } catch (err) {
    console.warn('Error leyendo base de datos local:', err);
  }
  return INITIAL_DEMO_DATA;
}

/**
 * Guarda las solicitudes en el archivo local
 */
function writeLocalDb(data: Solicitud3D[]) {
  ensureStorage();
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.warn('Error escribiendo base de datos local:', err);
  }
}

/**
 * Obtiene todas las solicitudes ordenadas por fecha reciente
 */
export async function getAllRequests(): Promise<Solicitud3D[]> {
  const localList = readLocalDb();

  if (!GITHUB_TOKEN) {
    return [...localList].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  try {
    const res = await callGitHubApi(`contents/storage/requests?ref=${GITHUB_BRANCH}`);
    if (!res.ok) {
      return localList;
    }

    const files: Array<{ name: string; download_url: string }> = await res.json();
    const jsonFiles = files.filter(f => f.name.endsWith('.json'));

    const ghRequests = await Promise.all(
      jsonFiles.map(async (f) => {
        const fileRes = await fetch(f.download_url);
        return (await fileRes.json()) as Solicitud3D;
      })
    );

    // Unificar evitando duplicados por ID
    const mergedMap = new Map<string, Solicitud3D>();
    localList.forEach(r => mergedMap.set(r.id, r));
    ghRequests.forEach(r => mergedMap.set(r.id, r));

    return Array.from(mergedMap.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  } catch (err) {
    console.error('Error leyendo solicitudes desde GitHub:', err);
    return localList;
  }
}

/**
 * Obtiene una solicitud específica por su ID
 */
export async function getRequestById(id: string): Promise<Solicitud3D | null> {
  const all = await getAllRequests();
  return all.find(r => r.id.toUpperCase() === id.toUpperCase()) || null;
}

/**
 * Guarda una nueva solicitud persistiendo tanto el archivo binario 3D como los metadatos
 */
export async function createRequest(
  solicitud: Solicitud3D,
  fileBuffer?: Buffer
): Promise<{ success: boolean; id: string; error?: string }> {
  ensureStorage();

  // Asegurar URL persistente de descarga
  solicitud.archivoUrl = `/api/files/${solicitud.id}`;

  // 1. Guardar el archivo binario en disco local si se proporcionó
  if (fileBuffer && fileBuffer.length > 0) {
    try {
      const itemUploadDir = path.join(UPLOADS_DIR, solicitud.id);
      if (!fs.existsSync(itemUploadDir)) fs.mkdirSync(itemUploadDir, { recursive: true });
      const filePath = path.join(itemUploadDir, solicitud.archivoNombre);
      fs.writeFileSync(filePath, fileBuffer);
    } catch (err) {
      console.error('Error guardando archivo físico 3D localmente:', err);
    }
  }

  // 2. Guardar en base de datos local
  const currentDb = readLocalDb();
  const updatedDb = [solicitud, ...currentDb.filter(r => r.id !== solicitud.id)];
  writeLocalDb(updatedDb);

  // 3. Si hay token de GitHub configurado, persistir en el repositorio
  if (GITHUB_TOKEN) {
    try {
      if (fileBuffer && fileBuffer.length > 0 && solicitud.archivoTamanoMb <= 25) {
        const modelPath = `storage/models/${solicitud.id}/${solicitud.archivoNombre}`;
        await callGitHubApi(`contents/${modelPath}`, {
          method: 'PUT',
          body: JSON.stringify({
            message: `MakerBox 3D: Subir modelo ${solicitud.archivoNombre} (${solicitud.id})`,
            content: fileBuffer.toString('base64'),
            branch: GITHUB_BRANCH
          })
        });
      }

      const jsonPath = `storage/requests/${solicitud.id}.json`;
      const jsonContentBase64 = Buffer.from(JSON.stringify(solicitud, null, 2)).toString('base64');
      await callGitHubApi(`contents/${jsonPath}`, {
        method: 'PUT',
        body: JSON.stringify({
          message: `MakerBox 3D: Crear solicitud ${solicitud.id} de ${solicitud.nombre}`,
          content: jsonContentBase64,
          branch: GITHUB_BRANCH
        })
      });
    } catch (err) {
      console.warn('Error sincronizando con GitHub API (guardado localmente):', err);
    }
  }

  return { success: true, id: solicitud.id };
}

/**
 * Actualiza el estado o notas técnicas de una solicitud
 */
export async function updateRequest(
  id: string,
  updates: Partial<Solicitud3D>
): Promise<{ success: boolean; error?: string }> {
  ensureStorage();

  const currentDb = readLocalDb();
  const index = currentDb.findIndex(r => r.id.toUpperCase() === id.toUpperCase());
  if (index >= 0) {
    currentDb[index] = {
      ...currentDb[index],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    writeLocalDb(currentDb);
  }

  if (!GITHUB_TOKEN) {
    return { success: true };
  }

  try {
    const jsonPath = `storage/requests/${id}.json`;
    const getRes = await callGitHubApi(`contents/${jsonPath}?ref=${GITHUB_BRANCH}`);
    if (!getRes.ok) return { success: true };

    const fileData = await getRes.json();
    const existingReq: Solicitud3D = JSON.parse(
      Buffer.from(fileData.content, 'base64').toString('utf-8')
    );

    const updatedReq: Solicitud3D = {
      ...existingReq,
      ...updates,
      updatedAt: new Date().toISOString()
    };

    const newContentBase64 = Buffer.from(JSON.stringify(updatedReq, null, 2)).toString('base64');
    await callGitHubApi(`contents/${jsonPath}`, {
      method: 'PUT',
      body: JSON.stringify({
        message: `MakerBox 3D: Actualizar solicitud ${id} a estado ${updatedReq.estado}`,
        content: newContentBase64,
        sha: fileData.sha,
        branch: GITHUB_BRANCH
      })
    });
  } catch (err) {
    console.warn('Error sincronizando actualización en GitHub:', err);
  }

  return { success: true };
}

/**
 * Recupera el archivo binario físico para descarga directa
 */
export async function getFileBuffer(id: string): Promise<{
  buffer: Buffer;
  filename: string;
  sizeBytes: number;
} | null> {
  const solicitud = await getRequestById(id);
  if (!solicitud) return null;

  // 1. Intentar leer desde el disco local
  const localFilePath = path.join(UPLOADS_DIR, solicitud.id, solicitud.archivoNombre);
  if (fs.existsSync(localFilePath)) {
    const buf = fs.readFileSync(localFilePath);
    return {
      buffer: buf,
      filename: solicitud.archivoNombre,
      sizeBytes: buf.length
    };
  }

  // 2. Si no está en disco local y tenemos GitHub Token, descargarlo de GitHub
  if (GITHUB_TOKEN) {
    try {
      const modelPath = `storage/models/${solicitud.id}/${solicitud.archivoNombre}`;
      const res = await callGitHubApi(`contents/${modelPath}?ref=${GITHUB_BRANCH}`);
      if (res.ok) {
        const data = await res.json();
        if (data.content) {
          const buf = Buffer.from(data.content, 'base64');
          return {
            buffer: buf,
            filename: solicitud.archivoNombre,
            sizeBytes: buf.length
          };
        }
      }
    } catch (err) {
      console.error('Error obteniendo archivo desde GitHub:', err);
    }
  }

  return null;
}
