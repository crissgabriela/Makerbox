import {
  Point2D,
  polygonToPotraceBezierPath,
  TracedVectorResult,
} from './potrace-vectorizer';
import {
  PuzzlePieceCount,
  PUZZLE_PIECE_OPTIONS,
  getAdaptiveGridForPieceCount,
} from '@/types/zoo';

export interface ClippedPuzzleResult {
  cols: number;
  rows: number;
  frameWidthMm: number;
  frameHeightMm: number;
  /** Polilíneas completas del patrón de rompecabezas de lado a lado */
  clippedPuzzlePolylines: Point2D[][];
  /** Comandos SVG d="" de las líneas divisorias de corte de lado a lado */
  clippedPuzzlePathsD: string[];
  /** Comandos SVG d="" del patrón completo */
  rawPuzzlePathsD: string[];
  /** Atributo d="" del recuadro exterior de corte */
  outerRectD: string;
}

/**
 * Determina si un punto (x, y) se encuentra dentro de un polígono cerrado (Ray-Casting)
 */
export function isPointInPolygon(pt: Point2D, polygon: Point2D[]): boolean {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].x;
    const yi = polygon[i].y;
    const xj = polygon[j].x;
    const yj = polygon[j].y;

    const intersect =
      yi > pt.y !== yj > pt.y &&
      pt.x < ((xj - xi) * (pt.y - yi)) / (yj - yi + 1e-12) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

/**
 * Calcula la intersección exacta entre dos segmentos [p1, p2] y [p3, p4]
 */
function intersectSegments(
  p1: Point2D,
  p2: Point2D,
  p3: Point2D,
  p4: Point2D
): { t: number; point: Point2D } | null {
  const s1x = p2.x - p1.x;
  const s1y = p2.y - p1.y;
  const s2x = p4.x - p3.x;
  const s2y = p4.y - p3.y;

  const denom = -s2x * s1y + s1x * s2y;
  if (Math.abs(denom) < 1e-9) return null;

  const s = (-s1y * (p1.x - p3.x) + s1x * (p1.y - p3.y)) / denom;
  const t = (s2x * (p1.y - p3.y) - s2y * (p1.x - p3.x)) / denom;

  if (s >= 0 && s <= 1 && t >= 0 && t <= 1) {
    return {
      t,
      point: {
        x: p1.x + t * s1x,
        y: p1.y + t * s1y,
      },
    };
  }
  return null;
}

/**
 * Operación Booleana de Intersección (Clipping Geométrico):
 * Recorta una polilínea contra un polígono cerrado exterior, devolviendo únicamente
 * los sub-trazos que caen dentro del contorno exterior y cortándolos exactamente en el borde.
 */
export function clipPolylineToPolygon(
  polyline: Point2D[],
  outerPolygon: Point2D[]
): Point2D[][] {
  if (polyline.length < 2 || outerPolygon.length < 3) return [];

  const clippedChains: Point2D[][] = [];
  let currentChain: Point2D[] = [];

  for (let i = 0; i < polyline.length - 1; i++) {
    const a = polyline[i];
    const b = polyline[i + 1];

    const hits: { t: number; point: Point2D }[] = [
      { t: 0, point: a },
      { t: 1, point: b },
    ];

    for (let j = 0; j < outerPolygon.length; j++) {
      const c = outerPolygon[j];
      const d = outerPolygon[(j + 1) % outerPolygon.length];
      const hit = intersectSegments(a, b, c, d);
      if (hit && hit.t > 1e-4 && hit.t < 1 - 1e-4) {
        hits.push(hit);
      }
    }

    hits.sort((h1, h2) => h1.t - h2.t);

    for (let k = 0; k < hits.length - 1; k++) {
      const pStart = hits[k].point;
      const pEnd = hits[k + 1].point;
      if (Math.hypot(pEnd.x - pStart.x, pEnd.y - pStart.y) < 1e-3) continue;

      const mid: Point2D = {
        x: (pStart.x + pEnd.x) / 2,
        y: (pStart.y + pEnd.y) / 2,
      };

      if (isPointInPolygon(mid, outerPolygon)) {
        if (currentChain.length === 0) {
          currentChain.push(pStart, pEnd);
        } else {
          const last = currentChain[currentChain.length - 1];
          if (Math.hypot(last.x - pStart.x, last.y - pStart.y) < 0.08) {
            currentChain.push(pEnd);
          } else {
            clippedChains.push(currentChain);
            currentChain = [pStart, pEnd];
          }
        }
      } else if (currentChain.length > 0) {
        clippedChains.push(currentChain);
        currentChain = [];
      }
    }
  }

  if (currentChain.length >= 2) {
    clippedChains.push(currentChain);
  }

  return clippedChains;
}

