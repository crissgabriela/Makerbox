/**
 * Generador paramétrico 3D (.STL) de Discos de Contrapeso con Ranura en PLA
 * para equilibrar el Centro de Gravedad (CG) en la punta de la nariz del planeador de balsa.
 *
 * Diseño mecánico para impresión FDM sin soportes:
 * - El disco se imprime acostado plano sobre la cama (Z = 0 a Z = thicknessMm).
 * - Posee una ranura central calibrada (ancho = slotThicknessMm, ej. 2.95 mm)
 *   con chaflán de entrada para encajar a presión suave en la nariz de balsa de 3 mm.
 */

type Vec2 = [number, number];
type Vec3 = [number, number, number];

export interface SlottedDiscSpec {
  id: string;
  label: string;
  diameterMm: number;
  thicknessMm: number;
  slotWidthMm: number;
  slotDepthMm: number;
  massGrams: number;
}

const PLA_DENSITY_G_CM3 = 1.24;

/**
 * Calcula la masa estimada en gramos de un disco ranurado impreso en PLA sólido (relleno ~100%).
 */
export function estimateSlottedDiscMassGrams(
  diameterMm: number,
  thicknessMm: number,
  slotWidthMm: number,
  slotDepthMm: number
): number {
  const radius = diameterMm / 2;
  const circleAreaMm2 = Math.PI * radius * radius;
  const slotAreaMm2 = slotWidthMm * slotDepthMm;
  const netAreaMm2 = Math.max(20, circleAreaMm2 - slotAreaMm2);
  const volumeCm3 = (netAreaMm2 * thicknessMm) / 1000;
  return Number((volumeCm3 * PLA_DENSITY_G_CM3).toFixed(1));
}

/**
 * Devuelve las especificaciones del Kit de 3 Discos Graduados (Liviano, Medio, Pesado)
 * y del Disco Personalizado calculado exactamente para el Centro de Gravedad del planeador actual.
 */
export function getGliderNoseWeightsSpec(
  slotThicknessMm: number,
  recommendedWeightGrams: number
): {
  kitDiscs: SlottedDiscSpec[];
  customDisc: SlottedDiscSpec;
} {
  // Ajuste de interferencia suave: igual al espesor de ranura láser (ej. 2.95 mm)
  const slotW = Number(Math.max(2.8, Math.min(3.2, slotThicknessMm)).toFixed(2));

  const kitRaw = [
    { id: 'liviano', label: 'Disco S (Liviano)', diameterMm: 18, thicknessMm: 5.5 },
    { id: 'medio', label: 'Disco M (Medio)', diameterMm: 22, thicknessMm: 7.0 },
    { id: 'pesado', label: 'Disco L (Pesado)', diameterMm: 26, thicknessMm: 8.5 },
  ];

  const kitDiscs: SlottedDiscSpec[] = kitRaw.map((d) => {
    const slotDepthMm = Number((d.diameterMm * 0.62).toFixed(1));
    return {
      id: d.id,
      label: d.label,
      diameterMm: d.diameterMm,
      thicknessMm: d.thicknessMm,
      slotWidthMm: slotW,
      slotDepthMm,
      massGrams: estimateSlottedDiscMassGrams(
        d.diameterMm,
        d.thicknessMm,
        slotW,
        slotDepthMm
      ),
    };
  });

  // Calcular un disco personalizado cuya masa coincida con recommendedWeightGrams
  const targetG = Math.max(1.2, Math.min(7.5, recommendedWeightGrams || 3.5));
  const customDiameterMm =
    targetG <= 2.2 ? 19 : targetG <= 3.8 ? 23 : 26;
  const customSlotDepthMm = Number((customDiameterMm * 0.62).toFixed(1));
  const netAreaMm2 =
    Math.PI * (customDiameterMm / 2) * (customDiameterMm / 2) -
    slotW * customSlotDepthMm;
  const requiredVolumeMm3 = (targetG / PLA_DENSITY_G_CM3) * 1000;
  const customThicknessMm = Number(
    Math.max(4.0, Math.min(11.0, requiredVolumeMm3 / netAreaMm2)).toFixed(1)
  );

  const customDisc: SlottedDiscSpec = {
    id: 'exacto',
    label: 'Disco Calculado CG',
    diameterMm: customDiameterMm,
    thicknessMm: customThicknessMm,
    slotWidthMm: slotW,
    slotDepthMm: customSlotDepthMm,
    massGrams: estimateSlottedDiscMassGrams(
      customDiameterMm,
      customThicknessMm,
      slotW,
      customSlotDepthMm
    ),
  };

  return { kitDiscs, customDisc };
}

