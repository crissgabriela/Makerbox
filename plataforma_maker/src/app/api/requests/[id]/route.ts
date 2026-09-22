import { NextRequest, NextResponse } from 'next/server';
import { getRequestById, updateRequest } from '@/lib/github-storage';

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const solicitud = await getRequestById(id);

    if (!solicitud) {
      return NextResponse.json({ success: false, error: 'Solicitud no encontrada' }, { status: 404 });
    }

    return NextResponse.json({ success: true, solicitud });
  } catch (err: unknown) {
    console.error('Error in GET /api/requests/[id]:', err);
    return NextResponse.json({ success: false, error: 'Error interno' }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body = await req.json();

    const result = await updateRequest(id, body);
    return NextResponse.json(result);
  } catch (err: unknown) {
    console.error('Error in PATCH /api/requests/[id]:', err);
    return NextResponse.json({ success: false, error: 'Error al actualizar' }, { status: 500 });
  }
}
