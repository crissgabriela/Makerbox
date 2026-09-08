import * as THREE from 'three';
import { translateTextToBraille, BrailleCell } from './brailleData';
import { getGlyphPolygonsAt, GLYPH_WIDTH, GLYPH_HEIGHT, STROKE_WIDTH } from './latinGlyphs';

export interface BrailleConfig {
  text: string;
  plateThicknessMm: number; // 1.0 mm (solicitado por usuario)
  dotHeightMm: number; // 0.36 mm (solicitado por usuario)
  dotRadiusMm: number; // 0.75 mm (diámetro 1.5 mm estándar táctil)
  addKeychainHole: boolean; // true por defecto
  holeDiameterMm: number; // 4.5 mm
  plateHeightMm: number; // 28 mm (espacio óptimo para texto escrito + braille)
  plateCornerRadiusMm: number; // 5.0 mm
  dotSpacingMm: number; // 2.5 mm entre puntos de una celda
  cellSpacingMm: number; // 6.0 mm entre celdas consecutivas
  baseColor: string; // Color hexadecimal para la placa (ej. #1e293b o #1d4ed8)
  dotColor: string; // Color hexadecimal para los puntos (ej. #fbbf24 o #ffffff)
  includeNumberPrefix: boolean; // Añadir prefijo # antes de números
  // Nueva funcionalidad: Palabra escrita en bajorrelieve
  includeDebossedText: boolean; // Mostrar palabra escrita en bajorrelieve
  debossDepthMm: number; // 0.4 mm (solicitado exactamente 0,4 mm)
  debossStrokeMm: number; // 0.8 mm (solicitado exactamente 0,8 mm)
  textColor: string; // Color para destacar el texto bajorrelieve en visor y OBJ
}

