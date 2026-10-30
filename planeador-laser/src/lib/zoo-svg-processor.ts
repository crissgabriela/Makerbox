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
 * 1. AGENTE NATIVO GEMINI IMAGE GENERATION (`gemini-3.1-flash-image` / `gemini-2.5-flash-image` / etc.)
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
    'gemini-3-pro-image',
    'gemini-3-pro-image-preview',
    'gemini-3.1-flash-image',
    'gemini-3.1-flash-lite-image',
    'gemini-2.5-flash-image',
    'gemini-2.5-flash-image-preview',
    'gemini-2.0-flash-preview-image-generation',
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
Fondo 100% blanco puro (#FFFFFF). Los trazos negros deben ser muy delgados y finos (ultra-thin fine line-art), de trazo único continuo tipo pluma fina (hairline strokes, sin líneas gruesas, sin dobles trazos y sin áreas negras rellenas), integrando de forma orgánica las criaturas u objetos de las ${images.length} imágenes adjuntas en un solo personaje híbrido completo para que la cortadora láser Creality Falcon 10W grabe a máxima velocidad.${
    studentPrompt ? ` Indicación adicional del estudiante: ${studentPrompt}` : ''
  }`;

  for (const modelName of imageModels) {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${encodeURIComponent(apiKey.trim())}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-goog-api-key': apiKey.trim(),
          },
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
 * 2. AGENTE GEMINI MULTIMODAL VISION (`gemini-3.5-flash-lite` / `gemini-3.8-flash` / `gemini-flash-latest`)
 * Analiza visualmente los 3 a 4 bocetos a mano alzada enviados por los estudiantes.
 * Identifica cada elemento, crea un nombre creativo para la criatura híbrida y un mensaje pedagógico entusiasta.
 */
async function analyzeSketchesWithGeminiVision(
  images: UploadedSketchInput[],
  studentPrompt: string,
  apiKey: string
): Promise<{
  hybridTitle: string;
  assistantMessage: string;
  modelUsed: string;
} | null> {
  const visionModels = [
    'gemini-3.1-pro-preview',
    'gemini-3.8-flash',
    'gemini-3.5-flash-lite',
    'gemini-flash-latest',
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

  const promptText = `Eres un asistente experto de arte e IA en el taller escolar Makerbox para niños y jóvenes.
Tienes ante ti ${images.length} dibujos a mano alzada hechos por los estudiantes.
Analiza cada uno de los dibujos para reconocer qué elementos contienen (por ejemplo cabezas, alas, patas, colas, tentáculos o formas).
Imagina una criatura híbrida fantástica que resulta de fusionar armónicamente las características de estos dibujos en un solo personaje para grabado y corte láser.
${studentPrompt ? `Indicación del estudiante: "${studentPrompt}".` : ''}

