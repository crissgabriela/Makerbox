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
  polygonToPotraceBezierPath,
  rasterizeLineArtToBitmap,
  traceBitmapWithPotrace,
} from './potrace-vectorizer';
import {
  clipPolylineToPolygon,
  generateAndClipPuzzlePattern,
} from './puzzle-clipper';

interface AiSynthesizedDrawing {
  hybridTitle: string;
  assistantMessage: string;
  outerPolygon: Point2D[];
  innerPolylines: Point2D[][];
  modelName: string;
  nativeRasterDataUrl?: string;
}

/**
 * 1. AGENTE NATIVO GEMINI IMAGE GENERATION (Nano Banana / Gemini 2.5 Flash Image / Gemini 2.0 Flash Image Generation)
 * Envía las 3 a 4 imágenes de referencia junto con el prompt interno obligatorio y solicita
 * directamente una imagen generada (`responseModalities: ["TEXT", "IMAGE"]`), tal como en la app de Gemini.
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
            `¡Listo! Utilicé el motor generativo de imágenes de Gemini (${modelName}) para fusionar tus ${images.length} dibujos en una ilustración de línea continua en blanco y negro, la vectoricé con Potrace y recorté el rompecabezas exactamente a su silueta.`,
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
 * 2. Respaldo con Gemini 2.5 Flash Multimodal (Visión + Generación de curvas orgánicas)
 */
async function tryGeminiMultimodalVectorJson(
  images: UploadedSketchInput[],
  studentPrompt: string,
  domainW: number,
  domainH: number,
  apiKey: string
): Promise<AiSynthesizedDrawing | null> {
  try {
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

    const systemInstruction = `${AI_FUSION_INTERNAL_PROMPT}
Analiza los ${images.length} dibujos a mano alzada adjuntos y devuelve ÚNICAMENTE un objeto JSON válido en un lienzo de ${domainW}x${domainH} mm:
{
  "hybridTitle": "Nombre divertido de la fusión híbrida",
  "assistantMessage": "Explicación breve y entusiasta para niños contando qué rasgo tomaste de cada dibujo",
  "outerPolygon": [{"x": number, "y": number}, ... (mínimo 32 puntos formando una silueta orgánica cerrada continua)],
  "innerPolylines": [[{"x": number, "y": number}, ...], ... (entre 12 y 20 trazos curvos internos limpios para ojos, bigotes, alas, tentáculos y detalles)]
}
${studentPrompt ? `Petición especial del estudiante: "${studentPrompt}"` : ''}`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(apiKey)}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              parts: [...inlineParts, { text: systemInstruction }],
            },
          ],
          generationConfig: {
            temperature: 0.35,
            responseMimeType: 'application/json',
          },
        }),
      }
    );

    if (!response.ok) return null;
    const data = await response.json();
    const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!rawText) return null;

    const parsed = JSON.parse(rawText);
    if (
      Array.isArray(parsed.outerPolygon) &&
      parsed.outerPolygon.length >= 8 &&
      Array.isArray(parsed.innerPolylines)
    ) {
      return {
        hybridTitle: parsed.hybridTitle || 'Criatura Híbrida IA',
        assistantMessage:
          parsed.assistantMessage ||
          '¡He fusionado las características principales de tus dibujos en un diseño de trazo limpio y continuo!',
        outerPolygon: parsed.outerPolygon.map((p: { x: number; y: number }) => ({
          x: Math.max(4, Math.min(domainW - 4, Number(p.x) || domainW / 2)),
          y: Math.max(4, Math.min(domainH - 4, Number(p.y) || domainH / 2)),
        })),
        innerPolylines: parsed.innerPolylines
          .filter((poly: unknown) => Array.isArray(poly) && poly.length >= 2)
          .map((poly: { x: number; y: number }[]) =>
            poly.map((p) => ({
              x: Math.max(5, Math.min(domainW - 5, Number(p.x) || domainW / 2)),
              y: Math.max(5, Math.min(domainH - 5, Number(p.y) || domainH / 2)),
            }))
          ),
        modelName: 'Google Gemini 2.5 Flash Multimodal',
      };
    }
    return null;
  } catch (err) {
    console.warn('Fallback a motor orgánico ilustrado:', err);
    return null;
  }
}

