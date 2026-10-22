import { NextRequest, NextResponse } from 'next/server';
import { processGliderSvg, BALSA_DESIGN_LIMITS } from '@/lib/glider-svg-processor';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const fuselageLengthMm =
      Number(searchParams.get('fuselageLengthMm')) || BALSA_DESIGN_LIMITS.fuselage.default;
    const wingspanMm =
      Number(searchParams.get('wingspanMm')) || BALSA_DESIGN_LIMITS.wingspan.default;
    const wingWidthMm =
      Number(searchParams.get('wingWidthMm')) || BALSA_DESIGN_LIMITS.wingWidth.default;
    const slotThicknessMm =
      Number(searchParams.get('slotThicknessMm')) || BALSA_DESIGN_LIMITS.slotThickness.default;
    const includeAnnotations = searchParams.get('annotations') === 'true';
    const targetSheet = (searchParams.get('sheet') as 'all' | 'sheet1' | 'sheet2') || 'all';
    const format = searchParams.get('format') || 'json';

    const result = await processGliderSvg({
      fuselageLengthMm,
      wingspanMm,
      wingWidthMm,
      slotThicknessMm,
      includeAnnotations,
      targetSheet,
    });

    if (format === 'svg') {
      const filename = `planeador-balsa-${targetSheet}-${Math.round(fuselageLengthMm)}x${Math.round(wingspanMm)}mm.svg`;
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
      fuselageLengthMm: Number(body.fuselageLengthMm) || BALSA_DESIGN_LIMITS.fuselage.default,
      wingspanMm: Number(body.wingspanMm) || BALSA_DESIGN_LIMITS.wingspan.default,
      wingWidthMm: Number(body.wingWidthMm) || BALSA_DESIGN_LIMITS.wingWidth.default,
      slotThicknessMm: Number(body.slotThicknessMm) || BALSA_DESIGN_LIMITS.slotThickness.default,
      includeAnnotations: Boolean(body.includeAnnotations),
      targetSheet: body.targetSheet || 'all',
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
