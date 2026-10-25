import {
  buildLaserSvgDocument,
  estimateFalconJobMinutes,
  insetPolygon,
  polygonPerimeterMm,
  polygonToSvgPath,
} from './falconLaserSpec';
import { renderVectorText } from './vectorFont';

export type PolyiamondPuzzleId = 'nine_pointy_p' | 'ten_hoes';

export type NinePointyPChallengeId = 'ignore_dots' | 'show_9_dots' | 'hide_all_dots';
export type TenHoesChallengeId = 'challenge_1' | 'challenge_2' | 'challenge_3' | 'challenge_4';

export interface PolyiamondPuzzleConfig {
  puzzleId: PolyiamondPuzzleId;
  unitSideMm: number; // Lado s del triángulo equilátero unitario (13 - 18 mm)
  toleranceMm: number; // Holgura mecánica total de encaje (0.10 - 0.35 mm)
  cornerRadiusMm: number; // Radio de redondeo de vértices en piezas móviles (0 - 1.4 mm)
  showGridOnBase: boolean; // Si true, marca suavemente la red triangular en la base (modo guiado)
  includeSchoolStamp: boolean; // Sello institucional Feria Científica LBN Maipú + MakerBox
}

export const DEFAULT_POLYIAMOND_CONFIG: PolyiamondPuzzleConfig = {
  puzzleId: 'nine_pointy_p',
  unitSideMm: 15,
  toleranceMm: 0.2,
  cornerRadiusMm: 0.85,
  showGridOnBase: false,
  includeSchoolStamp: true,
};

export interface GridTriangleCell {
  a: number;
  b: number;
  d: 0 | 1; // 0 = Up (▲), 1 = Down (▼)
}

export interface NumberedCellSpec extends GridTriangleCell {
  num: 1 | 2 | 3 | 4;
  rowFromTop: number;
  colFromLeft: number;
}

export interface SolvedPiecePlacement {
  chirality: 'A' | 'B';
  dotUV: readonly [number, number] | null;
  boundaryUV: readonly (readonly [number, number])[];
}

export interface VerifiedSolutionSpec {
  emptyCells: readonly (readonly [number, number, number])[];
  pieces: readonly SolvedPiecePlacement[];
}

// Isla fija de Nine Pointy P (N = 7): Up(r = 3, c = 2) => a = 2, b = 7 - 1 - 3 = 3, d = 0
export const NINE_P_ISLAND_CELL: GridTriangleCell = { a: 2, b: 3, d: 0 };

// Los 8 triángulos numerados (1..4, dos de cada uno) de Ten Hoes (N = 8)
export const TEN_HOES_NUMBERED_CELLS: NumberedCellSpec[] = [
  { num: 1, rowFromTop: 0, colFromLeft: 0, a: 0, b: 7, d: 0 },
  { num: 1, rowFromTop: 4, colFromLeft: 2, a: 2, b: 3, d: 0 },
  { num: 2, rowFromTop: 4, colFromLeft: 1, a: 1, b: 3, d: 1 },
  { num: 2, rowFromTop: 7, colFromLeft: 3, a: 3, b: 0, d: 0 },
  { num: 3, rowFromTop: 1, colFromLeft: 1, a: 1, b: 6, d: 0 },
  { num: 3, rowFromTop: 4, colFromLeft: 3, a: 3, b: 3, d: 0 },
  { num: 4, rowFromTop: 3, colFromLeft: 1, a: 1, b: 4, d: 1 },
  { num: 4, rowFromTop: 7, colFromLeft: 5, a: 5, b: 0, d: 1 },
];

