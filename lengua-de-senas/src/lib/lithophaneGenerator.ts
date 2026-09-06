import * as THREE from 'three';

export interface LithophaneConfig {
  widthMm: number; // e.g. 100 mm
  heightMm: number; // e.g. 100 mm
  minThicknessMm: number; // e.g. 0.8 mm (pure white)
  maxThicknessMm: number; // e.g. 2.4 mm (pure black)
  frameWidthMm: number; // e.g. 3.5 mm border
  frameThicknessMm: number; // e.g. 3.0 mm border thickness
  hasStandBase: boolean; // Add a flat standing base at bottom
  invert: boolean; // Invert colors
  resolution: number; // grid points along longer axis (e.g. 140)
}

export const DEFAULT_LITHOPHANE_CONFIG: LithophaneConfig = {
  widthMm: 100,
  heightMm: 100,
  minThicknessMm: 0.8,
  maxThicknessMm: 2.4,
  frameWidthMm: 3.5,
  frameThicknessMm: 3.0,
  hasStandBase: false,
  invert: false,
  resolution: 140
};

export interface LithophaneResult {
  stlBuffer: ArrayBuffer;
  geometry: THREE.BufferGeometry;
  triangleCount: number;
  widthMm: number;
  heightMm: number;
  depthMm: number;
  estimatedWeightGrams: number;
  estimatedPrintTimeMinutes: number;
}

/**
 * Mapea una imagen HTML en una grilla de alturas Z(x, y).
 */
export async function processImageToHeightGrid(
  imageSource: string | HTMLImageElement,
  config: LithophaneConfig
): Promise<{ grid: Float32Array; nx: number; ny: number }> {
  let img: HTMLImageElement;

  if (typeof imageSource === 'string') {
    img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.crossOrigin = 'anonymous';
      el.onload = () => resolve(el);
      el.onerror = (err) => reject(err);
      el.src = imageSource;
    });
  } else {
    img = imageSource;
  }

  // Dimensiones de la grilla proporcionales al aspecto
  const aspect = config.widthMm / config.heightMm;
  let nx: number;
  let ny: number;

  if (aspect >= 1) {
    nx = config.resolution;
    ny = Math.max(20, Math.round(config.resolution / aspect));
  } else {
    ny = config.resolution;
    nx = Math.max(20, Math.round(config.resolution * aspect));
  }

  const canvas = document.createElement('canvas');
  canvas.width = nx;
  canvas.height = ny;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) throw new Error('No se pudo inicializar canvas 2D');

  // Dibujar imagen escalada
  ctx.drawImage(img, 0, 0, nx, ny);
  const imgData = ctx.getImageData(0, 0, nx, ny).data;

  const grid = new Float32Array(nx * ny);

  const halfW = config.widthMm / 2;
  const halfH = config.heightMm / 2;
  const frameW = config.frameWidthMm;

  for (let j = 0; j < ny; j++) {
    // Coordenada Y física (de arriba hacia abajo en la imagen, mapeada a +Y / -Y)
    const yNorm = j / (ny - 1);
    const py = halfH - yNorm * config.heightMm;

    for (let i = 0; i < nx; i++) {
      const xNorm = i / (nx - 1);
      const px = -halfW + xNorm * config.widthMm;

      const idx = (j * nx + i) * 4;
      const r = imgData[idx];
      const g = imgData[idx + 1];
      const b = imgData[idx + 2];

      // Luminancia estándar (0 = negro, 1 = blanco)
      let lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
      if (config.invert) {
        lum = 1 - lum;
      }

      // Zona de marco perimetral
      const isFrame =
        Math.abs(px) >= halfW - frameW ||
        Math.abs(py) >= halfH - frameW;

      let z: number;
      if (isFrame) {
        // Marco sólido
        z = config.frameThicknessMm;
      } else {
        // Altura de la litofanía:
        // Blanco (lum=1) -> grosor mínimo (deja pasar la luz)
        // Negro (lum=0) -> grosor máximo (bloquea la luz)
        z = config.minThicknessMm + (1 - lum) * (config.maxThicknessMm - config.minThicknessMm);
      }

      // Pie de apoyo inferior si está activado
      if (config.hasStandBase && j >= ny - Math.max(3, Math.floor(ny * 0.08))) {
        z = Math.max(z, config.frameThicknessMm + 6); // pestaña de 9mm para apoyo
      }

      grid[j * nx + i] = z;
    }
  }

  return { grid, nx, ny };
}

/**
 * Construye la malla sólida 3D cerrada (Manifold) y genera el archivo STL Binario y Three.js BufferGeometry.
 */
