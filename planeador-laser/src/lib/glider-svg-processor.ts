import fs from 'fs';
import path from 'path';
import { parse, stringify, INode } from 'svgson';
import { parseSVG, Command } from 'svg-path-parser';

export interface GliderParams {
  /** Largo total del fuselaje en mm (Base PDF: 546.10 mm) */
  fuselageLengthMm: number;
  /** Envergadura total de las 2 alas en mm (Base PDF: 508.00 mm -> 254.00 mm cada ala) */
  wingspanMm: number;
  /** Ancho (cuerda) del ala en mm (Base PDF: 76.20 mm) */
  wingWidthMm: number;
  /** Espesor del material para las ranuras de ensamble en mm (Fijo en PDF: 3.175 mm) */
  slotThicknessMm: number;
  /** Si es true, incluye cotas y etiquetas pedagógicas (modo previsualización) */
  includeAnnotations?: boolean;
  /** Color de trazo de corte láser (por defecto #FF0000 para LightBurn/RDWorks) */
  cutStrokeColor?: string;
}

export interface GliderMetrics {
  fuselageLengthMm: number;
  fuselageHeightMm: number;
  wingSaddleLengthMm: number;
  wingspanTotalMm: number;
  singleWingLengthMm: number;
  wingWidthMm: number;
  slotThicknessMm: number;
  wingSlotDepthMm: number;
  fuselageWingSlotDepthMm: number;
  fuselageTailSlotDepthMm: number;
  stabilizerSpanMm: number;
  stabilizerChordMm: number;
  stabilizerCenterSlotLengthMm: number;
  dihedralBraceWidthMm: number;
  dihedralAngleDeg: number;
  tailBraceWidthMm: number;
  sheetWidthMm: number;
  sheetHeightMm: number;
}

export interface ProcessedGliderResult {
  svg: string;
  metrics: GliderMetrics;
  baseMetrics: GliderMetrics;
}

/**
 * Parámetros base extraídos matemáticamente del PDF original (1728 x 576 pt @ 72 pt/in)
 */
export const BASE_GLIDER_PARAMS: GliderMetrics = {
  fuselageLengthMm: 546.10,
  fuselageHeightMm: 91.31,
  wingSaddleLengthMm: 76.20,
  wingspanTotalMm: 508.00,
  singleWingLengthMm: 254.00,
  wingWidthMm: 76.20,
  slotThicknessMm: 3.175,
  wingSlotDepthMm: 25.40,
  fuselageWingSlotDepthMm: 12.70,
  fuselageTailSlotDepthMm: 4.7625,
  stabilizerSpanMm: 203.26,
  stabilizerChordMm: 50.80,
  stabilizerCenterSlotLengthMm: 38.10,
  dihedralBraceWidthMm: 62.17,
  dihedralAngleDeg: 7.5,
  tailBraceWidthMm: 44.45,
  sheetWidthMm: 609.60,
  sheetHeightMm: 203.20,
};

