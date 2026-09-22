import { NextRequest, NextResponse } from 'next/server';
import { getAllRequests, createRequest } from '@/lib/github-storage';
import { Solicitud3D } from '@/types';

export async function GET() {
  try {
    const requests = await getAllRequests();
    return NextResponse.json({ success: true, requests });
  } catch (err: unknown) {
    console.error('Error in GET /api/requests:', err);
    return NextResponse.json({ success: false, error: 'Error al obtener solicitudes' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get('content-type') || '';

    // 1. Manejo de subida binaria nativa multipart/form-data (Recomendado, soporta hasta 50MB)
    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      const file = formData.get('file') as File | null;
      const solicitudRaw = formData.get('solicitud') as string | null;

      if (!solicitudRaw) {
        return NextResponse.json({ success: false, error: 'Metadatos de solicitud no proporcionados' }, { status: 400 });
      }

      const solicitud: Solicitud3D = JSON.parse(solicitudRaw);

      if (!file || file.size === 0) {
        return NextResponse.json({
          success: false,
          error: 'El archivo 3D está vacío (0 bytes) o no se pudo cargar correctamente.'
        }, { status: 400 });
      }

      // Convertir a Buffer
      const arrayBuffer = await file.arrayBuffer();
      const fileBuffer = Buffer.from(arrayBuffer);

      solicitud.archivoTamanoMb = Math.round((file.size / (1024 * 1024)) * 100) / 100;

      const result = await createRequest(solicitud, fileBuffer);
      return NextResponse.json(result);
    }

    // 2. Manejo fallback de JSON (si viene en base64)
    const body = await req.json();
    const { solicitud, fileBase64 } = body as {
      solicitud: Solicitud3D;
      fileBase64?: string;
    };

    if (!solicitud || !solicitud.id || !solicitud.nombre) {
      return NextResponse.json({ success: false, error: 'Datos incompletos' }, { status: 400 });
    }

    const fileBuffer = fileBase64 ? Buffer.from(fileBase64, 'base64') : undefined;
    const result = await createRequest(solicitud, fileBuffer);
    return NextResponse.json(result);

  } catch (err: unknown) {
    console.error('Error in POST /api/requests:', err);
    return NextResponse.json({ success: false, error: 'Error al procesar la solicitud' }, { status: 500 });
  }
}
