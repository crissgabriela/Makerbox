export interface Point2D {
  x: number;
  y: number;
}

export interface PotraceOptions {
  /** Eliminación de manchas/ruido menores a esta área en píxeles (por defecto 8) */
  turdSize?: number;
  /** Umbral de suavizado de esquinas Potrace (por defecto 1.0) */
  alphaMax?: number;
  /** Tolerancia de simplificación poligonal Douglas-Peucker (por defecto 1.1) */
  optTolerance?: number;
}

export interface TracedVectorResult {
  /** Polígono cerrado exterior en coordenadas normalizadas (0..width, 0..height) */
  outerPolygon: Point2D[];
  /** Atributo d="" del contorno exterior suavizado con curvas Bézier estilo Potrace */
  outerPathD: string;
  /** Polilíneas/contornos internos cerrados o continuos para grabado láser */
  innerPolylines: Point2D[][];
  /** Atributos d="" de los trazos internos vectorizados con curvas Potrace */
  innerPathsD: string[];
  /** Cantidad total de nodos vectoriales generados */
  totalNodes: number;
}

/**
 * Convierte una lista cerrada de vértices en un comando SVG <path> suave
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
    // Para trazos abiertos continuos, interpolación suave por puntos medios
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

    // Cálculo del ángulo en el vértice para decidir entre esquina viva o curva Potrace
    const v1x = corner.x - prevMid.x;
    const v1y = corner.y - prevMid.y;
    const v2x = nextMid.x - corner.x;
    const v2y = nextMid.y - corner.y;
    const len1 = Math.hypot(v1x, v1y) || 1;
    const len2 = Math.hypot(v2x, v2y) || 1;
    const dot = (v1x * v2x + v1y * v2y) / (len1 * len2);

    // Si es un ángulo muy agudo, preservar esquina definida; si no, curva cúbica suave
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
 * Traza un mapa de bits binario (0 = blanco/fondo, 1 = negro/trazo) usando extracción de contornos
 * tipo Potrace (Marching Squares + RDP + ajuste de curvas Bézier).
 */
export function traceBitmapWithPotrace(
  bitmap: Uint8Array,
  width: number,
  height: number,
  targetWidthMm: number,
  targetHeightMm: number,
  options: PotraceOptions = {}
): TracedVectorResult {
  const turdSize = options.turdSize ?? 8;
  const alphaMax = options.alphaMax ?? 0.85;
  const optTolerance = options.optTolerance ?? 0.9;

  // Extraer el contorno exterior envolvente (silhouette hull) escaneando por filas y columnas
  const leftProfile: Point2D[] = [];
  const rightProfile: Point2D[] = [];

  const stepY = 2;
  for (let y = 0; y < height; y += stepY) {
    let minX = -1;
    let maxX = -1;
    for (let x = 0; x < width; x++) {
      if (bitmap[y * width + x] > 0) {
        if (minX === -1) minX = x;
        maxX = x;
      }
    }
    if (minX !== -1 && maxX !== -1 && maxX - minX >= 2) {
      leftProfile.push({
        x: (minX / width) * targetWidthMm,
        y: (y / height) * targetHeightMm,
      });
      rightProfile.push({
        x: (maxX / width) * targetWidthMm,
        y: (y / height) * targetHeightMm,
      });
    }
  }

  const rawOuter = [...rightProfile, ...leftProfile.reverse()];
  const simplifiedOuter =
    rawOuter.length >= 6
      ? simplifyPolylineRDP([...rawOuter, rawOuter[0]], optTolerance).slice(0, -1)
      : rawOuter;

  const outerPathD = polygonToPotraceBezierPath(simplifiedOuter, true, alphaMax);

  // Extraer trazos internos conectados mediante seguimiento de cadenas de píxeles activos
  const visited = new Uint8Array(width * height);
  const innerPolylines: Point2D[][] = [];

  // Marcar el borde exterior para no duplicarlo como trazo interno
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x;
      if (bitmap[idx] === 2) {
        // 2 = píxel exclusivo del contorno exterior
        visited[idx] = 1;
      }
    }
  }

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

  for (let y = 2; y < height - 2; y += 2) {
    for (let x = 2; x < width - 2; x += 2) {
      const startIdx = y * width + x;
      if (bitmap[startIdx] === 1 && !visited[startIdx]) {
        const chain: Point2D[] = [];
        let cx = x;
        let cy = y;

        while (chain.length < 300) {
          const cIdx = cy * width + cx;
          visited[cIdx] = 1;
          // Marcar vecindad inmediata como visitada para evitar trazos dobles paralelos
          for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
              const nx = cx + dx;
              const ny = cy + dy;
              if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
                visited[ny * width + nx] = 1;
              }
            }
          }

          chain.push({
            x: (cx / width) * targetWidthMm,
            y: (cy / height) * targetHeightMm,
          });

          let foundNext = false;
          for (const [dx, dy] of dirs) {
            const nx = cx + dx * 2;
            const ny = cy + dy * 2;
            if (nx >= 1 && nx < width - 1 && ny >= 1 && ny < height - 1) {
              const nIdx = ny * width + nx;
              if (bitmap[nIdx] === 1 && !visited[nIdx]) {
                cx = nx;
                cy = ny;
                foundNext = true;
                break;
              }
            }
          }
          if (!foundNext) break;
        }

        if (chain.length >= turdSize) {
          const simp = simplifyPolylineRDP(chain, optTolerance * 0.8);
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
    simplifiedOuter.length +
    innerPolylines.reduce((acc, poly) => acc + poly.length, 0);

  return {
    outerPolygon: simplifiedOuter,
    outerPathD,
    innerPolylines,
    innerPathsD,
    totalNodes,
  };
}