/**
 * Genera el borde clásico de una celda de rompecabezas entre pStart y pEnd
 * con una pestaña/lengüeta redondeada de encastre clásico (jigsaw tab).
 */
/**
 * Pestaña clásica reforzada para corte láser (jigsaw tab):
 * - Altura/profundidad reforzada: 0.28 (40% más profunda)
 * - Cuello estrecho (0.16) y cabeza de bulbo circular ancha (0.33)
 * - Razón de bloqueo mecánico > 2.0x con ángulo de socavado (undercut)
 *   que traba físicamente las piezas para que no se separen fácilmente.
 */
function generateClassicJigsawEdgePoints(
  pStart: Point2D,
  pEnd: Point2D,
  tabDirection: 1 | -1,
  samplesPerSegment = 24
): Point2D[] {
  const dx = pEnd.x - pStart.x;
  const dy = pEnd.y - pStart.y;
  const length = Math.hypot(dx, dy);
  if (length < 1e-3) return [pStart, pEnd];

  const tx = dx / length;
  const ty = dy / length;
  const nx = -ty * tabDirection;
  const ny = tx * tabDirection;

  const tabHeight = 0.28;

  const cubicBezier = (
    p0: [number, number],
    p1: [number, number],
    p2: [number, number],
    p3: [number, number],
    t: number
  ): [number, number] => {
    const mt = 1 - t;
    const u =
      mt * mt * mt * p0[0] +
      3 * mt * mt * t * p1[0] +
      3 * mt * t * t * p2[0] +
      t * t * t * p3[0];
    const v =
      mt * mt * mt * p0[1] +
      3 * mt * mt * t * p1[1] +
      3 * mt * t * t * p2[1] +
      t * t * t * p3[1];
    return [u, v];
  };

  const segments: [[number, number], [number, number], [number, number], [number, number]][] = [
    [
      [0.0, 0.0],
      [0.32, 0.0],
      [0.38, -tabHeight * 0.06],
      [0.42, tabHeight * 0.25],
    ],
    [
      [0.42, tabHeight * 0.25],
      [0.26, tabHeight * 0.55],
      [0.36, tabHeight * 1.06],
      [0.50, tabHeight * 1.0],
    ],
    [
      [0.50, tabHeight * 1.0],
      [0.64, tabHeight * 1.06],
      [0.74, tabHeight * 0.55],
      [0.58, tabHeight * 0.25],
    ],
    [
      [0.58, tabHeight * 0.25],
      [0.62, -tabHeight * 0.06],
      [0.68, 0.0],
      [1.0, 0.0],
    ],
  ];

  const points: Point2D[] = [];
  const subSamples = Math.max(6, Math.floor(samplesPerSegment / segments.length));

  for (let sIdx = 0; sIdx < segments.length; sIdx++) {
    const [b0, b1, b2, b3] = segments[sIdx];
    for (let i = 0; i <= subSamples; i++) {
      if (sIdx > 0 && i === 0) continue;
      const t = i / subSamples;
      const [u, v] = cubicBezier(b0, b1, b2, b3, t);
      points.push({
        x: pStart.x + u * length * tx + v * length * nx,
        y: pStart.y + u * length * ty + v * length * ny,
      });
    }
  }

  return points;
}

