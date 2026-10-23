export interface Point2D {
  x: number;
  y: number;
}

export interface PotraceOptions {
  /** Eliminación de manchas/ruido menores a esta longitud (por defecto 5) */
  turdSize?: number;
  /** Umbral de suavizado de esquinas Potrace (por defecto 0.9) */
  alphaMax?: number;
  /** Tolerancia de simplificación poligonal Douglas-Peucker (por defecto 0.75) */
  optTolerance?: number;
}

export interface TracedVectorResult {
  /** Polígono cerrado exterior en coordenadas en mm */
  outerPolygon: Point2D[];
  /** Atributo d="" del contorno exterior suavizado con curvas Bézier estilo Potrace */
  outerPathD: string;
  /** Polilíneas/contornos internos para grabado láser */
  innerPolylines: Point2D[][];
  /** Atributos d="" de los trazos internos vectorizados con curvas Potrace */
  innerPathsD: string[];
  /** Cantidad total de nodos vectoriales generados */
  totalNodes: number;
  /** Ancho efectivo en mm del dibujo escalado */
  widthMm: number;
  /** Alto efectivo en mm del dibujo escalado */
  heightMm: number;
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
 * Simplificación poligonal Ramer-Douglas-Peucker para limpieza de vectores Potrace
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
 * Algoritmo de Umbralizado Adaptativo (Imagen Integral) + Flood-Fill Exterior + Moore-Neighbor Contour
 * + Trazado Vectorial Potrace a partir de una matriz RGBA de una imagen generada por Gemini o fotografiada.
 */
export function vectorizeRgbaImageWithPotrace(
  rgbaData: Uint8ClampedArray | Uint8Array,
  width: number,
  height: number,
  targetHeightMm: number,
  options: PotraceOptions = {}
): TracedVectorResult {
  const turdSize = options.turdSize ?? 5;
  const alphaMax = options.alphaMax ?? 0.9;
  const optTolerance = options.optTolerance ?? 0.65;

  // 1. Convertir a luminancia y calcular imagen integral para umbral adaptativo (elimina sombras de fotos)
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

  // 2. Binarización adaptativa (1 = tinta negra del dibujo, 0 = fondo blanco)
  const inkMask = new Uint8Array(width * height);
  const winR = Math.max(8, Math.round(Math.min(width, height) * 0.04));
  const marginIgnore = 6; // Ignorar posibles bordes oscuros en los últimos píxeles de una fotografía

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

      // Es tinta si es significativamente más oscuro que su vecindario local
      if (pixelLum < localMean - 24 && pixelLum < 195) {
        inkMask[y * width + x] = 1;
        if (x < minInkX) minInkX = x;
        if (y < minInkY) minInkY = y;
        if (x > maxInkX) maxInkX = x;
        if (y > maxInkY) maxInkY = y;
      }
    }
  }

  // Fallback seguro si la imagen estaba vacía
  if (minInkX >= maxInkX || minInkY >= maxInkY) {
    minInkX = Math.floor(width * 0.15);
    maxInkX = Math.floor(width * 0.85);
    minInkY = Math.floor(height * 0.15);
    maxInkY = Math.floor(height * 0.85);
  }

  // 3. Dilatación morfológica para construir una silueta exterior continua (une bigotes/tentáculos cercanos)
  const dilateRadius = Math.max(5, Math.round(Math.min(width, height) * 0.022));
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

  // 4. Flood-Fill desde los bordes exteriores de la imagen para identificar todo el interior cerrado del dibujo
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

  // Todo píxel con exterior[idx] === 0 forma parte de la silueta sólida de la figura híbrida
  const solidSilhouette = new Uint8Array(width * height);
  for (let i = 0; i < width * height; i++) {
    if (exterior[i] === 0) {
      solidSilhouette[i] = 1;
    }
  }

  // Calcular caja delimitadora de la silueta sólida para escalar proporcionalmente a targetHeightMm
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

  // 5. Seguimiento de contorno de Moore-Neighbor para obtener el polígono exterior cerrado exacto
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

  // 6. Trazado Potrace de todas las líneas internas de tinta negra (inkMask)
  const visited = new Uint8Array(width * height);
  const innerPolylines: Point2D[][] = [];
  const dirs = [
    [1, 0],
    [1, 1],
    [0, 1],
    [-1, 1],
    [-1, 0],
    [-1, -1],
    [0, -1],
    [1, -1],
  ];

  for (let y = silMinY; y <= silMaxY; y++) {
    for (let x = silMinX; x <= silMaxX; x++) {
      const idx = y * width + x;
      if (inkMask[idx] === 1 && !visited[idx]) {
        const chain: Point2D[] = [];
        let cx = x;
        let cy = y;

        while (chain.length < 450) {
          visited[cy * width + cx] = 1;
          // Limpiar radio pequeño de grosor de línea para obtener trazo único central (centerline)
          for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
              const nx = cx + dx;
              const ny = cy + dy;
              if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
                visited[ny * width + nx] = 1;
              }
            }
          }

          chain.push(toMm(cx, cy));

          let found = false;
          // Buscar a distancia 2 o 1 en las 8 direcciones
          for (const step of [2, 1]) {
            for (const [dx, dy] of dirs) {
              const nx = cx + dx * step;
              const ny = cy + dy * step;
              if (nx >= silMinX && nx <= silMaxX && ny >= silMinY && ny <= silMaxY) {
                const nIdx = ny * width + nx;
                if (inkMask[nIdx] === 1 && !visited[nIdx]) {
                  cx = nx;
                  cy = ny;
                  found = true;
                  break;
                }
              }
            }
            if (found) break;
          }

          if (!found) break;
        }

        if (chain.length >= turdSize) {
          const simp = simplifyPolylineRDP(chain, optTolerance * 0.55);
          if (simp.length >= 2) {
            innerPolylines.push(simp);
          }
        }
      }
    }
  }

  const innerPathsD = innerPolylines.map((poly) =>
    polygonToPotraceBezierPath(poly, false, alphaMax)
  );

  const totalNodes =
    outerPolygon.length +
    innerPolylines.reduce((acc, poly) => acc + poly.length, 0);

  return {
    outerPolygon,
    outerPathD,
    innerPolylines,
    innerPathsD,
    totalNodes,
    widthMm: targetWidthMm,
    heightMm: targetHeightMm,
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
  // Encontrar el primer píxel activo desde arriba
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

  // 8 vecinos en sentido horario comenzando desde el oeste
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
  let backtrackDir = 0; // Venimos desde el oeste (-1, 0)
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
          // El nuevo backtrack apunta al vecino anterior al que acabamos de entrar
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
 * Traza un mapa de bits sintético del servidor usando Potrace
 */
export function traceBitmapWithPotrace(
  bitmap: Uint8Array,
  width: number,
  height: number,
  targetWidthMm: number,
  targetHeightMm: number,
  options: PotraceOptions = {}
): TracedVectorResult {
  const rgba = new Uint8Array(width * height * 4);
  for (let i = 0; i < width * height; i++) {
    const isInk = bitmap[i] > 0;
    const val = isInk ? 10 : 255;
    rgba[i * 4 + 0] = val;
    rgba[i * 4 + 1] = val;
    rgba[i * 4 + 2] = val;
    rgba[i * 4 + 3] = 255;
  }
  return vectorizeRgbaImageWithPotrace(
    rgba,
    width,
    height,
    targetHeightMm,
    options
  );
}

/**
 * Rasteriza polilíneas a un bitmap en blanco y negro y genera un Data URL BMP B/N
 */
export function rasterizeLineArtToBitmap(
  outerPolygon: Point2D[],
  innerPolylines: Point2D[][],
  domainWidth: number,
  domainHeight: number,
  rasterWidth = 360,
  rasterHeight = 320
): { bitmap: Uint8Array; rasterDataUrl: string } {
  const bitmap = new Uint8Array(rasterWidth * rasterHeight);

  const drawSegment = (p1: Point2D, p2: Point2D, code: 1 | 2, thickness = 1) => {
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
            bitmap[ny * rasterWidth + nx] = code;
          }
        }
      }
    }
  };

  for (let i = 0; i < outerPolygon.length; i++) {
    const a = outerPolygon[i];
    const b = outerPolygon[(i + 1) % outerPolygon.length];
    drawSegment(a, b, 2, 1);
  }

  for (const poly of innerPolylines) {
    for (let i = 0; i < poly.length - 1; i++) {
      drawSegment(poly[i], poly[i + 1], 1, 1);
    }
  }

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
      const val = isInk ? 20 : 255;
      buf[offset + x * 3 + 0] = val;
      buf[offset + x * 3 + 1] = val;
      buf[offset + x * 3 + 2] = val;
    }
    offset += rowStride;
  }

  const rasterDataUrl = `data:image/bmp;base64,${buf.toString('base64')}`;
  return { bitmap, rasterDataUrl };
}
