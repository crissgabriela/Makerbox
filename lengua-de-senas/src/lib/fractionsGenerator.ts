import * as THREE from 'three';
import { Font } from 'three/examples/jsm/loaders/FontLoader.js';
import { HELVETIKER_BOLD } from './helvetikerBold';
import { zipSync, strToU8 } from 'fflate';

// Fuente para grabado de números en bajo relieve
const helvetikerFont = new Font(HELVETIKER_BOLD);

export type FractionDenominator = 2 | 3 | 4 | 5 | 6;
export type MarkingMode = 'numbers' | 'braille';

export interface FractionsConfig {
  denominator: FractionDenominator; // 2, 3, 4, 5, 6
  mode: MarkingMode; // 'numbers' (bajo relieve) o 'braille' (sobre relieve)
  trayOuterDiameterMm: number; // 70 mm
  trayInnerDiameterMm: number; // 60 mm
  trayTotalHeightMm: number; // 5 mm
  trayPocketDepthMm: number; // 3 mm
  trayFloorThicknessMm: number; // 2 mm
  pieceThicknessMm: number; // 3 mm
  toleranceMm: number; // 0.2 mm
  textDebossDepthMm: number; // 0.8 mm
  dotDiameterMm: number; // 2.0 mm
  dotHeightMm: number; // 1.0 mm
  trayColor: string;
  pieceColor: string;
  markingColor: string;
  explodeDistanceMm: number; // 0 a 25 mm para vista 3D
}

export const DEFAULT_FRACTIONS_CONFIG: FractionsConfig = {
  denominator: 3, // 1/3 como en las fotos de muestra
  mode: 'numbers', // 'numbers' o 'braille'
  trayOuterDiameterMm: 70,
  trayInnerDiameterMm: 60,
  trayTotalHeightMm: 5,
  trayPocketDepthMm: 3,
  trayFloorThicknessMm: 2,
  pieceThicknessMm: 3,
  toleranceMm: 0.2, // 0.2 mm de tolerancia para no interferir
  textDebossDepthMm: 0.8,
  dotDiameterMm: 2.0, // 2 mm diámetro solicitado
  dotHeightMm: 1.0, // 1 mm altura solicitada
  trayColor: '#ffffff',
  pieceColor: '#ffffff',
  markingColor: '#0f172a',
  explodeDistanceMm: 0
};

export interface FractionsModelResult {
  config: FractionsConfig;
  trayGeometry: THREE.BufferGeometry;
  piecesGeometry: THREE.BufferGeometry; // Todas las piezas ensambladas / explosionadas
  singlePieceGeometry: THREE.BufferGeometry; // 1 pieza individual centrada
  printLayoutGeometry: THREE.BufferGeometry; // Plato + Piezas lado a lado en una sola placa para imprimir
  
  // Buffers STL binarios
  trayStlBuffer: ArrayBuffer;
  piecesStlBuffer: ArrayBuffer;
  singlePieceStlBuffer: ArrayBuffer;
  fullSetStlBuffer: ArrayBuffer;
  
  // Archivo SVG para corte y grabado láser
  laserSvgContent: string;
  
  // Archivo ZIP con todos los modelos
  zipBuffer: Uint8Array;
  
  // Métricas
  triangleCount: number;
  estimatedWeightGrams: number;
  estimatedPrintTimeMinutes: number;
  anglePerPieceDeg: number;
  toleranceAppliedMm: number;
}

// Mapeo Braille para fracciones (numerador 1, barra de fracción, denominador)
// Puntos: 1..6
// Prefijo de número: [3, 4, 5, 6]
// 1: [1]
// Barra de fracción: [3, 4]
// Denominadores:
// 2: [1, 2]
// 3: [1, 4]
// 4: [1, 4, 5]
// 5: [1, 5]
// 6: [1, 2, 4]
export const FRACTION_BRAILLE_CELLS: Record<FractionDenominator, { name: string; cells: number[][] }> = {
  2: {
    name: '1/2',
    cells: [
      [3, 4, 5, 6], // Signo de número ⠼
      [1],          // 1 ⠁
      [3, 4],       // Barra / ⠌
      [1, 2]        // 2 ⠃
    ]
  },
  3: {
    name: '1/3',
    cells: [
      [3, 4, 5, 6],
      [1],
      [3, 4],
      [1, 4]        // 3 ⠉
    ]
  },
  4: {
    name: '1/4',
    cells: [
      [3, 4, 5, 6],
      [1],
      [3, 4],
      [1, 4, 5]     // 4 ⠙
    ]
  },
  5: {
    name: '1/5',
    cells: [
      [3, 4, 5, 6],
      [1],
      [3, 4],
      [1, 5]        // 5 ⠑
    ]
  },
  6: {
    name: '1/6',
    cells: [
      [3, 4, 5, 6],
      [1],
      [3, 4],
      [1, 2, 4]     // 6 ⠋
    ]
  }
};