export const DEFAULT_BRAILLE_CONFIG: BrailleConfig = {
  text: 'CRISS',
  plateThicknessMm: 1.0,
  dotHeightMm: 0.36,
  dotRadiusMm: 0.75,
  addKeychainHole: true,
  holeDiameterMm: 4.5,
  plateHeightMm: 28,
  plateCornerRadiusMm: 5.0,
  dotSpacingMm: 2.5,
  cellSpacingMm: 6.0,
  baseColor: '#1e293b', // Pizarra azulada elegante
  dotColor: '#fbbf24', // Ámbar dorado de alto contraste
  includeNumberPrefix: true,
  includeDebossedText: true,
  debossDepthMm: 0.4,
  debossStrokeMm: 0.8,
  textColor: '#38bdf8' // Azul cielo para contraste
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

  // Contorno exterior continuo con esquinas suaves
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
 * Genera el modelo 3D del llavero Braille con palabra escrita en bajorrelieve (0.4mm de profundidad)
 * y puntos Braille en altorrelieve (+0.36mm).
 */
export function generateBraille3D(config: BrailleConfig): BrailleModelResult {
  const cells = translateTextToBraille(config.text, config.includeNumberPrefix);
  const numCells = Math.max(1, cells.length);

  // Cálculo de dimensiones horizontales
  const cellWidth = config.dotSpacingMm; // 2.5 mm
  const cellSpacing = config.cellSpacingMm; // 6.0 mm
  const brailleTotalSpan = (numCells - 1) * cellSpacing + cellWidth;

  // Cálculo del ancho necesario para el texto en letras latinas
  const rawChars = config.text.trim().toUpperCase();
  const numChars = Math.max(1, rawChars.length);
  const latinCharWidth = GLYPH_WIDTH; // 3.6 mm
  const latinSpacing = 1.4; // mm entre letras
  const latinTotalSpan = numChars * latinCharWidth + (numChars - 1) * latinSpacing;

  // El área útil debe alojar tanto las señas braille como las letras escritas
  const contentSpan = config.includeDebossedText
    ? Math.max(brailleTotalSpan, latinTotalSpan)
    : brailleTotalSpan;

  const leftMarginWithHole = config.addKeychainHole ? config.holeDiameterMm + 10 : 8;
  const rightMargin = 8;
  const totalWidth = Math.max(38, leftMarginWithHole + contentSpan + rightMargin);
  const totalHeight = config.plateHeightMm;

  // Centrado horizontal de contenido
  const usableStartX = -totalWidth / 2 + leftMarginWithHole;
  const holeX = -totalWidth / 2 + (config.holeDiameterMm / 2 + 4.5);

  // Centrado independiente para Braille y para texto latino
  const brailleStartX = usableStartX + (contentSpan - brailleTotalSpan) / 2;
  const latinStartX = usableStartX + (contentSpan - latinTotalSpan) / 2;

  // Posiciones verticales Y:
  // Si hay texto escrito: Fila superior = texto latino (Y = +3.8mm), Fila inferior = braille (Y = -5.5mm)
  // Si no hay texto: Braille centrado (Y = 0mm)
  const brailleCenterY = config.includeDebossedText ? -5.5 : 0;
  const latinCenterY = 3.6; // Base inferior del texto en Y = 1.0mm, llega a Y = 6.2mm

  // =========================================================================
  // 1. GEOMETRÍA DE LA PLACA (Capas para bajo relieve de 0.4 mm)
  // =========================================================================
  let baseGeometry: THREE.BufferGeometry;
  const plateGeometries: THREE.BufferGeometry[] = [];

  const debossDepth = Math.min(config.debossDepthMm, config.plateThicknessMm - 0.2); // asegura piso de al menos 0.2mm
  const baseFloorThickness = config.plateThicknessMm - debossDepth; // ej. 1.0 - 0.4 = 0.6 mm

  if (config.includeDebossedText && rawChars.length > 0) {
    // A. Capa Inferior Sólida (Desde Z = 0 hasta Z = baseFloorThickness = 0.6 mm)
    const floorShape = createPlaqueShape(
      totalWidth,
      totalHeight,
      config.plateCornerRadiusMm,
      config.addKeychainHole,
      config.holeDiameterMm,
      holeX
    );
    const floorGeo = new THREE.ExtrudeGeometry(floorShape, {
      depth: baseFloorThickness,
      bevelEnabled: false,
      curveSegments: 32
    });
    plateGeometries.push(floorGeo);

    // B. Capa Superior con Cavidades de Letras (Desde Z = 0.6 mm hasta Z = 1.0 mm)
    const topShape = createPlaqueShape(
      totalWidth,
      totalHeight,
      config.plateCornerRadiusMm,
      config.addKeychainHole,
      config.holeDiameterMm,
      holeX
    );

    // Añadir cada trazo de cada letra como orificio en la capa superior
    let currentX = latinStartX;
    const islandShapes: THREE.Shape[] = [];

    for (let c = 0; c < rawChars.length; c++) {
      const char = rawChars[c];
      if (char === ' ') {
        currentX += 3.0;
        continue;
      }

      const glyphPolys = getGlyphPolygonsAt(char, currentX, latinCenterY, 1.0);

      glyphPolys.forEach((g) => {
        // Contorno de la letra -> Se resta de la capa superior formando la canaladura de 0.4mm
        const letterHole = new THREE.Path();
        g.contour.forEach(([px, py], idx) => {
          if (idx === 0) letterHole.moveTo(px, py);
          else letterHole.lineTo(px, py);
        });
        letterHole.closePath();
        topShape.holes.push(letterHole);

        // Islas interiores (en letras como O, A, D, R, P, B, 0, 4, 8, etc.)
        if (g.holes && g.holes.length > 0) {
          g.holes.forEach((holePoints) => {
            const island = new THREE.Shape();
            holePoints.forEach(([ix, iy], idx) => {
              if (idx === 0) island.moveTo(ix, iy);
              else island.lineTo(ix, iy);
            });
            island.closePath();
            islandShapes.push(island);
          });
        }
      });

      currentX += latinCharWidth + latinSpacing;
    }

    // Extruir capa superior
    const topGeo = new THREE.ExtrudeGeometry(topShape, {
      depth: debossDepth,
      bevelEnabled: false,
      curveSegments: 32
    });
    topGeo.translate(0, 0, baseFloorThickness);
    plateGeometries.push(topGeo);

    // Extruir islas interiores para que queden al nivel superior (Z = 1.0mm)
    islandShapes.forEach((island) => {
      const islandGeo = new THREE.ExtrudeGeometry(island, {
        depth: debossDepth,
        bevelEnabled: false,
        curveSegments: 16
      });
      islandGeo.translate(0, 0, baseFloorThickness);
      plateGeometries.push(islandGeo);
    });

    baseGeometry = mergeBufferGeometries(plateGeometries);
  } else {
    // Modo simple sin texto escrito: Placa sólida de 1.0 mm
    const shape = createPlaqueShape(
      totalWidth,
      totalHeight,
      config.plateCornerRadiusMm,
      config.addKeychainHole,
      config.holeDiameterMm,
      holeX
    );
    baseGeometry = new THREE.ExtrudeGeometry(shape, {
      depth: config.plateThicknessMm,
      bevelEnabled: false,
      curveSegments: 32
    });
  }

  baseGeometry.computeVertexNormals();

  // =========================================================================
  // 2. GEOMETRÍA DE LOS PUNTOS BRAILLE (Domo esférico de +0.36 mm)
  // =========================================================================
  const dotOffsets: Record<number, [number, number]> = {
    1: [0, config.dotSpacingMm],
    2: [0, 0],
    3: [0, -config.dotSpacingMm],
    4: [config.dotSpacingMm, config.dotSpacingMm],
    5: [config.dotSpacingMm, 0],
    6: [config.dotSpacingMm, -config.dotSpacingMm]
  };

  const dotCenters: [number, number, number][] = [];

  cells.forEach((cell, cellIdx) => {
    const cellBaseX = brailleStartX + cellIdx * cellSpacing;
    const cellBaseY = brailleCenterY;

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

  let dotsGeometry: THREE.BufferGeometry | null = null;
  const dotGeometries: THREE.BufferGeometry[] = [];

  if (dotCenters.length > 0) {
    const baseSphere = new THREE.SphereGeometry(
      config.dotRadiusMm,
      16,
      12,
      0,
      Math.PI * 2,
      0,
      Math.PI / 2
    );
    baseSphere.scale(1, 1, config.dotHeightMm / config.dotRadiusMm);

    const circleCap = new THREE.CircleGeometry(config.dotRadiusMm, 16);
    circleCap.rotateX(Math.PI);

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

  // =========================================================================
  // 3. COMBINACIÓN DE GEOMETRÍAS PARA STL UNIVERSAL Y OBJ CON COLOR
  // =========================================================================
  const geometriesToCombine: THREE.BufferGeometry[] = [baseGeometry.clone()];
  if (dotsGeometry) {
    geometriesToCombine.push(dotsGeometry.clone());
  }
  const combinedGeometry = mergeBufferGeometries(geometriesToCombine);
  combinedGeometry.computeVertexNormals();

  // Colores para OBJ
  const baseRgb = hexToRgb(config.baseColor);
  const dotRgb = hexToRgb(config.dotColor);

  // STL binario
  const stlBuffer = exportBufferGeometryToBinaryStl(combinedGeometry);

  // OBJ con colores
  const { objContent, mtlContent } = exportToObjWithColors(
    baseGeometry,
    dotsGeometry,
    baseRgb,
    dotRgb
  );

  // Métricas físicas
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

  const headerText = 'MakerBox UTalca - Llavero Braille 3D con Bajorrelieve STL';
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
 * Genera archivo OBJ con grupos separados y Vertex Colors
 */
function exportToObjWithColors(
  baseGeo: THREE.BufferGeometry,
  dotsGeo: THREE.BufferGeometry | null,
  baseRgb: [number, number, number],
  dotRgb: [number, number, number]
): { objContent: string; mtlContent: string } {
  let obj = '# MakerBox UTalca - Llavero Braille 3D con Bajorrelieve\n';
  obj += '# Formato Wavefront OBJ con Vertex Colors y Materiales\n';
  obj += 'mtllib material.mtl\n\n';

  let currentVertexIndex = 1;

  // 1. Grupo Base de la Placa (incluye las letras en bajorrelieve)
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

  // Archivo MTL
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
 * Descarga el archivo STL binario
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
 * Descarga el archivo OBJ con colores
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
 * Descarga el archivo MTL de materiales
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
