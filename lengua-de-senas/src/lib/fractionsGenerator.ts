import * as THREE from 'three';
import { Font } from 'three/examples/jsm/loaders/FontLoader.js';
import { HELVETIKER_BOLD } from './helvetikerBold';
import { zipSync, strToU8 } from 'fflate';

// Fuente para grabado de números en bajo relieve
const helvetikerFont = new Font(HELVETIKER_BOLD);

export type FractionDenominator = 2 | 3 | 4 | 5 | 6;
export type MarkingMode = 'numbers' | 'braille';
export type MaterialStyle = 'mdf' | 'pla_white' | 'pla_color';

export interface FractionsConfig {
  denominator: FractionDenominator; // 2, 3, 4, 5, 6
  mode: MarkingMode; // 'numbers' (bajo relieve) o 'braille' (sobre relieve)
  materialStyle: MaterialStyle; // 'mdf' (MDF 3mm corte láser) o 'pla_white' / 'pla_color'
  trayOuterDiameterMm: number; // 70 mm
  trayInnerDiameterMm: number; // 60 mm
  trayTotalHeightMm: number; // 6 mm (MDF: 3mm base + 3mm aro) o 5 mm (PLA)
  trayPocketDepthMm: number; // 3 mm
  trayFloorThicknessMm: number; // 3 mm (MDF) o 2 mm (PLA)
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
  materialStyle: 'mdf', // MDF 3mm por defecto
  trayOuterDiameterMm: 70,
  trayInnerDiameterMm: 60,
  trayTotalHeightMm: 6, // 6 mm para MDF (3mm base + 3mm anillo)
  trayPocketDepthMm: 3,
  trayFloorThicknessMm: 3, // 3 mm base en MDF
  pieceThicknessMm: 3,
  toleranceMm: 0.2, // 0.2 mm de tolerancia calibrada
  textDebossDepthMm: 0.8,
  dotDiameterMm: 2.0, // 2 mm diámetro solicitado
  dotHeightMm: 1.0, // 1 mm altura solicitada
  trayColor: '#deb887',
  pieceColor: '#e8c49a',
  markingColor: '#2b1408',
  explodeDistanceMm: 0
};

