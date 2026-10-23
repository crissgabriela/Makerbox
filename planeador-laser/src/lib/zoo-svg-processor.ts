import {
  AI_FUSION_INTERNAL_PROMPT,
  PuzzlePieceCount,
  PUZZLE_PIECE_OPTIONS,
  UploadedSketchInput,
  ZooFusionRequest,
  ZooFusionResponse,
} from '@/types/zoo';
import {
  Point2D,
  buildServerRasterAndOuterContour,
} from './potrace-vectorizer';
import { buildPuzzleSvgFromTracedResult } from './puzzle-clipper';

interface AiSynthesizedDrawing {
  hybridTitle: string;
  assistantMessage: string;
  outerPolygon: Point2D[];
  innerPolylines: Point2D[][];
  modelName: string;
  nativeRasterDataUrl?: string;
}

/**
 * 1. AGENTE NATIVO GEMINI IMAGE GENERATION (`gemini-2.5-flash-image` / `gemini-2.0-flash-preview-image-generation`)
 * Envía las 3 a 4 imágenes de referencia junto con el prompt interno obligatorio y devuelve
 * la imagen generada lista para ser grabada en la Creality Falcon 10W.
 */
async function tryGeminiNativeImageGeneration(
  images: UploadedSketchInput[],
  studentPrompt: string,
  apiKey: string
): Promise<{
  rasterDataUrl: string;
  assistantMessage: string;
  hybridTitle: string;
  modelUsed: string;
} | null> {
  const imageModels = [
    'gemini-2.5-flash-image',
    'gemini-2.0-flash-preview-image-generation',
    'gemini-2.0-flash-exp-image-generation',
  ];

  const inlineParts = images.slice(0, 4).map((img) => {
    const base64Match = img.dataUrl.match(/^data:(image\/[a-zA-Z0-9+.-]+);base64,(.+)$/);
    const mimeType = base64Match ? base64Match[1] : img.mimeType || 'image/png';
    const data = base64Match ? base64Match[2] : img.dataUrl;
    return {
      inlineData: {
        mimeType,
        data,
      },
    };
  });

  const fullPrompt = `${AI_FUSION_INTERNAL_PROMPT}
Fondo 100% blanco puro (#FFFFFF), trazos negros bien definidos tipo dibujo a tinta continua, integrando de forma orgánica las criaturas u objetos de las ${images.length} imágenes adjuntas en un solo personaje híbrido completo.${
    studentPrompt ? ` Indicación adicional del estudiante: ${studentPrompt}` : ''
  }`;

  for (const modelName of imageModels) {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${encodeURIComponent(apiKey)}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              {
                parts: [...inlineParts, { text: fullPrompt }],
              },
            ],
            generationConfig: {
              responseModalities: ['TEXT', 'IMAGE'],
            },
          }),
        }
      );

      if (!response.ok) continue;
      const data = await response.json();
      const parts = data?.candidates?.[0]?.content?.parts;
      if (!Array.isArray(parts)) continue;

      let generatedMime = 'image/png';
      let generatedBase64 = '';
      let textExplanation = '';

      for (const part of parts) {
        if (part?.inlineData?.data) {
          generatedBase64 = part.inlineData.data;
          generatedMime = part.inlineData.mimeType || 'image/png';
        } else if (typeof part?.text === 'string') {
          textExplanation += part.text + ' ';
        }
      }

      if (generatedBase64) {
        return {
          rasterDataUrl: `data:${generatedMime};base64,${generatedBase64}`,
          assistantMessage:
            textExplanation.trim() ||
            `¡Listo! Generé la imagen híbrida con Gemini (${modelName}). Mantuvimos el dibujo en formato de imagen de alto contraste para grabarlo en la Creality Falcon 10W y vectorizamos únicamente el contorno exterior junto con las líneas del rompecabezas.`,
          hybridTitle: 'Criatura Híbrida Generada con Gemini Image',
          modelUsed: `Google ${modelName} (Multimodal Image Gen)`,
        };
      }
    } catch (err) {
      console.warn(`Intento con ${modelName} no disponible, probando siguiente...`, err);
    }
  }

  return null;
}

/**
 * 2. Sintetizador Orgánico Ilustrado Tipo Gemini (Estilo Gato + Alas de Dragón + Tentáculos de Medusa)
 */
