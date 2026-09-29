import fs from 'fs';
import path from 'path';
import os from 'os';
import { Solicitud3D, EstadoSolicitud } from '@/types';

// Configuración de GitHub desde variables de entorno
const GITHUB_TOKEN = (process.env.GITHUB_TOKEN || '').trim();
const GITHUB_OWNER = process.env.GITHUB_REPO_OWNER || 'crissgabriela';
const GITHUB_REPO = process.env.GITHUB_REPO_NAME || 'Makerbox';
const GITHUB_BRANCH = process.env.GITHUB_BRANCH || 'main';
const GITHUB_STORAGE_DIR = process.env.GITHUB_STORAGE_PREFIX || 'plataforma_maker/storage';

/**
 * Retorna si la plataforma cuenta con token para persistencia en GitHub
 */
export function isGitHubConfigured(): boolean {
  return Boolean(GITHUB_TOKEN && GITHUB_TOKEN.length > 5);
}

/**
 * Información de configuración de almacenamiento
 */
export function getStorageInfo() {
  return {
    isPermanent: isGitHubConfigured(),
    owner: GITHUB_OWNER,
    repo: GITHUB_REPO,
    branch: GITHUB_BRANCH,
    storageDir: GITHUB_STORAGE_DIR
  };
}

// Directorio seguro de almacenamiento local:
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

// Almacén en memoria inicial con datos de demostración
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
    if (!fs.existsSync(/*turbopackIgnore: true*/ baseDir)) {
      fs.mkdirSync(baseDir, { recursive: true });
    }
    if (!fs.existsSync(/*turbopackIgnore: true*/ uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    if (!fs.existsSync(/*turbopackIgnore: true*/ dbFile)) {
      fs.writeFileSync(dbFile, JSON.stringify(memoryStore, null, 2), 'utf-8');
    }
  } catch (err) {
    console.warn('Almacenamiento en disco no disponible, operando en memoria:', (err as any)?.message);
  }
}

