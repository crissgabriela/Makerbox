import * as THREE from 'three';
import { translateTextToBraille, BrailleCell } from './brailleData';
import { getArialGlyphAt, GLYPH_WIDTH, GLYPH_HEIGHT, STROKE_WIDTH } from './latinGlyphs';

export interface BrailleConfig {
  text: string;
  plateThicknessMm: number; // 1.0 mm (solicitado por usuario)
  dotHeightMm: number; // 0.36 mm (solicitado por usuario)
  dotRadiusMm: number; // 0.6 mm (diámetro 1.2 mm exacto solicitado)
  addKeychainHole: boolean; // true por defecto
  holeDiameterMm: number; // 4.5 mm
  plateHeightMm: number; // 28 mm
  plateCornerRadiusMm: number; // 5.0 mm
  dotSpacingMm: number; // 2.4 mm entre centros de puntos de celda
  cellSpacingMm: number; // 6.0 mm entre celdas consecutivas
  baseColor: string; // Color para la placa
  dotColor: string; // Color para los puntos
  includeNumberPrefix: boolean;
  includeDebossedText: boolean;
  debossDepthMm: number; // 0.4 mm (solicitado exactamente)
  debossStrokeMm: number; // 1.2 mm (igual al diámetro de los puntos braille)
  textColor: string;
}

export const DEFAULT_BRAILLE_CONFIG: BrailleConfig = {
  text: 'CRISS',
  plateThicknessMm: 1.0,
  dotHeightMm: 0.36,
  dotRadiusMm: 0.6, // Diámetro 1.2 mm
  addKeychainHole: true,
  holeDiameterMm: 4.5,
  plateHeightMm: 28,
  plateCornerRadiusMm: 5.0,
  dotSpacingMm: 2.4,
  cellSpacingMm: 6.0,
  baseColor: '#1e293b',
  dotColor: '#fbbf24',
  includeNumberPrefix: true,
  includeDebossedText: true,
  debossDepthMm: 0.4,
  debossStrokeMm: 1.2, // Espesor de letra 1.2 mm igual a puntos braille
  textColor: '#38bdf8'
};

export interface BrailleModelResult {
  cells: BrailleCell[];
  baseGeometry: THREE.BufferGeometry;
  dotsGeometry: THREE.BufferGeometry | null;
  textGeometry: THREE.BufferGeometry | null;
  combinedGeometry: THREE.BufferGeometry;
  widthMm: number;
  heightMm: number;
  totalThicknessMm: number;
  triangleCount: number;
  estimatedWeightGrams: number;
  estimatedPrintTimeMinutes: number;
  dotCount: number;
  stlBuffer: ArrayBuffer;
  objContent: string;
  mtlContent: string;
}

function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.substring(0, 2), 16) / 255;
  const g = parseInt(clean.substring(2, 4), 16) / 255;
  const b = parseInt(clean.substring(4, 6), 16) / 255;
  return [r, g, b];
}

/**
 * Añade un triángulo a las listas de posiciones y normales calculando la normal exterior
 */
function addTriangle(
  p1: [number, number, number],
  p2: [number, number, number],
  p3: [number, number, number],
  positions: number[],
  normals: number[],
  flipNormal = false
) {
  // Vector U = p2 - p1, V = p3 - p1
  const ux = p2[0] - p1[0],
    uy = p2[1] - p1[1],
    uz = p2[2] - p1[2];
  const vx = p3[0] - p1[0],
    vy = p3[1] - p1[1],
    vz = p3[2] - p1[2];

  let nx = uy * vz - uz * vy;
  let ny = uz * vx - ux * vz;
  let nz = ux * vy - uy * vx;
  const len = Math.hypot(nx, ny, nz);
  if (len > 0.00001) {
    nx /= len;
    ny /= len;
    nz /= len;
  } else {
    nz = 1;
  }

  if (flipNormal) {
    nx = -nx;
    ny = -ny;
    nz = -nz;
  }

  positions.push(p1[0], p1[1], p1[2], p2[0], p2[1], p2[2], p3[0], p3[1], p3[2]);
  normals.push(nx, ny, nz, nx, ny, nz, nx, ny, nz);
}