/**
 * Genera el comando SVG continuo de curvas cúbicas de Bézier exactas
 * para una línea divisoria de lado a lado con lengüetas de encastre reforzadas.
 */
function generateClassicJigsawDividerSvgPath(
  pStart: Point2D,
  pEnd: Point2D,
  steps: number,
  isVertical: boolean,
  dividerIndex: number
): string {
  const cellLen = (isVertical ? pEnd.y - pStart.y : pEnd.x - pStart.x) / steps;
  const tabHeight = 0.28;

  const segments: [[number, number], [number, number], [number, number], [number, number]][] = [
    [
      [0.0, 0.0],
      [0.32, 0.0],
      [0.38, -tabHeight * 0.06],
      [0.42, tabHeight * 0.25],
    ],
    [
      [0.42, tabHeight * 0.25],
      [0.26, tabHeight * 0.55],
      [0.36, tabHeight * 1.06],
      [0.50, tabHeight * 1.0],
    ],
    [
      [0.50, tabHeight * 1.0],
      [0.64, tabHeight * 1.06],
      [0.74, tabHeight * 0.55],
      [0.58, tabHeight * 0.25],
    ],
    [
      [0.58, tabHeight * 0.25],
      [0.62, -tabHeight * 0.06],
      [0.68, 0.0],
      [1.0, 0.0],
    ],
  ];

  const cmds: string[] = [`M ${pStart.x.toFixed(2)} ${pStart.y.toFixed(2)}`];

  for (let s = 0; s < steps; s++) {
    const p0: Point2D = isVertical
      ? { x: pStart.x, y: pStart.y + s * cellLen }
      : { x: pStart.x + s * cellLen, y: pStart.y };
    const p1: Point2D = isVertical
      ? { x: pStart.x, y: pStart.y + (s + 1) * cellLen }
      : { x: pStart.x + (s + 1) * cellLen, y: pStart.y };

    const dir: 1 | -1 =
      ((isVertical ? dividerIndex : s) + (isVertical ? s : dividerIndex)) % 2 === 0
        ? 1
        : -1;

    const dx = p1.x - p0.x;
    const dy = p1.y - p0.y;
    const len = Math.hypot(dx, dy);
    const tx = dx / len;
    const ty = dy / len;
    const nx = -ty * dir;
    const ny = tx * dir;

    for (const seg of segments) {
      const transform = (u: number, v: number) => ({
        x: p0.x + u * len * tx + v * len * nx,
        y: p0.y + u * len * ty + v * len * ny,
      });
      const cp1 = transform(seg[1][0], seg[1][1]);
      const cp2 = transform(seg[2][0], seg[2][1]);
      const p3 = transform(seg[3][0], seg[3][1]);
      cmds.push(
        `C ${cp1.x.toFixed(2)} ${cp1.y.toFixed(2)}, ${cp2.x.toFixed(2)} ${cp2.y.toFixed(2)}, ${p3.x.toFixed(2)} ${p3.y.toFixed(2)}`
      );
    }
  }

  return cmds.join(' ');
}

/**
 * Construye el patrón completo de rompecabezas clásico enmarcado dentro de un recuadro rectangular:
 * - El marco exterior es un rectángulo cortado en vector (#FF0000).
 * - Las líneas divisorias con lengüetas de encastre reforzadas van 100% DE LADO A LADO de forma continua.
 * - La cuadrícula de piezas se adapta a la orientación y aspecto del dibujo para mantener piezas cuadradas.
 */
