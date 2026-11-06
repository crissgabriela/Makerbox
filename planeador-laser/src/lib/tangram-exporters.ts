import {
  CAD_CORE_SEGMENTS,
  CAD_NODE_MAP,
  CAD_VARIANT_SEGMENTS,
  computeSilhouetteBoundaryLoops,
} from '@/lib/tangram-geometry';
import {
  CadSubdivisionVariant,
  TangramParams,
  TangramSilhouetteDef,
} from '@/types/tangram';

export function formatStopwatch(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const mins = Math.floor(safe / 60);
  const secs = safe % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

// ============================================================================
// FUENTE VECTORIAL SINGLE-STROKE CAD (Grilla [0..1] x [0..1], Y hacia abajo)
// Ideal para grabado láser vectorial (#0000FF) en LightBurn sin fuentes externas
// ============================================================================

type StrokePolyline = [number, number][];

const BASE_GLYPHS: Record<string, StrokePolyline[]> = {
  A: [
    [
      [0, 1],
      [0.5, 0],
      [1, 1],
    ],
    [
      [0.2, 0.62],
      [0.8, 0.62],
    ],
  ],
  B: [
    [
      [0, 1],
      [0, 0],
      [0.72, 0],
      [0.95, 0.14],
      [0.95, 0.36],
      [0.72, 0.48],
      [0, 0.48],
    ],
    [
      [0.72, 0.48],
      [1, 0.62],
      [1, 0.86],
      [0.75, 1],
      [0, 1],
    ],
  ],
  C: [
    [
      [0.95, 0.18],
      [0.75, 0],
      [0.25, 0],
      [0, 0.22],
      [0, 0.78],
      [0.25, 1],
      [0.75, 1],
      [0.95, 0.82],
    ],
  ],
  D: [
    [
      [0, 0],
      [0, 1],
      [0.65, 1],
      [0.98, 0.76],
      [0.98, 0.24],
      [0.65, 0],
      [0, 0],
    ],
  ],
  E: [
    [
      [0.92, 0],
      [0, 0],
      [0, 1],
      [0.95, 1],
    ],
    [
      [0, 0.48],
      [0.72, 0.48],
    ],
  ],
  F: [
    [
      [0, 1],
      [0, 0],
      [0.95, 0],
    ],
    [
      [0, 0.48],
      [0.72, 0.48],
    ],
  ],
  G: [
    [
      [0.95, 0.18],
      [0.75, 0],
      [0.25, 0],
      [0, 0.22],
      [0, 0.78],
      [0.25, 1],
      [0.8, 1],
      [0.98, 0.82],
      [0.98, 0.54],
      [0.52, 0.54],
    ],
  ],
  H: [
    [
      [0, 0],
      [0, 1],
    ],
    [
      [1, 0],
      [1, 1],
    ],
    [
      [0, 0.48],
      [1, 0.48],
    ],
  ],
  I: [
    [
      [0.15, 0],
      [0.85, 0],
    ],
    [
      [0.5, 0],
      [0.5, 1],
    ],
    [
      [0.15, 1],
      [0.85, 1],
    ],
  ],
  J: [
    [
      [0.2, 0],
      [0.9, 0],
    ],
    [
      [0.72, 0],
      [0.72, 0.78],
      [0.5, 1],
      [0.2, 1],
      [0, 0.8],
    ],
  ],
  K: [
    [
      [0, 0],
      [0, 1],
    ],
    [
      [0.95, 0],
      [0, 0.54],
    ],
    [
      [0.28, 0.38],
      [1, 1],
    ],
  ],
  L: [
    [
      [0, 0],
      [0, 1],
      [0.95, 1],
    ],
  ],
  M: [
    [
      [0, 1],
      [0, 0],
      [0.5, 0.56],
      [1, 0],
      [1, 1],
    ],
  ],
  N: [
    [
      [0, 1],
      [0, 0],
      [1, 1],
      [1, 0],
    ],
  ],
  O: [
    [
      [0.25, 0],
      [0.75, 0],
      [1, 0.22],
      [1, 0.78],
      [0.75, 1],
      [0.25, 1],
      [0, 0.78],
      [0, 0.22],
      [0.25, 0],
    ],
  ],
  P: [
    [
      [0, 1],
      [0, 0],
      [0.75, 0],
      [0.98, 0.16],
      [0.98, 0.38],
      [0.75, 0.54],
      [0, 0.54],
    ],
  ],
  Q: [
    [
      [0.25, 0],
      [0.75, 0],
      [1, 0.22],
      [1, 0.78],
      [0.75, 1],
      [0.25, 1],
      [0, 0.78],
      [0, 0.22],
      [0.25, 0],
    ],
    [
      [0.58, 0.68],
      [1.04, 1.05],
    ],
  ],
  R: [
    [
      [0, 1],
      [0, 0],
      [0.75, 0],
      [0.98, 0.16],
      [0.98, 0.36],
      [0.75, 0.52],
      [0, 0.52],
    ],
    [
      [0.55, 0.52],
      [1, 1],
    ],
  ],
  S: [
    [
      [0.94, 0.16],
      [0.74, 0],
      [0.24, 0],
      [0, 0.16],
      [0, 0.36],
      [0.22, 0.48],
      [0.78, 0.54],
      [1, 0.68],
      [1, 0.86],
      [0.76, 1],
      [0.22, 1],
      [0, 0.84],
    ],
  ],
  T: [
    [
      [0, 0],
      [1, 0],
    ],
    [
      [0.5, 0],
      [0.5, 1],
    ],
  ],
  U: [
    [
      [0, 0],
      [0, 0.78],
      [0.25, 1],
      [0.75, 1],
      [1, 0.78],
      [1, 0],
    ],
  ],
  V: [
    [
      [0, 0],
      [0.5, 1],
      [1, 0],
    ],
  ],
  W: [
    [
      [0, 0],
      [0.24, 1],
      [0.5, 0.42],
      [0.76, 1],
      [1, 0],
    ],
  ],
  X: [
    [
      [0, 0],
      [1, 1],
    ],
    [
      [1, 0],
      [0, 1],
    ],
  ],
  Y: [
    [
      [0, 0],
      [0.5, 0.5],
      [1, 0],
    ],
    [
      [0.5, 0.5],
      [0.5, 1],
    ],
  ],
  Z: [
    [
      [0, 0],
      [1, 0],
      [0, 1],
      [1, 1],
    ],
  ],
  '0': [
    [
      [0.25, 0],
      [0.75, 0],
      [1, 0.22],
      [1, 0.78],
      [0.75, 1],
      [0.25, 1],
      [0, 0.78],
      [0, 0.22],
      [0.25, 0],
    ],
    [
      [0.18, 0.82],
      [0.82, 0.18],
    ],
  ],
  '1': [
    [
      [0.2, 0.22],
      [0.52, 0],
      [0.52, 1],
    ],
    [
      [0.18, 1],
      [0.86, 1],
    ],
  ],
  '2': [
    [
      [0.04, 0.22],
      [0.26, 0],
      [0.76, 0],
      [0.98, 0.18],
      [0.98, 0.4],
      [0, 1],
      [1, 1],
    ],
  ],
  '3': [
    [
      [0.05, 0.16],
      [0.26, 0],
      [0.76, 0],
      [0.96, 0.18],
      [0.96, 0.36],
      [0.72, 0.48],
      [0.38, 0.48],
    ],
    [
      [0.72, 0.48],
      [1, 0.64],
      [1, 0.84],
      [0.76, 1],
      [0.24, 1],
      [0.04, 0.84],
    ],
  ],
  '4': [
    [
      [0.74, 1],
      [0.74, 0],
      [0, 0.66],
      [1, 0.66],
    ],
  ],
  '5': [
    [
      [0.94, 0],
      [0.08, 0],
      [0.04, 0.46],
      [0.74, 0.46],
      [0.98, 0.62],
      [0.98, 0.84],
      [0.74, 1],
      [0.22, 1],
      [0.02, 0.84],
    ],
  ],
  '6': [
    [
      [0.88, 0.12],
      [0.68, 0],
      [0.26, 0],
      [0, 0.24],
      [0, 0.8],
      [0.24, 1],
      [0.76, 1],
      [0.98, 0.8],
      [0.98, 0.6],
      [0.74, 0.46],
      [0, 0.46],
    ],
  ],
  '7': [
    [
      [0, 0],
      [1, 0],
      [0.34, 1],
    ],
  ],
  '8': [
    [
      [0.26, 0.48],
      [0.04, 0.34],
      [0.04, 0.16],
      [0.26, 0],
      [0.74, 0],
      [0.96, 0.16],
      [0.96, 0.34],
      [0.74, 0.48],
      [0.26, 0.48],
      [0, 0.64],
      [0, 0.84],
      [0.24, 1],
      [0.76, 1],
      [1, 0.84],
      [1, 0.64],
      [0.74, 0.48],
    ],
  ],
  '9': [
    [
      [0.98, 0.52],
      [0.26, 0.52],
      [0.02, 0.38],
      [0.02, 0.18],
      [0.26, 0],
      [0.74, 0],
      [0.98, 0.2],
      [0.98, 0.78],
      [0.72, 1],
      [0.22, 1],
    ],
  ],
  ':': [
    [
      [0.44, 0.26],
      [0.56, 0.26],
      [0.56, 0.38],
      [0.44, 0.38],
      [0.44, 0.26],
    ],
    [
      [0.44, 0.68],
      [0.56, 0.68],
      [0.56, 0.8],
      [0.44, 0.8],
      [0.44, 0.68],
    ],
  ],
  '-': [
    [
      [0.14, 0.5],
      [0.86, 0.5],
    ],
  ],
  '/': [
    [
      [0.1, 1],
      [0.9, 0],
    ],
  ],
  '.': [
    [
      [0.42, 0.88],
      [0.58, 0.88],
      [0.58, 1],
      [0.42, 1],
      [0.42, 0.88],
    ],
  ],
  '·': [
    [
      [0.42, 0.44],
      [0.58, 0.44],
      [0.58, 0.56],
      [0.42, 0.56],
      [0.42, 0.44],
    ],
  ],
  '(': [
    [
      [0.7, 0],
      [0.32, 0.28],
      [0.32, 0.72],
      [0.7, 1],
    ],
  ],
  ')': [
    [
      [0.3, 0],
      [0.68, 0.28],
      [0.68, 0.72],
      [0.3, 1],
    ],
  ],
  '!': [
    [
      [0.5, 0],
      [0.5, 0.72],
    ],
    [
      [0.44, 0.88],
      [0.56, 0.88],
      [0.56, 1],
      [0.44, 1],
      [0.44, 0.88],
    ],
  ],
  '#': [
    [
      [0.3, 0],
      [0.2, 1],
    ],
    [
      [0.8, 0],
      [0.7, 1],
    ],
    [
      [0.05, 0.35],
      [0.95, 0.35],
    ],
    [
      [0.05, 0.68],
      [0.95, 0.68],
    ],
  ],
  '+': [
    [
      [0.5, 0.18],
      [0.5, 0.82],
    ],
    [
      [0.15, 0.5],
      [0.85, 0.5],
    ],
  ],
};

const ACUTE_STROKE: StrokePolyline = [
  [0.42, -0.1],
  [0.68, -0.28],
];

const TILDE_STROKE: StrokePolyline = [
  [0.2, -0.18],
  [0.4, -0.26],
  [0.6, -0.14],
  [0.8, -0.24],
];

function getGlyphStrokes(rawChar: string): StrokePolyline[] | null {
  const upper = rawChar.toUpperCase();
  if (upper === ' ') return [];
  if (upper === 'Á') return [...BASE_GLYPHS.A, ACUTE_STROKE];
  if (upper === 'É') return [...BASE_GLYPHS.E, ACUTE_STROKE];
  if (upper === 'Í') return [...BASE_GLYPHS.I, ACUTE_STROKE];
  if (upper === 'Ó') return [...BASE_GLYPHS.O, ACUTE_STROKE];
  if (upper === 'Ú' || upper === 'Ü') return [...BASE_GLYPHS.U, ACUTE_STROKE];
  if (upper === 'Ñ') return [...BASE_GLYPHS.N, TILDE_STROKE];
  if (BASE_GLYPHS[upper]) return BASE_GLYPHS[upper];

  const stripped = upper.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  if (BASE_GLYPHS[stripped]) return BASE_GLYPHS[stripped];
  return null;
}

/**
 * Convierte una cadena de texto en un <path d="..." /> vectorial single-stroke centrado en (centerX, topY).
 */
export function buildCenteredVectorTextPath(
  text: string,
  centerX: number,
  topY: number,
  charHeightMm: number,
  maxWidthMm?: number
): string {
  const clean = text.trim() || 'EQUIPO MAKER';
  const chars = Array.from(clean);

  const aspect = 0.64;
  let height = charHeightMm;
  let charW = height * aspect;
  let gap = height * 0.26;
  let totalW = chars.length * charW + Math.max(0, chars.length - 1) * gap;

  if (maxWidthMm && totalW > maxWidthMm && totalW > 0) {
    const scale = maxWidthMm / totalW;
    height *= scale;
    charW *= scale;
    gap *= scale;
    totalW = maxWidthMm;
  }

  const startX = centerX - totalW / 2;
  const commands: string[] = [];

  chars.forEach((ch, idx) => {
    const strokes = getGlyphStrokes(ch);
    if (!strokes || strokes.length === 0) return;
    const ox = startX + idx * (charW + gap);
    for (const poly of strokes) {
      poly.forEach(([gx, gy], pIdx) => {
        const px = (ox + gx * charW).toFixed(3);
        const py = (topY + gy * height).toFixed(3);
        commands.push(`${pIdx === 0 ? 'M' : 'L'} ${px} ${py}`);
      });
    }
  });

  return commands.join(' ');
}

export interface TangramSvgOptions {
  teamName: string;
  silhouette: TangramSilhouetteDef;
  elapsedSeconds: number;
  params: TangramParams;
  cadVariant?: CadSubdivisionVariant;
}

/**
 * Genera el archivo .SVG parametrizado listo para LightBurn:
 * - Capa Corte (#FF0000, 0.1 mm): Placa Base (L+2m)x(L+2m) + Cuadrado Tangrama LxL con sus 5 líneas de subdivisión para las 7 piezas.
 * - Capa Grabado Vectorial (#0000FF): Recuadro guía LxL centrado en la base, contorno en miniatura de la silueta resuelta, Nombre del Equipo y Tiempo Récord.
 */
export function generateTangramLaserSvg({
  teamName,
  silhouette,
  elapsedSeconds,
  params,
  cadVariant = 'A',
}: TangramSvgOptions): string {
  const L = Math.max(50, params.sideMm);
  const m = Math.max(2, params.baseMarginMm);
  const baseSide = L + 2 * m;

  const pad = 8;
  const gapBetweenPlates = 12;

  // Placa Base a la izquierda, Cuadrado de Corte de las 7 Piezas a la derecha
  const baseX = pad;
  const baseY = pad;
  const guideX = baseX + m;
  const guideY = baseY + m;

  const tangramX = baseX + baseSide + gapBetweenPlates;
  const tangramY = baseY + m;

  const totalWidth = pad + baseSide + gapBetweenPlates + L + pad;
  const totalHeight = pad + baseSide + pad;

  const baseCenterX = baseX + baseSide / 2;

  // 1. Contorno en miniatura de la silueta resuelta centrado en la Placa Base (#0000FF)
  const loops = computeSilhouetteBoundaryLoops(silhouette);
  let sMinX = Infinity;
  let sMaxX = -Infinity;
  let sMinY = Infinity;
  let sMaxY = -Infinity;
  for (const loop of loops) {
    for (const [lx, ly] of loop) {
      if (lx < sMinX) sMinX = lx;
      if (lx > sMaxX) sMaxX = lx;
      if (ly < sMinY) sMinY = ly;
      if (ly > sMaxY) sMaxY = ly;
    }
  }
  const sWidth = Math.max(0.01, sMaxX - sMinX);
  const sHeight = Math.max(0.01, sMaxY - sMinY);
  const sMidX = (sMinX + sMaxX) / 2;
  const sMidY = (sMinY + sMaxY) / 2;

  const miniMaxBox = L * 0.44;
  const miniScale = Math.min(miniMaxBox / sWidth, miniMaxBox / sHeight);
  const miniCenterY = guideY + L * 0.41;

  const silhouettePathCommands: string[] = [];
  for (const loop of loops) {
    loop.forEach(([lx, ly], idx) => {
      const px = (baseCenterX + (lx - sMidX) * miniScale).toFixed(3);
      const py = (miniCenterY + (ly - sMidY) * miniScale).toFixed(3);
      silhouettePathCommands.push(`${idx === 0 ? 'M' : 'L'} ${px} ${py}`);
    });
    silhouettePathCommands.push('Z');
  }

  // 2. Textos vectoriales single-stroke (#0000FF) dentro de la Placa Base
  const safeTeam = (teamName.trim() || 'EQUIPO ALFA').toUpperCase();
  const timeStr = formatStopwatch(elapsedSeconds);
  const headerPath = buildCenteredVectorTextPath(
    'MAKERBOX UTALCA · DESAFIO TANGRAMA CAD',
    baseCenterX,
    guideY + L * 0.075,
    L * 0.028,
    L * 0.88
  );
  const teamPath = buildCenteredVectorTextPath(
    safeTeam,
    baseCenterX,
    guideY + L * 0.73,
    L * 0.052,
    L * 0.86
  );
  const metaPath = buildCenteredVectorTextPath(
    `SILUETA: ${silhouette.name.toUpperCase()}  -  RECORD: ${timeStr}`,
    baseCenterX,
    guideY + L * 0.835,
    L * 0.032,
    L * 0.88
  );

  // Líneas decorativas técnicas del bloque de grabado (#0000FF)
  const dividerLeft = (guideX + L * 0.08).toFixed(3);
  const dividerRight = (guideX + L * 0.92).toFixed(3);
  const dividerTopY = (guideY + L * 0.135).toFixed(3);
  const dividerBotY = (guideY + L * 0.685).toFixed(3);

  // 3. Los 5 segmentos internos de corte del Tangrama (#FF0000, 0.1 mm)
  // Transformación de coordenadas CAD (Y hacia arriba) a SVG (Y hacia abajo):
  // svgX = tangramX + node.x * L
  // svgY = tangramY + (1 - node.y) * L
  const allCadSegments = [...CAD_CORE_SEGMENTS, ...CAD_VARIANT_SEGMENTS[cadVariant]];
  const internalCutLines = allCadSegments
    .map((seg) => {
      const n1 = CAD_NODE_MAP[seg.fromId];
      const n2 = CAD_NODE_MAP[seg.toId];
      const x1 = (tangramX + n1.x * L).toFixed(3);
      const y1 = (tangramY + (1 - n1.y) * L).toFixed(3);
      const x2 = (tangramX + n2.x * L).toFixed(3);
      const y2 = (tangramY + (1 - n2.y) * L).toFixed(3);
      return `    <line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" />`;
    })
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${totalWidth.toFixed(2)}mm" height="${totalHeight.toFixed(2)}mm" viewBox="0 0 ${totalWidth.toFixed(3)} ${totalHeight.toFixed(3)}">
  <title>Taller 3 Tangrama CAD - ${safeTeam} (${silhouette.name} - ${timeStr})</title>
  <desc>Generado por MakerBox UTalca. Rojo (#FF0000, 0.1mm) = Corte Laser | Azul (#0000FF) = Grabado Vectorial.</desc>

  <!-- CAPA GRABADO VECTORIAL (#0000FF) CENTRADA EN PLACA BASE DE ${baseSide}x${baseSide} mm -->
  <g id="GRABADO_VECTORIAL_AZUL" fill="none" stroke="#0000FF" stroke-width="0.15" stroke-linecap="round" stroke-linejoin="round">
    <!-- Recuadro guia centrado de ${L}x${L} mm -->
    <rect x="${guideX.toFixed(3)}" y="${guideY.toFixed(3)}" width="${L.toFixed(3)}" height="${L.toFixed(3)}" />
    <!-- Lineas de encuadre tecnico -->
    <line x1="${dividerLeft}" y1="${dividerTopY}" x2="${dividerRight}" y2="${dividerTopY}" />
    <line x1="${dividerLeft}" y1="${dividerBotY}" x2="${dividerRight}" y2="${dividerBotY}" />
    <!-- Contorno en miniatura de la silueta resuelta (${silhouette.name}) -->
    <path d="${silhouettePathCommands.join(' ')}" />
    <!-- Encabezado, Nombre del Equipo y Tiempo Record -->
    <path d="${headerPath}" />
    <path d="${teamPath}" />
    <path d="${metaPath}" />
  </g>

  <!-- CAPA CORTE LASER (#FF0000, 0.1 mm) -->
  <g id="CORTE_LASER_ROJO" fill="none" stroke="#FF0000" stroke-width="0.1" stroke-linecap="round" stroke-linejoin="round">
    <!-- Cuadrado exterior de la Placa Base (${baseSide}x${baseSide} mm) -->
    <rect x="${baseX.toFixed(3)}" y="${baseY.toFixed(3)}" width="${baseSide.toFixed(3)}" height="${baseSide.toFixed(3)}" />
    <!-- Cuadrado exterior del Tangrama (${L}x${L} mm) -->
    <rect x="${tangramX.toFixed(3)}" y="${tangramY.toFixed(3)}" width="${L.toFixed(3)}" height="${L.toFixed(3)}" />
    <!-- 5 segmentos internos de subdivision para las 7 piezas del Tangrama -->
${internalCutLines}
  </g>
</svg>`;
}

// ============================================================================
// GENERADOR 3D .STL PARAMÉTRICO (KIT 4 BORDES PERIMETRALES CON INGLETE A 45°)
// ============================================================================

type Vec3 = [number, number, number];

function computeNormal(a: Vec3, b: Vec3, c: Vec3): Vec3 {
  const ux = b[0] - a[0];
  const uy = b[1] - a[1];
  const uz = b[2] - a[2];
  const vx = c[0] - a[0];
  const vy = c[1] - a[1];
  const vz = c[2] - a[2];
  const nx = uy * vz - uz * vy;
  const ny = uz * vx - ux * vz;
  const nz = ux * vy - uy * vx;
  const len = Math.hypot(nx, ny, nz) || 1;
  return [nx / len, ny / len, nz / len];
}

export interface StlFrameMetrics {
  outerLengthMm: number;
  slotBackLengthMm: number;
  innerOpeningMm: number;
  slotWidthMm: number;
  slotDepthMm: number;
  topStopperHeightMm: number;
  spineWallMm: number;
  bottomLipMm: number;
  profileHeightMm: number;
  profileDepthMm: number;
}

export function getStlFrameMetrics(params: TangramParams): StlFrameMetrics {
  const L = Math.max(50, params.sideMm);
  const m = Math.max(2, params.baseMarginMm);
  const t = Math.max(1, params.thicknessMm);

  const spineWallMm = 2.0; // Base (110) + 2*2.0 = 114 mm largo exterior exacto
  const bottomLipMm = 2.0;
  const slotWidthMm = Number((t + 0.1).toFixed(2)); // 3.1 mm para espesor 3 mm
  const slotDepthMm = m; // 5.0 mm de fondo
  const topStopperHeightMm = t; // 3.0 mm de alto para encerrar las piezas

  const baseSideMm = L + 2 * m;
  const outerLengthMm = baseSideMm + 2 * spineWallMm; // 114 mm
  const slotBackLengthMm = baseSideMm; // 110 mm
  const innerOpeningMm = L; // 100 mm
  const profileHeightMm = Number((bottomLipMm + slotWidthMm + topStopperHeightMm).toFixed(2));
  const profileDepthMm = Number((spineWallMm + slotDepthMm).toFixed(2));

  return {
    outerLengthMm,
    slotBackLengthMm,
    innerOpeningMm,
    slotWidthMm,
    slotDepthMm,
    topStopperHeightMm,
    spineWallMm,
    bottomLipMm,
    profileHeightMm,
    profileDepthMm,
  };
}

/**
 * Construye los 28 triángulos cerrados (manifold hermético) de 1 perfil C con esquinas a 45°
 * apoyado sobre su lomo exterior (Z = 0) para impresión 3D directa sin soportes.
 */
function buildSingleMiteredBarTriangles(
  metrics: StlFrameMetrics,
  yOffsetMm: number
): [Vec3, Vec3, Vec3][] {
  const {
    outerLengthMm,
    spineWallMm,
    bottomLipMm,
    slotWidthMm,
    profileHeightMm,
    profileDepthMm,
  } = metrics;

  const y0 = 0;
  const y1 = bottomLipMm;
  const y2 = bottomLipMm + slotWidthMm;
  const y3 = profileHeightMm;

  const z0 = 0;
  const z1 = spineWallMm;
  const z2 = profileDepthMm;

  // Polígono simple de 8 vértices de la sección transversal en (Y, Z) en sentido antihorario (CCW)
  const sectionYZ: [number, number][] = [
    [y0, z0], // p0: (0, 0)
    [y3, z0], // p1: (8.1, 0)
    [y3, z2], // p2: (8.1, 7.0)
    [y2, z2], // p3: (5.1, 7.0)
    [y2, z1], // p4: (5.1, 2.0)
    [y1, z1], // p5: (2.0, 2.0)
    [y1, z2], // p6: (2.0, 7.0)
    [y0, z2], // p7: (0, 7.0)
  ];

  // En altura Z, el semilargo X disminuye con pendiente de 45°: X_half(z) = outerLength/2 - z
  const halfOuter = outerLengthMm / 2;
  const leftCap: Vec3[] = sectionYZ.map(([py, pz]) => [
    -(halfOuter - pz),
    py + yOffsetMm,
    pz,
  ]);
  const rightCap: Vec3[] = sectionYZ.map(([py, pz]) => [
    +(halfOuter - pz),
    py + yOffsetMm,
    pz,
  ]);

  // Triangulación exacta sin puntos Steiner del octágono C (6 triángulos CCW en Y-Z)
  const capTriIndices: [number, number, number][] = [
    [0, 5, 6],
    [0, 6, 7],
    [0, 1, 4],
    [0, 4, 5],
    [1, 2, 3],
    [1, 3, 4],
  ];

  const triangles: [Vec3, Vec3, Vec3][] = [];

  // Tapa derecha (+X, normal saliente (+1/sqrt(2), 0, +1/sqrt(2)))
  for (const [a, b, c] of capTriIndices) {
    triangles.push([rightCap[a], rightCap[b], rightCap[c]]);
  }

  // Tapa izquierda (-X, normal saliente (-1/sqrt(2), 0, +1/sqrt(2)) -> invertir orden)
  for (const [a, b, c] of capTriIndices) {
    triangles.push([leftCap[a], leftCap[c], leftCap[b]]);
  }

  // 8 caras longitudinales perimetrales (16 triángulos)
  const n = sectionYZ.length;
  for (let i = 0; i < n; i++) {
    const next = (i + 1) % n;
    triangles.push([leftCap[i], leftCap[next], rightCap[next]]);
    triangles.push([leftCap[i], rightCap[next], rightCap[i]]);
  }

  return triangles;
}

/**
 * Genera el archivo .STL ASCII con el Kit completo de los 4 bordes perimetrales 3D a 45°.
 */
export function generateTangramFrameStl(params: TangramParams): string {
  const metrics = getStlFrameMetrics(params);
  const spacingMm = 4.0;
  const pitchY = metrics.profileHeightMm + spacingMm;
  const startY = -((4 * metrics.profileHeightMm + 3 * spacingMm) / 2);

  const allTriangles: [Vec3, Vec3, Vec3][] = [];
  for (let barIdx = 0; barIdx < 4; barIdx++) {
    const yOffset = startY + barIdx * pitchY;
    allTriangles.push(...buildSingleMiteredBarTriangles(metrics, yOffset));
  }

  const lines: string[] = ['solid kit_4_bordes_tangrama_makerbox'];
  for (const [a, b, c] of allTriangles) {
    const [nx, ny, nz] = computeNormal(a, b, c);
    lines.push(
      `  facet normal ${nx.toFixed(6)} ${ny.toFixed(6)} ${nz.toFixed(6)}`,
      '    outer loop',
      `      vertex ${a[0].toFixed(4)} ${a[1].toFixed(4)} ${a[2].toFixed(4)}`,
      `      vertex ${b[0].toFixed(4)} ${b[1].toFixed(4)} ${b[2].toFixed(4)}`,
      `      vertex ${c[0].toFixed(4)} ${c[1].toFixed(4)} ${c[2].toFixed(4)}`,
      '    endloop',
      '  endfacet'
    );
  }
  lines.push('endsolid kit_4_bordes_tangrama_makerbox');
  return lines.join('\n');
}
