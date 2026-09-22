import { Solicitud3D, EstadoSolicitud } from '@/types';

// Configuración de GitHub desde variables de entorno
const GITHUB_TOKEN = process.env.GITHUB_TOKEN || '';
const GITHUB_OWNER = process.env.GITHUB_REPO_OWNER || 'crissgabriela';
const GITHUB_REPO = process.env.GITHUB_REPO_NAME || 'Makerbox';
const GITHUB_BRANCH = process.env.GITHUB_BRANCH || 'main';

// Almacén en memoria de respaldo para modo offline / desarrollo sin token configurado
let memoryStore: Solicitud3D[] = [
  {
    id: 'MBX-2026-A101',
    createdAt: new Date(Date.now() - 3600000 * 24 * 2).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 24 * 2).toISOString(),
    nombre: 'Camila Morales',
    correo: 'camila.morales@alumnos.utalca.cl',
    telefono: '+56987654321',
    tipoUsuario: 'Estudiante Pregrado',
    carrera: 'Ingeniería Civil Mecánica',
    archivoNombre: 'engranaje_planetario_v2.stl',
    archivoTamanoMb: 4.2,
    archivoUrl: '/models/demo_engranaje.stl',
    archivoFormato: 'stl',
    dimensionesMm: { x: 75.0, y: 75.0, z: 22.5 },
    material: 'PETG',
    color: 'Negro',
    relleno: '30%',
    calidad: 'Estándar (0.20mm)',
    observaciones: 'Pieza para mecanismo de transmisión, requiere buena adherencia.',
    estado: 'en_impresion',
    impresoraAsignada: 'Bambu Lab X1C #1',
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
    tipoUsuario: 'Docente / Investigador',
    carrera: 'Facultad de Ingeniería',
    archivoNombre: 'soporte_sensor_lidar.stl',
    archivoTamanoMb: 2.8,
    archivoUrl: '/models/demo_soporte.stl',
    archivoFormato: 'stl',
    dimensionesMm: { x: 110.0, y: 45.0, z: 35.0 },
    material: 'PLA',
    color: 'Blanco',
    relleno: '20%',
    calidad: 'Estándar (0.20mm)',
    observaciones: 'Prototipo para robot de navegación autónoma.',
    estado: 'aprobada',
    impresoraAsignada: 'Prusa MK4 #2',
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
    tipoUsuario: 'Proyecto de Título / Capstone',
    carrera: 'Ingeniería Civil en Bioinformática',
    archivoNombre: 'proteina_modelo_molecular.3mf',
    archivoTamanoMb: 8.5,
    archivoUrl: '/models/demo_proteina.3mf',
    archivoFormato: '3mf',
    dimensionesMm: { x: 92.0, y: 88.0, z: 95.0 },
    material: 'Resina UV',
    color: 'Transparente',
    relleno: 'A criterio técnico',
    calidad: 'Detallado (0.12mm)',
    observaciones: 'Modelo para defensa de título la próxima semana. Urgente.',
    estado: 'pendiente',
    notasStaff: 'Pendiente de calcular volumen en Photon Mono.'
  }
];

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
 * Obtiene la lista completa de solicitudes
 */
export async function getAllRequests(): Promise<Solicitud3D[]> {
  if (!GITHUB_TOKEN) {
    // Modo local / Fallback
    return [...memoryStore].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  try {
    const res = await callGitHubApi(`contents/storage/requests?ref=${GITHUB_BRANCH}`);
    if (!res.ok) {
      if (res.status === 404) {
        // La carpeta no existe aún en GitHub
        return memoryStore;
      }
      console.warn('Error fetching from GitHub API:', await res.text());
      return memoryStore;
    }

    const files: Array<{ name: string; download_url: string }> = await res.json();
    const jsonFiles = files.filter(f => f.name.endsWith('.json'));

    const requests = await Promise.all(
      jsonFiles.map(async (f) => {
        const fileRes = await fetch(f.download_url);
        return (await fileRes.json()) as Solicitud3D;
      })
    );

    return requests.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch (err) {
    console.error('Error reading requests from GitHub:', err);
    return memoryStore;
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
 * Guarda una nueva solicitud tanto de metadatos como opcionalmente el archivo en GitHub
 */
export async function createRequest(
  solicitud: Solicitud3D,
  fileBufferBase64?: string
): Promise<{ success: boolean; id: string; error?: string }> {
  // Siempre persistir en memoria local primero
  memoryStore = [solicitud, ...memoryStore];

  if (!GITHUB_TOKEN) {
    return { success: true, id: solicitud.id };
  }

  try {
    // 1. Si hay archivo binario 3D y es menor a 25MB, subir a GitHub repo
    if (fileBufferBase64 && solicitud.archivoTamanoMb <= 25) {
      const modelPath = `storage/models/${solicitud.id}/${solicitud.archivoNombre}`;
      await callGitHubApi(`contents/${modelPath}`, {
        method: 'PUT',
        body: JSON.stringify({
          message: `MakerBox 3D: Subir modelo ${solicitud.archivoNombre} para solicitud ${solicitud.id}`,
          content: fileBufferBase64,
          branch: GITHUB_BRANCH
        })
      });
      solicitud.archivoUrl = `https://raw.githubusercontent.com/${GITHUB_OWNER}/${GITHUB_REPO}/${GITHUB_BRANCH}/${modelPath}`;
    }

    // 2. Guardar el archivo JSON de metadatos de la solicitud
    const jsonPath = `storage/requests/${solicitud.id}.json`;
    const jsonContentBase64 = Buffer.from(JSON.stringify(solicitud, null, 2)).toString('base64');

    const res = await callGitHubApi(`contents/${jsonPath}`, {
      method: 'PUT',
      body: JSON.stringify({
        message: `MakerBox 3D: Crear solicitud ${solicitud.id} de ${solicitud.nombre}`,
        content: jsonContentBase64,
        branch: GITHUB_BRANCH
      })
    });

    if (!res.ok) {
      const errText = await res.text();
      console.warn('Error saving to GitHub, saved in local memory:', errText);
    }

    return { success: true, id: solicitud.id };
  } catch (err: unknown) {
    console.error('Error creating request in GitHub:', err);
    return { success: true, id: solicitud.id }; // Éxito en memoria
  }
}

/**
 * Actualiza el estado o notas técnicas de una solicitud
 */
export async function updateRequest(
  id: string,
  updates: Partial<Solicitud3D>
): Promise<{ success: boolean; error?: string }> {
  const index = memoryStore.findIndex(r => r.id.toUpperCase() === id.toUpperCase());
  if (index >= 0) {
    memoryStore[index] = {
      ...memoryStore[index],
      ...updates,
      updatedAt: new Date().toISOString()
    };
  }

  if (!GITHUB_TOKEN) {
    return { success: true };
  }

  try {
    const jsonPath = `storage/requests/${id}.json`;

    // 1. Obtener el SHA actual del archivo en GitHub
    const getRes = await callGitHubApi(`contents/${jsonPath}?ref=${GITHUB_BRANCH}`);
    if (!getRes.ok) {
      return { success: true }; // Si no está en GitHub, se actualizó en memoria
    }

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

    return { success: true };
  } catch (err: unknown) {
    console.error('Error updating request in GitHub:', err);
    return { success: true };
  }
}
