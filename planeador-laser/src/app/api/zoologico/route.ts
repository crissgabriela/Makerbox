import { NextRequest, NextResponse } from 'next/server';
import { processZooSvg } from '@/lib/zoo-svg-processor';
import { ZOO_PRESET_ANIMALS } from '@/types/zoo';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const svgContent =
      typeof body.svgContent === 'string' && body.svgContent.trim().length > 0
        ? body.svgContent
        : ZOO_PRESET_ANIMALS[0].svg;

    const targetHeightMm = Number(body.targetHeightMm) || 82;
    const materialThicknessMm = Number(body.materialThicknessMm) || 3.0;
    const slotDepthMm = Number(body.slotDepthMm) || 15;
    const slot1Ratio = Number(body.slot1Ratio) || 0.32;
    const slot2Ratio = Number(body.slot2Ratio) || 0.72;
    const includeStandBases = Boolean(body.includeStandBases);
    const includeAnnotations = Boolean(body.includeAnnotations);

    const result = await processZooSvg({
      svgContent,
      targetHeightMm,
      materialThicknessMm,
      slotDepthMm,
      slot1Ratio,
      slot2Ratio,
      includeStandBases,
      includeAnnotations,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error procesando SVG de Zoológico Low-Poly (POST):', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'No se pudo procesar el archivo SVG del animal. Verifica que contenga trazos vectoriales válidos.',
      },
      { status: 400 }
    );
  }
}