// Helper para llamadas a GitHub REST API
async function callGitHubApi(endpoint: string, options: RequestInit = {}) {
  const url = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/${endpoint}`;
  return fetch(url, {
    ...options,
    headers: {
      Accept: 'application/vnd.github.v3+json',
      Authorization: `Bearer ${GITHUB_TOKEN}`,
      'Content-Type': 'application/json',
      ...options.headers
    }
  });
}

/**
 * Carga las solicitudes de la base de datos local o de memoria
 */
function readLocalDb(): Solicitud3D[] {
  safeEnsureStorage();
  try {
    const { dbFile } = getStoragePaths();
    if (fs.existsSync(/*turbopackIgnore: true*/ dbFile)) {
      const content = fs.readFileSync(/*turbopackIgnore: true*/ dbFile, 'utf-8');
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
 * Obtiene la base de datos centralizada directamente desde GitHub
 */
async function fetchDatabaseFromGitHub(): Promise<{ data: Solicitud3D[]; sha: string } | null> {
  if (!isGitHubConfigured()) return null;

  const candidatePaths = [
    `${GITHUB_STORAGE_DIR}/database.json`,
    'plataforma_maker/storage/database.json',
    'storage/database.json'
  ];

  for (const candidate of candidatePaths) {
    try {
      const res = await callGitHubApi(`contents/${candidate}?ref=${GITHUB_BRANCH}`);
      if (!res.ok) continue;

      const fileData = await res.json();
      let rawJson = '';

      if (fileData.content && fileData.encoding === 'base64') {
        rawJson = Buffer.from(fileData.content, 'base64').toString('utf-8');
      } else if (fileData.download_url) {
        const dlRes = await fetch(fileData.download_url, {
          headers: { Authorization: `Bearer ${GITHUB_TOKEN}` }
        });
        if (dlRes.ok) {
          rawJson = await dlRes.text();
        }
      }

      if (rawJson) {
        const parsed = JSON.parse(rawJson) as Solicitud3D[];
        if (Array.isArray(parsed)) {
          return { data: parsed, sha: fileData.sha };
        }
      }
    } catch (err) {
      console.warn(`Error al consultar ${candidate} en GitHub:`, (err as any)?.message);
    }
  }

  return null;
}

/**
 * Guarda y comitea la base de datos centralizada en GitHub
 */
async function commitDatabaseToGitHub(data: Solicitud3D[], knownSha?: string): Promise<boolean> {
  if (!isGitHubConfigured()) return false;

  const targetPath = `${GITHUB_STORAGE_DIR}/database.json`;

  try {
    let sha = knownSha;

    if (!sha) {
      const checkRes = await callGitHubApi(`contents/${targetPath}?ref=${GITHUB_BRANCH}`);
      if (checkRes.ok) {
        const fileData = await checkRes.json();
        sha = fileData.sha;
      }
    }

    const jsonString = JSON.stringify(data, null, 2);
    const base64Content = Buffer.from(jsonString, 'utf-8').toString('base64');

    const body: Record<string, unknown> = {
      message: `MakerBox 3D: Actualizar base de datos (${data.length} solicitudes)`,
      content: base64Content,
      branch: GITHUB_BRANCH
    };
    if (sha) {
      body.sha = sha;
    }

    const res = await callGitHubApi(`contents/${targetPath}`, {
      method: 'PUT',
      body: JSON.stringify(body)
    });

    if (!res.ok) {
      // Si fue conflicto (409), reintentar obteniendo el sha fresco
      if (res.status === 409) {
        const refetch = await callGitHubApi(`contents/${targetPath}?ref=${GITHUB_BRANCH}`);
        if (refetch.ok) {
          const freshData = await refetch.json();
          body.sha = freshData.sha;
          const retryRes = await callGitHubApi(`contents/${targetPath}`, {
            method: 'PUT',
            body: JSON.stringify(body)
          });
          return retryRes.ok;
        }
      }
      const errText = await res.text();
      console.warn('Error al commitear database.json en GitHub:', res.status, errText);
      return false;
    }

    return true;
  } catch (err) {
    console.error('Excepción al hacer commit de database.json:', err);
    return false;
  }
}

/**
 * Guarda un archivo 3D o paquete comprimido en GitHub si pesa hasta 25MB
 */
async function saveFileToGitHub(id: string, filename: string, buffer: Buffer): Promise<boolean> {
  if (!isGitHubConfigured()) return false;

  // Límite de la API de GitHub REST Contents es 25MB
  if (buffer.length > 25 * 1024 * 1024) {
    console.warn(`Archivo ${filename} (${buffer.length} bytes) excede el límite de 25MB de GitHub API`);
    return false;
  }

  const filePath = `${GITHUB_STORAGE_DIR}/uploads/${id}/${filename}`;

  try {
    let sha: string | undefined = undefined;
    const checkRes = await callGitHubApi(`contents/${filePath}?ref=${GITHUB_BRANCH}`);
    if (checkRes.ok) {
      const data = await checkRes.json();
      sha = data.sha;
    }

    const body: Record<string, unknown> = {
      message: `MakerBox 3D: Subir modelo ${filename} (${id})`,
      content: buffer.toString('base64'),
      branch: GITHUB_BRANCH
    };
    if (sha) {
      body.sha = sha;
    }

    const res = await callGitHubApi(`contents/${filePath}`, {
      method: 'PUT',
      body: JSON.stringify(body)
    });

    return res.ok;
  } catch (err) {
    console.warn(`Error al subir archivo ${filename} a GitHub:`, (err as any)?.message);
    return false;
  }
}

/**
 * Descarga un archivo binario desde GitHub
 */
async function getFileFromGitHub(id: string, filename: string): Promise<Buffer | null> {
  if (!isGitHubConfigured()) return null;

  const candidatePaths = [
    `${GITHUB_STORAGE_DIR}/uploads/${id}/${filename}`,
    `plataforma_maker/storage/uploads/${id}/${filename}`,
    `storage/uploads/${id}/${filename}`,
    `storage/models/${id}/${filename}`
  ];

  for (const filePath of candidatePaths) {
    try {
      const res = await callGitHubApi(`contents/${filePath}?ref=${GITHUB_BRANCH}`);
      if (!res.ok) continue;

      const data = await res.json();

      // Archivos menores a 1MB: vienen en base64 en data.content
      if (data.content && data.encoding === 'base64') {
        return Buffer.from(data.content, 'base64');
      }

      // Archivos mayores a 1MB: GitHub devuelve content vacío y proporciona download_url
      if (data.download_url) {
        const dlRes = await fetch(data.download_url, {
          headers: {
            Authorization: `Bearer ${GITHUB_TOKEN}`,
            Accept: 'application/octet-stream'
          }
        });
        if (dlRes.ok) {
          const ab = await dlRes.arrayBuffer();
          return Buffer.from(ab);
        }
      }
    } catch (err) {
      console.warn(`Error al descargar ${filePath} desde GitHub:`, (err as any)?.message);
    }
  }

  return null;
}

/**
 * Obtiene todas las solicitudes ordenadas por fecha reciente
 */
export async function getAllRequests(): Promise<Solicitud3D[]> {
  // 1. Si GitHub está configurado, consultar GitHub como fuente de verdad
  if (isGitHubConfigured()) {
    const ghDb = await fetchDatabaseFromGitHub();
    if (ghDb && ghDb.data) {
      memoryStore = ghDb.data;
      writeLocalDb(ghDb.data);
      return [...ghDb.data].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
  }

  // 2. Si no hay token o falló GitHub, responder desde local / memoria
  const localList = readLocalDb();
  return [...localList].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
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

  // 1. Guardar en cache de memoria y disco temporal
  if (fileBuffer && fileBuffer.length > 0) {
    fileMemoryCache.set(solicitud.id, {
      buffer: fileBuffer,
      filename: solicitud.archivoNombre
    });

    try {
      const { uploadsDir } = getStoragePaths();
      const itemDir = path.join(uploadsDir, solicitud.id);
      if (!fs.existsSync(/*turbopackIgnore: true*/ itemDir)) {
        fs.mkdirSync(itemDir, { recursive: true });
      }
      fs.writeFileSync(path.join(itemDir, solicitud.archivoNombre), fileBuffer);
    } catch (err) {
      console.warn('No se pudo escribir archivo en disco local, conservado en memoria:', (err as any)?.message);
    }
  }

  // 2. Cargar lista actual (desde GitHub si está disponible)
  let currentDb: Solicitud3D[] = [];
  let currentSha: string | undefined = undefined;

  if (isGitHubConfigured()) {
    const ghDb = await fetchDatabaseFromGitHub();
    if (ghDb) {
      currentDb = ghDb.data;
      currentSha = ghDb.sha;
    } else {
      currentDb = readLocalDb();
    }
  } else {
    currentDb = readLocalDb();
  }

  // Añadir la nueva solicitud al inicio
  const updatedDb = [solicitud, ...currentDb.filter(r => r.id !== solicitud.id)];
  writeLocalDb(updatedDb);

  // 3. Persistir en GitHub si el token está configurado
  if (isGitHubConfigured()) {
    try {
      if (fileBuffer && fileBuffer.length > 0 && fileBuffer.length <= 25 * 1024 * 1024) {
        await saveFileToGitHub(solicitud.id, solicitud.archivoNombre, fileBuffer);
      }
      await commitDatabaseToGitHub(updatedDb, currentSha);
    } catch (err) {
      console.error('Error al persistir solicitud en GitHub:', err);
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
  let currentDb: Solicitud3D[] = [];
  let currentSha: string | undefined = undefined;

  if (isGitHubConfigured()) {
    const ghDb = await fetchDatabaseFromGitHub();
    if (ghDb) {
      currentDb = ghDb.data;
      currentSha = ghDb.sha;
    } else {
      currentDb = readLocalDb();
    }
  } else {
    currentDb = readLocalDb();
  }

  const index = currentDb.findIndex(r => r.id.toUpperCase() === id.toUpperCase());
  if (index >= 0) {
    currentDb[index] = {
      ...currentDb[index],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    writeLocalDb(currentDb);

    if (isGitHubConfigured()) {
      await commitDatabaseToGitHub(currentDb, currentSha);
    }
    return { success: true };
  }

  return { success: false, error: 'Solicitud no encontrada' };
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
      if (fs.existsSync(/*turbopackIgnore: true*/ cand)) {
        const buf = fs.readFileSync(/*turbopackIgnore: true*/ cand);
        return {
          buffer: buf,
          filename: solicitud.archivoNombre,
          sizeBytes: buf.length
        };
      }
    } catch {}
  }

  // 3. Descargar desde GitHub si está configurado
  if (isGitHubConfigured()) {
    const buf = await getFileFromGitHub(solicitud.id, solicitud.archivoNombre);
    if (buf) {
      fileMemoryCache.set(solicitud.id, {
        buffer: buf,
        filename: solicitud.archivoNombre
      });
      return {
        buffer: buf,
        filename: solicitud.archivoNombre,
        sizeBytes: buf.length
      };
    }
  }

  return null;
}
