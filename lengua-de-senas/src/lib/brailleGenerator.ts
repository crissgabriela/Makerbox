import * as THREE from 'three';
import { translateTextToBraille, BrailleCell } from './brailleData';

export interface BrailleConfig {
  text: string;
  plateThicknessMm: number; // 1.0 mm (solicitado por usuario)
  dotHeightMm: number; // 0.36 mm (solicitado por usuario)
  dotRadiusMm: number; // 0.75 mm (diámetro 1.5 mm estándar táctil)
  addKeychainHole: boolean; // true por defecto
  holeDiameterMm: number; // 4.5 mm
  plateHeightMm: number; // 24 mm
  plateCornerRadiusMm: number; // 5.0 mm
  dotSpacingMm: number; // 2.5 mm entre puntos de una celda
  cellSpacingMm: number; // 6.0 mm entre celdas consecutivas
  baseColor: string; // Color hexadecimal para la placa (ej. #1e293b o #1d4ed8)
  dotColor: string; // Color hexadecimal para los puntos (ej. #f59e0b o #ffffff)
  includeNumberPrefix: boolean; // Añadir prefijo # antes de números
}

export const DEFAULT_BRAILLE_CONFIG: BrailleConfig = {
  text: 'CRISS',
  plateThicknessMm: 1.0,
  dotHeightMm: 0.36,
  dotRadiusMm: 0.75,
  addKeychainHole: true,
  holeDiameterMm: 4.5,
  plateHeightMm: 24,
  plateCornerRadiusMm: 5.0,
  dotSpacingMm: 2.5,
  cellSpacingMm: 6.0,
  baseColor: '#1e293b', // Pizarra azulada elegante
  dotColor: '#fbbf24', // Ámbar dorado de alto contraste
  includeNumberPrefix: true
};

export interface BrailleModelResult {
  cells: BrailleCell[];
  baseGeometry: THREE.BufferGeometry;
  dotsGeometry: THREE.BufferGeometry | null;
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

/**
 * Convierte color hex '#RRGGBB' a componentes normalizadas [r, g, b] de 0.0 a 1.0
 */
function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.substring(0, 2), 16) / 255;
  const g = parseInt(clean.substring(2, 4), 16) / 255;
  const b = parseInt(clean.substring(4, 6), 16) / 255;
  return [r, g, b];
}

/**
 * Crea una forma 2D con esquinas redondeadas y opcionalmente el orificio del llavero
 */
function createPlaqueShape(
  width: number,
  height: number,
  radius: number,
  addHole: boolean,
  holeDiameter: number,
  holeX: number
): THREE.Shape {
  const shape = new THREE.Shape();
  const halfW = width / 2;
  const halfH = height / 2;
  const r = Math.min(radius, halfW, halfH);

  // Contorno con esquinas redondeadas
  shape.moveTo(-halfW + r, -halfH);
  shape.lineTo(halfW - r, -halfH);
  shape.quadraticCurveTo(halfW, -halfH, halfW, -halfH + r);
  shape.lineTo(halfW, halfH - r);
  shape.quadraticCurveTo(halfW, halfH, halfW - r, halfH);
  shape.lineTo(-halfW + r, halfH);
  shape.quadraticCurveTo(-halfW, halfH, -halfW, halfH - r);
  shape.lineTo(-halfW, -halfH + r);
  shape.quadraticCurveTo(-halfW, -halfH, -halfW + r, -halfH);

  // Orificio pasante de llavero
  if (addHole) {
    const holePath = new THREE.Path();
    const holeRadius = holeDiameter / 2;
    holePath.absarc(holeX, 0, holeRadius, 0, Math.PI * 2, true);
    shape.holes.push(holePath);
  }

  return shape;
}

/**
 * Genera el modelo 3D del llavero Braille completo (Base + Puntos + Geometrías + STL + OBJ con Color)
 */