/**
 * Fusiona geometrías de BufferGeometry en una sola
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
 * Exporta un THREE.BufferGeometry a STL binario estándar
 */
export function exportBufferGeometryToBinaryStl(geometry: THREE.BufferGeometry): ArrayBuffer {
  const nonIndexed = geometry.index ? geometry.toNonIndexed() : geometry;
  const posAttr = nonIndexed.getAttribute('position');
  const normAttr = nonIndexed.getAttribute('normal');

  const triangleCount = (posAttr.count / 3) | 0;
  const bufferSize = 84 + triangleCount * 50;
  const buffer = new ArrayBuffer(bufferSize);
  const view = new DataView(buffer);

  const headerText = 'MakerBox - Fracciones Didacticas 3D / Laser UTalca';
  for (let i = 0; i < 80; i++) {
    view.setUint8(i, i < headerText.length ? headerText.charCodeAt(i) : 0);
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
 * Crea la geometría 3D del plato cilíndrico con alojamiento interior
 * - Diámetro exterior: 70 mm (radio 35 mm)
 * - Altura total: 5 mm
 * - Cavidad interior: diámetro 60 mm (radio 30 mm), profundidad 3 mm (piso en Z=2 mm)
 */
export function createTrayGeometry(config: FractionsConfig): THREE.BufferGeometry {
  const rOuter = config.trayOuterDiameterMm / 2; // 35 mm
  const rInner = config.trayInnerDiameterMm / 2; // 30 mm
  const hTotal = config.trayTotalHeightMm; // 5 mm
  const hFloor = config.trayFloorThicknessMm; // 2 mm
  const segments = 72; // Suavidad circular alta

  const positions: number[] = [];
  const normals: number[] = [];

  const addTri = (
    p1: [number, number, number],
    p2: [number, number, number],
    p3: [number, number, number]
  ) => {
    const ux = p2[0] - p1[0],
      uy = p2[1] - p1[1],
      uz = p2[2] - p1[2];
    const vx = p3[0] - p1[0],
      vy = p3[1] - p1[1],
      vz = p3[2] - p1[2];
    let nx = uy * vz - uz * vy;
    let ny = uz * vx - ux * vz;
    let nz = ux * vy - uy * vx;
    const len = Math.sqrt(nx * nx + ny * ny + nz * nz) || 1;
    nx /= len;
    ny /= len;
    nz /= len;

    positions.push(...p1, ...p2, ...p3);
    normals.push(nx, ny, nz, nx, ny, nz, nx, ny, nz);
  };

  // 1. Tapa inferior (Z = 0, hacia abajo)
  for (let i = 0; i < segments; i++) {
    const a1 = (i / segments) * Math.PI * 2;
    const a2 = ((i + 1) / segments) * Math.PI * 2;
    const x1 = Math.cos(a1) * rOuter;
    const y1 = Math.sin(a1) * rOuter;
    const x2 = Math.cos(a2) * rOuter;
    const y2 = Math.sin(a2) * rOuter;
    addTri([0, 0, 0], [x2, y2, 0], [x1, y1, 0]);
  }

  // 2. Pared cilíndrica exterior (de Z = 0 a Z = hTotal)
  for (let i = 0; i < segments; i++) {
    const a1 = (i / segments) * Math.PI * 2;
    const a2 = ((i + 1) / segments) * Math.PI * 2;
    const x1 = Math.cos(a1) * rOuter;
    const y1 = Math.sin(a1) * rOuter;
    const x2 = Math.cos(a2) * rOuter;
    const y2 = Math.sin(a2) * rOuter;

    // Cuadrilátero exterior
    addTri([x1, y1, 0], [x2, y2, 0], [x2, y2, hTotal]);
    addTri([x1, y1, 0], [x2, y2, hTotal], [x1, y1, hTotal]);
  }

  // 3. Borde superior anular (Z = hTotal, entre rInner y rOuter)
  for (let i = 0; i < segments; i++) {
    const a1 = (i / segments) * Math.PI * 2;
    const a2 = ((i + 1) / segments) * Math.PI * 2;
    const c1 = Math.cos(a1),
      s1 = Math.sin(a1);
    const c2 = Math.cos(a2),
      s2 = Math.sin(a2);

    const x1Out = c1 * rOuter,
      y1Out = s1 * rOuter;
    const x2Out = c2 * rOuter,
      y2Out = s2 * rOuter;
    const x1In = c1 * rInner,
      y1In = s1 * rInner;
    const x2In = c2 * rInner,
      y2In = s2 * rInner;

    addTri([x1In, y1In, hTotal], [x2In, y2In, hTotal], [x2Out, y2Out, hTotal]);
    addTri([x1In, y1In, hTotal], [x2Out, y2Out, hTotal], [x1Out, y1Out, hTotal]);
  }

  // 4. Pared interior cilíndrica del alojamiento (de Z = hTotal a Z = hFloor, normal hacia adentro)
  for (let i = 0; i < segments; i++) {
    const a1 = (i / segments) * Math.PI * 2;
    const a2 = ((i + 1) / segments) * Math.PI * 2;
    const x1 = Math.cos(a1) * rInner;
    const y1 = Math.sin(a1) * rInner;
    const x2 = Math.cos(a2) * rInner;
    const y2 = Math.sin(a2) * rInner;

    addTri([x1, y1, hTotal], [x2, y2, hTotal], [x2, y2, hFloor]);
    addTri([x1, y1, hTotal], [x2, y2, hFloor], [x1, y1, hFloor]);
  }

  // 5. Fondo interior del alojamiento (Z = hFloor, normal hacia arriba)
  for (let i = 0; i < segments; i++) {
    const a1 = (i / segments) * Math.PI * 2;
    const a2 = ((i + 1) / segments) * Math.PI * 2;
    const x1 = Math.cos(a1) * rInner;
    const y1 = Math.sin(a1) * rInner;
    const x2 = Math.cos(a2) * rInner;
    const y2 = Math.sin(a2) * rInner;
    addTri([0, 0, hFloor], [x1, y1, hFloor], [x2, y2, hFloor]);
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
  geo.computeVertexNormals();
  return geo;
}

/**
 * Construye el polígono 2D de un sector circular con tolerancia exacta
 * Bisectriz alineada en el eje +Y (ángulo = PI/2)
 */
function createSectorShape(
  denominator: number,
  rPocket: number,
  toleranceMm: number
): THREE.Shape {
  const theta = (Math.PI * 2) / denominator;
  const halfTheta = theta / 2;

  // Radio exterior efectivo con tolerancia radial
  const rEff = Math.max(5, rPocket - toleranceMm);

  // Retracción normal en cada cara radial
  const normalOffset = toleranceMm / 2;

  // Vértice central desplazado a lo largo de la bisectriz (+Y)
  // En coordenadas polares simétricas respecto al eje +Y (90°):
  const rApex = normalOffset / Math.sin(halfTheta);

  // Ángulo inicial y final respecto al eje X
  const alpha1 = Math.PI / 2 - halfTheta;
  const alpha2 = Math.PI / 2 + halfTheta;

  // Vectores unitarios de las caras radiales
  const u1x = Math.cos(alpha1);
  const u1y = Math.sin(alpha1);
  const u2x = Math.cos(alpha2);
  const u2y = Math.sin(alpha2);

  // Normales hacia el interior del sector
  // Para cara 1 (alpha1): rotación +90° = (-u1y, u1x)
  const n1x = -u1y;
  const n1y = u1x;
  // Para cara 2 (alpha2): rotación -90° = (u2y, -u2x)
  const n2x = u2y;
  const n2y = -u2x;

  // Vértice central interior (punta recortada con holgura)
  const apexX = 0;
  const apexY = rApex;

  // Esquina exterior 1: intersección de la recta radial retraída con el arco de radio rEff
  // Recta 1: p(t) = (0, rApex) + t * (u1x, u1y)
  // |p(t)|^2 = rEff^2
  // t^2 + 2*t*(rApex*u1y) + rApex^2 - rEff^2 = 0
  const b1 = 2 * rApex * u1y;
  const c1 = rApex * rApex - rEff * rEff;
  const disc1 = Math.sqrt(Math.max(0, b1 * b1 - 4 * c1));
  const t1 = (-b1 + disc1) / 2;
  const x1 = apexX + t1 * u1x;
  const y1 = apexY + t1 * u1y;

  // Esquina exterior 2 (simétrica respecto a X = 0)
  const x2 = -x1;
  const y2 = y1;

  const shape = new THREE.Shape();
  shape.moveTo(apexX, apexY);
  shape.lineTo(x1, y1);

  // Arco circular desde (x1, y1) hasta (x2, y2)
  const arcStartAngle = Math.atan2(y1, x1);
  const arcEndAngle = Math.atan2(y2, x2);
  const arcSegments = Math.max(16, Math.floor(48 / denominator));

  for (let s = 1; s <= arcSegments; s++) {
    const t = s / arcSegments;
    const ang = arcStartAngle + t * (arcEndAngle - arcStartAngle);
    shape.lineTo(Math.cos(ang) * rEff, Math.sin(ang) * rEff);
  }

  shape.lineTo(apexX, apexY);
  return shape;
}

/**
 * Crea semiesferas táctiles en sobrerrelieve para Braille (Ø 2 mm, Alt 1 mm)
 */
function createBrailleDome(
  cx: number,
  cy: number,
  radius: number,
  height: number,
  baseZ: number,
  radialSegs = 16,
  heightSegs = 6
): THREE.BufferGeometry {
  const positions: number[] = [];
  const normals: number[] = [];

  const addTri = (
    p1: [number, number, number],
    p2: [number, number, number],
    p3: [number, number, number]
  ) => {
    const ux = p2[0] - p1[0],
      uy = p2[1] - p1[1],
      uz = p2[2] - p1[2];
    const vx = p3[0] - p1[0],
      vy = p3[1] - p1[1],
      vz = p3[2] - p1[2];
    let nx = uy * vz - uz * vy;
    let ny = uz * vx - ux * vz;
    let nz = ux * vy - uy * vx;
    const len = Math.sqrt(nx * nx + ny * ny + nz * nz) || 1;
    positions.push(...p1, ...p2, ...p3);
    normals.push(nx / len, ny / len, nz / len, nx / len, ny / len, nz / len, nx / len, ny / len, nz / len);
  };

  for (let j = 0; j < heightSegs; j++) {
    const phi1 = (j / heightSegs) * (Math.PI / 2);
    const phi2 = ((j + 1) / heightSegs) * (Math.PI / 2);

    const r1 = radius * Math.cos(phi1);
    const z1 = baseZ + height * Math.sin(phi1);

    const r2 = radius * Math.cos(phi2);
    const z2 = baseZ + height * Math.sin(phi2);

    for (let i = 0; i < radialSegs; i++) {
      const theta1 = (i / radialSegs) * Math.PI * 2;
      const theta2 = ((i + 1) / radialSegs) * Math.PI * 2;

      const x1a = cx + r1 * Math.cos(theta1);
      const y1a = cy + r1 * Math.sin(theta1);
      const x2a = cx + r1 * Math.cos(theta2);
      const y2a = cy + r1 * Math.sin(theta2);

      const x1b = cx + r2 * Math.cos(theta1);
      const y1b = cy + r2 * Math.sin(theta1);
      const x2b = cx + r2 * Math.cos(theta2);
      const y2b = cy + r2 * Math.sin(theta2);

      if (j === heightSegs - 1) {
        addTri([x1a, y1a, z1], [x2a, y2a, z1], [cx, cy, baseZ + height]);
      } else {
        addTri([x1a, y1a, z1], [x2a, y2a, z1], [x2b, y2b, z2]);
        addTri([x1a, y1a, z1], [x2b, y2b, z2], [x1b, y1b, z2]);
      }
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
  geo.computeVertexNormals();
  return geo;
}

/**
 * Genera una sola pieza de fracción en 3D con marcado en bajo relieve o Braille
 * Bisectriz orientada en el eje +Y
 */
export function createSinglePieceGeometry(
  config: FractionsConfig,
  customDenominator?: FractionDenominator
): THREE.BufferGeometry {
  const den = customDenominator || config.denominator;
  const rPocket = config.trayInnerDiameterMm / 2; // 30 mm
  const pieceThick = config.pieceThicknessMm; // 3 mm
  const tol = config.toleranceMm; // 0.2 mm

  // 1. Forma base del sector 2D
  const sectorShape = createSectorShape(den, rPocket, tol);

  let finalPieceGeo: THREE.BufferGeometry;

  if (config.mode === 'numbers') {
    // =========================================================================
    // MODO NÚMEROS: BAJO RELIEVE (Deboss de 0.8 mm en Z = 2.2 a 3.0 mm)
    // =========================================================================
    const debossDepth = config.textDebossDepthMm; // 0.8 mm
    const floorThick = pieceThick - debossDepth; // 2.2 mm base sólida

    // 1.1 Piso sólido de la pieza (Z = 0 a 2.2 mm)
    const floorShape = createSectorShape(den, rPocket, tol);
    const floorGeo = new THREE.ExtrudeGeometry(floorShape, {
      depth: floorThick,
      bevelEnabled: false,
      curveSegments: 24
    });

    // 1.2 Capa superior con letras talladas como huecos (Z = 2.2 a 3.0 mm)
    const topSectorShape = createSectorShape(den, rPocket, tol);

    // Texto: "1/N"
    const textStr = `1/${den}`;
    // Tamaño de fuente ajustado según el ángulo disponible
    const fontSize = den <= 3 ? 7.2 : den === 4 ? 6.5 : 5.8;

    const shapes = helvetikerFont.generateShapes(textStr, fontSize);

    // Calcular centro del texto para posicionarlo a ~18 mm del centro en la bisectriz (+Y)
    const bbox = new THREE.Box2();
    shapes.forEach((s) => {
      s.getPoints(12).forEach((p) => bbox.expandByPoint(p));
    });
    const textWidth = bbox.max.x - bbox.min.x;
    const textHeight = bbox.max.y - bbox.min.y;

    // Posición del texto en el sector
    const targetY = rPocket * 0.60; // ~18 mm
    const textOffsetX = -bbox.min.x - textWidth / 2;
    const textOffsetY = targetY - bbox.min.y - textHeight / 2;

    const islandGeos: THREE.BufferGeometry[] = [];

    // Perforar contorno exterior de los números en la capa superior
    shapes.forEach((shape) => {
      const outerHole = new THREE.Path();
      const pts = shape.getPoints(16);
      pts.forEach((pt, i) => {
        const tx = pt.x + textOffsetX;
        const ty = pt.y + textOffsetY;
        if (i === 0) outerHole.moveTo(tx, ty);
        else outerHole.lineTo(tx, ty);
      });
      outerHole.closePath();
      topSectorShape.holes.push(outerHole);

      // Islas interiores (counters de letras como '4', '6')
      if (shape.holes && shape.holes.length > 0) {
        shape.holes.forEach((innerHole) => {
          const islandShape = new THREE.Shape();
          const innerPts = innerHole.getPoints(16);
          innerPts.forEach((ipt, i) => {
            const tx = ipt.x + textOffsetX;
            const ty = ipt.y + textOffsetY;
            if (i === 0) islandShape.moveTo(tx, ty);
            else islandShape.lineTo(tx, ty);
          });
          islandShape.closePath();
          const islandGeo = new THREE.ExtrudeGeometry(islandShape, {
            depth: debossDepth,
            bevelEnabled: false,
            curveSegments: 16
          });
          islandGeo.translate(0, 0, floorThick);
          islandGeos.push(islandGeo);
        });
      }
    });

    const topGeo = new THREE.ExtrudeGeometry(topSectorShape, {
      depth: debossDepth,
      bevelEnabled: false,
      curveSegments: 24
    });
    topGeo.translate(0, 0, floorThick);

    finalPieceGeo = mergeBufferGeometries([floorGeo, topGeo, ...islandGeos]);
  } else {
    // =========================================================================
    // MODO BRAILLE: SOBRE RELIEVE (Puntos Ø 2 mm, Altura 1 mm en Z = 3.0 a 4.0 mm)
    // =========================================================================
    const baseGeo = new THREE.ExtrudeGeometry(sectorShape, {
      depth: pieceThick, // 3 mm
      bevelEnabled: false,
      curveSegments: 24
    });

    // Puntos Braille táctiles
    const brailleInfo = FRACTION_BRAILLE_CELLS[den];
    const cells = brailleInfo.cells;

    // Disposición táctil centrada en la bisectriz (+Y)
    // En cada celda Braille:
    // Puntos 1, 2, 3 en columna izquierda (dx = -1.1 mm)
    // Puntos 4, 5, 6 en columna derecha (dx = +1.1 mm)
    // Separación vertical entre puntos: 2.2 mm
    const dotSpacing = 2.2;
    const colSpacing = 2.3;
    const cellSpacing = 5.2;

    const dotRadius = config.dotDiameterMm / 2; // 1.0 mm (diámetro 2 mm)
    const dotHeight = config.dotHeightMm; // 1.0 mm altura

    const dotGeos: THREE.BufferGeometry[] = [];

    // Dependiendo del denominador, centramos horizontalmente las celdas
    const totalBrailleWidth = (cells.length - 1) * cellSpacing + colSpacing;
    const startX = -totalBrailleWidth / 2;
    const centerY = rPocket * 0.58; // ~17.4 mm de distancia radial

    cells.forEach((cellDots, cellIdx) => {
      const cellCenterX = startX + cellIdx * cellSpacing + colSpacing / 2;

      const dotCoords: Record<number, [number, number]> = {
        1: [cellCenterX - colSpacing / 2, centerY + dotSpacing],
        2: [cellCenterX - colSpacing / 2, centerY],
        3: [cellCenterX - colSpacing / 2, centerY - dotSpacing],
        4: [cellCenterX + colSpacing / 2, centerY + dotSpacing],
        5: [cellCenterX + colSpacing / 2, centerY],
        6: [cellCenterX + colSpacing / 2, centerY - dotSpacing]
      };

      cellDots.forEach((d) => {
        const coord = dotCoords[d];
        if (coord) {
          const dome = createBrailleDome(
            coord[0],
            coord[1],
            dotRadius,
            dotHeight,
            pieceThick,
            16,
            6
          );
          dotGeos.push(dome);
        }
      });
    });

    finalPieceGeo = mergeBufferGeometries([baseGeo, ...dotGeos]);
  }

  finalPieceGeo.computeVertexNormals();
  return finalPieceGeo;
}

/**
 * Genera el set completo de piezas rotadas para encajar en el plato
 * Con soporte para distancia de explosión (para verlas desarmadas o armadas)
 */
export function createAssembledPiecesGeometry(
  config: FractionsConfig,
  explodeDistanceMm = 0
): THREE.BufferGeometry {
  const den = config.denominator;
  const singleGeo = createSinglePieceGeometry(config);

  const angleStep = (Math.PI * 2) / den;
  const pieceGeos: THREE.BufferGeometry[] = [];

  for (let i = 0; i < den; i++) {
    const geo = singleGeo.clone();

    // Rotación del sector alrededor del centro Z
    // Como el sector fue diseñado con la bisectriz en +Y (90° = PI/2),
    // para colocar la primera pieza orientada arriba o en ángulo i:
    const rotZ = i * angleStep;

    // Desplazamiento de explosión radial a lo largo de la bisectriz original (+Y)
    if (explodeDistanceMm > 0) {
      geo.translate(0, explodeDistanceMm, 0);
    }

    geo.rotateZ(rotZ);
    // Colocar las piezas sobre el fondo del plato (Z = trayFloorThicknessMm = 2 mm)
    geo.translate(0, 0, config.trayFloorThicknessMm);
    pieceGeos.push(geo);
  }

  return mergeBufferGeometries(pieceGeos);
}

/**
 * Genera una disposición optimizada de impresión 3D (Bandeja / Plato + Piezas lado a lado)
 */
export function createPrintBedLayoutGeometry(config: FractionsConfig): THREE.BufferGeometry {
  const tray = createTrayGeometry(config);
  const single = createSinglePieceGeometry(config);

  // Plato a la izquierda (X = -45 mm)
  tray.translate(-45, 0, 0);

  // Piezas organizadas en círculo o matriz a la derecha (X = +45 mm)
  const angleStep = (Math.PI * 2) / config.denominator;
  const pieceGeos: THREE.BufferGeometry[] = [];

  for (let i = 0; i < config.denominator; i++) {
    const p = single.clone();
    p.rotateZ(i * angleStep);
    // Desplazamiento a la derecha sobre la cama de impresión Z = 0
    p.translate(45, 0, 0);
    pieceGeos.push(p);
  }

  return mergeBufferGeometries([tray, ...pieceGeos]);
}

/**
 * Genera el archivo vectorial SVG exacto para Corte y Grabado Láser (LightBurn / RDWorks)
 * Incluye:
 * 1. Plato Capa 1: Base sólida 70 mm (Corte Rojo)
 * 2. Plato Capa 2: Aro perimetral 70 mm ext, 60 mm int (Corte Rojo)
 * 3. Piezas de fracciones (Corte Rojo perimetral + Grabado Negro de la fracción)
 */
export function generateFractionsLaserSvg(config: FractionsConfig): string {
  const den = config.denominator;
  const rOuter = config.trayOuterDiameterMm / 2; // 35 mm
  const rPocket = config.trayInnerDiameterMm / 2; // 30 mm
  const tol = config.toleranceMm; // 0.2 mm
  const rEff = rPocket - tol; // 29.8 mm

  const svgWidth = 220;
  const svgHeight = 160;

  // Centro Plato Base Capa 1
  const cx1 = 45;
  const cy1 = 45;

  // Centro Plato Aro Capa 2
  const cx2 = 125;
  const cy2 = 45;

  // Piezas de Fracción distribuidas abajo
  const angleStep = (Math.PI * 2) / den;
  const halfTheta = angleStep / 2;
  const normalOffset = tol / 2;
  const rApex = normalOffset / Math.sin(halfTheta);

  // Generar contorno SVG de 1 pieza
  const alpha1 = Math.PI / 2 - halfTheta;
  const alpha2 = Math.PI / 2 + halfTheta;
  const u1x = Math.cos(alpha1);
  const u1y = Math.sin(alpha1);
  const b1 = 2 * rApex * u1y;
  const c1 = rApex * rApex - rEff * rEff;
  const t1 = (-b1 + Math.sqrt(Math.max(0, b1 * b1 - 4 * c1))) / 2;
  const p1x = t1 * u1x;
  const p1y = rApex + t1 * u1y;
  const p2x = -p1x;
  const p2y = p1y;

  // Construir elementos SVG de las piezas
  let piecesSvg = '';
  const pieceSpacing = 38;
  const piecesStartX = Math.max(25, 110 - ((den - 1) * pieceSpacing) / 2);
  const piecesY = 115;

  for (let i = 0; i < den; i++) {
    const px = piecesStartX + i * pieceSpacing;
    const py = piecesY;

    // Arco exterior SVG: de (p1x, p1y) a (p2x, p2y)
    // El flag large-arc es 1 si theta > PI
    const largeArcFlag = angleStep > Math.PI ? 1 : 0;

    const pathData = `M ${px + 0} ${py - rApex} L ${px + p1x} ${py - p1y} A ${rEff} ${rEff} 0 ${largeArcFlag} 0 ${px + p2x} ${py - p2y} Z`;

    // Marcado de texto o braille en el centro de la pieza
    let markingSvg = '';
    const markY = py - rPocket * 0.60;

    if (config.mode === 'numbers') {
      markingSvg = `
      <!-- Grabado Láser Negro: Fracción 1/${den} -->
      <text x="${px}" y="${markY}" font-family="Arial, Helvetica, sans-serif" font-weight="900" font-size="6.5" fill="#000000" text-anchor="middle" dominant-baseline="central">1/${den}</text>`;
    } else {
      // Marcado Braille para taladrar / incrustar balines o punteado
      const brailleInfo = FRACTION_BRAILLE_CELLS[den];
      const cells = brailleInfo.cells;
      const colSpacing = 2.2;
      const dotSpacing = 2.2;
      const cellSpacing = 4.8;
      const totalW = (cells.length - 1) * cellSpacing + colSpacing;
      const bStartX = px - totalW / 2;

      let dotsSvg = '';
      cells.forEach((cellDots, cIdx) => {
        const cX = bStartX + cIdx * cellSpacing + colSpacing / 2;
        const coords: Record<number, [number, number]> = {
          1: [cX - colSpacing / 2, markY - dotSpacing],
          2: [cX - colSpacing / 2, markY],
          3: [cX - colSpacing / 2, markY + dotSpacing],
          4: [cX + colSpacing / 2, markY - dotSpacing],
          5: [cX + colSpacing / 2, markY],
          6: [cX + colSpacing / 2, markY + dotSpacing]
        };
        cellDots.forEach((d) => {
          const pt = coords[d];
          if (pt) {
            dotsSvg += `<circle cx="${pt[0].toFixed(2)}" cy="${pt[1].toFixed(2)}" r="1.0" fill="#000000" stroke="none" />`;
          }
        });
      });

      markingSvg = `
      <!-- Marcado Puntos Braille Ø 2mm -->
      <g id="PUNTOS_BRAILLE_${i + 1}">${dotsSvg}</g>`;
    }

    piecesSvg += `
    <!-- Pieza de Fracción ${i + 1}/${den} -->
    <path d="${pathData}" fill="none" stroke="#FF0000" stroke-width="0.2" />
    ${markingSvg}`;
  }

  return `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<svg
  xmlns="http://www.w3.org/2000/svg"
  width="${svgWidth}mm"
  height="${svgHeight}mm"
  viewBox="0 0 ${svgWidth} ${svgHeight}"
  version="1.1">
  <title>MakerBox - Fracciones Didácticas 1/${den} para LightBurn</title>
  <desc>Corte Láser Rojo (#FF0000, 0.2mm). Grabado Láser Negro (#000000). Plato D=70mm, Cavidad D=60mm, Tolerancia=${tol}mm.</desc>

  <!-- ========================================== -->
  <!-- CAPA 1: PLATO - BASE SÓLIDA 70 mm (Corte Rojo) -->
  <!-- ========================================== -->
  <g id="PLATO_BASE_CAPA1">
    <circle cx="${cx1}" cy="${cy1}" r="${rOuter}" fill="none" stroke="#FF0000" stroke-width="0.2" />
    <text x="${cx1}" y="${cy1}" font-family="Arial, sans-serif" font-size="3" fill="#000000" text-anchor="middle" dominant-baseline="central">Plato Base (2mm)</text>
  </g>

  <!-- ========================================== -->
  <!-- CAPA 2: PLATO - ARO PERIMETRAL 70/60 mm (Corte Rojo) -->
  <!-- ========================================== -->
  <g id="PLATO_ARO_CAPA2">
    <!-- Diámetro exterior 70 mm -->
    <circle cx="${cx2}" cy="${cy2}" r="${rOuter}" fill="none" stroke="#FF0000" stroke-width="0.2" />
    <!-- Diámetro interior 60 mm (Cavidad) -->
    <circle cx="${cx2}" cy="${cy2}" r="${rPocket}" fill="none" stroke="#FF0000" stroke-width="0.2" />
    <text x="${cx2}" y="${cy2}" font-family="Arial, sans-serif" font-size="3" fill="#000000" text-anchor="middle" dominant-baseline="central">Aro Cavidad (3mm)</text>
  </g>

  <!-- ========================================== -->
  <!-- CAPA 3: PIEZAS DE FRACCIONES 1/${den} (Corte Rojo + Grabado) -->
  <!-- ========================================== -->
  <g id="PIEZAS_FRACCIONES_1_${den}">
    ${piecesSvg}
  </g>
</svg>`;
}

/**
 * Función principal que calcula todos los modelos 3D, exportaciones STL y archivos SVG
 */
export function generateFractions(config: FractionsConfig = DEFAULT_FRACTIONS_CONFIG): FractionsModelResult {
  const trayGeometry = createTrayGeometry(config);
  const singlePieceGeometry = createSinglePieceGeometry(config);
  const piecesGeometry = createAssembledPiecesGeometry(config, config.explodeDistanceMm);
  const printLayoutGeometry = createPrintBedLayoutGeometry(config);

  // Exportaciones STL binarias
  const trayStlBuffer = exportBufferGeometryToBinaryStl(trayGeometry);
  const singlePieceStlBuffer = exportBufferGeometryToBinaryStl(singlePieceGeometry);
  const piecesStlBuffer = exportBufferGeometryToBinaryStl(
    createAssembledPiecesGeometry(config, 0)
  );
  const fullSetStlBuffer = exportBufferGeometryToBinaryStl(printLayoutGeometry);

  // SVG para corte láser
  const laserSvgContent = generateFractionsLaserSvg(config);

  // Crear archivo ZIP completo con todos los elementos
  const zipFiles: Record<string, Uint8Array> = {
    [`1_Plato_Base_D70mm.stl`]: new Uint8Array(trayStlBuffer),
    [`2_Set_Completo_Fracciones_1_${config.denominator}_(x${config.denominator}).stl`]: new Uint8Array(piecesStlBuffer),
    [`3_Pieza_Individual_Fraccion_1_${config.denominator}.stl`]: new Uint8Array(singlePieceStlBuffer),
    [`4_Bandeja_Impresion_Completa_Plato_y_Piezas.stl`]: new Uint8Array(fullSetStlBuffer),
    [`5_Corte_Laser_Plato_y_Fracciones_1_${config.denominator}.svg`]: strToU8(laserSvgContent)
  };
  const zipBuffer = zipSync(zipFiles);

  // Métricas para estimación
  const totalTriangles = (printLayoutGeometry.getAttribute('position').count / 3) | 0;
  // Volumen aproximado en cm3 (plato ~12 cm3 + piezas ~8 cm3)
  const estimatedVolumeCm3 = 19.5;
  const estimatedWeightGrams = Math.round(estimatedVolumeCm3 * 1.24); // ~24 gramos de PLA
  const estimatedPrintTimeMinutes = Math.round(estimatedWeightGrams * 2.8); // ~65 minutos a 50mm/s

  return {
    config,
    trayGeometry,
    piecesGeometry,
    singlePieceGeometry,
    printLayoutGeometry,
    trayStlBuffer,
    piecesStlBuffer,
    singlePieceStlBuffer,
    fullSetStlBuffer,
    laserSvgContent,
    zipBuffer,
    triangleCount: totalTriangles,
    estimatedWeightGrams,
    estimatedPrintTimeMinutes,
    anglePerPieceDeg: Math.round(360 / config.denominator),
    toleranceAppliedMm: config.toleranceMm
  };
}

/**
 * Descargador genérico para STL
 */
export function downloadFractionsStl(buffer: ArrayBuffer, filename: string) {
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

/**
 * Descargador genérico para SVG
 */
export function downloadFractionsSvg(content: string, filename: string) {
  const blob = new Blob([content], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename.endsWith('.svg') ? filename : `${filename}.svg`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Descargador genérico para ZIP
 */
export function downloadFractionsZip(buffer: Uint8Array, filename: string) {
  const blob = new Blob([buffer as any], { type: 'application/zip' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename.endsWith('.zip') ? filename : `${filename}.zip`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
