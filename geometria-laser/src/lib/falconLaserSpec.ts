/**
 * Especificaciones técnicas, capas y utilidades geométricas para corte y grabado láser
 * Máquina objetivo: Creality CR-Laser Falcon 2 10W (Área útil: 400 × 415 mm)
 * Material principal: Madera MDF 3 mm
 * Evento: Feria Científica · Liceo Bicentenario de Niñas de Maipú · MakerBox UTalca
 */

export const FALCON_BED_WIDTH_MM = 400;
export const FALCON_BED_HEIGHT_MM = 415;
export const MDF_THICKNESS_MM = 3;

export const LASER_COLORS = {
  CUT: '#FF0000',     // Rojo: Corte pasante MDF 3 mm
  SCORE: '#0000FF',   // Azul: Marcado lineal rápido (escala, ejes, apotemas)
  ENGRAVE: '#000000', // Negro: Grabado de relleno (textos, números, Braille, sellos)
} as const;

export interface FalconPresetParam {
  layerName: string;
  hex: string;
  mode: string;
  speedMmMin: string;
  powerPercent: string;
  passes: string;
  notes: string;
}

export const FALCON_10W_MDF3MM_PARAMS: FalconPresetParam[] = [
  {
    layerName: 'C00 · Grabado Relleno (Negro)',
    hex: '#000000',
    mode: 'Fill (Relleno)',
    speedMmMin: '3500 mm/min',
    powerPercent: '45%',
    passes: '1 pasada',
    notes: 'Intervalo de línea 0.10 mm. Ejecutar SIEMPRE en primer lugar.',
  },
  {
    layerName: 'C01 · Marcado Vectorial (Azul)',
    hex: '#0000FF',
    mode: 'Line (Trazo fino)',
    speedMmMin: '3000 mm/min',
    powerPercent: '40%',
    passes: '1 pasada',
    notes: 'Ideal para graduaciones de reglas, transportadores, apotemas y guías.',
  },
  {
    layerName: 'C02 · Corte Pasante MDF 3mm (Rojo)',
    hex: '#FF0000',
    mode: 'Line (Corte)',
    speedMmMin: '400 mm/min (o 700 mm/min × 2)',
    powerPercent: '95% – 100%',
    passes: '1 a 2 pasadas',
    notes: 'Usar Air Assist activo + cama panal de abeja. Verificar unidades en mm/min.',
  },
];

export interface LaserSvgBuildInput {
  widthMm: number;
  heightMm: number;
  title: string;
  description: string;
  engravePathsSvg?: string;
  scorePathsSvg?: string;
  innerCutPathsSvg?: string;
  outerCutPathsSvg?: string;
}

/**
 * Empaqueta las capas vectoriales en un documento SVG 1.1 con escala 1:1 exacta en milímetros (mm)
 * Orden físico seguro para LightBurn / Creality Falcon Design Space:
 * 1° Grabado Relleno (#000000) -> 2° Marcado Rápido (#0000FF) -> 3° Cortes Internos (#FF0000) -> 4° Cortes Externos (#FF0000)
 */
export function buildLaserSvgDocument({
  widthMm,
  heightMm,
  title,
  description,
  engravePathsSvg = '',
  scorePathsSvg = '',
  innerCutPathsSvg = '',
  outerCutPathsSvg = '',
}: LaserSvgBuildInput): string {
  const w = Number(widthMm.toFixed(2));
  const h = Number(heightMm.toFixed(2));

  return `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<svg
  xmlns="http://www.w3.org/2000/svg"
  width="${w}mm"
  height="${h}mm"
  viewBox="0 0 ${w} ${h}"
  version="1.1">
  <title>${escapeXml(title)}</title>
  <desc>${escapeXml(description)} | Máquina: CR-Laser Falcon 2 10W (400x415mm) | Material: MDF 3mm | Negro (#000000)=Grabado, Azul (#0000FF)=Marcado, Rojo (#FF0000)=Corte.</desc>

  <!-- 1. CAPA DE GRABADO RELLENO (#000000) -->
  <g id="CAPA_01_GRABADO_NEGRO">
${engravePathsSvg}
  </g>

  <!-- 2. CAPA DE MARCADO LINEAL RÁPIDO (#0000FF) -->
  <g id="CAPA_02_MARCADO_AZUL" fill="none" stroke="${LASER_COLORS.SCORE}" stroke-width="0.18" stroke-linecap="round" stroke-linejoin="round">
${scorePathsSvg}
  </g>

  <!-- 3. CAPA DE CORTES INTERIORES / VENTANAS (#FF0000) -->
  <g id="CAPA_03_CORTE_INTERIOR_ROJO" fill="none" stroke="${LASER_COLORS.CUT}" stroke-width="0.18" stroke-linecap="round" stroke-linejoin="round">
${innerCutPathsSvg}
  </g>

  <!-- 4. CAPA DE CORTES EXTERIORES PERIMETRALES (#FF0000) -->
  <g id="CAPA_04_CORTE_EXTERIOR_ROJO" fill="none" stroke="${LASER_COLORS.CUT}" stroke-width="0.18" stroke-linecap="round" stroke-linejoin="round">
${outerCutPathsSvg}
  </g>
</svg>`;
}

