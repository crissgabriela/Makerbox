import { EngravingStrokeWeight } from '@/types/zoo';

export interface Point2D {
  x: number;
  y: number;
}

export interface PotraceOptions {
  /** Umbral de suavizado de esquinas Potrace para el contorno exterior (por defecto 0.9) */
  alphaMax?: number;
  /** Tolerancia de simplificación poligonal Douglas-Peucker para el contorno (por defecto 0.65) */
  optTolerance?: number;
}

export interface TracedVectorResult {
  /** Polígono cerrado exterior vectorizado en coordenadas en mm */
  outerPolygon: Point2D[];
  /** Atributo d="" del contorno exterior vectorizado y suavizado con curvas Bézier */
  outerPathD: string;
  /** Cantidad de nodos vectoriales del contorno exterior */
  outerContourNodes: number;
  /** Ancho efectivo en mm del diseño escalado */
  widthMm: number;
  /** Alto efectivo en mm del diseño escalado */
  heightMm: number;
  /** Caja de recorte en píxeles (para alinear 1:1 la imagen de grabado con el contorno vectorizado) */
  cropBoxPx: {
    minX: number;
    minY: number;
    widthPx: number;
    heightPx: number;
  };
  /** Imagen BMP/PNG en base64 limpia y recortada al bounding box para grabado en Creality Falcon 10W */
  engravingImageDataUrl?: string;
}

/**
 * Convierte una lista de vértices en un comando SVG <path> suave
 * utilizando el algoritmo de suavizado de esquinas de Potrace (curvas cúbicas de Bézier).
 */
export function polygonToPotraceBezierPath(
  pts: Point2D[],
  closed = true,
  alphaMax = 1.0
): string {
  if (pts.length === 0) return '';
  if (pts.length === 1) return `M ${pts[0].x.toFixed(2)} ${pts[0].y.toFixed(2)}`;
  if (pts.length === 2) {
    return `M ${pts[0].x.toFixed(2)} ${pts[0].y.toFixed(2)} L ${pts[1].x.toFixed(2)} ${pts[1].y.toFixed(2)}${closed ? ' Z' : ''}`;
  }

  if (!closed) {
    const commands: string[] = [`M ${pts[0].x.toFixed(2)} ${pts[0].y.toFixed(2)}`];
    for (let i = 1; i < pts.length - 1; i++) {
      const p0 = pts[i];
      const p1 = pts[i + 1];
      const midX = (p0.x + p1.x) / 2;
      const midY = (p0.y + p1.y) / 2;
      commands.push(
        `Q ${p0.x.toFixed(2)} ${p0.y.toFixed(2)}, ${midX.toFixed(2)} ${midY.toFixed(2)}`
      );
    }
    const last = pts[pts.length - 1];
    commands.push(`L ${last.x.toFixed(2)} ${last.y.toFixed(2)}`);
    return commands.join(' ');
  }

  const n = pts.length;
  const midpoints: Point2D[] = [];
  for (let i = 0; i < n; i++) {
    const a = pts[i];
    const b = pts[(i + 1) % n];
    midpoints.push({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });
  }

  const commands: string[] = [
    `M ${midpoints[0].x.toFixed(2)} ${midpoints[0].y.toFixed(2)}`,
  ];

  for (let i = 0; i < n; i++) {
    const prevMid = midpoints[i];
    const corner = pts[(i + 1) % n];
    const nextMid = midpoints[(i + 1) % n];

    const v1x = corner.x - prevMid.x;
    const v1y = corner.y - prevMid.y;
    const v2x = nextMid.x - corner.x;
    const v2y = nextMid.y - corner.y;
    const len1 = Math.hypot(v1x, v1y) || 1;
    const len2 = Math.hypot(v2x, v2y) || 1;
    const dot = (v1x * v2x + v1y * v2y) / (len1 * len2);

    const alpha = Math.min(alphaMax, Math.max(0.35, (dot + 1) * 0.42));
    if (dot < -0.65) {
      commands.push(`L ${corner.x.toFixed(2)} ${corner.y.toFixed(2)}`);
      commands.push(`L ${nextMid.x.toFixed(2)} ${nextMid.y.toFixed(2)}`);
    } else {
      const c1x = prevMid.x + alpha * (corner.x - prevMid.x);
      const c1y = prevMid.y + alpha * (corner.y - prevMid.y);
      const c2x = nextMid.x + alpha * (corner.x - nextMid.x);
      const c2y = nextMid.y + alpha * (corner.y - nextMid.y);
      commands.push(
        `C ${c1x.toFixed(2)} ${c1y.toFixed(2)}, ${c2x.toFixed(2)} ${c2y.toFixed(2)}, ${nextMid.x.toFixed(2)} ${nextMid.y.toFixed(2)}`
      );
    }
  }

  commands.push('Z');
  return commands.join(' ');
}