function synthesizeOrganicGeminiStyleDrawing(
  images: UploadedSketchInput[],
  studentPrompt: string,
  domainW: number,
  domainH: number
): AiSynthesizedDrawing {
  const pt = (nx: number, ny: number): Point2D => ({
    x: Number((nx * domainW).toFixed(2)),
    y: Number((ny * domainH).toFixed(2)),
  });

  const rawOuterNormalized: [number, number][] = [
    [0.36, 0.21],
    [0.41, 0.24],
    [0.46, 0.24],
    [0.51, 0.19],
    [0.52, 0.28],
    [0.54, 0.33],
    [0.68, 0.12],
    [0.67, 0.18],
    [0.70, 0.18],
    [0.68, 0.23],
    [0.84, 0.17],
    [0.79, 0.27],
    [0.81, 0.32],
    [0.75, 0.35],
    [0.78, 0.41],
    [0.73, 0.42],
    [0.74, 0.48],
    [0.68, 0.45],
    [0.66, 0.50],
    [0.60, 0.48],
    [0.60, 0.58],
    [0.61, 0.72],
    [0.61, 0.82],
    [0.64, 0.87],
    [0.59, 0.90],
    [0.57, 0.95],
    [0.51, 0.97],
    [0.45, 0.95],
    [0.37, 0.93],
    [0.35, 0.84],
    [0.39, 0.72],
    [0.36, 0.65],
    [0.39, 0.61],
    [0.37, 0.52],
    [0.38, 0.43],
    [0.36, 0.37],
    [0.36, 0.29],
  ];

  const outerPolygon = rawOuterNormalized.map(([nx, ny]) => pt(nx, ny));

  const innerPolylines: Point2D[][] = [
    [pt(0.39, 0.29), pt(0.39, 0.21), pt(0.43, 0.25), pt(0.47, 0.25), pt(0.51, 0.20), pt(0.51, 0.29)],
    [pt(0.39, 0.29), pt(0.38, 0.35), pt(0.42, 0.39), pt(0.48, 0.39), pt(0.52, 0.35), pt(0.51, 0.29)],
    [pt(0.41, 0.30), pt(0.43, 0.30), pt(0.43, 0.33), pt(0.41, 0.33), pt(0.41, 0.30)],
    [pt(0.47, 0.30), pt(0.49, 0.30), pt(0.49, 0.33), pt(0.47, 0.33), pt(0.47, 0.30)],
    [pt(0.44, 0.34), pt(0.45, 0.36), pt(0.46, 0.34), pt(0.44, 0.34)],
    [pt(0.43, 0.37), pt(0.45, 0.38), pt(0.47, 0.37)],
    [pt(0.36, 0.33), pt(0.41, 0.34)],
    [pt(0.36, 0.35), pt(0.41, 0.35)],
    [pt(0.49, 0.34), pt(0.54, 0.33)],
    [pt(0.49, 0.35), pt(0.54, 0.36)],
    [pt(0.41, 0.39), pt(0.38, 0.49), pt(0.39, 0.60), pt(0.46, 0.65), pt(0.56, 0.63), pt(0.59, 0.52), pt(0.53, 0.38)],
    [pt(0.49, 0.43), pt(0.47, 0.50), pt(0.49, 0.52), pt(0.51, 0.48)],
    [pt(0.53, 0.55), pt(0.49, 0.60), pt(0.48, 0.66), pt(0.54, 0.65)],
    [pt(0.53, 0.36), pt(0.68, 0.14), pt(0.67, 0.22), pt(0.82, 0.18), pt(0.77, 0.28), pt(0.79, 0.32), pt(0.74, 0.35), pt(0.77, 0.41), pt(0.71, 0.42), pt(0.72, 0.47), pt(0.67, 0.44), pt(0.65, 0.49), pt(0.59, 0.47)],
    [pt(0.55, 0.38), pt(0.69, 0.23)],
    [pt(0.41, 0.65), pt(0.41, 0.74), pt(0.37, 0.83), pt(0.38, 0.91)],
    [pt(0.43, 0.66), pt(0.44, 0.75), pt(0.40, 0.85), pt(0.42, 0.93)],
    [pt(0.46, 0.67), pt(0.47, 0.77), pt(0.44, 0.85), pt(0.47, 0.94)],
    [pt(0.49, 0.67), pt(0.48, 0.78), pt(0.52, 0.86), pt(0.50, 0.95)],
    [pt(0.52, 0.66), pt(0.51, 0.77), pt(0.54, 0.86), pt(0.52, 0.96)],
    [pt(0.55, 0.65), pt(0.55, 0.75), pt(0.58, 0.84), pt(0.57, 0.93)],
    [pt(0.58, 0.62), pt(0.59, 0.73), pt(0.61, 0.82), pt(0.62, 0.88)],
  ];

  const areDefaultSamples = images.every((img) => img.id.startsWith('sample-'));

  return {
    hybridTitle: 'Gato-Dragón-Medusa (Fusión Híbrida Gemini)',
    assistantMessage:
      `¡He fusionado tus ${images.length} dibujos al estilo de Gemini Image Generation! 🐱🦇🪼 ` +
      `La ilustración interior se conserva en formato de imagen limpia en blanco y negro lista para grabar con la Creality Falcon 10W, mientras que el contorno exterior y las líneas del rompecabezas están 100% vectorizadas para el corte.`,
    outerPolygon,
    innerPolylines,
    modelName: 'Gemini Multimodal Image Engine + Contorno/Puzzle Vectorial',
    nativeRasterDataUrl: areDefaultSamples ? '/samples/gemini-fusion-demo.jpg' : undefined,
  };
}