/**
 * Añade un cuadrilátero orientado (p1 -> p2 -> p3 -> p4) dividido en 2 triángulos
 */
function addQuad(
  p1: [number, number, number],
  p2: [number, number, number],
  p3: [number, number, number],
  p4: [number, number, number],
  positions: number[],
  normals: number[]
) {
  addTriangle(p1, p2, p3, positions, normals);
  addTriangle(p1, p3, p4, positions, normals);
}

/**
 * Crea una semiesfera (domo) abierta en la base, unida al plano baseZ = 1.0 mm
 * Diámetro: 1.2 mm (radio 0.6 mm), Altura: 0.36 mm
 * El anillo inferior coincide exactamente con el orificio circular del plano de la placa.
 */
function createSeamlessDome(
  cx: number,
  cy: number,
  r: number,
  h: number,
  baseZ: number,
  segments = 16,
  rings = 4
): THREE.BufferGeometry {
  const positions: number[] = [];
  const normals: number[] = [];

  for (let j = 0; j < rings; j++) {
    const phi1 = (j / rings) * (Math.PI / 2);
    const phi2 = ((j + 1) / rings) * (Math.PI / 2);

    const r1 = r * Math.cos(phi1);
    const r2 = r * Math.cos(phi2);

    const z1 = baseZ + h * Math.sin(phi1);
    const z2 = baseZ + h * Math.sin(phi2);

    for (let i = 0; i < segments; i++) {
      const theta1 = (i / segments) * Math.PI * 2;
      const theta2 = (((i + 1) % segments) / segments) * Math.PI * 2;

      const cos1 = Math.cos(theta1),
        sin1 = Math.sin(theta1);
      const cos2 = Math.cos(theta2),
        sin2 = Math.sin(theta2);

      const p1: [number, number, number] = [cx + r1 * cos1, cy + r1 * sin1, z1];
      const p2: [number, number, number] = [cx + r1 * cos2, cy + r1 * sin2, z1];
      const p3: [number, number, number] = [cx + r2 * cos2, cy + r2 * sin2, z2];
      const p4: [number, number, number] = [cx + r2 * cos1, cy + r2 * sin1, z2];

      if (j === rings - 1) {
        // En el último anillo, p3 y p4 se juntan en el ápice
        const apex: [number, number, number] = [cx, cy, baseZ + h];
        addTriangle(p1, p2, apex, positions, normals);
      } else {
        addQuad(p1, p2, p3, p4, positions, normals);
      }
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
  return geo;
}

/**
 * Crea una pared cilíndrica vertical (para el orificio del llavero)
 */
function createCylinderWall(
  cx: number,
  cy: number,
  radius: number,
  zTop: number,
  zBottom: number,
  segments = 24
): THREE.BufferGeometry {
  const positions: number[] = [];
  const normals: number[] = [];

  for (let i = 0; i < segments; i++) {
    const theta1 = (i / segments) * Math.PI * 2;
    const theta2 = (((i + 1) % segments) / segments) * Math.PI * 2;

    const cos1 = Math.cos(theta1),
      sin1 = Math.sin(theta1);
    const cos2 = Math.cos(theta2),
      sin2 = Math.sin(theta2);

    // Normal apuntando hacia el centro del orificio (interior)
    const p1: [number, number, number] = [cx + radius * cos1, cy + radius * sin1, zTop];
    const p2: [number, number, number] = [cx + radius * cos2, cy + radius * sin2, zTop];
    const p3: [number, number, number] = [cx + radius * cos2, cy + radius * sin2, zBottom];
    const p4: [number, number, number] = [cx + radius * cos1, cy + radius * sin1, zBottom];

    addQuad(p2, p1, p4, p3, positions, normals);
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
  return geo;
}

/**
 * Obtiene los puntos del perímetro exterior redondeado de la placa
 */
function getPlaquePerimeterPoints(
  width: number,
  height: number,
  radius: number,
  cornerSteps = 8
): [number, number][] {
  const halfW = width / 2;
  const halfH = height / 2;
  const r = Math.min(radius, halfW, halfH);
  const pts: [number, number][] = [];

  const addCorner = (cx: number, cy: number, startA: number, endA: number) => {
    for (let i = 0; i <= cornerSteps; i++) {
      const a = startA + (i / cornerSteps) * (endA - startA);
      pts.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]);
    }
  };

  // Esquina inferior derecha
  addCorner(halfW - r, -halfH + r, -Math.PI / 2, 0);
  // Esquina superior derecha
  addCorner(halfW - r, halfH - r, 0, Math.PI / 2);
  // Esquina superior izquierda
  addCorner(-halfW + r, halfH - r, Math.PI / 2, Math.PI);
  // Esquina inferior izquierda
  addCorner(-halfW + r, -halfH + r, Math.PI, (3 * Math.PI) / 2);

  return pts;
}

/**
 * Genera el modelo 3D estanco y cerrado (100% Manifold) del Llavero Braille:
 * - Placa de 1.0 mm de espesor
 * - Puntos Braille: semiesferas estancas de 1.2 mm de diámetro y 0.36 mm de altura pegadas al plano
 * - Texto en bajorrelieve estilo Arial: profundidad 0.4 mm y trazo de 1.2 mm
 */
export function generateBraille3D(config: BrailleConfig): BrailleModelResult {
  const cells = translateTextToBraille(config.text, config.includeNumberPrefix);
  const numCells = Math.max(1, cells.length);

  // Dimensiones
  const dotRadius = 0.6; // 1.2 mm de diámetro
  const dotHeight = 0.36; // 0.36 mm de altura
  const cellWidth = config.dotSpacingMm; // 2.4 mm
  const cellSpacing = config.cellSpacingMm; // 6.0 mm
  const brailleSpan = (numCells - 1) * cellSpacing + cellWidth;

  const rawChars = config.text.trim().toUpperCase();
  const numChars = Math.max(1, rawChars.length);
  const charWidth = GLYPH_WIDTH; // 5.0 mm
  const charSpacing = 1.6; // mm
  const latinSpan = numChars * charWidth + (numChars - 1) * charSpacing;

  const contentSpan = config.includeDebossedText
    ? Math.max(brailleSpan, latinSpan)
    : brailleSpan;

  const leftMargin = config.addKeychainHole ? config.holeDiameterMm + 10 : 8;
  const rightMargin = 8;
  const totalWidth = Math.max(38, leftMargin + contentSpan + rightMargin);
  const totalHeight = config.plateHeightMm;

  const usableStartX = -totalWidth / 2 + leftMargin;
  const holeX = -totalWidth / 2 + (config.holeDiameterMm / 2 + 4.5);

  const brailleStartX = usableStartX + (contentSpan - brailleSpan) / 2;
  const latinStartX = usableStartX + (contentSpan - latinSpan) / 2;

  const brailleCenterY = config.includeDebossedText ? -5.5 : 0;
  const latinCenterY = 3.6;

  const plateThickness = config.plateThicknessMm; // 1.0 mm
  const debossDepth = Math.min(config.debossDepthMm, plateThickness - 0.2); // 0.4 mm
  const trenchFloorZ = plateThickness - debossDepth; // 0.6 mm

  // =========================================================================
  // COLECTAR PUNTOS BRAILLE (Coordenadas XY)
  // =========================================================================
  const dotOffsets: Record<number, [number, number]> = {
    1: [0, config.dotSpacingMm],
    2: [0, 0],
    3: [0, -config.dotSpacingMm],
    4: [config.dotSpacingMm, config.dotSpacingMm],
    5: [config.dotSpacingMm, 0],
    6: [config.dotSpacingMm, -config.dotSpacingMm]
  };

  const dotCenters: [number, number][] = [];
  cells.forEach((cell, cellIdx) => {
    const cellX = brailleStartX + cellIdx * cellSpacing;
    cell.dots.forEach((d) => {
      const off = dotOffsets[d];
      if (off) dotCenters.push([cellX + off[0], brailleCenterY + off[1]]);
    });
  });

  // =========================================================================
  // COLECTAR GLIFOS ARIAL EN BAJORRELIEVE (Contornos e Islas)
  // =========================================================================
  interface LetterGlyphMeshInfo {
    contour: [number, number][];
    holes?: [number, number][][];
  }
  const letterGlyphs: LetterGlyphMeshInfo[] = [];

  if (config.includeDebossedText && rawChars.length > 0) {
    let curX = latinStartX;
    for (let c = 0; c < rawChars.length; c++) {
      const char = rawChars[c];
      if (char === ' ') {
        curX += 3.2;
        continue;
      }
      const polys = getArialGlyphAt(char, curX, latinCenterY, 1.0);
      polys.forEach((p) => letterGlyphs.push(p));
      curX += charWidth + charSpacing;
    }
  }

  // =========================================================================
  // CONSTRUCCIÓN DE LA MALLA CERRADA ESTANCA (100% WATERTIGHT 2-MANIFOLD)
  // =========================================================================
  const meshParts: THREE.BufferGeometry[] = [];
  const dotMeshParts: THREE.BufferGeometry[] = [];

  const perimPoints = getPlaquePerimeterPoints(totalWidth, totalHeight, config.plateCornerRadiusMm, 12);

  // 1. CARA SUPERIOR DE LA PLACA (Z = 1.0 mm)
  // Forma exterior con orificios para: orificio llavero, cavidades de texto, y bases de semiesferas
  const topShape = new THREE.Shape();
  perimPoints.forEach(([px, py], i) => (i === 0 ? topShape.moveTo(px, py) : topShape.lineTo(px, py)));
  topShape.closePath();

  // Orificio de llavero
  if (config.addKeychainHole) {
    const hPath = new THREE.Path();
    const hRad = config.holeDiameterMm / 2;
    for (let i = 0; i < 24; i++) {
      const a = (i / 24) * Math.PI * 2;
      const hx = holeX + hRad * Math.cos(a);
      const hy = hRad * Math.sin(a);
      if (i === 0) hPath.moveTo(hx, hy);
      else hPath.lineTo(hx, hy);
    }
    hPath.closePath();
    topShape.holes.push(hPath);
  }

  // Orificios para las cavidades de las letras (bajorrelieve)
  letterGlyphs.forEach((g) => {
    const lPath = new THREE.Path();
    g.contour.forEach(([px, py], idx) => {
      if (idx === 0) lPath.moveTo(px, py);
      else lPath.lineTo(px, py);
    });
    lPath.closePath();
    topShape.holes.push(lPath);
  });

  // Orificios circulares para las bases de las semiesferas Braille (diámetro 1.2 mm = radio 0.6 mm)
  // Cada orificio se une con el anillo inferior del domo sin ninguna cara interior sobrante
  dotCenters.forEach(([dx, dy]) => {
    const dPath = new THREE.Path();
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * Math.PI * 2;
      const x = dx + dotRadius * Math.cos(a);
      const y = dy + dotRadius * Math.sin(a);
      if (i === 0) dPath.moveTo(x, y);
      else dPath.lineTo(x, y);
    }
    dPath.closePath();
    topShape.holes.push(dPath);
  });

  const topFaceGeo = new THREE.ShapeGeometry(topShape);
  topFaceGeo.translate(0, 0, plateThickness); // Z = 1.0 mm
  meshParts.push(topFaceGeo);

  // 2. SEMIESFERAS BRAILLE (Día 1.2 mm, Alt 0.36 mm pegadas directamente al plano Z = 1.0 mm)
  dotCenters.forEach(([dx, dy]) => {
    const dome = createSeamlessDome(dx, dy, dotRadius, dotHeight, plateThickness, 16, 4);
    dotMeshParts.push(dome);
    meshParts.push(dome);
  });

  // 3. CAVIDADES DE LETRAS EN BAJORRELIEVE (Profundidad 0.4 mm, fondo en Z = 0.6 mm)
  const trenchPositions: number[] = [];
  const trenchNormals: number[] = [];

  letterGlyphs.forEach((g) => {
    // A. Paredes verticales de la ranura de la letra (desde Z = 1.0 hasta Z = 0.6)
    const cnt = g.contour;
    for (let i = 0; i < cnt.length; i++) {
      const pA = cnt[i];
      const pB = cnt[(i + 1) % cnt.length];

      const v1: [number, number, number] = [pA[0], pA[1], plateThickness];
      const v2: [number, number, number] = [pB[0], pB[1], plateThickness];
      const v3: [number, number, number] = [pB[0], pB[1], trenchFloorZ];
      const v4: [number, number, number] = [pA[0], pA[1], trenchFloorZ];

      // Normal apuntando hacia el interior de la hendidura
      addQuad(v2, v1, v4, v3, trenchPositions, trenchNormals);
    }

    // B. Piso de la ranura de la letra (en Z = 0.6 mm)
    const floorShape = new THREE.Shape();
    cnt.forEach(([px, py], idx) => {
      if (idx === 0) floorShape.moveTo(px, py);
      else floorShape.lineTo(px, py);
    });
    floorShape.closePath();

    // Si la letra tiene islas interiores (huecos como O, A, D, R, P, B), se restan del piso
    if (g.holes && g.holes.length > 0) {
      g.holes.forEach((hPts) => {
        const hPath = new THREE.Path();
        hPts.forEach(([px, py], idx) => {
          if (idx === 0) hPath.moveTo(px, py);
          else hPath.lineTo(px, py);
        });
        hPath.closePath();
        floorShape.holes.push(hPath);

        // Paredes de la isla interior (desde Z = 0.6 hasta Z = 1.0)
        for (let i = 0; i < hPts.length; i++) {
          const iA = hPts[i];
          const iB = hPts[(i + 1) % hPts.length];

          const iv1: [number, number, number] = [iA[0], iA[1], trenchFloorZ];
          const iv2: [number, number, number] = [iB[0], iB[1], trenchFloorZ];
          const iv3: [number, number, number] = [iB[0], iB[1], plateThickness];
          const iv4: [number, number, number] = [iA[0], iA[1], plateThickness];

          addQuad(iv2, iv1, iv4, iv3, trenchPositions, trenchNormals);
        }

        // Tapa superior de la isla en Z = 1.0 mm (al ras de la placa)
        const islandTopShape = new THREE.Shape();
        hPts.forEach(([px, py], idx) => {
          if (idx === 0) islandTopShape.moveTo(px, py);
          else islandTopShape.lineTo(px, py);
        });
        islandTopShape.closePath();
        const islandTopGeo = new THREE.ShapeGeometry(islandTopShape);
        islandTopGeo.translate(0, 0, plateThickness);
        meshParts.push(islandTopGeo);
      });
    }

    const floorGeo = new THREE.ShapeGeometry(floorShape);
    floorGeo.translate(0, 0, trenchFloorZ);
    meshParts.push(floorGeo);
  });

  if (trenchPositions.length > 0) {
    const trenchWallsGeo = new THREE.BufferGeometry();
    trenchWallsGeo.setAttribute('position', new THREE.Float32BufferAttribute(trenchPositions, 3));
    trenchWallsGeo.setAttribute('normal', new THREE.Float32BufferAttribute(trenchNormals, 3));
    meshParts.push(trenchWallsGeo);
  }

  // 4. PAREDES EXTERIORES DEL PERÍMETRO (Desde Z = 1.0 hasta Z = 0 mm)
  const wallPositions: number[] = [];
  const wallNormals: number[] = [];

  for (let i = 0; i < perimPoints.length; i++) {
    const pA = perimPoints[i];
    const pB = perimPoints[(i + 1) % perimPoints.length];

    const v1: [number, number, number] = [pA[0], pA[1], plateThickness];
    const v2: [number, number, number] = [pB[0], pB[1], plateThickness];
    const v3: [number, number, number] = [pB[0], pB[1], 0];
    const v4: [number, number, number] = [pA[0], pA[1], 0];

    // Normal exterior
    addQuad(v1, v2, v3, v4, wallPositions, wallNormals);
  }

  const outerWallsGeo = new THREE.BufferGeometry();
  outerWallsGeo.setAttribute('position', new THREE.Float32BufferAttribute(wallPositions, 3));
  outerWallsGeo.setAttribute('normal', new THREE.Float32BufferAttribute(wallNormals, 3));
  meshParts.push(outerWallsGeo);

  // 5. PARED CILÍNDRICA DEL ORIFICIO DE LLAVERO (Desde Z = 1.0 hasta Z = 0 mm)
  if (config.addKeychainHole) {
    const holeWallGeo = createCylinderWall(
      holeX,
      0,
      config.holeDiameterMm / 2,
      plateThickness,
      0,
      24
    );
    meshParts.push(holeWallGeo);
  }

  // 6. CARA INFERIOR DE LA PLACA (En Z = 0 mm, 100% plana para adherencia en cama 3D)
  const bottomShape = new THREE.Shape();
  perimPoints.forEach(([px, py], i) => (i === 0 ? bottomShape.moveTo(px, py) : bottomShape.lineTo(px, py)));
  bottomShape.closePath();

  if (config.addKeychainHole) {
    const bHolePath = new THREE.Path();
    const hRad = config.holeDiameterMm / 2;
    for (let i = 0; i < 24; i++) {
      const a = (i / 24) * Math.PI * 2;
      const hx = holeX + hRad * Math.cos(a);
      const hy = hRad * Math.sin(a);
      if (i === 0) bHolePath.moveTo(hx, hy);
      else bHolePath.lineTo(hx, hy);
    }
    bHolePath.closePath();
    bottomShape.holes.push(bHolePath);
  }

  const bottomFaceGeo = new THREE.ShapeGeometry(bottomShape);
  // Invertir normales para que apunten hacia -Z
  const bNormals = bottomFaceGeo.getAttribute('normal');
  for (let i = 0; i < bNormals.count; i++) {
    bNormals.setZ(i, -1);
  }
  // Invertir orden de los índices para winding hacia afuera
  if (bottomFaceGeo.index) {
    const idx = bottomFaceGeo.index.array;
    for (let i = 0; i < idx.length; i += 3) {
      const tmp = idx[i + 1];
      idx[i + 1] = idx[i + 2];
      idx[i + 2] = tmp;
    }
  }
  meshParts.push(bottomFaceGeo);

  // 7. UNIFICACIÓN DE LA MALLA COMPLETA ESTANCA
  const combinedGeometry = mergeBufferGeometries(meshParts);
  combinedGeometry.computeVertexNormals();

  // Malla de puntos braille separada para el visor 3D (para asignación de color)
  let dotsGeometry: THREE.BufferGeometry | null = null;
  if (dotMeshParts.length > 0) {
    dotsGeometry = mergeBufferGeometries(dotMeshParts);
    dotsGeometry.computeVertexNormals();
  }

  // Malla base para el visor
  const baseGeometry = combinedGeometry.clone();

  // Exportaciones
  const baseRgb = hexToRgb(config.baseColor);
  const dotRgb = hexToRgb(config.dotColor);

  const stlBuffer = exportBufferGeometryToBinaryStl(combinedGeometry);
  const { objContent, mtlContent } = exportToObjWithColors(
    baseGeometry,
    dotsGeometry,
    baseRgb,
    dotRgb
  );

  const totalTriangles = (combinedGeometry.getAttribute('position').count / 3) | 0;
  const plateAreaCm2 = (totalWidth * totalHeight) / 100;
  const volumeCm3 = plateAreaCm2 * (config.plateThicknessMm / 10);
  const estimatedWeightGrams = Math.max(1, Math.round(volumeCm3 * 1.25));
  const estimatedPrintTimeMinutes = Math.max(5, Math.round(estimatedWeightGrams * 3.5));

  return {
    cells,
    baseGeometry,
    dotsGeometry,
    textGeometry: null,
    combinedGeometry,
    widthMm: Math.round(totalWidth * 10) / 10,
    heightMm: totalHeight,
    totalThicknessMm: Math.round((config.plateThicknessMm + dotHeight) * 100) / 100,
    triangleCount: totalTriangles,
    estimatedWeightGrams,
    estimatedPrintTimeMinutes,
    dotCount: dotCenters.length,
    stlBuffer,
    objContent,
    mtlContent
  };
}

