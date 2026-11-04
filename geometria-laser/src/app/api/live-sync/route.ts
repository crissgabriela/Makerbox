import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

interface SessionData {
  image: string;
  timestamp: number;
  consumed: boolean;
}

// Almacén en memoria global para retener sesiones durante el ciclo de vida del servidor
declare global {
  // eslint-disable-next-line no-var
  var __makerboxLiveSessions: Map<string, SessionData> | undefined;
}

const sessions = globalThis.__makerboxLiveSessions || new Map<string, SessionData>();
globalThis.__makerboxLiveSessions = sessions;

// Cabeceras estrictas para evitar que Vercel, proxies o el navegador almacenen en caché las peticiones de sondeo
const NO_CACHE_HEADERS = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
  'Pragma': 'no-cache',
  'Expires': '0',
  'Surrogate-Control': 'no-store'
};

// Limpieza de sesiones con más de 15 minutos de antigüedad
function cleanupExpiredSessions() {
  const now = Date.now();
  const TTL_MS = 15 * 60 * 1000;
  for (const [id, data] of sessions.entries()) {
    if (now - data.timestamp > TTL_MS) {
      sessions.delete(id);
    }
  }
}

/**
 * POST /api/live-sync
 * Recibe { sessionId, image } desde el celular del asistente
 */
export async function POST(request: NextRequest) {
  try {
    cleanupExpiredSessions();
    const body = await request.json();
    const { sessionId, image } = body;

    if (!sessionId || typeof sessionId !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Código de sesión requerido.' },
        { status: 400, headers: NO_CACHE_HEADERS }
      );
    }

    if (!image || typeof image !== 'string' || !image.startsWith('data:image/')) {
      return NextResponse.json(
        { success: false, error: 'Formato de imagen no válido. Debe ser Data URL (JPG/PNG/WebP).' },
        { status: 400, headers: NO_CACHE_HEADERS }
      );
    }

    // Límite de seguridad: máximo 4.5 MB en Base64
    if (image.length > 4.5 * 1024 * 1024) {
      return NextResponse.json(
        { success: false, error: 'La imagen excede el tamaño máximo permitido. Intenta comprimirla.' },
        { status: 413, headers: NO_CACHE_HEADERS }
      );
    }

    const cleanSessionId = sessionId.trim().toUpperCase();

    // Sobrescribe cualquier dato previo de esta sesión con la nueva foto limpia
    sessions.set(cleanSessionId, {
      image,
      timestamp: Date.now(),
      consumed: false
    });

    return NextResponse.json(
      {
        success: true,
        message: '¡Foto recibida exitosamente en el stand!',
        sessionId: cleanSessionId,
        timestamp: Date.now()
      },
      { headers: NO_CACHE_HEADERS }
    );
  } catch (error) {
    console.error('Error en POST /api/live-sync:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor procesando la imagen.' },
      { status: 500, headers: NO_CACHE_HEADERS }
    );
  }
}

/**
 * GET /api/live-sync?s=CODIGO&since=TIMESTAMP
 * Consulta el estado de la sesión desde la laptop en el stand
 */
export async function GET(request: NextRequest) {
  try {
    cleanupExpiredSessions();
    const { searchParams } = new URL(request.url);
    const sessionId =
      searchParams.get('s') || searchParams.get('sesion') || searchParams.get('sessionId');

    if (!sessionId) {
      return NextResponse.json(
        { success: false, error: 'Parámetro de sesión (s) requerido.' },
        { status: 400, headers: NO_CACHE_HEADERS }
      );
    }

    const cleanSessionId = sessionId.trim().toUpperCase();
    const session = sessions.get(cleanSessionId);

    // Si no existe sesión o ya no tiene foto cargada
    if (!session || !session.image) {
      return NextResponse.json(
        {
          success: false,
          status: 'waiting',
          message: 'Esperando imagen del celular...'
        },
        { headers: NO_CACHE_HEADERS }
      );
    }

    // Si esta foto ya fue consumida/entregada previamente a la laptop
    if (session.consumed) {
      return NextResponse.json(
        {
          success: false,
          status: 'already_consumed',
          message: 'Esta foto ya fue entregada y procesada.'
        },
        { headers: NO_CACHE_HEADERS }
      );
    }

    const sinceParam = searchParams.get('since');
    const sinceTimestamp = sinceParam ? Number(sinceParam) : 0;

    // Si ya se entregó esta foto y no hay una versión más nueva enviada
    if (sinceTimestamp > 0 && session.timestamp <= sinceTimestamp) {
      return NextResponse.json(
        {
          success: false,
          status: 'no_new_image',
          timestamp: session.timestamp
        },
        { headers: NO_CACHE_HEADERS }
      );
    }

    // Entregar imagen más reciente
    const imageToDeliver = session.image;
    const deliveredTimestamp = session.timestamp;

    // Marcar como consumida de inmediato y purgar los bytes de imagen para que NUNCA vuelva a entregarse
    session.consumed = true;
    session.image = '';
    sessions.delete(cleanSessionId);

    return NextResponse.json(
      {
        success: true,
        status: 'ready',
        image: imageToDeliver,
        timestamp: deliveredTimestamp
      },
      { headers: NO_CACHE_HEADERS }
    );
  } catch (error) {
    console.error('Error en GET /api/live-sync:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor.' },
      { status: 500, headers: NO_CACHE_HEADERS }
    );
  }
}

/**
 * DELETE /api/live-sync?s=CODIGO
 * Elimina una sesión del servidor para asegurar que no queden rastros de fotos previas
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId =
      searchParams.get('s') || searchParams.get('sesion') || searchParams.get('sessionId');

    if (sessionId) {
      const cleanSessionId = sessionId.trim().toUpperCase();
      sessions.delete(cleanSessionId);
    }

    return NextResponse.json(
      { success: true, message: 'Sesión eliminada limpiamente.' },
      { headers: NO_CACHE_HEADERS }
    );
  } catch (error) {
    console.error('Error en DELETE /api/live-sync:', error);
    return NextResponse.json(
      { success: false, error: 'Error al purgar sesión.' },
      { status: 500, headers: NO_CACHE_HEADERS }
    );
  }
}