export function generateFramedRectanglePuzzlePattern(
  frameWidth: number,
  frameHeight: number,
  pieceCount: PuzzlePieceCount
): ClippedPuzzleResult {
  const aspect = frameWidth / Math.max(1, frameHeight);
  const { cols, rows } = getAdaptiveGridForPieceCount(pieceCount, aspect);

  const cellW = frameWidth / cols;
  const cellH = frameHeight / rows;

  const rawDividers: Point2D[][] = [];
  const clippedPuzzlePathsD: string[] = [];

  // Divisores verticales continuos (de y = 0 a y = frameHeight)
  for (let c = 1; c < cols; c++) {
    const x = c * cellW;
    const verticalCurve: Point2D[] = [];
    for (let r = 0; r < rows; r++) {
      const y0 = r * cellH;
      const y1 = (r + 1) * cellH;
      const dir: 1 | -1 = (c + r) % 2 === 0 ? 1 : -1;
      const edgePts = generateClassicJigsawEdgePoints(
        { x, y: y0 },
        { x, y: y1 },
        dir,
        24
      );
      if (r > 0) edgePts.shift();
      verticalCurve.push(...edgePts);
    }
    // Asegurar unión exacta milimétrica con los bordes superior e inferior del recuadro
    if (verticalCurve.length > 0) {
      verticalCurve[0] = { x: Number(x.toFixed(2)), y: 0 };
      verticalCurve[verticalCurve.length - 1] = {
        x: Number(x.toFixed(2)),
        y: Number(frameHeight.toFixed(2)),
      };
    }
    rawDividers.push(verticalCurve);

    // Ruta SVG exacta en curvas cúbicas de Bézier con encastre reforzado
    const dividerPathD = generateClassicJigsawDividerSvgPath(
      { x: Number(x.toFixed(2)), y: 0 },
      { x: Number(x.toFixed(2)), y: Number(frameHeight.toFixed(2)) },
      rows,
      true,
      c
    );
    clippedPuzzlePathsD.push(dividerPathD);
  }

  // Divisores horizontales continuos (de x = 0 a x = frameWidth)
  for (let r = 1; r < rows; r++) {
    const y = r * cellH;
    const horizontalCurve: Point2D[] = [];
    for (let c = 0; c < cols; c++) {
      const x0 = c * cellW;
      const x1 = (c + 1) * cellW;
      const dir: 1 | -1 = (r + c) % 2 === 0 ? -1 : 1;
      const edgePts = generateClassicJigsawEdgePoints(
        { x: x0, y },
        { x: x1, y },
        dir,
        24
      );
      if (c > 0) edgePts.shift();
      horizontalCurve.push(...edgePts);
    }
    // Asegurar unión exacta milimétrica con los bordes izquierdo y derecho del recuadro
    if (horizontalCurve.length > 0) {
      horizontalCurve[0] = { x: 0, y: Number(y.toFixed(2)) };
      horizontalCurve[horizontalCurve.length - 1] = {
        x: Number(frameWidth.toFixed(2)),
        y: Number(y.toFixed(2)),
      };
    }
    rawDividers.push(horizontalCurve);

    // Ruta SVG exacta en curvas cúbicas de Bézier con encastre reforzado
    const dividerPathD = generateClassicJigsawDividerSvgPath(
      { x: 0, y: Number(y.toFixed(2)) },
      { x: Number(frameWidth.toFixed(2)), y: Number(y.toFixed(2)) },
      cols,
      false,
      r
    );
    clippedPuzzlePathsD.push(dividerPathD);
  }

  const polylineToD = (pts: Point2D[]) => {
    if (pts.length === 0) return '';
    return pts
      .map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`)
      .join(' ');
  };

  const rawPuzzlePathsD = rawDividers.map(polylineToD);
  const outerRectD = `M 0 0 L ${frameWidth.toFixed(2)} 0 L ${frameWidth.toFixed(2)} ${frameHeight.toFixed(2)} L 0 ${frameHeight.toFixed(2)} Z`;

  return {
    cols,
    rows,
    frameWidthMm: frameWidth,
    frameHeightMm: frameHeight,
    clippedPuzzlePolylines: rawDividers,
    clippedPuzzlePathsD,
    rawPuzzlePathsD,
    outerRectD,
  };
}

export function generateAndClipPuzzlePattern(
  outerPolygon: Point2D[],
  bbox: { minX: number; minY: number; maxX: number; maxY: number },
  pieceCount: PuzzlePieceCount
): ClippedPuzzleResult {
  const width = Math.max(10, bbox.maxX - bbox.minX);
  const height = Math.max(10, bbox.maxY - bbox.minY);
  return generateFramedRectanglePuzzlePattern(width, height, pieceCount);
}

/**
 * Ensambla el archivo SVG enmarcado dentro de un recuadro para corte y grabado en Creality Falcon 10W:
 * - RECUADRO AJUSTADO AL DIBUJO: Ancho y alto coinciden exactamente con la silueta real del dibujo.
 * - TODAS LAS PIEZAS GRABADAS: El dibujo cubre el 100% del área interna del marco con ligero sangrado
 *   para garantizar que no existan piezas vacías ni en los bordes ni en las esquinas.
 * - ENCASTRE REFORZADO: Lengüetas con bulbo profundo y socavado antideslizante.
 * - CAPA DE CORTE (#FF0000): Líneas continuas de lado a lado + contorno perimetral cerrado.
 */
export function buildPuzzleSvgFromTracedResult(
  traced: TracedVectorResult,
  puzzlePieces: PuzzlePieceCount,
  hybridTitle: string,
  includePreviewAnnotations: boolean,
  customEngravingImageUrl?: string
): {
  previewSvg: string;
  laserSvg: string;
  puzzleResult: ClippedPuzzleResult;
} {
  // Dimensiones efectivas del dibujo en milímetros
  const drawingHeightMm = Math.max(60, Number((traced.heightMm || 120).toFixed(1)));
  const drawingWidthMm = Math.max(40, Number((traced.widthMm || 120).toFixed(1)));

  // 1. Ajuste del recuadro exactamente al tamaño real del dibujo (sin columnas o filas vacías)
  const frameHeightMm = drawingHeightMm;
  const frameWidthMm = drawingWidthMm;

  // 2. Patrón de rompecabezas adaptado con encastre mecánico reforzado
  const puzzleResult = generateFramedRectanglePuzzlePattern(
    frameWidthMm,
    frameHeightMm,
    puzzlePieces
  );

  const engravingHref =
    customEngravingImageUrl || traced.engravingImageDataUrl || '';

  // 3. Cobertura del 100% de las piezas:
  // Se eliminan márgenes blancos y se aplica un sangrado suave (bleed 4%)
  // para que todas las piezas perimetrales y de esquina reciban trazos grabados.
  const bleedScale = 1.04;
  const scale = Math.max(frameWidthMm / drawingWidthMm, frameHeightMm / drawingHeightMm) * bleedScale;

  const drawW = Number((drawingWidthMm * scale).toFixed(1));
  const drawH = Number((drawingHeightMm * scale).toFixed(1));
  const drawX = Number(((frameWidthMm - drawW) / 2).toFixed(1));
  const drawY = Number(((frameHeightMm - drawH) / 2).toFixed(1));

  const marginMm = 8;
  const sheetW = Number((frameWidthMm + marginMm * 2).toFixed(1));
  const sheetH = Number((frameHeightMm + marginMm * 2).toFixed(1));

  const renderSvg = (withAnnotations: boolean): string => {
    const lines: string[] = [];
    lines.push(`<?xml version="1.0" encoding="UTF-8"?>`);

    if (withAnnotations) {
      lines.push(
        `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${sheetW}mm" height="${sheetH}mm" viewBox="0 0 ${sheetW} ${sheetH}">`
      );
      lines.push(`  <defs>`);
      lines.push(`    <clipPath id="clip-marco-preview">`);
      lines.push(`      <rect x="0" y="0" width="${frameWidthMm}" height="${frameHeightMm}" rx="0" />`);
      lines.push(`    </clipPath>`);
      lines.push(`  </defs>`);
      lines.push(
        `  <rect x="1" y="1" width="${(sheetW - 2).toFixed(1)}" height="${(sheetH - 2).toFixed(1)}" rx="3" fill="#FFFFFF" stroke="#D97706" stroke-width="0.4" stroke-dasharray="2.5,2.5" />`
      );
      lines.push(
        `  <text x="${(sheetW / 2).toFixed(1)}" y="5.2" text-anchor="middle" font-family="sans-serif" font-size="2.8" font-weight="bold" fill="#92400E">${hybridTitle} · Creality Falcon 10W (Recuadro Ajustado · ${puzzleResult.cols}×${puzzleResult.rows} = ${puzzlePieces} Piezas · ${frameWidthMm}×${frameHeightMm} mm)</text>`
      );
      lines.push(`  <g transform="translate(${marginMm}, ${marginMm})">`);
    } else {
      // SVG Limpio para LightBurn / LaserGRBL listo para corte y grabado directo
      lines.push(
        `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${frameWidthMm}mm" height="${frameHeightMm}mm" viewBox="0 0 ${frameWidthMm} ${frameHeightMm}">`
      );
      lines.push(`  <defs>`);
      lines.push(`    <clipPath id="clip-marco-falcon">`);
      lines.push(`      <rect x="0" y="0" width="${frameWidthMm}" height="${frameHeightMm}" rx="0" />`);
      lines.push(`    </clipPath>`);
      lines.push(`  </defs>`);
      lines.push(`  <g id="ROMPECABEZAS-RECTANGULAR-FALCON-10W">`);
    }

    // CAPA 1: DIBUJO PARA GRABADO LÁSER EN CREALITY FALCON 10W (IMAGEN RASTER B/N ENMARCADA SIN MÁRGENES VACÍOS)
    if (engravingHref) {
      const clipId = withAnnotations ? 'clip-marco-preview' : 'clip-marco-falcon';
      lines.push(`    <g id="CAPA-GRABADO-IMAGEN-FALCON-10W" clip-path="url(#${clipId})">`);
      lines.push(
        `      <image x="${drawX}" y="${drawY}" width="${drawW}" height="${drawH}" preserveAspectRatio="none" href="${engravingHref}" xlink:href="${engravingHref}" />`
      );
      lines.push(`    </g>`);
    }

    // CAPA 2: LÍNEAS DE CORTE DEL PUZZLE (ROJO #FF0000 - DE LADO A LADO CON ENCASTE REFORZADO)
    lines.push(
      `    <g id="CAPA-CORTE-LINEAS-PUZZLE" fill="none" stroke="#FF0000" stroke-width="${withAnnotations ? '0.45' : '0.20'}" stroke-linecap="round" stroke-linejoin="round">`
    );
    for (let i = 0; i < puzzleResult.clippedPuzzlePathsD.length; i++) {
      lines.push(
        `      <path id="corte-puzzle-linea-${i + 1}" d="${puzzleResult.clippedPuzzlePathsD[i]}" />`
      );
    }
    lines.push(`    </g>`);

    // CAPA 3: CORTE DEL RECUADRO EXTERIOR (ROJO #FF0000 - MARCO PERIMETRAL CERRADO)
    lines.push(
      `    <g id="CAPA-CORTE-RECUADRO-EXTERIOR" fill="none" stroke="#FF0000" stroke-width="${withAnnotations ? '0.75' : '0.22'}" stroke-linecap="round" stroke-linejoin="round">`
    );
    lines.push(
      `      <rect id="corte-marco-perimetral" x="0" y="0" width="${frameWidthMm}" height="${frameHeightMm}" rx="0.5" />`
    );
    lines.push(`    </g>`);

    lines.push(`  </g>`);

    if (withAnnotations) {
      lines.push(
        `  <text x="${(sheetW / 2).toFixed(1)}" y="${(sheetH - 2.2).toFixed(1)}" text-anchor="middle" font-family="sans-serif" font-size="2.4" fill="#B91C1C">Capa Imagen: Grabado Falcon 10W (100% Cobertura) · Vectores Rojos (#FF0000): Marco + ${puzzlePieces} Piezas Encastre Reforzado</text>`
      );
    }

    lines.push(`</svg>`);
    return lines.join('\n');
  };

  return {
    previewSvg: renderSvg(includePreviewAnnotations),
    laserSvg: renderSvg(false),
    puzzleResult,
  };
}
