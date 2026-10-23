import {
  Point2D,
  polygonToPotraceBezierPath,
  TracedVectorResult,
} from './potrace-vectorizer';
import { PuzzlePieceCount, PUZZLE_PIECE_OPTIONS } from '@/types/zoo';

export interface ClippedPuzzleResult {
  cols: number;
  rows: number;
  /** Polilíneas del patrón de rompecabezas recortadas exactamente al contorno exterior */
  clippedPuzzlePolylines: Point2D[][];
  /** Comandos SVG d="" de las líneas de corte del rompecabezas recortadas al contorno */
  clippedPuzzlePathsD: string[];
  /** Comandos SVG d="" del patrón completo */
  rawPuzzlePathsD: string[];
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

  const tabHeight = 0.20;

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
      [0.34, 0.0],
      [0.41, -tabHeight * 0.18],
      [0.39, tabHeight * 0.36],
    ],
    [
      [0.39, tabHeight * 0.36],
      [0.33, tabHeight * 0.96],
      [0.43, tabHeight * 1.05],
      [0.5, tabHeight * 1.05],
    ],
    [
      [0.5, tabHeight * 1.05],
      [0.57, tabHeight * 1.05],
      [0.67, tabHeight * 0.96],
      [0.61, tabHeight * 0.36],
    ],
    [
      [0.61, tabHeight * 0.36],
      [0.59, -tabHeight * 0.18],
      [0.66, 0.0],
      [1.0, 0.0],
    ],
  ];

  const points: Point2D[] = [];
  const subSamples = Math.max(5, Math.floor(samplesPerSegment / segments.length));

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
 * Construye el patrón completo de rompecabezas clásico para la cantidad de piezas seleccionada (20, 25, 30 o 40)
 * y aplica la operación booleana de intersección contra el contorno exterior del dibujo híbrido.
 */