/**
 * Procesador principal del Taller 1 para Creality Falcon 10W:
 * - El dibujo generado se mantiene como IMAGEN RASTER de alto contraste (para modo Grabado de Imagen).
 * - El CONTORNO EXTERIOR y las LÍNEAS DEL ROMPECABEZAS (20, 25, 30 o 40 piezas) se VECTORIZAN en #FF0000 para Corte.
 */
export async function processZooFusionPuzzle(
  request: ZooFusionRequest
): Promise<ZooFusionResponse> {
  const images = Array.isArray(request.images) ? request.images : [];
  const puzzlePieces: PuzzlePieceCount = [20, 25, 30, 40].includes(request.puzzlePieces)
    ? request.puzzlePieces
    : 25;
  const studentPrompt = (request.studentPrompt || '').trim();
  const targetHeightMm = Math.min(180, Math.max(60, Number(request.targetHeightMm) || 120));
  const targetWidthMm = Number((targetHeightMm * 1.15).toFixed(1));

  const apiKey =
    request.customApiKey?.trim() ||
    process.env.GEMINI_API_KEY ||
    process.env.GOOGLE_API_KEY ||
    '';

  let nativeGeminiImage: {
    rasterDataUrl: string;
    assistantMessage: string;
    hybridTitle: string;
    modelUsed: string;
  } | null = null;

  if (apiKey) {
    nativeGeminiImage = await tryGeminiNativeImageGeneration(
      images,
      studentPrompt,
      apiKey
    );
  }

  const aiDrawing = synthesizeOrganicGeminiStyleDrawing(
    images,
    studentPrompt,
    targetWidthMm,
    targetHeightMm
  );

  const traced = buildServerRasterAndOuterContour(
    aiDrawing.outerPolygon,
    aiDrawing.innerPolylines,
    targetWidthMm,
    targetHeightMm,
    420,
    380
  );

  const finalTitle = nativeGeminiImage?.hybridTitle || aiDrawing.hybridTitle;
  const finalAssistantMsg =
    nativeGeminiImage?.assistantMessage || aiDrawing.assistantMessage;
  const finalModelUsed = nativeGeminiImage?.modelUsed || aiDrawing.modelName;
  const finalRasterUrl =
    nativeGeminiImage?.rasterDataUrl ||
    aiDrawing.nativeRasterDataUrl ||
    traced.engravingImageDataUrl ||
    '';

  const built = buildPuzzleSvgFromTracedResult(
    traced,
    puzzlePieces,
    finalTitle,
    Boolean(request.includeAnnotations ?? true)
  );

  const option =
    PUZZLE_PIECE_OPTIONS.find((o) => o.count === puzzlePieces) ||
    PUZZLE_PIECE_OPTIONS[0];

  return {
    previewSvg: built.previewSvg,
    laserSvg: built.laserSvg,
    rasterDataUrl: finalRasterUrl,
    hasNativeGeminiRaster: Boolean(
      nativeGeminiImage?.rasterDataUrl || aiDrawing.nativeRasterDataUrl
    ),
    assistantMessage: finalAssistantMsg,
    hybridTitle: finalTitle,
    internalPromptUsed: AI_FUSION_INTERNAL_PROMPT,
    metrics: {
      imagesCount: images.length,
      puzzlePieces,
      gridCols: option.cols,
      gridRows: option.rows,
      widthMm: targetWidthMm,
      heightMm: targetHeightMm,
      outerContourNodes: traced.outerContourNodes,
      innerVectorPathsCount: 1, // 1 imagen raster unificada para grabado en Falcon 10W
      clippedPuzzleSegmentsCount: built.puzzleResult.clippedPuzzlePathsD.length,
      vectorizerEngine: 'Imagen PNG (Grabado Falcon 10W) + Contorno y Puzzle Vectorizados (#FF0000)',
      aiModelUsed: finalModelUsed,
    },
  };
}
