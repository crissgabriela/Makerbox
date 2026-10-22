import fs from 'fs';
import path from 'path';
import { parse, stringify, INode } from 'svgson';
import { parseSVG, Command } from 'svg-path-parser';
import {
  GliderParams,
  GliderMetrics,
  ProcessedGliderResult,
  AerodynamicData,
  BASE_GLIDER_PARAMS,
  BALSA_DESIGN_LIMITS,
} from '@/types/glider';

export { BASE_GLIDER_PARAMS, BALSA_DESIGN_LIMITS };
export type { GliderParams, GliderMetrics, ProcessedGliderResult, AerodynamicData };

interface BoundingBox {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

/**
 * Interpolación lineal por tramos estrictamente monótona (Homeomorfismo 1D).
 * Garantiza matemáticamente que si s0 < s1 < ... < sn y t0 < t1 < ... < tn,
 * entonces x1 < x2 => f(x1) < f(x2), impidiendo cualquier auto-intersección o cruce de líneas.
 */
function interpolateKnots(val: number, srcKnots: number[], dstKnots: number[]): number {
  const n = srcKnots.length;
  if (val <= srcKnots[0]) {
    const slope = (dstKnots[1] - dstKnots[0]) / Math.max(1e-6, srcKnots[1] - srcKnots[0]);
    return dstKnots[0] + (val - srcKnots[0]) * slope;
  }
  if (val >= srcKnots[n - 1]) {
    const slope = (dstKnots[n - 1] - dstKnots[n - 2]) / Math.max(1e-6, srcKnots[n - 1] - srcKnots[n - 2]);
    return dstKnots[n - 1] + (val - srcKnots[n - 1]) * slope;
  }
  for (let i = 0; i < n - 1; i++) {
    if (val >= srcKnots[i] && val <= srcKnots[i + 1]) {
      const span = srcKnots[i + 1] - srcKnots[i];
      if (span < 1e-6) return dstKnots[i];
      const t = (val - srcKnots[i]) / span;
      return dstKnots[i] + t * (dstKnots[i + 1] - dstKnots[i]);
    }
  }
  return dstKnots[n - 1];
}

function getCommandsBBox(cmds: Command[]): BoundingBox {
  let minX = Infinity,
    minY = Infinity,
    maxX = -Infinity,
    maxY = -Infinity;
  const addPt = (x?: number, y?: number) => {
    if (typeof x === 'number' && typeof y === 'number') {
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
  };
  for (const c of cmds) {
    if ('x' in c && 'y' in c) addPt(c.x, c.y);
    if ('x1' in c && 'y1' in c) addPt(c.x1, c.y1);
    if ('x2' in c && 'y2' in c) addPt(c.x2, c.y2);
  }
  return { minX, minY, maxX, maxY };
}

function serializeCommands(cmds: Command[]): string {
  const parts: string[] = [];
  for (const c of cmds) {
    if (c.code === 'M' && 'x' in c && 'y' in c) {
      parts.push(`M ${c.x.toFixed(4)} ${c.y.toFixed(4)}`);
    } else if (c.code === 'L' && 'x' in c && 'y' in c) {
      parts.push(`L ${c.x.toFixed(4)} ${c.y.toFixed(4)}`);
    } else if (c.code === 'C' && 'x1' in c && 'y1' in c && 'x2' in c && 'y2' in c && 'x' in c && 'y' in c) {
      parts.push(
        `C ${c.x1.toFixed(4)} ${c.y1.toFixed(4)} ${c.x2.toFixed(4)} ${c.y2.toFixed(4)} ${c.x.toFixed(4)} ${c.y.toFixed(4)}`
      );
    } else if (c.code === 'Z' || c.code === 'z') {
      parts.push('Z');
    }
  }
  return parts.join(' ');
}

function mapCommandPoints(cmds: Command[], mapper: (x: number, y: number) => [number, number]): Command[] {
  return cmds.map((cmd) => {
    const copy = { ...cmd } as Command;
    if ('x' in copy && 'y' in copy && typeof copy.x === 'number' && typeof copy.y === 'number') {
      const [nx, ny] = mapper(copy.x, copy.y);
      copy.x = nx;
      copy.y = ny;
    }
    if ('x1' in copy && 'y1' in copy && typeof copy.x1 === 'number' && typeof copy.y1 === 'number') {
      const [nx1, ny1] = mapper(copy.x1, copy.y1);
      copy.x1 = nx1;
      copy.y1 = ny1;
    }
    if ('x2' in copy && 'y2' in copy && typeof copy.x2 === 'number' && typeof copy.y2 === 'number') {
      const [nx2, ny2] = mapper(copy.x2, copy.y2);
      copy.x2 = nx2;
      copy.y2 = ny2;
    }
    return copy;
  });
}

function placeCommandsAt(cmds: Command[], targetMinX: number, targetMinY: number): Command[] {
  const box = getCommandsBBox(cmds);
  const dx = targetMinX - box.minX;
  const dy = targetMinY - box.minY;
  return mapCommandPoints(cmds, (x, y) => [x + dx, y + dy]);
}

/**
 * 1. Transformación estrictamente monótona del Fuselaje (Escala Balsa 300x100x3 mm)
 * Coordenadas base en planeador-base.svg (300x100):
 * - X_NOSE = 24.625 mm
 * - X_SADDLE_START = 80.9063 mm
 * - X_WING_SLOT_L = 100.8125 mm, X_WING_SLOT_R = 102.375 mm
 * - X_SADDLE_END = 118.4063 mm (cama base = 37.50 mm)
 * - X_TAIL_SADDLE_START = 271.5313 mm
 * - X_TAIL_SLOT_L = 280.9063 mm, X_TAIL_SLOT_R = 282.4688 mm
 * - X_TAIL_END = 293.4063 mm (cama cola base = 21.875 mm)
 */
function transformFuselageCommands(
  cmds: Command[],
  fuselageLengthMm: number,
  wingWidthMm: number,
  slotThicknessMm: number
): Command[] {
  const X_NOSE = 24.625;
  const X_CANOPY_STEP = 79.2813;
  const X_SADDLE_START = 80.9063;
  const X_WING_SLOT_L = 100.8125;
  const X_WING_SLOT_R = 102.375;
  const X_SADDLE_END = 118.4063;
  const X_TAIL_SADDLE_START = 271.5313;
  const X_TAIL_SLOT_L = 280.9063;
  const X_TAIL_SLOT_R = 282.4688;
  const X_TAIL_END = 293.4063;

  const Y_SPINE_TOP = 4.2188;
  const Y_TAIL_SADDLE = 5.7813;
  const Y_TAIL_SLOT_BOT = 8.125;

  // Expandir ligeramente la cama de cola para compensar el aumento de ranura de 1.56 mm a 3.00 mm
  const deltaSlot = Math.max(0, slotThicknessMm - 1.5625);
  const L_TAIL = 21.875 + deltaSlot;

  const L_NOSE_0 = X_SADDLE_START - X_NOSE; // 56.2813 mm
  const L_BOOM_0 = X_TAIL_SADDLE_START - X_SADDLE_END; // 153.125 mm
  const L_FREE_0 = L_NOSE_0 + L_BOOM_0; // 209.4063 mm

  const targetFree = Math.max(60, fuselageLengthMm - wingWidthMm - L_TAIL);
  const kx = targetFree / L_FREE_0;

  const dstNose = 0;
  const dstSaddleStart = dstNose + L_NOSE_0 * kx;
  const dstCanopyStep = Math.max(dstNose + 15, dstSaddleStart - 1.625);
  const dstSaddleEnd = dstSaddleStart + wingWidthMm;
  const dstWingSlotCenter = dstSaddleStart + 0.5525 * wingWidthMm;
  const dstWingSlotL = dstWingSlotCenter - slotThicknessMm / 2;
  const dstWingSlotR = dstWingSlotCenter + slotThicknessMm / 2;

  const dstTailSaddleStart = dstSaddleEnd + L_BOOM_0 * kx;
  const dstTailEnd = dstTailSaddleStart + L_TAIL;
  const dstTailSlotCenter = dstTailSaddleStart + 10.1563 + deltaSlot / 2;
  const dstTailSlotL = dstTailSlotCenter - slotThicknessMm / 2;
  const dstTailSlotR = dstTailSlotCenter + slotThicknessMm / 2;

  // Nudos para el lomo superior (incluye ranuras y camas exactas)
  const topSrcKnots = [
    X_NOSE,
    X_CANOPY_STEP,
    X_SADDLE_START,
    X_WING_SLOT_L,
    X_WING_SLOT_R,
    X_SADDLE_END,
    X_TAIL_SADDLE_START,
    X_TAIL_SLOT_L,
    X_TAIL_SLOT_R,
    X_TAIL_END,
  ];
  const topDstKnots = [
    dstNose,
    dstCanopyStep,
    dstSaddleStart,
    dstWingSlotL,
    dstWingSlotR,
    dstSaddleEnd,
    dstTailSaddleStart,
    dstTailSlotL,
    dstTailSlotR,
    dstTailEnd,
  ];

  // Nudos suaves para la panza inferior y curva del timón (sin escalones de ranura para preservar la curva limpia)
  const botSrcKnots = [X_NOSE, X_SADDLE_START, X_SADDLE_END, X_TAIL_SADDLE_START, X_TAIL_END];
  const botDstKnots = [dstNose, dstSaddleStart, dstSaddleEnd, dstTailSaddleStart, dstTailEnd];

  return mapCommandPoints(cmds, (x, y) => {
    const nx = y <= 14.5 ? interpolateKnots(x, topSrcKnots, topDstKnots) : interpolateKnots(x, botSrcKnots, botDstKnots);
    let ny = y;

    // Ajustar el escalón y profundidad de la ranura trasera de cola para madera de balsa de 3 mm
    if (x >= X_TAIL_SADDLE_START - 0.2 && y <= 10.0) {
      if (Math.abs(y - Y_TAIL_SADDLE) < 0.2) {
        ny = Y_SPINE_TOP + slotThicknessMm;
      } else if (Math.abs(y - Y_TAIL_SLOT_BOT) < 0.2) {
        ny = Y_SPINE_TOP + slotThicknessMm + 3.0;
      }
    }

    return [nx, ny];
  });
}

/**
 * 2. Transformación estrictamente monótona del Ala Izquierda
 * Base en planeador-base.svg (300x100):
 * - X_TIP = 6.5938, X_SLOT_INNER = 119.0938, X_ROOT = 131.5938 (semienvergadura base = 125.00 mm, prof ranura = 12.50 mm)
 * - Y_LEAD = 56.2188, Y_SLOT_TOP = 76.1563, Y_SLOT_BOT = 77.7188, Y_TRAIL = 93.7188 (ancho base = 37.50 mm)
 */
function transformLeftWingCommands(
  cmds: Command[],
  singleWingSpanMm: number,
  wingWidthMm: number,
  slotThicknessMm: number
): Command[] {
  const X_TIP = 6.5938;
  const X_SLOT_INNER = 119.0938;
  const X_ROOT = 131.5938;
  const SLOT_DEPTH = 12.5; // Profundidad fija de encastre con el soporte diedro

  const Y_LEAD = 56.2188;
  const Y_SLOT_TOP = 76.1563;
  const Y_SLOT_BOT = 77.7188;
  const Y_TRAIL = 93.7188;

  const xSrcKnots = [X_TIP, X_SLOT_INNER, X_ROOT];
  const xDstKnots = [0, singleWingSpanMm - SLOT_DEPTH, singleWingSpanMm];

  const slotCenterY = 0.5525 * wingWidthMm;
  const ySrcKnots = [Y_LEAD, Y_SLOT_TOP, Y_SLOT_BOT, Y_TRAIL];
  const yDstKnots = [0, slotCenterY - slotThicknessMm / 2, slotCenterY + slotThicknessMm / 2, wingWidthMm];

  return mapCommandPoints(cmds, (x, y) => {
    // Solo los vértices de la ranura usan el nudo interno fijo en X; el borde de ataque/fuga exterior escala limpio
    const isNearSlotY = y >= Y_SLOT_TOP - 0.4 && y <= Y_SLOT_BOT + 0.4;
    const nx = isNearSlotY
      ? interpolateKnots(x, xSrcKnots, xDstKnots)
      : ((x - X_TIP) / (X_ROOT - X_TIP)) * singleWingSpanMm;
    const ny = interpolateKnots(y, ySrcKnots, yDstKnots);
    return [nx, ny];
  });
}

/**
 * 3. Transformación estrictamente monótona del Ala Derecha
 * Base en planeador-base.svg (300x100):
 * - X_ROOT = 143.7813, X_SLOT_INNER = 156.2813, X_TIP = 268.7813
 * - Y_LEAD = 56.7813, Y_SLOT_TOP = 76.7188, Y_SLOT_BOT = 78.2813, Y_TRAIL = 94.2813
 */
function transformRightWingCommands(
  cmds: Command[],
  singleWingSpanMm: number,
  wingWidthMm: number,
  slotThicknessMm: number
): Command[] {
  const X_ROOT = 143.7813;
  const X_SLOT_INNER = 156.2813;
  const X_TIP = 268.7813;
  const SLOT_DEPTH = 12.5;

  const Y_LEAD = 56.7813;
  const Y_SLOT_TOP = 76.7188;
  const Y_SLOT_BOT = 78.2813;
  const Y_TRAIL = 94.2813;

  const xSrcKnots = [X_ROOT, X_SLOT_INNER, X_TIP];
  const xDstKnots = [0, SLOT_DEPTH, singleWingSpanMm];

  const slotCenterY = 0.5525 * wingWidthMm;
  const ySrcKnots = [Y_LEAD, Y_SLOT_TOP, Y_SLOT_BOT, Y_TRAIL];
  const yDstKnots = [0, slotCenterY - slotThicknessMm / 2, slotCenterY + slotThicknessMm / 2, wingWidthMm];

  return mapCommandPoints(cmds, (x, y) => {
    const isNearSlotY = y >= Y_SLOT_TOP - 0.4 && y <= Y_SLOT_BOT + 0.4;
    const nx = isNearSlotY
      ? interpolateKnots(x, xSrcKnots, xDstKnots)
      : ((x - X_ROOT) / (X_TIP - X_ROOT)) * singleWingSpanMm;
    const ny = interpolateKnots(y, ySrcKnots, yDstKnots);
    return [nx, ny];
  });
}

/**
 * 4. Transformación del Estabilizador Horizontal (100.03 x 25.00 mm)
 * Ajusta la ranura rectangular central (18.75 x slotThicknessMm) y la muesca inferior (slotThicknessMm x 3.125 mm)
 */
function transformStabilizerCommands(cmds: Command[], slotThicknessMm: number, isInnerSlot: boolean): Command[] {
  if (isInnerSlot) {
    const Y_CENTER = (32.9688 + 34.5313) / 2;
    return mapCommandPoints(cmds, (x, y) => {
      const ny = y < Y_CENTER ? Y_CENTER - slotThicknessMm / 2 : Y_CENTER + slotThicknessMm / 2;
      return [x, ny];
    });
  } else {
    const X_LEFT = 143.6563;
    const X_NOTCH_L = 192.9063;
    const X_NOTCH_R = 194.4688;
    const X_RIGHT = 243.6875;
    const X_CENTER = (X_NOTCH_L + X_NOTCH_R) / 2;

    const srcKnots = [X_LEFT, X_NOTCH_L, X_NOTCH_R, X_RIGHT];
    const dstKnots = [X_LEFT, X_CENTER - slotThicknessMm / 2, X_CENTER + slotThicknessMm / 2, X_RIGHT];
    return mapCommandPoints(cmds, (x, y) => [interpolateKnots(x, srcKnots, dstKnots), y]);
  }
}

/**
 * 5. Transformación sin cruces del Soporte Diedro (expande hombros del cuello junto con la ranura de 3 mm)
 */
function transformDihedralBraceCommands(cmds: Command[], slotThicknessMm: number): Command[] {
  const X_MIN = 6.9375;
  const X_NECK_L = 19.9063;
  const X_SLOT_L = 21.4688;
  const X_SLOT_R = 23.0313;
  const X_NECK_R = 24.5938;
  const X_MAX = 37.5313;
  const X_CENTER = (X_SLOT_L + X_SLOT_R) / 2; // 22.250 mm

  const halfSlot = slotThicknessMm / 2;
  const neckWall = 2.0; // Pared lateral robusta de 2.0 mm a cada lado de la ranura en balsa

  const srcX = [X_MIN, X_NECK_L, X_SLOT_L, X_SLOT_R, X_NECK_R, X_MAX];
  const dstX = [
    X_MIN,
    X_CENTER - halfSlot - neckWall,
    X_CENTER - halfSlot,
    X_CENTER + halfSlot,
    X_CENTER + halfSlot + neckWall,
    X_MAX,
  ];

  // Ajustar la profundidad de la ranura central a 3.0 mm
  const Y_TOP = 18.4688;
  const Y_SLOT_BOT = 20.0313;
  const Y_BOT = 27.875;
  const srcY = [Y_TOP, Y_SLOT_BOT, Y_BOT];
  const dstY = [Y_TOP, Y_TOP + 3.0, Y_BOT + 1.4];

  return mapCommandPoints(cmds, (x, y) => [interpolateKnots(x, srcX, dstX), interpolateKnots(y, srcY, dstY)]);
}

/**
 * 6. Transformación sin cruces del Soporte Trasero (expande hombros junto con la ranura de 3 mm y mantiene pestaña de 18.75 mm)
 */
function transformTailBraceCommands(cmds: Command[], slotThicknessMm: number): Command[] {
  const X_MIN = 39.125;
  const X_TAB_L = 40.7188;
  const X_NECK_L = 47.681;
  const X_SLOT_L = 49.3125;
  const X_SLOT_R = 50.875;
  const X_NECK_R = 52.481;
  const X_TAB_R = 59.4688;
  const X_MAX = 61.0313;
  const X_CENTER = (X_SLOT_L + X_SLOT_R) / 2; // 50.0938 mm

  const halfSlot = slotThicknessMm / 2;
  const neckWall = 2.0;

  const srcX = [X_MIN, X_TAB_L, X_NECK_L, X_SLOT_L, X_SLOT_R, X_NECK_R, X_TAB_R, X_MAX];
  const dstX = [
    X_MIN,
    X_TAB_L,
    X_CENTER - halfSlot - neckWall,
    X_CENTER - halfSlot,
    X_CENTER + halfSlot,
    X_CENTER + halfSlot + neckWall,
    X_TAB_R,
    X_MAX,
  ];

  const Y_TOP = 25.375;
  const Y_SLOT_BOT = 26.9375;
  const Y_STEP = 29.2813;
  const Y_BOT = 30.8438;
  const srcY = [Y_TOP, Y_SLOT_BOT, Y_STEP, Y_BOT];
  const dstY = [Y_TOP, Y_TOP + 3.0, Y_TOP + 5.2, Y_TOP + 5.2 + slotThicknessMm];

  return mapCommandPoints(cmds, (x, y) => [interpolateKnots(x, srcX, dstX), interpolateKnots(y, srcY, dstY)]);
}

/**
 * Verificación geométrica de no-cruce de segmentos (tanto auto-intersecciones como colisiones entre piezas)
 */
function segmentsProperlyIntersect(
  ax: number,
  ay: number,
  bx: number,
  by: number,
  cx: number,
  cy: number,
  dx: number,
  dy: number
): boolean {
  const ccw = (p1x: number, p1y: number, p2x: number, p2y: number, p3x: number, p3y: number) =>
    (p3y - p1y) * (p2x - p1x) > (p2y - p1y) * (p3x - p1x);
  return (
    ccw(ax, ay, cx, cy, dx, dy) !== ccw(bx, by, cx, cy, dx, dy) &&
    ccw(ax, ay, bx, by, cx, cy) !== ccw(ax, ay, bx, by, dx, dy)
  );
}

function commandsToSegments(cmds: Command[]): Array<[number, number, number, number]> {
  const pts: Array<[number, number]> = [];
  for (const c of cmds) {
    if ('x' in c && 'y' in c && typeof c.x === 'number' && typeof c.y === 'number') {
      if (pts.length === 0 || Math.hypot(c.x - pts[pts.length - 1][0], c.y - pts[pts.length - 1][1]) > 1e-3) {
        pts.push([c.x, c.y]);
      }
    }
  }
  const segs: Array<[number, number, number, number]> = [];
  for (let i = 0; i < pts.length; i++) {
    const p1 = pts[i];
    const p2 = pts[(i + 1) % pts.length];
    if (Math.hypot(p2[0] - p1[0], p2[1] - p1[1]) > 1e-3) {
      segs.push([p1[0], p1[1], p2[0], p2[1]]);
    }
  }
  return segs;
}

export function verifyNoCrossings(pathsMap: Record<string, Command[]>): boolean {
  const allPieceSegs: Array<{ id: string; segs: Array<[number, number, number, number]> }> = [];
  for (const [id, cmds] of Object.entries(pathsMap)) {
    const segs = commandsToSegments(cmds);
    // 1. Verificar auto-intersección dentro de la misma pieza
    for (let i = 0; i < segs.length; i++) {
      for (let j = i + 2; j < segs.length; j++) {
        if (i === 0 && j === segs.length - 1) continue;
        const s1 = segs[i];
        const s2 = segs[j];
        if (segmentsProperlyIntersect(s1[0], s1[1], s1[2], s1[3], s2[0], s2[1], s2[2], s2[3])) {
          return false;
        }
      }
    }
    allPieceSegs.push({ id, segs });
  }

  // 2. Verificar que ninguna pieza cruce líneas con otra pieza
  for (let a = 0; a < allPieceSegs.length; a++) {
    for (let b = a + 1; b < allPieceSegs.length; b++) {
      // La ranura central del estabilizador está legítimamente dentro del contorno del estabilizador, pero sin tocar su borde
      for (const s1 of allPieceSegs[a].segs) {
        for (const s2 of allPieceSegs[b].segs) {
          if (segmentsProperlyIntersect(s1[0], s1[1], s1[2], s1[3], s2[0], s2[1], s2[2], s2[3])) {
            return false;
          }
        }
      }
    }
  }
  return true;
}

/**
 * Calcula los indicadores aerodinámicos y de diseño para toma de decisiones de los estudiantes
 */
export function computeAerodynamics(
  fuselageLengthMm: number,
  wingspanMm: number,
  wingWidthMm: number,
  slotThicknessMm: number
): AerodynamicData {
  // Factor de forma planform real de las alas elípticas del PDF = 0.892
  const PLANFORM_FACTOR = 0.892;
  const wingAreaMm2 = +(PLANFORM_FACTOR * wingspanMm * wingWidthMm).toFixed(1);
  const wingAreaCm2 = +(wingAreaMm2 / 100).toFixed(2);

  // Alargamiento (Aspect Ratio AR = b^2 / Sw)
  const aspectRatio = +((wingspanMm * wingspanMm) / wingAreaMm2).toFixed(2);

  // Relación Envergadura / Largo Fuselaje
  const spanToFuselageRatio = +(wingspanMm / fuselageLengthMm).toFixed(2);
  const finenessRatio = +(fuselageLengthMm / wingWidthMm).toFixed(2);

  // Coeficiente de volumen de cola horizontal VH = (Sh * lt) / (Sw * c)
  const stabilizerAreaMm2 = 2120; // ~21.2 cm² del óvalo de 100 x 25 mm
  const tailArmMm = Math.max(65, (fuselageLengthMm - wingWidthMm - 22) * 0.72);
  const tailVolumeCoefficient = +((stabilizerAreaMm2 * tailArmMm) / (wingAreaMm2 * wingWidthMm)).toFixed(2);

  // Posición recomendada del Centro de Gravedad (CG) desde la nariz
  const noseLengthMm = (fuselageLengthMm - wingWidthMm - 22) * (56.28 / 209.41);
  const recommendedCgFromNoseMm = +(noseLengthMm + 0.30 * wingWidthMm).toFixed(1);

  // Masa estimada en madera de balsa de 3 mm (densidad media balsa = 0.14 g/cm³)
  const fuselageAreaCm2 = (fuselageLengthMm * 2.15) / 10;
  const stabAreaCm2 = 21.2;
  const bracesAreaCm2 = 4.2;
  const totalBalsaAreaCm2 = wingAreaCm2 + fuselageAreaCm2 + stabAreaCm2 + bracesAreaCm2;
  const totalVolumeCm3 = totalBalsaAreaCm2 * (slotThicknessMm / 10);
  const estimatedWeightGrams = +(totalVolumeCm3 * 0.14).toFixed(2);

  // Carga alar en g/dm² (1 dm² = 100 cm²)
  const wingAreaDm2 = wingAreaCm2 / 100;
  const wingLoadingGPerDm2 = +(estimatedWeightGrams / wingAreaDm2).toFixed(2);

  // Velocidad teórica de planeo (m/s) y razón de planeo L/D
  const estimatedGlideSpeedMs = +(1.15 * Math.sqrt(wingLoadingGPerDm2)).toFixed(2);
  const estimatedGlideRatioLD = +(5.2 + 0.46 * aspectRatio - Math.abs(tailVolumeCoefficient - 0.48) * 3.2).toFixed(1);

  // Evaluación pedagógica de equilibrio
  let penalty = 0;
  const warnings: string[] = [];

  if (spanToFuselageRatio < 0.85) {
    penalty += Math.round((0.85 - spanToFuselageRatio) * 80);
    warnings.push('Envergadura corta respecto al fuselaje (mayor velocidad de descenso).');
  } else if (spanToFuselageRatio > 1.22) {
    penalty += Math.round((spanToFuselageRatio - 1.22) * 75);
    warnings.push('Fuselaje corto respecto a la envergadura (menor brazo de palanca en la cola).');
  }

  if (aspectRatio < 5.6) {
    penalty += Math.round((5.6 - aspectRatio) * 10);
    warnings.push('Bajo alargamiento alar (mayor resistencia inducida en las puntas de ala).');
  } else if (aspectRatio > 8.4) {
    penalty += Math.round((aspectRatio - 8.4) * 10);
    warnings.push('Alas muy esbeltas (excelente planeo, pero requiere lanzamiento muy suave).');
  }

  if (tailVolumeCoefficient < 0.34) {
    penalty += 15;
    warnings.push('Volumen de cola bajo (posible tendencia al cabeceo).');
  } else if (tailVolumeCoefficient > 0.68) {
    penalty += 10;
    warnings.push('Estabilizador con mucho brazo (vuelo muy amortiguado).');
  }

  const balanceScore = Math.max(45, Math.min(100, 98 - penalty));
  const balanceStatus: 'optimo' | 'estable' | 'advertencia' =
    balanceScore >= 86 ? 'optimo' : balanceScore >= 70 ? 'estable' : 'advertencia';

  const flightBehaviorSummary =
    warnings.length === 0
      ? 'Equilibrio aerodinámico óptimo: excelente sustentación, centro de gravedad estable y planeo largo y recto.'
      : warnings.join(' ');

  return {
    wingAreaCm2,
    wingAreaMm2,
    aspectRatio,
    spanToFuselageRatio,
    finenessRatio,
    tailVolumeCoefficient,
    recommendedCgFromNoseMm,
    estimatedWeightGrams,
    wingLoadingGPerDm2,
    estimatedGlideSpeedMs,
    estimatedGlideRatioLD,
    balanceScore,
    balanceStatus,
    flightBehaviorSummary,
  };
}

/**
 * Construye un nodo SVG para el borde guía de una lámina de balsa de 300 x 100 mm
 */
function createSheetGuideNode(sheetIndex: number, yOffset: number, label: string): INode {
  return {
    name: 'g',
    type: 'element',
    value: '',
    attributes: {
      id: `guia-lamina-${sheetIndex}`,
      'data-layer': 'sheet-guide',
    },
    children: [
      {
        name: 'rect',
        type: 'element',
        value: '',
        attributes: {
          x: '0.5',
          y: (yOffset + 0.5).toFixed(2),
          width: '299',
          height: '99',
          rx: '2',
          fill: 'none',
          stroke: '#0284c7',
          'stroke-width': '0.4',
          'stroke-dasharray': '3,2',
        },
        children: [],
      },
      {
        name: 'text',
        type: 'element',
        value: '',
        attributes: {
          x: '4',
          y: (yOffset + 5.2).toFixed(2),
          fill: '#0369a1',
          'font-family': 'system-ui, sans-serif',
          'font-size': '3.5',
          'font-weight': 'bold',
        },
        children: [
          {
            name: '',
            type: 'text',
            value: label,
            attributes: {},
            children: [],
          },
        ],
      },
    ],
  };
}

export async function processGliderSvg(params: GliderParams): Promise<ProcessedGliderResult> {
  // 1. Validar y acotar los parámetros dentro de los límites de las planchas de balsa 300x100x3 mm
  const fuselageLengthMm = Math.max(
    BALSA_DESIGN_LIMITS.fuselage.min,
    Math.min(BALSA_DESIGN_LIMITS.fuselage.max, Number(params.fuselageLengthMm) || BALSA_DESIGN_LIMITS.fuselage.default)
  );
  const wingspanMm = Math.max(
    BALSA_DESIGN_LIMITS.wingspan.min,
    Math.min(BALSA_DESIGN_LIMITS.wingspan.max, Number(params.wingspanMm) || BALSA_DESIGN_LIMITS.wingspan.default)
  );
  const wingWidthMm = Math.max(
    BALSA_DESIGN_LIMITS.wingWidth.min,
    Math.min(BALSA_DESIGN_LIMITS.wingWidth.max, Number(params.wingWidthMm) || BALSA_DESIGN_LIMITS.wingWidth.default)
  );
  const slotThicknessMm = Math.max(
    BALSA_DESIGN_LIMITS.slotThickness.min,
    Math.min(
      BALSA_DESIGN_LIMITS.slotThickness.max,
      Number(params.slotThicknessMm) || BALSA_DESIGN_LIMITS.slotThickness.default
    )
  );
  const singleWingSpanMm = wingspanMm / 2;
  const cutStrokeColor = params.cutStrokeColor || '#FF0000';

  const templatePath = path.join(process.cwd(), 'public', 'templates', 'planeador-base.svg');
  const rawSvg = fs.readFileSync(templatePath, 'utf8');
  const ast: INode = await parse(rawSvg);

  // 2. Transformar los nodos de las 6 piezas con funciones estrictamente monótonas
  const rawPaths: Record<string, Command[]> = {};
  for (const group of ast.children) {
    if (group.name !== 'g') continue;
    for (const child of group.children) {
      if (child.name === 'path' && child.attributes.d) {
        rawPaths[child.attributes.id || group.attributes.id] = parseSVG(child.attributes.d);
      }
    }
  }

  let fusCmds = transformFuselageCommands(
    rawPaths['fuselaje-contorno'],
    fuselageLengthMm,
    wingWidthMm,
    slotThicknessMm
  );
  let leftWingCmds = transformLeftWingCommands(
    rawPaths['ala-izquierda-contorno'],
    singleWingSpanMm,
    wingWidthMm,
    slotThicknessMm
  );
  let rightWingCmds = transformRightWingCommands(
    rawPaths['ala-derecha-contorno'],
    singleWingSpanMm,
    wingWidthMm,
    slotThicknessMm
  );
  let stabOuterCmds = transformStabilizerCommands(rawPaths['estabilizador-contorno'], slotThicknessMm, false);
  let stabInnerCmds = transformStabilizerCommands(rawPaths['estabilizador-ranura-central'], slotThicknessMm, true);
  let dihedralCmds = transformDihedralBraceCommands(rawPaths['soporte-diedro-contorno'], slotThicknessMm);
  let tailBraceCmds = transformTailBraceCommands(rawPaths['soporte-trasero-contorno'], slotThicknessMm);

  // 3. Decidir distribución óptima en 1 o 2 láminas de madera de balsa de 300 x 100 mm (SIN CRUCES JAMÁS)
  // Criterio estricto de cajas disjuntas: cabe en 1 lámina solo si el estabilizador (100.03 mm) cabe a la derecha del fuselaje
  // (fuselageLengthMm <= 182 mm) y las 2 alas caben debajo (wingWidthMm <= 42 mm). De lo contrario, se usan 2 láminas 300x100 mm.
  const fitsInSingleSheet = fuselageLengthMm <= 182 && wingWidthMm <= 42 && wingspanMm <= 260;
  const sheetsRequired: 1 | 2 = fitsInSingleSheet ? 1 : 2;

  const stabBox0 = getCommandsBBox(stabOuterCmds);
  const stabTargetX = fitsInSingleSheet ? 194.0 : 12.0;
  const stabTargetY = fitsInSingleSheet ? 5.0 : 62.0;
  const stabDx = stabTargetX - stabBox0.minX;
  const stabDy = stabTargetY - stabBox0.minY;

  stabOuterCmds = mapCommandPoints(stabOuterCmds, (x, y) => [x + stabDx, y + stabDy]);
  stabInnerCmds = mapCommandPoints(stabInnerCmds, (x, y) => [x + stabDx, y + stabDy]);

  if (fitsInSingleSheet) {
    // 1 Sola Lámina de 300 x 100 mm (Cajas disjuntas garantizadas)
    fusCmds = placeCommandsAt(fusCmds, 6.0, 4.0);
    dihedralCmds = placeCommandsAt(dihedralCmds, 194.0, 35.0);
    tailBraceCmds = placeCommandsAt(tailBraceCmds, 238.0, 37.0);
    leftWingCmds = placeCommandsAt(leftWingCmds, 8.0, 53.0);
    rightWingCmds = placeCommandsAt(rightWingCmds, 154.0, 53.0);
  } else {
    // 2 Láminas de 300 x 100 mm:
    // Lámina 1 (Y: 0..100): Fuselaje arriba + Estabilizador y Soportes abajo
    fusCmds = placeCommandsAt(fusCmds, 10.0, 6.5);
    dihedralCmds = placeCommandsAt(dihedralCmds, 138.0, 68.0);
    tailBraceCmds = placeCommandsAt(tailBraceCmds, 188.0, 70.0);

    // Lámina 2 (Y: 112..212 en vista combinada, o Y: 0..100 en archivo individual de Lámina 2):
    const sheet2OffsetY = 112.0;
    const wingLocalY = Math.round((100 - wingWidthMm) / 2);
    leftWingCmds = placeCommandsAt(leftWingCmds, 12.0, sheet2OffsetY + wingLocalY);
    rightWingCmds = placeCommandsAt(rightWingCmds, 156.0, sheet2OffsetY + wingLocalY);
  }

  const processedPaths: Record<string, Command[]> = {
    'fuselaje-contorno': fusCmds,
    'ala-izquierda-contorno': leftWingCmds,
    'ala-derecha-contorno': rightWingCmds,
    'estabilizador-contorno': stabOuterCmds,
    'estabilizador-ranura-central': stabInnerCmds,
    'soporte-diedro-contorno': dihedralCmds,
    'soporte-trasero-contorno': tailBraceCmds,
  };

  // Verificar matemáticamente que no exista ningún cruce de segmentos
  const zeroCrossingsVerified = verifyNoCrossings(processedPaths);

  // Actualizar el AST principal
  for (const group of ast.children) {
    if (group.name !== 'g') continue;
    group.attributes.stroke = cutStrokeColor;
    for (const child of group.children) {
      if (child.name !== 'path') continue;
      const pid = child.attributes.id || group.attributes.id;
      if (processedPaths[pid]) {
        child.attributes.d = serializeCommands(processedPaths[pid]);
      }
    }
  }

  // Generar también los SVGs individuales de Lámina 1 (300x100) y Lámina 2 (300x100) listos para cortar en cada tabla
  const sheet1Groups = ast.children.filter(
    (g) =>
      g.name === 'g' &&
      (fitsInSingleSheet ||
        ['fuselaje', 'estabilizador-horizontal', 'soporte-diedro', 'soporte-trasero'].includes(g.attributes.id))
  );
  const sheet1Ast: INode = {
    ...ast,
    attributes: {
      ...ast.attributes,
      viewBox: '0 0 300 100',
      width: '300mm',
      height: '100mm',
      'data-sheet': '1',
    },
    children: sheet1Groups,
  };
  const sheet1Svg = `<?xml version="1.0" encoding="UTF-8"?>\n${stringify(sheet1Ast)}`;

  let sheet2Svg: string | null = null;
  if (sheetsRequired === 2) {
    const wingLocalY = Math.round((100 - wingWidthMm) / 2);
    const s2Left = placeCommandsAt(leftWingCmds, 12.0, wingLocalY);
    const s2Right = placeCommandsAt(rightWingCmds, 156.0, wingLocalY);
    const sheet2Ast: INode = {
      ...ast,
      attributes: {
        ...ast.attributes,
        viewBox: '0 0 300 100',
        width: '300mm',
        height: '100mm',
        'data-sheet': '2',
      },
      children: [
        {
          name: 'g',
          type: 'element',
          value: '',
          attributes: { id: 'ala-izquierda', fill: 'none', stroke: cutStrokeColor, 'stroke-width': '0.25' },
          children: [
            {
              name: 'path',
              type: 'element',
              value: '',
              attributes: { id: 'ala-izquierda-contorno', d: serializeCommands(s2Left) },
              children: [],
            },
          ],
        },
        {
          name: 'g',
          type: 'element',
          value: '',
          attributes: { id: 'ala-derecha', fill: 'none', stroke: cutStrokeColor, 'stroke-width': '0.25' },
          children: [
            {
              name: 'path',
              type: 'element',
              value: '',
              attributes: { id: 'ala-derecha-contorno', d: serializeCommands(s2Right) },
              children: [],
            },
          ],
        },
      ],
    };
    sheet2Svg = `<?xml version="1.0" encoding="UTF-8"?>\n${stringify(sheet2Ast)}`;
  }

  const totalHeightMm = sheetsRequired === 1 ? 100 : 212;
  ast.attributes.viewBox = `0 0 300 ${totalHeightMm}`;
  ast.attributes.width = '300mm';
  ast.attributes.height = `${totalHeightMm}mm`;

  if (params.includeAnnotations) {
    const fusBox = getCommandsBBox(fusCmds);
    const leftBox = getCommandsBBox(leftWingCmds);
    const rightBox = getCommandsBBox(rightWingCmds);

    // Agregar marcos guía de las tablas de balsa de 300 x 100 mm
    ast.children.unshift(
      createSheetGuideNode(
        1,
        0,
        sheetsRequired === 1
          ? 'Lámina Única de Balsa: 300 × 100 × 3 mm (6 piezas)'
          : 'Lámina 1 de Balsa (300 × 100 × 3 mm): Fuselaje, Estabilizador y Soportes'
      )
    );
    if (sheetsRequired === 2) {
      ast.children.splice(
        1,
        0,
        createSheetGuideNode(2, 112, 'Lámina 2 de Balsa (300 × 100 × 3 mm): Ala Izquierda y Ala Derecha')
      );
    }

    ast.children.push({
      name: 'g',
      type: 'element',
      value: '',
      attributes: {
        id: 'cotas-pedagogicas',
        'data-layer': 'annotations',
        'font-family': 'system-ui, sans-serif',
        'font-size': '3.4',
        'font-weight': 'bold',
      },
      children: [
        {
          name: 'text',
          type: 'element',
          value: '',
          attributes: {
            x: ((fusBox.minX + fusBox.maxX) / 2).toFixed(2),
            y: (fusBox.maxY + 4.8).toFixed(2),
            'text-anchor': 'middle',
            fill: '#46247a',
          },
          children: [
            {
              name: '',
              type: 'text',
              value: `Fuselaje: ${fuselageLengthMm.toFixed(0)} mm | Cama ala: ${wingWidthMm.toFixed(0)} mm | Ranuras: ${slotThicknessMm.toFixed(2)} mm`,
              attributes: {},
              children: [],
            },
          ],
        },
        {
          name: 'text',
          type: 'element',
          value: '',
          attributes: {
            x: ((leftBox.minX + leftBox.maxX) / 2).toFixed(2),
            y: (leftBox.minY + (leftBox.maxY - leftBox.minY) / 2 + 1).toFixed(2),
            'text-anchor': 'middle',
            fill: '#0284c7',
          },
          children: [
            {
              name: '',
              type: 'text',
              value: `Ala Izq: ${singleWingSpanMm.toFixed(0)} × ${wingWidthMm.toFixed(0)} mm`,
              attributes: {},
              children: [],
            },
          ],
        },
        {
          name: 'text',
          type: 'element',
          value: '',
          attributes: {
            x: ((rightBox.minX + rightBox.maxX) / 2).toFixed(2),
            y: (rightBox.minY + (rightBox.maxY - rightBox.minY) / 2 + 1).toFixed(2),
            'text-anchor': 'middle',
            fill: '#0284c7',
          },
          children: [
            {
              name: '',
              type: 'text',
              value: `Ala Der: ${singleWingSpanMm.toFixed(0)} × ${wingWidthMm.toFixed(0)} mm`,
              attributes: {},
              children: [],
            },
          ],
        },
      ],
    });
  }

  const combinedSvg = `<?xml version="1.0" encoding="UTF-8"?>\n${stringify(ast)}`;
  const aerodynamics = computeAerodynamics(fuselageLengthMm, wingspanMm, wingWidthMm, slotThicknessMm);

  const metrics: GliderMetrics = {
    fuselageLengthMm: +fuselageLengthMm.toFixed(2),
    fuselageHeightMm: 44.94,
    wingSaddleLengthMm: +wingWidthMm.toFixed(2),
    wingspanTotalMm: +wingspanMm.toFixed(2),
    singleWingLengthMm: +singleWingSpanMm.toFixed(2),
    wingWidthMm: +wingWidthMm.toFixed(2),
    slotThicknessMm: +slotThicknessMm.toFixed(3),
    wingSlotDepthMm: 12.5,
    fuselageWingSlotDepthMm: 6.25,
    fuselageTailSlotDepthMm: 3.0,
    stabilizerSpanMm: 100.03,
    stabilizerChordMm: 25.0,
    stabilizerCenterSlotLengthMm: 18.75,
    dihedralBraceWidthMm: 32.0,
    dihedralAngleDeg: 7.5,
    tailBraceWidthMm: 23.3,
    balsaSheetWidthMm: 300.0,
    balsaSheetHeightMm: 100.0,
    balsaMaterialThicknessMm: 3.0,
    sheetsRequired,
    sheetWidthMm: 300.0,
    sheetHeightMm: totalHeightMm,
    zeroCrossingsVerified,
    aerodynamics,
  };

  return {
    svg:
      params.targetSheet === 'sheet1'
        ? sheet1Svg
        : params.targetSheet === 'sheet2' && sheet2Svg
        ? sheet2Svg
        : combinedSvg,
    sheet1Svg,
    sheet2Svg,
    metrics,
    baseMetrics: BASE_GLIDER_PARAMS,
  };
}
