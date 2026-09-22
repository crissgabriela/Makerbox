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
    const body = await req.json();
    const { solicitud, fileBase64 } = body as {
      solicitud: Solicitud3D;
      fileBase64?: string;
    };

    if (!solicitud || !solicitud.id || !solicitud.nombre) {
      return NextResponse.json({ success: false, error: 'Datos incompletos' }, { status: 400 });
    }

    const result = await createRequest(solicitud, fileBase64);
    return NextResponse.json(result);
  } catch (err: unknown) {
    console.error('Error in POST /api/requests:', err);
    return NextResponse.json({ success: false, error: 'Error al crear solicitud' }, { status: 500 });
  }
}