/**
 * Simplificación poligonal Ramer-Douglas-Peucker para limpieza de vectores del contorno exterior
 */
export function simplifyPolylineRDP(points: Point2D[], epsilon: number): Point2D[] {
  if (points.length <= 3) return points;

  let maxDist = 0;
  let index = 0;
  const start = points[0];
  const end = points[points.length - 1];

  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const mag = Math.hypot(dx, dy);

  for (let i = 1; i < points.length - 1; i++) {
    const p = points[i];
    let dist = 0;
    if (mag < 1e-6) {
      dist = Math.hypot(p.x - start.x, p.y - start.y);
    } else {
      dist = Math.abs(dy * p.x - dx * p.y + end.x * start.y - end.y * start.x) / mag;
    }
    if (dist > maxDist) {
      index = i;
      maxDist = dist;
    }
  }

  if (maxDist > epsilon) {
    const left = simplifyPolylineRDP(points.slice(0, index + 1), epsilon);
    const right = simplifyPolylineRDP(points.slice(index), epsilon);
    return left.slice(0, left.length - 1).concat(right);
  }

  return [start, end];
}

/**
 * Extrae y vectoriza ÚNICAMENTE el contorno exterior cerrado de la imagen generada
 * (mediante umbral adaptativo + dilatación morfológica + Flood-Fill exterior + Moore-Neighbor + Potrace),
 * dejando el dibujo interior como imagen raster limpia de alto contraste para grabar en la Creality Falcon 10W.
 */
