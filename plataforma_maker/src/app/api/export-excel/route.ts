import { NextResponse } from 'next/server';
import { getAllRequests } from '@/lib/github-storage';
import { generateExcelBuffer } from '@/lib/excel-export';

export async function GET() {
  try {
    const solicitudes = await getAllRequests();
    const buffer = generateExcelBuffer(solicitudes);

    return new NextResponse(buffer as any, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename="makerbox_solicitudes_impresion3d.xlsx"'
      }
    });
  } catch (err: unknown) {
    console.error('Error generando Excel:', err);
    return NextResponse.json({ success: false, error: 'Error al exportar Excel' }, { status: 500 });
  }
}