export interface FractionsModelResult {
  config: FractionsConfig;
  trayGeometry: THREE.BufferGeometry;
  piecesGeometry: THREE.BufferGeometry; // Todas las piezas ensambladas / explosionadas
  markingsGeometry: THREE.BufferGeometry | null; // Números grabados o puntos braille
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
    if (!geo) continue;
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
 * - 100% cerrada y hermética usando ExtrudeGeometry con contorno y hueco
 * - Diámetro exterior: 70 mm (radio 35 mm)
 * - Cavidad interior: diámetro 60 mm (radio 30 mm), profundidad 3 mm
 * - Altura total: 6 mm para MDF (3 mm base + 3 mm anillo) o 5 mm para PLA
 */
export function createTrayGeometry(config: FractionsConfig): THREE.BufferGeometry {
  const rOuter = config.trayOuterDiameterMm / 2; // 35 mm
  const rInner = config.trayInnerDiameterMm / 2; // 30 mm
  const hFloor = config.trayFloorThicknessMm; // 3 mm (MDF) o 2 mm (PLA)
  const hTotal = config.trayTotalHeightMm; // 6 mm (MDF) o 5 mm (PLA)
  const ringDepth = Math.max(1, hTotal - hFloor); // 3 mm

  // 1. Base sólida cilíndrica del fondo (Z = 0 a hFloor)
  const floorShape = new THREE.Shape();
  floorShape.absarc(0, 0, rOuter, 0, Math.PI * 2, false);
  const floorGeo = new THREE.ExtrudeGeometry(floorShape, {
    depth: hFloor,
    bevelEnabled: false,
    curveSegments: 72
  });

  // 2. Anillo perimetral superior (Z = hFloor a hTotal)
  const ringShape = new THREE.Shape();
  ringShape.absarc(0, 0, rOuter, 0, Math.PI * 2, false);
  const holePath = new THREE.Path();
  holePath.absarc(0, 0, rInner, 0, Math.PI * 2, true); // Sentido horario para corte interior
  ringShape.holes.push(holePath);

  const ringGeo = new THREE.ExtrudeGeometry(ringShape, {
    depth: ringDepth,
    bevelEnabled: false,
    curveSegments: 72
  });
  ringGeo.translate(0, 0, hFloor);

  // Fusión perfecta: cuerpo 100% sólido sin bordes abiertos ni normales invertidas
  const trayGeo = mergeBufferGeometries([floorGeo, ringGeo]);
  trayGeo.computeVertexNormals();
  return trayGeo;
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
  const rApex = normalOffset / Math.sin(halfTheta);

  // Ángulo inicial y final respecto al eje X
  const alpha1 = Math.PI / 2 - halfTheta;
  const alpha2 = Math.PI / 2 + halfTheta;

  const u1x = Math.cos(alpha1);
  const u1y = Math.sin(alpha1);

  // Vértice central interior (punta recortada con holgura)
  const apexX = 0;
  const apexY = rApex;

  // Esquina exterior 1
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
  const arcSegments = Math.max(20, Math.floor(64 / denominator));

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
 * Retorna tanto la pieza física completa como la geometría separada de los grabados/puntos
 */
export function createSinglePieceWithMarkings(
  config: FractionsConfig,
  customDenominator?: FractionDenominator
): { pieceGeo: THREE.BufferGeometry; markingsGeo: THREE.BufferGeometry | null } {
  const den = customDenominator || config.denominator;
  const rPocket = config.trayInnerDiameterMm / 2; // 30 mm
  const pieceThick = config.pieceThicknessMm; // 3 mm
  const tol = config.toleranceMm; // 0.2 mm

  // 1. Forma base del sector 2D
  const sectorShape = createSectorShape(den, rPocket, tol);

  let finalPieceGeo: THREE.BufferGeometry;
  let markingsGeo: THREE.BufferGeometry | null = null;

  if (config.materialStyle === 'mdf') {
    // =========================================================================
    // MODO MADERA MDF (Corte y Grabado Láser):
    // - Pieza de corte sólido plano de 3 mm (sin cavidades profundas ni domos)
    // - Números y Braille son quemaduras láser oscuras PLANAS al ras de la madera
    // =========================================================================
    const baseGeo = new THREE.ExtrudeGeometry(sectorShape, {
      depth: pieceThick, // 3 mm sólido
      bevelEnabled: false,
      curveSegments: 24
    });

    if (config.mode === 'numbers') {
      const textStr = `1/${den}`;
      const fontSize = den <= 3 ? 7.2 : den === 4 ? 6.5 : 5.8;
      const shapes = helvetikerFont.generateShapes(textStr, fontSize);

      const bbox = new THREE.Box2();
      shapes.forEach((s) => {
        s.getPoints(12).forEach((p) => bbox.expandByPoint(p));
      });
      const textWidth = bbox.max.x - bbox.min.x;
      const textHeight = bbox.max.y - bbox.min.y;

      const targetY = rPocket * 0.60; // ~18 mm
      const textOffsetX = -bbox.min.x - textWidth / 2;
      const textOffsetY = targetY - bbox.min.y - textHeight / 2;

      const textGeos: THREE.BufferGeometry[] = [];
      shapes.forEach((shape) => {
        // Texto plano quemado láser (al ras de la superficie de madera)
        const tGeo = new THREE.ExtrudeGeometry(shape, {
          depth: 0.05,
          bevelEnabled: false,
          curveSegments: 16
        });
        tGeo.translate(textOffsetX, textOffsetY, pieceThick + 0.02);
        textGeos.push(tGeo);
      });
      markingsGeo = mergeBufferGeometries(textGeos);
    } else {
      // Braille en MDF: discos circulares planos quemados por láser (NO domos esféricos)
      const brailleInfo = FRACTION_BRAILLE_CELLS[den];
      const cells = brailleInfo.cells;

      const dotSpacing = 2.2;
      const colSpacing = 2.3;
      const cellSpacing = 5.2;
      const dotRadius = config.dotDiameterMm / 2; // 1.0 mm

      const dotGeos: THREE.BufferGeometry[] = [];
      const totalBrailleWidth = (cells.length - 1) * cellSpacing + colSpacing;
      const startX = -totalBrailleWidth / 2;
      const centerY = rPocket * 0.58; // ~17.4 mm

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
            // Disco plano circular quemado por láser (al ras de la superficie Z = pieceThick)
            const diskShape = new THREE.Shape();
            diskShape.absarc(coord[0], coord[1], dotRadius, 0, Math.PI * 2, false);
            const diskGeo = new THREE.ExtrudeGeometry(diskShape, {
              depth: 0.05,
              bevelEnabled: false,
              curveSegments: 20
            });
            diskGeo.translate(0, 0, pieceThick + 0.02);
            dotGeos.push(diskGeo);
          }
        });
      });

      markingsGeo = mergeBufferGeometries(dotGeos);
    }

    finalPieceGeo = baseGeo;
  } else if (config.mode === 'numbers') {
    // =========================================================================
    // MODO PLA NÚMEROS: BAJO RELIEVE (Deboss de 0.8 mm en Z = 2.2 a 3.0 mm)
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

    const textStr = `1/${den}`;
    const fontSize = den <= 3 ? 7.2 : den === 4 ? 6.5 : 5.8;
    const shapes = helvetikerFont.generateShapes(textStr, fontSize);

    const bbox = new THREE.Box2();
    shapes.forEach((s) => {
      s.getPoints(12).forEach((p) => bbox.expandByPoint(p));
    });
    const textWidth = bbox.max.x - bbox.min.x;
    const textHeight = bbox.max.y - bbox.min.y;

    const targetY = rPocket * 0.60; // ~18 mm
    const textOffsetX = -bbox.min.x - textWidth / 2;
    const textOffsetY = targetY - bbox.min.y - textHeight / 2;

    const islandGeos: THREE.BufferGeometry[] = [];
    const textCavityFloorGeos: THREE.BufferGeometry[] = [];

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

      // Inlay grabado visual (piso de cavidad oscuro para el visor)
      const letterShape = new THREE.Shape();
      pts.forEach((pt, i) => {
        const tx = pt.x + textOffsetX;
        const ty = pt.y + textOffsetY;
        if (i === 0) letterShape.moveTo(tx, ty);
        else letterShape.lineTo(tx, ty);
      });
      letterShape.closePath();

      // Islas interiores
      if (shape.holes && shape.holes.length > 0) {
        shape.holes.forEach((innerHole) => {
          const innerPath = new THREE.Path();
          const innerPts = innerHole.getPoints(16);
          innerPts.forEach((ipt, i) => {
            const tx = ipt.x + textOffsetX;
            const ty = ipt.y + textOffsetY;
            if (i === 0) innerPath.moveTo(tx, ty);
            else innerPath.lineTo(tx, ty);
          });
          innerPath.closePath();
          letterShape.holes.push(innerPath);

          // Isla interior sólida para la pieza base
          const islandShape = new THREE.Shape();
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

      // Geometría fina en el fondo del bajo relieve
      const cavityFloor = new THREE.ExtrudeGeometry(letterShape, {
        depth: 0.15,
        bevelEnabled: false,
        curveSegments: 16
      });
      cavityFloor.translate(0, 0, floorThick);
      textCavityFloorGeos.push(cavityFloor);
    });

    const topGeo = new THREE.ExtrudeGeometry(topSectorShape, {
      depth: debossDepth,
      bevelEnabled: false,
      curveSegments: 24
    });
    topGeo.translate(0, 0, floorThick);

    finalPieceGeo = mergeBufferGeometries([floorGeo, topGeo, ...islandGeos]);
    markingsGeo = mergeBufferGeometries(textCavityFloorGeos);
  } else {
    // =========================================================================
    // MODO PLA BRAILLE: SOBRE RELIEVE (Puntos Ø 2 mm, Altura 1 mm en Z = 3.0 a 4.0 mm)
    // =========================================================================
    const baseGeo = new THREE.ExtrudeGeometry(sectorShape, {
      depth: pieceThick, // 3 mm
      bevelEnabled: false,
      curveSegments: 24
    });

    const brailleInfo = FRACTION_BRAILLE_CELLS[den];
    const cells = brailleInfo.cells;

    const dotSpacing = 2.2;
    const colSpacing = 2.3;
    const cellSpacing = 5.2;

    const dotRadius = config.dotDiameterMm / 2; // 1.0 mm (diámetro 2 mm)
    const dotHeight = config.dotHeightMm; // 1.0 mm altura

    const dotGeos: THREE.BufferGeometry[] = [];

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

    markingsGeo = mergeBufferGeometries(dotGeos);
    finalPieceGeo = mergeBufferGeometries([baseGeo, ...dotGeos]);
  }

  finalPieceGeo.computeVertexNormals();
  if (markingsGeo) markingsGeo.computeVertexNormals();
  return { pieceGeo: finalPieceGeo, markingsGeo };
}