function cross2D(o: Vec2, a: Vec2, b: Vec2): number {
  return (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
}

function pointInTriangle2D(p: Vec2, a: Vec2, b: Vec2, c: Vec2): boolean {
  const c1 = cross2D(a, b, p);
  const c2 = cross2D(b, c, p);
  const c3 = cross2D(c, a, p);
  return c1 >= -1e-7 && c2 >= -1e-7 && c3 >= -1e-7;
}

/**
 * Triangulación por recorte de orejas (Ear-Clipping) para un polígono simple 2D en sentido antihorario (CCW).
 */
function triangulateSimplePolygonCCW(poly: Vec2[]): [number, number, number][] {
  const n = poly.length;
  if (n < 3) return [];

  const indices = Array.from({ length: n }, (_, i) => i);
  const triangles: [number, number, number][] = [];
  let guard = 0;

  while (indices.length > 3 && guard < n * n + 20) {
    guard++;
    let earFound = false;
    const m = indices.length;

    for (let i = 0; i < m; i++) {
      const iPrev = indices[(i - 1 + m) % m];
      const iCurr = indices[i];
      const iNext = indices[(i + 1) % m];

      const a = poly[iPrev];
      const b = poly[iCurr];
      const c = poly[iNext];

      // Verificar esquina convexa en sentido CCW
      if (cross2D(a, b, c) <= 1e-6) continue;

      let hasPointInside = false;
      for (let j = 0; j < m; j++) {
        const idx = indices[j];
        if (idx === iPrev || idx === iCurr || idx === iNext) continue;
        if (pointInTriangle2D(poly[idx], a, b, c)) {
          hasPointInside = true;
          break;
        }
      }

      if (!hasPointInside) {
        triangles.push([iPrev, iCurr, iNext]);
        indices.splice(i, 1);
        earFound = true;
        break;
      }
    }

    if (!earFound) {
      break;
    }
  }

  if (indices.length === 3) {
    triangles.push([indices[0], indices[1], indices[2]]);
  }

  return triangles;
}

/**
 * Construye el polígono 2D en sentido antihorario (CCW) de un disco circular con ranura radial
 * y chaflán de entrada para facilitar la inserción en la nariz de madera de balsa de 3 mm.
 */
function buildSlottedDiscPolygonCCW(
  centerX: number,
  centerY: number,
  diameterMm: number,
  slotWidthMm: number,
  slotDepthMm: number
): Vec2[] {
  const R = diameterMm / 2;
  const halfSlot = slotWidthMm / 2;
  const chamfer = 0.65;
  const halfMouth = Math.min(R * 0.45, halfSlot + chamfer);

  const theta0 = Math.asin(halfMouth / R);
  const xMouth = centerX + Math.sqrt(Math.max(1, R * R - halfMouth * halfMouth));
  const xChamferIn = xMouth - chamfer * 1.15;
  const xSlotBack = centerX + R - slotDepthMm;

  const poly: Vec2[] = [];
  const arcSteps = 64;
  const totalAngle = 2 * Math.PI - 2 * theta0;

  // 1. Arco circular exterior en sentido antihorario desde +theta0 hasta (2*PI - theta0)
  for (let i = 0; i <= arcSteps; i++) {
    const theta = theta0 + (i / arcSteps) * totalAngle;
    poly.push([
      centerX + R * Math.cos(theta),
      centerY + R * Math.sin(theta),
    ]);
  }

  // 2. Chaflán inferior de entrada -> fondo de la ranura -> chaflán superior de entrada
  poly.push([xChamferIn, centerY - halfSlot]);
  poly.push([xSlotBack, centerY - halfSlot]);
  poly.push([xSlotBack, centerY + halfSlot]);
  poly.push([xChamferIn, centerY + halfSlot]);

  return poly;
}

function computeNormal(a: Vec3, b: Vec3, c: Vec3): Vec3 {
  const ux = b[0] - a[0];
  const uy = b[1] - a[1];
  const uz = b[2] - a[2];
  const vx = c[0] - a[0];
  const vy = c[1] - a[1];
  const vz = c[2] - a[2];
  const nx = uy * vz - uz * vy;
  const ny = uz * vx - ux * vz;
  const nz = ux * vy - uy * vx;
  const len = Math.hypot(nx, ny, nz) || 1;
  return [nx / len, ny / len, nz / len];
}

function appendFacet(lines: string[], a: Vec3, b: Vec3, c: Vec3): void {
  const [nx, ny, nz] = computeNormal(a, b, c);
  lines.push(`  facet normal ${nx.toFixed(6)} ${ny.toFixed(6)} ${nz.toFixed(6)}`);
  lines.push(`    outer loop`);
  lines.push(`      vertex ${a[0].toFixed(4)} ${a[1].toFixed(4)} ${a[2].toFixed(4)}`);
  lines.push(`      vertex ${b[0].toFixed(4)} ${b[1].toFixed(4)} ${b[2].toFixed(4)}`);
  lines.push(`      vertex ${c[0].toFixed(4)} ${c[1].toFixed(4)} ${c[2].toFixed(4)}`);
  lines.push(`    endloop`);
  lines.push(`  endfacet`);
}

function appendExtrudedSlottedDisc(
  lines: string[],
  centerX: number,
  centerY: number,
  spec: SlottedDiscSpec
): void {
  const poly = buildSlottedDiscPolygonCCW(
    centerX,
    centerY,
    spec.diameterMm,
    spec.slotWidthMm,
    spec.slotDepthMm
  );
  const tris = triangulateSimplePolygonCCW(poly);
  const H = spec.thicknessMm;

  // Cara inferior (Z = 0, normal hacia -Z) y cara superior (Z = H, normal hacia +Z)
  for (const [i0, i1, i2] of tris) {
    const p0 = poly[i0];
    const p1 = poly[i1];
    const p2 = poly[i2];

    appendFacet(
      lines,
      [p0[0], p0[1], 0],
      [p2[0], p2[1], 0],
      [p1[0], p1[1], 0]
    );
    appendFacet(
      lines,
      [p0[0], p0[1], H],
      [p1[0], p1[1], H],
      [p2[0], p2[1], H]
    );
  }

  // Paredes perimetrales verticales (Z = 0 a Z = H)
  const n = poly.length;
  for (let i = 0; i < n; i++) {
    const a = poly[i];
    const b = poly[(i + 1) % n];

    const a0: Vec3 = [a[0], a[1], 0];
    const b0: Vec3 = [b[0], b[1], 0];
    const bH: Vec3 = [b[0], b[1], H];
    const aH: Vec3 = [a[0], a[1], H];

    appendFacet(lines, a0, b0, bH);
    appendFacet(lines, a0, bH, aH);
  }
}

/**
 * Genera el archivo ASCII .STL listo para laminar en impresora 3D:
 * - mode === 'kit3': Incluye los 3 discos graduados (Liviano, Medio, Pesado) alineados en la cama.
 * - mode === 'custom': Incluye únicamente el disco calculado para el Centro de Gravedad actual.
 */
export function generateGliderNoseWeightsStl(
  slotThicknessMm: number,
  recommendedWeightGrams: number,
  mode: 'kit3' | 'custom' = 'kit3'
): string {
  const { kitDiscs, customDisc } = getGliderNoseWeightsSpec(
    slotThicknessMm,
    recommendedWeightGrams
  );

  const lines: string[] = [];
  const solidName =
    mode === 'kit3'
      ? 'MakerBox_Taller2_Kit_3_Pesos_Nariz_PLA'
      : 'MakerBox_Taller2_Peso_Nariz_Calculado_PLA';

  lines.push(`solid ${solidName}`);

  if (mode === 'custom') {
    appendExtrudedSlottedDisc(lines, 0, 0, customDisc);
  } else {
    let cursorX = 0;
    for (let i = 0; i < kitDiscs.length; i++) {
      const disc = kitDiscs[i];
      if (i > 0) {
        cursorX += kitDiscs[i - 1].diameterMm / 2 + disc.diameterMm / 2 + 5;
      }
      appendExtrudedSlottedDisc(lines, cursorX, 0, disc);
    }
  }

  lines.push(`endsolid ${solidName}`);
  return lines.join('\n');
}