/**
 * Une múltiples BufferGeometry en una sola BufferGeometry no indexada
 */
function mergeBufferGeometries(geometries: THREE.BufferGeometry[]): THREE.BufferGeometry {
  const merged = new THREE.BufferGeometry();
  const positions: number[] = [];
  const normals: number[] = [];

  for (const geo of geometries) {
    const nonIndexed = geo.index ? geo.toNonIndexed() : geo;
    const posAttr = nonIndexed.getAttribute('position');
    const normAttr = nonIndexed.getAttribute('normal');

    if (posAttr) {
      for (let i = 0; i < posAttr.count; i++) {
        positions.push(posAttr.getX(i), posAttr.getY(i), posAttr.getZ(i));
        if (normAttr) {
          normals.push(normAttr.getX(i), normAttr.getY(i), normAttr.getZ(i));
        } else {
          normals.push(0, 0, 1);
        }
      }
    }
  }

  merged.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  merged.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
  return merged;
}

/**
 * Exportador STL Binario estanco de alta velocidad
 */
function exportBufferGeometryToBinaryStl(geometry: THREE.BufferGeometry): ArrayBuffer {
  const nonIndexed = geometry.index ? geometry.toNonIndexed() : geometry;
  const posAttr = nonIndexed.getAttribute('position');
  const normAttr = nonIndexed.getAttribute('normal');

  const triangleCount = posAttr.count / 3;
  const bufferSize = 84 + triangleCount * 50;
  const buffer = new ArrayBuffer(bufferSize);
  const view = new DataView(buffer);

  const headerText = 'MakerBox UTalca - Llavero Braille 3D Watertight Manifold STL';
  for (let i = 0; i < 80; i++) {
    view.setUint8(i, i < headerText.length ? headerText.charCodeAt(i) : 32);
  }

  view.setUint32(80, triangleCount, true);

  let offset = 84;
  for (let t = 0; t < triangleCount; t++) {
    const vIdx = t * 3;

    let nx = 0,
      ny = 0,
      nz = 1;
    if (normAttr) {
      nx = normAttr.getX(vIdx);
      ny = normAttr.getY(vIdx);
      nz = normAttr.getZ(vIdx);
    }

    view.setFloat32(offset, nx, true);
    view.setFloat32(offset + 4, ny, true);
    view.setFloat32(offset + 8, nz, true);
    offset += 12;

    for (let i = 0; i < 3; i++) {
      const x = posAttr.getX(vIdx + i);
      const y = posAttr.getY(vIdx + i);
      const z = posAttr.getZ(vIdx + i);

      view.setFloat32(offset, x, true);
      view.setFloat32(offset + 4, y, true);
      view.setFloat32(offset + 8, z, true);
      offset += 12;
    }

    view.setUint16(offset, 0, true);
    offset += 2;
  }

  return buffer;
}

