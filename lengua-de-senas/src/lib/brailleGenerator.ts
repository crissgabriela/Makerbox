import * as THREE from 'three';
import { Font } from 'three/examples/jsm/loaders/FontLoader.js';
import { translateTextToBraille, BrailleCell } from './brailleData';
import { HELVETIKER_BOLD } from './helvetikerBold';

// Cargar fuente Helvetiker Bold (modelo de Helvetica / Arial para Three.js)
const helvetikerFont = new Font(HELVETIKER_BOLD);

export type TextReliefMode = 'emboss' | 'deboss';

export interface BrailleConfig {
  text: string;
  plateThicknessMm: number; // 0.8 mm (solicitado exactamente)
  dotHeightMm: number; // 0.36 mm (solicitado)
  dotRadiusMm: number; // 0.6 mm (diámetro 1.2 mm solicitado)
  addKeychainHole: boolean; // true por defecto
  holeDiameterMm: number; // 4.0 mm
  plateHeightMm: number; // 18.0 mm (reducido para fabricación ultra rápida)
  plateCornerRadiusMm: number; // 3.5 mm
  dotSpacingMm: number; // 2.2 mm entre puntos dentro de una celda
  cellSpacingMm: number; // 5.6 mm entre celdas consecutivas
  baseColor: string; // Color para la placa
  dotColor: string; // Color para los puntos
  includeNumberPrefix: boolean;
  includeText: boolean; // Incluir la palabra escrita sobre el braille
  textMode: TextReliefMode; // 'emboss' (sobresale +0.36mm, recomendado) o 'deboss' (-0.30mm)
  textHeightReliefMm: number; // 0.36 mm (igual a la altura de los puntos braille)
  textFontSizeMm: number; // 4.0 mm de altura de letra
  textColor: string;
}

export const DEFAULT_BRAILLE_CONFIG: BrailleConfig = {
  text: 'CRISS',
  plateThicknessMm: 0.8, // 0.8 mm exacto (tiempo de impresión reducido)
  dotHeightMm: 0.36, // 0.36 mm exacto
  dotRadiusMm: 0.6, // Diámetro 1.2 mm exacto
  addKeychainHole: true,
  holeDiameterMm: 4.0, // Orificio compacto
  plateHeightMm: 18.0, // Altura compacta (18 mm en lugar de 28 mm)
  plateCornerRadiusMm: 3.5,
  dotSpacingMm: 2.2,
  cellSpacingMm: 5.6,
  baseColor: '#1e293b',
  dotColor: '#fbbf24',
  includeNumberPrefix: true,
  includeText: true,
  textMode: 'emboss', // 'emboss' = Sobresale del plano superior de la placa
  textHeightReliefMm: 0.36, // Sobresale +0.36 mm (alineado con los puntos braille)
  textFontSizeMm: 4.0,
  textColor: '#ffffff'
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

function addTriangle(
  p1: [number, number, number],
  p2: [number, number, number],
  p3: [number, number, number],
  positions: number[],
  normals: number[],
  flipNormal = false
) {
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
 * Semiesfera suave (domo) unida directamente al plano superior Z = baseZ
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
        const apex: [number, number, number] = [cx, cy, baseZ + h];
        addTriangle(p1, p2, apex, positions, normals);
      } else {
        addQuad(p1, p2, p3, p4, positions, normals);
      }
    }
  }

  // Tapa inferior cerrada plana para estanqueidad perfecta
  const capFloor = new THREE.CircleGeometry(r, segments);
  capFloor.rotateX(Math.PI);
  capFloor.translate(cx, cy, baseZ);

  const domeGeo = new THREE.BufferGeometry();
  domeGeo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  domeGeo.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));

  return mergeBufferGeometries([domeGeo, capFloor]);
}