export function extractOuterContourFromRgba(
  rgbaData: Uint8ClampedArray | Uint8Array,
  width: number,
  height: number,
  targetHeightMm: number,
  options: PotraceOptions = {}
): {
  traced: TracedVectorResult;
  inkMask: Uint8Array;
} {
  const alphaMax = options.alphaMax ?? 0.9;
  const optTolerance = options.optTolerance ?? 0.65;

  // 1. Luminancia e imagen integral para eliminar sombras de fondo y aislar el dibujo en blanco y negro
  const lum = new Float32Array(width * height);
  const integral = new Float64Array((width + 1) * (height + 1));

  for (let y = 0; y < height; y++) {
    let rowSum = 0;
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      const r = rgbaData[i];
      const g = rgbaData[i + 1];
      const b = rgbaData[i + 2];
      const a = rgbaData[i + 3];
      const val = a < 40 ? 255 : 0.299 * r + 0.587 * g + 0.114 * b;
      lum[y * width + x] = val;
      rowSum += val;
      integral[(y + 1) * (width + 1) + (x + 1)] =
        integral[y * (width + 1) + (x + 1)] + rowSum;
    }
  }

  // 2. Binarización adaptativa (1 = trazo negro del dibujo para grabado láser, 0 = fondo blanco)
  const inkMask = new Uint8Array(width * height);
  const winR = Math.max(8, Math.round(Math.min(width, height) * 0.04));
  const marginIgnore = 6;

  let minInkX = width;
  let minInkY = height;
  let maxInkX = 0;
  let maxInkY = 0;

  for (let y = marginIgnore; y < height - marginIgnore; y++) {
    const y0 = Math.max(0, y - winR);
    const y1 = Math.min(height - 1, y + winR);
    for (let x = marginIgnore; x < width - marginIgnore; x++) {
      const x0 = Math.max(0, x - winR);
      const x1 = Math.min(width - 1, x + winR);
      const area = (x1 - x0 + 1) * (y1 - y0 + 1);
      const sum =
        integral[(y1 + 1) * (width + 1) + (x1 + 1)] -
        integral[y0 * (width + 1) + (x1 + 1)] -
        integral[(y1 + 1) * (width + 1) + x0] +
        integral[y0 * (width + 1) + x0];
      const localMean = sum / area;
      const pixelLum = lum[y * width + x];

      if (pixelLum < localMean - 22 && pixelLum < 198) {
        inkMask[y * width + x] = 1;
        if (x < minInkX) minInkX = x;
        if (y < minInkY) minInkY = y;
        if (x > maxInkX) maxInkX = x;
        if (y > maxInkY) maxInkY = y;
      }
    }
  }

  if (minInkX >= maxInkX || minInkY >= maxInkY) {
    minInkX = Math.floor(width * 0.15);
    maxInkX = Math.floor(width * 0.85);
    minInkY = Math.floor(height * 0.15);
    maxInkY = Math.floor(height * 0.85);
  }

  // 3. Dilatación morfológica para crear un margen de corte continuo alrededor de la figura
  const dilateRadius = Math.max(6, Math.round(Math.min(width, height) * 0.024));
  const dilated = new Uint8Array(width * height);
  for (let y = minInkY; y <= maxInkY; y++) {
    for (let x = minInkX; x <= maxInkX; x++) {
      if (inkMask[y * width + x] === 1) {
        for (let dy = -dilateRadius; dy <= dilateRadius; dy++) {
          const ny = y + dy;
          if (ny < 1 || ny >= height - 1) continue;
          for (let dx = -dilateRadius; dx <= dilateRadius; dx++) {
            if (dx * dx + dy * dy <= dilateRadius * dilateRadius) {
              const nx = x + dx;
              if (nx >= 1 && nx < width - 1) {
                dilated[ny * width + nx] = 1;
              }
            }
          }
        }
      }
    }
  }

  // 4. Flood-Fill desde los bordes exteriores para obtener la silueta sólida cerrada
  const exterior = new Uint8Array(width * height);
  const queue = new Int32Array(width * height);
  let qHead = 0;
  let qTail = 0;

  const pushExterior = (x: number, y: number) => {
    const idx = y * width + x;
    if (exterior[idx] === 0 && dilated[idx] === 0) {
      exterior[idx] = 1;
      queue[qTail++] = idx;
    }
  };

  for (let x = 0; x < width; x++) {
    pushExterior(x, 0);
    pushExterior(x, height - 1);
  }
  for (let y = 0; y < height; y++) {
    pushExterior(0, y);
    pushExterior(width - 1, y);
  }

  while (qHead < qTail) {
    const curr = queue[qHead++];
    const cx = curr % width;
    const cy = (curr - cx) / width;
    if (cx > 0) pushExterior(cx - 1, cy);
    if (cx < width - 1) pushExterior(cx + 1, cy);
    if (cy > 0) pushExterior(cx, cy - 1);
    if (cy < height - 1) pushExterior(cx, cy + 1);
  }

  const solidSilhouette = new Uint8Array(width * height);
  for (let i = 0; i < width * height; i++) {
    if (exterior[i] === 0) {
      solidSilhouette[i] = 1;
    }
  }

  let silMinX = width;
  let silMinY = height;
  let silMaxX = 0;
  let silMaxY = 0;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (solidSilhouette[y * width + x] === 1) {
        if (x < silMinX) silMinX = x;
        if (y < silMinY) silMinY = y;
        if (x > silMaxX) silMaxX = x;
        if (y > silMaxY) silMaxY = y;
      }
    }
  }

  const bboxW = Math.max(10, silMaxX - silMinX);
  const bboxH = Math.max(10, silMaxY - silMinY);
  const scaleMmPerPx = targetHeightMm / bboxH;
  const targetWidthMm = Number((bboxW * scaleMmPerPx).toFixed(1));

  const toMm = (px: number, py: number): Point2D => ({
    x: Number(((px - silMinX) * scaleMmPerPx).toFixed(2)),
    y: Number(((py - silMinY) * scaleMmPerPx).toFixed(2)),
  });

  // 5. Vectorizar ÚNICAMENTE el contorno exterior con Moore-Neighbor + Potrace Bézier
  const outerContourPx = traceMooreOuterContour(solidSilhouette, width, height);
  const outerPolygonRaw = outerContourPx.map((p) => toMm(p.x, p.y));
  const outerPolygon =
    outerPolygonRaw.length >= 8
      ? simplifyPolylineRDP(
          [...outerPolygonRaw, outerPolygonRaw[0]],
          optTolerance
        ).slice(0, -1)
      : outerPolygonRaw;

  const outerPathD = polygonToPotraceBezierPath(outerPolygon, true, alphaMax);

  return {
    traced: {
      outerPolygon,
      outerPathD,
      outerContourNodes: outerPolygon.length,
      widthMm: targetWidthMm,
      heightMm: targetHeightMm,
      cropBoxPx: {
        minX: silMinX,
        minY: silMinY,
        widthPx: bboxW,
        heightPx: bboxH,
      },
    },
    inkMask,
  };
}

/**
 * Seguimiento de contorno cerrado (Moore-Neighbor Tracing) sobre una máscara binaria
 */
