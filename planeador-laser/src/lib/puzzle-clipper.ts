import {
  Point2D,
  TracedVectorResult,
} from './potrace-vectorizer';
import {
  PuzzlePieceCount,
  getAdaptiveGridForPieceCount,
} from '@/types/zoo';

export interface ClippedPuzzleResult {
  cols: number;
  rows: number;
  frameWidthMm: number;
  frameHeightMm: number;
  /** Polilíneas rectas continuas del patrón de rompecabezas de lado a lado */
  clippedPuzzlePolylines: Point2D[][];
  /** Comandos SVG d="" de las líneas rectas horizontales y verticales de corte */
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
 * Operación Booleana de Intersección (Clipping Geométrico)
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
 * Construye el patrón de rompecabezas enmarcado dentro de un recuadro rectangular
 * usando ÚNICAMENTE líneas rectas horizontales y verticales continuas (sin piezas de encaje)
 * para un corte láser rápido y limpio en contrachapado de 3 mm.
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

  // Líneas verticales rectas de lado a lado (de y = 0 a y = frameHeight)
  for (let c = 1; c < cols; c++) {
    const x = Number((c * cellW).toFixed(2));
    const hVal = Number(frameHeight.toFixed(2));
    rawDividers.push([
      { x, y: 0 },
      { x, y: hVal },
    ]);
    clippedPuzzlePathsD.push(`M ${x.toFixed(2)} 0 L ${x.toFixed(2)} ${hVal.toFixed(2)}`);
  }

  // Líneas horizontales rectas de lado a lado (de x = 0 a x = frameWidth)
  for (let r = 1; r < rows; r++) {
    const y = Number((r * cellH).toFixed(2));
    const wVal = Number(frameWidth.toFixed(2));
    rawDividers.push([
      { x: 0, y },
      { x: wVal, y },
    ]);
    clippedPuzzlePathsD.push(`M 0 ${y.toFixed(2)} L ${wVal.toFixed(2)} ${y.toFixed(2)}`);
  }

  const rawPuzzlePathsD = [...clippedPuzzlePathsD];
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
  _outerPolygon: Point2D[],
  bbox: { minX: number; minY: number; maxX: number; maxY: number },
  pieceCount: PuzzlePieceCount
): ClippedPuzzleResult {
  const width = Math.max(10, bbox.maxX - bbox.minX);
  const height = Math.max(10, bbox.maxY - bbox.minY);
  return generateFramedRectanglePuzzlePattern(width, height, pieceCount);
}