export function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Estima el tiempo aproximado de trabajo en una CR-Laser Falcon 2 10W sobre MDF 3 mm
 */
export function estimateFalconJobMinutes(params: {
  cutLengthMm: number;
  scoreLengthMm?: number;
  engraveAreaMm2?: number;
}): number {
  const cutTime = params.cutLengthMm / 400; // ~400 mm/min efectivo en MDF 3mm
  const scoreTime = (params.scoreLengthMm ?? 0) / 2600; // ~2600 mm/min con aceleración
  // Área de grabado: línea cada 0.12mm a ~3000 mm/min efectivos incluyendo retornos
  const engraveScanLength = (params.engraveAreaMm2 ?? 0) / 0.14;
  const engraveTime = engraveScanLength / 2800;
  return Math.max(0.5, Math.round((cutTime + scoreTime + engraveTime + 0.3) * 10) / 10);
}

/**
 * Retrae hacia el interior un polígono convexo o simple (en sentido antihorario o horario)
 * desplazando cada arista paralelamente hacia adentro una distancia `insetMm`.
 * Ideal para compensar tolerancia mecánica de encaje en MDF 3mm (ej. insetMm = tolerance / 2).
 */
export function insetPolygon(points: [number, number][], insetMm: number): [number, number][] {
  if (points.length < 3 || insetMm <= 0) return points;

  // Calcular área con signo para determinar orientación
  let signedArea2 = 0;
  const n = points.length;
  for (let i = 0; i < n; i++) {
    const [x1, y1] = points[i];
    const [x2, y2] = points[(i + 1) % n];
    signedArea2 += x1 * y2 - x2 * y1;
  }
  const orient = signedArea2 >= 0 ? 1 : -1;

  // Cada arista desplazada hacia adentro
  interface Line2D {
    px: number;
    py: number;
    dx: number;
    dy: number;
  }

  const shiftedLines: Line2D[] = [];
  for (let i = 0; i < n; i++) {
    const [x1, y1] = points[i];
    const [x2, y2] = points[(i + 1) % n];
    const vx = x2 - x1;
    const vy = y2 - y1;
    const len = Math.hypot(vx, vy) || 1;
    const dx = vx / len;
    const dy = vy / len;
    // Normal interior según signo del área
    const nx = orient * -dy;
    const ny = orient * dx;
    shiftedLines.push({
      px: x1 + nx * insetMm,
      py: y1 + ny * insetMm,
      dx,
      dy,
    });
  }

  const result: [number, number][] = [];
  for (let i = 0; i < n; i++) {
    const l1 = shiftedLines[(i - 1 + n) % n];
    const l2 = shiftedLines[i];
    const det = l1.dx * l2.dy - l1.dy * l2.dx;
    if (Math.abs(det) < 1e-6) {
      result.push([l2.px, l2.py]);
    } else {
      const rx = l2.px - l1.px;
      const ry = l2.py - l1.py;
      const t = (rx * l2.dy - ry * l2.dx) / det;
      result.push([l1.px + t * l1.dx, l1.py + t * l1.dy]);
    }
  }
  return result;
}

export function polygonToSvgPath(points: [number, number][]): string {
  if (points.length === 0) return '';
  return (
    points
      .map(([x, y], idx) => `${idx === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`)
      .join(' ') + ' Z'
  );
}

export function polygonPerimeterMm(points: [number, number][]): number {
  let sum = 0;
  for (let i = 0; i < points.length; i++) {
    const [x1, y1] = points[i];
    const [x2, y2] = points[(i + 1) % points.length];
    sum += Math.hypot(x2 - x1, y2 - y1);
  }
  return sum;
}

export function downloadLaserSvg(svgContent: string, filename: string): void {
  const blob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename.endsWith('.svg') ? filename : `${filename}.svg`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