function traceMooreOuterContour(
  mask: Uint8Array,
  width: number,
  height: number
): Point2D[] {
  let startX = -1;
  let startY = -1;
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      if (mask[y * width + x] === 1) {
        startX = x;
        startY = y;
        break;
      }
    }
    if (startX !== -1) break;
  }

  if (startX === -1) return [];

  const cwDirs = [
    [-1, 0],
    [-1, -1],
    [0, -1],
    [1, -1],
    [1, 0],
    [1, 1],
    [0, 1],
    [-1, 1],
  ];

  const contour: Point2D[] = [{ x: startX, y: startY }];
  let cx = startX;
  let cy = startY;
  let backtrackDir = 0;
  const maxIter = width * height;

  for (let iter = 0; iter < maxIter; iter++) {
    let foundNext = false;
    for (let i = 0; i < 8; i++) {
      const dirIdx = (backtrackDir + i) % 8;
      const nx = cx + cwDirs[dirIdx][0];
      const ny = cy + cwDirs[dirIdx][1];
      if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
        if (mask[ny * width + nx] === 1) {
          cx = nx;
          cy = ny;
          backtrackDir = (dirIdx + 5) % 8;
          foundNext = true;
          break;
        }
      }
    }

    if (!foundNext) break;
    if (cx === startX && cy === startY && contour.length > 10) {
      break;
    }
    if (iter % 2 === 0) {
      contour.push({ x: cx, y: cy });
    }
  }

  return contour;
}

/**
 * Algoritmo de adelgazamiento morfológico (Zhang-Suen Thinning)
 * para reducir el grosor de las líneas del dibujo y acelerar drásticamente
 * el grabado láser en la Creality Falcon 10W sin alterar el contorno exterior ni el corte.
 */
export function thinBinaryMask(
  mask: Uint8Array,
  width: number,
  height: number,
  mode: EngravingStrokeWeight = 'thin'
): Uint8Array {
  if (mode === 'normal') {
    return new Uint8Array(mask);
  }

  const result = new Uint8Array(mask);
  const maxIterations = mode === 'ultra-thin' ? 8 : 2;
  const toDelete: number[] = [];

  for (let iter = 0; iter < maxIterations; iter++) {
    let hasChanged = false;

    // Sub-iteración 1
    toDelete.length = 0;
    for (let y = 1; y < height - 1; y++) {
      const rowOffset = y * width;
      for (let x = 1; x < width - 1; x++) {
        const idx = rowOffset + x;
        if (result[idx] === 0) continue;

        const p2 = result[idx - width];
        const p3 = result[idx - width + 1];
        const p4 = result[idx + 1];
        const p5 = result[idx + width + 1];
        const p6 = result[idx + width];
        const p7 = result[idx + width - 1];
        const p8 = result[idx - 1];
        const p9 = result[idx - width - 1];

        const b = p2 + p3 + p4 + p5 + p6 + p7 + p8 + p9;
        if (b < 2 || b > 6) continue;

        let a = 0;
        if (p2 === 0 && p3 === 1) a++;
        if (p3 === 0 && p4 === 1) a++;
        if (p4 === 0 && p5 === 1) a++;
        if (p5 === 0 && p6 === 1) a++;
        if (p6 === 0 && p7 === 1) a++;
        if (p7 === 0 && p8 === 1) a++;
        if (p8 === 0 && p9 === 1) a++;
        if (p9 === 0 && p2 === 1) a++;

        if (a === 1 && p2 * p4 * p6 === 0 && p4 * p6 * p8 === 0) {
          toDelete.push(idx);
        }
      }
    }

    if (toDelete.length > 0) {
      hasChanged = true;
      for (let i = 0; i < toDelete.length; i++) {
        result[toDelete[i]] = 0;
      }
    }

    // Sub-iteración 2
    toDelete.length = 0;
    for (let y = 1; y < height - 1; y++) {
      const rowOffset = y * width;
      for (let x = 1; x < width - 1; x++) {
        const idx = rowOffset + x;
        if (result[idx] === 0) continue;

        const p2 = result[idx - width];
        const p3 = result[idx - width + 1];
        const p4 = result[idx + 1];
        const p5 = result[idx + width + 1];
        const p6 = result[idx + width];
        const p7 = result[idx + width - 1];
        const p8 = result[idx - 1];
        const p9 = result[idx - width - 1];

        const b = p2 + p3 + p4 + p5 + p6 + p7 + p8 + p9;
        if (b < 2 || b > 6) continue;

        let a = 0;
        if (p2 === 0 && p3 === 1) a++;
        if (p3 === 0 && p4 === 1) a++;
        if (p4 === 0 && p5 === 1) a++;
        if (p5 === 0 && p6 === 1) a++;
        if (p6 === 0 && p7 === 1) a++;
        if (p7 === 0 && p8 === 1) a++;
        if (p8 === 0 && p9 === 1) a++;
        if (p9 === 0 && p2 === 1) a++;

        if (a === 1 && p2 * p4 * p8 === 0 && p2 * p6 * p8 === 0) {
          toDelete.push(idx);
        }
      }
    }

    if (toDelete.length > 0) {
      hasChanged = true;
      for (let i = 0; i < toDelete.length; i++) {
        result[toDelete[i]] = 0;
      }
    }

    if (!hasChanged) break;
  }

  return result;
}

