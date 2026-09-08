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

// Limpieza de sesiones con más de 20 minutos de antigüedad
function cleanupExpiredSessions() {
  const now = Date.now();
  const TTL_MS = 20 * 60 * 1000;
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
        { status: 400 }
      );
    }

    if (!image || typeof image !== 'string' || !image.startsWith('data:image/')) {
      return NextResponse.json(
        { success: false, error: 'Formato de imagen no válido. Debe ser Data URL (JPG/PNG/WebP).' },
        { status: 400 }
      );
    }

    // Límite de seguridad: máximo 4.5 MB en Base64
    if (image.length > 4.5 * 1024 * 1024) {
      return NextResponse.json(
        { success: false, error: 'La imagen excede el tamaño máximo permitido.' },
        { status: 413 }
      );
    }

    const cleanSessionId = sessionId.trim().toUpperCase();

    sessions.set(cleanSessionId, {
      image,
      timestamp: Date.now(),
      consumed: false
    });

    return NextResponse.json({
      success: true,
      message: '¡Foto recibida exitosamente!',
      sessionId: cleanSessionId
    });
  } catch (error) {
    console.error('Error en POST /api/live-sync:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor procesando la imagen.' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/live-sync?s=CODIGO
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
        { status: 400 }
      );
    }

    const cleanSessionId = sessionId.trim().toUpperCase();
    const session = sessions.get(cleanSessionId);

    if (!session) {
      return NextResponse.json({
        success: false,
        status: 'waiting',
        message: 'Esperando imagen del celular...'
      });
    }

    // Entregar imagen y marcar como consumida
    session.consumed = true;

    return NextResponse.json({
      success: true,
      status: 'ready',
      image: session.image,
      timestamp: session.timestamp
    });
  } catch (error) {
    console.error('Error en GET /api/live-sync:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor.' },
      { status: 500 }
    );
  }
}