interface BoundingBox {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

function getCommandsBBox(cmds: Command[]): BoundingBox {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
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

/**
 * Transforma los nodos del Fuselaje manteniendo:
 * 1. El ancho de la cama del ala igual a `wingWidthMm` (para que el ala encaje al ras)
 * 2. El espesor exacto (`slotThicknessMm`) y la profundidad (`12.70 mm`) de la ranura vertical del ala
 * 3. La longitud (`44.45 mm`) de la cama trasera y la ranura vertical de cola (`slotThicknessMm` x `4.76 mm`)
 * 4. El largo total del fuselaje igual a `fuselageLengthMm`
 */
function transformFuselageCommands(
  cmds: Command[],
  fuselageLengthMm: number,
  wingWidthMm: number,
  slotThicknessMm: number
): Command[] {
  // Coordenadas base en mm dentro de planeador-base.svg
  const X_NOSE = 50.038; // 141.84 pt
  const X_SADDLE_START = 164.4015; // 466.02 pt
  const X_WING_SLOT_L = 204.851; // 580.68 pt
  const X_WING_SLOT_R = 208.026; // 589.68 pt
  const X_SADDLE_END = 240.6015; // 682.02 pt
  const X_TAIL_SADDLE_START = 551.7515; // 1564.02 pt
  const X_TAIL_SLOT_L = 570.8015; // 1618.02 pt
  const X_TAIL_SLOT_R = 573.9765; // 1627.02 pt
  const X_TAIL_END = 596.2015; // 1690.02 pt

  const Y_SPINE_TOP = 8.5725; // (576 - 551.70) * 25.4/72
  const Y_WING_SADDLE = 11.811; // (576 - 542.52) * 25.4/72
  const Y_TAIL_SADDLE = 11.7475; // (576 - 542.70) * 25.4/72

  const L_NOSE_0 = X_SADDLE_START - X_NOSE; // 114.3635 mm
  const L_BOOM_0 = X_TAIL_SADDLE_START - X_SADDLE_END; // 311.15 mm
  const L_TAIL_0 = X_TAIL_END - X_TAIL_SADDLE_START; // 44.45 mm
  const L_FREE_0 = L_NOSE_0 + L_BOOM_0; // 425.5135 mm

  const targetFree = Math.max(80, fuselageLengthMm - wingWidthMm - L_TAIL_0);
  const kx = targetFree / L_FREE_0;

  const newSaddleStart = X_NOSE + L_NOSE_0 * kx;
  const newSaddleEnd = newSaddleStart + wingWidthMm;
  const newTailSaddleStart = newSaddleEnd + L_BOOM_0 * kx;
  const newTailEnd = newTailSaddleStart + L_TAIL_0;

  // Posición proporcional del centro de la ranura en la cama del ala (55.25% desde el borde de ataque)
  const SLOT_REL = 0.5525;
  const newWingSlotCenter = newSaddleStart + SLOT_REL * wingWidthMm;
  const newTailSlotCenter = newTailSaddleStart + ((X_TAIL_SLOT_L + X_TAIL_SLOT_R) / 2 - X_TAIL_SADDLE_START);

  return mapCommandPoints(cmds, (x, y) => {
    let nx = x;
    let ny = y;

    // 1. Nodos de la ranura vertical del ala en el fuselaje (mantener ancho = slotThicknessMm y prof = 12.70 mm)
    if (Math.abs(x - X_WING_SLOT_L) < 0.25 && y < 30) {
      nx = newWingSlotCenter - slotThicknessMm / 2;
      return [nx, ny];
    }
    if (Math.abs(x - X_WING_SLOT_R) < 0.25 && y < 30) {
      nx = newWingSlotCenter + slotThicknessMm / 2;
      return [nx, ny];
    }

    // 2. Nodos de la ranura vertical trasera de cola (mantener ancho = slotThicknessMm y prof = 4.7625 mm)
    if (Math.abs(x - X_TAIL_SLOT_L) < 0.25 && y < 22) {
      nx = newTailSlotCenter - slotThicknessMm / 2;
      if (Math.abs(y - Y_TAIL_SADDLE) < 0.2) {
        ny = Y_SPINE_TOP + slotThicknessMm;
      }
      return [nx, ny];
    }
    if (Math.abs(x - X_TAIL_SLOT_R) < 0.25 && y < 22) {
      nx = newTailSlotCenter + slotThicknessMm / 2;
      if (Math.abs(y - Y_TAIL_SADDLE) < 0.2) {
        ny = Y_SPINE_TOP + slotThicknessMm;
      }
      return [nx, ny];
    }

    // Ajustar el escalón de la cama trasera de cola al espesor del material si aplica
    if (x >= X_TAIL_SADDLE_START - 0.25 && Math.abs(y - Y_TAIL_SADDLE) < 0.2) {
      ny = Y_SPINE_TOP + slotThicknessMm;
    }

    // 3. Transformación horizontal por zonas (monótona y continua)
    if (x <= X_SADDLE_START + 0.05) {
      // Zona 1: Nariz y cabina frontal
      nx = X_NOSE + (x - X_NOSE) * kx;
    } else if (x <= X_SADDLE_END + 0.05) {
      // Zona 2: Cama del ala (escala exactamente a wingWidthMm)
      const t = (x - X_SADDLE_START) / (X_SADDLE_END - X_SADDLE_START);
      nx = newSaddleStart + t * wingWidthMm;
    } else if (x <= X_TAIL_SADDLE_START + 0.05) {
      // Zona 3: Cuerpo central del fuselaje
      nx = newSaddleEnd + (x - X_SADDLE_END) * kx;
    } else {
      // Zona 4: Cama de cola trasera y timón (mantiene geometría exacta de ensamble de 44.45 mm)
      const t = (x - X_TAIL_SADDLE_START) / L_TAIL_0;
      nx = newTailSaddleStart + t * L_TAIL_0;
    }

    return [nx, ny];
  });
}

/**
 * Transforma los nodos del Ala Izquierda manteniendo:
 * - Semienvergadura exacta = wingspanMm / 2
 * - Ancho (cuerda) exacto = wingWidthMm
 * - Ranura de ensamble en la raíz con profundidad fija (25.40 mm) y ancho fijo (slotThicknessMm)
 */
function transformLeftWingCommands(
  cmds: Command[],
  singleWingSpanMm: number,
  wingWidthMm: number,
  slotThicknessMm: number
): Command[] {
  const X_TIP = 13.3985; // 37.98 pt
  const X_SLOT_INNER = 241.9985; // 685.98 pt
  const X_ROOT = 267.3985; // 757.98 pt
  const BASE_SPAN = X_ROOT - X_TIP; // 254.00 mm
  const SLOT_DEPTH = 25.40; // 72.00 pt (1.00 in fijo)

  const Y_LEAD = 114.2365; // (576 - 252.18) * 25.4/72
  const Y_SLOT_TOP = 154.7495; // (576 - 137.34) * 25.4/72
  const Y_SLOT_BOT = 157.9245; // (576 - 128.34) * 25.4/72
  const Y_TRAIL = 190.4365; // (576 - 36.18) * 25.4/72
  const BASE_CHORD = Y_TRAIL - Y_LEAD; // 76.20 mm

  const SLOT_REL = 0.5525;
  const newSlotCenterY = Y_LEAD + SLOT_REL * wingWidthMm;

  return mapCommandPoints(cmds, (x, y) => {
    let nx: number;
    let ny: number;

    // Coordenada X: preservar profundidad exacta de 25.40 mm en el fondo de la ranura
    const isSlotInnerX = Math.abs(x - X_SLOT_INNER) < 0.3 && y > Y_SLOT_TOP - 1 && y < Y_SLOT_BOT + 1;
    if (isSlotInnerX) {
      nx = X_ROOT - SLOT_DEPTH;
    } else {
      nx = X_ROOT - (X_ROOT - x) * (singleWingSpanMm / BASE_SPAN);
    }

    // Coordenada Y: preservar espesor exacto (slotThicknessMm) en los bordes de la ranura
    if (Math.abs(y - Y_SLOT_TOP) < 0.3 && x > X_SLOT_INNER - 1) {
      ny = newSlotCenterY - slotThicknessMm / 2;
    } else if (Math.abs(y - Y_SLOT_BOT) < 0.3 && x > X_SLOT_INNER - 1) {
      ny = newSlotCenterY + slotThicknessMm / 2;
    } else {
      ny = Y_LEAD + (y - Y_LEAD) * (wingWidthMm / BASE_CHORD);
    }

    return [nx, ny];
  });
}

/**
 * Transforma los nodos del Ala Derecha manteniendo:
 * - Semienvergadura exacta = wingspanMm / 2
 * - Ancho (cuerda) exacto = wingWidthMm
 * - Ranura de ensamble en la raíz con profundidad fija (25.40 mm) y ancho fijo (slotThicknessMm)
 */
function transformRightWingCommands(
  cmds: Command[],
  singleWingSpanMm: number,
  wingWidthMm: number,
  slotThicknessMm: number
): Command[] {
  const X_ROOT = 292.1635; // 828.18 pt
  const X_SLOT_INNER = 317.5635; // 900.18 pt
  const X_TIP = 546.1635; // 1548.18 pt
  const BASE_SPAN = X_TIP - X_ROOT; // 254.00 mm
  const SLOT_DEPTH = 25.40; // 72.00 pt (1.00 in fijo)

  const Y_LEAD = 115.3795; // (576 - 248.94) * 25.4/72
  const Y_SLOT_TOP = 155.8925; // (576 - 134.10) * 25.4/72
  const Y_SLOT_BOT = 159.0675; // (576 - 125.10) * 25.4/72
  const Y_TRAIL = 191.5795; // (576 - 32.94) * 25.4/72
  const BASE_CHORD = Y_TRAIL - Y_LEAD; // 76.20 mm

  const SLOT_REL = 0.5525;
  const newSlotCenterY = Y_LEAD + SLOT_REL * wingWidthMm;

  return mapCommandPoints(cmds, (x, y) => {
    let nx: number;
    let ny: number;

    // Coordenada X: preservar profundidad exacta de 25.40 mm en el fondo de la ranura
    const isSlotInnerX = Math.abs(x - X_SLOT_INNER) < 0.3 && y > Y_SLOT_TOP - 1 && y < Y_SLOT_BOT + 1;
    if (isSlotInnerX) {
      nx = X_ROOT + SLOT_DEPTH;
    } else {
      nx = X_ROOT + (x - X_ROOT) * (singleWingSpanMm / BASE_SPAN);
    }

    // Coordenada Y: preservar espesor exacto (slotThicknessMm) en los bordes de la ranura
    if (Math.abs(y - Y_SLOT_TOP) < 0.3 && x < X_SLOT_INNER + 1) {
      ny = newSlotCenterY - slotThicknessMm / 2;
    } else if (Math.abs(y - Y_SLOT_BOT) < 0.3 && x < X_SLOT_INNER + 1) {
      ny = newSlotCenterY + slotThicknessMm / 2;
    } else {
      ny = Y_LEAD + (y - Y_LEAD) * (wingWidthMm / BASE_CHORD);
    }

    return [nx, ny];
  });
}

/**
 * Transforma el Estabilizador Horizontal manteniendo el espesor exacto de sus 2 ranuras de ensamble
 */
function transformStabilizerCommands(cmds: Command[], slotThicknessMm: number, isInnerSlot: boolean): Command[] {
  if (isInnerSlot) {
    // Ranura rectangular central: X=[374.523..412.623] (38.10 mm), Y=[66.9925..70.1675] (3.175 mm)
    const Y_CENTER = (66.9925 + 70.1675) / 2;
    return mapCommandPoints(cmds, (x, y) => {
      const ny = y < Y_CENTER ? Y_CENTER - slotThicknessMm / 2 : Y_CENTER + slotThicknessMm / 2;
      return [x, ny];
    });
  } else {
    // Contorno exterior con muesca inferior en X=[391.986..395.161] (3.175 mm)
    const X_NOTCH_L = 391.986;
    const X_NOTCH_R = 395.161;
    const X_NOTCH_CENTER = (X_NOTCH_L + X_NOTCH_R) / 2;
    return mapCommandPoints(cmds, (x, y) => {
      if (Math.abs(x - X_NOTCH_L) < 0.25 && y > 88) {
        return [X_NOTCH_CENTER - slotThicknessMm / 2, y];
      }
      if (Math.abs(x - X_NOTCH_R) < 0.25 && y > 88) {
        return [X_NOTCH_CENTER + slotThicknessMm / 2, y];
      }
      return [x, y];
    });
  }
}

/**
 * Transforma los soportes de unión (Diedro y Trasero) manteniendo el espesor exacto de su ranura central
 */
function transformBraceCommands(
  cmds: Command[],
  slotThicknessMm: number,
  slotLeftX: number,
  slotRightX: number
): Command[] {
  const center = (slotLeftX + slotRightX) / 2;
  return mapCommandPoints(cmds, (x, y) => {
    if (Math.abs(x - slotLeftX) < 0.2) {
      return [center - slotThicknessMm / 2, y];
    }
    if (Math.abs(x - slotRightX) < 0.2) {
      return [center + slotThicknessMm / 2, y];
    }
    return [x, y];
  });
}

function translateCommands(cmds: Command[], dx: number, dy: number): Command[] {
  if (Math.abs(dx) < 1e-6 && Math.abs(dy) < 1e-6) return cmds;
  return mapCommandPoints(cmds, (x, y) => [x + dx, y + dy]);
}

/**
 * Carga la plantilla SVG estructurada `planeador-base.svg`, identifica los grupos vectoriales
 * de alas, fuselaje, estabilizador y soportes, y aplica las transformaciones paramétricas en los nodos
 * preservando las dimensiones exactas de las ranuras de ensamble.
 */
export async function processGliderSvg(params: GliderParams): Promise<ProcessedGliderResult> {
  const fuselageLengthMm = Math.max(250, Math.min(1200, Number(params.fuselageLengthMm) || BASE_GLIDER_PARAMS.fuselageLengthMm));
  const wingspanMm = Math.max(200, Math.min(1400, Number(params.wingspanMm) || BASE_GLIDER_PARAMS.wingspanTotalMm));
  const wingWidthMm = Math.max(35, Math.min(200, Number(params.wingWidthMm) || BASE_GLIDER_PARAMS.wingWidthMm));
  const slotThicknessMm = Math.max(1.5, Math.min(10, Number(params.slotThicknessMm) || BASE_GLIDER_PARAMS.slotThicknessMm));
  const singleWingSpanMm = wingspanMm / 2;
  const cutStrokeColor = params.cutStrokeColor || '#FF0000';

  const templatePath = path.join(process.cwd(), 'public', 'templates', 'planeador-base.svg');
  const rawSvg = fs.readFileSync(templatePath, 'utf8');

  // Parsear el árbol vectorial SVG mediante svgson
  const ast: INode = await parse(rawSvg);

  // Diccionario de comandos procesados para calcular bounding boxes y evitar colisiones
  const processedPaths: Record<string, Command[]> = {};

  for (const group of ast.children) {
    if (group.name !== 'g') continue;
    const groupId = group.attributes.id;
    group.attributes.stroke = cutStrokeColor;

    for (const child of group.children) {
      if (child.name !== 'path' || !child.attributes.d) continue;
      const pathId = child.attributes.id || groupId;
      const parsedCmds = parseSVG(child.attributes.d);

      if (groupId === 'fuselaje') {
        processedPaths[pathId] = transformFuselageCommands(
          parsedCmds,
          fuselageLengthMm,
          wingWidthMm,
          slotThicknessMm
        );
        group.attributes['data-current-length-mm'] = fuselageLengthMm.toFixed(2);
        group.attributes['data-wing-saddle-mm'] = wingWidthMm.toFixed(2);
        group.attributes['data-slot-width-mm'] = slotThicknessMm.toFixed(3);
      } else if (groupId === 'ala-izquierda') {
        processedPaths[pathId] = transformLeftWingCommands(
          parsedCmds,
          singleWingSpanMm,
          wingWidthMm,
          slotThicknessMm
        );
        group.attributes['data-current-semispan-mm'] = singleWingSpanMm.toFixed(2);
        group.attributes['data-current-chord-mm'] = wingWidthMm.toFixed(2);
        group.attributes['data-slot-width-mm'] = slotThicknessMm.toFixed(3);
      } else if (groupId === 'ala-derecha') {
        processedPaths[pathId] = transformRightWingCommands(
          parsedCmds,
          singleWingSpanMm,
          wingWidthMm,
          slotThicknessMm
        );
        group.attributes['data-current-semispan-mm'] = singleWingSpanMm.toFixed(2);
        group.attributes['data-current-chord-mm'] = wingWidthMm.toFixed(2);
        group.attributes['data-slot-width-mm'] = slotThicknessMm.toFixed(3);
      } else if (groupId === 'estabilizador-horizontal') {
        const isInner = pathId === 'estabilizador-ranura-central' || child.attributes['data-slot'] === 'true';
        processedPaths[pathId] = transformStabilizerCommands(parsedCmds, slotThicknessMm, isInner);
        group.attributes['data-slot-width-mm'] = slotThicknessMm.toFixed(3);
      } else if (groupId === 'soporte-diedro') {
        // Ranura central en X=[43.6245..46.7995]
        processedPaths[pathId] = transformBraceCommands(parsedCmds, slotThicknessMm, 43.6245, 46.7995);
        group.attributes['data-slot-width-mm'] = slotThicknessMm.toFixed(3);
      } else if (groupId === 'soporte-trasero') {
        // Ranura central en X=[100.203..103.378]
        processedPaths[pathId] = transformBraceCommands(parsedCmds, slotThicknessMm, 100.203, 103.378);
        group.attributes['data-slot-width-mm'] = slotThicknessMm.toFixed(3);
      } else {
        processedPaths[pathId] = parsedCmds;
      }
    }
  }

  // Reacomodar automáticamente las piezas en la lámina si crecen para evitar solapamientos o recortes fuera del área
  const leftWingCmds = processedPaths['ala-izquierda-contorno'];
  const rightWingCmds = processedPaths['ala-derecha-contorno'];
  if (leftWingCmds && rightWingCmds) {
    const leftBox = getCommandsBBox(leftWingCmds);
    const rightBox = getCommandsBBox(rightWingCmds);

    // Si el ala izquierda se sale por la izquierda (minX < 13.4 mm), desplazar ambas alas hacia la derecha
    let leftShiftX = 0;
    if (leftBox.minX < 13.3985) {
      leftShiftX = 13.3985 - leftBox.minX;
    }
    // Mantener una separación constante de 24.765 mm entre las raíces de ambas alas
    const newLeftMaxX = leftBox.maxX + leftShiftX;
    const targetRightMinX = newLeftMaxX + 24.765;
    const rightShiftX = targetRightMinX - rightBox.minX;

    // Si el fuselaje o estabilizador es más bajo por cambio de escala, asegurar margen vertical >= 16 mm
    const fusBox = getCommandsBBox(processedPaths['fuselaje-contorno']);
    const stabBox = getCommandsBBox(processedPaths['estabilizador-contorno']);
    const upperMaxY = Math.max(fusBox.maxY, stabBox.maxY);
    const currentWingsMinY = Math.min(leftBox.minY, rightBox.minY);
    const wingShiftY = currentWingsMinY < upperMaxY + 14 ? (upperMaxY + 14) - currentWingsMinY : 0;

    processedPaths['ala-izquierda-contorno'] = translateCommands(leftWingCmds, leftShiftX, wingShiftY);
    processedPaths['ala-derecha-contorno'] = translateCommands(rightWingCmds, rightShiftX, wingShiftY);
  }

  // Volcar los comandos transformados de vuelta al AST de svgson y calcular el tamaño total de la lámina
  let globalMaxX = 609.6;
  let globalMaxY = 203.2;

  for (const group of ast.children) {
    if (group.name !== 'g') continue;
    for (const child of group.children) {
      if (child.name !== 'path') continue;
      const pathId = child.attributes.id || group.attributes.id;
      const cmds = processedPaths[pathId];
      if (cmds) {
        child.attributes.d = serializeCommands(cmds);
        const bbox = getCommandsBBox(cmds);
        if (bbox.maxX + 13.4 > globalMaxX) globalMaxX = +(bbox.maxX + 13.4).toFixed(2);
        if (bbox.maxY + 11.6 > globalMaxY) globalMaxY = +(bbox.maxY + 11.6).toFixed(2);
      }
    }
  }

  // Actualizar metadatos y dimensiones de la lámina en el nodo raíz <svg>
  ast.attributes.viewBox = `0 0 ${globalMaxX} ${globalMaxY}`;
  ast.attributes.width = `${globalMaxX}mm`;
  ast.attributes.height = `${globalMaxY}mm`;
  ast.attributes['data-fuselage-length-mm'] = fuselageLengthMm.toFixed(2);
  ast.attributes['data-wingspan-mm'] = wingspanMm.toFixed(2);
  ast.attributes['data-wing-width-mm'] = wingWidthMm.toFixed(2);
  ast.attributes['data-slot-thickness-mm'] = slotThicknessMm.toFixed(3);

  // Si se solicita modo con anotaciones (para guía visual), agregar capa de cotas no cortable
  if (params.includeAnnotations) {
    const fusBox = getCommandsBBox(processedPaths['fuselaje-contorno']);
    const leftBox = getCommandsBBox(processedPaths['ala-izquierda-contorno']);
    const rightBox = getCommandsBBox(processedPaths['ala-derecha-contorno']);

    ast.children.push({
      name: 'g',
      type: 'element',
      value: '',
      attributes: {
        id: 'cotas-pedagogicas',
        'data-layer': 'annotations',
        fill: '#1e293b',
        'font-family': 'system-ui, sans-serif',
        'font-size': '5.2',
        'font-weight': 'bold',
      },
      children: [
        {
          name: 'text',
          type: 'element',
          value: '',
          attributes: {
            x: ((fusBox.minX + fusBox.maxX) / 2).toFixed(2),
            y: Math.max(5.5, fusBox.minY - 2.2).toFixed(2),
            'text-anchor': 'middle',
            fill: '#46247a',
          },
          children: [
            {
              name: '',
              type: 'text',
              value: `Fuselaje: ${fuselageLengthMm.toFixed(1)} mm (Cama de ala: ${wingWidthMm.toFixed(1)} mm | Ranura: ${slotThicknessMm.toFixed(2)} mm)`,
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
            y: (leftBox.minY + (leftBox.maxY - leftBox.minY) / 2).toFixed(2),
            'text-anchor': 'middle',
            fill: '#0284c7',
          },
          children: [
            {
              name: '',
              type: 'text',
              value: `Ala Izq: ${singleWingSpanMm.toFixed(1)} × ${wingWidthMm.toFixed(1)} mm (Ranura 25.4 × ${slotThicknessMm.toFixed(2)} mm)`,
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
            y: (rightBox.minY + (rightBox.maxY - rightBox.minY) / 2).toFixed(2),
            'text-anchor': 'middle',
            fill: '#0284c7',
          },
          children: [
            {
              name: '',
              type: 'text',
              value: `Ala Der: ${singleWingSpanMm.toFixed(1)} × ${wingWidthMm.toFixed(1)} mm (Ranura 25.4 × ${slotThicknessMm.toFixed(2)} mm)`,
              attributes: {},
              children: [],
            },
          ],
        },
      ],
    });
  }

  const outputSvg = `<?xml version="1.0" encoding="UTF-8"?>\n${stringify(ast)}`;

  const metrics: GliderMetrics = {
    fuselageLengthMm: +fuselageLengthMm.toFixed(2),
    fuselageHeightMm: BASE_GLIDER_PARAMS.fuselageHeightMm,
    wingSaddleLengthMm: +wingWidthMm.toFixed(2),
    wingspanTotalMm: +wingspanMm.toFixed(2),
    singleWingLengthMm: +singleWingSpanMm.toFixed(2),
    wingWidthMm: +wingWidthMm.toFixed(2),
    slotThicknessMm: +slotThicknessMm.toFixed(3),
    wingSlotDepthMm: BASE_GLIDER_PARAMS.wingSlotDepthMm,
    fuselageWingSlotDepthMm: BASE_GLIDER_PARAMS.fuselageWingSlotDepthMm,
    fuselageTailSlotDepthMm: BASE_GLIDER_PARAMS.fuselageTailSlotDepthMm,
    stabilizerSpanMm: BASE_GLIDER_PARAMS.stabilizerSpanMm,
    stabilizerChordMm: BASE_GLIDER_PARAMS.stabilizerChordMm,
    stabilizerCenterSlotLengthMm: BASE_GLIDER_PARAMS.stabilizerCenterSlotLengthMm,
    dihedralBraceWidthMm: BASE_GLIDER_PARAMS.dihedralBraceWidthMm,
    dihedralAngleDeg: BASE_GLIDER_PARAMS.dihedralAngleDeg,
    tailBraceWidthMm: BASE_GLIDER_PARAMS.tailBraceWidthMm,
    sheetWidthMm: globalMaxX,
    sheetHeightMm: globalMaxY,
  };

  return {
    svg: outputSvg,
    metrics,
    baseMetrics: BASE_GLIDER_PARAMS,
  };
}