/**
 * Ensambla el archivo SVG para grabado y corte láser en contrachapado de 3 mm:
 * - CAPA DE GRABADO: Imagen PNG con trazo fijo de 1.5 px + logotipo MakerBox en esquina despejada (mapeo exacto 1:1).
 * - CAPA DE CORTE (#FF0000): Marco rectangular exterior + líneas rectas horizontales y verticales continuas (sin encaje).
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
  const frameHeightMm = Math.max(60, Number((traced.heightMm || 120).toFixed(1)));
  const frameWidthMm = Math.max(40, Number((traced.widthMm || 120).toFixed(1)));

  const puzzleResult = generateFramedRectanglePuzzlePattern(
    frameWidthMm,
    frameHeightMm,
    puzzlePieces
  );

  const engravingHref =
    customEngravingImageUrl || traced.engravingImageDataUrl || '';

  // Mapeo 1:1 exacto para preservar el dibujo a 1.5 px y el logo de MakerBox en la esquina sin recortes
  const drawX = 0;
  const drawY = 0;
  const drawW = frameWidthMm;
  const drawH = frameHeightMm;

  const marginMm = 8;
  const sheetW = Number((frameWidthMm + marginMm * 2).toFixed(1));
  const sheetH = Number((frameHeightMm + marginMm * 2).toFixed(1));
  const totalPieces = puzzleResult.cols * puzzleResult.rows;

  const renderSvg = (withAnnotations: boolean): string => {
    const lines: string[] = [];
    lines.push(`<?xml version="1.0" encoding="UTF-8"?>`);

    if (withAnnotations) {
      const topFontSize = Math.min(2.7, Math.max(1.6, Number((sheetW * 0.03).toFixed(2))));
      const botFontSize = Math.min(2.25, Math.max(1.45, Number((sheetW * 0.025).toFixed(2))));
      lines.push(
        `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${sheetW}mm" height="${sheetH}mm" viewBox="0 0 ${sheetW} ${sheetH}">`
      );
      lines.push(`  <defs>`);
      lines.push(`    <clipPath id="clip-marco-preview">`);
      lines.push(`      <rect x="0" y="0" width="${frameWidthMm}" height="${frameHeightMm}" />`);
      lines.push(`    </clipPath>`);
      lines.push(`  </defs>`);
      lines.push(
        `  <rect x="1" y="1" width="${(sheetW - 2).toFixed(1)}" height="${(sheetH - 2).toFixed(1)}" rx="3" fill="#FFFFFF" stroke="#D97706" stroke-width="0.4" stroke-dasharray="2.5,2.5" />`
      );
      lines.push(
        `  <text x="${(sheetW / 2).toFixed(1)}" y="5.2" text-anchor="middle" font-family="sans-serif" font-size="${topFontSize}" font-weight="bold" fill="#92400E">${hybridTitle} · Contrachapado 3 mm (${puzzleResult.cols}×${puzzleResult.rows} = ${totalPieces} Piezas · ${frameWidthMm}×${frameHeightMm} mm)</text>`
      );
      lines.push(`  <g transform="translate(${marginMm}, ${marginMm})">`);
    } else {
      lines.push(
        `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${frameWidthMm}mm" height="${frameHeightMm}mm" viewBox="0 0 ${frameWidthMm} ${frameHeightMm}">`
      );
      lines.push(`  <defs>`);
      lines.push(`    <clipPath id="clip-marco-laser">`);
      lines.push(`      <rect x="0" y="0" width="${frameWidthMm}" height="${frameHeightMm}" />`);
      lines.push(`    </clipPath>`);
      lines.push(`  </defs>`);
      lines.push(`  <g id="ROMPECABEZAS-RECTANGULAR-LASER">`);
    }

    // CAPA 1: PATRÓN DE GRABADO (DIBUJO GRUPAL 1.5 PX + LOGO MAKERBOX EN ESQUINA DESPEJADA)
    if (engravingHref) {
      const clipId = withAnnotations ? 'clip-marco-preview' : 'clip-marco-laser';
      lines.push(`    <g id="CAPA-GRABADO-IMAGEN" clip-path="url(#${clipId})">`);
      lines.push(
        `      <image x="${drawX}" y="${drawY}" width="${drawW}" height="${drawH}" preserveAspectRatio="none" href="${engravingHref}" xlink:href="${engravingHref}" />`
      );
      lines.push(`    </g>`);
    }

    // CAPA 2: LÍNEAS RECTAS HORIZONTALES Y VERTICALES DEL PUZZLE (ROJO #FF0000)
    lines.push(
      `    <g id="CAPA-CORTE-LINEAS-PUZZLE" fill="none" stroke="#FF0000" stroke-width="${withAnnotations ? '0.45' : '0.15'}" stroke-linecap="butt" stroke-linejoin="miter">`
    );
    for (let i = 0; i < puzzleResult.clippedPuzzlePathsD.length; i++) {
      lines.push(
        `      <path id="corte-puzzle-linea-${i + 1}" d="${puzzleResult.clippedPuzzlePathsD[i]}" />`
      );
    }
    lines.push(`    </g>`);

    // CAPA 3: CORTE DEL RECUADRO EXTERIOR (ROJO #FF0000)
    lines.push(
      `    <g id="CAPA-CORTE-RECUADRO-EXTERIOR" fill="none" stroke="#FF0000" stroke-width="${withAnnotations ? '0.75' : '0.18'}" stroke-linecap="square" stroke-linejoin="miter">`
    );
    lines.push(
      `      <rect id="corte-marco-perimetral" x="0" y="0" width="${frameWidthMm}" height="${frameHeightMm}" />`
    );
    lines.push(`    </g>`);

    lines.push(`  </g>`);

    if (withAnnotations) {
      const botFontSize = Math.min(2.25, Math.max(1.4, Number((sheetW * 0.025).toFixed(2))));
      lines.push(
        `  <text x="${(sheetW / 2).toFixed(1)}" y="${(sheetH - 2.2).toFixed(1)}" text-anchor="middle" font-family="sans-serif" font-size="${botFontSize}" fill="#B91C1C">Grabado: 1.5 px + Logo MakerBox · Corte (#FF0000): Marco + Cuadrícula Recta</text>`
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