/**
 * Forma 2D de la placa con esquinas redondeadas y orificio pasante
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

  shape.moveTo(-halfW + r, -halfH);
  shape.lineTo(halfW - r, -halfH);
  shape.quadraticCurveTo(halfW, -halfH, halfW, -halfH + r);
  shape.lineTo(halfW, halfH - r);
  shape.quadraticCurveTo(halfW, halfH, halfW - r, halfH);
  shape.lineTo(-halfW + r, halfH);
  shape.quadraticCurveTo(-halfW, halfH, -halfW, halfH - r);
  shape.lineTo(-halfW, -halfH + r);
  shape.quadraticCurveTo(-halfW, -halfH, -halfW + r, -halfH);

  if (addHole) {
    const holePath = new THREE.Path();
    const holeRadius = holeDiameter / 2;
    holePath.absarc(holeX, 0, holeRadius, 0, Math.PI * 2, true);
    shape.holes.push(holePath);
  }

  return shape;
}

/**
 * Normaliza texto para la fuente Helvetiker (convierte caracteres con acento o especiales a forma segura)
 */
function sanitizeForFont(text: string): string {
  return text
    .toUpperCase()
    .replace(/Ñ/g, 'N')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

/**
 * Genera el modelo 3D optimizado y compacto:
 * - Espesor: 0.8 mm
 * - Altura: 18.0 mm
 * - Puntos Braille: semiesferas estancas de 1.2 mm y 0.36 mm de altura
 * - Letras estilo Arial/Helvetiker: en relieve que sobresalen +0.36 mm del plano superior
 * - Tiempo de impresión: reducido de 16 min a ~4-5 minutos
 */
export function generateBraille3D(config: BrailleConfig): BrailleModelResult {
  const cells = translateTextToBraille(config.text, config.includeNumberPrefix);
  const numCells = Math.max(1, cells.length);

  // Parámetros de dimensiones compactas
  const dotRadius = config.dotRadiusMm; // 0.6 mm
  const dotHeight = config.dotHeightMm; // 0.36 mm
  const cellWidth = config.dotSpacingMm; // 2.2 mm
  const cellSpacing = config.cellSpacingMm; // 5.6 mm
  const brailleSpan = (numCells - 1) * cellSpacing + cellWidth;

  const rawText = config.text.trim().toUpperCase() || 'MAKER';
  const cleanFontText = sanitizeForFont(rawText);

  // Generar formas tipográficas reales con la fuente Helvetiker
  const textShapes = helvetikerFont.generateShapes(cleanFontText, config.textFontSizeMm);

  // Medir ancho real del texto generado
  const tempTextGeo = new THREE.ShapeGeometry(textShapes);
  tempTextGeo.computeBoundingBox();
  const textBounds = tempTextGeo.boundingBox || new THREE.Box3();
  const textSpan = textBounds.max.x - textBounds.min.x;
  const textHeight = textBounds.max.y - textBounds.min.y;

  const contentSpan = config.includeText ? Math.max(brailleSpan, textSpan) : brailleSpan;

  // Márgenes reducidos para placa pequeña y ligera
  const leftMargin = config.addKeychainHole ? config.holeDiameterMm + 7.5 : 5.5;
  const rightMargin = 5.5;
  const totalWidth = Math.max(30, leftMargin + contentSpan + rightMargin);
  const totalHeight = config.plateHeightMm; // 18.0 mm

  const usableStartX = -totalWidth / 2 + leftMargin;
  const holeX = -totalWidth / 2 + (config.holeDiameterMm / 2 + 3.5);

  const brailleStartX = usableStartX + (contentSpan - brailleSpan) / 2;
  const textStartX = usableStartX + (contentSpan - textSpan) / 2 - textBounds.min.x;

  // Distribución vertical en la placa de 18 mm:
  // Fila superior: Texto escrito (Y centro ≈ +3.4 mm)
  // Fila inferior: Celdas Braille (Y centro ≈ -3.5 mm)
  const textCenterY = config.includeText ? 1.5 : 0;
  const brailleCenterY = config.includeText ? -3.5 : 0;

  const plateThickness = config.plateThicknessMm; // 0.8 mm

  // =========================================================================
  // 1. GEOMETRÍA DE LA PLACA BASE (Espesor 0.8 mm exacto)
  // =========================================================================
  const plateShape = createPlaqueShape(
    totalWidth,
    totalHeight,
    config.plateCornerRadiusMm,
    config.addKeychainHole,
    config.holeDiameterMm,
    holeX
  );

  const plateExtrudeSettings: THREE.ExtrudeGeometryOptions = {
    depth: plateThickness, // 0.8 mm
    bevelEnabled: false,
    curveSegments: 24
  };

  const baseGeometry = new THREE.ExtrudeGeometry(plateShape, plateExtrudeSettings);
  baseGeometry.computeVertexNormals();

  // =========================================================================
  // 2. GEOMETRÍA DE LOS PUNTOS BRAILLE (Día 1.2 mm, Alt 0.36 mm)
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

  const dotGeometries: THREE.BufferGeometry[] = [];
  dotCenters.forEach(([dx, dy]) => {
    // Semiesferas fusionadas sobre el plano Z = 0.8 mm
    const dome = createSeamlessDome(dx, dy, dotRadius, dotHeight, plateThickness, 16, 4);
    dotGeometries.push(dome);
  });

  let dotsGeometry: THREE.BufferGeometry | null = null;
  if (dotGeometries.length > 0) {
    dotsGeometry = mergeBufferGeometries(dotGeometries);
    dotsGeometry.computeVertexNormals();
  }

  // =========================================================================
  // 3. GEOMETRÍA DE LAS LETRAS ESCRITAS (Fuente Helvetiker/Arial)
  // =========================================================================
  let textGeometry: THREE.BufferGeometry | null = null;

  if (config.includeText && textShapes.length > 0) {
    if (config.textMode === 'emboss') {
      // MODO ALTORRELIEVE: Las letras sobresalen +0.36 mm del plano superior (Z = 0.8 mm hasta 1.16 mm)
      const textExtrudeSettings: THREE.ExtrudeGeometryOptions = {
        depth: config.textHeightReliefMm, // 0.36 mm
        bevelEnabled: false,
        curveSegments: 12
      };
      textGeometry = new THREE.ExtrudeGeometry(textShapes, textExtrudeSettings);
      textGeometry.translate(textStartX, textCenterY, plateThickness);
      textGeometry.computeVertexNormals();
    } else {
      // MODO BAJORRELIEVE: Hendidura de 0.30 mm
      const debossDepth = 0.3;
      const textExtrudeSettings: THREE.ExtrudeGeometryOptions = {
        depth: debossDepth,
        bevelEnabled: false,
        curveSegments: 12
      };
      textGeometry = new THREE.ExtrudeGeometry(textShapes, textExtrudeSettings);
      textGeometry.translate(textStartX, textCenterY, plateThickness - debossDepth);
      textGeometry.computeVertexNormals();
    }
  }

  // =========================================================================
  // 4. COMBINACIÓN DE MALLAS PARA STL CERRADO UNIVERSAL
  // =========================================================================
  const allMeshes: THREE.BufferGeometry[] = [baseGeometry.clone()];
  if (dotsGeometry) {
    allMeshes.push(dotsGeometry.clone());
  }
  if (textGeometry) {
    allMeshes.push(textGeometry.clone());
  }

  const combinedGeometry = mergeBufferGeometries(allMeshes);
  combinedGeometry.computeVertexNormals();

  // Exportaciones
  const baseRgb = hexToRgb(config.baseColor);
  const dotRgb = hexToRgb(config.dotColor);
  const textRgb = hexToRgb(config.textColor);

  const stlBuffer = exportBufferGeometryToBinaryStl(combinedGeometry);
  const { objContent, mtlContent } = exportToObjWithColors(
    baseGeometry,
    dotsGeometry,
    textGeometry,
    baseRgb,
    dotRgb,
    textRgb
  );

  // Estimaciones físicas de impresión
  const totalTriangles = (combinedGeometry.getAttribute('position').count / 3) | 0;
  const plateAreaCm2 = (totalWidth * totalHeight) / 100;
  const volumeCm3 = plateAreaCm2 * (config.plateThicknessMm / 10);
  // Reducción drástica de peso y tiempo
  const estimatedWeightGrams = Math.max(1, Math.round(volumeCm3 * 1.25 * 10) / 10);
  // Aprox. 1 gramo demora 2.5 min en una impresora moderna (Bambu / Prusa)
  const estimatedPrintTimeMinutes = Math.max(3, Math.round(estimatedWeightGrams * 3.0));

  return {
    cells,
    baseGeometry,
    dotsGeometry,
    textGeometry,
    combinedGeometry,
    widthMm: Math.round(totalWidth * 10) / 10,
    heightMm: totalHeight,
    totalThicknessMm: Math.round((config.plateThicknessMm + dotHeight) * 100) / 100,
    triangleCount: totalTriangles,
    estimatedWeightGrams: Math.round(estimatedWeightGrams),
    estimatedPrintTimeMinutes,
    dotCount: dotCenters.length,
    stlBuffer,
    objContent,
    mtlContent
  };
}

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

function exportBufferGeometryToBinaryStl(geometry: THREE.BufferGeometry): ArrayBuffer {
  const nonIndexed = geometry.index ? geometry.toNonIndexed() : geometry;
  const posAttr = nonIndexed.getAttribute('position');
  const normAttr = nonIndexed.getAttribute('normal');

  const triangleCount = posAttr.count / 3;
  const bufferSize = 84 + triangleCount * 50;
  const buffer = new ArrayBuffer(bufferSize);
  const view = new DataView(buffer);

  const headerText = 'MakerBox UTalca - Llavero Braille 3D Compacto STL';
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

function exportToObjWithColors(
  baseGeo: THREE.BufferGeometry,
  dotsGeo: THREE.BufferGeometry | null,
  textGeo: THREE.BufferGeometry | null,
  baseRgb: [number, number, number],
  dotRgb: [number, number, number],
  textRgb: [number, number, number]
): { objContent: string; mtlContent: string } {
  let obj = '# MakerBox UTalca - Llavero Braille 3D Compacto\n';
  obj += 'mtllib material.mtl\n\n';

  let currentVertexIndex = 1;

  // 1. Placa base
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
    obj += `f ${currentVertexIndex + t}//${currentVertexIndex + t} ${currentVertexIndex + t + 1}//${currentVertexIndex + t + 1} ${currentVertexIndex + t + 2}//${currentVertexIndex + t + 2}\n`;
  }
  currentVertexIndex += baseVertCount;

  // 2. Puntos Braille
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
      obj += `f ${currentVertexIndex + t}//${currentVertexIndex + t} ${currentVertexIndex + t + 1}//${currentVertexIndex + t + 1} ${currentVertexIndex + t + 2}//${currentVertexIndex + t + 2}\n`;
    }
    currentVertexIndex += dotsVertCount;
  }

  // 3. Letras escritas (Relieve)
  if (textGeo) {
    const textNonIndexed = textGeo.index ? textGeo.toNonIndexed() : textGeo;
    const textPos = textNonIndexed.getAttribute('position');
    const textNorm = textNonIndexed.getAttribute('normal');
    const textVertCount = textPos.count;

    obj += '\ng Letras_Texto\n';
    obj += 'usemtl Material_Texto\n';

    for (let i = 0; i < textVertCount; i++) {
      const x = textPos.getX(i).toFixed(4);
      const y = textPos.getY(i).toFixed(4);
      const z = textPos.getZ(i).toFixed(4);
      obj += `v ${x} ${y} ${z} ${textRgb[0].toFixed(3)} ${textRgb[1].toFixed(3)} ${textRgb[2].toFixed(3)}\n`;
    }
    for (let i = 0; i < textVertCount; i++) {
      const nx = (textNorm?.getX(i) ?? 0).toFixed(4);
      const ny = (textNorm?.getY(i) ?? 0).toFixed(4);
      const nz = (textNorm?.getZ(i) ?? 1).toFixed(4);
      obj += `vn ${nx} ${ny} ${nz}\n`;
    }
    for (let t = 0; t < textVertCount; t += 3) {
      obj += `f ${currentVertexIndex + t}//${currentVertexIndex + t} ${currentVertexIndex + t + 1}//${currentVertexIndex + t + 1} ${currentVertexIndex + t + 2}//${currentVertexIndex + t + 2}\n`;
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
  mtl += 'd 1.0\n\n';

  mtl += 'newmtl Material_Texto\n';
  mtl += 'Ka 0.2 0.2 0.2\n';
  mtl += `Kd ${textRgb[0].toFixed(3)} ${textRgb[1].toFixed(3)} ${textRgb[2].toFixed(3)}\n`;
  mtl += 'Ks 0.2 0.2 0.2\n';
  mtl += 'Ns 15.0\n';
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