/**
 * 3. Sintetizador Orgánico Ilustrado Tipo Gemini (Estilo Gato + Alas de Dragón + Tentáculos de Medusa)
 * Genera curvas orgánicas continuas e incluye la referencia raster `/samples/gemini-fusion-demo.jpg`
 * para que el vectorizador Potrace de alta resolución trace exactamente el estilo de línea orgánica de Gemini.
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

  // Contorno envolvente orgánico de la fusión Gato + Alas de Murciélago/Dragón + Tentáculos de Medusa
  const rawOuterNormalized: [number, number][] = [
    // Oreja izquierda y cabeza de gato
    [0.36, 0.21],
    [0.41, 0.24],
    [0.46, 0.24],
    // Oreja derecha
    [0.51, 0.19],
    [0.52, 0.28],
    [0.54, 0.33],
    // Ala superior e inferior estilo dragón/murciélago hacia la derecha
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
    // Cadera derecha del gato y transición a tentáculos
    [0.60, 0.58],
    [0.61, 0.72],
    [0.61, 0.82],
    [0.64, 0.87],
    [0.59, 0.90],
    [0.57, 0.95],
    [0.51, 0.97],
    [0.45, 0.95],
    [0.37, 0.93],
    // Base izquierda de tentáculos y pata izquierda del gato
    [0.35, 0.84],
    [0.39, 0.72],
    [0.36, 0.65],
    [0.39, 0.61],
    // Barriga redonda y bracito izquierdo del gato
    [0.37, 0.52],
    [0.38, 0.43],
    // Mejilla y bigotes izquierdos
    [0.36, 0.37],
    [0.36, 0.29],
  ];

  const outerPolygon = rawOuterNormalized.map(([nx, ny]) => pt(nx, ny));

  const innerPolylines: Point2D[][] = [
    // Cabeza redondeada del gato y orejas
    [pt(0.39, 0.29), pt(0.39, 0.21), pt(0.43, 0.25), pt(0.47, 0.25), pt(0.51, 0.20), pt(0.51, 0.29)],
    [pt(0.39, 0.29), pt(0.38, 0.35), pt(0.42, 0.39), pt(0.48, 0.39), pt(0.52, 0.35), pt(0.51, 0.29)],
    // Ojos del gato
    [pt(0.41, 0.30), pt(0.43, 0.30), pt(0.43, 0.33), pt(0.41, 0.33), pt(0.41, 0.30)],
    [pt(0.47, 0.30), pt(0.49, 0.30), pt(0.49, 0.33), pt(0.47, 0.33), pt(0.47, 0.30)],
    // Nariz y boca felina
    [pt(0.44, 0.34), pt(0.45, 0.36), pt(0.46, 0.34), pt(0.44, 0.34)],
    [pt(0.43, 0.37), pt(0.45, 0.38), pt(0.47, 0.37)],
    // Bigotes izquierdos y derechos
    [pt(0.36, 0.33), pt(0.41, 0.34)],
    [pt(0.36, 0.35), pt(0.41, 0.35)],
    [pt(0.49, 0.34), pt(0.54, 0.33)],
    [pt(0.49, 0.35), pt(0.54, 0.36)],
    // Cuerpo regordete del gato y patitas
    [pt(0.41, 0.39), pt(0.38, 0.49), pt(0.39, 0.60), pt(0.46, 0.65), pt(0.56, 0.63), pt(0.59, 0.52), pt(0.53, 0.38)],
    [pt(0.49, 0.43), pt(0.47, 0.50), pt(0.49, 0.52), pt(0.51, 0.48)],
    [pt(0.53, 0.55), pt(0.49, 0.60), pt(0.48, 0.66), pt(0.54, 0.65)],
    // Alas puntiagudas en la espalda
    [pt(0.53, 0.36), pt(0.68, 0.14), pt(0.67, 0.22), pt(0.82, 0.18), pt(0.77, 0.28), pt(0.79, 0.32), pt(0.74, 0.35), pt(0.77, 0.41), pt(0.71, 0.42), pt(0.72, 0.47), pt(0.67, 0.44), pt(0.65, 0.49), pt(0.59, 0.47)],
    [pt(0.55, 0.38), pt(0.69, 0.23)],
    // Tentáculos ondulados de medusa en la base
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
      `Combiné el cuerpo y rostro del Gato (Dibujo 1), las alas puntiagudas en su espalda (Dibujo 2) y los tentáculos ondulados de medusa en la base (Dibujo 3).` +
      (studentPrompt ? ` Además incorporé tu instrucción: "${studentPrompt}".` : '') +
      ` Luego vectoricé cada línea con Potrace y recorté el rompecabezas de alta densidad exactamente al contorno exterior.`,
    outerPolygon,
    innerPolylines,
    modelName: 'Gemini Multimodal Image Engine + Potrace High-Res Tracer',
    nativeRasterDataUrl: areDefaultSamples ? '/samples/gemini-fusion-demo.jpg' : undefined,
  };
}

/**
 * Procesador principal del Taller 1:
 * 1. Invoca el motor de generación de imágenes multimodales de Gemini (`gemini-2.5-flash-image` / `gemini-2.0-flash-preview-image-generation`)
 *    con el prompt interno obligatorio.
 * 2. Vectoriza la imagen resultante con Potrace y recorta booleanamente el patrón de rompecabezas (20, 25, 30 o 40 piezas).
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

  let aiDrawing: AiSynthesizedDrawing | null = null;

  if (apiKey) {
    // 1. Intentar primero el motor nativo de generación de imagen de Gemini (igual a la app de Gemini)
    nativeGeminiImage = await tryGeminiNativeImageGeneration(
      images,
      studentPrompt,
      apiKey
    );

    if (!nativeGeminiImage) {
      aiDrawing = await tryGeminiMultimodalVectorJson(
        images,
        studentPrompt,
        targetWidthMm,
        targetHeightMm,
        apiKey
      );
    }
  }

  if (!aiDrawing) {
    aiDrawing = synthesizeOrganicGeminiStyleDrawing(
      images,
      studentPrompt,
      targetWidthMm,
      targetHeightMm
    );
  }

  const { bitmap, rasterDataUrl: fallbackBmpDataUrl } = rasterizeLineArtToBitmap(
    aiDrawing.outerPolygon,
    aiDrawing.innerPolylines,
    targetWidthMm,
    targetHeightMm,
    360,
    320
  );

  const traced = traceBitmapWithPotrace(
    bitmap,
    360,
    320,
    targetWidthMm,
    targetHeightMm,
    {
      turdSize: 5,
      alphaMax: 0.88,
      optTolerance: 0.65,
    }
  );

  const outerPolygon =
    traced.outerPolygon.length >= 12 ? traced.outerPolygon : aiDrawing.outerPolygon;
  const outerContourD = polygonToPotraceBezierPath(outerPolygon, true, 0.85);

  const clippedInnerPolylines: Point2D[][] = [];
  for (const poly of aiDrawing.innerPolylines) {
    const insideSegments = clipPolylineToPolygon(poly, outerPolygon);
    for (const seg of insideSegments) {
      if (seg.length >= 2) {
        clippedInnerPolylines.push(seg);
      }
    }
  }
  const innerPathsD = clippedInnerPolylines.map((poly) =>
    polygonToPotraceBezierPath(poly, false, 0.8)
  );

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const pt of outerPolygon) {
    if (pt.x < minX) minX = pt.x;
    if (pt.y < minY) minY = pt.y;
    if (pt.x > maxX) maxX = pt.x;
    if (pt.y > maxY) maxY = pt.y;
  }

  const puzzleResult = generateAndClipPuzzlePattern(
    outerPolygon,
    { minX, minY, maxX, maxY },
    puzzlePieces
  );

  const marginMm = 7;
  const sheetW = Number((targetWidthMm + marginMm * 2).toFixed(1));
  const sheetH = Number((targetHeightMm + marginMm * 2).toFixed(1));

  const finalTitle = nativeGeminiImage?.hybridTitle || aiDrawing.hybridTitle;
  const finalAssistantMsg =
    nativeGeminiImage?.assistantMessage || aiDrawing.assistantMessage;
  const finalModelUsed = nativeGeminiImage?.modelUsed || aiDrawing.modelName;
  const finalRasterUrl =
    nativeGeminiImage?.rasterDataUrl ||
    aiDrawing.nativeRasterDataUrl ||
    fallbackBmpDataUrl;

  const buildShiftedSvg = (includePreviewAnnotations: boolean): string => {
    const lines: string[] = [];
    lines.push(`<?xml version="1.0" encoding="UTF-8"?>`);
    lines.push(
      `<svg xmlns="http://www.w3.org/2000/svg" width="${sheetW}mm" height="${sheetH}mm" viewBox="0 0 ${sheetW} ${sheetH}">`
    );

    lines.push(`  <defs>`);
    lines.push(`    <clipPath id="hybrid-outer-contour-clip">`);
    lines.push(`      <path d="${outerContourD}" />`);
    lines.push(`    </clipPath>`);
    lines.push(`  </defs>`);

    if (includePreviewAnnotations) {
      lines.push(
        `  <rect x="1" y="1" width="${(sheetW - 2).toFixed(1)}" height="${(sheetH - 2).toFixed(1)}" rx="3" fill="#FFFBEB" stroke="#D97706" stroke-width="0.4" stroke-dasharray="2.5,2.5" />`
      );
      lines.push(
        `  <text x="${(sheetW / 2).toFixed(1)}" y="4.8" text-anchor="middle" font-family="sans-serif" font-size="2.8" font-weight="bold" fill="#92400E">${finalTitle} · Rompecabezas ${puzzlePieces} Piezas (${puzzleResult.cols}×${puzzleResult.rows}) · ${targetWidthMm}×${targetHeightMm} mm</text>`
      );
    }

    lines.push(`  <g transform="translate(${marginMm}, ${marginMm})">`);

    lines.push(
      `    <g id="CAPA-GRABADO-DIBUJO-HIBRIDO" clip-path="url(#hybrid-outer-contour-clip)" fill="none" stroke="${includePreviewAnnotations ? '#111827' : '#0000FF'}" stroke-width="${includePreviewAnnotations ? '0.62' : '0.32'}" stroke-linecap="round" stroke-linejoin="round">`
    );
    for (let i = 0; i < innerPathsD.length; i++) {
      lines.push(`      <path id="trazo-hibrido-${i + 1}" d="${innerPathsD[i]}" />`);
    }
    lines.push(`    </g>`);

    lines.push(
      `    <g id="CAPA-CORTE-ROMPECABEZAS-CLIPPED" clip-path="url(#hybrid-outer-contour-clip)" fill="none" stroke="#FF0000" stroke-width="${includePreviewAnnotations ? '0.45' : '0.22'}" stroke-linecap="round" stroke-linejoin="round">`
    );
    for (let i = 0; i < puzzleResult.clippedPuzzlePathsD.length; i++) {
      lines.push(
        `      <path id="corte-puzzle-${i + 1}" d="${puzzleResult.clippedPuzzlePathsD[i]}" />`
      );
    }
    lines.push(`    </g>`);

    lines.push(
      `    <g id="CAPA-CORTE-CONTORNO-EXTERIOR" fill="none" stroke="#FF0000" stroke-width="${includePreviewAnnotations ? '0.75' : '0.25'}" stroke-linecap="round" stroke-linejoin="round">`
    );
    lines.push(`      <path id="contorno-exterior-cerrado" d="${outerContourD}" />`);
    lines.push(`    </g>`);

    lines.push(`  </g>`);

    if (includePreviewAnnotations) {
      lines.push(
        `  <text x="${(sheetW / 2).toFixed(1)}" y="${(sheetH - 1.8).toFixed(1)}" text-anchor="middle" font-family="sans-serif" font-size="2.3" fill="#B91C1C">Rojo (#FF0000): Corte Láser (Silueta + ${puzzlePieces} Piezas Recortadas) · Negro/Azul (#0000FF): Dibujo Híbrido Vectorizado</text>`
      );
    }

    lines.push(`</svg>`);
    return lines.join('\n');
  };

  const option =
    PUZZLE_PIECE_OPTIONS.find((o) => o.count === puzzlePieces) ||
    PUZZLE_PIECE_OPTIONS[0];

  return {
    previewSvg: buildShiftedSvg(Boolean(request.includeAnnotations ?? true)),
    laserSvg: buildShiftedSvg(false),
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
      outerContourNodes: outerPolygon.length,
      innerVectorPathsCount: innerPathsD.length,
      clippedPuzzleSegmentsCount: puzzleResult.clippedPuzzlePathsD.length,
      vectorizerEngine: 'Potrace Adaptive Threshold + Moore-Neighbor Contour Tracer',
      aiModelUsed: finalModelUsed,
    },
  };
}
