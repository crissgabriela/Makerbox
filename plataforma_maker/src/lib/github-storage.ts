import fs from 'fs';
import path from 'path';
import os from 'os';
import { Solicitud3D, EstadoSolicitud } from '@/types';

// Configuración de GitHub desde variables de entorno
const GITHUB_TOKEN = process.env.GITHUB_TOKEN || '';
const GITHUB_OWNER = process.env.GITHUB_REPO_OWNER || 'crissgabriela';
const GITHUB_REPO = process.env.GITHUB_REPO_NAME || 'Makerbox';
const GITHUB_BRANCH = process.env.GITHUB_BRANCH || 'main';

// Directorio seguro de almacenamiento:
// En Vercel o entornos serverless el sistema de archivos principal es de sólo lectura (EROFS),
// por lo que se utiliza os.tmpdir() como buffer local.
function getStoragePaths() {
  const isServerless = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
  const baseDir = isServerless
    ? path.join(os.tmpdir(), 'makerbox_storage')
    : path.join(process.cwd(), 'storage');

  return {
    baseDir,
    dbFile: path.join(baseDir, 'database.json'),
    uploadsDir: path.join(baseDir, 'uploads')
  };
}

// Almacén en memoria persistente durante el ciclo de vida del proceso
let memoryStore: Solicitud3D[] = [
  {
    id: 'MBX-2026-A101',
    createdAt: new Date(Date.now() - 3600000 * 24 * 2).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 24 * 2).toISOString(),
    nombre: 'Camila Morales',
    correo: 'camila.morales@alumnos.utalca.cl',
    telefono: '+56987654321',
    carrera: 'Ingeniería Civil Mecánica',
    tipoUsuario: 'Ingeniería Civil Mecánica',
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
    tipoUsuario: 'Docente / Investigador(a) Facultad de Ingeniería',
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
    tipoUsuario: 'Proyecto de Título / Capstone',
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

// Cache en memoria para archivos binarios subidos recientemente
const fileMemoryCache = new Map<string, { buffer: Buffer; filename: string }>();

// Helper seguro para inicializar carpetas locales sin arrojar excepciones fatales
function safeEnsureStorage() {
  try {
    const { baseDir, uploadsDir, dbFile } = getStoragePaths();
    if (!fs.existsSync(baseDir)) fs.mkdirSync(baseDir, { recursive: true });
    if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
    if (!fs.existsSync(dbFile)) {
      fs.writeFileSync(dbFile, JSON.stringify(memoryStore, null, 2), 'utf-8');
    }
  } catch (err) {
    // Si falla el filesystem (ej. permisos estrictos), se continúa en memoria sin caerse
    console.warn('Almacenamiento en disco no disponible, operando en memoria:', (err as any)?.message);
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
 * Carga las solicitudes de la base de datos local o de memoria
 */
function readLocalDb(): Solicitud3D[] {
  safeEnsureStorage();
  try {
    const { dbFile } = getStoragePaths();
    if (fs.existsSync(dbFile)) {
      const content = fs.readFileSync(dbFile, 'utf-8');
      const parsed = JSON.parse(content) as Solicitud3D[];
      if (Array.isArray(parsed) && parsed.length > 0) {
        memoryStore = parsed;
        return parsed;
      }
    }
  } catch (err) {
    console.warn('Lectura de disco fallida, usando memoria:', (err as any)?.message);
  }
  return memoryStore;
}

/**
 * Guarda las solicitudes en la base de datos local y memoria
 */
function writeLocalDb(data: Solicitud3D[]) {
  memoryStore = data;
  safeEnsureStorage();
  try {
    const { dbFile } = getStoragePaths();
    fs.writeFileSync(dbFile, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.warn('Escritura en disco fallida, guardado en memoria:', (err as any)?.message);
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
    console.warn('Error sincronizando con GitHub API, devolviendo datos locales:', (err as any)?.message);
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
 * Guarda una nueva solicitud de manera ultra-resiliente
 */
export async function createRequest(
  solicitud: Solicitud3D,
  fileBuffer?: Buffer
): Promise<{ success: boolean; id: string; error?: string }> {
  // Asegurar URL persistente de descarga
  solicitud.archivoUrl = `/api/files/${solicitud.id}`;

  // 1. Guardar en cache de memoria siempre
  if (fileBuffer && fileBuffer.length > 0) {
    fileMemoryCache.set(solicitud.id, {
      buffer: fileBuffer,
      filename: solicitud.archivoNombre
    });

    // Intentar persistir en disco
    try {
      const { uploadsDir } = getStoragePaths();
      const itemDir = path.join(uploadsDir, solicitud.id);
      if (!fs.existsSync(itemDir)) fs.mkdirSync(itemDir, { recursive: true });
      fs.writeFileSync(path.join(itemDir, solicitud.archivoNombre), fileBuffer);
    } catch (err) {
      console.warn('No se pudo escribir archivo en disco local, conservado en memoria:', (err as any)?.message);
    }
  }

  // 2. Guardar en memoria y base de datos local
  const currentDb = readLocalDb();
  const updatedDb = [solicitud, ...currentDb.filter(r => r.id !== solicitud.id)];
  writeLocalDb(updatedDb);

  // 3. Si hay GITHUB_TOKEN, sincronizar en segundo plano
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
      console.warn('Error sincronizando con GitHub API (guardado localmente con éxito):', (err as any)?.message);
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
    console.warn('Error sincronizando actualización en GitHub:', (err as any)?.message);
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

  // 1. Verificar cache en memoria
  if (fileMemoryCache.has(solicitud.id)) {
    const cached = fileMemoryCache.get(solicitud.id)!;
    return {
      buffer: cached.buffer,
      filename: cached.filename,
      sizeBytes: cached.buffer.length
    };
  }

  // 2. Intentar leer desde las rutas de disco
  const { uploadsDir } = getStoragePaths();
  const candidates = [
    path.join(uploadsDir, solicitud.id, solicitud.archivoNombre),
    path.join(process.cwd(), 'storage', 'uploads', solicitud.id, solicitud.archivoNombre),
    path.join(os.tmpdir(), 'makerbox_storage', 'uploads', solicitud.id, solicitud.archivoNombre)
  ];

  for (const cand of candidates) {
    try {
      if (fs.existsSync(cand)) {
        const buf = fs.readFileSync(cand);
        return {
          buffer: buf,
          filename: solicitud.archivoNombre,
          sizeBytes: buf.length
        };
      }
    } catch {}
  }

  // 3. Si no está localmente y tenemos GitHub Token, descargarlo de GitHub
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
      console.warn('Error obteniendo archivo desde GitHub:', (err as any)?.message);
    }
  }

  return null;
}