export function generateBraille3D(config: BrailleConfig): BrailleModelResult {
  const cells = translateTextToBraille(config.text, config.includeNumberPrefix);
  const numCells = Math.max(1, cells.length);

  // Cálculo de dimensiones de la plaquita
  const cellWidth = config.dotSpacingMm; // Ancho entre las dos columnas (2.5mm)
  const cellSpacing = config.cellSpacingMm; // 6.0 mm
  const cellsTotalSpan = (numCells - 1) * cellSpacing + cellWidth;

  const leftMarginWithHole = config.addKeychainHole ? config.holeDiameterMm + 10 : 8;
  const rightMargin = 8;
  const totalWidth = Math.max(35, leftMarginWithHole + cellsTotalSpan + rightMargin);
  const totalHeight = config.plateHeightMm;

  // Posición X de inicio para centrar las celdas en el área útil
  const usableStartX = -totalWidth / 2 + leftMarginWithHole;
  const holeX = -totalWidth / 2 + (config.holeDiameterMm / 2 + 4.5);

  // 1. Geometría de la placa base (Espesor 1.0 mm exacto)
  const shape = createPlaqueShape(
    totalWidth,
    totalHeight,
    config.plateCornerRadiusMm,
    config.addKeychainHole,
    config.holeDiameterMm,
    holeX
  );

  const extrudeSettings: THREE.ExtrudeGeometryOptions = {
    depth: config.plateThicknessMm, // 1.0 mm
    bevelEnabled: false, // Cara plana perfecta para cama de impresión 3D
    curveSegments: 32
  };

  const baseGeometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
  baseGeometry.computeVertexNormals();

  // 2. Geometría de los puntos Braille (Domo de 0.36 mm de altura)
  // Matriz de coordenadas relativas de los 6 puntos en la celda:
  // Punto 1: col 0, fila 0 (arr-izq) -> x=0, y=+dy
  // Punto 2: col 0, fila 1 (med-izq) -> x=0, y=0
  // Punto 3: col 0, fila 2 (abj-izq) -> x=0, y=-dy
  // Punto 4: col 1, fila 0 (arr-der) -> x=+dx, y=+dy
  // Punto 5: col 1, fila 1 (med-der) -> x=+dx, y=0
  // Punto 6: col 1, fila 2 (abj-der) -> x=+dx, y=-dy
  const dotOffsets: Record<number, [number, number]> = {
    1: [0, config.dotSpacingMm],
    2: [0, 0],
    3: [0, -config.dotSpacingMm],
    4: [config.dotSpacingMm, config.dotSpacingMm],
    5: [config.dotSpacingMm, 0],
    6: [config.dotSpacingMm, -config.dotSpacingMm]
  };

  // Colectar centros de todos los puntos activos
  const dotCenters: [number, number, number][] = [];

  cells.forEach((cell, cellIdx) => {
    const cellBaseX = usableStartX + cellIdx * cellSpacing;
    const cellBaseY = 0; // Centrado verticalmente

    cell.dots.forEach((dotNum) => {
      const offset = dotOffsets[dotNum];
      if (offset) {
        const x = cellBaseX + offset[0];
        const y = cellBaseY + offset[1];
        const z = config.plateThicknessMm; // Asentado en la cara superior (1.0 mm)
        dotCenters.push([x, y, z]);
      }
    });
  });

  // Generar domos hemisféricos para los puntos
  let dotsGeometry: THREE.BufferGeometry | null = null;
  const dotGeometries: THREE.BufferGeometry[] = [];

  if (dotCenters.length > 0) {
    // Hemisferio parametrizado: radio de base R, altura H (0.36 mm)
    // Usamos SphereGeometry en el hemisferio superior (phi de 0 a PI/2) y escalamos en Z
    const baseSphere = new THREE.SphereGeometry(
      config.dotRadiusMm,
      16,
      12,
      0,
      Math.PI * 2,
      0,
      Math.PI / 2
    );
    // Escalar Z para que la altura sea exactamente dotHeightMm
    baseSphere.scale(1, 1, config.dotHeightMm / config.dotRadiusMm);

    // Fondo plano del domo para garantizar estanqueidad de cada punto
    const circleCap = new THREE.CircleGeometry(config.dotRadiusMm, 16);
    circleCap.rotateX(Math.PI); // Normal hacia abajo (-Z)

    dotCenters.forEach(([x, y, z]) => {
      const dotClone = baseSphere.clone();
      dotClone.translate(x, y, z);

      const capClone = circleCap.clone();
      capClone.translate(x, y, z);

      dotGeometries.push(dotClone, capClone);
    });

    dotsGeometry = mergeBufferGeometries(dotGeometries);
    dotsGeometry.computeVertexNormals();
  }

  // 3. Geometría combinada (para visualización unificada y STL)
  const geometriesToCombine: THREE.BufferGeometry[] = [baseGeometry.clone()];
  if (dotsGeometry) {
    geometriesToCombine.push(dotsGeometry.clone());
  }
  const combinedGeometry = mergeBufferGeometries(geometriesToCombine);
  combinedGeometry.computeVertexNormals();

  // 4. Asignación de colores para OBJ y render
  const baseRgb = hexToRgb(config.baseColor);
  const dotRgb = hexToRgb(config.dotColor);

  // 5. Generación del buffer STL binario (universal)
  const stlBuffer = exportBufferGeometryToBinaryStl(combinedGeometry);

  // 6. Generación del archivo OBJ con Materiales y Vertex Colors
  const { objContent, mtlContent } = exportToObjWithColors(
    baseGeometry,
    dotsGeometry,
    baseRgb,
    dotRgb
  );

  // Estadísticas físicas de impresión
  const totalTriangles = (combinedGeometry.getAttribute('position').count / 3) | 0;
  const plateAreaCm2 = (totalWidth * totalHeight) / 100;
  const volumeCm3 = plateAreaCm2 * (config.plateThicknessMm / 10);
  const estimatedWeightGrams = Math.max(1, Math.round(volumeCm3 * 1.25)); // 1.25 g/cm3 para PLA
  const estimatedPrintTimeMinutes = Math.max(4, Math.round(estimatedWeightGrams * 3.5));

  return {
    cells,
    baseGeometry,
    dotsGeometry,
    combinedGeometry,
    widthMm: Math.round(totalWidth * 10) / 10,
    heightMm: totalHeight,
    totalThicknessMm: Math.round((config.plateThicknessMm + config.dotHeightMm) * 100) / 100,
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
 * Une múltiples BufferGeometry no indexadas o indexadas en una sola BufferGeometry no indexada
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
 * Exporta una BufferGeometry a formato STL Binario de alta velocidad
 */
function exportBufferGeometryToBinaryStl(geometry: THREE.BufferGeometry): ArrayBuffer {
  const nonIndexed = geometry.index ? geometry.toNonIndexed() : geometry;
  const posAttr = nonIndexed.getAttribute('position');
  const normAttr = nonIndexed.getAttribute('normal');

  const triangleCount = posAttr.count / 3;
  const bufferSize = 84 + triangleCount * 50;
  const buffer = new ArrayBuffer(bufferSize);
  const view = new DataView(buffer);

  // 80 bytes de cabecera ASCII
  const headerText = 'MakerBox UTalca - Llavero Braille 3D STL Generator';
  for (let i = 0; i < 80; i++) {
    view.setUint8(i, i < headerText.length ? headerText.charCodeAt(i) : 32);
  }

  // Cantidad de triángulos
  view.setUint32(80, triangleCount, true);

  let offset = 84;
  for (let t = 0; t < triangleCount; t++) {
    const vIdx = t * 3;

    // Normal (calculada o tomada del atributo)
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

    // 3 Vértices
    for (let i = 0; i < 3; i++) {
      const x = posAttr.getX(vIdx + i);
      const y = posAttr.getY(vIdx + i);
      const z = posAttr.getZ(vIdx + i);

      view.setFloat32(offset, x, true);
      view.setFloat32(offset + 4, y, true);
      view.setFloat32(offset + 8, z, true);
      offset += 12;
    }

    // 2 bytes atributo (0)
    view.setUint16(offset, 0, true);
    offset += 2;
  }

  return buffer;
}

/**
 * Genera el contenido de un archivo OBJ con soporte de materiales y Vertex Colors,
 * además de generar el archivo acompañante MTL para compatibilidad con Bambu Studio, Cura, Blender, etc.
 */
function exportToObjWithColors(
  baseGeo: THREE.BufferGeometry,
  dotsGeo: THREE.BufferGeometry | null,
  baseRgb: [number, number, number],
  dotRgb: [number, number, number]
): { objContent: string; mtlContent: string } {
  let obj = '# MakerBox UTalca - Llavero Braille 3D\n';
  obj += '# Formato Wavefront OBJ con Vertex Colors y Materiales\n';
  obj += 'mtllib material.mtl\n\n';

  let currentVertexIndex = 1;

  // 1. Grupo Base de la Placa
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
    // Vértice con color RGB integrado (Vertex Color)
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

  // 2. Grupo Puntos Braille (si existen)
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

  // Archivo MTL acompañante
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

/**
 * Descarga el archivo STL binario en el navegador
 */
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

/**
 * Descarga el archivo OBJ con colores en el navegador
 */
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

/**
 * Descarga el archivo MTL de materiales complementario
 */
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