export function createSinglePieceGeometry(
  config: FractionsConfig,
  customDenominator?: FractionDenominator
): THREE.BufferGeometry {
  const { pieceGeo } = createSinglePieceWithMarkings(config, customDenominator);
  return pieceGeo;
}

/**
 * Genera el set completo de piezas rotadas para encajar en el plato
 * Con soporte para apertura en diagonal hacia arriba (se levantan y se abren las piezas)
 */
export function createAssembledPiecesGeometry(
  config: FractionsConfig,
  explodeDistanceMm = 0
): { piecesGeo: THREE.BufferGeometry; markingsGeo: THREE.BufferGeometry | null } {
  const den = config.denominator;
  const { pieceGeo, markingsGeo: singleMarkingGeo } = createSinglePieceWithMarkings(config);

  const angleStep = (Math.PI * 2) / den;
  const pieceGeos: THREE.BufferGeometry[] = [];
  const markingGeos: THREE.BufferGeometry[] = [];

  // Apertura en diagonal hacia arriba:
  // - Desplazamiento radial en el plano XY = explodeDistanceMm
  // - Elevación vertical en el eje Z = explodeDistanceMm * 0.85
  const zLift = explodeDistanceMm * 0.85;

  for (let i = 0; i < den; i++) {
    const pGeo = pieceGeo.clone();
    const rotZ = i * angleStep;

    if (explodeDistanceMm > 0) {
      pGeo.translate(0, explodeDistanceMm, zLift);
    }
    pGeo.rotateZ(rotZ);
    pGeo.translate(0, 0, config.trayFloorThicknessMm);
    pieceGeos.push(pGeo);

    if (singleMarkingGeo) {
      const mGeo = singleMarkingGeo.clone();
      if (explodeDistanceMm > 0) {
        mGeo.translate(0, explodeDistanceMm, zLift);
      }
      mGeo.rotateZ(rotZ);
      mGeo.translate(0, 0, config.trayFloorThicknessMm);
      markingGeos.push(mGeo);
    }
  }

  return {
    piecesGeo: mergeBufferGeometries(pieceGeos),
    markingsGeo: markingGeos.length > 0 ? mergeBufferGeometries(markingGeos) : null
  };
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
    p.translate(45, 0, 0);
    pieceGeos.push(p);
  }

  return mergeBufferGeometries([tray, ...pieceGeos]);
}