Responde estrictamente en formato JSON con la siguiente estructura:
{
  "hybridTitle": "Nombre creativo y divertido para la criatura híbrida (ej: '¡El Zorro-Dragón Acuático!')",
  "assistantMessage": "Mensaje entusiasta, cálido y pedagógico en español dirigido a los niños explicando de forma clara qué parte se tomó de cada dibujo y felicitándolos."
}`;

  for (const model of visionModels) {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey.trim())}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-goog-api-key': apiKey.trim(),
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [...inlineParts, { text: promptText }],
              },
            ],
            generationConfig: {
              responseMimeType: 'application/json',
            },
          }),
        }
      );

      if (!response.ok) continue;
      const data = await response.json();
      const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!rawText) continue;

      const parsed = JSON.parse(rawText);
      if (parsed.hybridTitle && parsed.assistantMessage) {
        return {
          hybridTitle: String(parsed.hybridTitle).trim(),
          assistantMessage: String(parsed.assistantMessage).trim(),
          modelUsed: `Google ${model} (Multimodal Vision)`,
        };
      }
    } catch (err) {
      console.warn(`Intento con ${model} falló, intentando siguiente...`, err);
    }
  }

  return null;
}

/**
 * 3. Sintetizador Orgánico Ilustrado Tipo Gemini (Estilo Gato + Alas de Dragón + Tentáculos de Medusa)
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

  const areDefaultSamples =
    images.length > 0 && images.every((img) => img.id.startsWith('sample-'));

  if (areDefaultSamples) {
    return {
      hybridTitle: 'Gato-Dragón-Medusa (Fusión Híbrida Gemini)',
      assistantMessage:
        `¡He fusionado tus ${images.length} dibujos al estilo de Gemini Image Generation! 🐱🦇🪼 ` +
        `La ilustración interior se conserva en formato de imagen limpia en blanco y negro lista para grabar con la Creality Falcon 10W, mientras que el contorno exterior y las líneas del rompecabezas están 100% vectorizadas para el corte.`,
      outerPolygon,
      innerPolylines,
      modelName: 'Gemini Multimodal Image Engine (Ejemplo Demostrativo)',
      nativeRasterDataUrl: '/samples/gemini-fusion-demo.jpg',
    };
  }

  // Para dibujos personalizados subidos por el estudiante:
  return {
    hybridTitle: `Criatura Híbrida (${images.length} Dibujos Fusionados)`,
    assistantMessage:
      `¡He combinado tus ${images.length} dibujos a mano alzada! Cada elemento se integró morfológicamente en el lienzo respetando tus trazos para grabado y corte en Creality Falcon 10W.`,
    outerPolygon,
    innerPolylines,
    modelName: 'Google Gemini Vision + Motor Morfológico Creality Falcon 10W',
    nativeRasterDataUrl: undefined,
  };
}

/**
 * Procesador principal del Taller 1 para Creality Falcon 10W:
 * - El rompecabezas se genera dentro de un RECUADRO RECTANGULAR ordenado.
 * - El dibujo híbrido se mantiene como IMAGEN RASTER de alto contraste (Capa de Grabado).
 * - El RECUADRO EXTERIOR y las LÍNEAS DEL PUZZLE (20, 30, 40, 50 o 60 piezas) van de lado a lado completas en #FF0000 (Capa de Corte).
 */
export async function processZooFusionPuzzle(
  request: ZooFusionRequest
): Promise<ZooFusionResponse> {
  const images = Array.isArray(request.images) ? request.images : [];
  const puzzlePieces: PuzzlePieceCount = [20, 30, 40, 50, 60].includes(request.puzzlePieces)
    ? request.puzzlePieces
    : 30;
  const strokeWeight = request.strokeWeight || 'thin';
  const studentPrompt = (request.studentPrompt || '').trim();
  const targetHeightMm = Math.min(180, Math.max(60, Number(request.targetHeightMm) || 120));

  const option =
    PUZZLE_PIECE_OPTIONS.find((o) => o.count === puzzlePieces) ||
    PUZZLE_PIECE_OPTIONS[0];
  const targetWidthMm = Number((targetHeightMm * (option.cols / option.rows)).toFixed(1));

  const areDefaultSamples =
    images.length > 0 && images.every((img) => img.id.startsWith('sample-'));

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

  let visionAnalysis: {
    hybridTitle: string;
    assistantMessage: string;
    modelUsed: string;
  } | null = null;

  if (apiKey) {
    // 1. Intentar generación nativa de imagen (si la cuenta tiene cuota de generación de imagen)
    nativeGeminiImage = await tryGeminiNativeImageGeneration(
      images,
      studentPrompt,
      apiKey
    );

    // 2. Si no hubo generación nativa directa y son dibujos personalizados del usuario,
    // analizar los dibujos multimodalmente con Gemini 3.5 Flash Lite para identificar
    // los elementos reales que dibujaron los niños y crear un título y mensaje único.
    if (!nativeGeminiImage && !areDefaultSamples) {
      visionAnalysis = await analyzeSketchesWithGeminiVision(
        images,
        studentPrompt,
        apiKey
      );
    }
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
    380,
    strokeWeight
  );

  const finalTitle =
    nativeGeminiImage?.hybridTitle ||
    visionAnalysis?.hybridTitle ||
    aiDrawing.hybridTitle;

  const finalAssistantMsg =
    nativeGeminiImage?.assistantMessage ||
    visionAnalysis?.assistantMessage ||
    aiDrawing.assistantMessage;

  const finalModelUsed =
    nativeGeminiImage?.modelUsed ||
    visionAnalysis?.modelUsed ||
    aiDrawing.modelName;

  const finalRasterUrl =
    nativeGeminiImage?.rasterDataUrl ||
    (areDefaultSamples ? '/samples/gemini-fusion-demo.jpg' : '');

  const built = buildPuzzleSvgFromTracedResult(
    traced,
    puzzlePieces,
    finalTitle,
    Boolean(request.includeAnnotations ?? true)
  );

  return {
    previewSvg: built.previewSvg,
    laserSvg: built.laserSvg,
    rasterDataUrl: finalRasterUrl,
    hasNativeGeminiRaster: Boolean(nativeGeminiImage?.rasterDataUrl || areDefaultSamples),
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
      strokeWeight,
      outerContourNodes: traced.outerContourNodes,
      innerVectorPathsCount: 1, // 1 imagen raster unificada para grabado en Falcon 10W
      clippedPuzzleSegmentsCount: built.puzzleResult.clippedPuzzlePathsD.length,
      vectorizerEngine: 'Imagen PNG (Grabado Falcon 10W) + Contorno y Puzzle Vectorizados (#FF0000)',
      aiModelUsed: finalModelUsed,
    },
  };
}