// Soluciones verificadas exhaustivamente mediante backtracking exacto
export const NINE_P_SOLUTIONS: Record<NinePointyPChallengeId, VerifiedSolutionSpec> = {
  ignore_dots: {
    emptyCells: [
      [6, 0, 0],
      [1, 3, 1],
      [0, 6, 0],
    ],
    pieces: [
      { chirality: 'B', dotUV: [0.5, 1.5], boundaryUV: [[0, 0], [0, 2], [1, 2], [2, 1], [1, 1], [1, 0]] },
      { chirality: 'A', dotUV: [2.5, 0.5], boundaryUV: [[1, 0], [3, 0], [3, 1], [2, 2], [2, 1], [1, 1]] },
      { chirality: 'A', dotUV: [4.5, 0.5], boundaryUV: [[3, 0], [5, 0], [5, 1], [4, 2], [4, 1], [3, 1]] },
      { chirality: 'B', dotUV: [5.5, 1], boundaryUV: [[4, 3], [6, 1], [6, 0], [5, 0], [5, 1], [4, 2]] },
      { chirality: 'A', dotUV: [1.5, 2.5], boundaryUV: [[3, 3], [1, 3], [1, 2], [2, 1], [2, 2], [3, 2]] },
      { chirality: 'B', dotUV: [3.5, 1.5], boundaryUV: [[4, 3], [4, 1], [3, 1], [2, 2], [3, 2], [3, 3]] },
      { chirality: 'B', dotUV: [0.5, 3.5], boundaryUV: [[0, 2], [0, 4], [1, 4], [2, 3], [1, 3], [1, 2]] },
      { chirality: 'A', dotUV: [2, 4.5], boundaryUV: [[4, 3], [2, 5], [1, 5], [1, 4], [2, 4], [3, 3]] },
      { chirality: 'B', dotUV: [0.5, 5.5], boundaryUV: [[0, 4], [0, 6], [1, 6], [2, 5], [1, 5], [1, 4]] },
    ],
  },
  show_9_dots: {
    emptyCells: [
      [0, 0, 0],
      [6, 0, 0],
      [0, 6, 0],
    ],
    pieces: [
      { chirality: 'B', dotUV: [1, 0.5], boundaryUV: [[3, 0], [1, 0], [0, 1], [0, 2], [1, 1], [2, 1]] },
      { chirality: 'B', dotUV: [3, 0.5], boundaryUV: [[5, 0], [3, 0], [2, 1], [2, 2], [3, 1], [4, 1]] },
      { chirality: 'B', dotUV: [4, 1.5], boundaryUV: [[2, 2], [4, 2], [5, 1], [5, 0], [4, 1], [3, 1]] },
      { chirality: 'B', dotUV: [5.5, 1], boundaryUV: [[4, 3], [6, 1], [6, 0], [5, 0], [5, 1], [4, 2]] },
      { chirality: 'A', dotUV: [0.5, 2], boundaryUV: [[0, 4], [0, 2], [1, 1], [2, 1], [1, 2], [1, 3]] },
      { chirality: 'A', dotUV: [1.5, 2.5], boundaryUV: [[3, 3], [1, 3], [1, 2], [2, 1], [2, 2], [3, 2]] },
      { chirality: 'B', dotUV: [3.5, 3], boundaryUV: [[2, 5], [4, 3], [4, 2], [3, 2], [3, 3], [2, 4]] },
      { chirality: 'B', dotUV: [1.5, 3.5], boundaryUV: [[2, 5], [2, 3], [1, 3], [0, 4], [1, 4], [1, 5]] },
      { chirality: 'B', dotUV: [0.5, 5.5], boundaryUV: [[0, 4], [0, 6], [1, 6], [2, 5], [1, 5], [1, 4]] },
    ],
  },
  hide_all_dots: {
    emptyCells: [
      [0, 0, 0],
      [6, 0, 0],
      [0, 6, 0],
    ],
    pieces: [
      { chirality: 'A', dotUV: [0.5, 1], boundaryUV: [[0, 3], [0, 1], [1, 0], [2, 0], [1, 1], [1, 2]] },
      { chirality: 'B', dotUV: [2, 0.5], boundaryUV: [[4, 0], [2, 0], [1, 1], [1, 2], [2, 1], [3, 1]] },
      { chirality: 'A', dotUV: [3, 1.5], boundaryUV: [[5, 0], [3, 2], [2, 2], [2, 1], [3, 1], [4, 0]] },
      { chirality: 'A', dotUV: [5, 0.5], boundaryUV: [[3, 2], [5, 0], [6, 0], [6, 1], [5, 1], [4, 2]] },
      { chirality: 'A', dotUV: [1.5, 2.5], boundaryUV: [[3, 3], [1, 3], [1, 2], [2, 1], [2, 2], [3, 2]] },
      { chirality: 'A', dotUV: [4, 2.5], boundaryUV: [[6, 1], [4, 3], [3, 3], [3, 2], [4, 2], [5, 1]] },
      { chirality: 'A', dotUV: [0.5, 3.5], boundaryUV: [[2, 4], [0, 4], [0, 3], [1, 2], [1, 3], [2, 3]] },
      { chirality: 'A', dotUV: [2, 4.5], boundaryUV: [[4, 3], [2, 5], [1, 5], [1, 4], [2, 4], [3, 3]] },
      { chirality: 'B', dotUV: [0.5, 5.5], boundaryUV: [[0, 4], [0, 6], [1, 6], [2, 5], [1, 5], [1, 4]] },
    ],
  },
};

