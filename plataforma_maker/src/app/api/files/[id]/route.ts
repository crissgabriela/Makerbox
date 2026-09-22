import { NextRequest, NextResponse } from 'next/server';
import { getFileBuffer } from '@/lib/github-storage';

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const fileData = await getFileBuffer(id);

    if (!fileData) {
      return new NextResponse('Archivo 3D no encontrado o aún en procesamiento.', {
        status: 404,
        headers: { 'Content-Type': 'text/plain; charset=utf-8' }
      });
    }

    // Detectar Content-Type según extensión
    const lower = fileData.filename.toLowerCase();
    let contentType = 'application/octet-stream';
    if (lower.endsWith('.stl')) contentType = 'model/stl';
    else if (lower.endsWith('.obj')) contentType = 'model/obj';
    else if (lower.endsWith('.3mf')) contentType = 'model/3mf';
    else if (lower.endsWith('.zip')) contentType = 'application/zip';
    else if (lower.endsWith('.rar')) contentType = 'application/x-rar-compressed';

    return new NextResponse(fileData.buffer as any, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${fileData.filename}"`,
        'Content-Length': String(fileData.sizeBytes),
        'Cache-Control': 'public, max-age=3600'
      }
    });
  } catch (err: unknown) {
    console.error('Error in GET /api/files/[id]:', err);
    return new NextResponse('Error al descargar archivo.', { status: 500 });
  }
}