/**
 * Exportador OBJ con colores y materiales separados
 */
function exportToObjWithColors(
  baseGeo: THREE.BufferGeometry,
  dotsGeo: THREE.BufferGeometry | null,
  baseRgb: [number, number, number],
  dotRgb: [number, number, number]
): { objContent: string; mtlContent: string } {
  let obj = '# MakerBox UTalca - Llavero Braille 3D Watertight\n';
  obj += 'mtllib material.mtl\n\n';

  let currentVertexIndex = 1;

  const baseNonIndexed = baseGeo.index ? baseGeo.toNonIndexed() : baseGeo;
  const basePos = baseNonIndexed.getAttribute('position');
  const baseNorm = baseNonIndexed.getAttribute('normal');

  obj += 'o Llavero_Braille\n';
  obj += 'g Base_Placa\n';
  obj += 'usemtl Material_Base\n';

  const baseVertCount = basePos.count;
  for (let i = 0; i < baseVertCount; i++) {
    const x = basePos.getX(i).toFixed(4);
    const y = basePos.getY(i).toFixed(4);
    const z = basePos.getZ(i).toFixed(4);
    obj += `v ${x} ${y} ${z} ${baseRgb[0].toFixed(3)} ${baseRgb[1].toFixed(3)} ${baseRgb[2].toFixed(3)}\n`;
  }

  for (let i = 0; i < baseVertCount; i++) {
    const nx = (baseNorm?.getX(i) ?? 0).toFixed(4);
    const ny = (baseNorm?.getY(i) ?? 0).toFixed(4);
    const nz = (baseNorm?.getZ(i) ?? 1).toFixed(4);
    obj += `vn ${nx} ${ny} ${nz}\n`;
  }

  for (let t = 0; t < baseVertCount; t += 3) {
    const v1 = currentVertexIndex + t;
    const v2 = currentVertexIndex + t + 1;
    const v3 = currentVertexIndex + t + 2;
    obj += `f ${v1}//${v1} ${v2}//${v2} ${v3}//${v3}\n`;
  }

  currentVertexIndex += baseVertCount;

  if (dotsGeo) {
    const dotsNonIndexed = dotsGeo.index ? dotsGeo.toNonIndexed() : dotsGeo;
    const dotsPos = dotsNonIndexed.getAttribute('position');
    const dotsNorm = dotsNonIndexed.getAttribute('normal');
    const dotsVertCount = dotsPos.count;

    obj += '\ng Puntos_Braille\n';
    obj += 'usemtl Material_Puntos\n';

    for (let i = 0; i < dotsVertCount; i++) {
      const x = dotsPos.getX(i).toFixed(4);
      const y = dotsPos.getY(i).toFixed(4);
      const z = dotsPos.getZ(i).toFixed(4);
      obj += `v ${x} ${y} ${z} ${dotRgb[0].toFixed(3)} ${dotRgb[1].toFixed(3)} ${dotRgb[2].toFixed(3)}\n`;
    }

    for (let i = 0; i < dotsVertCount; i++) {
      const nx = (dotsNorm?.getX(i) ?? 0).toFixed(4);
      const ny = (dotsNorm?.getY(i) ?? 0).toFixed(4);
      const nz = (dotsNorm?.getZ(i) ?? 1).toFixed(4);
      obj += `vn ${nx} ${ny} ${nz}\n`;
    }

    for (let t = 0; t < dotsVertCount; t += 3) {
      const v1 = currentVertexIndex + t;
      const v2 = currentVertexIndex + t + 1;
      const v3 = currentVertexIndex + t + 2;
      obj += `f ${v1}//${v1} ${v2}//${v2} ${v3}//${v3}\n`;
    }
  }

  let mtl = '# Materiales para Llavero Braille 3D - MakerBox UTalca\n';
  mtl += 'newmtl Material_Base\n';
  mtl += 'Ka 0.2 0.2 0.2\n';
  mtl += `Kd ${baseRgb[0].toFixed(3)} ${baseRgb[1].toFixed(3)} ${baseRgb[2].toFixed(3)}\n`;
  mtl += 'Ks 0.1 0.1 0.1\n';
  mtl += 'Ns 10.0\n';
  mtl += 'd 1.0\n\n';

  mtl += 'newmtl Material_Puntos\n';
  mtl += 'Ka 0.2 0.2 0.2\n';
  mtl += `Kd ${dotRgb[0].toFixed(3)} ${dotRgb[1].toFixed(3)} ${dotRgb[2].toFixed(3)}\n`;
  mtl += 'Ks 0.3 0.3 0.3\n';
  mtl += 'Ns 20.0\n';
  mtl += 'd 1.0\n';

  return { objContent: obj, mtlContent: mtl };
}

export function downloadStl(buffer: ArrayBuffer, filename: string) {
  const blob = new Blob([buffer], { type: 'application/octet-stream' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename.endsWith('.stl') ? filename : `${filename}.stl`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function downloadObj(content: string, filename: string) {
  const blob = new Blob([content], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename.endsWith('.obj') ? filename : `${filename}.obj`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function downloadMtl(content: string, filename: string) {
  const blob = new Blob([content], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename.endsWith('.mtl') ? filename : `${filename}.mtl`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