export async function generateLithophane3D(
  imageSource: string | HTMLImageElement,
  config: LithophaneConfig
): Promise<LithophaneResult> {
  const { grid, nx, ny } = await processImageToHeightGrid(imageSource, config);

  const halfW = config.widthMm / 2;
  const halfH = config.heightMm / 2;

  // Calculamos los triángulos:
  // Frontal: (nx-1) * (ny-1) * 2
  // Trasera plana: (nx-1) * (ny-1) * 2
  // 4 Paredes laterales:
  // Superior: (nx-1) * 2
  // Inferior: (nx-1) * 2
  // Izquierda: (ny-1) * 2
  // Derecha: (ny-1) * 2
  const quadFront = (nx - 1) * (ny - 1);
  const quadBack = quadFront;
  const quadWalls = (nx - 1) * 2 + (ny - 1) * 2;
  const totalTriangles = (quadFront + quadBack + quadWalls) * 2;

  // 1. Buffer STL Binario (84 bytes cabecera + 50 bytes por triángulo)
  const stlBufferSize = 84 + totalTriangles * 50;
  const stlBuffer = new ArrayBuffer(stlBufferSize);
  const view = new DataView(stlBuffer);

  // Cabecera de 80 bytes
  const headerStr = 'MakerBox UTalca - Litofania 3D Solid Model (100% Manifold)';
  for (let i = 0; i < 80; i++) {
    view.setUint8(i, i < headerStr.length ? headerStr.charCodeAt(i) : 0);
  }
  // Cantidad de triángulos (Uint32 en byte 80)
  view.setUint32(80, totalTriangles, true);

  // Arreglos para Three.js BufferGeometry
  const positions = new Float32Array(totalTriangles * 9);
  const normals = new Float32Array(totalTriangles * 9);
  const uvs = new Float32Array(totalTriangles * 6);

  let stlByteOffset = 84;
  let geomIndex = 0;
  let uvIndex = 0;

  function addTriangle(
    p1: [number, number, number],
    p2: [number, number, number],
    p3: [number, number, number]
  ) {
    // Normal del triángulo (Cross product: (p2 - p1) x (p3 - p1))
    const ax = p2[0] - p1[0], ay = p2[1] - p1[1], az = p2[2] - p1[2];
    const bx = p3[0] - p1[0], by = p3[1] - p1[1], bz = p3[2] - p1[2];
    let nx_ = ay * bz - az * by;
    let ny_ = az * bx - ax * bz;
    let nz_ = ax * by - ay * bx;
    const len = Math.hypot(nx_, ny_, nz_) || 1;
    nx_ /= len;
    ny_ /= len;
    nz_ /= len;

    // Escribir en STL DataView
    view.setFloat32(stlByteOffset, nx_, true);
    view.setFloat32(stlByteOffset + 4, ny_, true);
    view.setFloat32(stlByteOffset + 8, nz_, true);

    view.setFloat32(stlByteOffset + 12, p1[0], true);
    view.setFloat32(stlByteOffset + 16, p1[1], true);
    view.setFloat32(stlByteOffset + 20, p1[2], true);

    view.setFloat32(stlByteOffset + 24, p2[0], true);
    view.setFloat32(stlByteOffset + 28, p2[1], true);
    view.setFloat32(stlByteOffset + 32, p2[2], true);

    view.setFloat32(stlByteOffset + 36, p3[0], true);
    view.setFloat32(stlByteOffset + 40, p3[1], true);
    view.setFloat32(stlByteOffset + 44, p3[2], true);

    view.setUint16(stlByteOffset + 48, 0, true); // attribute byte count
    stlByteOffset += 50;

    // Escribir en Three.js arrays
    positions[geomIndex] = p1[0];
    positions[geomIndex + 1] = p1[1];
    positions[geomIndex + 2] = p1[2];
    normals[geomIndex] = nx_;
    normals[geomIndex + 1] = ny_;
    normals[geomIndex + 2] = nz_;

    positions[geomIndex + 3] = p2[0];
    positions[geomIndex + 4] = p2[1];
    positions[geomIndex + 5] = p2[2];
    normals[geomIndex + 3] = nx_;
    normals[geomIndex + 4] = ny_;
    normals[geomIndex + 5] = nz_;

    positions[geomIndex + 6] = p3[0];
    positions[geomIndex + 7] = p3[1];
    positions[geomIndex + 8] = p3[2];
    normals[geomIndex + 6] = nx_;
    normals[geomIndex + 7] = ny_;
    normals[geomIndex + 8] = nz_;

    // UVs normalizados [0, 1] en el plano XY
    uvs[uvIndex] = (p1[0] + halfW) / config.widthMm;
    uvs[uvIndex + 1] = (p1[1] + halfH) / config.heightMm;
    uvs[uvIndex + 2] = (p2[0] + halfW) / config.widthMm;
    uvs[uvIndex + 3] = (p2[1] + halfH) / config.heightMm;
    uvs[uvIndex + 4] = (p3[0] + halfW) / config.widthMm;
    uvs[uvIndex + 5] = (p3[1] + halfH) / config.heightMm;

    geomIndex += 9;
    uvIndex += 6;
  }

  // Funciones de conveniencia para obtener punto frontal y punto trasero plano
  function getFrontVertex(i: number, j: number): [number, number, number] {
    const x = -halfW + (i / (nx - 1)) * config.widthMm;
    const y = halfH - (j / (ny - 1)) * config.heightMm;
    const z = grid[j * nx + i];
    return [x, y, z];
  }

  function getBackVertex(i: number, j: number): [number, number, number] {
    const x = -halfW + (i / (nx - 1)) * config.widthMm;
    const y = halfH - (j / (ny - 1)) * config.heightMm;
    return [x, y, 0];
  }

  // A. Cara frontal (Relieve de imagen)
  for (let j = 0; j < ny - 1; j++) {
    for (let i = 0; i < nx - 1; i++) {
      const v00 = getFrontVertex(i, j);
      const v10 = getFrontVertex(i + 1, j);
      const v01 = getFrontVertex(i, j + 1);
      const v11 = getFrontVertex(i + 1, j + 1);

      // Triángulo 1 (v00 -> v10 -> v01)
      addTriangle(v00, v10, v01);
      // Triángulo 2 (v10 -> v11 -> v01)
      addTriangle(v10, v11, v01);
    }
  }

  // B. Cara trasera (Plano liso Z = 0 con normales hacia -Z)
  for (let j = 0; j < ny - 1; j++) {
    for (let i = 0; i < nx - 1; i++) {
      const b00 = getBackVertex(i, j);
      const b10 = getBackVertex(i + 1, j);
      const b01 = getBackVertex(i, j + 1);
      const b11 = getBackVertex(i + 1, j + 1);

      // Triángulo 1 invertido para normal hacia afuera (-Z)
      addTriangle(b00, b01, b10);
      // Triángulo 2 invertido
      addTriangle(b10, b01, b11);
    }
  }

  // C. Paredes laterales (Cierran el sólido herméticamente)
  // 1. Pared superior (j = 0)
  for (let i = 0; i < nx - 1; i++) {
    const f0 = getFrontVertex(i, 0);
    const f1 = getFrontVertex(i + 1, 0);
    const b0 = getBackVertex(i, 0);
    const b1 = getBackVertex(i + 1, 0);

    addTriangle(f0, b0, f1);
    addTriangle(f1, b0, b1);
  }

  // 2. Pared inferior (j = ny - 1)
  for (let i = 0; i < nx - 1; i++) {
    const f0 = getFrontVertex(i, ny - 1);
    const f1 = getFrontVertex(i + 1, ny - 1);
    const b0 = getBackVertex(i, ny - 1);
    const b1 = getBackVertex(i + 1, ny - 1);

    addTriangle(f0, f1, b0);
    addTriangle(f1, b1, b0);
  }

  // 3. Pared izquierda (i = 0)
  for (let j = 0; j < ny - 1; j++) {
    const f0 = getFrontVertex(0, j);
    const f1 = getFrontVertex(0, j + 1);
    const b0 = getBackVertex(0, j);
    const b1 = getBackVertex(0, j + 1);

    addTriangle(f0, f1, b0);
    addTriangle(f1, b1, b0);
  }

  // 4. Pared derecha (i = nx - 1)
  for (let j = 0; j < ny - 1; j++) {
    const f0 = getFrontVertex(nx - 1, j);
    const f1 = getFrontVertex(nx - 1, j + 1);
    const b0 = getBackVertex(nx - 1, j);
    const b1 = getBackVertex(nx - 1, j + 1);

    addTriangle(f0, b0, f1);
    addTriangle(f1, b0, b1);
  }

  // Three.js BufferGeometry
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('normal', new THREE.BufferAttribute(normals, 3));
  geometry.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));

  // Estimaciones físicas de impresión 3D
  // Volumen aprox = W * H * EspesorMedio (en cm3)
  const avgThicknessMm = (config.minThicknessMm + config.maxThicknessMm) / 2;
  const volumeCm3 = (config.widthMm / 10) * (config.heightMm / 10) * (avgThicknessMm / 10);
  const plaDensityGramsPerCm3 = 1.24;
  const estimatedWeightGrams = Math.round(volumeCm3 * plaDensityGramsPerCm3);
  // Velocidad típica a 0.16mm de capa: aprox 1 gramo cada 4-5 minutos
  const estimatedPrintTimeMinutes = Math.round(estimatedWeightGrams * 4.5);

  return {
    stlBuffer,
    geometry,
    triangleCount: totalTriangles,
    widthMm: config.widthMm,
    heightMm: config.heightMm,
    depthMm: Math.max(config.maxThicknessMm, config.frameThicknessMm),
    estimatedWeightGrams,
    estimatedPrintTimeMinutes
  };
}

/**
 * Descarga el archivo STL binario en el navegador.
 */
export function downloadStlFile(buffer: ArrayBuffer, filename: string) {
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
