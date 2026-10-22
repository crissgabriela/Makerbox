import { NextRequest, NextResponse } from 'next/server';
import { processGliderSvg, BASE_GLIDER_PARAMS } from '@/lib/glider-svg-processor';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const fuselageLengthMm = Number(searchParams.get('fuselageLengthMm')) || BASE_GLIDER_PARAMS.fuselageLengthMm;
    const wingspanMm = Number(searchParams.get('wingspanMm')) || BASE_GLIDER_PARAMS.wingspanTotalMm;
    const wingWidthMm = Number(searchParams.get('wingWidthMm')) || BASE_GLIDER_PARAMS.wingWidthMm;
    const slotThicknessMm = Number(searchParams.get('slotThicknessMm')) || BASE_GLIDER_PARAMS.slotThicknessMm;
    const includeAnnotations = searchParams.get('annotations') === 'true';
    const format = searchParams.get('format') || 'json';

    const result = await processGliderSvg({
      fuselageLengthMm,
      wingspanMm,
      wingWidthMm,
      slotThicknessMm,
      includeAnnotations,
    });

    if (format === 'svg') {
      const filename = `planeador-laser-${Math.round(fuselageLengthMm)}x${Math.round(wingspanMm)}mm.svg`;
      return new NextResponse(result.svg, {
        status: 200,
        headers: {
          'Content-Type': 'image/svg+xml; charset=utf-8',
          'Content-Disposition': `attachment; filename="${filename}"`,
          'Cache-Control': 'no-store',
        },
      });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error procesando SVG del planeador (GET):', error);
    return NextResponse.json(
      { error: 'No se pudo procesar la plantilla vectorial del planeador.' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = await processGliderSvg({
      fuselageLengthMm: Number(body.fuselageLengthMm) || BASE_GLIDER_PARAMS.fuselageLengthMm,
      wingspanMm: Number(body.wingspanMm) || BASE_GLIDER_PARAMS.wingspanTotalMm,
      wingWidthMm: Number(body.wingWidthMm) || BASE_GLIDER_PARAMS.wingWidthMm,
      slotThicknessMm: Number(body.slotThicknessMm) || BASE_GLIDER_PARAMS.slotThicknessMm,
      includeAnnotations: Boolean(body.includeAnnotations),
      cutStrokeColor: body.cutStrokeColor || '#FF0000',
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error procesando SVG del planeador (POST):', error);
    return NextResponse.json(
      { error: 'Error al aplicar las transformaciones vectoriales al planeador.' },
      { status: 500 }
    );
  }
}
