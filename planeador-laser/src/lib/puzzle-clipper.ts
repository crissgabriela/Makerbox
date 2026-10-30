import {
  Point2D,
  polygonToPotraceBezierPath,
  TracedVectorResult,
} from './potrace-vectorizer';
import { PuzzlePieceCount, PUZZLE_PIECE_OPTIONS } from '@/types/zoo';

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
 * Construye el patrón completo de rompecabezas clásico enmarcado dentro de un recuadro rectangular:
 * - El marco exterior es un rectángulo cortado en vector (#FF0000).
 * - Las líneas divisorias con lengüetas de encastre van 100% DE LADO A LADO de forma continua.
 * - Asegura que todas las líneas de corte estén completas y cierren cada una de las piezas.
 */
export function generateFramedRectanglePuzzlePattern(
  frameWidth: number,
  frameHeight: number,
  pieceCount: PuzzlePieceCount
): ClippedPuzzleResult {
  const option =
    PUZZLE_PIECE_OPTIONS.find((o) => o.count === pieceCount) ||
    PUZZLE_PIECE_OPTIONS[0];
  const { cols, rows } = option;

  const cellW = frameWidth / cols;
  const cellH = frameHeight / rows;

  const rawDividers: Point2D[][] = [];

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
  }

  const polylineToD = (pts: Point2D[]) => {
    if (pts.length === 0) return '';
    return pts
      .map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`)
      .join(' ');
  };

  const clippedPuzzlePathsD = rawDividers.map((poly) =>
    polygonToPotraceBezierPath(poly, false, 0.75)
  );
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
 * - RECUADRO RECTANGULAR: El puzzle se enmarca de forma ordenada en un rectángulo.
 * - CAPA DE GRABADO (Imagen Raster): El dibujo fusionado se centra estéticamente dentro del marco.
 * - CAPA DE CORTE (#FF0000): Las líneas divisorias del rompecabezas van de lado a lado completas, y el recuadro exterior conforma el corte perimetral.
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
  const option =
    PUZZLE_PIECE_OPTIONS.find((o) => o.count === puzzlePieces) ||
    PUZZLE_PIECE_OPTIONS[0];
  const { cols, rows } = option;

  // Altura objetivo en mm (e.g. 120 mm)
  const frameHeightMm = Math.max(60, Number((traced.heightMm || 120).toFixed(1)));
  // Ancho proporcional a la cuadrícula de piezas para que cada pieza sea perfectamente cuadrada y simétrica
  const frameWidthMm = Number((frameHeightMm * (cols / rows)).toFixed(1));

  const puzzleResult = generateFramedRectanglePuzzlePattern(
    frameWidthMm,
    frameHeightMm,
    puzzlePieces
  );

  const engravingHref =
    customEngravingImageUrl || traced.engravingImageDataUrl || '';

  // Centrar el dibujo dentro del marco rectangular con un margen estético del 8%
  const padX = Number((frameWidthMm * 0.08).toFixed(1));
  const padY = Number((frameHeightMm * 0.08).toFixed(1));
  const availW = frameWidthMm - padX * 2;
  const availH = frameHeightMm - padY * 2;

  const srcW = Math.max(10, traced.widthMm || availW);
  const srcH = Math.max(10, traced.heightMm || availH);
  const scale = Math.min(availW / srcW, availH / srcH, 1.05);

  const drawW = Number((srcW * scale).toFixed(1));
  const drawH = Number((srcH * scale).toFixed(1));
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
      lines.push(
        `  <rect x="1" y="1" width="${(sheetW - 2).toFixed(1)}" height="${(sheetH - 2).toFixed(1)}" rx="3" fill="#FFFFFF" stroke="#D97706" stroke-width="0.4" stroke-dasharray="2.5,2.5" />`
      );
      lines.push(
        `  <text x="${(sheetW / 2).toFixed(1)}" y="5.2" text-anchor="middle" font-family="sans-serif" font-size="2.8" font-weight="bold" fill="#92400E">${hybridTitle} · Creality Falcon 10W (Recuadro Rectangular · ${puzzlePieces} Piezas · ${frameWidthMm}×${frameHeightMm} mm)</text>`
      );
      lines.push(`  <g transform="translate(${marginMm}, ${marginMm})">`);
    } else {
      // SVG Limpio para LightBurn / LaserGRBL listo para corte y grabado directo
      lines.push(
        `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${frameWidthMm}mm" height="${frameHeightMm}mm" viewBox="0 0 ${frameWidthMm} ${frameHeightMm}">`
      );
      lines.push(`  <g id="ROMPECABEZAS-RECTANGULAR-FALCON-10W">`);
    }

    // CAPA 1: DIBUJO PARA GRABADO LÁSER EN CREALITY FALCON 10W (IMAGEN RASTER B/N ENMARCADA)
    if (engravingHref) {
      lines.push(`    <g id="CAPA-GRABADO-IMAGEN-FALCON-10W">`);
      lines.push(
        `      <image x="${drawX}" y="${drawY}" width="${drawW}" height="${drawH}" preserveAspectRatio="none" href="${engravingHref}" xlink:href="${engravingHref}" />`
      );
      lines.push(`    </g>`);
    }

    // CAPA 2: LÍNEAS DE CORTE DEL PUZZLE (ROJO #FF0000 - DE LADO A LADO)
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
        `  <text x="${(sheetW / 2).toFixed(1)}" y="${(sheetH - 2.2).toFixed(1)}" text-anchor="middle" font-family="sans-serif" font-size="2.4" fill="#B91C1C">Capa Imagen: Grabado Falcon 10W · Vectores Rojos (#FF0000): Corte Recuadro + ${puzzlePieces} Piezas de lado a lado</text>`
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
