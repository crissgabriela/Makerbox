import { NextRequest, NextResponse } from 'next/server';
import { processZooFusionPuzzle } from '@/lib/zoo-svg-processor';
import { PuzzlePieceCount, EngravingStrokeWeight } from '@/types/zoo';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const images = Array.isArray(body.images) ? body.images : [];
    const puzzlePieces = (Number(body.puzzlePieces) || 25) as PuzzlePieceCount;
    const strokeWeight = (body.strokeWeight || 'thin') as EngravingStrokeWeight;
    const studentPrompt = typeof body.studentPrompt === 'string' ? body.studentPrompt : '';
    const targetHeightMm = Number(body.targetHeightMm) || 120;
    const includeAnnotations =
      body.includeAnnotations === undefined ? true : Boolean(body.includeAnnotations);
    const customApiKey =
      typeof body.customApiKey === 'string' ? body.customApiKey : undefined;

    const result = await processZooFusionPuzzle({
      images,
      puzzlePieces,
      strokeWeight,
      studentPrompt,
      targetHeightMm,
      includeAnnotations,
      customApiKey,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error en el motor de IA Generativa y Rompecabezas (POST /api/zoologico):', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'No se pudieron fusionar y vectorizar los dibujos.',
      },
      { status: 400 }
    );
  }
}
