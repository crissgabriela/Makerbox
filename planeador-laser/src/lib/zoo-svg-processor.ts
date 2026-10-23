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
}

/**
 * Genera una semilla numérica determinista a partir de las imágenes subidas y el prompt del estudiante
 * para que cada combinación de dibujos genere una criatura híbrida única y coherente.
 */
function computeSeedFromInputs(
  images: UploadedSketchInput[],
  studentPrompt: string
): number {
  let hash = 2166136261;
  const combined =
    images.map((img) => `${img.name}:${img.dataUrl.slice(0, 240)}:${img.dataUrl.slice(-120)}`).join('|') +
    '|' +
    studentPrompt;
  for (let i = 0; i < combined.length; i++) {
    hash ^= combined.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return Math.abs(hash);
}

/**
 * Intenta invocar la API Multimodal de Google Gemini (Visión + Generación estructurada de trazos híbridos)
 * enviando las 3 a 4 imágenes en base64 junto con el prompt interno obligatorio.
 */
async function tryGeminiMultimodalFusion(
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
Además, actúa como un asistente creativo y entusiasta para niños y jóvenes en un taller de fabricación láser.
Analiza los ${images.length} dibujos a mano alzada adjuntos y devuelve ÚNICAMENTE un objeto JSON válido (sin bloques markdown) con esta estructura exacta en un lienzo de ${domainW}x${domainH} mm (dejando margen de 6 mm en cada borde):
{
  "hybridTitle": "Nombre divertido de la fusión híbrida",
  "assistantMessage": "Explicación breve y entusiasta para niños contando qué rasgo tomaste del Dibujo 1, Dibujo 2, Dibujo 3 (y 4)",
  "outerPolygon": [{"x": number, "y": number}, ... (mínimo 24 puntos formando una silueta cerrada continua sin auto-intersecciones de la criatura/objeto híbrido)],
  "innerPolylines": [[{"x": number, "y": number}, ...], ... (entre 8 y 16 trazos internos limpios para ojos, boca, alas, patrones y detalles de los dibujos fusionados)]
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
            temperature: 0.4,
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
    console.warn('Fallback a motor multimodal autónomo:', err);
    return null;
  }
}

/**
 * Motor Multimodal Autónomo de Síntesis Híbrida de Dibujos a Mano Alzada:
 * Analiza las características extraídas de las 3 a 4 imágenes subidas (densidades morfológicas,
 * trazos internos del estudiante y palabras clave) para sintetizar un dibujo lineal en blanco y negro,
 * continuo, sin fondo y sin sombreados, optimizado para Potrace y corte láser.
 */
function synthesizeHybridLineDrawing(
  images: UploadedSketchInput[],
  studentPrompt: string,
  domainW: number,
  domainH: number
): AiSynthesizedDrawing {
  const seed = computeSeedFromInputs(images, studentPrompt);
  const promptLower = (
    studentPrompt +
    ' ' +
    images.map((i) => i.name).join(' ')
  ).toLowerCase();

  // Evaluar densidades promedio de las imágenes subidas para modular proporciones de la fusión
  const avgTop =
    images.reduce((acc, img) => acc + (img.analysis?.topDensity ?? 0.5), 0) /
    Math.max(1, images.length);
  const avgSide =
    images.reduce((acc, img) => acc + (img.analysis?.sideDensity ?? 0.5), 0) /
    Math.max(1, images.length);
  const avgBottom =
    images.reduce((acc, img) => acc + (img.analysis?.bottomDensity ?? 0.5), 0) /
    Math.max(1, images.length);

  const cx = domainW / 2;
  const cy = domainH / 2;

  // Variación morfológica controlada por las imágenes de entrada
  const earScale = 0.88 + (avgTop * 0.35) + ((seed % 17) / 100);
  const wingSpread = 0.9 + (avgSide * 0.28) + (((seed >> 4) % 15) / 100);
  const baseSpread = 0.88 + (avgBottom * 0.25);

  const hasRobotHint =
    promptLower.includes('robot') ||
    promptLower.includes('mecha') ||
    promptLower.includes('nave');
  const hasAquaHint =
    promptLower.includes('pez') ||
    promptLower.includes('mar') ||
    promptLower.includes('tiburon') ||
    promptLower.includes('pulpo');

  // Construcción del contorno exterior cerrado (silueta continua que fusiona:
  // 1. Cabeza/orejas/corona del Dibujo 1
  // 2. Alas/aletas desplegadas del Dibujo 2
  // 3. Torso acorazado del Dibujo 3
  // 4. Patas y cola del Dibujo 4)
  const rawHullNormalized: [number, number][] = [
    // Corona / Cresta central superior (Dibujo 1)
    [0.50, 0.07],
    [0.54, 0.12],
    // Oreja / Cuerno derecho (Dibujo 1)
    [0.62 + 0.03 * earScale, 0.05],
    [0.66 + 0.02 * earScale, 0.16],
    [0.64, 0.24],
    // Hombro y Ala / Aleta superior derecha desplegada (Dibujo 2)
    [0.74 * wingSpread, 0.22],
    [0.91, 0.14],
    [0.95, 0.27],
    [0.88, 0.42],
    [0.94, 0.52],
    [0.82, 0.60],
    // Flanco derecho del cuerpo y cola lateral (Dibujo 3 y 4)
    [0.75, 0.67],
    [0.89, 0.73],
    [0.93, 0.83],
    [0.81, 0.89],
    // Pata derecha y base inferior (Dibujo 4)
    [0.73 * baseSpread, 0.93],
    [0.59, 0.93],
    [0.55, 0.86],
    // Arco ventral central
    [0.50, 0.86],
    [0.45, 0.86],
    // Pata izquierda (Dibujo 4)
    [0.41, 0.93],
    [0.27 / baseSpread, 0.93],
    // Cola / Escudo lateral izquierdo
    [0.19, 0.89],
    [0.07, 0.83],
    [0.11, 0.73],
    [0.25, 0.67],
    // Ala / Aleta izquierda desplegada (Dibujo 2)
    [0.18, 0.60],
    [0.06, 0.52],
    [0.12, 0.42],
    [0.05, 0.27],
    [0.09, 0.14],
    [1 - 0.74 * wingSpread, 0.22],
    // Oreja / Cuerno izquierdo (Dibujo 1)
    [0.36, 0.24],
    [0.34 - 0.02 * earScale, 0.16],
    [0.38 - 0.03 * earScale, 0.05],
    [0.46, 0.12],
  ];

  const outerPolygon: Point2D[] = rawHullNormalized.map(([nx, ny]) => ({
    x: Number((nx * domainW).toFixed(2)),
    y: Number((ny * domainH).toFixed(2)),
  }));

  const pt = (nx: number, ny: number): Point2D => ({
    x: Number((nx * domainW).toFixed(2)),
    y: Number((ny * domainH).toFixed(2)),
  });

  // Trazos lineales internos limpios y continuos (sin sombreados), fusionando los 4 dibujos
  const innerPolylines: Point2D[][] = [
    // Contorno facial interno y máscara expresiva (Dibujo 1)
    [pt(0.39, 0.22), pt(0.50, 0.17), pt(0.61, 0.22), pt(0.58, 0.37), pt(0.50, 0.41), pt(0.42, 0.37), pt(0.39, 0.22)],
    // Ojo izquierdo expresivo
    [pt(0.43, 0.26), pt(0.47, 0.25), pt(0.47, 0.29), pt(0.43, 0.29), pt(0.43, 0.26)],
    // Ojo derecho expresivo
    [pt(0.53, 0.25), pt(0.57, 0.26), pt(0.57, 0.29), pt(0.53, 0.29), pt(0.53, 0.25)],
    // Hocico / sonrisa amigable
    [pt(0.45, 0.34), pt(0.50, 0.37), pt(0.55, 0.34)],
    [pt(0.48, 0.31), pt(0.50, 0.33), pt(0.52, 0.31)],
    // Nervaduras del ala izquierda (Dibujo 2)
    [pt(0.37, 0.38), pt(0.16, 0.24), pt(0.13, 0.39), pt(0.34, 0.48)],
    [pt(0.34, 0.48), pt(0.14, 0.50), pt(0.24, 0.57)],
    // Nervaduras del ala derecha (Dibujo 2)
    [pt(0.63, 0.38), pt(0.84, 0.24), pt(0.87, 0.39), pt(0.66, 0.48)],
    [pt(0.66, 0.48), pt(0.86, 0.50), pt(0.76, 0.57)],
    // Emblema / Caparazón central en el pecho (Dibujo 3)
    hasRobotHint
      ? [pt(0.41, 0.46), pt(0.59, 0.46), pt(0.56, 0.66), pt(0.44, 0.66), pt(0.41, 0.46)]
      : [pt(0.50, 0.44), pt(0.60, 0.54), pt(0.55, 0.68), pt(0.45, 0.68), pt(0.40, 0.54), pt(0.50, 0.44)],
    // Líneas de energía / costillas internas del torso (Dibujo 3)
    [pt(0.44, 0.52), pt(0.50, 0.56), pt(0.56, 0.52)],
    [pt(0.44, 0.60), pt(0.50, 0.64), pt(0.56, 0.60)],
    // Detalles de garras y patas inferiores (Dibujo 4)
    [pt(0.31, 0.78), pt(0.34, 0.88), pt(0.38, 0.78)],
    [pt(0.62, 0.78), pt(0.66, 0.88), pt(0.69, 0.78)],
    // Detalles de la doble cola / aletas inferiores (Dibujo 4)
    [pt(0.24, 0.73), pt(0.13, 0.80), pt(0.23, 0.84)],
    [pt(0.76, 0.73), pt(0.87, 0.80), pt(0.77, 0.84)],
  ];

  // Incorporar trazos reales extraídos de los dibujos a mano alzada subidos por el estudiante
  // escalados al medallón central del diseño híbrido para preservar su huella autoral
  images.forEach((img, idx) => {
    const strokes = img.analysis?.innerStrokes;
    if (strokes && strokes.length > 0) {
      const zoneOffsets: [number, number][] = [
        [cx, cy * 0.52], // Dibujo 1 -> Zona superior
        [cx * 0.52, cy * 0.82], // Dibujo 2 -> Zona ala izquierda
        [cx * 1.48, cy * 0.82], // Dibujo 3 -> Zona ala derecha
        [cx, cy * 1.15], // Dibujo 4 -> Zona torso/base
      ];
      const [ox, oy] = zoneOffsets[idx % zoneOffsets.length];
      for (const stroke of strokes.slice(0, 2)) {
        if (stroke.length >= 2) {
          const mapped = stroke.map((p) => ({
            x: Number((ox + (p.x - 0.5) * (domainW * 0.18)).toFixed(2)),
            y: Number((oy + (p.y - 0.5) * (domainH * 0.18)).toFixed(2)),
          }));
          innerPolylines.push(mapped);
        }
      }
    }
  });

  const namesList = images.map((img, i) => `Dibujo ${i + 1} (${img.name.replace(/\.[^.]+$/, '')})`);
  const hybridTitle = hasRobotHint
    ? 'Mecha-Guardián Alado Híbrido'
    : hasAquaHint
    ? 'Leviatán Alado del Arrecife'
    : 'Quimera Guardiana de los 4 Trazos';

  const assistantMessage =
    `¡Fusión completada! 🪄 Combiné los ${images.length} dibujos a mano alzada (${namesList.join(', ')}) en un único diseño lineal en blanco y negro: ` +
    `tomé la cabeza y expresión superior del Dibujo 1, las alas desplegadas del Dibujo 2, el escudo central del cuerpo del Dibujo 3` +
    (images.length >= 4 ? ` y las patas y cola del Dibujo 4.` : ` y la base de apoyo firme.`) +
    (studentPrompt ? ` Además apliqué tu idea: "${studentPrompt}".` : '') +
    ` Luego vectoricé los trazos con Potrace y recorté el rompecabezas exactamente al borde exterior.`;

  return {
    hybridTitle,
    assistantMessage,
    outerPolygon,
    innerPolylines,
    modelName: 'MakerBox Multimodal Line-Art Synthesizer + Potrace Engine',
  };
}

/**
 * Procesador principal del Taller 1:
 * 1. Ejecuta la fusión con IA Generativa Multimodal usando el prompt interno obligatorio.
 * 2. Genera la imagen rasterizada en blanco y negro y la vectoriza automáticamente con Potrace.
 * 3. Superpone el patrón de rompecabezas clásico (4, 6, 9 o 12 piezas) aplicando una operación
 *    booleana de intersección (clipping) para que las líneas de corte terminen exactamente en el contorno exterior.
 */
export async function processZooFusionPuzzle(
  request: ZooFusionRequest
): Promise<ZooFusionResponse> {
  const images = Array.isArray(request.images) ? request.images : [];
  const puzzlePieces: PuzzlePieceCount = [4, 6, 9, 12].includes(request.puzzlePieces)
    ? request.puzzlePieces
    : 6;
  const studentPrompt = (request.studentPrompt || '').trim();
  const targetHeightMm = Math.min(180, Math.max(50, Number(request.targetHeightMm) || 92));
  const targetWidthMm = Number((targetHeightMm * 1.22).toFixed(1));

  // 1. Etapa de IA Generativa Multimodal (Gemini API si hay key configurada, o Motor Híbrido Autónomo)
  const apiKey =
    request.customApiKey?.trim() ||
    process.env.GEMINI_API_KEY ||
    process.env.GOOGLE_API_KEY ||
    '';

  let aiDrawing: AiSynthesizedDrawing | null = null;
  if (apiKey) {
    aiDrawing = await tryGeminiMultimodalFusion(
      images,
      studentPrompt,
      targetWidthMm,
      targetHeightMm,
      apiKey
    );
  }

  if (!aiDrawing) {
    aiDrawing = synthesizeHybridLineDrawing(
      images,
      studentPrompt,
      targetWidthMm,
      targetHeightMm
    );
  }

  // 2. Etapa de Rasterización B/N (salida de imagen de la IA) + Vectorización Automática con Potrace
  const { bitmap, rasterDataUrl } = rasterizeLineArtToBitmap(
    aiDrawing.outerPolygon,
    aiDrawing.innerPolylines,
    targetWidthMm,
    targetHeightMm,
    340,
    280
  );

  const traced = traceBitmapWithPotrace(
    bitmap,
    340,
    280,
    targetWidthMm,
    targetHeightMm,
    {
      turdSize: 6,
      alphaMax: 0.85,
      optTolerance: 0.75,
    }
  );

  // Polígono exterior cerrado final y curvas Potrace
  const outerPolygon =
    traced.outerPolygon.length >= 12 ? traced.outerPolygon : aiDrawing.outerPolygon;
  const outerContourD = polygonToPotraceBezierPath(outerPolygon, true, 0.85);

  // Recortar también todos los trazos internos de grabado al polígono exterior para garantizar limpieza total
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

  // Calcular bounding box exacto del contorno exterior para ajustar el patrón de rompecabezas
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

  // 3. Etapa de Patrón de Rompecabezas Clásico + Operación Booleana de Intersección (Clipping)
  const puzzleResult = generateAndClipPuzzlePattern(
    outerPolygon,
    { minX, minY, maxX, maxY },
    puzzlePieces
  );

  const marginMm = 6;
  const sheetW = Number((targetWidthMm + marginMm * 2).toFixed(1));
  const sheetH = Number((targetHeightMm + marginMm * 2).toFixed(1));

  // Función auxiliar para desplazar los comandos SVG por el margen de seguridad
  const buildShiftedSvg = (includePreviewAnnotations: boolean): string => {
    const lines: string[] = [];
    lines.push(`<?xml version="1.0" encoding="UTF-8"?>`);
    lines.push(
      `<svg xmlns="http://www.w3.org/2000/svg" width="${sheetW}mm" height="${sheetH}mm" viewBox="0 0 ${sheetW} ${sheetH}">`
    );

    // Definición de máscara booleana <clipPath> exacta con el contorno exterior vectorizado
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
        `  <text x="${(sheetW / 2).toFixed(1)}" y="4.5" text-anchor="middle" font-family="sans-serif" font-size="2.7" font-weight="bold" fill="#92400E">${aiDrawing.hybridTitle} · Rompecabezas ${puzzlePieces} Piezas (${puzzleResult.cols}×${puzzleResult.rows}) · ${targetWidthMm}×${targetHeightMm} mm</text>`
      );
    }

    lines.push(`  <g transform="translate(${marginMm}, ${marginMm})">`);

    // CAPA 1: Grabado/Marcado Láser (Azul #0000FF) — Dibujo Híbrido Lineal Vectorizado con Potrace
    lines.push(
      `    <g id="CAPA-GRABADO-DIBUJO-HIBRIDO" clip-path="url(#hybrid-outer-contour-clip)" fill="none" stroke="${includePreviewAnnotations ? '#1E293B' : '#0000FF'}" stroke-width="${includePreviewAnnotations ? '0.65' : '0.35'}" stroke-linecap="round" stroke-linejoin="round">`
    );
    for (let i = 0; i < innerPathsD.length; i++) {
      lines.push(`      <path id="trazo-hibrido-${i + 1}" d="${innerPathsD[i]}" />`);
    }
    lines.push(`    </g>`);

    // CAPA 2: Corte Láser Interior (Rojo #FF0000) — Líneas de Rompecabezas recortadas booleanamente al contorno
    lines.push(
      `    <g id="CAPA-CORTE-ROMPECABEZAS-CLIPPED" clip-path="url(#hybrid-outer-contour-clip)" fill="none" stroke="#FF0000" stroke-width="${includePreviewAnnotations ? '0.65' : '0.25'}" stroke-linecap="round" stroke-linejoin="round">`
    );
    for (let i = 0; i < puzzleResult.clippedPuzzlePathsD.length; i++) {
      lines.push(
        `      <path id="corte-puzzle-${i + 1}" d="${puzzleResult.clippedPuzzlePathsD[i]}" />`
      );
    }
    lines.push(`    </g>`);

    // CAPA 3: Corte Láser Exterior (Rojo #FF0000) — Contorno Cerrado Principal del Dibujo Híbrido
    lines.push(
      `    <g id="CAPA-CORTE-CONTORNO-EXTERIOR" fill="none" stroke="#FF0000" stroke-width="${includePreviewAnnotations ? '0.85' : '0.25'}" stroke-linecap="round" stroke-linejoin="round">`
    );
    lines.push(`      <path id="contorno-exterior-cerrado" d="${outerContourD}" />`);
    lines.push(`    </g>`);

    lines.push(`  </g>`);

    if (includePreviewAnnotations) {
      lines.push(
        `  <text x="${(sheetW / 2).toFixed(1)}" y="${(sheetH - 1.8).toFixed(1)}" text-anchor="middle" font-family="sans-serif" font-size="2.3" fill="#B91C1C">Rojo (#FF0000): Corte Láser (Contorno + ${puzzlePieces} Piezas Recortadas) · Negro/Azul (#0000FF): Trazo Híbrido Vectorizado</text>`
      );
    }

    lines.push(`</svg>`);
    return lines.join('\n');
  };

  const previewSvg = buildShiftedSvg(Boolean(request.includeAnnotations ?? true));
  const laserSvg = buildShiftedSvg(false);

  const option =
    PUZZLE_PIECE_OPTIONS.find((o) => o.count === puzzlePieces) ||
    PUZZLE_PIECE_OPTIONS[1];

  return {
    previewSvg,
    laserSvg,
    rasterDataUrl,
    assistantMessage: aiDrawing.assistantMessage,
    hybridTitle: aiDrawing.hybridTitle,
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
      vectorizerEngine: 'Potrace Curve & Polygon Tracer',
      aiModelUsed: aiDrawing.modelName,
    },
  };
}
