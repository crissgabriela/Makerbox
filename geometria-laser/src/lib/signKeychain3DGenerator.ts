import * as THREE from 'three';
import { SVGLoader } from 'three/examples/jsm/loaders/SVGLoader.js';
import { zipSync } from 'fflate';
import { KeychainShape, LaserConfig } from '@/types';
import { generateLaserSvg } from './svgPathMerger';

export interface SignKeychain3DConfig {
  text: string;
  secondaryText: string;
  shape: KeychainShape;        // 'capsule' (25 mm alto) o 'heart' (Corazón Dúo 60 mm alto)
  baseThicknessMm: number;     // Espesor de la placa base en PLA (ej. 2.0 mm, rango 1.2..3.2 mm)
  reliefHeightMm: number;      // Altura del relieve de señas y letras sobre la base (ej. 0.60 mm)
  holeDiameterMm: number;      // Diámetro del agujero de argolla (ej. 4.5 mm)
  signSpacingMm: number;       // Separación horizontal entre manos (ej. 2.5 mm)
  baseColor: string;
  reliefColor: string;
}

export const DEFAULT_SIGN_KEYCHAIN_3D_CONFIG: SignKeychain3DConfig = {
  text: 'MAIPÚ',
  secondaryText: 'CIENCIA',
  shape: 'capsule',
  baseThicknessMm: 2.0,
  reliefHeightMm: 0.6,
  holeDiameterMm: 4.5,
  signSpacingMm: 2.5,
  baseColor: '#1e293b',
  reliefColor: '#fbbf24',
};

export interface SignKeychain3DResult {
  baseGeometry: THREE.BufferGeometry;
  dotsGeometry: THREE.BufferGeometry | null; // Relieve de señas + letras (compatible con Braille3DViewer)
  textGeometry: THREE.BufferGeometry | null;
  combinedGeometry: THREE.BufferGeometry;
  widthMm: number;
  heightMm: number;
  totalThicknessMm: number;
  signCount: number;
  dotCount: number;
  triangleCount: number;
  estimatedWeightGrams: number;
  estimatedPrintTimeMinutes: number;
  stlBuffer: ArrayBuffer;
  multiPartZipBuffer: Uint8Array;
  baseFilename: string;
}

function mergeNonIndexedGeometries(geometries: THREE.BufferGeometry[]): THREE.BufferGeometry {
  const merged = new THREE.BufferGeometry();
  const positions: number[] = [];
  const normals: number[] = [];

  for (const geo of geometries) {
    const nonIndexed = geo.index ? geo.toNonIndexed() : geo;
    const posAttr = nonIndexed.getAttribute('position');
    const normAttr = nonIndexed.getAttribute('normal');
    if (!posAttr) continue;

    for (let i = 0; i < posAttr.count; i++) {
      positions.push(posAttr.getX(i), posAttr.getY(i), posAttr.getZ(i));
      if (normAttr) {
        normals.push(normAttr.getX(i), normAttr.getY(i), normAttr.getZ(i));
      } else {
        normals.push(0, 0, 1);
      }
    }
  }

  merged.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  merged.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
  return merged;
}

function exportGeometryToBinaryStl(geometry: THREE.BufferGeometry): ArrayBuffer {
  const nonIndexed = geometry.index ? geometry.toNonIndexed() : geometry;
  const posAttr = nonIndexed.getAttribute('position');
  const normAttr = nonIndexed.getAttribute('normal');

  if (!posAttr || posAttr.count === 0) {
    return new ArrayBuffer(84);
  }

  const triangleCount = (posAttr.count / 3) | 0;
  const buffer = new ArrayBuffer(84 + triangleCount * 50);
  const view = new DataView(buffer);

  const headerText = 'MakerBox UTalca - Llavero Lengua de Senas Chilena 3D STL';
  for (let i = 0; i < 80; i++) {
    view.setUint8(i, i < headerText.length ? headerText.charCodeAt(i) : 32);
  }
  view.setUint32(80, triangleCount, true);

  let offset = 84;
  for (let t = 0; t < triangleCount; t++) {
    const vIdx = t * 3;
    const nx = normAttr ? normAttr.getX(vIdx) : 0;
    const ny = normAttr ? normAttr.getY(vIdx) : 0;
    const nz = normAttr ? normAttr.getZ(vIdx) : 1;

    view.setFloat32(offset, nx, true);
    view.setFloat32(offset + 4, ny, true);
    view.setFloat32(offset + 8, nz, true);
    offset += 12;

    for (let i = 0; i < 3; i++) {
      view.setFloat32(offset, posAttr.getX(vIdx + i), true);
      view.setFloat32(offset + 4, posAttr.getY(vIdx + i), true);
      view.setFloat32(offset + 8, posAttr.getZ(vIdx + i), true);
      offset += 12;
    }

    view.setUint16(offset, 0, true);
    offset += 2;
  }

  return buffer;
}