export const TEN_HOES_SOLUTIONS: Record<TenHoesChallengeId, VerifiedSolutionSpec> = {
  challenge_1: {
    emptyCells: [
      [1, 0, 1],
      [0, 6, 1],
    ],
    pieces: [
      { chirality: 'A', dotUV: null, boundaryUV: [[0, 0], [2, 0], [1, 1], [1, 2], [0, 3]] },
      { chirality: 'A', dotUV: null, boundaryUV: [[5, 0], [3, 2], [3, 1], [2, 1], [2, 0]] },
      { chirality: 'A', dotUV: null, boundaryUV: [[5, 0], [5, 2], [4, 2], [3, 3], [2, 3]] },
      { chirality: 'B', dotUV: null, boundaryUV: [[5, 0], [5, 2], [6, 1], [7, 1], [8, 0]] },
      { chirality: 'B', dotUV: null, boundaryUV: [[3, 1], [1, 1], [1, 2], [0, 3], [0, 4]] },
      { chirality: 'B', dotUV: null, boundaryUV: [[0, 4], [2, 4], [2, 3], [3, 2], [3, 1]] },
      { chirality: 'A', dotUV: null, boundaryUV: [[4, 4], [4, 2], [5, 2], [6, 1], [7, 1]] },
      { chirality: 'A', dotUV: null, boundaryUV: [[4, 2], [4, 4], [3, 4], [2, 5], [1, 5]] },
      { chirality: 'A', dotUV: null, boundaryUV: [[0, 4], [2, 4], [1, 5], [1, 6], [0, 7]] },
      { chirality: 'A', dotUV: null, boundaryUV: [[1, 7], [1, 5], [2, 5], [3, 4], [4, 4]] },
    ],
  },
  challenge_2: {
    emptyCells: [
      [5, 1, 1],
      [2, 3, 0],
    ],
    pieces: [
      { chirality: 'B', dotUV: null, boundaryUV: [[0, 0], [0, 2], [1, 1], [2, 1], [3, 0]] },
      { chirality: 'B', dotUV: null, boundaryUV: [[3, 2], [3, 0], [2, 1], [1, 1], [0, 2]] },
      { chirality: 'A', dotUV: null, boundaryUV: [[4, 3], [2, 3], [3, 2], [3, 1], [4, 0]] },
      { chirality: 'B', dotUV: null, boundaryUV: [[4, 3], [6, 1], [5, 1], [5, 0], [4, 0]] },
      { chirality: 'A', dotUV: null, boundaryUV: [[8, 0], [6, 2], [6, 1], [5, 1], [5, 0]] },
      { chirality: 'A', dotUV: null, boundaryUV: [[3, 2], [1, 4], [1, 3], [0, 3], [0, 2]] },
      { chirality: 'A', dotUV: null, boundaryUV: [[3, 5], [3, 3], [4, 3], [5, 2], [6, 2]] },
      { chirality: 'B', dotUV: null, boundaryUV: [[0, 6], [2, 4], [1, 4], [1, 3], [0, 3]] },
      { chirality: 'A', dotUV: null, boundaryUV: [[3, 3], [3, 5], [2, 5], [1, 6], [0, 6]] },
      { chirality: 'A', dotUV: null, boundaryUV: [[0, 8], [0, 6], [1, 6], [2, 5], [3, 5]] },
    ],
  },
  challenge_3: {
    emptyCells: [
      [2, 3, 1],
      [1, 5, 1],
    ],
    pieces: [
      { chirality: 'B', dotUV: null, boundaryUV: [[0, 0], [0, 2], [1, 1], [2, 1], [3, 0]] },
      { chirality: 'B', dotUV: null, boundaryUV: [[3, 2], [3, 0], [2, 1], [1, 1], [0, 2]] },
      { chirality: 'B', dotUV: null, boundaryUV: [[3, 0], [3, 2], [4, 1], [5, 1], [6, 0]] },
      { chirality: 'B', dotUV: null, boundaryUV: [[3, 3], [5, 3], [5, 2], [6, 1], [6, 0]] },
      { chirality: 'B', dotUV: null, boundaryUV: [[8, 0], [6, 0], [6, 1], [5, 2], [5, 3]] },
      { chirality: 'A', dotUV: null, boundaryUV: [[2, 4], [2, 2], [3, 2], [4, 1], [5, 1]] },
      { chirality: 'A', dotUV: null, boundaryUV: [[0, 2], [2, 2], [1, 3], [1, 4], [0, 5]] },
      { chirality: 'A', dotUV: null, boundaryUV: [[2, 5], [0, 5], [1, 4], [1, 3], [2, 2]] },
      { chirality: 'A', dotUV: null, boundaryUV: [[2, 6], [2, 4], [3, 4], [4, 3], [5, 3]] },
      { chirality: 'A', dotUV: null, boundaryUV: [[0, 5], [2, 5], [1, 6], [1, 7], [0, 8]] },
    ],
  },
  challenge_4: {
    emptyCells: [
      [3, 3, 1],
      [0, 4, 1],
    ],
    pieces: [
      { chirality: 'B', dotUV: null, boundaryUV: [[0, 0], [0, 2], [1, 1], [2, 1], [3, 0]] },
      { chirality: 'B', dotUV: null, boundaryUV: [[3, 2], [3, 0], [2, 1], [1, 1], [0, 2]] },
      { chirality: 'B', dotUV: null, boundaryUV: [[3, 0], [3, 2], [4, 1], [5, 1], [6, 0]] },
      { chirality: 'B', dotUV: null, boundaryUV: [[8, 0], [6, 0], [6, 1], [5, 2], [5, 3]] },
      { chirality: 'B', dotUV: null, boundaryUV: [[4, 3], [4, 1], [3, 2], [2, 2], [1, 3]] },
      { chirality: 'A', dotUV: null, boundaryUV: [[4, 1], [6, 1], [5, 2], [5, 3], [4, 4]] },
      { chirality: 'A', dotUV: null, boundaryUV: [[0, 2], [2, 2], [1, 3], [1, 4], [0, 5]] },
      { chirality: 'B', dotUV: null, boundaryUV: [[1, 3], [1, 5], [2, 4], [3, 4], [4, 3]] },
      { chirality: 'B', dotUV: null, boundaryUV: [[4, 4], [2, 4], [2, 5], [1, 6], [1, 7]] },
      { chirality: 'A', dotUV: null, boundaryUV: [[0, 5], [2, 5], [1, 6], [1, 7], [0, 8]] },
    ],
  },
};

export const NINE_P_CHALLENGE_META: Record<
  NinePointyPChallengeId,
  { title: string; badge: string; rule: string; solutionCountLabel: string }
> = {
  ignore_dots: {
    title: 'Desafío 1 · Ignorar los Puntos',
    badge: 'Nivel Exploratorio',
    rule: 'Se permite voltear libremente cualquiera de las 9 fichas P puntiagudas (quiralidad libre).',
    solutionCountLabel: '18 soluciones posibles',
  },
  show_9_dots: {
    title: 'Desafío 2 · Mostrar los 9 Puntos',
    badge: 'Solución Única',
    rule: 'Las 9 fichas deben colocarse con su punto grabado visible hacia arriba (7 P derechas + 2 P espejadas).',
    solutionCountLabel: '1 solución única exacta',
  },
  hide_all_dots: {
    title: 'Desafío 3 · Ocultar Todos los Puntos',
    badge: 'Solución Única',
    rule: 'Voltea las 9 fichas boca abajo para que no se vea ningún punto (invierte la quiralidad a 2 derechas + 7 espejadas).',
    solutionCountLabel: '1 solución única exacta',
  },
};

export const TEN_HOES_CHALLENGE_META: Record<
  TenHoesChallengeId,
  { num: 1 | 2 | 3 | 4; title: string; badge: string; rule: string; solutionCountLabel: string }
> = {
  challenge_1: {
    num: 1,
    title: 'Reto #1 · Dejar Libres los Dos «1»',
    badge: 'Eje de Simetría',
    rule: 'Encaja las 10 azadas dejando descubiertos los dos triángulos marcados con el número 1 (cima y centro).',
    solutionCountLabel: '1 solución única (simétrica)',
  },
  challenge_2: {
    num: 2,
    title: 'Reto #2 · Dejar Libres los Dos «2»',
    badge: 'Solución Única',
    rule: 'Encaja las 10 azadas manteniendo visibles los dos triángulos con el número 2 (centro-izquierda y base).',
    solutionCountLabel: '1 solución única exacta',
  },
  challenge_3: {
    num: 3,
    title: 'Reto #3 · Dejar Libres los Dos «3»',
    badge: 'Solución Única',
    rule: 'Encaja las 10 azadas manteniendo visibles los dos triángulos con el número 3 (borde superior derecho y centro).',
    solutionCountLabel: '1 solución única exacta',
  },
  challenge_4: {
    num: 4,
    title: 'Reto #4 · Dejar Libres los Dos «4»',
    badge: 'Solución Única',
    rule: 'Encaja las 10 azadas manteniendo visibles los dos triángulos invertidos con el número 4.',
    solutionCountLabel: '1 solución única exacta',
  },
};