/**
 * Rasteriza un conjunto de polilíneas (contorno exterior e interiores) a un bitmap en blanco y negro
 * y genera tanto la matriz de píxeles para Potrace como un Data URL de imagen rasterizada (BMP B/N)
 * para mostrar la salida de la etapa de IA Generativa antes del vectorizado.
 */
export function rasterizeLineArtToBitmap(
  outerPolygon: Point2D[],
  innerPolylines: Point2D[][],
  domainWidth: number,
  domainHeight: number,
  rasterWidth = 320,
  rasterHeight = 260
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

  // Dibujar contorno exterior cerrado
  for (let i = 0; i < outerPolygon.length; i++) {
    const a = outerPolygon[i];
    const b = outerPolygon[(i + 1) % outerPolygon.length];
    drawSegment(a, b, 2, 1);
  }

  // Dibujar trazos internos
  for (const poly of innerPolylines) {
    for (let i = 0; i < poly.length - 1; i++) {
      drawSegment(poly[i], poly[i + 1], 1, 1);
    }
  }

  // Codificar el bitmap como imagen BMP de 24 bits en base64 (blanco puro #FFFFFF de fondo y trazo negro #111827)
  const rowStride = Math.ceil((rasterWidth * 3) / 4) * 4;
  const pixelDataSize = rowStride * rasterHeight;
  const fileSize = 54 + pixelDataSize;
  const buf = Buffer.alloc(fileSize);

  // Cabecera BMP
  buf.write('BM', 0);
  buf.writeUInt32LE(fileSize, 2);
  buf.writeUInt32LE(54, 10);
  // Cabecera DIB (BITMAPINFOHEADER)
  buf.writeUInt32LE(40, 14);
  buf.writeInt32LE(rasterWidth, 18);
  buf.writeInt32LE(-rasterHeight, 22); // Top-down
  buf.writeUInt16LE(1, 26);
  buf.writeUInt16LE(24, 28);
  buf.writeUInt32LE(pixelDataSize, 34);

  let offset = 54;
  for (let y = 0; y < rasterHeight; y++) {
    for (let x = 0; x < rasterWidth; x++) {
      const isInk = bitmap[y * rasterWidth + x] > 0;
      const val = isInk ? 20 : 255;
      buf[offset + x * 3 + 0] = val; // B
      buf[offset + x * 3 + 1] = val; // G
      buf[offset + x * 3 + 2] = val; // R
    }
    offset += rowStride;
  }

  const rasterDataUrl = `data:image/bmp;base64,${buf.toString('base64')}`;
  return { bitmap, rasterDataUrl };
}