/**
 * Construye el modelo 3D sólido (en milímetros exactos) de un llavero en Lengua de Señas Chilena
 * tanto en formato Cápsula (25 mm) como Corazón Dúo (60 mm), extruyendo la placa base con orificio
 * y elevando las señas anatómicas + palabra en curvas vectoriales en sobre-relieve táctil (+Z).
 */
export function generateSignKeychain3D(config: SignKeychain3DConfig): SignKeychain3DResult | null {
  if (typeof DOMParser === 'undefined') {
    return null;
  }

  const laserConfig: LaserConfig = {
    mode: config.shape === 'heart' ? 'heart' : 'capsule',
    keychainShape: config.shape,
    secondaryText: config.secondaryText,
    targetHeightMm: config.shape === 'heart' ? 60 : 25,
    signSpacingMm: config.signSpacingMm,
    contourOffsetMm: 6,
    addKeychainHole: true,
    holeDiameterMm: config.holeDiameterMm,
    baseBarHeightMm: 10,
    includeTextEngraving: true,
    includeBranding: false,
    materialThicknessMm: 3,
    cutStrokeColor: '#FF0000',
    engraveStrokeColor: '#0000FF',
    engraveFillColor: '#000000',
  };

  const effectivePrimary = config.text.trim() || 'HOLA';
  const laserSvg = generateLaserSvg(effectivePrimary, laserConfig, config.secondaryText);

  const totalW = laserSvg.widthMm;
  const totalH = laserSvg.heightMm;
  const baseDepth = Math.max(1.0, Math.min(4.0, config.baseThicknessMm));
  const reliefHeight = Math.max(0.25, Math.min(1.6, config.reliefHeightMm));
  const holeRadius = Math.max(1.5, Math.min(3.2, config.holeDiameterMm / 2));
  const isHeart = laserSvg.shape === 'heart' || config.shape === 'heart';

  // 1. Placa Base centrada en (0, 0), desde z = 0 hasta z = baseDepth
  //    En SVG (0..totalW, 0..totalH) con +Y hacia abajo -> En Three.js centramos con:
  //    X_3d = x_svg - totalW / 2
  //    Y_3d = totalH / 2 - y_svg
  const baseShape = new THREE.Shape();
  const halfW = totalW / 2;
  const halfH = totalH / 2;

  if (isHeart) {
    const tx = (x: number) => x - halfW;
    const ty = (y: number) => halfH - y;

    baseShape.moveTo(tx(33.82), ty(60.0));
    baseShape.bezierCurveTo(tx(18.55), ty(48.0), tx(0.0), ty(34.91), tx(0.0), ty(20.73));
    baseShape.bezierCurveTo(tx(0.0), ty(5.45), tx(14.18), ty(0.0), tx(25.09), ty(0.0));
    baseShape.bezierCurveTo(tx(30.55), ty(0.0), tx(33.82), ty(5.45), tx(33.82), ty(13.09));
    baseShape.bezierCurveTo(tx(33.82), ty(5.45), tx(37.09), ty(0.0), tx(42.55), ty(0.0));
    baseShape.bezierCurveTo(tx(53.45), ty(0.0), tx(67.64), ty(5.45), tx(67.64), ty(20.73));
    baseShape.bezierCurveTo(tx(67.64), ty(34.91), tx(49.09), ty(48.0), tx(33.82), ty(60.0));

    const holePath = new THREE.Path();
    holePath.absarc(tx(23.5), ty(8.5), holeRadius, 0, Math.PI * 2, true);
    baseShape.holes.push(holePath);
  } else {
    const r = totalH / 2;
    const capLeftX = -halfW + r;
    const capRightX = Math.max(halfW - r, capLeftX + 1);

    baseShape.moveTo(capLeftX, -halfH);
    baseShape.lineTo(capRightX, -halfH);
    baseShape.absarc(capRightX, 0, r, -Math.PI / 2, Math.PI / 2, false);
    baseShape.lineTo(capLeftX, halfH);
    baseShape.absarc(capLeftX, 0, r, Math.PI / 2, (3 * Math.PI) / 2, false);

    const holePath = new THREE.Path();
    holePath.absarc(-halfW + 7.5, 0, holeRadius, 0, Math.PI * 2, true);
    baseShape.holes.push(holePath);
  }

  const rawBaseGeo = new THREE.ExtrudeGeometry(baseShape, {
    depth: baseDepth,
    bevelEnabled: false,
    curveSegments: 28,
    steps: 1,
  });
  const baseGeometry = mergeNonIndexedGeometries([rawBaseGeo]);
  rawBaseGeo.dispose();

  // 2. Extraer únicamente el grupo de grabado vectorial (<g id="capa-grabado-...">...</g>)
  //    y aplicarle en espacio SVG 2D la transformación a coordenadas 3D centradas (Y invertida):
  //    X_3d = x_svg - halfW, Y_3d = halfH - y_svg  ===> translate(-halfW, halfH) scale(1, -1)
  //    Así SVGLoader convierte cada curva 2D antes de triangular, manteniendo normales 3D 100% hacia afuera.
  const engraveGroupMatch = laserSvg.svgString.match(
    /<g id="capa-grabado-[^"]*">([\s\S]*?)<\/g>\s*<!-- CAPA 1/
  );
  const engraveInnerMarkup = engraveGroupMatch ? engraveGroupMatch[1] : '';

  const reliefWrappedSvg = `<svg xmlns="http://www.w3.org/2000/svg"><g transform="translate(${(-halfW).toFixed(4)}, ${halfH.toFixed(4)}) scale(1, -1)">${engraveInnerMarkup}</g></svg>`;

  const loader = new SVGLoader();
  const parsed = loader.parse(reliefWrappedSvg);

  const reliefPartGeos: THREE.BufferGeometry[] = [];
  const embedOverlap = 0.04; // Solape de 0.04 mm dentro de la placa base para unión manifold sólida en laminadores

  for (const shapePath of parsed.paths) {
    const style = (shapePath.userData?.style || {}) as Record<string, unknown>;
    if (style.fill === 'none') continue;

    const shapes = shapePath.toShapes();
    for (const s of shapes) {
      const extGeo = new THREE.ExtrudeGeometry(s, {
        depth: reliefHeight + embedOverlap,
        bevelEnabled: false,
        curveSegments: 16,
        steps: 1,
      });
      extGeo.translate(0, 0, baseDepth - embedOverlap);
      reliefPartGeos.push(extGeo);
    }
  }

  const reliefGeometry =
    reliefPartGeos.length > 0 ? mergeNonIndexedGeometries(reliefPartGeos) : null;
  reliefPartGeos.forEach((g) => g.dispose());

  const combinedGeometry = reliefGeometry
    ? mergeNonIndexedGeometries([baseGeometry, reliefGeometry])
    : mergeNonIndexedGeometries([baseGeometry]);

  const totalTriangles = (combinedGeometry.getAttribute('position').count / 3) | 0;

  // Estimación realista de peso en PLA (1.24 g/cm³) y tiempo de impresión FDM
  const areaFactor = isHeart ? 0.68 : 0.88;
  const plateVolumeCm3 = ((totalW * totalH * areaFactor) / 100) * (baseDepth / 10);
  const reliefVolumeCm3 = ((totalW * totalH * 0.22) / 100) * (reliefHeight / 10);
  const estimatedWeightGrams = Math.max(
    2,
    Math.round((plateVolumeCm3 + reliefVolumeCm3) * 1.24 * 10) / 10
  );
  const estimatedPrintTimeMinutes = Math.max(
    6,
    Math.round(estimatedWeightGrams * 3.4)
  );

  const cleanPrimary =
    effectivePrimary.replace(/[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑ]/g, '_') || 'Senas';
  const cleanSecondary = config.secondaryText
    ? config.secondaryText.trim().replace(/[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑ]/g, '_')
    : '';
  const baseFilename =
    isHeart && cleanSecondary
      ? `Llavero_Senas_Corazon_${cleanPrimary}_${cleanSecondary}`
      : `Llavero_Senas_${cleanPrimary}`;

  const stlBuffer = exportGeometryToBinaryStl(combinedGeometry);
  const baseStlBuffer = exportGeometryToBinaryStl(baseGeometry);
  const multiPartFiles: Record<string, Uint8Array> = {
    [`1_Base_Placa_${cleanPrimary}.stl`]: new Uint8Array(baseStlBuffer),
  };
  if (reliefGeometry) {
    const reliefStlBuffer = exportGeometryToBinaryStl(reliefGeometry);
    multiPartFiles[`2_Relieve_Senas_y_Texto_${cleanPrimary}.stl`] = new Uint8Array(
      reliefStlBuffer
    );
  }
  const multiPartZipBuffer = zipSync(multiPartFiles);

  return {
    baseGeometry,
    dotsGeometry: reliefGeometry,
    textGeometry: null,
    combinedGeometry,
    widthMm: totalW,
    heightMm: totalH,
    totalThicknessMm: Math.round((baseDepth + reliefHeight) * 100) / 100,
    signCount: laserSvg.signCount,
    dotCount: laserSvg.signCount,
    triangleCount: totalTriangles,
    estimatedWeightGrams: Math.round(estimatedWeightGrams * 10) / 10,
    estimatedPrintTimeMinutes,
    stlBuffer,
    multiPartZipBuffer,
    baseFilename,
  };
}