/**
 * Convierte coordenadas oblicuas de retícula (u, v) dentro de un gran triángulo equilátero de orden N
 * a coordenadas cartesianas 2D (x, y) en mm, donde la cima del gran triángulo está en (apexX, apexY).
 */
export function gridUVToCartesian(
  u: number,
  v: number,
  N: number,
  unitSideMm: number,
  apexX: number,
  apexY: number
): [number, number] {
  const h = (unitSideMm * Math.sqrt(3)) / 2;
  const x = apexX + (u + (v - N) / 2) * unitSideMm;
  const y = apexY + (N - v) * h;
  return [x, y];
}

/**
 * Devuelve los 3 vértices cartesianos (x, y) de un triángulo unitario (a, b, d) en el tablero de orden N.
 */
export function gridCellVertices(
  a: number,
  b: number,
  d: number,
  N: number,
  unitSideMm: number,
  apexX: number,
  apexY: number
): [number, number][] {
  const uvVerts: [number, number][] =
    d === 0
      ? [
          [a, b],
          [a + 1, b],
          [a, b + 1],
        ]
      : [
          [a + 1, b],
          [a, b + 1],
          [a + 1, b + 1],
        ];
  return uvVerts.map(([u, v]) => gridUVToCartesian(u, v, N, unitSideMm, apexX, apexY));
}

/**
 * Genera un comando `<path>` SVG con arcos circulares tangentes exactos (`A r r ...`)
 * en todos los vértices (tanto convexos de 60°/120° como cóncavos de 240°).
 */
export function roundedPolygonToSvgPath(
  points: [number, number][],
  radiusMm: number
): string {
  const n = points.length;
  if (n < 3) return '';
  if (radiusMm <= 0.02) return polygonToSvgPath(points);

  const segments: string[] = [];

  for (let i = 0; i < n; i++) {
    const prev = points[(i - 1 + n) % n];
    const curr = points[i];
    const next = points[(i + 1) % n];

    const v1x = prev[0] - curr[0];
    const v1y = prev[1] - curr[1];
    const v2x = next[0] - curr[0];
    const v2y = next[1] - curr[1];

    const len1 = Math.hypot(v1x, v1y);
    const len2 = Math.hypot(v2x, v2y);

    if (len1 < 1e-5 || len2 < 1e-5) {
      segments.push(`${i === 0 ? 'M' : 'L'} ${curr[0].toFixed(2)} ${curr[1].toFixed(2)}`);
      continue;
    }

    const u1x = v1x / len1;
    const u1y = v1y / len1;
    const u2x = v2x / len2;
    const u2y = v2y / len2;

    const cosTheta = Math.max(-0.9999, Math.min(0.9999, u1x * u2x + u1y * u2y));
    const theta = Math.acos(cosTheta);
    const tanHalf = Math.tan(theta / 2);

    if (tanHalf < 1e-4) {
      segments.push(`${i === 0 ? 'M' : 'L'} ${curr[0].toFixed(2)} ${curr[1].toFixed(2)}`);
      continue;
    }

    const rawDist = radiusMm / tanHalf;
    const maxDist = 0.42 * Math.min(len1, len2);
    const dist = Math.min(rawDist, maxDist);
    const effRadius = dist * tanHalf;

    const t1x = curr[0] + u1x * dist;
    const t1y = curr[1] + u1y * dist;
    const t2x = curr[0] + u2x * dist;
    const t2y = curr[1] + u2y * dist;

    // Dirección de viaje entrante (-u1) vs saliente (+u2) determina sentido horario/antihorario en SVG
    const cross = -u1x * u2y - -u1y * u2x;
    const sweepFlag = cross >= 0 ? 1 : 0;

    segments.push(`${i === 0 ? 'M' : 'L'} ${t1x.toFixed(2)} ${t1y.toFixed(2)}`);
    segments.push(
      `A ${effRadius.toFixed(2)} ${effRadius.toFixed(2)} 0 0 ${sweepFlag} ${t2x.toFixed(2)} ${t2y.toFixed(2)}`
    );
  }

  segments.push('Z');
  return segments.join(' ');
}

export interface PolyiamondLaserResult {
  svgContent: string;
  widthMm: number;
  heightMm: number;
  estimatedMinutes: number;
  gridOrderN: number;
  totalGridTriangles: number;
  pieceCount: number;
  trianglesPerPiece: number;
  openMysteryTriangles: number;
  triangleBaseMm: number;
  boardWidthMm: number;
  boardHeightMm: number;
  unitAreaCm2: number;
  totalTriangleAreaCm2: number;
}

/**
 * Construye una pieza P puntiaguda vertical (altura 2.5s, ancho 2h) lista para corte láser
 */
function createUprightPointyP(
  s: number,
  mirroredLeft: boolean
): { points: [number, number][]; dotCenter: [number, number] } {
  const h = (s * Math.sqrt(3)) / 2;
  const rightPts: [number, number][] = [
    [0, 2.5 * s],
    [0, 0.5 * s],
    [h, 0],
    [2 * h, 0.5 * s],
    [h, 1.0 * s],
    [h, 2.0 * s],
  ];
  const rightDot: [number, number] = [0.5 * h, 0.75 * s];

  if (!mirroredLeft) {
    return { points: rightPts, dotCenter: rightDot };
  }
  return {
    points: rightPts.map(([x, y]) => [2 * h - x, y]),
    dotCenter: [2 * h - rightDot[0], rightDot[1]],
  };
}

/**
 * Construye un par anidado 180° de Azadas (Hoe hexiamonds) para empaquetado compacto en MDF 3 mm
 */