export function generateAndClipPuzzlePattern(
  outerPolygon: Point2D[],
  bbox: { minX: number; minY: number; maxX: number; maxY: number },
  pieceCount: PuzzlePieceCount
): ClippedPuzzleResult {
  const option =
    PUZZLE_PIECE_OPTIONS.find((o) => o.count === pieceCount) ||
    PUZZLE_PIECE_OPTIONS[0];
  const { cols, rows } = option;

  const width = bbox.maxX - bbox.minX;
  const height = bbox.maxY - bbox.minY;
  const cellW = width / cols;
  const cellH = height / rows;

  const rawDividers: Point2D[][] = [];

  for (let c = 1; c < cols; c++) {
    const x = bbox.minX + c * cellW;
    const verticalCurve: Point2D[] = [];
    for (let r = 0; r < rows; r++) {
      const y0 = bbox.minY + r * cellH;
      const y1 = bbox.minY + (r + 1) * cellH;
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
    rawDividers.push(verticalCurve);
  }

  for (let r = 1; r < rows; r++) {
    const y = bbox.minY + r * cellH;
    const horizontalCurve: Point2D[] = [];
    for (let c = 0; c < cols; c++) {
      const x0 = bbox.minX + c * cellW;
      const x1 = bbox.minX + (c + 1) * cellW;
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
    rawDividers.push(horizontalCurve);
  }

  const clippedPuzzlePolylines: Point2D[][] = [];
  for (const divider of rawDividers) {
    const clippedSegments = clipPolylineToPolygon(divider, outerPolygon);
    for (const seg of clippedSegments) {
      if (seg.length >= 2) {
        clippedPuzzlePolylines.push(seg);
      }
    }
  }

  const polylineToD = (pts: Point2D[]) => {
    if (pts.length === 0) return '';
    return pts
      .map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`)
      .join(' ');
  };

  const clippedPuzzlePathsD = clippedPuzzlePolylines.map((poly) =>
    polygonToPotraceBezierPath(poly, false, 0.7)
  );
  const rawPuzzlePathsD = rawDividers.map(polylineToD);

  return {
    cols,
    rows,
    clippedPuzzlePolylines,
    clippedPuzzlePathsD,
    rawPuzzlePathsD,
  };
}

/**
 * Ensambla el archivo SVG de previsualización y el archivo SVG limpio para corte/grabado en Creality Falcon 10W:
 * - CAPA 1 (IMAGEN RASTER NO VECTORIZADA): <image> incrustada con fondo limpio para grabado de imagen en Falcon 10W.
 * - CAPA 2 (VECTORES DE CORTE #FF0000): Líneas del rompecabezas (20–40 piezas) recortadas booleanamente al contorno.
 * - CAPA 3 (VECTOR DE CORTE EXTERIOR #FF0000): Contorno exterior cerrado vectorizado alrededor de la figura.
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
  const outerPolygon = traced.outerPolygon;
  const outerContourD = traced.outerPathD;
  const engravingHref =
    customEngravingImageUrl || traced.engravingImageDataUrl || '';

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
  const sheetW = Number((traced.widthMm + marginMm * 2).toFixed(1));
  const sheetH = Number((traced.heightMm + marginMm * 2).toFixed(1));

  const renderSvg = (withAnnotations: boolean): string => {
    const lines: string[] = [];
    lines.push(`<?xml version="1.0" encoding="UTF-8"?>`);
    lines.push(
      `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${sheetW}mm" height="${sheetH}mm" viewBox="0 0 ${sheetW} ${sheetH}">`
    );

    lines.push(`  <defs>`);
    lines.push(`    <clipPath id="hybrid-outer-contour-clip">`);
    lines.push(`      <path d="${outerContourD}" />`);
    lines.push(`    </clipPath>`);
    lines.push(`  </defs>`);

    if (withAnnotations) {
      lines.push(
        `  <rect x="1" y="1" width="${(sheetW - 2).toFixed(1)}" height="${(sheetH - 2).toFixed(1)}" rx="3" fill="#FFFFFF" stroke="#D97706" stroke-width="0.4" stroke-dasharray="2.5,2.5" />`
      );
      lines.push(
        `  <text x="${(sheetW / 2).toFixed(1)}" y="4.8" text-anchor="middle" font-family="sans-serif" font-size="2.7" font-weight="bold" fill="#92400E">${hybridTitle} · Creality Falcon 10W (${puzzlePieces} Piezas · ${traced.widthMm}×${traced.heightMm} mm)</text>`
      );
    }

    lines.push(`  <g transform="translate(${marginMm}, ${marginMm})">`);

    // CAPA 1: IMAGEN RASTER PARA GRABADO LÁSER EN CREALITY FALCON 10W (NO VECTORIZADA)
    if (engravingHref) {
      lines.push(
        `    <g id="CAPA-IMAGEN-GRABADO-FALCON-10W" clip-path="url(#hybrid-outer-contour-clip)">`
      );
      lines.push(
        `      <image x="0" y="0" width="${traced.widthMm}" height="${traced.heightMm}" preserveAspectRatio="none" href="${engravingHref}" xlink:href="${engravingHref}" />`
      );
      lines.push(`    </g>`);
    }

    // CAPA 2: CORTE LÁSER VECTORIAL INTERIOR (Rojo #FF0000) — Líneas de Rompecabezas recortadas al contorno
    lines.push(
      `    <g id="CAPA-CORTE-ROMPECABEZAS-VECTORIZADO" clip-path="url(#hybrid-outer-contour-clip)" fill="none" stroke="#FF0000" stroke-width="${withAnnotations ? '0.45' : '0.20'}" stroke-linecap="round" stroke-linejoin="round">`
    );
    for (let i = 0; i < puzzleResult.clippedPuzzlePathsD.length; i++) {
      lines.push(
        `      <path id="corte-puzzle-${i + 1}" d="${puzzleResult.clippedPuzzlePathsD[i]}" />`
      );
    }
    lines.push(`    </g>`);

    // CAPA 3: CORTE LÁSER VECTORIAL EXTERIOR (Rojo #FF0000) — Contorno Cerrado Vectorizado
    lines.push(
      `    <g id="CAPA-CORTE-CONTORNO-EXTERIOR-VECTORIZADO" fill="none" stroke="#FF0000" stroke-width="${withAnnotations ? '0.75' : '0.22'}" stroke-linecap="round" stroke-linejoin="round">`
    );
    lines.push(`      <path id="contorno-exterior-vectorizado" d="${outerContourD}" />`);
    lines.push(`    </g>`);

    lines.push(`  </g>`);

    if (withAnnotations) {
      lines.push(
        `  <text x="${(sheetW / 2).toFixed(1)}" y="${(sheetH - 1.8).toFixed(1)}" text-anchor="middle" font-family="sans-serif" font-size="2.3" fill="#B91C1C">Imagen PNG incrustada: Grabado Creality Falcon 10W · Vectores Rojos (#FF0000): Corte de Contorno + ${puzzlePieces} Piezas</text>`
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