/**
 * En el servidor: genera una imagen raster B/N limpia para grabado en la Creality Falcon 10W
 * y devuelve el contorno exterior vectorizado con Potrace.
 */
export function buildServerRasterAndOuterContour(
  outerPolygon: Point2D[],
  innerPolylines: Point2D[][],
  domainWidth: number,
  domainHeight: number,
  rasterWidth = 420,
  rasterHeight = 380,
  strokeWeight: EngravingStrokeWeight = 'thin'
): TracedVectorResult {
  const rawBitmap = new Uint8Array(rasterWidth * rasterHeight);
  const thickness = strokeWeight === 'normal' ? 1 : 0;

  const drawSegment = (p1: Point2D, p2: Point2D) => {
    const x0 = Math.round((p1.x / domainWidth) * (rasterWidth - 1));
    const y0 = Math.round((p1.y / domainHeight) * (rasterHeight - 1));
    const x1 = Math.round((p2.x / domainWidth) * (rasterWidth - 1));
    const y1 = Math.round((p2.y / domainHeight) * (rasterHeight - 1));

    const steps = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1);
    for (let s = 0; s <= steps; s++) {
      const t = s / steps;
      const cx = Math.round(x0 + (x1 - x0) * t);
      const cy = Math.round(y0 + (y1 - y0) * t);
      for (let dy = -thickness; dy <= thickness; dy++) {
        for (let dx = -thickness; dx <= thickness; dx++) {
          const nx = cx + dx;
          const ny = cy + dy;
          if (nx >= 0 && nx < rasterWidth && ny >= 0 && ny < rasterHeight) {
            rawBitmap[ny * rasterWidth + nx] = 1;
          }
        }
      }
    }
  };

  for (const poly of innerPolylines) {
    for (let i = 0; i < poly.length - 1; i++) {
      drawSegment(poly[i], poly[i + 1]);
    }
  }

  // Adelgazamiento morfológico del trazo de grabado según el modo seleccionado
  const bitmap = thinBinaryMask(rawBitmap, rasterWidth, rasterHeight, strokeWeight);

  // Codificar la imagen de grabado en formato BMP de 24 bits (blanco puro #FFFFFF y trazo negro #000000)
  const rowStride = Math.ceil((rasterWidth * 3) / 4) * 4;
  const pixelDataSize = rowStride * rasterHeight;
  const fileSize = 54 + pixelDataSize;
  const buf = Buffer.alloc(fileSize);

  buf.write('BM', 0);
  buf.writeUInt32LE(fileSize, 2);
  buf.writeUInt32LE(54, 10);
  buf.writeUInt32LE(40, 14);
  buf.writeInt32LE(rasterWidth, 18);
  buf.writeInt32LE(-rasterHeight, 22);
  buf.writeUInt16LE(1, 26);
  buf.writeUInt16LE(24, 28);
  buf.writeUInt32LE(pixelDataSize, 34);

  let offset = 54;
  for (let y = 0; y < rasterHeight; y++) {
    for (let x = 0; x < rasterWidth; x++) {
      const isInk = bitmap[y * rasterWidth + x] > 0;
      const val = isInk ? 0 : 255;
      buf[offset + x * 3 + 0] = val;
      buf[offset + x * 3 + 1] = val;
      buf[offset + x * 3 + 2] = val;
    }
    offset += rowStride;
  }

  const engravingImageDataUrl = `data:image/bmp;base64,${buf.toString('base64')}`;
  const outerPathD = polygonToPotraceBezierPath(outerPolygon, true, 0.88);

  return {
    outerPolygon,
    outerPathD,
    outerContourNodes: outerPolygon.length,
    widthMm: domainWidth,
    heightMm: domainHeight,
    cropBoxPx: {
      minX: 0,
      minY: 0,
      widthPx: rasterWidth,
      heightPx: rasterHeight,
    },
    engravingImageDataUrl,
  };
}