function createNestedHoePair(
  s: number,
  pairGapMm: number
): { hoeLeft: [number, number][]; hoeRight: [number, number][]; pairWidth: number; pairHeight: number } {
  const h = (s * Math.sqrt(3)) / 2;
  const gx = pairGapMm;
  const gy = pairGapMm * 0.55;

  // Pieza izquierda desplazada hacia abajo 1s + gy
  const hoeLeft: [number, number][] = [
    [0, 1.0 * s + gy],
    [0, 4.0 * s + gy],
    [2 * h, 3.0 * s + gy],
    [h, 2.5 * s + gy],
    [h, 1.5 * s + gy],
  ];

  // Pieza derecha rotada 180° y desplazada +gx a la derecha
  const baseHoe: [number, number][] = [
    [0, 0],
    [0, 3.0 * s],
    [2 * h, 2.0 * s],
    [h, 1.5 * s],
    [h, 0.5 * s],
  ];
  const hoeRight: [number, number][] = baseHoe.map(([x, y]) => [2 * h + gx - x, 3.0 * s - y]);

  return {
    hoeLeft,
    hoeRight,
    pairWidth: 2 * h + gx,
    pairHeight: 4.0 * s + gy,
  };
}

export function generatePolyiamondPuzzleLaser(
  config: PolyiamondPuzzleConfig = DEFAULT_POLYIAMOND_CONFIG
): PolyiamondLaserResult {
  const isNineP = config.puzzleId === 'nine_pointy_p';
  const N = isNineP ? 7 : 8;
  const s = Math.max(13, Math.min(18, config.unitSideMm));
  const h = (s * Math.sqrt(3)) / 2;
  const inset = Math.max(0, config.toleranceMm / 2);

  const margin = 8;
  const gap = 8;

  // Dimensiones del gran triángulo equilátero y del tablero rectangular de doble capa
  const triBase = N * s;
  const triHeight = N * h;
  const padX = 12;
  const padTop = 9;
  const padBottom = 10.5;

  const boardW = triBase + padX * 2;
  const boardH = triHeight + padTop + padBottom;

  const engraveParts: string[] = [];
  const scoreParts: string[] = [];
  const innerCutParts: string[] = [];
  const outerCutParts: string[] = [];

  let cutLengthMm = 0;
  let scoreLengthMm = 0;
  let engraveAreaMm2 = 0;

  // =========================================================================
  // FILA 1 · COLUMNA IZQUIERDA: PLACA BASE INFERIOR SÓLIDA (MDF 3 MM)
  // =========================================================================
  const baseX = margin;
  const baseY = margin;
  const baseApexX = baseX + boardW / 2;
  const baseApexY = baseY + padTop;

  outerCutParts.push(
    `    <rect x="${baseX.toFixed(2)}" y="${baseY.toFixed(2)}" width="${boardW.toFixed(
      2
    )}" height="${boardH.toFixed(2)}" rx="5" ry="5" />`
  );
  cutLengthMm += 2 * (boardW + boardH);

  // Silueta punteada del triángulo cavidad en la base para alinear el pegado del marco superior
  const baseOuterTri: [number, number][] = [
    gridUVToCartesian(0, N, N, s, baseApexX, baseApexY),
    gridUVToCartesian(0, 0, N, s, baseApexX, baseApexY),
    gridUVToCartesian(N, 0, N, s, baseApexX, baseApexY),
  ];
  scoreParts.push(
    `    <path d="${polygonToSvgPath(baseOuterTri)}" stroke-dasharray="2.2 1.8" />`
  );
  scoreLengthMm += 3 * triBase * 0.55;

  // Red triangular completa opcional (modo guiado docente)
  if (config.showGridOnBase) {
    for (let k = 1; k < N; k++) {
      // Líneas horizontales v = k
      const [hx1, hy1] = gridUVToCartesian(0, k, N, s, baseApexX, baseApexY);
      const [hx2, hy2] = gridUVToCartesian(N - k, k, N, s, baseApexX, baseApexY);
      scoreParts.push(
        `    <line x1="${hx1.toFixed(2)}" y1="${hy1.toFixed(2)}" x2="${hx2.toFixed(
          2
        )}" y2="${hy2.toFixed(2)}" stroke-dasharray="1.2 1.8" />`
      );
      // Diagonales u = k
      const [ux1, uy1] = gridUVToCartesian(k, 0, N, s, baseApexX, baseApexY);
      const [ux2, uy2] = gridUVToCartesian(k, N - k, N, s, baseApexX, baseApexY);
      scoreParts.push(
        `    <line x1="${ux1.toFixed(2)}" y1="${uy1.toFixed(2)}" x2="${ux2.toFixed(
          2
        )}" y2="${uy2.toFixed(2)}" stroke-dasharray="1.2 1.8" />`
      );
      // Diagonales u + v = k
      const [dx1, dy1] = gridUVToCartesian(0, k, N, s, baseApexX, baseApexY);
      const [dx2, dy2] = gridUVToCartesian(k, 0, N, s, baseApexX, baseApexY);
      scoreParts.push(
        `    <line x1="${dx1.toFixed(2)}" y1="${dy1.toFixed(2)}" x2="${dx2.toFixed(
          2
        )}" y2="${dy2.toFixed(2)}" stroke-dasharray="1.2 1.8" />`
      );
      scoreLengthMm += 3 * (N - k) * s * 0.45;
    }
  }

  if (isNineP) {
    // Marcar la isla fija Up(r=3, c=2) donde se pega el triangulito de madera
    const islVerts = gridCellVertices(
      NINE_P_ISLAND_CELL.a,
      NINE_P_ISLAND_CELL.b,
      NINE_P_ISLAND_CELL.d,
      N,
      s,
      baseApexX,
      baseApexY
    );
    scoreParts.push(`    <path d="${polygonToSvgPath(islVerts)}" />`);
    scoreLengthMm += 3 * s;

    const cx = (islVerts[0][0] + islVerts[1][0] + islVerts[2][0]) / 3;
    const cy = (islVerts[0][1] + islVerts[1][1] + islVerts[2][1]) / 3;
    const fsIsl = Math.max(1.5, s * 0.125);
    engraveParts.push(
      `    ${renderVectorText('PEGAR', {
        x: cx,
        y: cy - fsIsl * 0.42,
        fontSizeMm: fsIsl,
      })}`
    );
    engraveParts.push(
      `    ${renderVectorText('ISLA', {
        x: cx,
        y: cy + fsIsl * 0.72,
        fontSizeMm: fsIsl,
      })}`
    );
    engraveAreaMm2 += 14;
  } else {
    // Ten Hoes: Marcar los 8 triángulos numerados (1..4) en azul y grabar su número en negro
    TEN_HOES_NUMBERED_CELLS.forEach((cell) => {
      const verts = gridCellVertices(cell.a, cell.b, cell.d, N, s, baseApexX, baseApexY);
      scoreParts.push(`    <path d="${polygonToSvgPath(verts)}" />`);
      scoreLengthMm += 3 * s;

      const cx = (verts[0][0] + verts[1][0] + verts[2][0]) / 3;
      const cy = (verts[0][1] + verts[1][1] + verts[2][1]) / 3;
      engraveParts.push(
        `    ${renderVectorText(String(cell.num), {
          x: cx,
          y: cy,
          fontSizeMm: Math.max(3.2, s * 0.28),
        })}`
      );
      engraveAreaMm2 += 12;
    });
  }

  // Etiquetas guía en las esquinas superiores de la base inferior (quedan cubiertas al pegar el marco, salvo sello inferior)
  engraveParts.push(
    `    ${renderVectorText('BASE INFERIOR (CAPA 1)', {
      x: baseX + 26,
      y: baseY + 8,
      fontSizeMm: 2.0,
    })}`
  );
  if (config.includeSchoolStamp) {
    engraveParts.push(
      `    ${renderVectorText('FERIA CIENTÍFICA · LICEO BICENTENARIO DE NIÑAS DE MAIPÚ', {
        x: baseX + boardW / 2,
        y: baseY + boardH - padBottom / 2,
        fontSizeMm: Math.min(2.3, Math.max(1.75, boardW * 0.0155)),
      })}`
    );
    engraveAreaMm2 += 48;
  }

  // =========================================================================
  // FILA 1 · COLUMNA DERECHA: MARCO SUPERIOR CALADO (MDF 3 MM)
  // =========================================================================
  const frameX = baseX + boardW + gap;
  const frameY = margin;
  const frameApexX = frameX + boardW / 2;
  const frameApexY = frameY + padTop;

  const frameCutTri: [number, number][] = [
    gridUVToCartesian(0, N, N, s, frameApexX, frameApexY),
    gridUVToCartesian(0, 0, N, s, frameApexX, frameApexY),
    gridUVToCartesian(N, 0, N, s, frameApexX, frameApexY),
  ];
  innerCutParts.push(`    <path d="${polygonToSvgPath(frameCutTri)}" />`);
  outerCutParts.push(
    `    <rect x="${frameX.toFixed(2)}" y="${frameY.toFixed(2)}" width="${boardW.toFixed(
      2
    )}" height="${boardH.toFixed(2)}" rx="5" ry="5" />`
  );
  cutLengthMm += 3 * triBase + 2 * (boardW + boardH);

  // Diseño gráfico grabado en las enjutas superiores del Marco Superior (igual que los puzzles originales)
  const leftZoneCenterX = frameX + boardW * 0.20;
  const rightZoneLeftX = frameX + boardW * 0.62;

  if (isNineP) {
    engraveParts.push(
      `    ${renderVectorText('Nueve P', {
        x: leftZoneCenterX,
        y: frameY + 13,
        fontSizeMm: Math.max(3.6, s * 0.27),
      })}`
    );
    engraveParts.push(
      `    ${renderVectorText('Puntiagudas', {
        x: leftZoneCenterX,
        y: frameY + 19,
        fontSizeMm: Math.max(2.6, s * 0.19),
      })}`
    );

    // Ícono miniatura de la pieza P con la letra P adentro
    const iconS = Math.max(4.8, s * 0.36);
    const { points: miniP, dotCenter: miniDot } = createUprightPointyP(iconS, false);
    const iconW = iconS * Math.sqrt(3);
    const iconOx = leftZoneCenterX - iconW * 0.45;
    const iconOy = frameY + 24;
    const placedMiniP = miniP.map(([x, y]) => [x + iconOx, y + iconOy] as [number, number]);
    scoreParts.push(`    <path d="${roundedPolygonToSvgPath(placedMiniP, 0.35)}" />`);
    scoreLengthMm += polygonPerimeterMm(placedMiniP);
    engraveParts.push(
      `    ${renderVectorText('P', {
        x: iconOx + miniDot[0] + 0.3,
        y: iconOy + miniDot[1] + 0.5,
        fontSizeMm: iconS * 0.62,
      })}`
    );

    // Tres desafíos en la esquina superior derecha del marco
    const ruleFs = Math.max(2.05, Math.min(2.7, s * 0.165));
    const lineStep = ruleFs * 1.65;
    engraveParts.push(
      `    ${renderVectorText('Tres Desafíos:', {
        x: rightZoneLeftX,
        y: frameY + 12,
        fontSizeMm: ruleFs * 1.08,
        align: 'left',
      })}`
    );
    engraveParts.push(
      `    ${renderVectorText('1. Ignorar puntos', {
        x: rightZoneLeftX,
        y: frameY + 12 + lineStep,
        fontSizeMm: ruleFs,
        align: 'left',
      })}`
    );
    engraveParts.push(
      `    ${renderVectorText('2. Mostrar 9 puntos', {
        x: rightZoneLeftX,
        y: frameY + 12 + lineStep * 2,
        fontSizeMm: ruleFs,
        align: 'left',
      })}`
    );
    engraveParts.push(
      `    ${renderVectorText('3. Ocultar puntos', {
        x: rightZoneLeftX,
        y: frameY + 12 + lineStep * 3,
        fontSizeMm: ruleFs,
        align: 'left',
      })}`
    );
    engraveAreaMm2 += 95;
  } else {
    engraveParts.push(
      `    ${renderVectorText('Diez Azadas', {
        x: leftZoneCenterX + 2,
        y: frameY + 13.5,
        fontSizeMm: Math.max(3.5, s * 0.25),
      })}`
    );

    // Ícono miniatura de la Azada (Hoe hexiamond en reposo horizontal + herramienta azada adentro)
    const iconS = Math.max(4.4, s * 0.33);
    const iconH = (iconS * Math.sqrt(3)) / 2;
    const miniHoePts: [number, number][] = [
      [0, 3 * iconH],
      [2 * iconS, 3 * iconH],
      [1.5 * iconS, 2 * iconH],
      [2.0 * iconS, 1 * iconH],
      [1.5 * iconS, 0],
    ];
    const iconOx = leftZoneCenterX - iconS * 0.95;
    const iconOy = frameY + 20;
    const placedMiniHoe = miniHoePts.map(
      ([x, y]) => [x + iconOx, y + iconOy] as [number, number]
    );
    scoreParts.push(`    <path d="${roundedPolygonToSvgPath(placedMiniHoe, 0.35)}" />`);
    scoreLengthMm += polygonPerimeterMm(placedMiniHoe);

    // Silueta rellena minimalista de azada agrícola dentro del ícono
    const hxTop = iconOx + 1.42 * iconS;
    const hyTop = iconOy + 0.55 * iconH;
    const hxBot = iconOx + 0.78 * iconS;
    const hyBot = iconOy + 2.48 * iconH;
    engraveParts.push(
      `    <path d="M ${(hxTop - 0.45).toFixed(2)} ${(hyTop - 0.2).toFixed(2)} L ${(
        hxTop + 0.55
      ).toFixed(2)} ${(hyTop + 0.25).toFixed(2)} L ${(hxBot + 0.4).toFixed(2)} ${(
        hyBot + 0.15
      ).toFixed(2)} L ${(hxBot - 0.4).toFixed(2)} ${(hyBot - 0.15).toFixed(
        2
      )} Z" fill="#000000" />`
    );
    engraveParts.push(
      `    <path d="M ${(hxBot - 2.3).toFixed(2)} ${(hyBot - 0.9).toFixed(2)} L ${(
        hxBot + 2.6
      ).toFixed(2)} ${(hyBot + 0.95).toFixed(2)} L ${(hxBot + 1.5).toFixed(2)} ${(
        hyBot + 1.45
      ).toFixed(2)} L ${(hxBot - 1.4).toFixed(2)} ${(hyBot + 0.35).toFixed(
        2
      )} Z" fill="#000000" />`
    );

    // Reglas en la esquina superior derecha del marco
    const ruleFs = Math.max(1.95, Math.min(2.55, s * 0.155));
    const lineStep = ruleFs * 1.62;
    engraveParts.push(
      `    ${renderVectorText('Cuatro Desafíos:', {
        x: rightZoneLeftX,
        y: frameY + 11.5,
        fontSizeMm: ruleFs * 1.08,
        align: 'left',
      })}`
    );
    engraveParts.push(
      `    ${renderVectorText('• Elige 1, 2, 3 o 4', {
        x: rightZoneLeftX,
        y: frameY + 11.5 + lineStep,
        fontSizeMm: ruleFs,
        align: 'left',
      })}`
    );
    engraveParts.push(
      `    ${renderVectorText('• Deja libres los 2', {
        x: rightZoneLeftX,
        y: frameY + 11.5 + lineStep * 2,
        fontSizeMm: ruleFs,
        align: 'left',
      })}`
    );
    engraveParts.push(
      `    ${renderVectorText('  triángulos iguales', {
        x: rightZoneLeftX,
        y: frameY + 11.5 + lineStep * 3,
        fontSizeMm: ruleFs,
        align: 'left',
      })}`
    );
    engraveParts.push(
      `    ${renderVectorText('• Encaja 10 azadas', {
        x: rightZoneLeftX,
        y: frameY + 11.5 + lineStep * 4,
        fontSizeMm: ruleFs,
        align: 'left',
      })}`
    );
    engraveAreaMm2 += 105;
  }

  if (config.includeSchoolStamp) {
    engraveParts.push(
      `    ${renderVectorText('MAKERBOX · INGENIERÍA UTALCA · LBN MAIPÚ', {
        x: frameX + boardW / 2,
        y: frameY + boardH - padBottom / 2,
        fontSizeMm: Math.min(2.25, Math.max(1.75, boardW * 0.015)),
      })}`
    );
    engraveAreaMm2 += 42;
  }

  // =========================================================================
  // FILA 2: PIEZAS MÓVILES DEL ROMPECABEZAS (DEBAJO DE LOS DOS TABLEROS)
  // =========================================================================
  const row1TotalW = margin * 2 + boardW * 2 + gap;
  let piecesBottomY = margin + boardH;

  if (isNineP) {
    // 7 piezas P derechas (fila 2A) + 2 piezas P espejadas + 2 islas triangulares (fila 2B)
    const pieceGap = 4.2;
    const pW = 2 * h;
    const pH = 2.5 * s;
    const dotRadius = Math.max(1.7, s * 0.135);

    const row2AWidth = 7 * pW + 6 * pieceGap;
    const start2AX = Math.max(margin, (row1TotalW - row2AWidth) / 2);
    const start2AY = margin + boardH + gap;

    const { points: rightRaw, dotCenter: rightDot } = createUprightPointyP(s, false);
    const rightShrunk = insetPolygon(rightRaw, inset);

    for (let i = 0; i < 7; i++) {
      const ox = start2AX + i * (pW + pieceGap);
      const oy = start2AY;
      const placed = rightShrunk.map(([x, y]) => [x + ox, y + oy] as [number, number]);
      outerCutParts.push(
        `    <path d="${roundedPolygonToSvgPath(placed, config.cornerRadiusMm)}" />`
      );
      cutLengthMm += polygonPerimeterMm(placed);

      engraveParts.push(
        `    <circle cx="${(ox + rightDot[0]).toFixed(2)}" cy="${(
          oy + rightDot[1]
        ).toFixed(2)}" r="${dotRadius.toFixed(2)}" fill="#000000" />`
      );
      engraveAreaMm2 += Math.PI * dotRadius * dotRadius;
    }

    // Fila 2B: 2 piezas P espejadas (con punto) + 2 islas triangulares (1 titular + 1 repuesto)
    const start2BY = start2AY + pH + 5.5;
    const { points: leftRaw, dotCenter: leftDot } = createUprightPointyP(s, true);
    const leftShrunk = insetPolygon(leftRaw, inset);

    const islRaw: [number, number][] = [
      [s / 2, 0],
      [0, h],
      [s, h],
    ];
    const islShrunk = insetPolygon(islRaw, inset);

    const row2BWidth = 2 * pW + 2 * s + 3 * (pieceGap + 2);
    let cur2BX = Math.max(margin, (row1TotalW - row2BWidth) / 2);

    for (let j = 0; j < 2; j++) {
      const placedL = leftShrunk.map(
        ([x, y]) => [x + cur2BX, y + start2BY] as [number, number]
      );
      outerCutParts.push(
        `    <path d="${roundedPolygonToSvgPath(placedL, config.cornerRadiusMm)}" />`
      );
      cutLengthMm += polygonPerimeterMm(placedL);

      engraveParts.push(
        `    <circle cx="${(cur2BX + leftDot[0]).toFixed(2)}" cy="${(
          start2BY + leftDot[1]
        ).toFixed(2)}" r="${dotRadius.toFixed(2)}" fill="#000000" />`
      );
      engraveAreaMm2 += Math.PI * dotRadius * dotRadius;
      cur2BX += pW + pieceGap + 1.5;
    }

    // 2 pequeños triángulos isla (1 para pegar + 1 de respaldo escolar)
    for (let k = 0; k < 2; k++) {
      const islOy = start2BY + (pH - h) / 2;
      const placedIsl = islShrunk.map(
        ([x, y]) => [x + cur2BX, y + islOy] as [number, number]
      );
      outerCutParts.push(
        `    <path d="${roundedPolygonToSvgPath(
          placedIsl,
          Math.min(0.65, config.cornerRadiusMm)
        )}" />`
      );
      cutLengthMm += polygonPerimeterMm(placedIsl);
      cur2BX += s + pieceGap + 2;
    }

    piecesBottomY = start2BY + pH;
  } else {
    // Ten Hoes: 10 Azadas dispuestas en 5 pares anidados 180° en una sola fila limpia
    const pairGap = 3.0;
    const betweenPairsGap = 5.5;
    const { hoeLeft, hoeRight, pairWidth, pairHeight } = createNestedHoePair(s, pairGap);

    const leftShrunk = insetPolygon(hoeLeft, inset);
    const rightShrunk = insetPolygon(hoeRight, inset);

    const totalPairsW = 5 * pairWidth + 4 * betweenPairsGap;
    const startPairsX = Math.max(margin, (row1TotalW - totalPairsW) / 2);
    const startPairsY = margin + boardH + gap;

    for (let p = 0; p < 5; p++) {
      const ox = startPairsX + p * (pairWidth + betweenPairsGap);
      const oy = startPairsY;

      const placedA = leftShrunk.map(([x, y]) => [x + ox, y + oy] as [number, number]);
      const placedB = rightShrunk.map(([x, y]) => [x + ox, y + oy] as [number, number]);

      outerCutParts.push(
        `    <path d="${roundedPolygonToSvgPath(placedA, config.cornerRadiusMm)}" />`
      );
      outerCutParts.push(
        `    <path d="${roundedPolygonToSvgPath(placedB, config.cornerRadiusMm)}" />`
      );
      cutLengthMm += polygonPerimeterMm(placedA) + polygonPerimeterMm(placedB);
    }

    piecesBottomY = startPairsY + pairHeight;
  }

  const totalW = row1TotalW;
  const totalH = piecesBottomY + margin;

  const unitAreaMm2 = (Math.sqrt(3) / 4) * s * s;
  const unitAreaCm2 = Math.round((unitAreaMm2 / 100) * 100) / 100;
  const totalGridTriangles = N * N;
  const totalTriangleAreaCm2 = Math.round(((totalGridTriangles * unitAreaMm2) / 100) * 10) / 10;

  const puzzleTitle = isNineP
    ? `Nueve P Puntiagudas (Pentiamantes Red N=7 · s=${s}mm)`
    : `Diez Azadas (Hexiamantes Red N=8 · s=${s}mm)`;

  const svgContent = buildLaserSvgDocument({
    widthMm: totalW,
    heightMm: totalH,
    title: `Feria Científica LBN Maipú · ${puzzleTitle}`,
    description: `Rompecabezas lógico de poliamantes en MDF 3mm doble capa con tolerancia ${config.toleranceMm}mm`,
    engravePathsSvg: engraveParts.join('\n'),
    scorePathsSvg: scoreParts.join('\n'),
    innerCutPathsSvg: innerCutParts.join('\n'),
    outerCutPathsSvg: outerCutParts.join('\n'),
  });

  return {
    svgContent,
    widthMm: Math.round(totalW * 10) / 10,
    heightMm: Math.round(totalH * 10) / 10,
    estimatedMinutes: estimateFalconJobMinutes({
      cutLengthMm,
      scoreLengthMm,
      engraveAreaMm2,
    }),
    gridOrderN: N,
    totalGridTriangles,
    pieceCount: isNineP ? 9 : 10,
    trianglesPerPiece: isNineP ? 5 : 6,
    openMysteryTriangles: isNineP ? 3 : 2,
    triangleBaseMm: Math.round(triBase * 10) / 10,
    boardWidthMm: Math.round(boardW * 10) / 10,
    boardHeightMm: Math.round(boardH * 10) / 10,
    unitAreaCm2,
    totalTriangleAreaCm2,
  };
}