/**
 * Genera el archivo vectorial SVG exacto para Corte y Grabado Láser en MDF 3 mm (LightBurn / RDWorks)
 * Incluye:
 * 1. Plato Capa 1: Base sólida 70 mm (Corte Rojo MDF 3 mm)
 * 2. Plato Capa 2: Aro perimetral 70 mm ext, 60 mm int (Corte Rojo MDF 3 mm)
 * 3. Piezas de fracciones (Corte Rojo MDF 3 mm perimetral + Grabado Negro de la fracción)
 */
export function generateFractionsLaserSvg(config: FractionsConfig): string {
  const den = config.denominator;
  const rOuter = config.trayOuterDiameterMm / 2; // 35 mm
  const rPocket = config.trayInnerDiameterMm / 2; // 30 mm
  const tol = config.toleranceMm; // 0.2 mm
  const rEff = rPocket - tol; // 29.8 mm

  const svgWidth = 230;
  const svgHeight = 170;

  // Centro Plato Base Capa 1
  const cx1 = 48;
  const cy1 = 48;

  // Centro Plato Aro Capa 2
  const cx2 = 135;
  const cy2 = 48;

  const angleStep = (Math.PI * 2) / den;
  const halfTheta = angleStep / 2;
  const normalOffset = tol / 2;
  const rApex = normalOffset / Math.sin(halfTheta);

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

  let piecesSvg = '';
  const pieceSpacing = 36;
  const piecesStartX = Math.max(22, 115 - ((den - 1) * pieceSpacing) / 2);
  const piecesY = 125;

  for (let i = 0; i < den; i++) {
    const px = piecesStartX + i * pieceSpacing;
    const py = piecesY;

    const largeArcFlag = angleStep > Math.PI ? 1 : 0;
    const pathData = `M ${px + 0} ${py - rApex} L ${px + p1x} ${py - p1y} A ${rEff} ${rEff} 0 ${largeArcFlag} 0 ${px + p2x} ${py - p2y} Z`;

    let markingSvg = '';
    const markY = py - rPocket * 0.60;

    if (config.mode === 'numbers') {
      markingSvg = `
      <!-- Grabado Láser Negro Quemado: Fracción 1/${den} -->
      <text x="${px}" y="${markY}" font-family="Arial, Helvetica, sans-serif" font-weight="900" font-size="6.5" fill="#000000" text-anchor="middle" dominant-baseline="central">1/${den}</text>`;
    } else {
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
      <!-- Puntos Braille Ø 2mm para Grabado Quemado Láser -->
      <g id="PUNTOS_BRAILLE_${i + 1}">${dotsSvg}</g>`;
    }

    piecesSvg += `
    <!-- Ficha de Fracción ${i + 1}/${den} (MDF 3 mm) -->
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
  <title>MakerBox - Fracciones Didácticas 1/${den} en MDF 3 mm para LightBurn</title>
  <desc>Material: Placa MDF 3 mm. Espesor total disco ensamblado = 6 mm. Tolerancia = ${tol} mm. Línea Roja (#FF0000, 0.2mm) = CORTE. Negro (#000000) = GRABADO.</desc>

  <!-- ========================================== -->
  <!-- CAPA 1: PLATO BASE MDF 3 mm (Corte Rojo)   -->
  <!-- ========================================== -->
  <g id="PLATO_BASE_MDF_3MM">
    <circle cx="${cx1}" cy="${cy1}" r="${rOuter}" fill="none" stroke="#FF0000" stroke-width="0.2" />
    <text x="${cx1}" y="${cy1 - 2}" font-family="Arial, sans-serif" font-weight="bold" font-size="3.2" fill="#000000" text-anchor="middle">Plato Base</text>
    <text x="${cx1}" y="${cy1 + 2.5}" font-family="Arial, sans-serif" font-size="2.2" fill="#000000" text-anchor="middle">MDF 3 mm (Ø 70 mm)</text>
  </g>

  <!-- ========================================== -->
  <!-- CAPA 2: ARO CAVIDAD MDF 3 mm (Corte Rojo)  -->
  <!-- ========================================== -->
  <g id="PLATO_ARO_MDF_3MM">
    <!-- Diámetro exterior 70 mm -->
    <circle cx="${cx2}" cy="${cy2}" r="${rOuter}" fill="none" stroke="#FF0000" stroke-width="0.2" />
    <!-- Diámetro interior 60 mm (Cavidad) -->
    <circle cx="${cx2}" cy="${cy2}" r="${rPocket}" fill="none" stroke="#FF0000" stroke-width="0.2" />
    <text x="${cx2}" y="${cy2 - 2}" font-family="Arial, sans-serif" font-weight="bold" font-size="3.2" fill="#000000" text-anchor="middle">Aro Cavidad</text>
    <text x="${cx2}" y="${cy2 + 2.5}" font-family="Arial, sans-serif" font-size="2.2" fill="#000000" text-anchor="middle">MDF 3 mm (70/60 mm)</text>
  </g>

  <!-- ========================================== -->
  <!-- CAPA 3: FICHAS FRACCIONES MDF 3 mm        -->
  <!-- ========================================== -->
  <g id="FICHAS_FRACCIONES_1_${den}_MDF_3MM">
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
  const { piecesGeo, markingsGeo } = createAssembledPiecesGeometry(config, config.explodeDistanceMm);
  const printLayoutGeometry = createPrintBedLayoutGeometry(config);

  // Exportaciones STL binarias
  const trayStlBuffer = exportBufferGeometryToBinaryStl(trayGeometry);
  const singlePieceStlBuffer = exportBufferGeometryToBinaryStl(singlePieceGeometry);
  const { piecesGeo: unexplodedPieces } = createAssembledPiecesGeometry(config, 0);
  const piecesStlBuffer = exportBufferGeometryToBinaryStl(unexplodedPieces);
  const fullSetStlBuffer = exportBufferGeometryToBinaryStl(printLayoutGeometry);

  // SVG para corte láser en MDF 3 mm
  const laserSvgContent = generateFractionsLaserSvg(config);

  // Crear archivo ZIP completo con todos los elementos
  const zipFiles: Record<string, Uint8Array> = {
    [`1_Plato_Base_D70mm_Espesor${config.trayTotalHeightMm}mm.stl`]: new Uint8Array(trayStlBuffer),
    [`2_Set_Completo_Fracciones_1_${config.denominator}_(x${config.denominator}).stl`]: new Uint8Array(piecesStlBuffer),
    [`3_Pieza_Individual_Fraccion_1_${config.denominator}.stl`]: new Uint8Array(singlePieceStlBuffer),
    [`4_Bandeja_Impresion_Completa_Plato_y_Piezas.stl`]: new Uint8Array(fullSetStlBuffer),
    [`5_Corte_Laser_MDF_3mm_Plato_y_Fracciones_1_${config.denominator}.svg`]: strToU8(laserSvgContent)
  };
  const zipBuffer = zipSync(zipFiles);

  // Métricas
  const totalTriangles = (printLayoutGeometry.getAttribute('position').count / 3) | 0;
  const estimatedVolumeCm3 = config.materialStyle === 'mdf' ? 22.0 : 19.5;
  const estimatedWeightGrams = Math.round(estimatedVolumeCm3 * 1.24);
  const estimatedPrintTimeMinutes = Math.round(estimatedWeightGrams * 2.8);

  return {
    config,
    trayGeometry,
    piecesGeometry: piecesGeo,
    markingsGeometry: markingsGeo,
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
